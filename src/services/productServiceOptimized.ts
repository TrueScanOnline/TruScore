/**
 * OPTIMIZED Product Service — Wave 2 Core Truth Pipeline
 *
 * AU/NZ production path:
 *   barcode normalize → cache (if valid) → World OFF exact-GTIN → process/score → return
 *   OR promptly null if no OFF product.
 *
 * Multi-provider fan-out (OBF/OPF/OPFF, FSANZ/GS1/FoodAtlas, mergeProducts, Phase 2/3)
 * has been removed from this path.
 */

import { Product, ProductWithTrustScore } from '../types/product';
import { fetchProductFromOFF } from './openFoodFacts';
import {
  lookupFromSQLite,
  lookupProductFast,
  processSQLiteProduct,
  processCachedProduct,
  saveProductToCache,
  mergeUserContributedData,
} from './productCacheService';
import { USER_CONTRIBUTED_MERGE_RACE_MS, USER_CONTRIBUTED_FIRST_PAINT_RACE_MS } from './userContributedProductsService';
import { calculateTrustScore } from '../utils/trustScore';
import { normalizeBarcode, getPrimaryBarcode } from '../utils/barcodeNormalization';
import { getUserCountryCode } from '../utils/countryDetection';
import { logger } from '../utils/logger';
import { enhanceProduct } from './productEnhancementService';
import { applyConfidenceScore } from '../utils/confidenceScoring';
import { logPerformanceMetrics } from '../utils/performanceMonitor';
import { Platform } from 'react-native';
import { powershellLogger } from '../utils/powershellLogger';
import type { FetchTraceEntry } from '../types/truscoreAnalysis';

// Query deduplication
const activeProductQueries = new Map<string, Promise<ProductWithTrustScore | null>>();

/**
 * OPTIMIZED: Fetch product — cache → World OFF → process/score (or null).
 */
