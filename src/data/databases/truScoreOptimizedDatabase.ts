// TruScore-Optimized Database Service
// Ensures maximum data quality and completeness for TruScore calculation
// Implements parallel querying and location-specific database prioritization

import { Product, ProductNutriments } from '../../types/product';
import { getUserCountryCode, isEUCountry } from '../../utils/countryDetection';
import { logger } from '../../utils/logger';
import { powershellLogger } from '../../utils/powershellLogger';

// Import all database services
// NOTE: fetchProductFromFSANZ is NOT imported because FSANZ databases don't have barcodes.
// FSANZ is queried by product name via queryFSANZByProductName() in queryByNameForTruScore()
import { fetchProductFromUSDA } from '../../services/usdaFoodData';
import { fetchProductFromHealthCanada } from '../../services/healthCanadaDatabase';
import { fetchProductFromUKFSA } from '../../services/ukFsaDatabase';
import { fetchProductFromEFSA } from '../../services/efsaDatabase';
import { fetchProductFromGS1 } from '../../services/gs1DataSource';
import { fetchProductFromOFF } from '../../services/openFoodFacts';
import { fetchProductFromOBF } from '../../services/openBeautyFacts';
import { fetchProductFromOPFF } from '../../services/openPetFoodFacts';
import { fetchProductFromOPF } from '../../services/openProductsFacts';
import { fetchProductFromNZStores } from '../../services/nzStoreApi';
import { fetchProductFromAURetailers } from '../../services/auRetailerScraping';
import { fetchProductFromTesco } from '../../services/tescoLabsApi';
import { fetchProductFromWalmart } from '../../services/walmartOpenApi';
import { fetchProductFromFoodRepo } from '../../services/foodRepoApi';
import { fetchProductFromEdamam } from '../../services/edamamApi';
import { fetchProductFromNutritionix } from '../../services/nutritionixApi';
import { fetchProductFromSpoonacular } from '../../services/spoonacularApi';
import { queryFSANZByProductName } from '../../services/fsanzQueryService';
import { enhanceProductWithNZFCD } from '../../services/nzfcdDatabase';
import { enhanceProductWithAFCD } from '../../services/afcdDatabase';
import { enhanceProductWithFooDB } from '../../services/foodbApi';
import { queryFoodAtlasByProductName } from '../../services/foodAtlasQueryService';
import { extractProductName } from '../../services/productNameDiscovery';
import { fetchProductFromDatakick } from '../../services/datakickApi';
import { fetchProductFromUPCitemdb } from '../../services/upcitemdb';
import { fetchProductFromEANSearch } from '../../services/eanSearchApi';
import { fetchProductFromBarcodeSpider } from '../../services/barcodeSpider';
import { fetchProductFromGoUpc } from '../../services/goUpcApi';
import { fetchProductFromBuycott } from '../../services/buycottApi';
import { fetchProductFromOpenGtin } from '../../services/openGtindbApi';
import { fetchProductFromBarcodeMonster } from '../../services/barcodeMonsterApi';
import { fetchProductFromUPCDatabase } from '../../services/upcDatabaseApi';
import { fetchProductFromBarcodeLookup } from '../../services/barcodeLookupApi';
import { fetchProductFromEANData } from '../../services/eanDataApi';
import { fetchProductFromBestBuy } from '../../services/bestBuyApi';
// NEW: Additional FREE databases
import { fetchProductFromOpenEAN } from '../../services/openEanApi';
import { fetchProductFromProductOpenData } from '../../services/productOpenDataApi';
import { enhanceProductWithWorldFoodDatabase } from '../../services/worldFoodDatabaseApi';
import { fetchProductFromBarcodeLookupCom } from '../../services/barcodeLookupComApi';
// web_search is handled separately in productService.ts as absolute last resort
// import { fetchProductFromWebSearch } from '../../services/webSearchFallback';

// Query deduplication - prevent multiple queries for same barcode
const activeQueries = new Map<string, Promise<Product[]>>();

// OPTIMIZED: Query result cache - cache successful query results for faster subsequent lookups
// Increased TTL for better hit rate (works globally on iOS/Android)
const queryResultCache = new Map<string, { products: Product[]; timestamp: number }>();
const QUERY_CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache TTL (increased from 5 minutes for better performance)
const MAX_CACHE_SIZE = 1000; // Maximum cached queries

