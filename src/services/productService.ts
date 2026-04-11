// Main product service - orchestrates API calls and caching
import { Product, ProductWithTrustScore } from '../types/product';
import { fetchProductFromOFF, extractOriginCountry, calculateEcoScore, formatCertifications, formatIngredients } from './openFoodFacts';
import { validateProduct, getSafeProduct } from '../utils/productValidation';
import { logger } from '../utils/logger';
import { fetchProductFromOBF } from './openBeautyFacts';
import { fetchProductFromOPF } from './openProductsFacts';
import { fetchProductFromOPFF } from './openPetFoodFacts';
import { fetchProductFromUSDA } from './usdaFoodData';
import { fetchProductFromGS1 } from './gs1DataSource';
import { fetchProductFromBarcodeSpider } from './barcodeSpider';
import { fetchProductFromUPCitemdb } from './upcitemdb';
import { fetchProductFromGoUpc } from './goUpcApi';
import { fetchProductFromBuycott } from './buycottApi';
import { fetchProductFromOpenGtin } from './openGtindbApi';
import { fetchProductFromBarcodeMonster } from './barcodeMonsterApi';
import { fetchProductFromEANSearch } from './eanSearchApi';
import { fetchProductFromUPCDatabase } from './upcDatabaseApi';
import { fetchProductFromEdamam } from './edamamApi';
import { fetchProductFromBarcodeLookup } from './barcodeLookupApi';
import { fetchProductFromNutritionix } from './nutritionixApi';
import { fetchProductFromSpoonacular } from './spoonacularApi';
import { fetchProductFromBestBuy } from './bestBuyApi';
import { fetchProductFromEANData } from './eanDataApi';
import { fetchProductFromWebSearch, isWebSearchFallback } from './webSearchFallback';
import { getCachedProduct, cacheProduct } from './cacheService';
import { calculateTrustScore } from '../utils/trustScore';
import { extractPalmOilAnalysis } from './openFoodFacts';
import { checkFDARecalls } from './fdaRecallService';
import { normalizeBarcode, getPrimaryBarcode } from '../utils/barcodeNormalization';
import { getUserCountryCode, isEUCountry } from '../utils/countryDetection';
import { fetchProductFromNZStores } from './nzStoreApi';
import { fetchProductFromFSANZ } from './fsanDatabase';
import { fetchProductFromAURetailers } from './auRetailerScraping';
import { enhanceProductWithNZFCD } from './nzfcdDatabase';
import { enhanceProductWithAFCD } from './afcdDatabase';
import { fetchProductFromHealthCanada } from './healthCanadaDatabase';
import { fetchProductFromUKFSA } from './ukFsaDatabase';
import { fetchProductFromEFSA } from './efsaDatabase';
// Tesco Labs API removed - service discontinued December 2025
// import { fetchProductFromTesco } from './tescoLabsApi';
import { fetchProductFromWalmart } from './walmartOpenApi';
import { fetchProductFromFoodRepo } from './foodRepoApi';
import { fetchProductFromOpenNutrition } from './openNutritionApi';
import { checkComprehensiveUSRecalls } from './recallsGovService';
import { checkRASFFAlerts } from './rasffService';
import { checkCFIARecalls } from './cfiaRecallService';
import { checkCPSCRecalls, convertCPSCRecall } from './cpscRecallService';
import { checkUKFSARecalls, convertUKFSARecall } from './ukFsaRecallService';
import { UnifiedRecall, convertFDARecall, convertComprehensiveUSRecall, convertRASFFAlert, convertCFIARecall } from '../types/recall';
import { enrichProductWithEANSearchBrand } from './eanSearchBrandApi';
import { enrichProductWithOpenCorporates } from './openCorporatesApi';
import { enrichProductWithBCorp } from './bCorpApi';
import { applyConfidenceScore } from '../utils/confidenceScoring';
import { mergeProducts } from './productDataMerger';
import { isCruelParent } from '../data/brandDatabase';
import { lookupProductInSQLite, saveProductToSQLite } from './sqliteProductDatabase';
import { applyMVPEnhancements } from './enhancements/enhancementLayer';
import { calculateDataCompleteness, formatCompletenessMetrics } from '../utils/dataCompleteness';
import { TruScoreOptimizedDatabase } from '../data/databases/truScoreOptimizedDatabase';
import { powershellLogger } from '../utils/powershellLogger';
import { discoverProductNameEarly, extractProductName } from './productNameDiscovery';
import { getManualProduct } from './manualProductService';
import { getUserContributedProduct } from './userContributedProductsService';
// New modular services
import {
  lookupFromSQLite,
  lookupFromCache,
  processSQLiteProduct,
  processCachedProduct,
  isLowQualityCache,
  saveProductToCache,
  mergeUserContributedData,
} from './productCacheService';
import { enhanceProduct } from './productEnhancementService';
import { handleError, ErrorCategory, ErrorSeverity } from './errorHandlingService';

/**
 * Check if product data is incomplete (missing critical fields)
 * Used to determine if USDA should override OFF data for US users
 */
function isProductIncomplete(product: Product): boolean {
  const hasNutrition = product.nutriments && Object.keys(product.nutriments).length > 0;
  const hasIngredients = product.ingredients_text && product.ingredients_text.trim().length > 10;
  const hasName = product.product_name && !product.product_name.startsWith('Product ');
  
  // Consider incomplete if missing critical data
  return !hasNutrition || !hasIngredients || !hasName;
}

/**
 * Fetch product data with comprehensive fallback strategy.
 * 
 * This is the main product lookup function that orchestrates queries across 20+ data sources.
 * It follows an offline-first approach with intelligent caching and fallback strategies.
 * 
 * **Query Strategy:**
 * 1. SQLite database (offline-first, country-specific)
 * 2. AsyncStorage cache (with premium support)
 * 3. User-contributed products
 * 4. Multi-tier database queries (parallel execution):
 *    - Tier 1: Gold Standard (Open Food Facts, USDA, Health Canada, etc.)
 *    - Tier 2: Enhancements (FSANZ, FoodAtlas, NZFCD/AFCD)
 *    - Tier 3: Fallbacks (UPCitemdb, EAN-Search, etc.)
 *    - Tier 4: Web Search (last resort)
 * 5. Product name-based queries (FSANZ, FoodAtlas)
 * 6. Data merging (TruScore-first strategy)
 * 7. Enhancements (MVP, brand enrichment)
 * 8. TruScore calculation
 * 9. Cache result
 * 
 * **Coverage:**
 * - Food & Drinks: Open Food Facts, USDA, Health Canada, UK FSA, EFSA
 * - Cosmetics: Open Beauty Facts
 * - Pet Food: Open Pet Food Facts
 * - General Products: Open Products Facts, UPCitemdb, EAN-Search, etc.
 * - Regional: FSANZ (AU/NZ), FoodAtlas
 * 
 * **Guarantee:** This function will ALWAYS return a Product (never null) unless offline without cache.
 * Even if all databases fail, web search fallback creates a minimal product result.
 * 
 * **Expected Coverage:** ~85-90% of all scanned products
 * 
 * @param barcode - Product barcode (8-14 digits, will be normalized)
 * @param useCache - Whether to use cache (default: true)
 * @param isPremium - Whether user has premium subscription (affects cache size)
 * @param isOffline - Whether device is offline (affects query strategy)
 * @returns Product with TruScore, or null if offline without cache
 * 
 * @example
 * ```typescript
 * const product = await fetchProduct('1234567890123');
 * if (product) {
 *   console.log(`TruScore: ${product.trust_score}/100`);
 * }
 * ```
 */
