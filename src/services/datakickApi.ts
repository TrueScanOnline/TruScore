// Datakick API client (The Open Product Database)
// FREE API - No API key required
// Community-driven open product database
// URL: https://gtinsearch.org/
// API: https://api.gtinsearch.org/v1/products/{barcode}

import { Product, ProductNutriments } from '../types/product';
import { fetchWithRateLimit } from '../utils/timeoutHelper';
import { logger } from '../utils/logger';

const DATAKICK_API_BASE = 'https://api.gtinsearch.org/v1';
const USER_AGENT = 'TrueScan-FoodScanner/1.0.0';

export interface DatakickResponse {
  gtin?: string;
  name?: string;
  brand?: string;
  description?: string;
  category?: string;
  image?: string;
  images?: string[];
  nutrition?: {
    calories?: number;
    protein?: number;
    fat?: number;
    carbohydrates?: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
  ingredients?: string[];
  barcode?: string;
}

/**
 * Fetch product from Datakick API by barcode
 * FREE - No API key required
 * Community-driven open product database
 */
export async function fetchProductFromDatakick(barcode: string): Promise<Product | null> {
  try {
    const url = `${DATAKICK_API_BASE}/products/${barcode}`;
    
    const response = await fetchWithRateLimit(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': USER_AGENT,
      },
    }, 'datakick');

    if (!response.ok) {
      if (response.status === 404) {
        logger.debug(`[Datakick] Product not found: ${barcode}`);
        return null;
      }
      logger.warn(`[Datakick] API error: ${response.status}`);
      return null;
    }

    const data: DatakickResponse = await response.json();

    if (!data.name && !data.brand) {
      return null;
    }

    // Convert nutrition data to ProductNutriments format
    const nutriments: ProductNutriments = {};
    if (data.nutrition) {
      if (data.nutrition.calories) {
        nutriments['energy-kcal_100g'] = data.nutrition.calories;
        nutriments['energy-kj_100g'] = data.nutrition.calories * 4.184;
      }
      if (data.nutrition.protein) nutriments['proteins_100g'] = data.nutrition.protein;
      if (data.nutrition.fat) nutriments['fat_100g'] = data.nutrition.fat;
      if (data.nutrition.carbohydrates) nutriments['carbohydrates_100g'] = data.nutrition.carbohydrates;
      if (data.nutrition.fiber) nutriments['fiber_100g'] = data.nutrition.fiber;
      if (data.nutrition.sugar) nutriments['sugars_100g'] = data.nutrition.sugar;
      if (data.nutrition.sodium) {
        nutriments['sodium_100g'] = data.nutrition.sodium / 1000; // Convert mg to g
        nutriments['salt_100g'] = data.nutrition.sodium / 1000 * 2.54; // Convert sodium to salt
      }
    }

    // Convert ingredients array to string
    const ingredientsText = data.ingredients?.join(', ') || undefined;

    const product: Product = {
      barcode: data.gtin || barcode,
      product_name: data.name,
      product_name_en: data.name,
      brands: data.brand,
      generic_name: data.description,
      categories: data.category,
      categories_tags: data.category ? [data.category.toLowerCase().replace(/\s+/g, '_')] : [],
      image_url: data.image || data.images?.[0],
      nutriments: Object.keys(nutriments).length > 0 ? nutriments : undefined,
      ingredients_text: ingredientsText,
      source: 'datakick',
      quality: 75, // Good quality community data
      completion: 60, // Moderate completeness
    };

    logger.debug(`[Datakick] Found product: ${data.name}`);
    return product;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.debug(`[Datakick] API error for ${barcode}:`, errorMessage);
    return null;
  }
}

