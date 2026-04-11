/**
 * OPTIMIZED Product Service
 * 
 * CRITICAL PERFORMANCE IMPROVEMENTS:
 * 1. Early Return Strategy - Show product as soon as fast sources return (1-3 seconds)
 * 2. Progressive Loading - Display partial results immediately
 * 3. Smart Fallback - Only query fallbacks when really needed
 * 4. Parallel TruScore Calculation - Calculate in parallel with data fetching
 * 
 * Expected Performance:
 * - Time to first content: < 2 seconds (vs 15+ seconds)
 * - Total load time: < 5 seconds (vs 15-20 seconds)
 * - API calls reduced: 50-70%
 */

import { Product, ProductWithTrustScore } from '../types/product';
import { fetchProductFromOFF } from './openFoodFacts';
import { fetchProductFromOBF } from './openBeautyFacts';
import { fetchProductFromOPF } from './openProductsFacts';
import { fetchProductFromOPFF } from './openPetFoodFacts';
import { lookupFromSQLite, lookupFromCache, lookupProductFast, processSQLiteProduct, processCachedProduct, saveProductToCache, mergeUserContributedData } from './productCacheService';
import { USER_CONTRIBUTED_MERGE_RACE_MS, USER_CONTRIBUTED_FIRST_PAINT_RACE_MS } from './userContributedProductsService';
import { isOpenFactsFoodLikeProduct } from '../utils/openFactsProductKind';
import { calculateTrustScore } from '../utils/trustScore';
import { normalizeBarcode, getPrimaryBarcode } from '../utils/barcodeNormalization';
import { getUserCountryCode } from '../utils/countryDetection';
import { logger } from '../utils/logger';
import { mergeProducts } from './productDataMerger';
import { enhanceProduct } from './productEnhancementService';
import { calculateDataCompleteness } from '../utils/dataCompleteness';
import { applyConfidenceScore } from '../utils/confidenceScoring';
import { TruScoreOptimizedDatabase } from '../data/databases/truScoreOptimizedDatabase';
import { logPerformanceMetrics } from '../utils/performanceMonitor';
import { Platform } from 'react-native';
import { powershellLogger } from '../utils/powershellLogger';
import type { FetchTraceEntry, QueryKeyType } from '../types/truscoreAnalysis';

/** Display names and query type per source for fetch trace (matches analysis attribution) */
const SOURCE_TRACE_INFO: Record<string, { displayName: string; queryKeyType: QueryKeyType }> = {
  openfoodfacts: { displayName: 'Open Food Facts', queryKeyType: 'barcode' },
  openbeautyfacts: { displayName: 'Open Beauty Facts', queryKeyType: 'barcode' },
  openpetfoodfacts: { displayName: 'Open Pet Food Facts', queryKeyType: 'barcode' },
  openproductsfacts: { displayName: 'Open Products Facts', queryKeyType: 'barcode' },
  sqlite: { displayName: 'SQLite', queryKeyType: 'barcode' },
  cache: { displayName: 'Cache', queryKeyType: 'barcode' },
  nzfcd: { displayName: 'FSANZ (NZ)', queryKeyType: 'product_name' },
  afcd: { displayName: 'FSANZ (AU)', queryKeyType: 'product_name' },
  fsanz_au: { displayName: 'FSANZ (AU)', queryKeyType: 'product_name' },
  fsanz_nz: { displayName: 'FSANZ (NZ)', queryKeyType: 'product_name' },
  spoonacular: { displayName: 'Spoonacular', queryKeyType: 'barcode' },
  foodatlas: { displayName: 'FoodAtlas', queryKeyType: 'product_name' },
  gs1: { displayName: 'GS1', queryKeyType: 'barcode' },
  usda_fooddata: { displayName: 'USDA', queryKeyType: 'barcode' },
  health_canada_cnf: { displayName: 'Health Canada', queryKeyType: 'barcode' },
  uk_fsa: { displayName: 'UK FSA', queryKeyType: 'barcode' },
  efsa: { displayName: 'EFSA', queryKeyType: 'barcode' },
  rasff: { displayName: 'RASFF', queryKeyType: 'barcode' },
  web_search: { displayName: 'Web search', queryKeyType: 'barcode' },
};

function buildFetchTraceForProducts(products: Product[]): FetchTraceEntry[] {
  return products.map((p, i) => {
    const key = (p.source || '').toLowerCase();
    const info = SOURCE_TRACE_INFO[key] || { displayName: p.source || 'Unknown', queryKeyType: 'barcode' as QueryKeyType };
    return {
      database: info.displayName,
      queryKeyType: info.queryKeyType,
      order: i + 1,
      hit: true,
    };
  });
}

// Query deduplication
const activeProductQueries = new Map<string, Promise<ProductWithTrustScore | null>>();

/** Avoid duplicate Open Facts fetches in TruScoreOptimizedDatabase when Phase 1 already returned this product. */
function enhancementSeedFromPhase1(p: Product | null): Product[] {
  if (!p) return [];
  if (p.source === 'openfoodfacts' || p.source === 'openbeautyfacts') return [p];
  return [];
}