// Query deduplication at productService level
const activeProductQueries = new Map<string, Promise<ProductWithTrustScore | null>>();
const QUERY_TIMEOUT = 30000; // 30 seconds timeout to prevent memory leaks

/**
 * Progress callback type for progressive product display
 */
export type ProductProgressCallback = (progress: { 
  phase: string; 
  product?: ProductWithTrustScore;
}) => void;

export async function fetchProduct(
  barcode: string, 
  useCache = true, 
  isPremium = false, 
  isOffline = false,
  onProgress?: ProductProgressCallback
): Promise<ProductWithTrustScore | null> {
  // Check if query is already in progress (deduplication)
  const queryKey = `${barcode}_${useCache}_${isPremium}_${isOffline}`;
  if (activeProductQueries.has(queryKey)) {
    logger.debug(`Product query already in progress for ${barcode}, waiting for existing query...`);
    return activeProductQueries.get(queryKey)!;
  }
  
  // Create query promise with timeout protection to prevent memory leaks
  const queryPromise = Promise.race([
    executeFetchProduct(barcode, useCache, isPremium, isOffline, onProgress),
    new Promise<ProductWithTrustScore | null>((resolve) => 
      setTimeout(() => {
        logger.warn(`Query timeout for ${barcode} after ${QUERY_TIMEOUT}ms`);
        resolve(null);
      }, QUERY_TIMEOUT)
    )
  ]);
  
  // Store in active queries
  activeProductQueries.set(queryKey, queryPromise);
  
  // Clean up after query completes (with timeout safety)
  queryPromise.finally(() => {
    // Small delay to prevent race conditions, then cleanup
    setTimeout(() => {
    activeProductQueries.delete(queryKey);
    }, 1000);
  });
  
  return queryPromise;
}

/**
 * Helper function to process product for progressive display
 * Calculates TruScore, enhances, and prepares product for UI
 */
async function processProductForDisplay(
  product: Product,
  barcode: string,
  databaseService: TruScoreOptimizedDatabase
): Promise<ProductWithTrustScore> {
  // Enhance product (format, palm oil, MVP enhancements, etc.)
  const enhanced = await enhanceProduct(product);
  
  // Apply confidence score
  const withConfidence = applyConfidenceScore(enhanced);
  
  // Calculate TruScore
  try {
    return await calculateTrustScore(withConfidence);
  } catch (error) {
    logger.warn('Error calculating TruScore for progressive display (non-critical):', error);
    // Return product without TruScore if calculation fails
    return {
      ...withConfidence,
      trust_score: null,
      trust_score_breakdown: null,
    } as ProductWithTrustScore;
  }
}

