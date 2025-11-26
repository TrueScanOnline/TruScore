// Barcode Lookup API Service (barcodelookup.com)
// Free tier: 100 lookups/day
// Coverage: Product database
// Registration: https://www.barcodelookup.com/api

import { Product } from '../types/product';
import { logger } from '../utils/logger';

const BARCODE_LOOKUP_API_URL = 'https://api.barcodelookup.com/v3/products';
const API_KEY = process.env.EXPO_PUBLIC_BARCODE_LOOKUP_API_KEY || '';

interface BarcodeLookupResponse {
  products?: Array<{
    barcode_number?: string;
    barcode_type?: string;
    barcode_formats?: string;
    mpn?: string;
    model?: string;
    asin?: string;
    product_name?: string;
    title?: string;
    category?: string;
    manufacturer?: string;
    brand?: string;
    label?: string;
    author?: string;
    publisher?: string;
    artist?: string;
    actor?: string;
    director?: string;
    studio?: string;
    genre?: string;
    audience_rating?: string;
    ingredients?: string;
    nutrition_facts?: string;
    color?: string;
    format?: string;
    package_quantity?: string;
    size?: string;
    length?: string;
    width?: string;
    height?: string;
    weight?: string;
    release_date?: string;
    description?: string;
    images?: string[];
    stores?: Array<{
      name?: string;
      country?: string;
      currency?: string;
      currency_symbol?: string;
      price?: string;
      sale_price?: string;
      tax?: string;
      link?: string;
      item_id?: string;
      availability?: string;
      condition?: string;
      shipping?: string;
      last_update?: string;
    }>;
    reviews?: Array<{
      name?: string;
      rating?: number;
      title?: string;
      review?: string;
      date?: string;
    }>;
  }>;
}

/**
 * Fetch product from Barcode Lookup API
 * 
 * @param barcode - Product barcode (UPC/EAN)
 * @returns Product object or null if not found
 */
export async function fetchProductFromBarcodeLookup(barcode: string): Promise<Product | null> {
  // Skip if API key not configured
  if (!API_KEY || API_KEY.length < 10) {
    logger.debug(`Barcode Lookup API key not configured, skipping lookup for ${barcode}`);
    return null;
  }

  try {
    const url = `${BARCODE_LOOKUP_API_URL}?barcode=${barcode}&formatted=y&key=${API_KEY}`;
    
    logger.debug(`Fetching from Barcode Lookup API: ${barcode}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TrueScan-FoodScanner/1.0',
      },
    });

    if (!response.ok) {
      logger.debug(`Barcode Lookup API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: BarcodeLookupResponse = await response.json();

    // Check if product found
    if (!data || !data.products || data.products.length === 0) {
      logger.debug(`Barcode Lookup: Product not found for ${barcode}`);
      return null;
    }

    const item = data.products[0];
    
    // Extract product name (prefer product_name, fallback to title)
    const productName = item.product_name || item.title || 'Unknown Product';
    
    // Extract brand (prefer brand, fallback to manufacturer)
    const brand = item.brand || item.manufacturer || '';
    
    // Extract description
    const description = item.description || '';
    
    // Extract category
    const category = item.category || '';
    
    // Extract images (use first image if available)
    const imageUrl = item.images && item.images.length > 0 ? item.images[0] : undefined;
    
    // Extract ingredients
    const ingredients = item.ingredients || '';
    
    // Build product object
    const product: Product = {
      barcode: item.barcode_number || barcode,
      product_name: productName,
      product_name_en: productName,
      brands: brand,
      generic_name: description,
      categories: category,
      categories_tags: category ? [category.toLowerCase().replace(/\s+/g, '_')] : [],
      image_url: imageUrl,
      image_front_url: imageUrl,
      image_front_small_url: imageUrl,
      ingredients_text: ingredients,
      source: 'barcode_lookup',
      quality: calculateQuality(item),
      completion: calculateCompletion(item),
    };

    // Add additional fields if available
    if (item.size || item.weight) {
      product.quantity = [item.size, item.weight].filter(Boolean).join(', ');
    }
    
    if (item.length || item.width || item.height) {
      const dimensions = [item.length, item.width, item.height].filter(Boolean).join(' x ');
      if (dimensions) {
        product.packaging = dimensions;
      }
    }

    logger.debug(`Barcode Lookup: Found product ${productName} for ${barcode}`);
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
      logger.error(`Barcode Lookup API error for ${barcode}:`, errorMessage, error?.response?.data);
    } else {
      logger.debug(`Barcode Lookup API ${errorMessage.toLowerCase()} for ${barcode}`);
    }
    
    return null;
  }
}

function calculateQuality(item: NonNullable<BarcodeLookupResponse['products']>[number] | undefined): number {
  if (!item) return 0;
  
  let score = 0;
  if (item.product_name || item.title) score += 30;
  if (item.brand || item.manufacturer) score += 20;
  if (item.description) score += 15;
  if (item.ingredients) score += 15;
  if (item.images && item.images.length > 0) score += 10;
  if (item.category) score += 10;
  
  return Math.min(score, 100);
}

function calculateCompletion(item: NonNullable<BarcodeLookupResponse['products']>[number] | undefined): number {
  if (!item) return 0;
  
  const fields = [
    item.product_name || item.title,
    item.brand || item.manufacturer,
    item.description,
    item.ingredients,
    item.images && item.images.length > 0,
    item.category,
  ];
  
  const filledFields = fields.filter(Boolean).length;
  return Math.round((filledFields / fields.length) * 100);
}

