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
import { powershellLogger } from '../utils/powershellLogger';
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
  // ===== USER CONTRIBUTION FLOW: STEP 5 - MERGING USER-CONTRIBUTED DATA =====
  // User-contributed merge uses the same timeout as the backend fetch (see userContributedProductsService)
  powershellLogger.log('INFO', 'USER_CONTRIBUTION', `Starting merge of user-contributed data`, {
    barcode,
    step: 'MERGE_START',
    currentProductHasPhoto: !!product.image_url,
    currentPhotoUrl: product.image_url || 'NONE',
  });
  
  try {
    const userContributedProduct = await getUserContributedProduct(barcode);
    
    if (!userContributedProduct) {
      powershellLogger.log('INFO', 'USER_CONTRIBUTION', `No user-contributed data to merge`, {
        barcode,
        step: 'MERGE_SKIP',
      });
      return product;
    }
    
    // Determine database source from product metadata
    const userContributedDatabase = (userContributedProduct as any)?._source || 
                                   (userContributedProduct as any)?._database || 
                                   'Local Storage or Vercel Backend';
    
    powershellLogger.log('INFO', 'USER_CONTRIBUTION', `User-contributed product found - merging from ${userContributedDatabase}`, {
      barcode,
      step: 'MERGE_PROCESS',
      database: userContributedDatabase,
      userContributedHasPhoto: !!userContributedProduct.image_url,
      userContributedPhotoUrl: userContributedProduct.image_url || 'NONE',
      userContributedHasIngredients: !!userContributedProduct.ingredients_text,
      userContributedHasNutrition: !!userContributedProduct.nutriments,
      dataSource: 'USER_CONTRIBUTED',
    });
    
    logger.info(`[ProductCacheService] Merging user-contributed data: ${barcode}`);
    
    // Merge ALL user-contributed fields - user data takes priority over database data
    // CRITICAL: Always merge image_url if available (even if product already has one)
    // User-contributed photos are more accurate (taken from actual product)
    if (userContributedProduct.image_url && userContributedProduct.image_url.trim().length > 0) {
      // Only update if the user-contributed URL is a valid public URL (not a local file path)
      const isPublicUrl = userContributedProduct.image_url.startsWith('http://') || 
                         userContributedProduct.image_url.startsWith('https://');
      
      if (isPublicUrl) {
        const oldPhotoUrl = product.image_url || 'NONE';
        product.image_url = userContributedProduct.image_url;
        product.image_front_url = userContributedProduct.image_url;
        
        powershellLogger.log('SUCCESS', 'USER_CONTRIBUTION', `✅ User-contributed PHOTO merged successfully`, {
          barcode,
          step: 'MERGE_PHOTO',
          oldPhotoUrl,
          newPhotoUrl: userContributedProduct.image_url,
          merged: true,
        });
        
        logger.info(`[ProductCacheService] ✅ User-contributed photo merged: ${userContributedProduct.image_url}`);
      } else {
        powershellLogger.log('WARN', 'USER_CONTRIBUTION', `Skipping local file path (not public URL)`, {
          barcode,
          photoUrl: userContributedProduct.image_url,
          reason: 'NOT_PUBLIC_URL',
        });
        
        logger.debug(`[ProductCacheService] Skipping local file path (not a public URL): ${userContributedProduct.image_url}`);
      }
    } else {
      powershellLogger.log('INFO', 'USER_CONTRIBUTION', `No photo in user-contributed data`, {
        barcode,
        step: 'MERGE_PHOTO',
        hasOtherData: !!(userContributedProduct.ingredients_text || userContributedProduct.nutriments),
      });
    }
    
    // ID 10: User-contributed nutrition data override REMOVED (use trusted sources only)
    // User contributions still used for: a) exporting to OFF, b) in-house database for products not found
    // Nutrition data from user contributions is NOT merged to ensure data quality and safety
    
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
    
    powershellLogger.log('SUCCESS', 'USER_CONTRIBUTION', `✅ MERGE COMPLETE - User-contributed data merged`, {
      barcode,
      step: 'MERGE_COMPLETE',
      finalProductHasPhoto: !!product.image_url,
      finalPhotoUrl: product.image_url || 'NONE',
      mergedFields: {
        photo: !!userContributedProduct.image_url,
        ingredients: !!userContributedProduct.ingredients_text,
        nutrition: !!userContributedProduct.nutriments,
      },
    });
    
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
  const startTime = Date.now();
  try {
    const userCountry = getUserCountryCode();
    const primaryBarcode = getPrimaryBarcode(barcode);
    
    powershellLogger.databaseQueryDetailed(barcode, 'SQLite', 'start', startTime, {
      dataSource: 'SQLite',
      sqliteCountry: userCountry || undefined,
    });
    
    const product = await lookupProductInSQLite(primaryBarcode, userCountry ?? undefined);
    const responseTime = Date.now() - startTime;
    
    if (product) {
      const hasNutrition = !!product.nutriments && Object.keys(product.nutriments).length > 0;
      powershellLogger.dataSource(barcode, 'SQLite', product, {
        sqliteCountry: userCountry || undefined,
      });
      powershellLogger.databaseQueryDetailed(barcode, 'SQLite', 'success', startTime, {
        found: true,
        responseTime,
        dataSource: 'SQLite',
        sqliteCountry: userCountry || undefined,
        hasNutrition,
        hasIngredients: !!product.ingredients_text,
        hasImage: !!product.image_url,
        hasNutriScore: !!product.nutriscore_grade,
        hasEcoScore: !!product.ecoscore_grade,
        nutrientsCount: hasNutrition && product.nutriments ? Object.keys(product.nutriments).length : 0,
        ingredientsLength: product.ingredients_text?.length || 0,
      });
      logger.debug(`[ProductCacheService] Found in SQLite: ${primaryBarcode}`);
      return product;
    }
    
    powershellLogger.databaseQueryDetailed(barcode, 'SQLite', 'error', startTime, {
      found: false,
      responseTime,
      dataSource: 'SQLite',
      sqliteCountry: userCountry || undefined,
    });
    
    return null;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    powershellLogger.databaseQueryDetailed(barcode, 'SQLite', 'error', startTime, {
      found: false,
      responseTime,
      dataSource: 'SQLite',
    });
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
  const startTime = Date.now();
  try {
    powershellLogger.databaseQueryDetailed(barcode, 'Cache (AsyncStorage)', 'start', startTime, {
      dataSource: 'Cache',
      isPremium,
    });
    
    for (const variant of barcodeVariants) {
      const cached = await getCachedProduct(variant, isPremium);
      if (cached) {
        const responseTime = Date.now() - startTime;
        const hasNutrition = !!cached.nutriments && Object.keys(cached.nutriments).length > 0;
        
        // Calculate cache age if available
        const cacheAge = (cached as any)._cachedAt ? Date.now() - (cached as any)._cachedAt : undefined;
        
        powershellLogger.dataSource(barcode, 'Cache', cached, {
          cacheAge,
          isPremium,
        });
        powershellLogger.databaseQueryDetailed(barcode, 'Cache (AsyncStorage)', 'success', startTime, {
          found: true,
          responseTime,
          dataSource: 'Cache',
          isPremium,
          cacheAge,
          hasNutrition,
          hasIngredients: !!cached.ingredients_text,
          hasImage: !!cached.image_url,
          hasNutriScore: !!cached.nutriscore_grade,
          hasEcoScore: !!cached.ecoscore_grade,
          nutrientsCount: hasNutrition && cached.nutriments ? Object.keys(cached.nutriments).length : 0,
          ingredientsLength: cached.ingredients_text?.length || 0,
        });
        logger.debug(`[ProductCacheService] Found in cache: ${variant}`);
        return cached;
      }
    }
    
    const responseTime = Date.now() - startTime;
    powershellLogger.databaseQueryDetailed(barcode, 'Cache (AsyncStorage)', 'error', startTime, {
      found: false,
      responseTime,
      dataSource: 'Cache',
      isPremium,
    });
    
    return null;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    powershellLogger.databaseQueryDetailed(barcode, 'Cache (AsyncStorage)', 'error', startTime, {
      found: false,
      responseTime,
      dataSource: 'Cache',
      isPremium,
    });
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
  
  // CRITICAL OPTIMIZATION: Merge user-contributed data with timeout (non-blocking)
  // Start merge in parallel, but don't wait more than 3 seconds
  const mergedProduct = await Promise.race([
    mergeUserContributedData(sqliteProduct, barcode),
    new Promise<Product>((resolve) => 
      setTimeout(() => {
        logger.debug('User-contributed merge timeout (3s) - using SQLite product');
        resolve(sqliteProduct); // Return original if merge times out
      }, 3000)
    ),
  ]);
  
  // Save merged product back to SQLite (non-blocking)
  Promise.resolve().then(async () => {
  try {
    const userCountry = getUserCountryCode();
    await saveProductToSQLite(mergedProduct, userCountry ?? undefined);
  } catch (error) {
    logger.debug('[ProductCacheService] Failed to save merged product to SQLite (non-critical):', error);
  }
  });
  
  // Process and score (fast - don't block)
  const scoredProduct = await processAndScoreProduct(mergedProduct);
  
  // Save final product with TruScore (non-blocking)
  Promise.resolve().then(async () => {
  try {
    const userCountry = getUserCountryCode();
    await saveProductToSQLite(scoredProduct, userCountry ?? undefined);
  } catch (error) {
    logger.debug('[ProductCacheService] Failed to save final product to SQLite (non-critical):', error);
  }
  });
  
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
  
  // CRITICAL OPTIMIZATION: Merge user-contributed data with timeout (non-blocking)
  // Start merge in parallel, but don't wait more than 3 seconds
  const mergedProduct = await Promise.race([
    mergeUserContributedData(cachedProduct, barcode),
    new Promise<Product>((resolve) => 
      setTimeout(() => {
        logger.debug('User-contributed merge timeout (3s) - using cached product');
        resolve(cachedProduct); // Return original if merge times out
      }, 3000)
    ),
  ]);
  
  // Save merged product to SQLite (non-blocking)
  Promise.resolve().then(async () => {
  try {
    const userCountry = getUserCountryCode();
    await saveProductToSQLite(mergedProduct, userCountry ?? undefined);
  } catch (error) {
    logger.debug('[ProductCacheService] Failed to save merged cached product to SQLite (non-critical):', error);
  }
  });
  
  // Process and score (fast - don't block)
  const scoredProduct = await processAndScoreProduct(mergedProduct);
  
  // Save final product with TruScore (non-blocking)
  Promise.resolve().then(async () => {
  try {
    const userCountry = getUserCountryCode();
    await saveProductToSQLite(scoredProduct, userCountry ?? undefined);
  } catch (error) {
    logger.debug('[ProductCacheService] Failed to save final cached product to SQLite (non-critical):', error);
  }
  });
  
  return scoredProduct;
}

