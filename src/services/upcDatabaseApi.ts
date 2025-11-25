// UPC Database API Service (upcdatabase.org)
// Free tier: 100 lookups/day
// Coverage: 4.3M+ products worldwide
// Registration: https://www.upcdatabase.com/api

import axios from 'axios';
import { Product } from '../types/product';
import { logger } from '../utils/logger';

const UPC_DATABASE_API_URL = 'https://api.upcdatabase.org/product';
const API_KEY = process.env.EXPO_PUBLIC_UPC_DATABASE_API_KEY || '';

interface UPCDatabaseResponse {
  success: boolean;
  code?: string;
  total?: number;
  offset?: number;
  items?: Array<{
    ean?: string;
    title?: string;
    description?: string;
    upc?: string;
    brand?: string;
    model?: string;
    color?: string;
    size?: string;
    dimension?: string;
    weight?: string;
    category?: string;
    currency?: string;
    lowest_recorded_price?: number;
    highest_recorded_price?: number;
    images?: string[];
  }>;
}

/**
 * Fetch product from UPC Database API
 * 
 * @param barcode - Product barcode (UPC/EAN)
 * @returns Product object or null if not found
 */
export async function fetchProductFromUPCDatabase(barcode: string): Promise<Product | null> {
  // Skip if API key not configured
  if (!API_KEY || API_KEY.length < 10) {
    logger.debug(`UPC Database API key not configured, skipping lookup for ${barcode}`);
    return null;
  }

  try {
    const url = `${UPC_DATABASE_API_URL}/${barcode}?apikey=${API_KEY}`;
    
    logger.debug(`Fetching from UPC Database API: ${barcode}`);
    
    const response = await axios.get<UPCDatabaseResponse>(url, {
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TrueScan-FoodScanner/1.0',
      },
    });

    // Check if product found
    if (!response.data || !response.data.success || !response.data.items || response.data.items.length === 0) {
      logger.debug(`UPC Database: Product not found for ${barcode}`);
      return null;
    }

    const item = response.data.items[0];
    
    // Extract product name
    const productName = item.title || 'Unknown Product';
    
    // Extract brand
    const brand = item.brand || '';
    
    // Extract description
    const description = item.description || '';
    
    // Extract images (use first image if available)
    const imageUrl = item.images && item.images.length > 0 ? item.images[0] : undefined;
    
    // Extract category
    const category = item.category || '';
    
    // Build product object
    const product: Product = {
      barcode: item.ean || item.upc || barcode,
      product_name: productName,
      product_name_en: productName,
      brands: brand,
      generic_name: description,
      categories: category,
      categories_tags: category ? [category.toLowerCase().replace(/\s+/g, '_')] : [],
      image_url: imageUrl,
      image_front_url: imageUrl,
      image_front_small_url: imageUrl,
      source: 'upc_database',
      quality: calculateQuality(item),
      completion: calculateCompletion(item),
    };

    // Add additional fields if available
    if (item.size || item.weight) {
      product.quantity = [item.size, item.weight].filter(Boolean).join(', ');
    }
    
    if (item.dimension) {
      product.packaging = item.dimension;
    }

    logger.debug(`UPC Database: Found product ${productName} for ${barcode}`);
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
      logger.error(`UPC Database API error for ${barcode}:`, errorMessage, error?.response?.data);
    } else {
      logger.debug(`UPC Database API ${errorMessage.toLowerCase()} for ${barcode}`);
    }
    
    return null;
  }
}

function calculateQuality(item: UPCDatabaseResponse['items']?[0]): number {
  if (!item) return 0;
  
  let score = 0;
  if (item.title) score += 30;
  if (item.brand) score += 20;
  if (item.description) score += 20;
  if (item.images && item.images.length > 0) score += 15;
  if (item.category) score += 10;
  if (item.size || item.weight) score += 5;
  
  return Math.min(score, 100);
}

function calculateCompletion(item: UPCDatabaseResponse['items']?[0]): number {
  if (!item) return 0;
  
  const fields = [
    item.title,
    item.brand,
    item.description,
    item.images && item.images.length > 0,
    item.category,
    item.size || item.weight,
  ];
  
  const filledFields = fields.filter(Boolean).length;
  return Math.round((filledFields / fields.length) * 100);
}

