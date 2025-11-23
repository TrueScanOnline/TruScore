// Barcode Lookup API integration
// Free tier: 50 requests/day
// https://www.barcodelookup.com/api

import { Product } from '../types/product';
import { logger } from '../utils/logger';

const API_BASE_URL = 'https://api.barcodelookup.com/v3/products';
// Free tier doesn't require API key, but rate-limited to 50/day
// For production, consider registering for free API key

/**
 * Fetch product from Barcode Lookup API
 * Free tier: 50 requests/day
 */
export async function fetchProductFromBarcodeLookup(barcode: string): Promise<Product | null> {
  try {
    const url = `${API_BASE_URL}?barcode=${encodeURIComponent(barcode)}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TrueScan-FoodScanner/1.0.0',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      // Free tier rate limit or not found
      if (response.status === 429) {
        logger.debug(`Barcode Lookup API rate limit reached for ${barcode}`);
      } else if (response.status === 404) {
        logger.debug(`Product not found in Barcode Lookup: ${barcode}`);
      } else {
        logger.debug(`Barcode Lookup API error ${response.status} for ${barcode}`);
      }
      return null;
    }

    const data = await response.json();
    
    // Barcode Lookup API response structure
    const products = data?.products;
    if (!products || products.length === 0) {
      return null;
    }

    const product = products[0]; // Use first result
    
    // Convert to our Product format
    const convertedProduct: Product = {
      barcode: barcode,
      product_name: product.product_name || product.title || product.name,
      brands: product.brand || product.manufacturer || product.brand_name,
      image_url: product.images?.[0] || product.image_url || product.image,
      source: 'barcode_lookup',
      // Nutrition data if available
      nutriments: product.nutrition ? {
        'energy-kcal_100g': product.nutrition.calories,
        fat: product.nutrition.fat,
        'saturated-fat': product.nutrition.saturated_fat,
        carbohydrates: product.nutrition.carbohydrates,
        sugars: product.nutrition.sugars,
        proteins: product.nutrition.protein,
        salt: product.nutrition.sodium ? product.nutrition.sodium / 1000 : undefined, // Convert mg to g
        fiber: product.nutrition.fiber,
      } : undefined,
      ingredients_text: product.ingredients || product.ingredients_text,
      quantity: product.size || product.quantity,
      categories_tags: product.category ? (typeof product.category === 'string' ? [product.category] : (Array.isArray(product.category) ? product.category as string[] : [])) : undefined,
    };

    logger.debug(`Found product in Barcode Lookup: ${barcode}`);
    return convertedProduct;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.debug(`Barcode Lookup API error for ${barcode}:`, errorMessage);
    return null;
  }
}
