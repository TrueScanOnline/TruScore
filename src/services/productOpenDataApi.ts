/**
 * Product Open Data API Service
 * Free product database
 * URL: https://www.product-open-data.com/
 * Status: Free, open source
 */

import { Product } from '../types/product';
import { logger } from '../utils/logger';
import { fetchWithRateLimit } from '../utils/timeoutHelper';
import { isCircuitOpen, recordFailure, recordSuccess } from './circuitBreakerService';

const PRODUCT_OPEN_DATA_API = 'https://www.product-open-data.com/api';

export interface ProductOpenDataResponse {
  code?: string;
  product_name?: string;
  brands?: string;
  image_url?: string;
  categories?: string;
  ingredients_text?: string;
  nutriments?: Record<string, number>;
  error?: string;
}

/**
 * Fetch product from Product Open Data
 */
export async function fetchProductFromProductOpenData(barcode: string): Promise<Product | null> {
  // CRITICAL FIX: Check circuit breaker before querying
  if (isCircuitOpen('product_open_data')) {
    logger.debug('[ProductOpenData] Circuit breaker OPEN, skipping query');
    return null;
  }
  
  try {
    const url = `${PRODUCT_OPEN_DATA_API}/product/${barcode}`;
    
    const response = await fetchWithRateLimit(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TrueScan-FoodScanner/1.0',
      },
    }, 'product_open_data');

    if (!response.ok) {
      if (response.status === 404) {
        recordSuccess('product_open_data'); // 404 is expected, not a failure
        return null; // Product not found
      }
      logger.debug(`Product Open Data API error: ${response.status}`);
      recordFailure('product_open_data');
      return null;
    }

    const data: ProductOpenDataResponse = await response.json();

    if (data.error || !data.code) {
      recordSuccess('product_open_data'); // No error, just no data
      return null;
    }

    // Convert to Product format
    const product: Product = {
      barcode: data.code,
      product_name: data.product_name || `Product ${data.code}`,
      product_name_en: data.product_name,
      brands: data.brands || undefined,
      image_url: data.image_url || undefined,
      ingredients_text: data.ingredients_text || undefined,
      nutriments: data.nutriments ? convertNutriments(data.nutriments) : undefined,
      categories: data.categories || undefined,
      source: 'product_open_data',
      quality: 45, // Good quality (open source)
      completion: 35,
    };

    recordSuccess('product_open_data');
    return product;
  } catch (error) {
    logger.debug('Error fetching from Product Open Data:', error);
    recordFailure('product_open_data');
    return null;
  }
}

/**
 * Convert Product Open Data nutriments format to our format
 */
function convertNutriments(nutriments: Record<string, number>): Product['nutriments'] {
  const converted: Product['nutriments'] = {};
  
  for (const [key, value] of Object.entries(nutriments)) {
    // Map common nutrition keys
    const mappedKey = key.toLowerCase()
      .replace('energy', 'energy-kcal')
      .replace('calories', 'energy-kcal')
      .replace('protein', 'proteins')
      .replace('fat', 'fat')
      .replace('carbohydrate', 'carbohydrates')
      .replace('sugar', 'sugars')
      .replace('sodium', 'sodium')
      .replace('salt', 'salt');
    
    converted[mappedKey as keyof Product['nutriments']] = value;
  }
  
  return converted;
}

