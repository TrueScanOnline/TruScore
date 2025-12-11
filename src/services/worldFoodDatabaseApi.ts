/**
 * World Food Database API Service
 * Free nutrition database (public domain)
 * Various sources aggregated
 */

import { Product, ProductNutriments } from '../types/product';
import { logger } from '../utils/logger';
import { fetchWithRateLimit } from '../utils/timeoutHelper';

// Using FoodData Central (USDA) as primary source for World Food Database
// This is free and provides comprehensive nutrition data
const USDA_FOODDATA_API = 'https://api.nal.usda.gov/fdc/v1/foods/search';

/**
 * Fetch nutrition data from World Food Database (via USDA FoodData Central)
 * This enhances products with comprehensive nutrition information
 */
export async function enhanceProductWithWorldFoodDatabase(
  product: Product,
  productName?: string
): Promise<Product | null> {
  try {
    // Only enhance if we have a product name
    const searchQuery = productName || product.product_name;
    if (!searchQuery || searchQuery.startsWith('Product ')) {
      return null;
    }

    // Search USDA FoodData Central for nutrition data
    const searchUrl = `${USDA_FOODDATA_API}?query=${encodeURIComponent(searchQuery)}&pageSize=5&api_key=DEMO_KEY`;
    
    const response = await fetchWithRateLimit(searchUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    }, 'world_food_database');

    if (!response.ok) {
      logger.debug(`World Food Database API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (!data.foods || data.foods.length === 0) {
      return null;
    }

    // Find best match
    const bestMatch = data.foods[0];
    if (!bestMatch.foodNutrients) {
      return null;
    }

    // Convert USDA nutrients to our format
    const nutriments: ProductNutriments = {};
    
    for (const nutrient of bestMatch.foodNutrients) {
      const nutrientName = nutrient.nutrientName?.toLowerCase() || '';
      const value = nutrient.value || 0;
      
      // Map USDA nutrient names to our format
      if (nutrientName.includes('energy') && nutrientName.includes('kcal')) {
        nutriments['energy-kcal'] = value;
      } else if (nutrientName.includes('energy') && nutrientName.includes('kj')) {
        nutriments['energy-kj'] = value;
      } else if (nutrientName.includes('protein')) {
        nutriments.proteins = value;
      } else if (nutrientName.includes('total lipid') || nutrientName.includes('fat')) {
        nutriments.fat = value;
      } else if (nutrientName.includes('carbohydrate')) {
        nutriments.carbohydrates = value;
      } else if (nutrientName.includes('sugar')) {
        nutriments.sugars = value;
      } else if (nutrientName.includes('fiber')) {
        nutriments.fiber = value;
      } else if (nutrientName.includes('sodium')) {
        nutriments.sodium = value;
      } else if (nutrientName.includes('calcium')) {
        nutriments.calcium = value;
      } else if (nutrientName.includes('iron')) {
        nutriments.iron = value;
      } else if (nutrientName.includes('vitamin c')) {
        nutriments['vitamin-c'] = value;
      }
    }

    // Only return enhanced product if we found meaningful nutrition data
    if (Object.keys(nutriments).length < 3) {
      return null;
    }

    // Merge with existing product
    const enhancedProduct: Product = {
      ...product,
      nutriments: {
        ...product.nutriments,
        ...nutriments, // World Food Database fills gaps
      },
      source: product.source ? `${product.source}+world_food_db` : 'world_food_db',
    };

    return enhancedProduct;
  } catch (error) {
    logger.debug('Error enhancing with World Food Database:', error);
    return null;
  }
}

/**
 * Fetch product from World Food Database (standalone)
 * Note: This is primarily an enhancement service, but can be used standalone
 */
export async function fetchProductFromWorldFoodDatabase(
  barcode: string,
  productName?: string
): Promise<Product | null> {
  // World Food Database doesn't have barcode lookup
  // It's primarily a nutrition enhancement service
  // Return null to indicate it should be used for enhancement only
  return null;
}

