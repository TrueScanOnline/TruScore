// Tesco Labs API client
// Official Tesco UK grocery products API
// Note: Requires API key registration at https://dev.tescolabs.com/

import { Product } from '../types/product';
import { fetchWithRateLimit } from '../utils/timeoutHelper';
import { logger } from '../utils/logger';

const TESCO_API_BASE = 'https://dev.tescolabs.com/grocery/products';
const USER_AGENT = 'TrueScan-FoodScanner/1.0.0';

// Note: Tesco Labs API requires free API key registration
// Get your key at: https://dev.tescolabs.com/
// Store in environment variable: EXPO_PUBLIC_TESCO_API_KEY
const TESCO_API_KEY = process.env.EXPO_PUBLIC_TESCO_API_KEY || '';

export interface TescoProductResponse {
  products?: Array<{
    gtin?: string;
    tpnb?: string; // Tesco product number
    tpnc?: string; // Tesco product code
    description?: string;
    brand?: string;
    qtyContents?: {
      quantity?: number;
      totalQuantity?: number;
      quantityUom?: string;
      netContents?: string;
    };
    productCharacteristics?: {
      isFood?: boolean;
      isDrink?: boolean;
      healthScore?: number;
      isHazardous?: boolean;
      storageType?: string;
      isNonLiquidAnalgesic?: boolean;
      containsLoperamide?: boolean;
    };
    ingredients?: string;
    nutrition?: Array<{
      name?: string;
      valuePer100?: string;
      valuePerServing?: string;
    }>;
    image?: string;
    price?: number;
    pricePerUnit?: string;
  }>;
}

/**
 * Fetch product from Tesco Labs API by barcode (GTIN)
 */
export async function fetchProductFromTesco(barcode: string): Promise<Product | null> {
  // Skip if no API key configured
  if (!TESCO_API_KEY) {
    logger.debug('Tesco Labs API key not configured, skipping Tesco lookup');
    return null;
  }

  try {
    const url = `${TESCO_API_BASE}?gtin=${encodeURIComponent(barcode)}`;
    
    const response = await fetchWithRateLimit(url, {
      headers: {
        'Ocp-Apim-Subscription-Key': TESCO_API_KEY,
        'User-Agent': USER_AGENT,
      },
    }, 'tesco_labs');

    if (!response.ok) {
      if (response.status === 404) {
        logger.debug(`Tesco: Product not found for ${barcode}`);
        return null;
      }
      logger.debug(`Tesco Labs API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: TescoProductResponse = await response.json();

    if (!data.products || data.products.length === 0) {
      logger.debug(`Tesco: Product not found for ${barcode}`);
      return null;
    }

    const tescoProduct = data.products[0];
    
    // Convert Tesco product to our Product format
    const product: Product = {
      barcode,
      product_name: tescoProduct.description || `Product ${barcode}`,
      brands: tescoProduct.brand,
      source: 'tesco_labs',
      
      // Convert nutrition data
      nutriments: convertTescoNutrition(tescoProduct.nutrition),
      
      ingredients_text: tescoProduct.ingredients,
      
      // Product characteristics
      image_url: tescoProduct.image,
      
      // Quantity information
      quantity: tescoProduct.qtyContents?.netContents || tescoProduct.qtyContents?.quantityUom,
      
      // Quality indicators (store API data is good quality)
      quality: 80,
      completion: 75,
    };

    logger.debug(`Found product in Tesco: ${barcode}`);
    return product;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.debug(`Tesco Labs API error for ${barcode}:`, errorMessage);
    return null;
  }
}

/**
 * Convert Tesco nutrition array to our nutriments format
 */
function convertTescoNutrition(nutrition?: Array<{ name?: string; valuePer100?: string; valuePerServing?: string }>): Product['nutriments'] {
  if (!nutrition || nutrition.length === 0) {
    return undefined;
  }

  const nutriments: Product['nutriments'] = {};

  nutrition.forEach(nutrient => {
    if (!nutrient.name || !nutrient.valuePer100) return;

    const name = nutrient.name.toLowerCase();
    const value = parseFloat(nutrient.valuePer100);

    if (isNaN(value)) return;

    // Map Tesco nutrition names to our format
    if (name.includes('energy') && (name.includes('kcal') || name.includes('calories'))) {
      nutriments['energy-kcal'] = value;
      nutriments['energy-kcal_100g'] = value;
    } else if (name.includes('energy') && name.includes('kj')) {
      nutriments['energy-kj'] = value;
      nutriments['energy-kj_100g'] = value;
    } else if (name.includes('fat')) {
      nutriments.fat = value;
      nutriments['fat_100g'] = value;
      if (name.includes('saturat')) {
        nutriments['saturated-fat'] = value;
        nutriments['saturated-fat_100g'] = value;
      }
    } else if (name.includes('carbohydrate')) {
      nutriments.carbohydrates = value;
      nutriments['carbohydrates_100g'] = value;
      if (name.includes('sugar')) {
        nutriments.sugars = value;
        nutriments['sugars_100g'] = value;
      }
    } else if (name.includes('fibre') || name.includes('fiber')) {
      nutriments.fiber = value;
      nutriments['fiber_100g'] = value;
    } else if (name.includes('protein')) {
      nutriments.proteins = value;
      nutriments['proteins_100g'] = value;
    } else if (name.includes('salt')) {
      nutriments.salt = value;
      nutriments['salt_100g'] = value;
    } else if (name.includes('sodium')) {
      nutriments.sodium = value;
      nutriments['sodium_100g'] = value;
      // Convert sodium to salt (salt = sodium * 2.54)
      if (!nutriments.salt) {
        nutriments.salt = value * 2.54;
        nutriments['salt_100g'] = value * 2.54;
      }
    }
  });

  return Object.keys(nutriments).length > 0 ? nutriments : undefined;
}

