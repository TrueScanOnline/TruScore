// FoodRepo API client
// High-quality Swiss/European food product database
// FREE API - No key required (public access)

import { Product } from '../types/product';
import { fetchWithRateLimit } from '../utils/timeoutHelper';
import { logger } from '../utils/logger';

const FOODREPO_API_BASE = 'https://www.foodrepo.org/api/v3';
const USER_AGENT = 'Rveel/1.0.0';

export interface FoodRepoProductResponse {
  id?: string;
  code?: string; // Barcode
  name?: string;
  brands?: string;
  categories?: string[];
  ingredients_text?: string;
  nutriments?: {
    energy_kcal_100g?: number;
    fat_100g?: number;
    'saturated-fat_100g'?: number;
    carbohydrates_100g?: number;
    sugars_100g?: number;
    fiber_100g?: number;
    proteins_100g?: number;
    salt_100g?: number;
    sodium_100g?: number;
  };
  image_url?: string;
  image_small_url?: string;
  image_front_url?: string;
  image_ingredients_url?: string;
  labels?: string[];
  ecoscore_grade?: string;
  nutriscore_grade?: string;
}

/**
 * Fetch product from FoodRepo API by barcode
 * High-quality data for Swiss/European products
 */
export async function fetchProductFromFoodRepo(barcode: string): Promise<Product | null> {
  try {
    const url = `${FOODREPO_API_BASE}/products/${encodeURIComponent(barcode)}`;
    
    const response = await fetchWithRateLimit(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': USER_AGENT,
      },
    }, 'foodrepo');

    if (!response.ok) {
      if (response.status === 404) {
        logger.debug(`FoodRepo: Product not found for ${barcode}`);
        return null;
      }
      logger.debug(`FoodRepo API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: FoodRepoProductResponse = await response.json();

    if (!data || !data.code) {
      logger.debug(`FoodRepo: Invalid product data for ${barcode}`);
      return null;
    }
    
    // Convert FoodRepo product to our Product format
    const product: Product = {
      barcode: data.code || barcode,
      product_name: data.name || `Product ${barcode}`,
      brands: data.brands,
      source: 'foodrepo',
      
      // Nutrition data (FoodRepo uses same format as OFF)
      nutriments: data.nutriments ? {
        'energy-kcal': data.nutriments.energy_kcal_100g,
        'energy-kcal_100g': data.nutriments.energy_kcal_100g,
        fat: data.nutriments.fat_100g,
        'fat_100g': data.nutriments.fat_100g,
        'saturated-fat': data.nutriments['saturated-fat_100g'],
        'saturated-fat_100g': data.nutriments['saturated-fat_100g'],
        carbohydrates: data.nutriments.carbohydrates_100g,
        'carbohydrates_100g': data.nutriments.carbohydrates_100g,
        sugars: data.nutriments.sugars_100g,
        'sugars_100g': data.nutriments.sugars_100g,
        fiber: data.nutriments.fiber_100g,
        'fiber_100g': data.nutriments.fiber_100g,
        proteins: data.nutriments.proteins_100g,
        'proteins_100g': data.nutriments.proteins_100g,
        salt: data.nutriments.salt_100g,
        'salt_100g': data.nutriments.salt_100g,
        sodium: data.nutriments.sodium_100g,
        'sodium_100g': data.nutriments.sodium_100g,
      } : undefined,
      
      ingredients_text: data.ingredients_text,
      
      // Images (FoodRepo has high-quality images)
      image_url: data.image_url || data.image_front_url || data.image_small_url,
      
      // Labels and certifications
      labels_tags: data.labels,
      
      // Eco-Score and Nutri-Score (validate types)
      ecoscore_grade: data.ecoscore_grade && ['a', 'b', 'c', 'd', 'e', 'unknown'].includes(data.ecoscore_grade.toLowerCase()) 
        ? data.ecoscore_grade.toLowerCase() as 'a' | 'b' | 'c' | 'd' | 'e' | 'unknown'
        : undefined,
      nutriscore_grade: data.nutriscore_grade && ['a', 'b', 'c', 'd', 'e', 'unknown'].includes(data.nutriscore_grade.toLowerCase())
        ? data.nutriscore_grade.toLowerCase() as 'a' | 'b' | 'c' | 'd' | 'e' | 'unknown'
        : undefined,
      
      // Categories
      categories: data.categories?.join(', '),
      
      // Quality indicators (FoodRepo has high-quality, clean data)
      quality: 85,
      completion: 80,
    };

    logger.debug(`Found product in FoodRepo: ${barcode}`);
    return product;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.debug(`FoodRepo API error for ${barcode}:`, errorMessage);
    return null;
  }
}

