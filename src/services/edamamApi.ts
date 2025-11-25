// Edamam Food Database API Service
// Free tier: 10,000 requests/month
// Coverage: Food products, nutrition facts
// Registration: https://developer.edamam.com/
// Requires: App ID + App Key

import axios from 'axios';
import { Product, ProductNutriments } from '../types/product';
import { logger } from '../utils/logger';

const EDAMAM_API_BASE = 'https://api.edamam.com/api/food-database/v2';
const APP_ID = process.env.EXPO_PUBLIC_EDAMAM_APP_ID || '';
const APP_KEY = process.env.EXPO_PUBLIC_EDAMAM_APP_KEY || '';

interface EdamamSearchResponse {
  hints?: Array<{
    food?: {
      foodId?: string;
      label?: string;
      knownAs?: string;
      nutrients?: {
        ENERC_KCAL?: number; // Energy (kcal)
        PROCNT?: number; // Protein
        FAT?: number; // Fat
        CHOCDF?: number; // Carbs
        FIBTG?: number; // Fiber
        SUGAR?: number; // Sugar
        NA?: number; // Sodium
        CA?: number; // Calcium
        FE?: number; // Iron
        K?: number; // Potassium
        VITC?: number; // Vitamin C
        THIA?: number; // Thiamin
        RIBF?: number; // Riboflavin
        NIA?: number; // Niacin
        VITB6A?: number; // Vitamin B6
        FOLDFE?: number; // Folate
        VITB12?: number; // Vitamin B12
        VITD?: number; // Vitamin D
        TOCPHA?: number; // Vitamin E
        VITK1?: number; // Vitamin K
      };
      category?: string;
      categoryLabel?: string;
      image?: string;
      brand?: string;
      foodContentsLabel?: string; // Ingredients
      servingSizes?: Array<{
        uri?: string;
        label?: string;
        quantity?: number;
      }>;
    };
  }>;
}

/**
 * Fetch product from Edamam Food Database API
 * 
 * @param barcode - Product barcode (UPC/EAN)
 * @returns Product object or null if not found
 */
export async function fetchProductFromEdamam(barcode: string): Promise<Product | null> {
  // Skip if credentials not configured
  if (!APP_ID || !APP_KEY || APP_ID.length < 10 || APP_KEY.length < 10) {
    logger.debug(`Edamam API credentials not configured, skipping lookup for ${barcode}`);
    return null;
  }

  try {
    // Edamam uses barcode search endpoint
    const searchUrl = `${EDAMAM_API_BASE}/parser`;
    const params = {
      app_id: APP_ID,
      app_key: APP_KEY,
      upc: barcode,
    };
    
    logger.debug(`Fetching from Edamam API: ${barcode}`);
    
    const response = await axios.get<EdamamSearchResponse>(searchUrl, {
      params,
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TrueScan-FoodScanner/1.0',
      },
    });

    // Check if product found
    if (!response.data || !response.data.hints || response.data.hints.length === 0) {
      logger.debug(`Edamam: Product not found for ${barcode}`);
      return null;
    }

    const food = response.data.hints[0]?.food;
    if (!food) {
      return null;
    }

    // Extract product name
    const productName = food.label || food.knownAs || 'Unknown Product';
    
    // Extract brand
    const brand = food.brand || '';
    
    // Extract category
    const category = food.categoryLabel || food.category || '';
    
    // Extract image
    const imageUrl = food.image || undefined;
    
    // Extract ingredients
    const ingredients = food.foodContentsLabel || '';
    
    // Convert nutrients to our format
    const nutrients = food.nutrients;
    const nutriments: ProductNutriments | undefined = nutrients ? {
      energy_kcal_100g: nutrients.ENERC_KCAL ? Math.round(nutrients.ENERC_KCAL) : undefined,
      proteins_100g: nutrients.PROCNT ? Math.round(nutrients.PROCNT * 10) / 10 : undefined,
      fat_100g: nutrients.FAT ? Math.round(nutrients.FAT * 10) / 10 : undefined,
      carbohydrates_100g: nutrients.CHOCDF ? Math.round(nutrients.CHOCDF * 10) / 10 : undefined,
      fiber_100g: nutrients.FIBTG ? Math.round(nutrients.FIBTG * 10) / 10 : undefined,
      sugars_100g: nutrients.SUGAR ? Math.round(nutrients.SUGAR * 10) / 10 : undefined,
      salt_100g: nutrients.NA ? Math.round((nutrients.NA / 1000) * 10) / 10 : undefined, // Convert mg to g
      sodium_100g: nutrients.NA ? Math.round(nutrients.NA / 10) / 100 : undefined, // Convert mg to g
      calcium_100g: nutrients.CA ? Math.round(nutrients.CA / 10) / 100 : undefined, // Convert mg to g
      iron_100g: nutrients.FE ? Math.round(nutrients.FE / 10) / 100 : undefined, // Convert mg to g
      potassium_100g: nutrients.K ? Math.round(nutrients.K / 10) / 100 : undefined, // Convert mg to g
      'vitamin-c_100g': nutrients.VITC ? Math.round(nutrients.VITC / 10) / 100 : undefined, // Convert mg to g
    } : undefined;

    // Build product object
    const product: Product = {
      barcode: barcode,
      product_name: productName,
      product_name_en: productName,
      brands: brand,
      categories: category,
      categories_tags: category ? [category.toLowerCase().replace(/\s+/g, '_')] : [],
      image_url: imageUrl,
      image_front_url: imageUrl,
      image_front_small_url: imageUrl,
      ingredients_text: ingredients,
      nutriments: nutriments,
      source: 'edamam',
      quality: calculateQuality(food),
      completion: calculateCompletion(food),
    };

    logger.debug(`Edamam: Found product ${productName} for ${barcode}`);
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
      logger.error(`Edamam API error for ${barcode}:`, errorMessage, error?.response?.data);
    } else {
      logger.debug(`Edamam API ${errorMessage.toLowerCase()} for ${barcode}`);
    }
    
    return null;
  }
}

function calculateQuality(food: EdamamSearchResponse['hints']?[0]?['food']): number {
  if (!food) return 0;
  
  let score = 0;
  if (food.label || food.knownAs) score += 30;
  if (food.brand) score += 15;
  if (food.foodContentsLabel) score += 20;
  if (food.nutrients) score += 25;
  if (food.image) score += 10;
  
  return Math.min(score, 100);
}

function calculateCompletion(food: EdamamSearchResponse['hints']?[0]?['food']): number {
  if (!food) return 0;
  
  const fields = [
    food.label || food.knownAs,
    food.brand,
    food.foodContentsLabel,
    food.nutrients,
    food.image,
    food.categoryLabel || food.category,
  ];
  
  const filledFields = fields.filter(Boolean).length;
  return Math.round((filledFields / fields.length) * 100);
}

