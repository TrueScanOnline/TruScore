// User Contributed Products Service
// Retrieves user-contributed products from Vercel backend
// This ensures all users can access products submitted by other users

import { Product, ProductWithTrustScore } from '../types/product';
import { logger } from '../utils/logger';
import { getManualProduct } from './manualProductService';
import { getBackendUrl, BackendEndpoints } from '../config/backendConfig';

const MANUAL_PRODUCTS_API = BackendEndpoints.manualProducts(getBackendUrl());

/**
 * Get user-contributed product from Vercel backend
 * This retrieves products submitted by other users worldwide
 */
export async function getUserContributedProduct(barcode: string): Promise<Product | null> {
  try {
    // First check local manual products (fastest)
    const localProduct = await getManualProduct(barcode);
    if (localProduct) {
      logger.debug(`[UserContributedProducts] Found local manual product: ${barcode}`);
      return localProduct;
    }
    
    // Then check Vercel backend for global user-contributed products
    try {
      const response = await fetch(`${MANUAL_PRODUCTS_API}?barcode=${encodeURIComponent(barcode)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.product) {
          logger.info(`[UserContributedProducts] Found user-contributed product from backend: ${barcode}`);
          
          // Convert backend product to Product format
          const product: Product = {
            barcode: data.product.barcode,
            product_name: data.product.product_name,
            product_name_en: data.product.product_name_en || data.product.product_name,
            brands: data.product.brands,
            ingredients_text: data.product.ingredients_text,
            image_url: data.product.image_url,
            nutriments: data.product.nutriments,
            manufacturing_places: data.product.manufacturing_places,
            countries: data.product.countries,
            categories: data.product.categories,
            allergens_tags: data.product.allergens_tags,
            additives_tags: data.product.additives_tags,
            packaging_data: data.product.packaging_data,
            serving_size: data.product.serving_size,
            quantity: data.product.quantity,
            source: 'user_contributed' as Product['source'],
            created_t: data.product.submittedAt ? Math.floor(data.product.submittedAt / 1000) : undefined,
            last_modified_t: data.product.submittedAt ? Math.floor(data.product.submittedAt / 1000) : undefined,
            completion: data.product.completion || 50,
            quality: data.product.quality || 50,
          };
          
          return product;
        }
      }
    } catch (backendError) {
      logger.debug('[UserContributedProducts] Backend unavailable, using local only:', backendError);
      // Continue - not critical
    }
    
    return null;
  } catch (error) {
    logger.error('[UserContributedProducts] Error getting user-contributed product:', error);
    return null;
  }
}

/**
 * Check if a product exists in user-contributed databases
 * This is used to avoid showing "UNKNOWN PRODUCT" when user data exists
 */
export async function hasUserContributedProduct(barcode: string): Promise<boolean> {
  try {
    const product = await getUserContributedProduct(barcode);
    return product !== null;
  } catch (error) {
    return false;
  }
}
