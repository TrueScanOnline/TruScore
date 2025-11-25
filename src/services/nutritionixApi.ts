// Nutritionix API Service
// Free tier: 100 requests/day
// Coverage: Nutrition facts, food database
// Registration: https://www.nutritionix.com/business/api

import axios from 'axios';
import { Product, ProductNutriments } from '../types/product';
import { logger } from '../utils/logger';

const NUTRITIONIX_API_BASE = 'https://trackapi.nutritionix.com/v2';
const APP_ID = process.env.EXPO_PUBLIC_NUTRITIONIX_APP_ID || '';
const APP_KEY = process.env.EXPO_PUBLIC_NUTRITIONIX_API_KEY || '';

interface NutritionixItemResponse {
  foods?: Array<{
    food_name?: string;
    brand_name?: string;
    serving_qty?: number;
    serving_unit?: string;
    serving_weight_grams?: number;
    nf_calories?: number;
    nf_total_fat?: number;
    nf_saturated_fat?: number;
    nf_cholesterol?: number;
    nf_sodium?: number;
    nf_total_carbohydrate?: number;
    nf_dietary_fiber?: number;
    nf_sugars?: number;
    nf_protein?: number;
    nf_potassium?: number;
    nf_p?: number; // Phosphorus
    nf_vitamin_a?: number;
    nf_vitamin_c?: number;
    nf_calcium?: number;
    nf_iron?: number;
    photo?: {
      thumb?: string;
      highres?: string;
    };
    full_nutrients?: Array<{
      attr_id?: number;
      value?: number;
    }>;
  }>;
}

/**
 * Fetch product from Nutritionix API
 * 
 * @param barcode - Product barcode (UPC/EAN)
 * @returns Product object or null if not found
 */
export async function fetchProductFromNutritionix(barcode: string): Promise<Product | null> {
  // Skip if credentials not configured
  if (!APP_ID || !APP_KEY || APP_ID.length < 10 || APP_KEY.length < 10) {
    logger.debug(`Nutritionix API credentials not configured, skipping lookup for ${barcode}`);
    return null;
  }

  try {
    const url = `${NUTRITIONIX_API_BASE}/search/item`;
    const params = {
      upc: barcode,
    };
    
    logger.debug(`Fetching from Nutritionix API: ${barcode}`);
    
    const response = await axios.get<NutritionixItemResponse>(url, {
      params,
      timeout: 10000,
      headers: {
        'x-app-id': APP_ID,
        'x-app-key': APP_KEY,
        'x-remote-user-id': '0',
        'Accept': 'application/json',
        'User-Agent': 'TrueScan-FoodScanner/1.0',
      },
    });

    // Check if product found
    if (!response.data || !response.data.foods || response.data.foods.length === 0) {
      logger.debug(`Nutritionix: Product not found for ${barcode}`);
      return null;
    }

    const food = response.data.foods[0];
    if (!food) {
      return null;
    }

    // Extract product name
    const productName = food.food_name || 'Unknown Product';
    
    // Extract brand
    const brand = food.brand_name || '';
    
    // Extract image
    const imageUrl = food.photo?.highres || food.photo?.thumb || undefined;
    
    // Convert nutrients to per 100g format
    const servingWeightGrams = food.serving_weight_grams || 100;
    const multiplier = 100 / servingWeightGrams;
    
    const nutriments: ProductNutriments | undefined = {
      energy_kcal_100g: food.nf_calories ? Math.round(food.nf_calories * multiplier) : undefined,
      proteins_100g: food.nf_protein ? Math.round(food.nf_protein * multiplier * 10) / 10 : undefined,
      fat_100g: food.nf_total_fat ? Math.round(food.nf_total_fat * multiplier * 10) / 10 : undefined,
      'saturated-fat_100g': food.nf_saturated_fat ? Math.round(food.nf_saturated_fat * multiplier * 10) / 10 : undefined,
      carbohydrates_100g: food.nf_total_carbohydrate ? Math.round(food.nf_total_carbohydrate * multiplier * 10) / 10 : undefined,
      fiber_100g: food.nf_dietary_fiber ? Math.round(food.nf_dietary_fiber * multiplier * 10) / 10 : undefined,
      sugars_100g: food.nf_sugars ? Math.round(food.nf_sugars * multiplier * 10) / 10 : undefined,
      salt_100g: food.nf_sodium ? Math.round((food.nf_sodium / 1000) * multiplier * 10) / 10 : undefined, // Convert mg to g
      sodium_100g: food.nf_sodium ? Math.round(food.nf_sodium / 10) / 100 * multiplier : undefined, // Convert mg to g
      calcium_100g: food.nf_calcium ? Math.round(food.nf_calcium / 10) / 100 * multiplier : undefined, // Convert mg to g
      iron_100g: food.nf_iron ? Math.round(food.nf_iron / 10) / 100 * multiplier : undefined, // Convert mg to g
      potassium_100g: food.nf_potassium ? Math.round(food.nf_potassium / 10) / 100 * multiplier : undefined, // Convert mg to g
      'vitamin-c_100g': food.nf_vitamin_c ? Math.round(food.nf_vitamin_c / 10) / 100 * multiplier : undefined, // Convert mg to g
    };

    // Build product object
    const product: Product = {
      barcode: barcode,
      product_name: productName,
      product_name_en: productName,
      brands: brand,
      image_url: imageUrl,
      image_front_url: imageUrl,
      image_front_small_url: imageUrl,
      nutriments: nutriments,
      serving_size: food.serving_qty && food.serving_unit 
        ? `${food.serving_qty} ${food.serving_unit}`
        : undefined,
      source: 'nutritionix',
      quality: calculateQuality(food),
      completion: calculateCompletion(food),
    };

    logger.debug(`Nutritionix: Found product ${productName} for ${barcode}`);
    return product;

  } catch (error: any) {
    // Suppress expected errors
    const errorMessage = error?.response?.status === 404 
      ? 'Product not found'
      : error?.response?.status === 429
      ? 'Rate limit exceeded'
      : error?.code === 'ECONNABORTED' || error?.code === 'ENOTFOUND' || error?.code === 'ECONNREFUSED'
      ? 'Network request failed'
      : error?.response?.status === 401 || error?.response?.status === 403
      ? 'API key invalid or expired'
      : 'Unexpected error';

    // Only log unexpected errors
    if (errorMessage !== 'Product not found' && 
        errorMessage !== 'Network request failed' && 
        errorMessage !== 'Rate limit exceeded' &&
        errorMessage !== 'API key invalid or expired') {
      logger.error(`Nutritionix API error for ${barcode}:`, errorMessage, error?.response?.data);
    } else {
      logger.debug(`Nutritionix API ${errorMessage.toLowerCase()} for ${barcode}`);
    }
    
    return null;
  }
}

function calculateQuality(food: NutritionixItemResponse['foods']?[0]): number {
  if (!food) return 0;
  
  let score = 0;
  if (food.food_name) score += 30;
  if (food.brand_name) score += 15;
  if (food.nf_calories !== undefined) score += 25;
  if (food.photo) score += 15;
  if (food.full_nutrients && food.full_nutrients.length > 0) score += 15;
  
  return Math.min(score, 100);
}

function calculateCompletion(food: NutritionixItemResponse['foods']?[0]): number {
  if (!food) return 0;
  
  const fields = [
    food.food_name,
    food.brand_name,
    food.nf_calories !== undefined,
    food.nf_protein !== undefined,
    food.photo,
    food.full_nutrients && food.full_nutrients.length > 0,
  ];
  
  const filledFields = fields.filter(Boolean).length;
  return Math.round((filledFields / fields.length) * 100);
}

