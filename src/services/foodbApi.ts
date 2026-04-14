// FooDB API client (Food Data Base)
// FREE API - No API key required
// Comprehensive food component database
// URL: http://foodb.ca/
// API: http://foodb.ca/api/v1/food/search

import { Product, ProductNutriments } from '../types/product';
import { fetchWithRateLimit } from '../utils/timeoutHelper';
import { logger } from '../utils/logger';

const FOODB_API_BASE = 'http://foodb.ca/api/v1';
const USER_AGENT = 'Rveel/1.0.0';

export interface FooDBResponse {
  foods?: Array<{
    name?: string;
    description?: string;
    food_group?: string;
    nutrients?: Array<{
      name?: string;
      value?: number;
      unit?: string;
    }>;
  }>;
}

/**
 * Fetch nutrition data from FooDB by product name
 * Note: FooDB queries by food name, not barcode
 * Use this in product name queries (like FSANZ)
 */
export async function fetchNutritionFromFooDB(productName: string): Promise<ProductNutriments | null> {
  try {
    // Extract main food name (remove brand, etc.)
    const searchName = productName
      .split(',')[0] // Take first part before comma
      .split(/\s+/)
      .slice(0, 3) // Use first 3 words
      .join(' ');

    const url = `${FOODB_API_BASE}/food/search?q=${encodeURIComponent(searchName)}&limit=1`;
    
    const response = await fetchWithRateLimit(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': USER_AGENT,
      },
    }, 'foodb');

    if (!response.ok) {
      if (response.status === 404) {
        logger.debug(`[FooDB] No nutrition data found for: ${searchName}`);
        return null;
      }
      logger.warn(`[FooDB] API error: ${response.status}`);
      return null;
    }

    const data: FooDBResponse = await response.json();

    if (!data.foods || data.foods.length === 0) {
      return null;
    }

    const food = data.foods[0];
    if (!food.nutrients || food.nutrients.length === 0) {
      return null;
    }

    // Convert FooDB nutrients to ProductNutriments format
    const nutriments: ProductNutriments = {};
    
    food.nutrients.forEach(nutrient => {
      if (!nutrient.name || nutrient.value === undefined) return;

      const nameLower = nutrient.name.toLowerCase();
      const value = nutrient.value;
      const unit = nutrient.unit?.toLowerCase() || '';

      // Map FooDB nutrient names to our format
      if (nameLower.includes('energy') || nameLower.includes('calories')) {
        if (unit.includes('kcal') || unit === 'kcal') {
          nutriments['energy-kcal_100g'] = value;
          nutriments['energy-kj_100g'] = value * 4.184;
        } else if (unit.includes('kj') || unit === 'kj') {
          nutriments['energy-kj_100g'] = value;
          nutriments['energy-kcal_100g'] = value / 4.184;
        }
      } else if (nameLower.includes('protein')) {
        nutriments['proteins_100g'] = unit === 'g' ? value : value / 1000;
      } else if (nameLower.includes('fat') || nameLower.includes('lipid')) {
        if (nameLower.includes('saturated')) {
          nutriments['saturated-fat_100g'] = unit === 'g' ? value : value / 1000;
        } else {
          nutriments['fat_100g'] = unit === 'g' ? value : value / 1000;
        }
      } else if (nameLower.includes('carbohydrate')) {
        nutriments['carbohydrates_100g'] = unit === 'g' ? value : value / 1000;
      } else if (nameLower.includes('sugar')) {
        nutriments['sugars_100g'] = unit === 'g' ? value : value / 1000;
      } else if (nameLower.includes('fiber') || nameLower.includes('fibre')) {
        nutriments['fiber_100g'] = unit === 'g' ? value : value / 1000;
      } else if (nameLower.includes('sodium')) {
        nutriments['sodium_100g'] = unit === 'g' ? value : value / 1000;
        nutriments['salt_100g'] = (unit === 'g' ? value : value / 1000) * 2.54;
      } else if (nameLower.includes('calcium')) {
        nutriments['calcium_100g'] = unit === 'g' ? value : value / 1000;
      } else if (nameLower.includes('iron')) {
        nutriments['iron_100g'] = unit === 'g' ? value : value / 1000;
      } else if (nameLower.includes('vitamin c') || nameLower.includes('ascorbic acid')) {
        nutriments['vitamin-c_100g'] = unit === 'g' ? value : value / 1000;
      }
    });

    if (Object.keys(nutriments).length === 0) {
      return null;
    }

    logger.debug(`[FooDB] Found nutrition data for: ${searchName}`);
    return nutriments;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.debug(`[FooDB] API error for ${productName}:`, errorMessage);
    return null;
  }
}

/**
 * Enhance product with FooDB nutrition data
 * Use this in product name queries (like FSANZ)
 */
export async function enhanceProductWithFooDB(product: Product): Promise<Product> {
  if (!product.product_name) {
    return product;
  }

  // Only enhance if product lacks nutrition data
  if (product.nutriments && Object.keys(product.nutriments).length > 5) {
    return product; // Already has good nutrition data
  }

  const nutriments = await fetchNutritionFromFooDB(product.product_name);

  if (nutriments && Object.keys(nutriments).length > 0) {
    // Merge nutrition data (prefer existing, fill gaps with FooDB)
    const mergedNutriments: ProductNutriments = {
      ...product.nutriments,
      ...nutriments,
    };

    // Prefer existing values over FooDB values
    Object.keys(product.nutriments || {}).forEach(key => {
      if (product.nutriments?.[key as keyof ProductNutriments] !== undefined) {
        mergedNutriments[key as keyof ProductNutriments] = product.nutriments[key as keyof ProductNutriments];
      }
    });

    return {
      ...product,
      nutriments: mergedNutriments,
      source: product.source ? `${product.source}+foodb` : 'foodb',
    };
  }

  return product;
}

