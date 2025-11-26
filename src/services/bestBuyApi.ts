// Best Buy API Service
// Free tier: 5,000 requests/day
// Coverage: Electronics products
// Registration: https://developer.bestbuy.com/

import { Product } from '../types/product';
import { logger } from '../utils/logger';

const BESTBUY_API_BASE = 'https://api.bestbuy.com/v1/products';
const API_KEY = process.env.EXPO_PUBLIC_BESTBUY_API_KEY || '';

interface BestBuyProductResponse {
  products?: Array<{
    sku?: number;
    name?: string;
    upc?: string;
    salePrice?: number;
    regularPrice?: number;
    onSale?: boolean;
    shortDescription?: string;
    longDescription?: string;
    manufacturer?: string;
    modelNumber?: string;
    image?: string;
    largeImage?: string;
    thumbnailImage?: string;
    customerReviewAverage?: number;
    customerReviewCount?: number;
    categoryPath?: Array<{
      id?: string;
      name?: string;
    }>;
    color?: string;
    depth?: string;
    height?: string;
    weight?: string;
    width?: string;
    features?: Array<{
      feature?: string;
    }>;
    specifications?: Array<{
      name?: string;
      value?: string;
    }>;
  }>;
  total?: number;
  totalPages?: number;
  currentPage?: number;
}

/**
 * Fetch product from Best Buy API
 * 
 * @param barcode - Product barcode (UPC/EAN)
 * @returns Product object or null if not found
 */
export async function fetchProductFromBestBuy(barcode: string): Promise<Product | null> {
  // Skip if API key not configured
  if (!API_KEY || API_KEY.length < 10) {
    logger.debug(`Best Buy API key not configured, skipping lookup for ${barcode}`);
    return null;
  }

  try {
    const params = new URLSearchParams({
      apiKey: API_KEY,
      format: 'json',
      show: 'sku,name,upc,salePrice,regularPrice,onSale,shortDescription,longDescription,manufacturer,modelNumber,image,largeImage,thumbnailImage,customerReviewAverage,customerReviewCount,categoryPath,color,depth,height,weight,width,features,specifications',
    });
    const url = `${BESTBUY_API_BASE}(upc=${barcode})?${params.toString()}`;
    
    logger.debug(`Fetching from Best Buy API: ${barcode}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TrueScan-FoodScanner/1.0',
      },
    });

    if (!response.ok) {
      logger.debug(`Best Buy API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: BestBuyProductResponse = await response.json();

    // Check if product found
    if (!data || !data.products || data.products.length === 0) {
      logger.debug(`Best Buy: Product not found for ${barcode}`);
      return null;
    }

    const item = data.products[0];
    
    // Extract product name
    const productName = item.name || 'Unknown Product';
    
    // Extract brand/manufacturer
    const brand = item.manufacturer || '';
    
    // Extract description
    const description = item.longDescription || item.shortDescription || '';
    
    // Extract category
    const category = item.categoryPath?.[item.categoryPath.length - 1]?.name || '';
    
    // Extract images (prefer largeImage, fallback to image, then thumbnail)
    const imageUrl = item.largeImage || item.image || item.thumbnailImage || undefined;
    
    // Extract features/specifications
    const features = item.features?.map((f: { feature?: string }) => f.feature).filter(Boolean).join(', ') || '';
    const specifications = item.specifications?.map((s: { name?: string; value?: string }) => `${s.name}: ${s.value}`).filter(Boolean).join(', ') || '';
    const additionalInfo = [features, specifications].filter(Boolean).join(' | ');
    
    // Build product object
    const product: Product = {
      barcode: item.upc || barcode,
      product_name: productName,
      product_name_en: productName,
      brands: brand,
      generic_name: description,
      categories: category,
      categories_tags: category ? [category.toLowerCase().replace(/\s+/g, '_')] : [],
      image_url: imageUrl,
      image_front_url: imageUrl,
      image_front_small_url: item.thumbnailImage || imageUrl,
      source: 'bestbuy',
      quality: calculateQuality(item),
      completion: calculateCompletion(item),
    };

    // Add additional fields if available
    if (item.weight || item.depth || item.height || item.width) {
      const dimensions = [item.depth, item.width, item.height].filter(Boolean).join(' x ');
      if (dimensions) {
        product.packaging = dimensions;
      }
      if (item.weight) {
        product.quantity = item.weight;
      }
    }
    
    if (item.color) {
      product.categories_tags = [
        ...(product.categories_tags || []),
        `color_${item.color.toLowerCase().replace(/\s+/g, '_')}`,
      ];
    }

    logger.debug(`Best Buy: Found product ${productName} for ${barcode}`);
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
      logger.error(`Best Buy API error for ${barcode}:`, errorMessage, error?.response?.data);
    } else {
      logger.debug(`Best Buy API ${errorMessage.toLowerCase()} for ${barcode}`);
    }
    
    return null;
  }
}

function calculateQuality(item: NonNullable<BestBuyProductResponse['products']>[number] | undefined): number {
  if (!item) return 0;
  
  let score = 0;
  if (item.name) score += 30;
  if (item.manufacturer) score += 20;
  if (item.longDescription || item.shortDescription) score += 20;
  if (item.largeImage || item.image) score += 15;
  if (item.categoryPath && item.categoryPath.length > 0) score += 10;
  if (item.features && item.features.length > 0) score += 5;
  
  return Math.min(score, 100);
}

function calculateCompletion(item: NonNullable<BestBuyProductResponse['products']>[number] | undefined): number {
  if (!item) return 0;
  
  const fields = [
    item.name,
    item.manufacturer,
    item.longDescription || item.shortDescription,
    item.largeImage || item.image,
    item.categoryPath && item.categoryPath.length > 0,
    item.features && item.features.length > 0,
  ];
  
  const filledFields = fields.filter(Boolean).length;
  return Math.round((filledFields / fields.length) * 100);
}

