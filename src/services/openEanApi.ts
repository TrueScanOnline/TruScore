/**
 * OpenEAN API Service
 * Free EAN database (similar to UPCitemdb)
 * URL: https://openean.com/
 * Status: Free, no API key required
 */

import { Product } from '../types/product';
import { logger } from '../utils/logger';
import { fetchWithRateLimit } from '../utils/timeoutHelper';
import { isCircuitOpen, recordFailure, recordSuccess } from './circuitBreakerService';

const OPENEAN_API_BASE = 'https://openean.com/api';

export interface OpenEANResponse {
  ean: string;
  name?: string;
  description?: string;
  image?: string;
  brand?: string;
  category?: string;
  error?: string;
}

/**
 * Fetch product from OpenEAN
 */
export async function fetchProductFromOpenEAN(barcode: string): Promise<Product | null> {
  // CRITICAL FIX: Check circuit breaker before querying
  if (isCircuitOpen('openean')) {
    logger.debug('[OpenEAN] Circuit breaker OPEN, skipping query');
    return null;
  }
  
  try {
    const url = `${OPENEAN_API_BASE}?ean=${barcode}`;
    
    const response = await fetchWithRateLimit(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Rveel/1.0',
      },
    }, 'openean');

    if (!response.ok) {
      if (response.status === 404) {
        recordSuccess('openean'); // 404 is expected, not a failure
        return null; // Product not found
      }
      logger.debug(`OpenEAN API error: ${response.status}`);
      recordFailure('openean');
      return null;
    }

    const data: OpenEANResponse = await response.json();

    if (data.error || !data.ean) {
      recordSuccess('openean'); // No error, just no data
      return null;
    }

    // Convert to Product format
    const product: Product = {
      barcode: data.ean,
      product_name: data.name || data.description || `Product ${data.ean}`,
      product_name_en: data.name || data.description,
      brands: data.brand || undefined,
      image_url: data.image || undefined,
      source: 'openean',
      quality: 40, // Moderate quality (fallback source)
      completion: 30,
    };

    recordSuccess('openean');
    return product;
  } catch (error) {
    logger.debug('Error fetching from OpenEAN:', error);
    recordFailure('openean');
    return null;
  }
}

