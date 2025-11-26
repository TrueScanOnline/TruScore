// EANData API Service (eandata.com)
// Free tier: Light use (e.g., 100/day)
// Coverage: EAN/UPC-focused, millions of items
// Registration: https://eandata.com/feed/
// Note: Basic but reliable for validation

import { Product } from '../types/product';
import { logger } from '../utils/logger';

const EANDATA_API_URL = 'https://eandata.com/feed';
const API_KEY = process.env.EXPO_PUBLIC_EANDATA_API_KEY || '';

interface EANDataResponse {
  status?: string;
  code?: string;
  name?: string;
  category?: string;
  category_string?: string;
  brand?: string;
  image?: string;
  size?: string;
  description?: string;
  attributes?: {
    [key: string]: string;
  };
}

/**
 * Fetch product from EANData API
 * 
 * @param barcode - Product barcode (UPC/EAN)
 * @returns Product object or null if not found
 */
export async function fetchProductFromEANData(barcode: string): Promise<Product | null> {
  // Skip if API key not configured
  if (!API_KEY || API_KEY.length < 5) {
    logger.debug(`EANData API key not configured, skipping lookup for ${barcode}`);
    return null;
  }

  try {
    const params = new URLSearchParams({
      v: '1.0',
      key: API_KEY,
      q: barcode,
      fmt: 'json',
    });
    const url = `${EANDATA_API_URL}/?${params.toString()}`;
    
    logger.debug(`Fetching from EANData API: ${barcode}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TrueScan-FoodScanner/1.0',
      },
    });

    if (!response.ok) {
      logger.debug(`EANData API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: EANDataResponse = await response.json();

    // Check if product found
    if (!data || data.status === 'error' || !data.name) {
      logger.debug(`EANData: Product not found for ${barcode}`);
      return null;
    }
    
    // Extract product name
    const productName = data.name || 'Unknown Product';
    
    // Extract brand
    const brand = data.brand || '';
    
    // Extract category
    const category = data.category_string || data.category || '';
    
    // Extract description
    const description = data.description || '';
    
    // Extract image
    const imageUrl = data.image || undefined;
    
    // Build product object
    const product: Product = {
      barcode: data.code || barcode,
      product_name: productName,
      product_name_en: productName,
      brands: brand,
      generic_name: description,
      categories: category,
      categories_tags: category ? [category.toLowerCase().replace(/\s+/g, '_')] : [],
      image_url: imageUrl,
      image_front_url: imageUrl,
      image_front_small_url: imageUrl,
      source: 'eandata',
      quality: calculateQuality(data),
      completion: calculateCompletion(data),
    };

    // Add additional fields if available
    if (data.size) {
      product.quantity = data.size;
    }

    logger.debug(`EANData: Found product ${productName} for ${barcode}`);
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
      logger.error(`EANData API error for ${barcode}:`, errorMessage, error?.response?.data);
    } else {
      logger.debug(`EANData API ${errorMessage.toLowerCase()} for ${barcode}`);
    }
    
    return null;
  }
}

function calculateQuality(data: EANDataResponse): number {
  let score = 0;
  if (data.name) score += 40;
  if (data.brand) score += 20;
  if (data.description) score += 20;
  if (data.image) score += 10;
  if (data.category || data.category_string) score += 10;
  
  return Math.min(score, 100);
}

function calculateCompletion(data: EANDataResponse): number {
  const fields = [
    data.name,
    data.brand,
    data.description,
    data.image,
    data.category || data.category_string,
    data.size,
  ];
  
  const filledFields = fields.filter(Boolean).length;
  return Math.round((filledFields / fields.length) * 100);
}

