// Buycott API Integration
// Provides access to 150M+ products with images
// Free tier available with registration
// https://www.buycott.com/api

import { Product } from '../types/product';
import { logger } from '../utils/logger';
import { createTimeoutSignal } from '../utils/timeoutHelper';

const BUYCOTT_API = 'https://www.buycott.com/api/v2/products';
// NOTE: Free tier requires registration.
// For production, a paid API key may be required.
const API_KEY = process.env.EXPO_PUBLIC_BUYCOTT_API_KEY || '';

export interface BuycottResponse {
  barcode: string;
  name: string;
  brand?: string;
  category?: string;
  image?: string;
  description?: string;
  manufacturer?: string;
}

/**
 * Fetch product data from Buycott API
 * Free tier requires registration.
 */
export async function fetchProductFromBuycott(barcode: string): Promise<Product | null> {
  if (!API_KEY) {
    logger.debug('Buycott API key not configured, skipping Buycott lookup.');
    return null;
  }

  try {
    const url = `${BUYCOTT_API}/${barcode}?api_key=${API_KEY}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TrueScan-FoodScanner/1.0.0',
        'Accept': 'application/json',
      },
      signal: createTimeoutSignal(10000), // 10 second timeout
    });

    if (!response.ok) {
      logger.debug(`Buycott API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: BuycottResponse = await response.json();

    if (!data.name) {
      logger.debug(`Product not found in Buycott: ${barcode}`);
      return null;
    }

    // Convert to our Product format
    const convertedProduct: Product = {
      barcode: data.barcode || barcode,
      product_name: data.name,
      brands: data.brand || data.manufacturer,
      generic_name: data.description,
      categories_tags: data.category ? (Array.isArray(data.category) ? data.category : [data.category]) : undefined,
      image_url: data.image,
      source: 'buycott',
    };

    logger.debug(`Found product in Buycott: ${barcode}`);
    return convertedProduct;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!errorMessage.includes('aborted') && !errorMessage.includes('timeout')) {
      logger.error(`Error fetching from Buycott for ${barcode}:`, errorMessage);
    } else {
      logger.debug(`Buycott timeout for ${barcode}`);
    }
    return null;
  }
}