/**
 * Check if product has sufficient data for immediate display
 */
function hasGoodData(product: Product): boolean {
  const hasName = !!(product.product_name && 
                  product.product_name.length > 5 && 
                  !product.product_name.startsWith('Product '));
  const hasBasicInfo = hasName && !!(product.image_url || product.brands);
  
  // For Open Food Facts, even minimal data is usually good
  if (product.source === 'openfoodfacts' || product.source === 'openbeautyfacts') {
    return hasBasicInfo;
  }
  
  // For other sources, need more data
  const hasNutrition = !!(product.nutriments && Object.keys(product.nutriments).length > 0);
  const hasIngredients = !!(product.ingredients_text && product.ingredients_text.trim().length > 10);
  
  return hasBasicInfo && (hasNutrition || hasIngredients);
}

/**
 * Check if we should query fallback APIs
 * Only query if we don't have good data from primary sources
 */
// Feature flag: allow disabling slow/low-value fallback APIs entirely unless explicitly enabled
const ENABLE_FALLBACK_APIS =
  (process.env.EXPO_PUBLIC_ENABLE_FALLBACK_APIS || '').toLowerCase() === 'true';

function shouldQueryFallbacks(product: Product | null, hasOpenFoodFacts: boolean): boolean {
  // If fallbacks are not explicitly enabled, skip them to improve performance and reduce noisy logs
  if (!ENABLE_FALLBACK_APIS) {
    logger.debug('[ProductServiceOptimized] Fallback APIs disabled by configuration, skipping fallback queries');
    return false;
  }
  
  if (!product) return true; // No product found - need fallbacks
  
  if (hasOpenFoodFacts) {
    // Open Food Facts has data - check completeness
    const completeness = calculateDataCompleteness(product);
    return completeness.total < 70; // Only query fallbacks if < 70% complete
  }
  
  // No Open Food Facts - check if we have minimum data
  const hasMinData = product.nutriments && 
                     Object.keys(product.nutriments).length > 0 &&
                     product.ingredients_text && 
                     product.ingredients_text.trim().length > 10 &&
                     product.product_name &&
                     !product.product_name.startsWith('Product ');
  
  return !hasMinData;
}

/**
 * OPTIMIZED: Fetch product with early return strategy
 * 
 * Phase 1 (Fast - 1-3 seconds):
 * - SQLite (instant)
 * - Cache (instant)
 * - Open Food Facts (1-2 seconds)
 * - Open Beauty Facts (1-2 seconds)
 * 
 * If good data found → Return immediately, continue enhancement in background
 * 
 * Phase 2 (Background - non-blocking):
 * - Other Open Facts databases
 * - Government databases
 * - Enhancement APIs
 * 
 * Phase 3 (Fallbacks - only if needed):
 * - Fallback APIs (only if Phase 1 had poor data)
 */
export async function fetchProductOptimized(
  barcode: string, 
  useCache = true, 
  isPremium = false, 
  isOffline = false,
  onProgress?: (progress: { phase: string; product?: Product }) => void
): Promise<ProductWithTrustScore | null> {
  // Check if query is already in progress (deduplication)
  const queryKey = `${barcode}_${useCache}_${isPremium}_${isOffline}`;
  if (activeProductQueries.has(queryKey)) {
    logger.debug(`Product query already in progress for ${barcode}, waiting for existing query...`);
    return activeProductQueries.get(queryKey)!;
  }
  
  // Create query promise
  const queryPromise = executeFetchProductOptimized(barcode, useCache, isPremium, isOffline, onProgress);
  
  // Store in active queries
  activeProductQueries.set(queryKey, queryPromise);
  
  // Clean up after query completes
  queryPromise.finally(() => {
    activeProductQueries.delete(queryKey);
  });
  
  return queryPromise;
}

