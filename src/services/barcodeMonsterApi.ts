// Barcode Monster API Integration
// Free barcode lookup - no API key required for basic usage
// https://www.barcodemonster.com/

import { Product } from '../types/product';
import { logger } from '../utils/logger';
import { createTimeoutSignal } from '../utils/timeoutHelper';

// Note: Barcode Monster API endpoint may vary or require authentication
// If this fails, we'll gracefully skip it
const BARCODE_MONSTER_API = 'https://www.barcodemonster.com/api';

/**
 * Fetch product data from Barcode Monster
 * Free tier available, no API key required for basic lookups
 */
export async function fetchProductFromBarcodeMonster(barcode: string): Promise<Product | null> {
  try {
    const url = `${BARCODE_MONSTER_API}/product/${barcode}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TrueScan-FoodScanner/1.0.0',
        'Accept': 'application/json',
      },
      signal: createTimeoutSignal(10000), // 10 second timeout
    });

    if (!response.ok) {
      if (response.status === 404) {
        logger.debug(`Product not found in Barcode Monster: ${barcode}`);
      } else {
        logger.debug(`Barcode Monster API error: ${response.status} ${response.statusText}`);
      }
      return null;
    }

    const data = await response.json();

    if (!data || !data.name) {
      logger.debug(`Product not found in Barcode Monster: ${barcode}`);
      return null;
    }

    // Convert to our Product format
    const convertedProduct: Product = {
      barcode: data.barcode || barcode,
      product_name: data.name,
      brands: data.brand || data.manufacturer,
      generic_name: data.description,
      categories_tags: data.category ? (Array.isArray(data.category) ? data.category : [data.category]) : undefined,
      image_url: data.image || data.imageUrl,
      source: 'barcode_monster',
    };

    logger.debug(`Found product in Barcode Monster: ${barcode}`);
    return convertedProduct;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Don't log network errors as errors - they're expected if the service is unavailable
    if (errorMessage.includes('Network request failed') || errorMessage.includes('Failed to fetch')) {
      logger.debug(`Barcode Monster service unavailable for ${barcode}`);
    } else if (!errorMessage.includes('aborted') && !errorMessage.includes('timeout')) {
      logger.debug(`Barcode Monster API error for ${barcode}:`, errorMessage);
    } else {
      logger.debug(`Barcode Monster timeout for ${barcode}`);
    }
    return null;
  }
}

