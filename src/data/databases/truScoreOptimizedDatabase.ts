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
// web_search is handled separately in productService.ts as absolute last resort
// import { fetchProductFromWebSearch } from '../../services/webSearchFallback';

// Query deduplication - prevent multiple queries for same barcode
const activeQueries = new Map<string, Promise<Product[]>>();

// Query result cache - cache successful query results for faster subsequent lookups
const queryResultCache = new Map<string, { products: Product[]; timestamp: number }>();
const QUERY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL
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
    const MAX_QUERY_TIME = 15000; // 15 seconds max
    
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
        logger.warn(`Query timeout for ${barcode} after ${MAX_QUERY_TIME}ms, returning partial results`);
        powershellLogger.log('WARN', 'QUERY_TIMEOUT', `Query timeout after ${MAX_QUERY_TIME}ms`, { barcode });
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
    // Phase 0: Local-First Queries (NEW - prioritizes local databases)
    // Query local government databases and store APIs FIRST for better geo-location support
    powershellLogger.queryPhase('PHASE 0: Local-First (Geo-Located)', ['Local Government DBs', 'Local Store APIs'], []);
    logger.info(`📊 PHASE 0: Local-First Queries (Geo-Located Priority)`);
    const localProducts = await this.queryLocalFirstParallel(barcode, userCountry, earlyProductName);
    allProducts.push(...localProducts);
    
    // Phase 1: Gold Standard + Open Facts (parallel)
    powershellLogger.queryPhase('PHASE 1: Gold Standard + Open Facts', ['Gold Standard', 'Open Facts'], []);
    logger.info(`📊 PHASE 1: Gold Standard + Open Facts (Parallel)`);
    const [goldStandard, openFacts] = await Promise.all([
      this.queryGoldStandardParallel(barcode, userCountry),
      this.queryOpenFactsParallel(barcode),
    ]);
    allProducts.push(...goldStandard, ...openFacts);
    
    // Log each result
    goldStandard.forEach(product => {
      powershellLogger.databaseResult(barcode, product?.source || 'Gold Standard', product, true);
    });
    openFacts.forEach(product => {
      powershellLogger.databaseResult(barcode, product?.source || 'Open Facts', product, true);
    });
    
    logger.info(`   Found: ${goldStandard.length} Gold Standard, ${openFacts.length} Open Facts`);
    
    // Phase 2: Nutrition APIs + Additional Enhancements (parallel)
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
    
    // Phase 3: Fallbacks (if no results OR incomplete data)
    // CRITICAL: Query fallbacks if we have no results OR if existing results are incomplete
    // This ensures we fill data gaps even when we have a partial product
    const hasOpenFoodFacts = openFacts.some(p => p.source === 'openfoodfacts');
    const hasIncompleteData = allProducts.length > 0 && this.hasIncompleteData(allProducts[0]);
    
    if ((allProducts.length === 0 && !hasOpenFoodFacts) || hasIncompleteData) {
      powershellLogger.queryPhase('PHASE 3: Fallbacks', ['Fallback Databases'], []);
      if (hasIncompleteData) {
        logger.info(`📊 PHASE 3: Fallbacks (Enhancing incomplete product)`);
      } else {
        logger.info(`📊 PHASE 3: Fallbacks (No results yet)`);
      }
      const fallbacks = await this.queryFallbacksParallel(barcode);
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
    }
    
    if (userCountry === 'US') {
      const query = fetchProductFromUSDA(barcode);
      queries.push(query);
      powershellLogger.databaseQuery(barcode, 'USDA', 'start');
      query.then(result => {
        powershellLogger.databaseQuery(barcode, 'USDA', result ? 'success' : 'error', { found: !!result });
      }).catch(() => {
        powershellLogger.databaseQuery(barcode, 'USDA', 'error');
      });
    }
    
    if (userCountry === 'CA') {
      const query = fetchProductFromHealthCanada(barcode);
      queries.push(query);
      powershellLogger.databaseQuery(barcode, 'Health Canada', 'start');
      query.then(result => {
        powershellLogger.databaseQuery(barcode, 'Health Canada', result ? 'success' : 'error', { found: !!result });
      }).catch(() => {
        powershellLogger.databaseQuery(barcode, 'Health Canada', 'error');
      });
    }
    
    if (userCountry === 'GB') {
      const query = fetchProductFromUKFSA(barcode);
      queries.push(query);
      powershellLogger.databaseQuery(barcode, 'UK FSA', 'start');
      query.then(result => {
        powershellLogger.databaseQuery(barcode, 'UK FSA', result ? 'success' : 'error', { found: !!result });
      }).catch(() => {
        powershellLogger.databaseQuery(barcode, 'UK FSA', 'error');
      });
    }
    
    if (isEUCountry(userCountry)) {
      const query = fetchProductFromEFSA(barcode);
      queries.push(query);
      powershellLogger.databaseQuery(barcode, 'EFSA', 'start');
      query.then(result => {
        powershellLogger.databaseQuery(barcode, 'EFSA', result ? 'success' : 'error', { found: !!result });
      }).catch(() => {
        powershellLogger.databaseQuery(barcode, 'EFSA', 'error');
      });
    }
    
    // Local Store APIs (high priority for local users)
    if (userCountry === 'NZ') {
      queries.push(fetchProductFromNZStores(barcode));
    }
    if (userCountry === 'AU') {
      queries.push(fetchProductFromAURetailers(barcode));
    }
    if (userCountry === 'GB') {
      queries.push(fetchProductFromTesco(barcode));
    }
    if (userCountry === 'US') {
      queries.push(fetchProductFromWalmart(barcode));
      queries.push(fetchProductFromFoodRepo(barcode));
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
    const gs1Query = fetchProductFromGS1(barcode);
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
   * Query fallback databases in parallel
   * Only if no results from previous phases
   * NOTE: web_search is NOT included here - it's handled separately in productService.ts
   * as an absolute last resort only if all other sources fail
   */
  private async queryFallbacksParallel(barcode: string): Promise<Product[]> {
    const queries = [
      fetchProductFromDatakick(barcode), // NEW: Free, no API key, community-driven
      fetchProductFromUPCitemdb(barcode),
      fetchProductFromEANSearch(barcode),
      fetchProductFromBarcodeSpider(barcode),
      fetchProductFromGoUpc(barcode),
      fetchProductFromBuycott(barcode),
      fetchProductFromOpenGtin(barcode),
      fetchProductFromBarcodeMonster(barcode),
      fetchProductFromUPCDatabase(barcode),
      fetchProductFromBarcodeLookup(barcode),
      fetchProductFromEANData(barcode),
      fetchProductFromBestBuy(barcode),
      // web_search removed - handled separately in productService.ts as absolute last resort
    ];
    
    const results = await Promise.allSettled(queries);
    return results
      .filter(r => r.status === 'fulfilled' && r.value !== null)
      .map(r => (r as PromiseFulfilledResult<Product>).value);
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
      
      // Fallback (low)
      'datakick': 0.25, // NEW: Community-driven, good quality
      'upcitemdb': 0.20,
      'ean_search': 0.20,
      'barcode_spider': 0.20,
      'foodb': 0.30, // NEW: Good nutrition data
      'foodatlas': 0.35, // NEW: Excellent nutrition data (local database)
      'web_search': 0.10,
    };
  }
}