async function executeFetchProductOptimized(
  barcode: string,
  useCache: boolean,
  isPremium: boolean,
  isOffline: boolean,
  onProgress?: (progress: { phase: string; product?: Product }) => void
): Promise<ProductWithTrustScore | null> {
  const primaryBarcode = getPrimaryBarcode(barcode);
  const barcodeVariants = normalizeBarcode(barcode);
  const userCountry = getUserCountryCode();
  
  // OPTIMIZATION: Performance monitoring - track metrics for optimization
  const scanStartTime = Date.now();
  let apiCallCount = 0;
  let cacheHit = false;
  const sources: string[] = [];
  
  // Track timing breakdown for process completion summary
  const timingBreakdown = {
    databaseQueries: 0,
    dataMerging: 0,
    truScoreCalculation: 0,
    enhancements: 0,
    uiRendering: 0,
  };
  
  logger.info(`🚀 OPTIMIZED PRODUCT FETCH: ${primaryBarcode}`);
  
  // ===== QUERY STRATEGY SUMMARY =====
  // Create database service instance (will be reused later)
  const databaseService = new TruScoreOptimizedDatabase();
  // Log query strategy summary
  const strategyDatabases = ['SQLite', 'Cache', 'Open Food Facts', 'Open Beauty Facts (if needed)', 'GS1', 'FSANZ', 'FoodAtlas', 'Fallbacks'];
  const strategyOrder = [1, 2, 3, 3, 2, 2, 3, 2, 3];
  powershellLogger.queryStrategy(
    primaryBarcode,
    'Parallel queries with progressive display',
    strategyDatabases,
    strategyOrder,
    userCountry || undefined
  );
  
  // ===== CRITICAL OPTIMIZATION: CHECK CACHE FIRST - INSTANT RETURN =====
  // This matches Yuka's behavior - instant return for cached products (< 100ms)
  // Don't wait for API calls if cache exists - return immediately!
  const cacheCheckStart = Date.now();
  let cachedProduct: Product | null = null;
  
  if (useCache) {
    try {
      cachedProduct = await lookupProductFast(primaryBarcode, isPremium, barcodeVariants);
      if (cachedProduct) {
        cacheHit = true;
        const cacheTime = Date.now() - cacheCheckStart;
        logger.info(`⚡ INSTANT CACHE HIT: ${primaryBarcode} (${cacheTime}ms) - returning immediately`);
        const fetchTrace: FetchTraceEntry[] = [{
          database: cachedProduct.source === 'sqlite' ? 'SQLite' : 'Cache',
          queryKeyType: 'barcode',
          order: 1,
          hit: true,
          responseTimeMs: cacheTime,
        }];
        (cachedProduct as any)._fetchTrace = fetchTrace;
        // Process cached product and return IMMEDIATELY - don't wait for API calls!
        const processedProduct = (cachedProduct.source === 'sqlite')
          ? await processSQLiteProduct(cachedProduct, primaryBarcode)
          : (cachedProduct.source === 'cache')
          ? await processCachedProduct(cachedProduct, primaryBarcode)
          : await processProductFast(cachedProduct, primaryBarcode);
        
        // Send to UI immediately - user sees product in < 200ms!
        onProgress?.({ phase: 'product_ready', product: processedProduct });
        
        // Update cache in background (non-blocking) - refresh data if needed
        Promise.resolve().then(async () => {
          try {
            // Query Open Food Facts in background to refresh cache (non-blocking)
            const offProduct = await fetchProductFromOFF(primaryBarcode).catch(() => null);
            if (offProduct) {
              apiCallCount++;
              sources.push('openfoodfacts');
              // Calculate TruScore and update cache with fresh data (non-blocking)
              const offProductWithScore = await processProductFast(offProduct, primaryBarcode);
              saveProductToCache(offProductWithScore, primaryBarcode, isPremium).catch(() => {});
            }
          } catch (err) {
            logger.debug('Background cache refresh failed (non-critical):', err);
          }
        });
        
        // Return cached product IMMEDIATELY - user sees product NOW!
        const totalTime = Date.now() - scanStartTime;
        logger.info(`✅ CACHED PRODUCT RETURNED: ${primaryBarcode} in ${totalTime}ms (INSTANT!)`);
        return processedProduct;
      }
    } catch (cacheError) {
      logger.debug('Cache lookup error (non-critical, will query APIs):', cacheError);
    }
  } else {
    // Check SQLite only (no AsyncStorage cache)
    try {
      cachedProduct = await lookupFromSQLite(primaryBarcode);
      if (cachedProduct) {
        cacheHit = true;
        const cacheTime = Date.now() - cacheCheckStart;
        logger.info(`⚡ INSTANT SQLITE HIT: ${primaryBarcode} (${cacheTime}ms) - returning immediately`);
        const fetchTrace: FetchTraceEntry[] = [{ database: 'SQLite', queryKeyType: 'barcode', order: 1, hit: true, responseTimeMs: cacheTime }];
        (cachedProduct as any)._fetchTrace = fetchTrace;
        // Process SQLite product and return IMMEDIATELY
        const processedProduct = await processSQLiteProduct(cachedProduct, primaryBarcode);
        onProgress?.({ phase: 'product_ready', product: processedProduct });
        
        // Return SQLite product IMMEDIATELY
        const totalTime = Date.now() - scanStartTime;
        logger.info(`✅ SQLITE PRODUCT RETURNED: ${primaryBarcode} in ${totalTime}ms (INSTANT!)`);
        return processedProduct;
      }
    } catch (sqliteError) {
      logger.debug('SQLite lookup error (non-critical, will query APIs):', sqliteError);
    }
  }
  
  // ===== PHASE 1: FAST SOURCES (Only if cache not found) =====
  // Cache not found - query APIs (Target: < 2 seconds)
  onProgress?.({ phase: 'fast_sources' });
  powershellLogger.queryPhase(primaryBarcode, 1, 'Fast Sources (OFF first; OBF only if needed)', '< 2 seconds');
  logger.info(`📊 PHASE 1: Fast Sources (Cache miss - querying APIs - Target: < 2 seconds)`);
  
  const fastSourcesStart = Date.now();
  
  // CRITICAL OPTIMIZATION: Query fast APIs with progressive display
  // Display product IMMEDIATELY when Open Food Facts returns (don't wait for timeout)
  // Only query APIs if cache was not found
  let progressiveDisplaySent = false;
  /** When set, reuse this promise for the main return path to avoid a second long user-merge wait. */
  let firstPaintProductPromise: Promise<ProductWithTrustScore> | null = null;
  const progressiveDisplayUpdates: Array<{
    phase: string;
    timestamp: number;
    timeFromStart: number;
    availableFields: string[];
    missingFields?: string[];
    source: string;
    productComplete: boolean;
  }> = [];
  
  // Helper function to get available fields from a product
  const getAvailableFields = (product: Product): string[] => {
    const fields: string[] = [];
    if (product.product_name) fields.push('product_name');
    if (product.brands) fields.push('brands');
    if (product.image_url) fields.push('image_url');
    if (product.nutriments && Object.keys(product.nutriments).length > 0) fields.push('nutriments');
    if (product.ingredients_text) fields.push('ingredients_text');
    if (product.categories) fields.push('categories');
    if (product.nutriscore_grade) fields.push('nutriscore_grade');
    if (product.ecoscore_grade) fields.push('ecoscore_grade');
    if (product.labels_tags && product.labels_tags.length > 0) fields.push('labels_tags');
    if (product.origins_tags && product.origins_tags.length > 0) fields.push('origins_tags');
    if (product.certifications && product.certifications.length > 0) fields.push('certifications');
    if (product.additives_tags && product.additives_tags.length > 0) fields.push('additives_tags');
    return fields;
  };
  
  // Helper function to get all possible fields
  const getAllPossibleFields = (): string[] => [
    'product_name',
    'brands',
    'image_url',
    'nutriments',
    'ingredients_text',
    'categories',
    'nutriscore_grade',
    'ecoscore_grade',
    'labels_tags',
    'origins_tags',
    'certifications',
    'additives_tags',
  ];
  
  // Phase 1: Open Food Facts first — do not block on Open Beauty Facts when OFF already returns a food-like product.
  const offProduct = await fetchProductFromOFF(primaryBarcode)
    .then((result) => {
      apiCallCount++;
      if (result) {
        sources.push('openfoodfacts');
        logger.info(`✅ Open Food Facts found: ${primaryBarcode}`);
      }
      return result;
    })
    .catch((err) => {
      logger.debug('OFF query error (non-critical):', err);
      return null;
    });

  if (offProduct && hasGoodData(offProduct)) {
    progressiveDisplaySent = true;
    firstPaintProductPromise = processProductForDisplay(offProduct, primaryBarcode, (refined) => {
      const timeFromStart = Date.now() - scanStartTime;
      const availableFields = getAvailableFields(refined);
      const allPossibleFields = getAllPossibleFields();
      const missingFields = allPossibleFields.filter((f) => !availableFields.includes(f));
      progressiveDisplayUpdates.push({
        phase: 'product_refined',
        timestamp: Date.now(),
        timeFromStart,
        availableFields,
        missingFields,
        source: refined.source || 'openfoodfacts',
        productComplete: missingFields.length === 0,
      });
      onProgress?.({ phase: 'product_refined', product: refined });
      logger.info(
        `[ProductServiceOptimized] User-contributed merge refined UI (${timeFromStart}ms from scan start)`
      );
    });

    firstPaintProductPromise
      .then((processed) => {
        const timeFromStart = Date.now() - scanStartTime;
        const availableFields = getAvailableFields(processed);
        const allPossibleFields = getAllPossibleFields();
        const missingFields = allPossibleFields.filter((f) => !availableFields.includes(f));
        progressiveDisplayUpdates.push({
          phase: 'product_ready',
          timestamp: Date.now(),
          timeFromStart,
          availableFields,
          missingFields,
          source: offProduct.source || 'openfoodfacts',
          productComplete: missingFields.length === 0,
        });
        onProgress?.({ phase: 'product_ready', product: processed });
        logger.info(
          `⚡⚡⚡ PROGRESSIVE DISPLAY: Product sent to UI from Open Food Facts (${timeFromStart}ms)`
        );
      })
      .catch((err) => {
        logger.debug('Progressive display error (non-critical):', err);
        progressiveDisplaySent = false;
        firstPaintProductPromise = null;
      });
  }

  let obfProduct: Product | null = null;
  const needOpenBeautyInPhase1 = !offProduct || !isOpenFactsFoodLikeProduct(offProduct);
  if (needOpenBeautyInPhase1) {
    obfProduct = await fetchProductFromOBF(primaryBarcode)
      .then((result) => {
        apiCallCount++;
        if (result) sources.push('openbeautyfacts');
        return result;
      })
      .catch(() => null);
  } else {
    logger.debug('[ProductServiceOptimized] Phase 1: skipping OBF — food-like OFF hit (saves latency + API calls)');
  }

  const fastSources: Product[] = [];
  if (offProduct) fastSources.push(offProduct);
  if (obfProduct) fastSources.push(obfProduct);

  const fastSourcesTime = Date.now() - fastSourcesStart;
  logger.info(`✅ PHASE 1 Complete: ${fastSources.length} products found in ${fastSourcesTime}ms`);

  const allFailedQuickly = fastSourcesTime < 1000 && fastSources.length === 0;
  
  if (allFailedQuickly) {
    logger.info(`⚡ Early exit: All fast sources failed quickly (< 1s), skipping to Phase 2 immediately`);
    // Continue to Phase 2 but with shorter timeout for faster overall performance
  }
  
  // Check if we have good data from fast sources
  let product: Product | null = null;
  let hasOpenFoodFacts = false;
  
  if (fastSources.length > 0) {
    // Process fast sources (SQLite, cache, OFF, OBF)
    // Note: lookupProductFast returns either SQLite or cache (whichever is faster)
    const fastCacheProduct = fastSources.find(p => p.source === 'sqlite' || p.source === 'cache');
    const offProduct = fastSources.find(p => p.source === 'openfoodfacts');
    const obfProduct = fastSources.find(p => p.source === 'openbeautyfacts');
    
    // Prioritize: Fast Cache (SQLite/Cache) > OFF > OBF
    product = fastCacheProduct || offProduct || obfProduct || fastSources[0];
    hasOpenFoodFacts = !!offProduct;
    const phase1Trace: FetchTraceEntry[] = [
      { database: 'Open Food Facts', queryKeyType: 'barcode', order: 1, hit: !!offProduct },
      { database: 'Open Beauty Facts', queryKeyType: 'barcode', order: 2, hit: !!obfProduct },
    ];
    if (product) (product as any)._fetchTrace = phase1Trace;

    // Check if we have good data
    if (product && hasGoodData(product)) {
      logger.info(`✅ Good data found in Phase 1 - processing and returning quickly`);
      
      // CRITICAL FIX: Start Phase 2/3 queries BEFORE returning (run in background)
      // This ensures maximum data completeness while still providing fast initial display
      const phase2StartTime = Date.now();
      timingBreakdown.databaseQueries = Date.now() - fastSourcesStart;
      
      // Start Phase 2/3 queries in background (non-blocking)
      const phase2Promise = (async () => {
        try {
          powershellLogger.queryPhase(primaryBarcode, 2, 'Enhancement (GS1, regional, name-based)', 'Background');
          const enhancementProducts = await databaseService.queryAllDatabases(
            primaryBarcode,
            userCountry,
            product?.product_name,
            undefined,
            { seedProducts: enhancementSeedFromPhase1(product) }
          );
          
          if (enhancementProducts.length > 0) {
            logger.info(`📊 Background Phase 2: Found ${enhancementProducts.length} additional products`);
            return enhancementProducts;
          }
          return [];
        } catch (err) {
          logger.debug('Background Phase 2 failed (non-critical):', err);
          return [];
        }
      })();
      
      // Start Phase 3 queries if needed (background)
      const phase3Promise = (async () => {
        try {
          if (shouldQueryFallbacks(product, hasOpenFoodFacts)) {
            powershellLogger.queryPhase(primaryBarcode, 3, 'Fallback Sources (if needed)', 'Background');
            const fallbackProducts = await databaseService.queryAllDatabases(
              primaryBarcode,
              userCountry,
              undefined,
              undefined,
              { seedProducts: enhancementSeedFromPhase1(product) }
            );
            if (fallbackProducts.length > 0) {
              logger.info(`📊 Background Phase 3: Found ${fallbackProducts.length} fallback products`);
              return fallbackProducts;
            }
          }
          return [];
        } catch (err) {
          logger.debug('Background Phase 3 failed (non-critical):', err);
          return [];
        }
      })();
      
      // processProductFast waits up to USER_CONTRIBUTED_MERGE_RACE_MS for manual-products
      // so scoring/UI see merged ingredients/nutrition (shallow copy in calculateTrustScore).
      let processedProduct: ProductWithTrustScore;
      const processStartTime = Date.now();
      
      if (product.source === 'sqlite') {
        // For SQLite, merge user data with timeout (non-blocking)
        processedProduct = await processSQLiteProduct(product, primaryBarcode);
      } else if (product.source === 'cache') {
        // For cache, merge user data with timeout (non-blocking)
        processedProduct = await processCachedProduct(product, primaryBarcode);
      } else if (product.source === 'openfoodfacts' && firstPaintProductPromise) {
        try {
          processedProduct = await firstPaintProductPromise;
        } catch {
          processedProduct = await processProductFast(product, primaryBarcode);
        }
      } else {
        processedProduct = await processProductFast(product, primaryBarcode);
      }
      
      timingBreakdown.truScoreCalculation = Date.now() - processStartTime;
      
      // Send to UI — product with TruScore (includes manual-products merge when backend responds in time)
      const uiRenderStart = Date.now();
      const timeFromStart = Date.now() - scanStartTime;
      const availableFields = getAvailableFields(processedProduct);
      const allPossibleFields = getAllPossibleFields();
      const missingFields = allPossibleFields.filter(f => !availableFields.includes(f));
      
      progressiveDisplayUpdates.push({
        phase: 'product_ready',
        timestamp: Date.now(),
        timeFromStart,
        availableFields,
        missingFields,
        source: product.source || 'unknown',
        productComplete: missingFields.length === 0,
      });
      
      onProgress?.({ phase: 'product_ready', product: processedProduct });
      timingBreakdown.uiRendering = Date.now() - uiRenderStart;
      
      // Continue Phase 2/3 enhancement in background (non-blocking)
      Promise.all([phase2Promise, phase3Promise]).then(([phase2Products, phase3Products]) => {
        const allAdditionalProducts = [...phase2Products, ...phase3Products];
        if (allAdditionalProducts.length > 0) {
          logger.info(`📊 Background enhancement: Merging ${allAdditionalProducts.length} additional products`);
          const mergeStartTime = Date.now();
          enhanceProductWithAdditionalData(processedProduct, allAdditionalProducts, databaseService, primaryBarcode, isPremium)
            .then((enhanced) => {
              timingBreakdown.dataMerging = Date.now() - mergeStartTime;
              logger.debug(`✅ Background merge complete for ${primaryBarcode}`);
              if (enhanced && onProgress) {
                onProgress({ phase: 'product_enhanced', product: enhanced });
              }
            })
            .catch(err => {
              logger.debug('Background merge failed (non-critical):', err);
            });
        }
      }).catch(err => {
        logger.debug('Background Phase 2/3 failed (non-critical):', err);
      });
      
      // Continue standard enhancement in background (non-blocking)
      enhanceProductInBackground(primaryBarcode, processedProduct, userCountry, isPremium).catch(err => {
        logger.debug('Background enhancement failed (non-critical):', err);
      });
      
      // Return product with TruScore - user sees it NOW!
      // Phase 2/3 will continue in background and enhance product progressively
      return processedProduct;
    }
  }
  
  // ===== PHASE 2: ENHANCEMENT SOURCES (Background) =====
  powershellLogger.queryPhase(primaryBarcode, 2, 'Enhancement (GS1, regional, name-based)', 'Background');
  logger.info(`📊 PHASE 2: Enhancement Sources (Background)`);
  onProgress?.({ phase: 'enhancement' });
  
  const enhancementStart = Date.now();
  
  // Query enhancement sources (non-blocking if we already have a product)
  const enhancementPromise = databaseService.queryAllDatabases(
    primaryBarcode,
    userCountry,
    product?.product_name,
    undefined,
    { seedProducts: enhancementSeedFromPhase1(product) }
  );
  
  // FAST: If we have a product, process it quickly with TruScore and return
  // TruScore calculation is fast (200-500ms) and necessary for display
  if (product) {
    logger.info(`✅ Processing product quickly with TruScore`);
    
    // Process product with TruScore (fast - 200-500ms)
    const processedProduct = await processProductFast(product, primaryBarcode);
    
    // Send to UI - product with TruScore ready!
    onProgress?.({ phase: 'product_ready', product: processedProduct });
    
    // Enhance in background with additional data (non-blocking)
    enhancementPromise.then(enhancementProducts => {
      if (enhancementProducts.length > 0) {
        logger.info(`📊 Background enhancement: Found ${enhancementProducts.length} additional products`);
        enhanceProductWithAdditionalData(processedProduct, enhancementProducts, databaseService, primaryBarcode, isPremium)
          .then((enhanced) => {
            if (enhanced && onProgress) {
              onProgress({ phase: 'product_enhanced', product: enhanced });
            }
          })
          .catch(() => {});
      }
    }).catch(err => {
      logger.debug('Background enhancement failed (non-critical):', err);
    });
    
    // Return product with TruScore
    return processedProduct;
  }
  
  // No product yet - wait for enhancements
  const enhancementProducts = await enhancementPromise;
  const enhancementTime = Date.now() - enhancementStart;
  logger.info(`✅ PHASE 2 Complete: ${enhancementProducts.length} products found in ${enhancementTime}ms`);
  
  // Merge all products
  if (enhancementProducts.length > 0) {
    if (enhancementProducts.length === 1) {
      product = enhancementProducts[0];
    } else {
      product = mergeProducts(enhancementProducts, {
        sourceWeights: databaseService.getTruScoreSourceWeights(),
        normalizeNutrition: true,
        shouldMergeCertifications: true,
        barcode: primaryBarcode,
        enableFieldTracking: true,
      });
    }
    (product as any)._fetchTrace = buildFetchTraceForProducts(enhancementProducts);
    hasOpenFoodFacts = enhancementProducts.some(p => p.source === 'openfoodfacts');
  }
  
  // ===== PHASE 3: FALLBACKS (Only if needed) =====
  const shouldQueryFallback = shouldQueryFallbacks(product, hasOpenFoodFacts);
  
  if (shouldQueryFallback && !product) {
    powershellLogger.queryPhase(primaryBarcode, 3, 'Fallback Sources (No good data found)', '2-10s');
    logger.info(`📊 PHASE 3: Fallbacks (No good data found)`);
    onProgress?.({ phase: 'fallbacks' });
    
    const fallbackProducts = await databaseService.queryAllDatabases(
      primaryBarcode,
      userCountry,
      undefined,
      undefined,
      { seedProducts: enhancementSeedFromPhase1(product) }
    );
    
    if (fallbackProducts.length > 0) {
      product = fallbackProducts.length === 1 
        ? fallbackProducts[0]
        : mergeProducts(fallbackProducts, {
            sourceWeights: databaseService.getTruScoreSourceWeights(),
            normalizeNutrition: true,
            shouldMergeCertifications: true,
            barcode: primaryBarcode,
            enableFieldTracking: true,
          });
      (product as any)._fetchTrace = buildFetchTraceForProducts(fallbackProducts);
    }
  } else if (shouldQueryFallback && product) {
    powershellLogger.queryPhase(primaryBarcode, 3, 'Fallback Sources (Enhancing incomplete product)', 'Background');
    logger.info(`📊 PHASE 3: Fallbacks (Enhancing incomplete product in background)`);
    // Query fallbacks in background to enhance product
    // First process the product to get ProductWithTrustScore
    processProductFast(product, primaryBarcode).then(processedProduct => {
      databaseService.queryAllDatabases(
        primaryBarcode,
        userCountry,
        undefined,
        undefined,
        { seedProducts: enhancementSeedFromPhase1(product) }
      )
        .then(fallbackProducts => {
          if (fallbackProducts.length > 0) {
            enhanceProductWithAdditionalData(processedProduct, fallbackProducts, databaseService, primaryBarcode, isPremium)
              .then((enhanced) => {
                if (enhanced && onProgress) {
                  onProgress({ phase: 'product_enhanced', product: enhanced });
                }
              })
              .catch(() => {});
          }
        })
        .catch(err => logger.debug('Background fallback enhancement failed:', err));
    }).catch(err => logger.debug('Error processing product for background enhancement:', err));
  } else {
    logger.info(`✅ PHASE 3: Skipped (Good data already found)`);
  }
  
  // CRITICAL FIX: Better error handling - return null if no product found
  // Let caller show "Product not found" message instead of generic product
  if (!product) {
    logger.warn(`No product found for ${primaryBarcode} after all phases`);
    onProgress?.({ phase: 'not_found' });
    return null; // Return null - caller will handle "not found" UI
  }
  
  // FAST: Process product with TruScore and return
  // TruScore calculation is fast (200-500ms) and necessary for display
  // processProductFast already merges user-contributed data (photos, etc.)
  // This ensures user contributions are available to ALL users
  const truScoreStartTime = Date.now();
  const processedProduct = await processProductFast(product, primaryBarcode);
  timingBreakdown.truScoreCalculation = Date.now() - truScoreStartTime;
  
  const uiRenderStartTime = Date.now();
  const timeFromStart = Date.now() - scanStartTime;
  const availableFields = getAvailableFields(processedProduct);
  const allPossibleFields = getAllPossibleFields();
  const missingFields = allPossibleFields.filter(f => !availableFields.includes(f));
  
  progressiveDisplayUpdates.push({
    phase: 'complete',
    timestamp: Date.now(),
    timeFromStart,
    availableFields,
    missingFields,
    source: product.source || 'unknown',
    productComplete: missingFields.length === 0,
  });
  
  // Log progressive display summary
  if (progressiveDisplayUpdates.length > 0) {
    powershellLogger.progressiveDisplaySummary(primaryBarcode, progressiveDisplayUpdates);
  }
  
  onProgress?.({ phase: 'complete', product: processedProduct });
  timingBreakdown.uiRendering = Date.now() - uiRenderStartTime;
  
  // Calculate final timing breakdown
  const totalLoadTime = Date.now() - scanStartTime;
  const timeToFirstContent = processedProduct ? totalLoadTime : totalLoadTime; // TTF = TLT if product found
  
  // Calculate final metrics
  const databasesQueried = apiCallCount;
  const databasesFound = sources.length;
  const successRate = databasesQueried > 0 ? `${Math.round((databasesFound / databasesQueried) * 100)}%` : '0%';
  const cacheHits = cacheHit ? 'yes' : 'no';
  
  // Calculate final metrics
  const databasesQueriedCount = apiCallCount || sources.length || 1; // At least 1 if we have a product
  const databasesFoundCount = sources.length || (processedProduct ? 1 : 0);
  const databasesSkippedCount = 0; // Could be calculated based on country exclusions
  const productsMergedCount = sources.length > 1 ? sources.length : 0;
  
  // ===== PROCESS COMPLETION SUMMARY =====
  powershellLogger.processComplete(
    primaryBarcode,
    totalLoadTime,
    {
      databaseQueries: timingBreakdown.databaseQueries,
      dataMerging: timingBreakdown.dataMerging,
      truScoreCalculation: timingBreakdown.truScoreCalculation,
      enhancements: timingBreakdown.enhancements,
      uiRendering: timingBreakdown.uiRendering,
    },
    processedProduct?.trust_score || null,
    processedProduct?.source || undefined
  );
  
  // ===== PERFORMANCE METRICS SUMMARY =====
  powershellLogger.performanceMetrics(primaryBarcode, {
    totalTime: totalLoadTime,
    databaseQueries: timingBreakdown.databaseQueries,
    databasesQueried: databasesQueriedCount,
    databasesFound: databasesFoundCount,
    databasesSkipped: databasesSkippedCount,
    productsMerged: productsMergedCount,
    truScore: processedProduct?.trust_score || 0,
    cacheHit,
  });
  
  // OPTIMIZATION: Log performance metrics for monitoring and optimization
  logPerformanceMetrics({
    barcode: primaryBarcode,
    ttf: timeToFirstContent,
    tlt: totalLoadTime,
    apiCalls: apiCallCount,
    cacheHit,
    sources: sources.length > 0 ? sources : [processedProduct?.source || 'unknown'].filter(Boolean),
    platform: Platform.OS as 'ios' | 'android' | 'web',
    userCountry: userCountry || null,
  });
  
  return processedProduct;
}

