/**
 * Barcode Lookup (barcodelookup.com) API Service
 * Free tier available (100 requests/day)
 * URL: https://www.barcodelookup.com/api
 * Status: Free tier (100 requests/day), requires API key
 * Recommendation: Add for premium users
 */

import { Product } from '../types/product';
import { applyResolvedNutrientLevels } from '../utils/resolveNutrientLevels';
import { logger } from '../utils/logger';
import { fetchWithRateLimit } from '../utils/timeoutHelper';

const BARCODE_LOOKUP_API = 'https://api.barcodelookup.com/v3/products';

let barcodeLookupComAuthRejected = false;

// API key should be stored in environment variables
// For now, using a placeholder - should be configured in app settings
const getApiKey = (): string | null => {
  const k =
    process.env.BARCODE_LOOKUP_API_KEY ||
    process.env.EXPO_PUBLIC_BARCODE_LOOKUP_API_KEY ||
    '';
  const t = typeof k === 'string' ? k.trim() : '';
  return t.length >= 8 ? t : null;
};

export interface BarcodeLookupResponse {
  products?: Array<{
    barcode_number?: string;
    barcode_type?: string;
    barcode_formats?: string;
    product_name?: string;
    product_description?: string;
    brand?: string;
    manufacturer?: string;
    images?: string[];
    stores?: Array<{
      name?: string;
      price?: string;
      currency?: string;
    }>;
    nutrition?: {
      calories?: number;
      protein?: number;
      fat?: number;
      carbohydrates?: number;
      sugar?: number;
      sodium?: number;
    };
  }>;
  errors?: Array<{
    message?: string;
  }>;
}

/**
 * Fetch product from Barcode Lookup
 * Note: Requires API key (free tier: 100 requests/day)
 */
export async function fetchProductFromBarcodeLookupCom(barcode: string): Promise<Product | null> {
  try {
    if (barcodeLookupComAuthRejected) {
      return null;
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      return null;
    }

    const url = `${BARCODE_LOOKUP_API}?barcode=${barcode}&formatted=y&key=${apiKey}`;
    
    const response = await fetchWithRateLimit(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TrueScan-FoodScanner/1.0',
      },
    }, 'barcode_lookup_com');

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        barcodeLookupComAuthRejected = true;
        return null;
      }
      if (response.status === 429) {
        logger.debug('Barcode Lookup rate limit exceeded (free tier: 100/day)');
        return null;
      }
      if (response.status === 404) {
        return null;
      }
      logger.debug(`Barcode Lookup API error: ${response.status}`);
      return null;
    }

    const data: BarcodeLookupResponse = await response.json();

    if (data.errors && data.errors.length > 0) {
      logger.debug(`Barcode Lookup API errors: ${data.errors.map(e => e.message).join(', ')}`);
      return null;
    }

    if (!data.products || data.products.length === 0) {
      return null;
    }

    const productData = data.products[0];

    // Convert to Product format
    const product: Product = {
      barcode: productData.barcode_number || barcode,
      product_name: productData.product_name || `Product ${barcode}`,
      product_name_en: productData.product_name,
      brands: productData.brand || productData.manufacturer || undefined,
      image_url: productData.images && productData.images.length > 0 ? productData.images[0] : undefined,
      ingredients_text: productData.product_description || undefined,
      nutriments: productData.nutrition ? {
        'energy-kcal': productData.nutrition.calories,
        proteins: productData.nutrition.protein,
        fat: productData.nutrition.fat,
        carbohydrates: productData.nutrition.carbohydrates,
        sugars: productData.nutrition.sugar,
        sodium: productData.nutrition.sodium,
      } : undefined,
      source: 'barcode_lookup_com',
      quality: 50, // Good quality (premium source)
      completion: 40,
    };

    applyResolvedNutrientLevels(product);
    return product;
  } catch (error) {
    logger.debug('Error fetching from Barcode Lookup:', error);
    return null;
  }
}

