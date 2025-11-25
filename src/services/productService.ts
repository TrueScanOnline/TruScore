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
import { checkFDARecalls } from './fdaRecallService';
import { normalizeBarcode, getPrimaryBarcode } from '../utils/barcodeNormalization';
import { getUserCountryCode } from '../utils/countryDetection';
import { fetchProductFromNZStores } from './nzStoreApi';
import { fetchProductFromFSANZ } from './fsanDatabase';
import { fetchProductFromAURetailers } from './auRetailerScraping';
import { enhanceProductWithNZFCD } from './nzfcdDatabase';
import { enhanceProductWithAFCD } from './afcdDatabase';
import { applyConfidenceScore } from '../utils/confidenceScoring';
import { mergeProducts } from './productDataMerger';
import { lookupProductInSQLite, saveProductToSQLite } from './sqliteProductDatabase';

/**
 * Fetch product data with comprehensive fallback strategy:
 * 0. Check SQLite database (offline-first, country-specific)
 * 1. Check cache (with premium support)
 * 2. Try Open Food Facts (covers food, drinks)
 * 3. Try Open Beauty Facts (covers cosmetics, personal care products)
 * 4. Try Open Pet Food Facts (covers pet food specifically)
 * 5. Try Open Products Facts (covers general products: electronics, household, tools, etc.)
 * 6. Try USDA FoodData Central (official US branded foods - requires API key)
 * 7. Try GS1 Data Source (official barcode verification - requires API key)
 * 8. Try UPCitemdb (covers alcohol, household products, electronics, general products)
 * 9. Try Barcode Spider (fallback for general products)
 * 10. Try EAN-Search.org (1B+ products, good for regional/obscure products)
 * 11. Try UPC Database API (4.3M+ products, different database than UPCitemdb)
 * 12. Try Edamam Food Database (10K requests/month, strong nutrition data)
 * 13. Try Barcode Lookup API (100/day, additional product source)
 * 14. Try Nutritionix API (100/day, nutrition-focused)
 * 15. Try Spoonacular API (150 points/day, food-focused)
 * 16. Try Best Buy API (5K/day, electronics focus)
 * 17. Try EANData API (100/day, basic but reliable validation)
 * 18. Try Web Search (DuckDuckGo Instant Answer - ensures we ALWAYS return something)
 * 19. Check for food recalls (FDA API - non-blocking, for food products only)
 * 20. Cache result (with premium support)
 * 
 * GUARANTEE: This function will ALWAYS return a Product (never null) unless offline without cache.
 * Even if all databases fail, web search fallback creates a minimal product result.
 * 
 * This expanded database covers:
 * - Food & Drinks (Open Food Facts, USDA FoodData Central)
 * - Cosmetics & Beauty (Open Beauty Facts, Open Food Facts)
 * - Pet Food (Open Pet Food Facts, Open Food Facts)
 * - General Products (Open Products Facts, UPCitemdb, Barcode Spider, EAN-Search, UPC Database, Barcode Lookup, EANData, GS1)
 * - Alcohol (UPCitemdb, Open Products Facts, EAN-Search, UPC Database, EANData)
 * - Household Products (Open Products Facts, UPCitemdb, EAN-Search, UPC Database, Barcode Lookup, EANData)
 * - Electronics (Open Products Facts, GS1, EAN-Search, Best Buy, UPC Database, Barcode Lookup, EANData)
 * - Tools & Hardware (Open Products Facts, GS1, EAN-Search, Best Buy, UPC Database, EANData)
 * - Food & Nutrition (Edamam, Nutritionix, Spoonacular, USDA, Open Food Facts)
 * - Regional/Obscure Products (EAN-Search - 1B+ products, strong EU/AU coverage)
 * - US Branded Foods (USDA FoodData Central - official data)
 * - Official Barcode Verification (GS1 Data Source)
 * - ANY Product (Web Search Fallback - last resort, ensures result)
 * 
 * Safety Features:
 * - Food recall checking (FDA API) for food and pet food products
 * - Non-blocking recall checks (won't delay product display)
 * 
 * Expected Coverage: ~85-90% of all scanned products (up from ~60-65%)
 */
