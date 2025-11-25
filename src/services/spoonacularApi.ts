// Spoonacular API Service
// Free tier: 150 points/day
// Coverage: Food products, recipes, nutrition
// Registration: https://spoonacular.com/food-api
// Note: Points-based system (each request costs points)

import axios from 'axios';
import { Product, ProductNutriments } from '../types/product';
import { logger } from '../utils/logger';

const SPOONACULAR_API_BASE = 'https://api.spoonacular.com/food/products';
const API_KEY = process.env.EXPO_PUBLIC_SPOONACULAR_API_KEY || '';

interface SpoonacularProductResponse {
  id?: number;
  title?: string;
  breadcrumbs?: string[];
  imageType?: string;
  badges?: string[];
  importantBadges?: string[];
  ingredientCount?: number;
  generatedText?: string;
  ingredientList?: string;
  ingredients?: Array<{
    name?: string;
    safety_level?: string;
    description?: string;
  }>;
  likes?: number;
  aisle?: string;
  nutrition?: {
    nutrients?: Array<{
      name?: string;
      amount?: number;
      unit?: string;
      percentOfDailyNeeds?: number;
    }>;
    caloricBreakdown?: {
      percentProtein?: number;
      percentFat?: number;
      percentCarbs?: number;
    };
    weightPerServing?: {
      amount?: number;
      unit?: string;
    };
  };
  price?: number;
  servings?: {
    number?: number;
    size?: number;
    unit?: string;
  };
  spoonacularScore?: number;
}

/**
 * Fetch product from Spoonacular API
 * 
 * @param barcode - Product barcode (UPC/EAN)
 * @returns Product object or null if not found
 */
export async function fetchProductFromSpoonacular(barcode: string): Promise<Product | null> {
  // Skip if API key not configured
  if (!API_KEY || API_KEY.length < 10) {
    logger.debug(`Spoonacular API key not configured, skipping lookup for ${barcode}`);
    return null;
  }

  try {
    const url = `${SPOONACULAR_API_BASE}/upc/${barcode}`;
    const params = {
      apiKey: API_KEY,
    };
    
    logger.debug(`Fetching from Spoonacular API: ${barcode}`);
    
    const response = await axios.get<SpoonacularProductResponse>(url, {
      params,
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TrueScan-FoodScanner/1.0',
      },
    });

    // Check if product found
    if (!response.data || !response.data.id) {
      logger.debug(`Spoonacular: Product not found for ${barcode}`);
      return null;
    }

    const data = response.data;
    
    // Extract product name
    const productName = data.title || 'Unknown Product';
    
    // Extract category/aisle
    const category = data.aisle || data.breadcrumbs?.[0] || '';
    
    // Extract ingredients
    const ingredients = data.ingredientList || data.ingredients?.map(i => i.name).filter(Boolean).join(', ') || '';
    
    // Convert nutrients to our format
    const nutrients = data.nutrition?.nutrients;
    const nutriments: ProductNutriments | undefined = nutrients ? (() => {
      const nutrientMap: Record<string, number> = {};
      nutrients.forEach(nutrient => {
        if (nutrient.name && nutrient.amount !== undefined) {
          nutrientMap[nutrient.name.toLowerCase()] = nutrient.amount;
        }
      });
      
      // Convert to per 100g (assuming weightPerServing is available)
      const servingWeight = data.nutrition?.weightPerServing?.amount || 100;
      const multiplier = 100 / servingWeight;
      
      return {
        energy_kcal_100g: nutrientMap['calories'] ? Math.round(nutrientMap['calories'] * multiplier) : undefined,
        proteins_100g: nutrientMap['protein'] ? Math.round(nutrientMap['protein'] * multiplier * 10) / 10 : undefined,
        fat_100g: nutrientMap['fat'] ? Math.round(nutrientMap['fat'] * multiplier * 10) / 10 : undefined,
        carbohydrates_100g: nutrientMap['carbohydrates'] ? Math.round(nutrientMap['carbohydrates'] * multiplier * 10) / 10 : undefined,
        fiber_100g: nutrientMap['fiber'] ? Math.round(nutrientMap['fiber'] * multiplier * 10) / 10 : undefined,
        sugars_100g: nutrientMap['sugar'] ? Math.round(nutrientMap['sugar'] * multiplier * 10) / 10 : undefined,
        salt_100g: nutrientMap['sodium'] ? Math.round((nutrientMap['sodium'] / 1000) * multiplier * 10) / 10 : undefined,
        sodium_100g: nutrientMap['sodium'] ? Math.round(nutrientMap['sodium'] / 10) / 100 * multiplier : undefined,
      };
    })() : undefined;

    // Build product object
    const product: Product = {
      barcode: barcode,
      product_name: productName,
      product_name_en: productName,
      categories: category,
      categories_tags: category ? [category.toLowerCase().replace(/\s+/g, '_')] : [],
      ingredients_text: ingredients,
      nutriments: nutriments,
      source: 'spoonacular',
      quality: calculateQuality(data),
      completion: calculateCompletion(data),
    };

    // Add serving size if available
    if (data.servings) {
      product.serving_size = `${data.servings.number} ${data.servings.unit}`;
    }

    logger.debug(`Spoonacular: Found product ${productName} for ${barcode}`);
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
      logger.error(`Spoonacular API error for ${barcode}:`, errorMessage, error?.response?.data);
    } else {
      logger.debug(`Spoonacular API ${errorMessage.toLowerCase()} for ${barcode}`);
    }
    
    return null;
  }
}

function calculateQuality(data: SpoonacularProductResponse): number {
  let score = 0;
  if (data.title) score += 30;
  if (data.ingredientList || data.ingredients) score += 25;
  if (data.nutrition?.nutrients) score += 25;
  if (data.spoonacularScore) score += 10;
  if (data.badges && data.badges.length > 0) score += 10;
  
  return Math.min(score, 100);
}

function calculateCompletion(data: SpoonacularProductResponse): number {
  const fields = [
    data.title,
    data.ingredientList || data.ingredients,
    data.nutrition?.nutrients,
    data.aisle,
    data.spoonacularScore !== undefined,
    data.badges && data.badges.length > 0,
  ];
  
  const filledFields = fields.filter(Boolean).length;
  return Math.round((filledFields / fields.length) * 100);
}