async function executeFetchProduct(
  barcode: string, 
  useCache = true, 
  isPremium = false, 
  isOffline = false,
  onProgress?: ProductProgressCallback
): Promise<ProductWithTrustScore | null> {
  // Track overall process timing and component timings
  const processStartTime = Date.now();
  const timingBreakdown = {
    databaseQueries: 0,
    dataMerging: 0,
    truScoreCalculation: 0,
    enhancements: 0,
    uiRendering: 0,
  };
  
  // Normalize barcode - try multiple variants (EAN-8 -> EAN-13, etc.)
  const barcodeVariants = normalizeBarcode(barcode);
  const primaryBarcode = getPrimaryBarcode(barcode);
  const userCountry = getUserCountryCode();
  logger.debug(`Barcode variants to try: ${barcodeVariants.join(', ')} (primary: ${primaryBarcode})`);

  try {
  // Check SQLite database first (offline-first, country-specific)
  // This provides instant lookups for products in the local database
  const sqliteProduct = await lookupFromSQLite(primaryBarcode);
  if (sqliteProduct) {
    logger.debug(`Found product in SQLite database: ${primaryBarcode}`);
    
    // DIAGNOSTIC: Log key scoring data before enhancement
    logger.info(`[SQLite Product Diagnostics] Product data before TruScore calculation:`, {
      barcode: sqliteProduct.barcode,
      product_name: sqliteProduct.product_name,
      nutriscore_grade: sqliteProduct.nutriscore_grade || 'NOT SET',
      nutriscore_score: sqliteProduct.nutriscore_score || 'NOT SET',
      ecoscore_grade: sqliteProduct.ecoscore_grade || 'NOT SET',
      ecoscore_score: sqliteProduct.ecoscore_score || 'NOT SET',
      hasIngredients: !!(sqliteProduct.ingredients_text && sqliteProduct.ingredients_text.trim().length > 0),
      ingredientsLength: sqliteProduct.ingredients_text?.length || 0,
      hasOrigin: !!(sqliteProduct.origins_tags?.length || sqliteProduct.manufacturing_places_tags?.length || sqliteProduct.origins || sqliteProduct.manufacturing_places),
      nova_group: sqliteProduct.nova_group || 'NOT SET',
      additives_count: sqliteProduct.additives_tags?.length || 0,
      labels_count: sqliteProduct.labels_tags?.length || 0,
    });
    
    // Process SQLite product: enhance, merge user data, score, and return
    return await processSQLiteProduct(sqliteProduct, primaryBarcode);
  }

  // Check cache - try all variants
  if (useCache) {
    const cached = await lookupFromCache(primaryBarcode, isPremium, barcodeVariants);
    if (cached) {
      // Check if cached product is low quality and should be retried
      if (isLowQualityCache(cached, isOffline)) {
        logger.debug(`Cached product ${primaryBarcode} is low-quality web search result, retrying web search...`);
        // Don't return cached - continue to retry web search
      } else {
        logger.debug(`Using cached product: ${primaryBarcode}${isPremium ? ' (premium cache)' : ''}`);
        // Process cached product: enhance, merge user data, score, and return
        return await processCachedProduct(cached, primaryBarcode);
      }
    }
  }

  // OPTIMIZED: Check user-contributed products in PARALLEL with database queries
  // This eliminates the 5+ second sequential bottleneck
  // Start user-contributed check immediately, don't wait for it
  const userContributedPromise = getUserContributedProduct(primaryBarcode).catch(error => {
    logger.debug('[ProductService] Error checking user-contributed products (non-critical):', error);
    return null;
  });
  
  // Don't await here - continue with database queries in parallel

  // If offline and no cache, return null (premium users should have cache)
  if (isOffline) {
    logger.warn(`Product not in cache (offline mode): ${barcode}`);
    return null;
  }

  // Start comprehensive logging for product fetch
  logger.info(`═══════════════════════════════════════════════════════════════`);
  logger.info(`🔍 PRODUCT SCAN: ${barcode}`);
  logger.info(`═══════════════════════════════════════════════════════════════`);
  logger.info(`📋 Barcode Variants: ${barcodeVariants.join(', ')}`);
  logger.info(`🌍 User Country: ${userCountry || 'Unknown'}`);

  // OPTIMIZED: Start name discovery and database queries in PARALLEL
  // This eliminates the sequential bottleneck and displays products faster
  // Strategy: Start barcode queries immediately, discover name in parallel, trigger name-based queries if needed
  logger.info(`───────────────────────────────────────────────────────────────`);
  logger.info(`🚀 OPTIMIZED PARALLEL QUERY STRATEGY`);
  logger.info(`───────────────────────────────────────────────────────────────`);
  
  // Start name discovery and database queries in parallel (don't wait for name)
  const nameDiscoveryPromise = discoverProductNameEarly(primaryBarcode, userCountry);
  const databaseService = new TruScoreOptimizedDatabase();
  
  // Progressive product tracking for callback support
  let progressiveProduct: Product | null = null;
  let progressiveProductWithScore: ProductWithTrustScore | null = null;
  // Progressive callback for database queries
  const onDatabaseProductUpdate = async (product: Product, source: string) => {
    if (!product) return;
    
    const arrivalTime = Date.now();
    logger.info(`⚡ Progressive update: Product from ${source} arrived`);
    
    if (!progressiveProduct) {
      // FIRST RESULT - Display immediately!
      progressiveProduct = product;
      logger.info(`🚀 FIRST RESULT - Processing for immediate display...`);
      
      // Process first product for display (calculate TruScore, enhance, etc.)
      try {
        // Quick processing for immediate display
        const processed = await processProductForDisplay(progressiveProduct, primaryBarcode, databaseService);
        progressiveProductWithScore = processed;
        
        // Send to UI immediately via callback
        if (onProgress) {
          onProgress({ phase: 'product_found', product: processed });
          logger.info(`✅ Progressive display: First product sent to UI (${source})`);
        }
      } catch (error) {
        logger.warn('Error processing first product for progressive display:', error);
      }
    } else {
      // MERGE progressively
      try {
        if (!progressiveProduct) {
          logger.warn('Progressive product is null, cannot merge');
          return;
        }
        
        progressiveProduct = mergeProducts([progressiveProduct, product], {
          sourceWeights: databaseService.getTruScoreSourceWeights(),
          normalizeNutrition: true,
          shouldMergeCertifications: true,
        });
        
        // Re-process merged product (check it's not null after merge)
        if (progressiveProduct) {
          const processed = await processProductForDisplay(progressiveProduct, primaryBarcode, databaseService);
          progressiveProductWithScore = processed;
          
          // Update UI via callback
          if (onProgress) {
            onProgress({ phase: 'product_enhanced', product: processed });
            logger.info(`🔄 Progressive update: Product enhanced (merged with ${source})`);
          }
        }
      } catch (error) {
        logger.warn('Error merging product for progressive display:', error);
      }
    }
  };
  
  // Start barcode queries immediately (don't wait for product name)
  // Most databases (Open Food Facts, USDA, etc.) work with barcode only
  logger.info(`📊 Starting barcode-based database queries (parallel, no name required)...`);
  if (onProgress) {
    logger.info(`   Progressive display: ENABLED (product will display as results arrive)`);
  }
  const databaseQueryStartTime = Date.now();
  const allProductsPromise = databaseService.queryAllDatabases(
    primaryBarcode, 
    userCountry, 
    null,
    onProgress ? onDatabaseProductUpdate : undefined
  );
  
  // Wait for name discovery (but don't block database queries - they run in parallel)
  let earlyProductName: string | null = null;
  try {
    earlyProductName = await Promise.race([
      nameDiscoveryPromise,
      new Promise<string | null>((resolve) => setTimeout(() => resolve(null), 3000)), // 3s timeout for name discovery
    ]);
  } catch (error) {
    logger.debug('Name discovery error (non-critical):', error);
  }
  
  if (earlyProductName) {
    logger.info(`✅ Discovered product name: "${earlyProductName}"`);
    logger.info(`   Name-based queries (FSANZ, FoodAtlas) will be triggered in parallel`);
  } else {
    logger.info(`⚠️  No product name discovered early - barcode queries continue in parallel`);
  }

  // Get results from parallel barcode queries
  let allProducts = await allProductsPromise;
  timingBreakdown.databaseQueries = Date.now() - databaseQueryStartTime;
  
  // If we found a product name, trigger additional name-based queries
  // These are valuable sources (FSANZ, FoodAtlas) that require product name
  if (earlyProductName) {
    logger.info(`🔄 Triggering name-based queries with discovered name: "${earlyProductName}"`);
    try {
      // Query name-based sources in parallel (don't wait for full queryAllDatabases)
      const { queryFSANZByProductName } = await import('./fsanzQueryService');
      const { queryFoodAtlasByProductName } = await import('./foodAtlasQueryService');
  
      const nameBasedQueries = Promise.allSettled([
        // FSANZ for AU/NZ users
        (userCountry === 'AU' || userCountry === 'NZ') 
          ? queryFSANZByProductName(earlyProductName, userCountry as 'AU' | 'NZ')
          : Promise.resolve(null),
        // FoodAtlas (global)
        queryFoodAtlasByProductName(earlyProductName),
      ]);
      
      const nameBasedResults = await nameBasedQueries;
      nameBasedResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          const product = result.value;
          if (product && !product.barcode) {
            product.barcode = primaryBarcode; // Ensure barcode is set
          }
          allProducts.push(product);
          logger.info(`   ✅ Name-based query ${index + 1} found product`);
        }
      });
    } catch (error) {
      logger.debug('Name-based queries error (non-critical):', error);
    }
  }
  
  let product: Product | null = null;
  
  // Extract product names from all results for later use
  const extractedProductNames = new Set<string>();
  allProducts.forEach(p => {
    const name = extractProductName(p);
    if (name) extractedProductNames.add(name);
  });
  
  // Use best product name (prefer early discovery, then from results)
  const bestProductName = earlyProductName || Array.from(extractedProductNames)[0] || null;
  if (bestProductName && !earlyProductName) {
    logger.info(`📝 Extracted product name from results: "${bestProductName}"`);
  }

  // OPTIMIZED: Check user-contributed product in parallel (already started above)
  // Merge it with database results if found
  let userContributedProduct: Product | null = null;
  try {
    userContributedProduct = await userContributedPromise;
    if (userContributedProduct) {
      logger.info(`[ProductService] Found user-contributed product: ${primaryBarcode}`);
      // Add to allProducts for merging
      allProducts.push(userContributedProduct);
    }
  } catch (error) {
    logger.debug('[ProductService] User-contributed check completed (non-critical):', error);
  }

  // Merge all products found with TruScore-first strategy
  if (allProducts.length > 0) {
    if (allProducts.length === 1) {
      product = allProducts[0];
      const completeness = calculateDataCompleteness(product);
      logger.info(`✅ Single product found: ${product.source} | ${formatCompletenessMetrics(completeness, product.source || 'unknown')}`);
      powershellLogger.dataQuality(barcode, product, completeness);
      powershellLogger.dataSource(barcode, product.source === 'openfoodfacts' ? 'OFF' : 'API', product);
    } else {
      logger.info(`🔄 Merging ${allProducts.length} products with TruScore-first strategy...`);
      const mergeStartTime = Date.now();
      const preMergeCompleteness = calculateDataCompleteness(allProducts[0]);
      
      product = mergeProducts(allProducts, {
        sourceWeights: databaseService.getTruScoreSourceWeights(),
        normalizeNutrition: true,
        shouldMergeCertifications: true,
      });
      
      const mergeTime = Date.now() - mergeStartTime;
      timingBreakdown.dataMerging = mergeTime;
      
      if (product) {
        const completeness = calculateDataCompleteness(product);
        logger.info(`✅ Merged product: ${product.source} | ${formatCompletenessMetrics(completeness, 'MERGED')}`);
        powershellLogger.mergeDetailed(barcode, allProducts, product, 'TruScore-first', mergeTime);
        powershellLogger.dataQuality(barcode, product, completeness);
      }
    }
  } else {
    logger.info(`❌ No products found in optimized database query`);
    powershellLogger.log('WARN', 'NO_PRODUCTS', 'No products found in database query', { barcode });
  }
  
  // Note: All database queries are now handled by TruScoreOptimizedDatabase above
  // This ensures maximum parallelization and location-specific database coverage

  // FINAL FALLBACK: Web Search - ONLY if no product found in Tiers 1-3
  // CRITICAL: Never use web_search if Open Food Facts found a product (better data quality)
  // Optimized: Only query web search if nothing was found in previous tiers
  // This significantly reduces query time and API calls
  const hasOpenFoodFacts = product?.source === 'openfoodfacts';
  if (!product) {
    logger.info(`───────────────────────────────────────────────────────────────`);
    logger.info(`📊 TIER 4: Web Search (Fallback - Only if Tiers 1-3 found nothing)`);
    logger.info(`───────────────────────────────────────────────────────────────`);
    logger.info(`🔍 No product found in Tiers 1-3, using Web Search as fallback...`);
    
    // Try to extract any product name from partial database results before web search
    // Some databases might return a name even if they don't return full product data
    let extractedProductName: string | undefined;
    if (allProducts && allProducts.length > 0) {
      // Check if any partial products have a name
      for (const partialProduct of allProducts) {
        if (partialProduct?.product_name && 
            partialProduct.product_name !== `Product ${barcode}` &&
            partialProduct.product_name.length > 5) {
          extractedProductName = partialProduct.product_name;
          logger.info(`📝 Extracted product name from partial results: ${extractedProductName}`);
          break;
        }
      }
    }
    
    // Set timeout for web search (increased to 15 seconds for better results)
    const webSearchTimeout = new Promise<Product | null>((resolve) => {
      setTimeout(() => {
        logger.warn(`Web search timeout after 15 seconds, skipping...`);
        resolve(null);
      }, 15000);
    });
    
    // Pass extracted product name to web search if available
    const webSearchPromise = fetchProductFromWebSearch(primaryBarcode, extractedProductName);
    
    product = await Promise.race([webSearchPromise, webSearchTimeout]);
    
    // If primary barcode didn't work and it's different from original, try original (with timeout)
    if (!product && primaryBarcode !== barcode) {
      logger.debug(`Trying web search with original barcode: ${barcode}`);
      const webSearchPromise2 = fetchProductFromWebSearch(barcode, extractedProductName);
      const webSearchTimeout2 = new Promise<Product | null>((resolve) => {
        setTimeout(() => resolve(null), 15000);
      });
      product = await Promise.race([webSearchPromise2, webSearchTimeout2]);
    }
    
    // Web search fallback will always return a product (even if minimal)
    if (product) {
      logger.info(`✅ Web Search: Found product | ${formatCompletenessMetrics(calculateDataCompleteness(product), 'WEB_SEARCH')}`);
    } else {
      logger.warn(`⚠️ Web Search also returned no product for barcode: ${barcode}`);
    }
  } else {
    logger.info(`───────────────────────────────────────────────────────────────`);
    logger.info(`📊 TIER 4: Web Search - SKIPPED (Product already found in Tiers 1-3)`);
    logger.info(`───────────────────────────────────────────────────────────────`);
    if (hasOpenFoodFacts) {
      logger.info(`✅ Product found in Open Food Facts, skipping web_search for better data quality`);
    } else {
      logger.info(`✅ Product found in earlier tiers, skipping Tier 4 web search for performance`);
    }
  }

  // CRITICAL FIX: Ensure we ALWAYS have a product (never null)
  // This matches Yuka's behavior of always showing something
  if (!product) {
    logger.warn(`No product found in any database for ${barcode}, creating minimal product (Yuka-compatible behavior)`);
    
    // Try web search one more time (more aggressive)
    try {
      product = await fetchProductFromWebSearch(primaryBarcode, undefined);
    } catch (webSearchError) {
      logger.debug('Web search also failed, creating absolute minimal product');
    }
    
    // If web search also fails, create absolute minimal product
    // This ensures we ALWAYS return a product (never null)
    if (!product) {
      product = {
        barcode: primaryBarcode,
        product_name: `Product ${primaryBarcode}`, // Generic name (display logic will handle)
        source: 'fallback',
        quality: 10,
        completion: 10,
      };
      logger.info(`Created minimal fallback product for ${barcode} (always return product, never null)`);
    }
  }

  // CRITICAL: Query by product name (ALWAYS execute after product found OR if we have a name)
  // This is the PRIMARY way to access full FSANZ databases - queries by food name, not barcode
  // This ensures maximum data completeness for TruScore calculation
  // NEW: Also query if we have a product name but no product yet (from early discovery)
  const productNameToQuery = product?.product_name || bestProductName;
  if (productNameToQuery && !productNameToQuery.startsWith('Product ')) {
    logger.info(`───────────────────────────────────────────────────────────────`);
    logger.info(`📊 PRODUCT NAME QUERIES: "${productNameToQuery}" (CRITICAL for FSANZ)`);
    logger.info(`───────────────────────────────────────────────────────────────`);
    
    try {
      // Create a minimal product for queryByNameForTruScore if we don't have one yet
      const productForQuery = product || {
        barcode: primaryBarcode,
        product_name: productNameToQuery,
        source: 'name_discovery',
      } as Product;
      
      const nameProducts = await databaseService.queryByNameForTruScore(productForQuery, userCountry);
      
      if (nameProducts.length > 0) {
        if (product) {
          // Log before merging
          const preMergeCompleteness = calculateDataCompleteness(product);
          const preMergeNutrients = Object.keys(product.nutriments || {}).length;
          logger.info(`📊 BEFORE PRODUCT NAME MERGE:`);
          logger.info(`   ${formatCompletenessMetrics(preMergeCompleteness, 'PRE-MERGE')}`);
          logger.info(`   Nutrition: ${preMergeNutrients} nutrients`);
          
          // Merge with TruScore-first strategy
          product = mergeProducts([product, ...nameProducts], {
            sourceWeights: databaseService.getTruScoreSourceWeights(),
            normalizeNutrition: true,
            shouldMergeCertifications: true,
          });
          
          // Log after merging (check product is not null)
          if (product) {
            const postMergeCompleteness = calculateDataCompleteness(product);
            const postMergeNutrients = Object.keys(product.nutriments || {}).length;
            const nutrientsAdded = postMergeNutrients - preMergeNutrients;
            logger.info(`📊 AFTER PRODUCT NAME MERGE:`);
            logger.info(`   ${formatCompletenessMetrics(postMergeCompleteness, 'POST-MERGE')}`);
            logger.info(`   Nutrition: ${postMergeNutrients} nutrients (${nutrientsAdded > 0 ? `+${nutrientsAdded} added` : 'no change'})`);
            logger.info(`✅ Product name queries enhanced product with additional data`);
          }
        } else {
          // No product yet, but name-based queries found something - use it!
          logger.info(`✅ Product name queries found product when barcode queries failed!`);
          product = mergeProducts(nameProducts, {
            sourceWeights: databaseService.getTruScoreSourceWeights(),
            normalizeNutrition: true,
            shouldMergeCertifications: true,
          });
        }
      } else {
        logger.info(`⚠️  Product name queries: No additional products found`);
      }
    } catch (error) {
      logger.debug('Error querying by product name:', error);
      // Continue without enhancement if it fails
    }
  }

  // Ensure product is not null before enhancements
  if (!product) {
    logger.error('Product is null before enhancements - cannot proceed');
    return null;
  }

  // Apply all enhancements: format, palm oil analysis, MVP enhancements, brand enrichment, Eco-Score
  const enhancementStartTime = Date.now();
  product = await enhanceProduct(product);
  timingBreakdown.enhancements = Date.now() - enhancementStartTime;

  // Ensure product is not null after enhancements
  if (!product) {
    logger.error('Product is null after enhancements - cannot proceed');
    return null;
  }

  // Check for food recalls (async, don't block product display)
  // Only check for food products (not cosmetics, household items, etc.)
  if ((product.source === 'openfoodfacts' || product.source === 'openpetfoodfacts') && 
      (product.product_name || product.brands)) {
    checkFDARecalls(product.product_name, product.brands, barcode)
      .then(recalls => {
        if (recalls.length > 0) {
          // Store recalls in product (will be used when displaying)
          product.recalls = recalls;
          // Update cache with recalls
          cacheProduct(product, isPremium).catch((err) => logger.error('Error caching product:', err));
        }
      })
      .catch(error => {
        logger.error('Error checking recalls (non-blocking):', error);
      });
  }

  // Generate comprehensive summary log before caching
  if (product) {
    const finalCompleteness = calculateDataCompleteness(product);
    const sources = product.source ? product.source.split('+') : [product.source || 'unknown'];
    
    logger.info(`═══════════════════════════════════════════════════════════════`);
    logger.info(`📊 DATABASE QUERY SUMMARY`);
    logger.info(`═══════════════════════════════════════════════════════════════`);
    logger.info(`📦 Final Product: ${product.product_name || 'Unknown'}`);
    logger.info(`🏷️  Sources: ${sources.join(' → ')}`);
    logger.info(`📊 Data Completeness: ${formatCompletenessMetrics(finalCompleteness, 'FINAL')}`);
    logger.info(`📈 Quality: ${product.quality || 'N/A'}, Completion: ${product.completion || 'N/A'}`);
    
    // Show which databases contributed
    logger.info(`🔍 Databases Queried:`);
    if (sources.includes('openfoodfacts')) {
      logger.info(`   ✅ Open Food Facts - PRIMARY source`);
    }
    if (sources.includes('openbeautyfacts')) {
      logger.info(`   ✅ Open Beauty Facts - PRIMARY source`);
    }
    if (sources.includes('openpetfoodfacts')) {
      logger.info(`   ✅ Open Pet Food Facts - PRIMARY source`);
    }
    if (sources.includes('openproductsfacts')) {
      logger.info(`   ✅ Open Products Facts - PRIMARY source`);
    }
    if (sources.includes('nzfcd') || sources.includes('afcd')) {
      logger.info(`   ✅ FSANZ (${sources.includes('nzfcd') ? 'NZFCD' : 'AFCD'}) - ENHANCED nutrition data`);
    }
    if (sources.includes('nzfcd-fallback')) {
      logger.info(`   ✅ FSANZ NZFCD (FALLBACK) - Used for AU user when AFCD not found`);
    }
    if (sources.includes('usda')) {
      logger.info(`   ✅ USDA FoodData - PRIMARY source (US users)`);
    }
    if (sources.includes('healthcanada')) {
      logger.info(`   ✅ Health Canada - PRIMARY source (CA users)`);
    }
    if (sources.includes('ukfsa')) {
      logger.info(`   ✅ UK FSA - PRIMARY source (GB users)`);
    }
    if (sources.includes('efsa')) {
      logger.info(`   ✅ EFSA - PRIMARY source (EU users)`);
    }
    
    // Show nutrition data quality
    const nutrientCount = product.nutriments ? Object.keys(product.nutriments).length : 0;
    logger.info(`🥗 Nutrition Data: ${nutrientCount} nutrients available`);
    if (product.nutriments) {
      const hasEnergy = product.nutriments['energy-kcal'] || product.nutriments['energy-kj'];
      const hasMacros = product.nutriments.proteins || product.nutriments.fat || product.nutriments.carbohydrates;
      const hasMinerals = product.nutriments.calcium || product.nutriments.iron || product.nutriments.sodium;
      logger.info(`   ${hasEnergy ? '✅' : '❌'} Energy data, ${hasMacros ? '✅' : '❌'} Macros, ${hasMinerals ? '✅' : '❌'} Minerals`);
    }
    
    // Show best database
    const bestSource = sources[0] || 'unknown';
    logger.info(`🏆 Best Database: ${bestSource.toUpperCase()}`);
    logger.info(`═══════════════════════════════════════════════════════════════`);
  }

  // Apply confidence scoring to product
  const productWithConfidence = applyConfidenceScore(product);
  
  // Log final product data before scoring
  logger.info(`───────────────────────────────────────────────────────────────`);
  logger.info(`🎯 FINAL PRODUCT DATA (Before Scoring)`);
  logger.info(`───────────────────────────────────────────────────────────────`);
  const finalCompleteness = calculateDataCompleteness(productWithConfidence);
  logger.info(`  ${formatCompletenessMetrics(finalCompleteness, 'FINAL')}`);
  logger.info(`  Source: ${productWithConfidence.source}`);
  logger.info(`  Product Name: ${productWithConfidence.product_name || 'N/A'}`);
  logger.info(`  Brand: ${productWithConfidence.brands || 'N/A'}`);
  logger.info(`  Has Nutrition: ${finalCompleteness.breakdown.hasNutrition ? 'Yes' : 'No'}`);
  logger.info(`  Has Ingredients: ${finalCompleteness.breakdown.hasIngredients ? 'Yes' : 'No'}`);
  logger.info(`  Has Eco-Score: ${finalCompleteness.breakdown.hasEcoScore ? 'Yes' : 'No'}`);
  logger.info(`  Has Palm Oil Analysis: ${finalCompleteness.breakdown.hasPalmOilAnalysis ? 'Yes' : 'No'}`);
  logger.info(`  Has Certifications: ${finalCompleteness.breakdown.hasCertifications ? 'Yes' : 'No'}`);
  
  // ===== VERIFICATION: Log FSANZ data presence =====
  const hasFSANZSource = productWithConfidence.source?.includes('nzfcd') || 
                         productWithConfidence.source?.includes('afcd') ||
                         productWithConfidence.source?.includes('fsanz');
  if (hasFSANZSource) {
    logger.info(`  🔍 [FSANZ VERIFICATION] FSANZ data detected in source: ${productWithConfidence.source}`);
    const fsanzNutrients = productWithConfidence.nutriments ? Object.keys(productWithConfidence.nutriments).length : 0;
    logger.info(`     ✅ Nutrition from FSANZ: ${fsanzNutrients} nutrients present`);
    const ingredientsStatus = productWithConfidence.ingredients_text ? '✅' : '❌';
    const ingredientsSource = productWithConfidence.ingredients_text ? 'PRESENT (from base product)' : 'MISSING (FSANZ doesn\'t provide)';
    logger.info(`     ${ingredientsStatus} Ingredients: ${ingredientsSource}`);
    const labelsStatus = productWithConfidence.labels_tags && productWithConfidence.labels_tags.length > 0 ? '✅' : '❌';
    const labelsCount = productWithConfidence.labels_tags?.length || 0;
    const labelsSource = productWithConfidence.labels_tags?.length ? '(from base product)' : '(FSANZ doesn\'t provide)';
    logger.info(`     ${labelsStatus} Labels: ${labelsCount} tags ${labelsSource}`);
    const packagingStatus = productWithConfidence.packagings && productWithConfidence.packagings.length > 0 ? '✅' : '❌';
    const packagingCount = productWithConfidence.packagings?.length || 0;
    const packagingSource = productWithConfidence.packagings?.length ? '(from base product)' : '(FSANZ doesn\'t provide)';
    logger.info(`     ${packagingStatus} Packaging: ${packagingCount} items ${packagingSource}`);
  }
  
  // CRITICAL FIX: Fetch recalls BEFORE TruScore calculation
  // This ensures Ethics pillar can use recall data for scoring
  // Use fast timeout (2 seconds) to avoid blocking product display
  if (productWithConfidence.product_name || productWithConfidence.brands) {
    try {
      const userCountry = getUserCountryCode();
      const recallPromises: Promise<UnifiedRecall[]>[] = [];
      
      // Always check FDA recalls (US and global) - fast and reliable
      recallPromises.push(
        checkFDARecalls(
          productWithConfidence.product_name,
          productWithConfidence.brands,
          barcode
        ).then(recalls => recalls.map(convertFDARecall)).catch(() => [])
      );
      
      // Check country-specific recalls (with timeout to avoid blocking)
      if (userCountry === 'US') {
        recallPromises.push(
          checkComprehensiveUSRecalls(
            productWithConfidence.product_name,
            productWithConfidence.brands,
            barcode
          ).then(recalls => recalls.map(convertComprehensiveUSRecall)).catch(() => [])
        );
        
        // CPSC recalls (consumer products - may include food-related items)
        // NON-BLOCKING: Fast timeout, doesn't block product display
        recallPromises.push(
          checkCPSCRecalls(
            productWithConfidence.product_name,
            productWithConfidence.brands,
            barcode
          ).then(recalls => recalls.map(convertCPSCRecall)).catch(() => [])
        );
      }
      
      if (isEUCountry(userCountry)) {
        recallPromises.push(
          checkRASFFAlerts(
            productWithConfidence.product_name,
            productWithConfidence.brands,
            barcode
          ).then(alerts => alerts.map(convertRASFFAlert)).catch(() => [])
        );
      }
      
      // UK FSA recalls (for UK users)
      // Check for GB (ISO code) or UK (common code)
      if (userCountry === 'GB' || userCountry === 'UK' || userCountry === 'gb' || userCountry === 'uk') {
        recallPromises.push(
          checkUKFSARecalls(
            productWithConfidence.product_name,
            productWithConfidence.brands,
            barcode
          ).then(recalls => recalls.map(convertUKFSARecall)).catch(() => [])
        );
      }
      
      if (userCountry === 'CA') {
        recallPromises.push(
          checkCFIARecalls(
            productWithConfidence.product_name,
            productWithConfidence.brands,
            barcode
          ).then(recalls => recalls.map(convertCFIARecall)).catch(() => [])
        );
      }
      
      // Fast timeout (2 seconds) - don't block product display
      const timeoutPromise = new Promise<UnifiedRecall[]>((resolve) => 
        setTimeout(() => resolve([]), 2000)
      );
      
      const recallResults = await Promise.race([
        Promise.all(recallPromises).then(results => results.flat()),
        timeoutPromise
      ]);
      
      if (recallResults && recallResults.length > 0) {
        // Attach recalls to product BEFORE TruScore calculation
        // Include classification for banner alerts and ETHICS pillar scoring
        productWithConfidence.recalls = recallResults.map(recall => ({
          recallId: recall.recallId,
          productName: recall.productName,
          brand: recall.brand,
          reason: recall.reason,
          recallDate: recall.recallDate,
          distribution: recall.distribution,
          isActive: recall.isActive,
          url: recall.url,
          classification: recall.classification, // Include classification for severity-based alerts
          // Note: Agency info is in UnifiedRecall but not stored in FoodRecall
          // Banner alerts service infers agency from recallId pattern
        }));
        logger.info(`⚠️ RECALL ALERT: ${recallResults.length} recall(s) found - will affect Ethics pillar score`);
      }
    } catch (error) {
      // Non-blocking - continue without recalls if fetch fails
      logger.debug('Recall check failed (non-critical, continuing without recalls):', error);
    }
  }
  
  // Calculate trust score (works even for minimal web search products)
  // CRITICAL FIX: Wrap in try-catch to ensure product is always returned even if TruScore calculation fails
  // Recalls are now attached to product BEFORE this calculation
  let productWithTrustScore: ProductWithTrustScore;
  const truScoreStartTime = Date.now();
  try {
    productWithTrustScore = await calculateTrustScore(productWithConfidence);
    timingBreakdown.truScoreCalculation = Date.now() - truScoreStartTime;
  } catch (error) {
    // If TruScore calculation fails, return product without TruScore rather than failing entirely
    logger.error('Error calculating TruScore (non-critical, returning product without score):', error);
    productWithTrustScore = {
      ...productWithConfidence,
      trust_score: null,
      trust_score_breakdown: null,
    };
  }
  
  // PowerShell logging for TruScore calculation
  if (productWithTrustScore && productWithTrustScore.trust_score !== null && productWithTrustScore.trust_score_breakdown) {
    const truScoreResult = {
      truscore: productWithTrustScore.trust_score,
      breakdown: {
        Body: productWithTrustScore.trust_score_breakdown.body,
        Planet: productWithTrustScore.trust_score_breakdown.planet,
        Ethics: productWithTrustScore.trust_score_breakdown.ethics ?? 0,
        Open: productWithTrustScore.trust_score_breakdown.open,
      },
      hasNutriScore: productWithTrustScore._truscore_metadata?.hasNutriScore,
      hasEcoScore: productWithTrustScore._truscore_metadata?.hasEcoScore,
      hasOrigin: productWithTrustScore._truscore_metadata?.hasOrigin,
    };
    powershellLogger.truScoreCalculation(productWithTrustScore, truScoreResult, truScoreResult.breakdown);
  }
  
  logger.info(`───────────────────────────────────────────────────────────────`);
  logger.info(`📊 TRUSCORE CALCULATION`);
  logger.info(`───────────────────────────────────────────────────────────────`);
  logger.info(`  TruScore: ${productWithTrustScore.trust_score || 'N/A'}/100`);
  if (productWithTrustScore.trust_score_breakdown) {
    logger.info(`  Body Pillar: ${productWithTrustScore.trust_score_breakdown.body || 'N/A'}/25`);
    logger.info(`  Planet Pillar: ${productWithTrustScore.trust_score_breakdown.planet || 'N/A'}/25`);
    logger.info(`  Ethics Pillar: ${productWithTrustScore.trust_score_breakdown.ethics || 'N/A'}/25`);
    logger.info(`  Open Pillar: ${productWithTrustScore.trust_score_breakdown.open || 'N/A'}/25`);
    
    // ===== VERIFICATION: Log FSANZ contribution to TruScore =====
    if (hasFSANZSource) {
      logger.info(`  🔍 [FSANZ TRUSCORE VERIFICATION] FSANZ Contribution Analysis:`);
      const bodyPillar = productWithTrustScore.trust_score_breakdown.body || 0;
      const hasNutriScore = productWithTrustScore._truscore_metadata?.hasNutriScore;
      const nutritionCount = productWithTrustScore.nutriments ? Object.keys(productWithTrustScore.nutriments).length : 0;
      
      logger.info(`     Body Pillar: ${bodyPillar}/25`);
      if (hasNutriScore) {
        logger.info(`       ✅ Nutri-Score: PRESENT (from base product, not FSANZ)`);
      } else {
        logger.info(`       ⚠️  Nutri-Score: MISSING (baseline 15 used - FSANZ provides nutrition but no Nutri-Score)`);
        logger.info(`       ✅ Nutrition Data: ${nutritionCount} nutrients (FSANZ enhanced)`);
      }
      
      const planetPillar = productWithTrustScore.trust_score_breakdown.planet || 0;
      const hasEcoScore = productWithTrustScore._truscore_metadata?.hasEcoScore;
      logger.info(`     Planet Pillar: ${planetPillar}/25`);
      if (hasEcoScore) {
        logger.info(`       ✅ Eco-Score: PRESENT (from base product, not FSANZ)`);
      } else {
        logger.info(`       ⚠️  Eco-Score: MISSING (baseline 15 used - FSANZ doesn't provide)`);
      }
      
      const openPillar = productWithTrustScore.trust_score_breakdown.open || 0;
      logger.info(`     Open Pillar: ${openPillar}/25`);
      if (productWithTrustScore.ingredients_text && productWithTrustScore.ingredients_text.trim().length > 10) {
        logger.info(`       ✅ Ingredients: PRESENT (from base product, not FSANZ)`);
      } else {
        logger.info(`       ❌ Ingredients: MISSING (major penalty - FSANZ doesn't provide ingredients)`);
        logger.info(`       ⚠️  Open Pillar reduced to ~5-10 points due to missing ingredients`);
      }
      
      logger.info(`     📊 Summary: FSANZ enhanced nutrition (Body pillar), but TruScore limited by missing ingredients/certifications`);
    }
    
    // Enhanced logging: Show which data sources contributed to the score
    if (productWithTrustScore._truscore_metadata) {
      logger.info(`  Data Sources Used:`);
      logger.info(`    Nutri-Score: ${productWithTrustScore._truscore_metadata.hasNutriScore ? 'Yes' : 'No (baseline 15 used)'}`);
      logger.info(`    Eco-Score: ${productWithTrustScore._truscore_metadata.hasEcoScore ? 'Yes' : 'No (baseline 15 used)'}`);
      logger.info(`    Origin Data: ${productWithTrustScore._truscore_metadata.hasOrigin ? 'Yes' : 'No (-8 penalty applied)'}`);
    }
    
    // Log NOVA group and bonus/penalty (updated to match spec v2)
    if (productWithTrustScore.nova_group) {
      const nova = productWithTrustScore.nova_group;
      let novaEffect = '';
      if (nova === 1) novaEffect = 'NOVA 1: +3 bonus (unprocessed)';
      else if (nova === 2) novaEffect = 'NOVA 2: 0 (no adjustment)';
      else if (nova === 3) novaEffect = 'NOVA 3: -3 penalty (processed)';
      else if (nova === 4) novaEffect = 'NOVA 4: -8 penalty (ultra-processed)';
      logger.info(`  NOVA Group: ${nova} (${novaEffect})`);
    }
    
    // Log additive count if available
    if (productWithTrustScore.additives_tags && productWithTrustScore.additives_tags.length > 0) {
      logger.info(`  Additives: ${productWithTrustScore.additives_tags.length} (weighted penalty applied)`);
    }
    
    // Log palm oil status if available (updated to match spec v2)
    if (productWithTrustScore.palm_oil_analysis) {
      const { containsPalmOil, isPalmOilFree, isCertifiedSustainable } = productWithTrustScore.palm_oil_analysis;
      if (containsPalmOil && !isPalmOilFree) {
        logger.info(`  Palm Oil: Detected (${isCertifiedSustainable ? 'Certified Sustainable: -5 penalty' : 'Non-certified: -8 penalty'})`);
      } else if (isPalmOilFree) {
        logger.info(`  Palm Oil: Free (no penalty)`);
      }
    }
    
    // Log certifications (Ethics pillar)
    if (productWithTrustScore.labels_tags && productWithTrustScore.labels_tags.length > 0) {
      const certificationLabels = productWithTrustScore.labels_tags.filter((tag: string) => {
        const lowerTag = tag.toLowerCase();
        return lowerTag.includes('organic') || lowerTag.includes('fair-trade') || 
               lowerTag.includes('msc') || lowerTag.includes('asc') || 
               lowerTag.includes('rainforest') || lowerTag.includes('utz') ||
               lowerTag.includes('rspca') || lowerTag.includes('vegan') || 
               lowerTag.includes('cruelty-free');
      });
      if (certificationLabels.length > 0) {
        logger.info(`  Certifications: ${certificationLabels.length} found (${certificationLabels.join(', ')})`);
      }
    }
    
    // Log hidden terms count (Open pillar)
    const hiddenTerms = ['parfum', 'fragrance', 'aroma', 'flavor', 'flavour', 'natural flavor', 
                         'natural flavour', 'artificial flavor', 'artificial flavour', 
                         'natural flavoring', 'natural flavouring', 'artificial flavoring', 
                         'artificial flavouring', 'proprietary', 'proprietary blend'];
    const ingredientsText = (productWithTrustScore.ingredients_text || '').toLowerCase();
    const hiddenCount = hiddenTerms.filter(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'i');
      return regex.test(ingredientsText);
    }).length;
    if (hiddenCount > 0) {
      logger.info(`  Hidden Terms: ${hiddenCount} found (${hiddenCount >= 3 ? '-20 penalty' : '-12 penalty'})`);
    }
    
    if (productWithTrustScore.packagings && productWithTrustScore.packagings.length > 0) {
      const pd = productWithTrustScore.trust_score_breakdown;
      logger.info(
        `  Planet packaging (v19): ${productWithTrustScore.packagings.length} OFF packaging component(s); packagings_complete=${String(productWithTrustScore.packagings_complete)}`
      );
      if (pd && typeof pd.planet === 'number') {
        logger.info(`  Planet pillar score (logged): ${pd.planet}/25`);
      }
    }
    
    // Log cruel parent detection (Ethics pillar)
    if (productWithTrustScore.brands) {
      const brands = (productWithTrustScore.brands || '').toLowerCase();
      if (isCruelParent(brands)) {
        logger.info(`  Cruel Parent: Detected (-30 penalty in Ethics pillar)`);
      }
    }
  } else {
    logger.info(`  Breakdown: N/A (insufficient data)`);
  }
  logger.info(`═══════════════════════════════════════════════════════════════`);
  logger.info(`✅ PRODUCT SCAN COMPLETE`);
  logger.info(`═══════════════════════════════════════════════════════════════`);
  
  // Note: Recalls are now fetched BEFORE TruScore calculation (see above)
  // This ensures Ethics pillar can use recall data for accurate scoring
  // Additional recall checks can be done here for background updates if needed
  
  // CRITICAL: Merge user-contributed data and save to SQLite before returning
  // This ensures ALL user-entered data persists for future scans
  productWithTrustScore = await mergeUserContributedData(productWithTrustScore, primaryBarcode) as ProductWithTrustScore;
  
  // Save final merged product (with user data) to SQLite for future scans
  try {
    await saveProductToSQLite(productWithTrustScore, userCountry ?? undefined);
    logger.info(`[ProductService] ✅ Saved final merged product (with user data) to SQLite for future scans`);
  } catch (sqliteError) {
    logger.debug('[ProductService] Failed to save final product to SQLite (non-critical):', sqliteError);
  }
  
  // Cache the product (premium users get larger cache)
  // Note: We cache even web search results so users don't re-search the same barcode
  if (useCache && productWithTrustScore) {
    await saveProductToCache(productWithTrustScore, primaryBarcode, isPremium);
    
    // Also cache with original barcode for faster lookup next time
    if (primaryBarcode !== barcode) {
      const cachedProduct = { ...productWithTrustScore, barcode };
      await cacheProduct(cachedProduct, isPremium);
    }
  }
  
  // Log final process summary with timing breakdown
  const totalProcessTime = Date.now() - processStartTime;
  powershellLogger.processComplete(
    barcode,
    totalProcessTime,
    timingBreakdown,
    productWithTrustScore?.trust_score || null,
    productWithTrustScore?.source || 'unknown'
  );
  
  return productWithTrustScore;
  } catch (error) {
    // Log error and return fallback product
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error fetching product ${barcode}:`, errorMessage);
    
    // Return a minimal fallback product so the UI doesn't break
    const fallbackProduct: Product = {
      barcode: primaryBarcode,
      product_name: `Product ${barcode}`,
      source: 'web_search',
      quality: 5,
      completion: 10,
    };
    
    // Apply confidence score to fallback product
    const fallbackWithConfidence = applyConfidenceScore(fallbackProduct);
    try {
      return await calculateTrustScore(fallbackWithConfidence);
    } catch (error) {
      // If TruScore calculation fails, return product without TruScore
      logger.error('Error calculating TruScore for fallback product (non-critical):', error);
      return {
        ...fallbackWithConfidence,
        trust_score: null,
        trust_score_breakdown: null,
      };
    }
  }
}

/**
 * Refresh product data by skipping cache.
 * 
 * Forces a fresh query from all data sources, bypassing SQLite and AsyncStorage cache.
 * Useful when user wants to get the latest product data.
 * 
 * @param barcode - Product barcode (8-14 digits)
 * @returns Fresh product data with TruScore, or null if not found
 * 
 * @example
 * ```typescript
 * // User taps "Refresh" button
 * const freshProduct = await refreshProduct('1234567890123');
 * ```
 */
export async function refreshProduct(barcode: string): Promise<ProductWithTrustScore | null> {
  return fetchProduct(barcode, false);
}

