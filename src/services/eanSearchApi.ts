// EAN-Search.org API Service
// Free tier: Requires API key registration
// Coverage: 1B+ products worldwide (all categories)
// URL: https://api.ean-search.org/

import axios from 'axios';
import { Product } from '../types/product';
import { logger } from '../utils/logger';

const EAN_SEARCH_API_URL = 'https://api.ean-search.org/api';
const API_KEY = process.env.EXPO_PUBLIC_EAN_SEARCH_API_KEY || '';

interface EANSearchResponse {
  ean: string;
  name: string;
  categoryId?: number;
  categoryName?: string;
  issn?: string;
  publisher?: string;
  images?: string[];
  attributes?: {
    title?: string;
    description?: string;
    brand?: string;
    manufacturer?: string;
    model?: string;
    color?: string;
    size?: string;
    weight?: string;
    dimensions?: string;
  };
}

/**
 * Fetch product from EAN-Search.org API
 * 
 * API Documentation: https://www.ean-search.org/ean-database-api.html
 * Free tier: Requires API key registration
 * 
 * @param barcode - Product barcode (EAN/UPC)
 * @returns Product object or null if not found
 */
export async function fetchProductFromEANSearch(barcode: string): Promise<Product | null> {
  // Skip if API key not configured
  if (!API_KEY || API_KEY.length < 10) {
    logger.debug(`EAN-Search API key not configured, skipping lookup for ${barcode}`);
    return null;
  }

  try {
    // EAN-Search API endpoint for barcode lookup
    // Format: https://api.ean-search.org/api?op=barcode-lookup&code={barcode}&token={token}&format=json
    const url = `${EAN_SEARCH_API_URL}?op=barcode-lookup&code=${encodeURIComponent(barcode)}&token=${API_KEY}&format=json`;
    
    logger.debug(`Fetching from EAN-Search API: ${barcode}`);
    
    const response = await axios.get<EANSearchResponse>(url, {
      timeout: 10000, // 10 second timeout
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TrueScan-FoodScanner/1.0',
      },
    });

    // Check if product found
    if (!response.data || !response.data.ean) {
      logger.debug(`EAN-Search: Product not found for ${barcode}`);
      return null;
    }

    const data = response.data;
    
    // Extract product name (prefer attributes.title, fallback to name)
    const productName = data.attributes?.title || data.name || 'Unknown Product';
    
    // Extract brand (from attributes.brand or publisher)
    const brand = data.attributes?.brand || data.publisher || data.attributes?.manufacturer || '';
    
    // Extract description
    const description = data.attributes?.description || '';
    
    // Extract images (use first image if available)
    const imageUrl = data.images && data.images.length > 0 ? data.images[0] : undefined;
    
    // Extract category
    const category = data.categoryName || data.attributes?.title || '';
    
    // Build product object
    const product: Product = {
      barcode: data.ean,
      product_name: productName,
      product_name_en: productName,
      brands: brand,
      generic_name: description,
      image_url: imageUrl,
      image_front_url: imageUrl,
      image_front_small_url: imageUrl,
      categories: category,
      categories_tags: category ? [category.toLowerCase().replace(/\s+/g, '_')] : [],
      source: 'ean_search',
      quality: calculateQuality(data),
      completion: calculateCompletion(data),
    };

    // Add additional attributes if available
    if (data.attributes) {
      // Add size/weight information to quantity field
      if (data.attributes.size || data.attributes.weight) {
        product.quantity = [data.attributes.size, data.attributes.weight].filter(Boolean).join(', ');
      }
      
      // Add color to categories if available
      if (data.attributes.color) {
        product.categories_tags = [
          ...(product.categories_tags || []),
          `color_${data.attributes.color.toLowerCase().replace(/\s+/g, '_')}`,
        ];
      }
    }

    logger.debug(`EAN-Search: Found product ${productName} for ${barcode}`);
    return product;

  } catch (error: any) {
    // Suppress expected errors (product not found, rate limits, network issues)
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
      logger.error(`EAN-Search API error for ${barcode}:`, errorMessage, error?.response?.data);
    } else {
      logger.debug(`EAN-Search API ${errorMessage.toLowerCase()} for ${barcode}`);
    }
    
    return null;
  }
}

/**
 * Calculate data quality score (0-100) based on available fields
 */
function calculateQuality(data: EANSearchResponse): number {
  let score = 0;
  
  // Base score for having product name
  if (data.name || data.attributes?.title) score += 30;
  
  // Additional score for brand/manufacturer
  if (data.attributes?.brand || data.attributes?.manufacturer || data.publisher) score += 20;
  
  // Additional score for description
  if (data.attributes?.description) score += 20;
  
  // Additional score for images
  if (data.images && data.images.length > 0) score += 15;
  
  // Additional score for category
  if (data.categoryName) score += 10;
  
  // Additional score for additional attributes
  if (data.attributes) {
    if (data.attributes.size || data.attributes.weight) score += 5;
  }
  
  return Math.min(score, 100);
}

/**
 * Calculate data completion score (0-100) based on available fields
 */
function calculateCompletion(data: EANSearchResponse): number {
  const fields = [
    data.name || data.attributes?.title,
    data.attributes?.brand || data.attributes?.manufacturer || data.publisher,
    data.attributes?.description,
    data.images && data.images.length > 0,
    data.categoryName,
    data.attributes?.size || data.attributes?.weight,
  ];
  
  const filledFields = fields.filter(Boolean).length;
  return Math.round((filledFields / fields.length) * 100);
}

