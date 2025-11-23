// Go-UPC API Integration
// Provides access to 500M+ products globally
// Free tier: 100 requests/day
// https://go-upc.com/plans/api

import { Product } from '../types/product';
import { logger } from '../utils/logger';
import { createTimeoutSignal } from '../utils/timeoutHelper';

const GO_UPC_API = 'https://go-upc.com/api/v1/code';
// NOTE: Free tier is limited to 100 lookups per day.
// For higher limits, a paid API key is required.
const API_KEY = process.env.EXPO_PUBLIC_GO_UPC_API_KEY || '';

export interface GoUPCResponse {
  code: string;
  product: {
    name: string;
    description?: string;
    brand?: string;
    category?: string;
    image?: string;
    barcode?: string;
    manufacturer?: string;
  };
  stores?: Array<{
    name: string;
    price: string;
    currency: string;
    availability: string;
  }>;
}

/**
 * Fetch product data from Go-UPC API
 * Free tier is limited to 100 lookups per day.
 */
export async function fetchProductFromGoUPC(barcode: string): Promise<Product | null> {
  if (!API_KEY) {
    logger.debug('Go-UPC API key not configured, skipping Go-UPC lookup.');
    return null;
  }

  try {
    const url = `${GO_UPC_API}/${barcode}?key=${API_KEY}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TrueScan-FoodScanner/1.0.0',
        'Accept': 'application/json',
      },
      signal: createTimeoutSignal(10000), // 10 second timeout
    });

    if (!response.ok) {
      if (response.status === 429) {
        logger.warn('Go-UPC API rate limit reached (100/day free tier)');
      } else {
        logger.debug(`Go-UPC API error: ${response.status} ${response.statusText}`);
      }
      return null;
    }

    const data: GoUPCResponse = await response.json();

    if (!data.product) {
      logger.debug(`Product not found in Go-UPC: ${barcode}`);
      return null;
    }

    // Convert to our Product format
    const convertedProduct: Product = {
      barcode: data.code || barcode,
      product_name: data.product.name,
      brands: data.product.brand || data.product.manufacturer,
      generic_name: data.product.description,
      categories_tags: data.product.category ? (Array.isArray(data.product.category) ? data.product.category : [data.product.category]) : undefined,
      image_url: data.product.image,
      source: 'go_upc',
    };

    logger.debug(`Found product in Go-UPC: ${barcode}`);
    return convertedProduct;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Don't log timeout errors as warnings
    if (!errorMessage.includes('aborted') && !errorMessage.includes('timeout')) {
      logger.error(`Error fetching from Go-UPC for ${barcode}:`, errorMessage);
    } else {
      logger.debug(`Go-UPC timeout for ${barcode}`);
    }
    return null;
  }
}