/**
 * First paint: short user-contributed merge wait, then score. Full merge continues in background
 * and invokes onFullyMerged when complete (photos / Vercel row).
 */
async function processProductForDisplay(
  product: Product,
  barcode: string,
  onFullyMerged?: (p: ProductWithTrustScore) => void
): Promise<ProductWithTrustScore> {
  const mergePromise = mergeUserContributedData(product, barcode).catch(() => product);
  const quickMerged = await Promise.race([
    mergePromise,
    new Promise<Product>((resolve) =>
      setTimeout(() => resolve(product), USER_CONTRIBUTED_FIRST_PAINT_RACE_MS)
    ),
  ]);
  mergePromise
    .then(async (fullyMerged) => {
      try {
        const refined = await calculateTrustScore(applyConfidenceScore(fullyMerged));
        onFullyMerged?.(refined);
      } catch (e) {
        logger.debug('Full user-merge refine failed (non-critical):', e);
      }
    })
    .catch(() => {});
  return calculateTrustScore(applyConfidenceScore(quickMerged));
}

/**
 * Process product with TruScore after user-contributed merge (long race for correctness).
 */
async function processProductFast(product: Product, barcode: string): Promise<ProductWithTrustScore> {
  // Await merge before scoring: calculateTrustScore returns `{ ...product }` (shallow copy).
  // If we score first and merge completes later, reassigned fields (ingredients_text, nutriments, …)
  // on the original object never reach the displayed ProductWithTrustScore.
  let mergedProduct: Product = product;
  try {
    mergedProduct = await Promise.race([
      mergeUserContributedData(product, barcode),
      new Promise<Product>((resolve) =>
        setTimeout(() => resolve(product), USER_CONTRIBUTED_MERGE_RACE_MS)
      ),
    ]);
  } catch (error) {
    logger.debug('User-contributed merge failed (non-critical):', error);
    mergedProduct = product;
  }

  const productWithConfidence = applyConfidenceScore(mergedProduct);
  return calculateTrustScore(productWithConfidence);
}