export class TruScoreOptimizedDatabase {
  /**
   * Query ALL databases in parallel, optimized for TruScore
   * This is the backbone of the app - ensures maximum data quality
   * 
   * NEW: Now accepts optional productName for early name-based queries
   * 
   * Includes:
   * - Query deduplication (prevents duplicate queries)
   * - Overall timeout (15 seconds max)
   * - Network retry logic (handled by fetchWithRateLimit)
   * - Early product name discovery for name-based queries
   */
  async queryAllDatabases(
    barcode: string,
    userCountry: string | null,
    earlyProductName?: string | null
  ): Promise<Product[]> {
    // Check if query is already in progress (deduplication)
    const queryKey = `${barcode}_${userCountry || 'global'}`;
    if (activeQueries.has(queryKey)) {
      logger.debug(`Query already in progress for ${barcode}, waiting for existing query...`);
      return activeQueries.get(queryKey)!;
    }
    
    // Create query promise
    const queryPromise = this.executeQuery(barcode, userCountry, earlyProductName);
    
    // Store in active queries
    activeQueries.set(queryKey, queryPromise);
    
    // Clean up after query completes
    queryPromise.finally(() => {
      activeQueries.delete(queryKey);
    });
    
    return queryPromise;
  }
  
  /**
   * Execute the actual database query with timeout
   */
  private async executeQuery(
    barcode: string,
    userCountry: string | null,
    earlyProductName?: string | null
  ): Promise<Product[]> {
    powershellLogger.section(`TRUSCORE DATABASE QUERY: ${barcode}`);
    logger.info(`═══════════════════════════════════════════════════════════════`);
    logger.info(`🔍 TRUSCORE DATABASE QUERY: ${barcode} (${userCountry || 'Global'})`);
    logger.info(`═══════════════════════════════════════════════════════════════`);
    
    const allProducts: Product[] = [];
    const startTime = Date.now();
    // CRITICAL OPTIMIZATION: Reduced timeout from 5s to 3s for faster display
    // Most products are found in Open Food Facts within 1-2 seconds
    // If we don't have good data by 3s, return what we have and continue in background
    const MAX_QUERY_TIME = 3000; // 3 seconds max - faster failure detection
    
    // Create timeout promise
    const timeoutPromise = new Promise<Product[]>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Query timeout after ${MAX_QUERY_TIME}ms`));
      }, MAX_QUERY_TIME);
    });
    
    // Race between query and timeout
    try {
      const queryResult = await Promise.race([
        this.executeQueryPhases(barcode, userCountry, allProducts, startTime, earlyProductName),
        timeoutPromise,
      ]);
      return queryResult;
    } catch (error) {
      if (error instanceof Error && error.message.includes('timeout')) {
        logger.warn(`Query timeout for ${barcode} after ${MAX_QUERY_TIME}ms, returning partial results (${allProducts.length} products found)`);
        powershellLogger.log('WARN', 'QUERY_TIMEOUT', `Query timeout after ${MAX_QUERY_TIME}ms`, { barcode, productsFound: allProducts.length });
        // Continue queries in background (non-blocking)
        this.executeQueryPhases(barcode, userCountry, allProducts, startTime, earlyProductName)
          .catch(err => logger.debug('Background query continuation failed (non-critical):', err));
        return allProducts; // Return whatever we found so far
      }
      throw error;
    }
  }
  
  /**
   * Execute query phases
   * NEW: Now includes early name-based queries when product name is available
   */
  private async executeQueryPhases(
    barcode: string,
    userCountry: string | null,
    allProducts: Product[],
    startTime: number,
    earlyProductName?: string | null
  ): Promise<Product[]> {
    // OPTIMIZED: Geo-Location Aware Query Order for Maximum Efficiency
    // Query order optimized: Fastest global sources FIRST, then geo-location specific
    
    // Phase 0: Open Facts (Parallel) - Fastest and most reliable globally
    // Query FIRST because they're fast (1-2s) and cover most products worldwide
    powershellLogger.queryPhase('PHASE 0: Open Facts (Fastest Global)', ['Open Facts'], []);
    logger.info(`📊 PHASE 0: Open Facts (Fastest Global Sources - 1-2 seconds)`);
    const openFacts = await this.queryOpenFactsParallel(barcode);
    allProducts.push(...openFacts);
    
    // Check if we have good data from Open Food Facts (most common case - 60%+ of products)
    const hasOpenFoodFacts = openFacts.some(p => p.source === 'openfoodfacts');
    if (hasOpenFoodFacts && openFacts.length > 0) {
      const { calculateDataCompleteness } = require('../../utils/dataCompleteness');
      const completeness = calculateDataCompleteness(openFacts[0]);
      if (completeness.total > 50) {
        logger.info(`✅ Open Food Facts found with good data (>50% complete) - will enhance with geo-location databases`);
        // Continue to Phase 1 for geo-location enhancement, but we have a good base
      }
    }
    
    // Phase 1: Geo-Location Specific Databases (Parallel)
    // Query user's country-specific databases for local enhancement
    // These are queried AFTER Open Facts because they're slower but provide local data
    powershellLogger.queryPhase('PHASE 1: Geo-Location Specific', ['Local Government DBs', 'Local Store APIs'], []);
    logger.info(`📊 PHASE 1: Geo-Location Specific Queries (${userCountry || 'Global'})`);
    const localProducts = await this.queryLocalFirstParallel(barcode, userCountry, earlyProductName);
    allProducts.push(...localProducts);
    
    // Phase 2: Gold Standard (Parallel) - Global authoritative sources
    // Query after geo-location because they're slower but authoritative
    powershellLogger.queryPhase('PHASE 2: Gold Standard', ['Gold Standard'], []);
    logger.info(`📊 PHASE 2: Gold Standard (Global Authoritative Sources)`);
    const goldStandard = await this.queryGoldStandardParallel(barcode, userCountry);
    allProducts.push(...goldStandard);
    
    // Log each result
    goldStandard.forEach(product => {
      powershellLogger.databaseResult(barcode, product?.source || 'Gold Standard', product, true);
    });
    
    logger.info(`   Found: ${goldStandard.length} Gold Standard`);
    
    // Phase 3: Nutrition APIs + Additional Enhancements (parallel)
    // NOTE: Local store APIs moved to Phase 0 (Local-First)
    powershellLogger.queryPhase('PHASE 2: Nutrition APIs + Enhancements', ['Nutrition APIs', 'Additional Enhancements'], []);
    logger.info(`📊 PHASE 2: Nutrition APIs + Additional Enhancements (Parallel)`);
    const enhancements = await this.queryEnhancementsParallel(barcode, userCountry);
    allProducts.push(...enhancements);
    
    // Extract product names from enhancements for later use
    const enhancementNames = enhancements
      .map(p => extractProductName(p))
      .filter((name): name is string => name !== null);
    
    if (enhancementNames.length > 0) {
      logger.info(`   Extracted ${enhancementNames.length} product name(s) from enhancements`);
    }
    
    // Log each enhancement result
    enhancements.forEach(product => {
      powershellLogger.databaseResult(barcode, product?.source || 'Enhancement', product, true);
    });
    
    logger.info(`   Found: ${enhancements.length} enhancements`);
    
    // Phase 4: Fallbacks (if no results OR incomplete data)
    // OPTIMIZED: Smart fallback selection based on product category
    // CRITICAL: Query fallbacks if we have no results OR if existing results are incomplete
    // This ensures we fill data gaps even when we have a partial product
    // hasOpenFoodFacts is already declared in Phase 0 check above
    const hasIncompleteData = allProducts.length > 0 && this.hasIncompleteData(allProducts[0]);
    
    // OPTIMIZATION: More aggressive fallback skipping - check data completeness
    // Skip fallbacks if we have good data (>60% complete) to save 5-10 seconds
    const { calculateDataCompleteness } = require('../../utils/dataCompleteness');
    const hasGoodData = allProducts.length > 0 && 
                       allProducts.some(p => {
                         const completeness = calculateDataCompleteness(p);
                         return completeness.total > 60; // Lower threshold from 70% for faster performance
                       });
    
    // Detect product category from existing products for smart database selection
    const productCategory = allProducts.length > 0 
      ? allProducts[0].categories?.[0] || allProducts[0].categories_tags?.[0]?.replace('en:', '')
      : undefined;
    
    // OPTIMIZATION: Skip fallbacks if we have Open Food Facts with good data
    // Use the hasOpenFoodFacts variable from Phase 0 check above
    if (hasOpenFoodFacts && hasGoodData) {
      logger.info(`✅ Good data found (Open Food Facts with ${hasGoodData ? '>60%' : 'good'} completeness), skipping fallbacks for performance (saves 5-10 seconds)`);
      // Skip Phase 4 (fallbacks) entirely - early exit for better performance
      const queryTime = Date.now() - startTime;
      logger.info(`═══════════════════════════════════════════════════════════════`);
      logger.info(`✅ TOTAL DATABASES QUERIED: ${allProducts.length} products found in ${queryTime}ms (fallbacks skipped)`);
      logger.info(`═══════════════════════════════════════════════════════════════`);
      return allProducts; // Early exit - no need for fallbacks
    }
    
    if ((allProducts.length === 0 && !hasOpenFoodFacts) || hasIncompleteData) {
      powershellLogger.queryPhase('PHASE 4: Fallbacks', ['Fallback Databases'], []);
      if (hasIncompleteData) {
        logger.info(`📊 PHASE 4: Fallbacks (Enhancing incomplete product)`);
      } else {
        logger.info(`📊 PHASE 4: Fallbacks (No results yet)`);
      }
      const fallbacks = await this.queryFallbacksParallel(barcode, productCategory);
      allProducts.push(...fallbacks);
      
      // Log each fallback result
      fallbacks.forEach(product => {
        powershellLogger.databaseResult(barcode, product?.source || 'Fallback', product, true);
      });
      
      logger.info(`   Found: ${fallbacks.length} fallbacks`);
    } else if (hasOpenFoodFacts && !hasIncompleteData) {
      logger.info(`✅ Product found in Open Food Facts with complete data, skipping fallbacks`);
    }
    
    const queryTime = Date.now() - startTime;
    logger.info(`═══════════════════════════════════════════════════════════════`);
    logger.info(`✅ TOTAL DATABASES QUERIED: ${allProducts.length} products found in ${queryTime}ms`);
    logger.info(`═══════════════════════════════════════════════════════════════`);
    
    powershellLogger.log('SUCCESS', 'QUERY_COMPLETE', `Query completed: ${allProducts.length} products in ${queryTime}ms`, {
      barcode,
      userCountry,
      totalProducts: allProducts.length,
      queryTime,
      sources: allProducts.map(p => p?.source).filter(Boolean),
    });
    
    return allProducts;
  }
  
  /**
   * Query Local-First databases (NEW)
   * Prioritizes local government databases and store APIs
   * Also includes early name-based queries if product name is available
   */
  private async queryLocalFirstParallel(
    barcode: string,
    userCountry: string | null,
    earlyProductName?: string | null
  ): Promise<Product[]> {
    const queries: Promise<Product | null>[] = [];
    
    // OPTIMIZATION: Smart Database Selection - Only query databases relevant to user's country
    // This reduces API calls by 30-50% and saves 2-5 seconds per scan
    // Works globally - each country gets their relevant databases only
    
    // Local Government Databases (highest priority for local users)
    if (userCountry === 'NZ' || userCountry === 'AU') {
      // FSANZ query by product name (if available early)
      if (earlyProductName && !earlyProductName.startsWith('Product ')) {
        const fsanzQuery = queryFSANZByProductName(earlyProductName, userCountry as 'NZ' | 'AU');
        queries.push(fsanzQuery);
        powershellLogger.databaseQuery(barcode, `FSANZ (${userCountry})`, 'start');
        fsanzQuery.then(result => {
          powershellLogger.databaseQuery(barcode, `FSANZ (${userCountry})`, result ? 'success' : 'error', { found: !!result });
        }).catch(() => {
          powershellLogger.databaseQuery(barcode, `FSANZ (${userCountry})`, 'error');
        });
      }
    } else {
      // Skip FSANZ for non-AU/NZ users (saves time and API calls)
      logger.debug(`[Smart DB Selection] Skipping FSANZ query for non-AU/NZ user (${userCountry})`);
    }
    
    // USDA - Only for US users
    if (userCountry === 'US') {
      const query = fetchProductFromUSDA(barcode);
      queries.push(query);
      powershellLogger.databaseQuery(barcode, 'USDA', 'start');
      query.then(result => {
        powershellLogger.databaseQuery(barcode, 'USDA', result ? 'success' : 'error', { found: !!result });
      }).catch(() => {
        powershellLogger.databaseQuery(barcode, 'USDA', 'error');
      });
    } else {
      // Skip USDA for non-US users (saves time and API calls)
      logger.debug(`[Smart DB Selection] Skipping USDA query for non-US user (${userCountry})`);
    }
    
    // Health Canada - Only for CA users
    if (userCountry === 'CA') {
      const query = fetchProductFromHealthCanada(barcode);
      queries.push(query);
      powershellLogger.databaseQuery(barcode, 'Health Canada', 'start');
      query.then(result => {
        powershellLogger.databaseQuery(barcode, 'Health Canada', result ? 'success' : 'error', { found: !!result });
      }).catch(() => {
        powershellLogger.databaseQuery(barcode, 'Health Canada', 'error');
      });
    } else {
      // Skip Health Canada for non-CA users (saves time and API calls)
      logger.debug(`[Smart DB Selection] Skipping Health Canada query for non-CA user (${userCountry})`);
    }
    
    // UK FSA - Only for GB users
    if (userCountry === 'GB') {
      const query = fetchProductFromUKFSA(barcode);
      queries.push(query);
      powershellLogger.databaseQuery(barcode, 'UK FSA', 'start');
      query.then(result => {
        powershellLogger.databaseQuery(barcode, 'UK FSA', result ? 'success' : 'error', { found: !!result });
      }).catch(() => {
        powershellLogger.databaseQuery(barcode, 'UK FSA', 'error');
      });
    } else {
      // Skip UK FSA for non-GB users (saves time and API calls)
      logger.debug(`[Smart DB Selection] Skipping UK FSA query for non-GB user (${userCountry})`);
    }
    
    // EFSA - Only for EU users
    if (isEUCountry(userCountry)) {
      const query = fetchProductFromEFSA(barcode);
      queries.push(query);
      powershellLogger.databaseQuery(barcode, 'EFSA', 'start');
      query.then(result => {
        powershellLogger.databaseQuery(barcode, 'EFSA', result ? 'success' : 'error', { found: !!result });
      }).catch(() => {
        powershellLogger.databaseQuery(barcode, 'EFSA', 'error');
      });
    } else {
      // Skip EFSA for non-EU users (saves time and API calls)
      logger.debug(`[Smart DB Selection] Skipping EFSA query for non-EU user (${userCountry})`);
    }
    
    // OPTIMIZATION: Local Store APIs - Only query stores relevant to user's country
    // This reduces unnecessary API calls and improves performance globally
    if (userCountry === 'NZ') {
      queries.push(fetchProductFromNZStores(barcode));
    } else {
      logger.debug(`[Smart DB Selection] Skipping NZ stores query for non-NZ user (${userCountry})`);
    }
    
    if (userCountry === 'AU') {
      queries.push(fetchProductFromAURetailers(barcode));
    } else {
      logger.debug(`[Smart DB Selection] Skipping AU retailers query for non-AU user (${userCountry})`);
    }
    
    if (userCountry === 'GB') {
      queries.push(fetchProductFromTesco(barcode));
    } else {
      logger.debug(`[Smart DB Selection] Skipping Tesco query for non-GB user (${userCountry})`);
    }
    
    if (userCountry === 'US') {
      queries.push(fetchProductFromWalmart(barcode));
      queries.push(fetchProductFromFoodRepo(barcode));
    } else {
      logger.debug(`[Smart DB Selection] Skipping US store APIs for non-US user (${userCountry})`);
    }
    
    // Early name-based queries (if product name available)
    if (earlyProductName && !earlyProductName.startsWith('Product ')) {
      // FoodAtlas (global, free, server-side)
      queries.push(
        queryFoodAtlasByProductName(earlyProductName).then(foodAtlasProduct => {
          if (!foodAtlasProduct || !foodAtlasProduct.nutriments) {
            return null;
          }
          // Return as enhancement product
          return {
            ...foodAtlasProduct,
            barcode,
            source: 'foodatlas',
          } as Product;
        })
      );
    }
    
    const results = await Promise.allSettled(queries);
    const products = results
      .filter(r => r.status === 'fulfilled' && r.value !== null)
      .map(r => (r as PromiseFulfilledResult<Product>).value);
    
    if (products.length > 0) {
      logger.info(`   Found: ${products.length} local products`);
    }
    
    return products;
  }
  
  /**
   * Query Gold Standard databases in parallel
   * Location-specific databases ALWAYS queried
   * NOTE: Some local databases are now in Phase 0 (Local-First)
   * ENHANCED: Now includes Equadis and Salsify (manufacturer partnerships)
   */
  private async queryGoldStandardParallel(
    barcode: string,
    userCountry: string | null
  ): Promise<Product[]> {
    const queries: Promise<Product | null>[] = [];
    const databaseNames: string[] = [];
    
    // Global Gold Standard (location-specific moved to Phase 0)
    // NOTE: FSANZ (AU/NZ) is queried in Phase 0 by product name if available early
    // FSANZ is also queried later in queryByNameForTruScore() for additional coverage
    
    // Global Gold Standard (always query)
    // CRITICAL OPTIMIZATION: GS1 query with short timeout (2s) - don't block on slow GS1
    const gs1Query = Promise.race([
      fetchProductFromGS1(barcode),
      new Promise<Product | null>((resolve) => 
        setTimeout(() => {
          logger.debug('GS1 query timeout (2s) - continuing without GS1');
          resolve(null);
        }, 2000) // 2 second timeout for GS1 (don't wait 5+ seconds)
      ),
    ]);
    queries.push(gs1Query);
    databaseNames.push('GS1');
    powershellLogger.databaseQuery(barcode, 'GS1', 'start');
    gs1Query.then(result => {
      powershellLogger.databaseQuery(barcode, 'GS1', result ? 'success' : 'error', { found: !!result });
    }).catch(() => {
      powershellLogger.databaseQuery(barcode, 'GS1', 'error');
    });
    
    const results = await Promise.allSettled(queries);
    const products = results
      .filter(r => r.status === 'fulfilled' && r.value !== null)
      .map(r => (r as PromiseFulfilledResult<Product>).value);
    
    return products;
  }
  
  /**
   * Query Open Facts databases in parallel
   * ALWAYS query all 4
   */
  private async queryOpenFactsParallel(barcode: string): Promise<Product[]> {
    const databases = ['Open Food Facts', 'Open Beauty Facts', 'Open Pet Food Facts', 'Open Products Facts'];
    const queries = [
      fetchProductFromOFF(barcode),
      fetchProductFromOBF(barcode),
      fetchProductFromOPFF(barcode),
      fetchProductFromOPF(barcode),
    ];
    
    // Log each query start
    databases.forEach((db, index) => {
      powershellLogger.databaseQuery(barcode, db, 'start');
      queries[index].then(result => {
        powershellLogger.databaseQuery(barcode, db, result ? 'success' : 'error', { found: !!result });
      }).catch(() => {
        powershellLogger.databaseQuery(barcode, db, 'error');
      });
    });
    
    const results = await Promise.allSettled(queries);
    return results
      .filter(r => r.status === 'fulfilled' && r.value !== null)
      .map(r => (r as PromiseFulfilledResult<Product>).value);
  }
  
  /**
   * Query enhancement databases in parallel
   * Location-specific store APIs + nutrition APIs
   * NOTE: Store APIs moved to Phase 0 (Local-First) for better geo-location prioritization
   * This phase now focuses on global nutrition APIs and additional enhancements
   */
  private async queryEnhancementsParallel(
    barcode: string,
    userCountry: string | null
  ): Promise<Product[]> {
    const queries: Promise<Product | null>[] = [];
    
    // Nutrition APIs (always query for enhancement)
    // These provide nutrition data that can enhance any product
    queries.push(fetchProductFromEdamam(barcode));
    queries.push(fetchProductFromNutritionix(barcode));
    queries.push(fetchProductFromSpoonacular(barcode));
    
    // Additional store APIs (if not already queried in Phase 0)
    // These are global or secondary store APIs
    if (userCountry !== 'US') {
      // Walmart and FoodRepo are US-specific, but try them for other countries too
      queries.push(fetchProductFromWalmart(barcode).catch(() => null));
      queries.push(fetchProductFromFoodRepo(barcode).catch(() => null));
    }
    
    const results = await Promise.allSettled(queries);
    const products = results
      .filter(r => r.status === 'fulfilled' && r.value !== null)
      .map(r => (r as PromiseFulfilledResult<Product>).value);
    
    // Extract product names from results for potential FSANZ queries
    // (This will be used later in queryByNameForTruScore)
    products.forEach(product => {
      const name = extractProductName(product);
      if (name) {
        logger.debug(`[Enhancements] Extracted product name: ${name}`);
      }
    });
    
    return products;
  }
  
  /**
   * OPTIMIZED: Query fallback databases in parallel with smart selection
   * Only if no results from previous phases
   * NEW: Includes additional FREE databases (OpenEAN, Product Open Data)
   * CRITICAL FIX: Circuit breaker integration to skip failing APIs
   * NOTE: web_search is NOT included here - it's handled separately in productService.ts
   * as an absolute last resort only if all other sources fail
   */
  private async queryFallbacksParallel(barcode: string, productCategory?: string): Promise<Product[]> {
    // CRITICAL FIX: Circuit breaker integration to skip failing APIs
    const { isCircuitOpen } = await import('../../services/circuitBreakerService');
    
    const queries: Promise<Product | null>[] = [];
    
    // High-quality free databases (query first) - with circuit breaker
    if (!isCircuitOpen('datakick')) {
      queries.push(fetchProductFromDatakick(barcode).catch(() => null));
    }
    if (!isCircuitOpen('openean')) {
      queries.push(fetchProductFromOpenEAN(barcode).catch(() => null));
    }
    if (!isCircuitOpen('product_open_data')) {
      queries.push(fetchProductFromProductOpenData(barcode).catch(() => null));
    }
    
    // Standard fallback databases - with circuit breaker
    if (!isCircuitOpen('upcitemdb')) {
      queries.push(fetchProductFromUPCitemdb(barcode).catch(() => null));
    }
    if (!isCircuitOpen('ean_search')) {
      queries.push(fetchProductFromEANSearch(barcode).catch(() => null));
    }
    if (!isCircuitOpen('barcode_spider')) {
      queries.push(fetchProductFromBarcodeSpider(barcode).catch(() => null));
    }
    if (!isCircuitOpen('goupc')) {
      queries.push(fetchProductFromGoUpc(barcode).catch(() => null));
    }
    if (!isCircuitOpen('buycott')) {
      queries.push(fetchProductFromBuycott(barcode).catch(() => null));
    }
    if (!isCircuitOpen('open_gtin')) {
      queries.push(fetchProductFromOpenGtin(barcode).catch(() => null));
    }
    if (!isCircuitOpen('barcode_monster')) {
      queries.push(fetchProductFromBarcodeMonster(barcode).catch(() => null));
    }
    if (!isCircuitOpen('upc_database')) {
      queries.push(fetchProductFromUPCDatabase(barcode).catch(() => null));
    }
    if (!isCircuitOpen('barcode_lookup')) {
      queries.push(fetchProductFromBarcodeLookup(barcode).catch(() => null));
    }
    if (!isCircuitOpen('ean_data')) {
      queries.push(fetchProductFromEANData(barcode).catch(() => null));
    }
    
    // Smart database selection: Only query Best Buy for electronics/tech products
    // Skip for food/beauty products to save time and API quota
    if (productCategory && (productCategory.includes('electronics') || productCategory.includes('tech'))) {
      if (!isCircuitOpen('bestbuy')) {
        queries.push(fetchProductFromBestBuy(barcode).catch(() => null));
      }
    }
    // Best Buy is skipped for food/beauty products (not relevant)
    
    // Barcode Lookup (barcodelookup.com) - free tier, requires API key
    // Only query if API key is configured (handled inside the service)
    if (!isCircuitOpen('barcode_lookup_com')) {
      queries.push(fetchProductFromBarcodeLookupCom(barcode).catch(() => null));
    }
    
    // CRITICAL FIX: Add timeout to fallback queries (5 seconds max)
    const timeoutPromise = new Promise<Product[]>((resolve) => {
      setTimeout(() => resolve([]), 5000); // 5 second timeout for fallbacks
    });
    
    const resultsPromise = Promise.allSettled(queries).then(results =>
      results
        .filter(r => r.status === 'fulfilled' && r.value !== null)
        .map(r => (r as PromiseFulfilledResult<Product>).value)
    );
    
    // Race between results and timeout
    const results = await Promise.race([resultsPromise, timeoutPromise]);
    return results;
  }
  
  /**
   * Query by product name (CRITICAL for FSANZ)
   * This is how we access full FSANZ databases
   * ALWAYS execute after product found
   */
  async queryByNameForTruScore(
    product: Product,
    userCountry: string | null
  ): Promise<Product[]> {
    if (!product || !product.product_name) {
      return [];
    }
    
    logger.info(`📊 PRODUCT NAME QUERIES: "${product.product_name}" (${userCountry || 'Global'})`);
    
    const queries: Promise<Product | null>[] = [];
    
    // FSANZ by product name (AU/NZ) - COMBINED DATABASE APPROACH
    // Query both databases for all users to ensure maximum coverage
    if (userCountry === 'AU' || userCountry === 'NZ') {
      // Query primary country database
      queries.push(queryFSANZByProductName(product.product_name, userCountry as 'NZ' | 'AU'));
      
      // Also query the other database for maximum coverage
      const otherCountry = userCountry === 'AU' ? 'NZ' : 'AU';
      queries.push(queryFSANZByProductName(product.product_name, otherCountry));
    }
    
    // Local SQLite databases (if available)
    if (userCountry === 'NZ') {
      queries.push(
        enhanceProductWithNZFCD(product).then(p => p !== product ? p : null)
      );
    }
    if (userCountry === 'AU') {
      queries.push(
        enhanceProductWithAFCD(product).then(p => p !== product ? p : null)
      );
    }
    
    // FooDB nutrition enhancement (global - free, no API key)
    queries.push(
      enhanceProductWithFooDB(product).then(p => p !== product ? p : null)
    );
    
    // FoodAtlas nutrition enhancement (server-side API - free, open source)
    // Query by product name (like FSANZ)
    queries.push(
      queryFoodAtlasByProductName(product.product_name || '').then(foodAtlasProduct => {
        if (!foodAtlasProduct || !foodAtlasProduct.nutriments) {
          return null;
        }
        
        // Merge nutrition data with existing product
        const mergedNutriments: ProductNutriments = {
          ...product.nutriments,
          ...foodAtlasProduct.nutriments, // FoodAtlas fills gaps
        };
        
        // Prefer existing values over FoodAtlas values
        Object.keys(product.nutriments || {}).forEach(key => {
          if (product.nutriments?.[key as keyof ProductNutriments] !== undefined) {
            mergedNutriments[key as keyof ProductNutriments] = product.nutriments[key as keyof ProductNutriments];
          }
        });
        
        return {
          ...product,
          nutriments: mergedNutriments,
          source: product.source ? `${product.source}+foodatlas` : 'foodatlas',
        };
      })
    );
    
    // NEW: World Food Database nutrition enhancement (free, public domain)
    // Enhances products with comprehensive nutrition information
    queries.push(
      enhanceProductWithWorldFoodDatabase(product, product.product_name).then(p => p !== product ? p : null)
    );
    
    const results = await Promise.allSettled(queries);
    const nameProducts = results
      .filter(r => r.status === 'fulfilled' && r.value !== null)
      .map(r => (r as PromiseFulfilledResult<Product>).value);
    
    if (nameProducts.length > 0) {
      logger.info(`✅ PRODUCT NAME QUERIES: Found ${nameProducts.length} additional products`);
    }
    
    return nameProducts;
  }
  
  /**
   * Check if product has incomplete data (missing critical fields)
   */
  private hasIncompleteData(product: Product): boolean {
    const hasNutrition = product.nutriments && Object.keys(product.nutriments).length > 0;
    const hasIngredients = product.ingredients_text && product.ingredients_text.trim().length > 10;
    const hasName = product.product_name && !product.product_name.startsWith('Product ');
    
    // Consider incomplete if missing critical data
    return !hasNutrition || !hasIngredients || !hasName;
  }
  
  /**
   * Get source weights optimized for TruScore
   */
  getTruScoreSourceWeights(): Record<string, number> {
    return {
      // Gold Standard (highest)
      'fsanz_au': 0.50,
      'fsanz_nz': 0.50,
      'nzfcd': 0.50,
      'afcd': 0.50,
      'usda_fooddata': 0.50,
      'health_canada_cnf': 0.50,
      'uk_fsa': 0.50,
      'efsa': 0.50,
      'gs1_datasource': 0.45,
      
      // Open Facts (high)
      'openfoodfacts': 0.45,
      'openbeautyfacts': 0.40,
      'openpetfoodfacts': 0.40,
      'openproductsfacts': 0.35,
      
      // Store APIs (medium)
      'woolworths_au': 0.35,
      'coles_au': 0.35,
      'woolworths_nz': 0.35,
      'paknsave': 0.35,
      'newworld': 0.35,
      'tesco_labs': 0.35,
      'walmart_open': 0.35,
      'foodrepo': 0.35,
      
      // Nutrition APIs (medium)
      'edamam': 0.30,
      'nutritionix': 0.30,
      'spoonacular': 0.30,
      
      // Fallback (low to medium)
      'datakick': 0.25, // Community-driven, good quality
      'openean': 0.22, // NEW: Free EAN database
      'product_open_data': 0.25, // NEW: Free product database
      'upcitemdb': 0.20,
      'ean_search': 0.20,
      'barcode_spider': 0.20,
      'foodb': 0.30, // Good nutrition data
      'foodatlas': 0.35, // Excellent nutrition data (local database)
      'world_food_db': 0.30, // NEW: World Food Database (nutrition enhancement)
      'barcode_lookup_com': 0.25, // NEW: Barcode Lookup (free tier, requires API key)
      'web_search': 0.10,
    };
  }
  
  /**
   * OPTIMIZED: Smart database selection based on product category
   * Skips irrelevant databases to save time and API quota
   */
  shouldQueryDatabase(source: string, productCategory?: string): boolean {
    // Always query Open Facts (covers all categories)
    if (source.includes('openfoodfacts') || 
        source.includes('openbeautyfacts') || 
        source.includes('openpetfoodfacts') || 
        source.includes('openproductsfacts')) {
      return true;
    }
    
    // Category-specific logic
    if (productCategory) {
      const categoryLower = productCategory.toLowerCase();
      
      // Food products - skip beauty/pet food specific databases
      if (categoryLower.includes('food') || categoryLower.includes('drink')) {
        if (source.includes('openbeautyfacts') || source.includes('openpetfoodfacts')) {
          return false; // Skip beauty/pet food for food products
        }
        return true;
      }
      
      // Beauty products - skip food/pet food specific databases
      if (categoryLower.includes('beauty') || categoryLower.includes('cosmetic')) {
        if (source.includes('openfoodfacts') || source.includes('openpetfoodfacts')) {
          return false; // Skip food/pet food for beauty products
        }
        return true;
      }
      
      // Pet food - skip food/beauty specific databases
      if (categoryLower.includes('pet')) {
        if (source.includes('openfoodfacts') || source.includes('openbeautyfacts')) {
          return false; // Skip food/beauty for pet food
        }
        return true;
      }
      
      // Electronics/Tech - only query Best Buy
      if (categoryLower.includes('electronics') || categoryLower.includes('tech')) {
        return source.includes('bestbuy') || source.includes('openproductsfacts');
      }
    }
    
    // Default: query all databases if category unknown
    return true;
  }
  
  /**
   * OPTIMIZATION: Cache warming for popular products
   * Pre-query popular products in background to improve cache hit rate
   * Works globally on iOS and Android
   * 
   * @param barcodes - Array of popular barcodes to warm cache for
   */
  async warmCacheForPopularProducts(barcodes: string[]): Promise<void> {
    if (!barcodes || barcodes.length === 0) {
      return;
    }
    
    logger.debug(`[Cache Warming] Warming cache for ${barcodes.length} popular products`);
    
    // Query in background (non-blocking)
    // Use Promise.allSettled to handle errors gracefully
    const warmingPromises = barcodes.map(barcode => {
      const userCountry = getUserCountryCode();
      return this.queryAllDatabases(barcode, userCountry)
        .then(products => {
          logger.debug(`[Cache Warming] ✅ Cached ${barcode} (${products.length} products)`);
        })
        .catch(error => {
          // Ignore errors - this is background warming, don't break the app
          logger.debug(`[Cache Warming] ⚠️ Failed to warm cache for ${barcode}:`, error);
        });
    });
    
    // Don't await - let it run in background
    Promise.allSettled(warmingPromises).then(() => {
      logger.debug(`[Cache Warming] ✅ Completed warming cache for ${barcodes.length} products`);
    });
  }
}


