/**
 * Product Cache Service
 * 
 * Handles all caching operations for products including:
 * - SQLite database lookups (offline-first)
 * - AsyncStorage cache lookups
 * - Cache persistence
 * - User-contributed data merging
 * 
 * @module productCacheService
 */

import { Product, ProductWithTrustScore } from '../types/product';
import { getCachedProduct, cacheProduct } from './cacheService';
import { lookupProductInSQLite, saveProductToSQLite } from './sqliteProductDatabase';
import { getUserCountryCode } from '../utils/countryDetection';
import { getUserContributedProduct } from './userContributedProductsService';
import { extractPalmOilAnalysis } from './openFoodFacts';
import { applyConfidenceScore } from '../utils/confidenceScoring';
import { calculateTrustScore } from '../utils/trustScore';
import { normalizeBarcode, getPrimaryBarcode } from '../utils/barcodeNormalization';
import { isWebSearchFallback } from './webSearchFallback';
import { logger } from '../utils/logger';
// CRITICAL FIX: Use dynamic import to break require cycle
// import { handleError, ErrorCategory, ErrorSeverity } from './errorHandlingService';

/**
 * Check if cached product is low quality and should be retried
 */
export function isLowQualityCache(cached: Product, isOffline: boolean): boolean {
  if (isOffline) return false; // Don't retry if offline
  
  const isLowQualityWebSearch = (cached.source === 'web_search' || isWebSearchFallback(cached)) && 
                                ((cached.quality && cached.quality < 50) || 
                                 (cached.completion && cached.completion < 50) ||
                                 (!cached.image_url && !cached.nutriments && !cached.ingredients_text));
  
  return isLowQualityWebSearch;
}

/**
 * Enhance product with computed fields (palm oil analysis, etc.)
 */
export function enhanceProductWithComputedFields(product: Product): Product {
  const hasIngredientsText = product.ingredients_text && typeof product.ingredients_text === 'string' && product.ingredients_text.trim().length > 0;
  const hasAnalysisTags = Array.isArray(product.ingredients_analysis_tags) && product.ingredients_analysis_tags.length > 0;
  const hasAnalysis = product.ingredients_analysis && typeof product.ingredients_analysis === 'object' && Object.keys(product.ingredients_analysis).length > 0;
  
  if (hasIngredientsText || hasAnalysisTags || hasAnalysis) {
    try {
      product.palm_oil_analysis = extractPalmOilAnalysis(product);
    } catch (error) {
      logger.debug('Error extracting palm oil analysis:', error);
    }
  }
  
  return product;
}

/**
 * Merge user-contributed data into product with HIGHEST PRIORITY
 */
export async function mergeUserContributedData(product: Product, barcode: string): Promise<Product> {
  try {
    const userContributedProduct = await getUserContributedProduct(barcode);
    if (!userContributedProduct) {
      return product;
    }
    
    logger.info(`[ProductCacheService] Merging user-contributed data: ${barcode}`);
    
    // Merge ALL user-contributed fields - user data takes priority over database data
    if (userContributedProduct.image_url) {
      product.image_url = userContributedProduct.image_url;
      product.image_front_url = userContributedProduct.image_url;
    }
    
    if (userContributedProduct.nutriments && Object.keys(userContributedProduct.nutriments).length > 0) {
      product.nutriments = { ...product.nutriments, ...userContributedProduct.nutriments };
    }
    
    if (userContributedProduct.ingredients_text && userContributedProduct.ingredients_text.trim().length > 0) {
      product.ingredients_text = userContributedProduct.ingredients_text;
    }
    
    if (userContributedProduct.manufacturing_places) {
      product.manufacturing_places = userContributedProduct.manufacturing_places;
      if (userContributedProduct.manufacturing_places_tags) {
        product.manufacturing_places_tags = userContributedProduct.manufacturing_places_tags;
      }
    }
    
    if (userContributedProduct.countries) {
      product.countries = userContributedProduct.countries;
      if (userContributedProduct.countries_tags) {
        product.countries_tags = userContributedProduct.countries_tags;
      }
    }
    
    if (userContributedProduct.origins) {
      product.origins = userContributedProduct.origins;
      if (userContributedProduct.origins_tags) {
        product.origins_tags = userContributedProduct.origins_tags;
      }
    }
    
    if (userContributedProduct.packaging_data) {
      product.packaging_data = userContributedProduct.packaging_data;
    }
    
    if (userContributedProduct.packagings) {
      product.packagings = userContributedProduct.packagings;
    }
    
    if (userContributedProduct.serving_size) {
      product.serving_size = userContributedProduct.serving_size;
    }
    
    if (userContributedProduct.allergens_tags && userContributedProduct.allergens_tags.length > 0) {
      product.allergens_tags = userContributedProduct.allergens_tags;
    }
    
    if (userContributedProduct.additives_tags && userContributedProduct.additives_tags.length > 0) {
      product.additives_tags = userContributedProduct.additives_tags;
    }
    
    logger.debug(`[ProductCacheService] ✅ User-contributed data merged`);
    return product;
  } catch (error) {
    // Use dynamic import to break require cycle
    const { handleError, ErrorCategory, ErrorSeverity } = await import('./errorHandlingService');
    handleError(error, ErrorCategory.DATABASE, ErrorSeverity.LOW, { barcode });
    return product;
  }
}

/**
 * Process and score a product (apply confidence score and calculate TruScore)
 */
export async function processAndScoreProduct(product: Product): Promise<ProductWithTrustScore> {
  const productWithConfidence = applyConfidenceScore(product);
  
  try {
    const finalProduct = await calculateTrustScore(productWithConfidence);
    return finalProduct;
  } catch (error) {
    logger.error('Error calculating TruScore (non-critical):', error);
    return {
      ...productWithConfidence,
      trust_score: null,
      trust_score_breakdown: null,
    };
  }
}