export async function fetchProduct(barcode: string, useCache = true, isPremium = false, isOffline = false): Promise<ProductWithTrustScore | null> {
  // Normalize barcode - try multiple variants (EAN-8 -> EAN-13, etc.)
  const barcodeVariants = normalizeBarcode(barcode);
  const primaryBarcode = getPrimaryBarcode(barcode);
  logger.debug(`Barcode variants to try: ${barcodeVariants.join(', ')} (primary: ${primaryBarcode})`);

  try {
  // Check SQLite database first (offline-first, country-specific)
  // This provides instant lookups for products in the local database
  const userCountry = getUserCountryCode();
  const sqliteProduct = await lookupProductInSQLite(primaryBarcode, userCountry);
  if (sqliteProduct) {
    logger.debug(`Found product in SQLite database: ${primaryBarcode}`);
    // Apply confidence score and calculate trust score
    const productWithConfidence = applyConfidenceScore(sqliteProduct);
    return calculateTrustScore(productWithConfidence);
  }

  // Check cache - try all variants
  if (useCache) {
    for (const variant of barcodeVariants) {
      const cached = await getCachedProduct(variant, isPremium);
      if (cached) {
        // Check if cached product is a low-quality web search result
        // If so, retry web search to see if we can get better data
        const isLowQualityWebSearch = (cached.source === 'web_search' || isWebSearchFallback(cached)) && 
                                      ((cached.quality && cached.quality < 50) || 
                                       (cached.completion && cached.completion < 50) ||
                                       (!cached.image_url && !cached.nutriments && !cached.ingredients_text));
        
        if (isLowQualityWebSearch && !isOffline) {
          logger.debug(`Cached product ${variant} is low-quality web search result, retrying web search...`);
          // Don't return cached - continue to retry web search
        } else {
          logger.debug(`Using cached product: ${variant}${isPremium ? ' (premium cache)' : ''}`);
          // Apply confidence score to cached product
          const productWithConfidence = applyConfidenceScore(cached);
          return calculateTrustScore(productWithConfidence);
        }
      }
    }
  }

  // If offline and no cache, return null (premium users should have cache)
  if (isOffline) {
    logger.warn(`Product not in cache (offline mode): ${barcode}`);
    return null;
  }

  // OPTIMIZED: Parallelize API calls for faster product fetching
  // Tier 1: Open Facts databases (parallel - independent sources)
  // Try all barcode variants in parallel across all Open Facts databases
  logger.debug(`Fetching from Open Facts databases in parallel: ${barcodeVariants.join(', ')}`);
  let product: Product | null = null;
  
  // Try all barcode variants in parallel across all Open Facts databases
  const offPromises = barcodeVariants.map(variant => 
    fetchProductFromOFF(variant).catch(err => {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.debug(`OFF fetch error for ${variant}:`, errorMessage);
      return null;
    })
  );
  
  const obfPromises = barcodeVariants.map(variant => 
    fetchProductFromOBF(variant).catch(err => {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.debug(`OBF fetch error for ${variant}:`, errorMessage);
      return null;
    })
  );
  
  const opffPromises = barcodeVariants.map(variant => 
    fetchProductFromOPFF(variant).catch(err => {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.debug(`OPFF fetch error for ${variant}:`, errorMessage);
      return null;
    })
  );
  
  const opfPromises = barcodeVariants.map(variant => 
    fetchProductFromOPF(variant).catch(err => {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.debug(`OPF fetch error for ${variant}:`, errorMessage);
      return null;
    })
  );
  
  // Execute all searches in parallel
  const [offResults, obfResults, opffResults, opfResults] = await Promise.allSettled([
    Promise.all(offPromises),
    Promise.all(obfPromises),
    Promise.all(opffPromises),
    Promise.all(opfPromises),
  ]);
  
  // Collect all successful results from any variant
  const allOffResults = offResults.status === 'fulfilled' ? offResults.value : [];
  const allObfResults = obfResults.status === 'fulfilled' ? obfResults.value : [];
  const allOpffResults = opffResults.status === 'fulfilled' ? opffResults.value : [];
  const allOpfResults = opfResults.status === 'fulfilled' ? opfResults.value : [];
  
  // Collect all products found (for merging)
  const foundProducts: Product[] = [];
  
  // Collect from all Open Facts databases
  for (const result of allOffResults) {
    if (result) foundProducts.push(result);
  }
  for (const result of allObfResults) {
    if (result) foundProducts.push(result);
  }
  for (const result of allOpffResults) {
    if (result) foundProducts.push(result);
  }
  for (const result of allOpfResults) {
    if (result) foundProducts.push(result);
  }
  
  // Merge products if multiple found, otherwise use first
  if (foundProducts.length > 0) {
    if (foundProducts.length > 1) {
      product = mergeProducts(foundProducts);
      logger.debug(`Merged ${foundProducts.length} products from Open Facts databases: ${barcode}`);
    } else {
      product = foundProducts[0];
      logger.debug(`Found product in Open Facts: ${barcode}`);
    }
  }

  // Tier 1.5: Country-specific store APIs and government databases (for NZ, AU, etc.)
  // Try country-specific sources if user is in that country and product not found yet
  if (!product) {
    const userCountry = getUserCountryCode();
    
    // Try NZ store APIs if user is in NZ
    if (userCountry === 'NZ') {
      logger.debug(`Trying NZ store APIs for barcode variants: ${barcodeVariants.join(', ')}`);
      for (const variant of barcodeVariants) {
        const nzStoreProduct = await fetchProductFromNZStores(variant);
        if (nzStoreProduct) {
          product = nzStoreProduct;
          logger.debug(`Found product in NZ store API: ${variant}`);
          break;
        }
      }
    }
    
    // Try AU retailer APIs if user is in AU
    if (userCountry === 'AU') {
      logger.debug(`Trying AU store APIs for barcode variants: ${barcodeVariants.join(', ')}`);
      for (const variant of barcodeVariants) {
        const auRetailerProduct = await fetchProductFromAURetailers(variant);
        if (auRetailerProduct) {
          product = auRetailerProduct;
          logger.debug(`Found product in AU retailer API: ${variant}`);
          break;
        }
      }
    }
    
    // Try FSANZ databases if user is in NZ or AU
    if (userCountry === 'NZ' || userCountry === 'AU') {
      logger.debug(`Trying FSANZ ${userCountry} database for barcode variants: ${barcodeVariants.join(', ')}`);
      for (const variant of barcodeVariants) {
        const fsanzProduct = await fetchProductFromFSANZ(variant, userCountry);
        if (fsanzProduct) {
          product = fsanzProduct;
          logger.debug(`Found product in FSANZ ${userCountry} database: ${variant}`);
          break;
        }
      }
    }
  }

  // Tier 2: Official sources (parallel - independent sources)
  // If Open Facts didn't return a product, try official sources in parallel
  if (!product) {
    logger.debug(`Open Facts databases not found, trying official sources in parallel: ${primaryBarcode}`);
    // Try all variants for official sources too
    const usdaPromises = barcodeVariants.map(variant => 
      fetchProductFromUSDA(variant).catch(err => {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.debug(`USDA fetch error for ${variant}:`, errorMessage);
        return null;
      })
    );
    
    const gs1Promises = barcodeVariants.map(variant => 
      fetchProductFromGS1(variant).catch(err => {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.debug(`GS1 fetch error for ${variant}:`, errorMessage);
        return null;
      })
    );
    
    const [usdaResults, gs1Results] = await Promise.allSettled([
      Promise.all(usdaPromises),
      Promise.all(gs1Promises),
    ]);
    
    // Check USDA results
    if (usdaResults.status === 'fulfilled') {
      for (const result of usdaResults.value) {
        if (result) {
          product = result;
          logger.debug(`Found product in USDA: ${barcode}`);
          break;
        }
      }
    }
    
    // Check GS1 results
    if (!product && gs1Results.status === 'fulfilled') {
      for (const result of gs1Results.value) {
        if (result) {
          product = result;
          logger.debug(`Found product in GS1: ${barcode}`);
          break;
        }
      }
    }
  }

  // Tier 3: Fallback sources (parallel - independent sources)
  // If official sources didn't return a product, try fallback sources in parallel
  if (!product) {
    logger.debug(`Official sources not found, trying fallback sources in parallel: ${primaryBarcode}`);
    // Try all variants for fallback sources
    const upcitemdbPromises = barcodeVariants.map(variant => 
      fetchProductFromUPCitemdb(variant).catch(err => {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.debug(`UPCitemdb fetch error for ${variant}:`, errorMessage);
        return null;
      })
    );
    
    const barcodeSpiderPromises = barcodeVariants.map(variant => 
      fetchProductFromBarcodeSpider(variant).catch(err => {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.debug(`Barcode Spider fetch error for ${variant}:`, errorMessage);
        return null;
      })
    );
    
    const goUpcPromises = barcodeVariants.map(variant => 
      fetchProductFromGoUpc(variant).catch(err => {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.debug(`Go-UPC fetch error for ${variant}:`, errorMessage);
        return null;
      })
    );
    
    const buycottPromises = barcodeVariants.map(variant => 
      fetchProductFromBuycott(variant).catch(err => {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.debug(`Buycott fetch error for ${variant}:`, errorMessage);
        return null;
      })
    );
    
    const openGtinPromises = barcodeVariants.map(variant => 
      fetchProductFromOpenGtin(variant).catch(err => {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.debug(`Open GTIN fetch error for ${variant}:`, errorMessage);
        return null;
      })
    );
    
    const barcodeMonsterPromises = barcodeVariants.map(variant => 
      fetchProductFromBarcodeMonster(variant).catch(err => {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.debug(`Barcode Monster fetch error for ${variant}:`, errorMessage);
        return null;
      })
    );
    
    const eanSearchPromises = barcodeVariants.map(variant => 
      fetchProductFromEANSearch(variant).catch(err => {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.debug(`EAN-Search fetch error for ${variant}:`, errorMessage);
        return null;
      })
    );
    
    const upcDatabasePromises = barcodeVariants.map(variant => 
      fetchProductFromUPCDatabase(variant).catch(err => {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.debug(`UPC Database fetch error for ${variant}:`, errorMessage);
        return null;
      })
    );
    
    const edamamPromises = barcodeVariants.map(variant => 
      fetchProductFromEdamam(variant).catch(err => {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.debug(`Edamam fetch error for ${variant}:`, errorMessage);
        return null;
      })
    );
    
    const barcodeLookupPromises = barcodeVariants.map(variant => 
      fetchProductFromBarcodeLookup(variant).catch(err => {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.debug(`Barcode Lookup fetch error for ${variant}:`, errorMessage);
        return null;
      })
    );
    
    const nutritionixPromises = barcodeVariants.map(variant => 
      fetchProductFromNutritionix(variant).catch(err => {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.debug(`Nutritionix fetch error for ${variant}:`, errorMessage);
        return null;
      })
    );
    
    const spoonacularPromises = barcodeVariants.map(variant => 
      fetchProductFromSpoonacular(variant).catch(err => {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.debug(`Spoonacular fetch error for ${variant}:`, errorMessage);
        return null;
      })
    );
    
    const bestBuyPromises = barcodeVariants.map(variant => 
      fetchProductFromBestBuy(variant).catch(err => {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.debug(`Best Buy fetch error for ${variant}:`, errorMessage);
        return null;
      })
    );
    
    const eanDataPromises = barcodeVariants.map(variant => 
      fetchProductFromEANData(variant).catch(err => {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.debug(`EANData fetch error for ${variant}:`, errorMessage);
        return null;
      })
    );
    
    const [upcitemdbResults, barcodeSpiderResults, goUpcResults, buycottResults, openGtinResults, barcodeMonsterResults, eanSearchResults, upcDatabaseResults, edamamResults, barcodeLookupResults, nutritionixResults, spoonacularResults, bestBuyResults, eanDataResults] = await Promise.allSettled([
      Promise.all(upcitemdbPromises),
      Promise.all(barcodeSpiderPromises),
      Promise.all(goUpcPromises),
      Promise.all(buycottPromises),
      Promise.all(openGtinPromises),
      Promise.all(barcodeMonsterPromises),
      Promise.all(eanSearchPromises),
      Promise.all(upcDatabasePromises),
      Promise.all(edamamPromises),
      Promise.all(barcodeLookupPromises),
      Promise.all(nutritionixPromises),
      Promise.all(spoonacularPromises),
      Promise.all(bestBuyPromises),
      Promise.all(eanDataPromises),
    ]);
    
    // Check UPCitemdb results
    if (upcitemdbResults.status === 'fulfilled') {
      for (const result of upcitemdbResults.value) {
        if (result) {
          product = result;
          logger.debug(`Found product in UPCitemdb: ${barcode}`);
          break;
        }
      }
    }
    
    // Check Barcode Spider results
    if (!product && barcodeSpiderResults.status === 'fulfilled') {
      for (const result of barcodeSpiderResults.value) {
        if (result) {
          product = result;
          logger.debug(`Found product in Barcode Spider: ${barcode}`);
          break;
        }
      }
    }
    
    // Check Go-UPC results
    if (!product && goUpcResults.status === 'fulfilled') {
      for (const result of goUpcResults.value) {
        if (result) {
          product = result;
          logger.debug(`Found product in Go-UPC: ${barcode}`);
          break;
        }
      }
    }
    
    // Check Buycott results
    if (!product && buycottResults.status === 'fulfilled') {
      for (const result of buycottResults.value) {
        if (result) {
          product = result;
          logger.debug(`Found product in Buycott: ${barcode}`);
          break;
        }
      }
    }
    
    // Check Open GTIN results
    if (!product && openGtinResults.status === 'fulfilled') {
      for (const result of openGtinResults.value) {
        if (result) {
          product = result;
          logger.debug(`Found product in Open GTIN: ${barcode}`);
          break;
        }
      }
    }
    
    // Check Barcode Monster results
    if (!product && barcodeMonsterResults.status === 'fulfilled') {
      for (const result of barcodeMonsterResults.value) {
        if (result) {
          product = result;
          logger.debug(`Found product in Barcode Monster: ${barcode}`);
          break;
        }
      }
    }
    
    // Check EAN-Search results
    if (!product && eanSearchResults.status === 'fulfilled') {
      for (const result of eanSearchResults.value) {
        if (result) {
          product = result;
          logger.debug(`Found product in EAN-Search: ${barcode}`);
          break;
        }
      }
    }
    
    // Check UPC Database results
    if (!product && upcDatabaseResults.status === 'fulfilled') {
      for (const result of upcDatabaseResults.value) {
        if (result) {
          product = result;
          logger.debug(`Found product in UPC Database: ${barcode}`);
          break;
        }
      }
    }
    
    // Check Edamam results
    if (!product && edamamResults.status === 'fulfilled') {
      for (const result of edamamResults.value) {
        if (result) {
          product = result;
          logger.debug(`Found product in Edamam: ${barcode}`);
          break;
        }
      }
    }
    
    // Check Barcode Lookup results
    if (!product && barcodeLookupResults.status === 'fulfilled') {
      for (const result of barcodeLookupResults.value) {
        if (result) {
          product = result;
          logger.debug(`Found product in Barcode Lookup: ${barcode}`);
          break;
        }
      }
    }
    
    // Check Nutritionix results
    if (!product && nutritionixResults.status === 'fulfilled') {
      for (const result of nutritionixResults.value) {
        if (result) {
          product = result;
          logger.debug(`Found product in Nutritionix: ${barcode}`);
          break;
        }
      }
    }
    
    // Check Spoonacular results
    if (!product && spoonacularResults.status === 'fulfilled') {
      for (const result of spoonacularResults.value) {
        if (result) {
          product = result;
          logger.debug(`Found product in Spoonacular: ${barcode}`);
          break;
        }
      }
    }
    
    // Check Best Buy results
    if (!product && bestBuyResults.status === 'fulfilled') {
      for (const result of bestBuyResults.value) {
        if (result) {
          product = result;
          logger.debug(`Found product in Best Buy: ${barcode}`);
          break;
        }
      }
    }
    
    // Check EANData results
    if (!product && eanDataResults.status === 'fulfilled') {
      for (const result of eanDataResults.value) {
        if (result) {
          product = result;
          logger.debug(`Found product in EANData: ${barcode}`);
          break;
        }
      }
    }
  }

  // FINAL FALLBACK: Web Search - ensures we ALWAYS return a result
  // This guarantees that every scanned barcode returns SOME product data
  // Try primary barcode first, then fall back to original if different
  if (!product) {
    // Suppress - expected fallback behavior when product not in databases
    product = await fetchProductFromWebSearch(primaryBarcode);
    
    // If primary barcode didn't work and it's different from original, try original
    if (!product && primaryBarcode !== barcode) {
      logger.debug(`Trying web search with original barcode: ${barcode}`);
      product = await fetchProductFromWebSearch(barcode);
    }
    // Web search fallback will always return a product (even if minimal)
    logger.debug(`Web search fallback provided result for: ${barcode}`);
  } else if (isWebSearchFallback(product)) {
    // Even if we found a product from a database, if it's low quality, try web search too
    logger.debug(`Found low-quality product from database, also trying web search for: ${barcode}`);
    const webSearchProduct = await fetchProductFromWebSearch(barcode);
    
    // Merge web search data if it's better
    if (webSearchProduct) {
      const mergedProduct = { ...product };
      let improved = false;
      
      // Use web search image if we don't have one
      if (!mergedProduct.image_url && webSearchProduct.image_url) {
        mergedProduct.image_url = webSearchProduct.image_url;
        improved = true;
      }
      
      // Merge nutrition data
      if (webSearchProduct.nutriments && Object.keys(webSearchProduct.nutriments).length > 0) {
        mergedProduct.nutriments = { ...mergedProduct.nutriments, ...webSearchProduct.nutriments };
        improved = true;
      }
      
      // Use web search ingredients if we don't have one
      if (!mergedProduct.ingredients_text && webSearchProduct.ingredients_text) {
        mergedProduct.ingredients_text = webSearchProduct.ingredients_text;
        improved = true;
      }
      
      // Use web search product name if we don't have one
      if (!mergedProduct.product_name && webSearchProduct.product_name) {
        mergedProduct.product_name = webSearchProduct.product_name;
        improved = true;
      }
      
      if (improved) {
        logger.debug(`Web search improved product data for: ${barcode}`);
        product = mergedProduct;
      }
    }
  }

  // Ensure we have a product (should always be true now with web search fallback)
  if (!product) {
    logger.error(`CRITICAL: All sources including web search failed for barcode: ${barcode}`);
    // This should never happen, but if it does, create absolute fallback
    product = {
      barcode,
      product_name: `Product ${barcode}`,
      source: 'web_search',
      quality: 5,
      completion: 10,
    };
  }

  // Enhance product with NZFCD or AFCD nutrition data if available
  // This supplements products that may lack comprehensive nutrition data
  try {
    const userCountry = getUserCountryCode();
    if (userCountry === 'NZ') {
      product = await enhanceProductWithNZFCD(product);
    } else if (userCountry === 'AU') {
      product = await enhanceProductWithAFCD(product);
    }
  } catch (error) {
    logger.debug('Error enhancing product with NZFCD/AFCD:', error);
    // Continue without enhancement if it fails
  }

  // Format and enrich product data (for Open Facts family)
  if (product.source === 'openfoodfacts' || 
      product.source === 'openbeautyfacts' || 
      product.source === 'openpetfoodfacts') {
    product.ingredients = formatIngredients(product);
    product.certifications = formatCertifications(product);
  }

  // Open Products Facts may have similar structure but less detailed nutrition data
  // Still try to format if available
  if (product.source === 'openproductsfacts' && product.ingredients_text) {
    product.ingredients = formatIngredients(product);
  }

  // Calculate and ensure Eco-Score grade is set (if score exists but grade is missing)
  // This ensures the grade is always calculated from score when needed
  const calculatedEcoScore = calculateEcoScore(product);
  if (calculatedEcoScore) {
    // Ensure the calculated ecoscore_data is set on the product
    product.ecoscore_data = calculatedEcoScore;
    // Also set root-level grade and score for compatibility
    if (calculatedEcoScore.grade && calculatedEcoScore.grade !== 'unknown') {
      product.ecoscore_grade = calculatedEcoScore.grade;
    }
    if (calculatedEcoScore.score !== undefined) {
      product.ecoscore_score = calculatedEcoScore.score;
    }
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

  // Cache the product (premium users get larger cache)
  // Note: We cache even web search results so users don't re-search the same barcode
  // Cache with primary barcode for consistency, and also with original if different
  if (useCache && product) {
    // Update barcode to primary for consistency
    product.barcode = primaryBarcode;
    await cacheProduct(product, isPremium);
    
    // Also cache with original barcode for faster lookup next time
    if (primaryBarcode !== barcode) {
      const cachedProduct = { ...product, barcode };
      await cacheProduct(cachedProduct, isPremium);
    }
    
    // Also save to SQLite for offline-first lookups
    const userCountry = getUserCountryCode();
    await saveProductToSQLite(product, userCountry).catch(err => {
      logger.debug('Error saving to SQLite (non-critical):', err);
    });
  }

  // Apply confidence scoring to product
  const productWithConfidence = applyConfidenceScore(product);
  
  // Calculate trust score (works even for minimal web search products)
  const productWithTrustScore = calculateTrustScore(productWithConfidence);
  
  // Check recalls synchronously if we have product name (for immediate display)
  // This is a quick check that won't block too long
  if ((productWithTrustScore.source === 'openfoodfacts' || 
       productWithTrustScore.source === 'openpetfoodfacts') && 
      (productWithTrustScore.product_name || productWithTrustScore.brands)) {
    try {
      // Quick recall check (with timeout to not block)
      const recallPromise = checkFDARecalls(
        productWithTrustScore.product_name,
        productWithTrustScore.brands,
        barcode
      );
      const timeoutPromise = new Promise<typeof productWithTrustScore.recalls>((resolve) => 
        setTimeout(() => resolve(undefined), 2000) // 2 second timeout
      );
      
      const recalls = await Promise.race([recallPromise, timeoutPromise]);
      if (recalls && recalls.length > 0) {
        productWithTrustScore.recalls = recalls;
      }
    } catch (error) {
      // Non-blocking - recalls will be checked in background
      logger.debug('Recall check timed out or failed (non-critical):', error);
    }
  }
  
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
    return calculateTrustScore(fallbackWithConfidence);
  }
}

/**
 * Refresh product data (skip cache)
 */
export async function refreshProduct(barcode: string): Promise<ProductWithTrustScore | null> {
  return fetchProduct(barcode, false);
}

