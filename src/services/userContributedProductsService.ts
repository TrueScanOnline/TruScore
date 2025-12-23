// User Contributed Products Service
// Retrieves user-contributed products from Vercel backend
// This ensures all users can access products submitted by other users

import { Product, ProductWithTrustScore } from '../types/product';
import { logger } from '../utils/logger';
import { getManualProduct } from './manualProductService';
import { getBackendUrl, BackendEndpoints } from '../config/backendConfig';
import { powershellLogger } from '../utils/powershellLogger';

// Don't call getBackendUrl() at module load time - call it when needed
function getManualProductsApi(): string {
  return BackendEndpoints.manualProducts(getBackendUrl());
}

/**
 * Get user-contributed product from Vercel backend
 * This retrieves products submitted by other users worldwide
 */
export async function getUserContributedProduct(barcode: string): Promise<Product | null> {
  // ===== USER CONTRIBUTION FLOW: STEP 4 - USER B RETRIEVING DATA =====
  powershellLogger.log('INFO', 'USER_CONTRIBUTION', `User B retrieving user-contributed data`, {
    barcode,
    step: 'RETRIEVAL_START',
    timestamp: new Date().toISOString(),
  });
  
  try {
    // First check local manual products (fastest)
    powershellLogger.log('INFO', 'USER_CONTRIBUTION', `Checking local manual products`, {
      barcode,
      step: 'LOCAL_CHECK',
    });
    
    const localProduct = await getManualProduct(barcode);
    if (localProduct) {
      powershellLogger.log('SUCCESS', 'USER_CONTRIBUTION', `✅ Found local manual product`, {
        barcode,
        source: 'LOCAL',
        hasPhoto: !!localProduct.image_url,
        photoUrl: localProduct.image_url || 'NONE',
      });
      
      logger.debug(`[UserContributedProducts] Found local manual product: ${barcode}`);
      return localProduct;
    }
    
    // Then check Vercel backend for global user-contributed products
    const manualProductsApi = getManualProductsApi();
    powershellLogger.log('INFO', 'USER_CONTRIBUTION', `Checking backend for user-contributed product`, {
      barcode,
      step: 'BACKEND_CHECK',
      endpoint: manualProductsApi,
    });
    
    try {
      const retrievalStartTime = Date.now();
      
      // Add timeout to prevent 30+ second waits (Vercel function timeout is 10s, but we'll use 5s for safety)
      const TIMEOUT_MS = 5000; // 5 seconds max
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
      
      try {
        const response = await fetch(`${manualProductsApi}?barcode=${encodeURIComponent(barcode)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        const retrievalTime = Date.now() - retrievalStartTime;
        
        // CRITICAL: Get raw response text first for debugging
        const responseText = await response.text();
      
      powershellLogger.log('INFO', 'USER_CONTRIBUTION', `Backend response received`, {
        barcode,
        status: response.status,
        statusText: response.statusText,
        responseTime: `${retrievalTime}ms`,
        rawResponseLength: responseText.length,
        rawResponsePreview: responseText.substring(0, 500), // First 500 chars for debugging
      });
      
      if (response.ok) {
        let data: any = null;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          powershellLogger.log('ERROR', 'USER_CONTRIBUTION', `Failed to parse backend response as JSON`, {
            barcode,
            error: parseError instanceof Error ? parseError.message : String(parseError),
            rawResponse: responseText.substring(0, 1000),
          });
          logger.error('[UserContributedProducts] Failed to parse backend response:', parseError);
          logger.error('[UserContributedProducts] Raw response:', responseText);
        }
        
        if (data) {
          powershellLogger.log('INFO', 'USER_CONTRIBUTION', `Backend response parsed`, {
            barcode,
            success: data.success,
            hasProduct: !!data.product,
            responseKeys: Object.keys(data),
            productData: data.product ? {
              hasProductName: !!data.product.product_name,
              hasPhoto: !!data.product.image_url,
              photoUrl: data.product.image_url || 'NONE',
              hasIngredients: !!data.product.ingredients_text,
              hasNutrition: !!data.product.nutriments,
              productKeys: Object.keys(data.product),
            } : null,
            fullResponse: data, // Log full response for debugging
          });
          
          // CRITICAL FIX: Check if product exists even if success is false
          // Some backends might return product data even if success is false
          const hasProduct = data.product || (data.data && data.data.product) || (data.result && data.result.product);
          const productData = data.product || data.data?.product || data.result?.product;
          
          if (hasProduct && productData) {
          powershellLogger.log('SUCCESS', 'USER_CONTRIBUTION', `✅ Found user-contributed product from backend`, {
            barcode,
            source: 'BACKEND',
            success: data.success,
            hasPhoto: !!productData.image_url,
            photoUrl: productData.image_url || 'NONE',
            hasIngredients: !!productData.ingredients_text,
            hasNutrition: !!productData.nutriments,
            productKeys: Object.keys(productData),
          });
          
          logger.info(`[UserContributedProducts] Found user-contributed product from backend: ${barcode}`);
          
          // CRITICAL: Log image_url to debug photo retrieval
          if (productData.image_url) {
            powershellLogger.log('SUCCESS', 'USER_CONTRIBUTION', `✅ User-contributed PHOTO found`, {
              barcode,
              photoUrl: productData.image_url,
              photoSource: 'BACKEND',
            });
            
            logger.info(`[UserContributedProducts] ✅ User-contributed photo found: ${productData.image_url}`);
          } else {
            powershellLogger.log('WARN', 'USER_CONTRIBUTION', `⚠️  No photo in user-contributed product`, {
              barcode,
              hasOtherData: !!(productData.product_name || productData.ingredients_text),
              productKeys: Object.keys(productData),
            });
            
            logger.debug(`[UserContributedProducts] No image_url in user-contributed product: ${barcode}`);
          }
          
          // Use productData instead of data.product
          const product: Product = {
            barcode: productData.barcode || barcode,
            product_name: productData.product_name,
            product_name_en: productData.product_name_en || productData.product_name,
            brands: productData.brands,
            ingredients_text: productData.ingredients_text,
            image_url: productData.image_url, // CRITICAL: Include image_url from backend
            image_front_url: productData.image_url, // Also set image_front_url
            nutriments: productData.nutriments,
            manufacturing_places: productData.manufacturing_places,
            countries: productData.countries,
            categories: productData.categories,
            allergens_tags: productData.allergens_tags,
            additives_tags: productData.additives_tags,
            packaging_data: productData.packaging_data,
            serving_size: productData.serving_size,
            quantity: productData.quantity,
            source: 'user_contributed' as Product['source'],
            created_t: productData.submittedAt ? Math.floor(productData.submittedAt / 1000) : undefined,
            last_modified_t: productData.submittedAt ? Math.floor(productData.submittedAt / 1000) : undefined,
            completion: productData.completion || 50,
            quality: productData.quality || 50,
          };
          
          powershellLogger.log('SUCCESS', 'USER_CONTRIBUTION', `✅ USER B RETRIEVAL COMPLETE - Product found`, {
            barcode,
            status: 'SUCCESS',
            hasPhoto: !!product.image_url,
            photoUrl: product.image_url || 'NONE',
            willBeMerged: true,
          });
          
          return product;
          } else {
            // No product found in response
            powershellLogger.log('INFO', 'USER_CONTRIBUTION', `No product found in backend response`, {
              barcode,
              success: data.success,
              hasProduct: false,
              responseKeys: Object.keys(data),
              fullResponse: data, // Log full response to see what backend actually returned
            });
          }
        }
      } else {
        powershellLogger.log('WARN', 'USER_CONTRIBUTION', `Backend returned error status`, {
          barcode,
          status: response.status,
          statusText: response.statusText,
        });
      }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        const retrievalTime = Date.now() - retrievalStartTime;
        
        // Check if it's a timeout
        if (fetchError.name === 'AbortError' || fetchError.message?.includes('aborted')) {
          powershellLogger.log('WARN', 'USER_CONTRIBUTION', `Backend request timeout (${TIMEOUT_MS}ms)`, {
            barcode,
            responseTime: `${retrievalTime}ms`,
            error: 'Request timeout',
          });
          logger.debug(`[UserContributedProducts] Backend request timeout for ${barcode} after ${retrievalTime}ms`);
        } else {
          powershellLogger.log('ERROR', 'USER_CONTRIBUTION', `Backend retrieval error`, {
            barcode,
            error: fetchError instanceof Error ? fetchError.message : String(fetchError),
            responseTime: `${retrievalTime}ms`,
          });
          logger.debug('[UserContributedProducts] Backend unavailable, using local only:', fetchError);
        }
        // Continue - not critical (timeout is handled gracefully)
      }
    } catch (backendError) {
      powershellLogger.log('ERROR', 'USER_CONTRIBUTION', `Backend retrieval error`, {
        barcode,
        error: backendError instanceof Error ? backendError.message : String(backendError),
      });
      
      logger.debug('[UserContributedProducts] Backend unavailable, using local only:', backendError);
      // Continue - not critical
    }
    
    powershellLogger.log('INFO', 'USER_CONTRIBUTION', `No user-contributed product found`, {
      barcode,
      checkedSources: ['LOCAL', 'BACKEND'],
      result: 'NOT_FOUND',
    });
    
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