/**
 * Save product to SQLite database
 */
export async function saveProductToCache(product: ProductWithTrustScore, barcode: string, isPremium: boolean): Promise<void> {
  try {
    const userCountry = getUserCountryCode();
    
    // Save to AsyncStorage cache
    await cacheProduct(product, isPremium);
    
    // Also save to SQLite for offline-first lookups
    await saveProductToSQLite(product, userCountry ?? undefined);
    
    logger.debug(`[ProductCacheService] ✅ Product cached: ${barcode}`);
  } catch (error) {
    // Use dynamic import to break require cycle
    const { handleError, ErrorCategory, ErrorSeverity } = await import('./errorHandlingService');
    handleError(error, ErrorCategory.DATABASE, ErrorSeverity.LOW, { barcode });
    // Non-critical - continue even if caching fails
  }
}

/**
 * OPTIMIZED: Lookup product from SQLite database
 * Now uses parallel lookup with cache for faster results
 */
export async function lookupFromSQLite(barcode: string): Promise<Product | null> {
  try {
    const userCountry = getUserCountryCode();
    const primaryBarcode = getPrimaryBarcode(barcode);
    const product = await lookupProductInSQLite(primaryBarcode, userCountry ?? undefined);
    
    if (product) {
      logger.debug(`[ProductCacheService] Found in SQLite: ${primaryBarcode}`);
      return product;
    }
    
    return null;
  } catch (error) {
    // Use dynamic import to break require cycle
    const { handleError, ErrorCategory, ErrorSeverity } = await import('./errorHandlingService');
    handleError(error, ErrorCategory.DATABASE, ErrorSeverity.LOW, { barcode });
    return null;
  }
}

/**
 * OPTIMIZED: Parallel cache lookups for faster results
 * Checks SQLite and AsyncStorage in parallel
 */
export async function lookupProductFast(barcode: string, isPremium: boolean, barcodeVariants: string[]): Promise<Product | null> {
  try {
    // Check SQLite and AsyncStorage in parallel for fastest result
    const [sqliteProduct, cachedProduct] = await Promise.all([
      lookupFromSQLite(barcode),
      lookupFromCache(barcode, isPremium, barcodeVariants),
    ]);
    
    // Return fastest result (SQLite is usually faster, but cache might have more recent data)
    return sqliteProduct || cachedProduct;
  } catch (error) {
    // Use dynamic import to break require cycle
    const { handleError, ErrorCategory, ErrorSeverity } = await import('./errorHandlingService');
    handleError(error, ErrorCategory.DATABASE, ErrorSeverity.LOW, { barcode });
    return null;
  }
}

/**
 * Lookup product from AsyncStorage cache
 */
export async function lookupFromCache(barcode: string, isPremium: boolean, barcodeVariants: string[]): Promise<Product | null> {
  try {
    for (const variant of barcodeVariants) {
      const cached = await getCachedProduct(variant, isPremium);
      if (cached) {
        logger.debug(`[ProductCacheService] Found in cache: ${variant}`);
        return cached;
      }
    }
    return null;
  } catch (error) {
    // Use dynamic import to break require cycle
    const { handleError, ErrorCategory, ErrorSeverity } = await import('./errorHandlingService');
    handleError(error, ErrorCategory.DATABASE, ErrorSeverity.LOW, { barcode });
    return null;
  }
}

/**
 * Process SQLite product: enhance, merge user data, score, and return
 */
export async function processSQLiteProduct(
  sqliteProduct: Product,
  barcode: string
): Promise<ProductWithTrustScore> {
  // Enhance with computed fields
  enhanceProductWithComputedFields(sqliteProduct);
  
  // Merge user-contributed data
  const mergedProduct = await mergeUserContributedData(sqliteProduct, barcode);
  
  // Save merged product back to SQLite
  try {
    const userCountry = getUserCountryCode();
    await saveProductToSQLite(mergedProduct, userCountry ?? undefined);
  } catch (error) {
    logger.debug('[ProductCacheService] Failed to save merged product to SQLite (non-critical):', error);
  }
  
  // Process and score
  const scoredProduct = await processAndScoreProduct(mergedProduct);
  
  // Save final product with TruScore
  try {
    const userCountry = getUserCountryCode();
    await saveProductToSQLite(scoredProduct, userCountry ?? undefined);
  } catch (error) {
    logger.debug('[ProductCacheService] Failed to save final product to SQLite (non-critical):', error);
  }
  
  return scoredProduct;
}

/**
 * Process cached product: enhance, merge user data, score, and return
 */
export async function processCachedProduct(
  cachedProduct: Product,
  barcode: string
): Promise<ProductWithTrustScore> {
  // Enhance with computed fields
  enhanceProductWithComputedFields(cachedProduct);
  
  // Merge user-contributed data
  const mergedProduct = await mergeUserContributedData(cachedProduct, barcode);
  
  // Save merged product to SQLite
  try {
    const userCountry = getUserCountryCode();
    await saveProductToSQLite(mergedProduct, userCountry ?? undefined);
  } catch (error) {
    logger.debug('[ProductCacheService] Failed to save merged cached product to SQLite (non-critical):', error);
  }
  
  // Process and score
  const scoredProduct = await processAndScoreProduct(mergedProduct);
  
  // Save final product with TruScore
  try {
    const userCountry = getUserCountryCode();
    await saveProductToSQLite(scoredProduct, userCountry ?? undefined);
  } catch (error) {
    logger.debug('[ProductCacheService] Failed to save final cached product to SQLite (non-critical):', error);
  }
  
  return scoredProduct;
}