export async function fetchProductOptimized(
  barcode: string,
  useCache = true,
  isPremium = false,
  isOffline = false,
  onProgress?: (progress: { phase: string; product?: ProductWithTrustScore }) => void
): Promise<ProductWithTrustScore | null> {
  const queryKey = `${barcode}_${useCache}_${isPremium}_${isOffline}`;
  if (activeProductQueries.has(queryKey)) {
    logger.debug(`Product query already in progress for ${barcode}, waiting for existing query...`);
    return activeProductQueries.get(queryKey)!;
  }

  const queryPromise = executeFetchProductOptimized(barcode, useCache, isPremium, isOffline, onProgress);
  activeProductQueries.set(queryKey, queryPromise);
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
  onProgress?: (progress: { phase: string; product?: ProductWithTrustScore }) => void
): Promise<ProductWithTrustScore | null> {
  const primaryBarcode = getPrimaryBarcode(barcode);
  const barcodeVariants = normalizeBarcode(barcode);
  const userCountry = getUserCountryCode();

  const scanStartTime = Date.now();
  let apiCallCount = 0;
  let cacheHit = false;
  const sources: string[] = [];

  const timingBreakdown = {
    databaseQueries: 0,
    dataMerging: 0,
    truScoreCalculation: 0,
    enhancements: 0,
    uiRendering: 0,
  };

  logger.info(`🚀 OPTIMIZED PRODUCT FETCH: ${primaryBarcode}`);

  powershellLogger.queryStrategy(
    primaryBarcode,
    'Cache → World OFF exact-GTIN → process/score',
    ['SQLite', 'Cache', 'Open Food Facts (World)'],
    [1, 2, 3],
    userCountry || undefined
  );

  // ===== CACHE / SQLITE FAST PATH =====
  const cacheCheckStart = Date.now();

  if (useCache) {
    try {
      const cachedProduct = await lookupProductFast(primaryBarcode, isPremium, barcodeVariants);
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

        const processedProduct = (cachedProduct.source === 'sqlite')
          ? await processSQLiteProduct(cachedProduct, primaryBarcode)
          : (cachedProduct.source === 'cache')
          ? await processCachedProduct(cachedProduct, primaryBarcode)
          : await processProductFast(cachedProduct, primaryBarcode);

        onProgress?.({ phase: 'product_ready', product: processedProduct });

        // Background cache refresh from OFF only (no multi-provider)
        Promise.resolve().then(async () => {
          try {
            const offProduct = await fetchProductFromOFF(primaryBarcode).catch(() => null);
            if (offProduct) {
              const offProductWithScore = await processProductFast(offProduct, primaryBarcode);
              saveProductToCache(offProductWithScore, primaryBarcode, isPremium).catch(() => {});
            }
          } catch (err) {
            logger.debug('Background cache refresh failed (non-critical):', err);
          }
        });

        const totalTime = Date.now() - scanStartTime;
        logger.info(`✅ CACHED PRODUCT RETURNED: ${primaryBarcode} in ${totalTime}ms (INSTANT!)`);
        return processedProduct;
      }
    } catch (cacheError) {
      logger.debug('Cache lookup error (non-critical, will query OFF):', cacheError);
    }
  } else {
    try {
      const sqliteProduct = await lookupFromSQLite(primaryBarcode);
      if (sqliteProduct) {
        cacheHit = true;
        const cacheTime = Date.now() - cacheCheckStart;
        logger.info(`⚡ INSTANT SQLITE HIT: ${primaryBarcode} (${cacheTime}ms) - returning immediately`);
        const fetchTrace: FetchTraceEntry[] = [{
          database: 'SQLite',
          queryKeyType: 'barcode',
          order: 1,
          hit: true,
          responseTimeMs: cacheTime,
        }];
        (sqliteProduct as any)._fetchTrace = fetchTrace;
        const processedProduct = await processSQLiteProduct(sqliteProduct, primaryBarcode);
        onProgress?.({ phase: 'product_ready', product: processedProduct });
        const totalTime = Date.now() - scanStartTime;
        logger.info(`✅ SQLITE PRODUCT RETURNED: ${primaryBarcode} in ${totalTime}ms (INSTANT!)`);
        return processedProduct;
      }
    } catch (sqliteError) {
      logger.debug('SQLite lookup error (non-critical, will query OFF):', sqliteError);
    }
  }

  if (isOffline) {
    logger.warn(`Product not in cache (offline mode): ${primaryBarcode}`);
    onProgress?.({ phase: 'not_found' });
    return null;
  }

  // ===== WORLD OFF EXACT-GTIN =====
  onProgress?.({ phase: 'fast_sources' });
  powershellLogger.queryPhase(primaryBarcode, 1, 'World Open Food Facts (exact GTIN)', '< 2 seconds');
  logger.info(`📊 World OFF exact-GTIN: ${primaryBarcode}`);

  const offStart = Date.now();
  let firstPaintProductPromise: Promise<ProductWithTrustScore> | null = null;

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

  timingBreakdown.databaseQueries = Date.now() - offStart;

  // No OFF product → return null promptly (no Phase 2/3 / legacy providers)
  if (!offProduct) {
    logger.warn(`No product found for ${primaryBarcode} (World OFF miss)`);
    onProgress?.({ phase: 'not_found' });
    return null;
  }

  const fetchTrace: FetchTraceEntry[] = [{
    database: 'Open Food Facts',
    queryKeyType: 'barcode',
    order: 1,
    hit: true,
    responseTimeMs: timingBreakdown.databaseQueries,
  }];
  (offProduct as any)._fetchTrace = fetchTrace;

  // Progressive first paint when OFF returns (even partial)
  firstPaintProductPromise = processProductForDisplay(offProduct, primaryBarcode, (refined) => {
    const timeFromStart = Date.now() - scanStartTime;
    onProgress?.({ phase: 'product_refined', product: refined });
    logger.info(
      `[ProductServiceOptimized] User-contributed merge refined UI (${timeFromStart}ms from scan start)`
    );
  });

  firstPaintProductPromise
    .then((processed) => {
      const timeFromStart = Date.now() - scanStartTime;
      onProgress?.({ phase: 'product_ready', product: processed });
      logger.info(
        `⚡⚡⚡ PROGRESSIVE DISPLAY: Product sent to UI from Open Food Facts (${timeFromStart}ms)`
      );
    })
    .catch((err) => {
      logger.debug('Progressive display error (non-critical):', err);
      firstPaintProductPromise = null;
    });

  logger.info(`✅ Good OFF hit — processing and returning (no multi-provider fallback)`);

  const processStartTime = Date.now();
  let processedProduct: ProductWithTrustScore;
  try {
    processedProduct = firstPaintProductPromise
      ? await firstPaintProductPromise
      : await processProductFast(offProduct, primaryBarcode);
  } catch {
    processedProduct = await processProductFast(offProduct, primaryBarcode);
  }
  timingBreakdown.truScoreCalculation = Date.now() - processStartTime;

  const uiRenderStart = Date.now();
  onProgress?.({ phase: 'product_ready', product: processedProduct });
  timingBreakdown.uiRendering = Date.now() - uiRenderStart;

  // Eco helper + NOVA-1 rescue (local Nutri already removed from enhanceProduct)
  enhanceProductInBackground(primaryBarcode, processedProduct, userCountry, isPremium).catch((err) => {
    logger.debug('Background enhancement failed (non-critical):', err);
  });

  const totalLoadTime = Date.now() - scanStartTime;

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

  powershellLogger.performanceMetrics(primaryBarcode, {
    totalTime: totalLoadTime,
    databaseQueries: timingBreakdown.databaseQueries,
    databasesQueried: apiCallCount,
    databasesFound: sources.length,
    databasesSkipped: 0,
    productsMerged: 0,
    truScore: processedProduct?.trust_score || 0,
    cacheHit,
  });

  logPerformanceMetrics({
    barcode: primaryBarcode,
    ttf: totalLoadTime,
    tlt: totalLoadTime,
    apiCalls: apiCallCount,
    cacheHit,
    sources: sources.length > 0 ? sources : [processedProduct?.source || 'openfoodfacts'].filter(Boolean),
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
 * Enhance product in background (non-blocking).
 * Eco helper + NOVA-1 rescue remain inside enhanceProduct; local Nutri already removed.
 */
async function enhanceProductInBackground(
  barcode: string,
  product: ProductWithTrustScore,
  _userCountry: string | null,
  isPremium: boolean
): Promise<void> {
  try {
    const enhanced = await enhanceProduct(product);
    const enhancedWithScore = await calculateTrustScore(enhanced);
    await saveProductToCache(enhancedWithScore, barcode, isPremium);
    logger.debug(`✅ Background enhancement complete for ${barcode}`);
  } catch (error) {
    logger.debug('Background enhancement error (non-critical):', error);
  }
}