/**
 * Enhance product in background (non-blocking)
 */
async function enhanceProductInBackground(
  barcode: string,
  product: ProductWithTrustScore,
  userCountry: string | null,
  isPremium: boolean
): Promise<void> {
  try {
    // Apply enhancements
    const enhanced = await enhanceProduct(product);
    
    // Recalculate TruScore with enhanced data
    const enhancedWithScore = await calculateTrustScore(enhanced);
    
    // Update cache
    await saveProductToCache(enhancedWithScore, barcode, isPremium);
    
    logger.debug(`✅ Background enhancement complete for ${barcode}`);
  } catch (error) {
    logger.debug('Background enhancement error (non-critical):', error);
  }
}

/**
 * Enhance product with additional data from other sources.
 * Returns the enhanced product (with extended _fetchTrace and _truscore_analysis) so the UI can refresh.
 */
async function enhanceProductWithAdditionalData(
  product: ProductWithTrustScore,
  additionalProducts: Product[],
  databaseService: TruScoreOptimizedDatabase,
  barcode: string,
  isPremium: boolean
): Promise<ProductWithTrustScore | null> {
  try {
    // Merge additional products
    const merged = mergeProducts([product, ...additionalProducts], {
      sourceWeights: databaseService.getTruScoreSourceWeights(),
      normalizeNutrition: true,
      shouldMergeCertifications: true,
      barcode: barcode,
      enableFieldTracking: true,
    });
    // Extended fetch trace: all DBs that contributed to the merged product and how each was queried
    (merged as any)._fetchTrace = buildFetchTraceForProducts([product as Product, ...additionalProducts]);
    // Manual-products row must win over merge heuristics (e.g. Spoonacular "longest" ingredients).
    await mergeUserContributedData(merged, barcode);
    const enhanced = await calculateTrustScore(applyConfidenceScore(merged));
    // Update cache
    await saveProductToCache(enhanced, barcode, isPremium);
    logger.debug(`✅ Product enhanced with additional data for ${barcode}`);
    return enhanced;
  } catch (error) {
    logger.debug('Product enhancement error (non-critical):', error);
    return null;
  }
}

