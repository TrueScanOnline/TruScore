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
import { fetchProductFromBarcodeLookup } from './barcodeLookup';
import { fetchProductFromGoUPC } from './goUpcApi';
import { fetchProductFromBuycott } from './buycottApi';
import { fetchProductFromOpenGTIN } from './openGtindbApi';
import { fetchProductFromBarcodeMonster } from './barcodeMonsterApi';
import { fetchProductFromWebSearch, isWebSearchFallback } from './webSearchFallback';
import { getCachedProduct, cacheProduct } from './cacheService';
import { calculateTrustScore } from '../utils/trustScore';
import { checkFDARecalls } from './fdaRecallService';
import { normalizeBarcode, getPrimaryBarcode } from '../utils/barcodeNormalization';
import { getUserCountryCode } from '../utils/countryDetection';
import { fetchProductFromNZStores } from './nzStoreApi';
import { fetchProductFromAURetailers } from './auRetailerScraping';
import { fetchProductFromFSANZ } from './fsanDatabase';

/**
 * Fetch product data with comprehensive fallback strategy:
 * 1. Check cache (with premium support)
 * 2. Try Open Food Facts (covers food, drinks)
 * 3. Try Open Beauty Facts (covers cosmetics, personal care products)
 * 4. Try Open Pet Food Facts (covers pet food specifically)
 * 5. Try Open Products Facts (covers general products: electronics, household, tools, etc.)
 * 6. Try USDA FoodData Central (official US branded foods - requires API key)
 * 7. Try GS1 Data Source (official barcode verification - requires API key)
 * 8. Try UPCitemdb (covers alcohol, household products, electronics, general products)
 * 9. Try Barcode Spider (fallback for general products)
 * 10. Try Web Search (DuckDuckGo Instant Answer - ensures we ALWAYS return something)
 * 11. Check for food recalls (FDA API - non-blocking, for food products only)
 * 12. Cache result (with premium support)
 * 
 * GUARANTEE: This function will ALWAYS return a Product (never null) unless offline without cache.
 * Even if all databases fail, web search fallback creates a minimal product result.
 * 
 * This expanded database covers:
 * - Food & Drinks (Open Food Facts, USDA FoodData Central)
 * - Cosmetics & Beauty (Open Beauty Facts, Open Food Facts)
 * - Pet Food (Open Pet Food Facts, Open Food Facts)
 * - General Products (Open Products Facts, UPCitemdb, Barcode Spider, GS1)
 * - Alcohol (UPCitemdb, Open Products Facts)
 * - Household Products (Open Products Facts, UPCitemdb)
 * - Electronics (Open Products Facts, GS1)
 * - Tools & Hardware (Open Products Facts, GS1)
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

  // Check cache first - try all variants
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
          return calculateTrustScore(cached);
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
  
  // Find first successful result from any variant
  const allOffResults = offResults.status === 'fulfilled' ? offResults.value : [];
  const allObfResults = obfResults.status === 'fulfilled' ? obfResults.value : [];
  const allOpffResults = opffResults.status === 'fulfilled' ? opffResults.value : [];
  const allOpfResults = opfResults.status === 'fulfilled' ? opfResults.value : [];
  
  // Check OFF first (highest priority)
  for (const result of allOffResults) {
    if (result) {
      product = result;
      logger.debug(`Found product in Open Food Facts: ${barcode}`);
      break;
    }
  }
  
  // Then check other Open Facts databases
  if (!product) {
    for (const result of allObfResults) {
      if (result) {
        product = result;
        logger.debug(`Found product in Open Beauty Facts: ${barcode}`);
        break;
      }
    }
  }
  
  if (!product) {
    for (const result of allOpffResults) {
      if (result) {
        product = result;
        logger.debug(`Found product in Open Pet Food Facts: ${barcode}`);
        break;
      }
    }
  }
  
  if (!product) {
    for (const result of allOpfResults) {
      if (result) {
        product = result;
        logger.debug(`Found product in Open Products Facts: ${barcode}`);
        break;
      }
    }
  }

  // Tier 1.5: Country-specific store APIs and government databases (for NZ, AU, etc.)
  // Try country-specific sources if user is in that country and product not found yet
  if (!product) {
    const userCountry = getUserCountryCode();
    
    // Try NZ store APIs if user is in NZ
    if (userCountry === 'NZ') {
      logger.debug(`Trying NZ store APIs for barcode variants: ${barcodeVariants.join(', ')}`);
      const nzStorePromises = barcodeVariants.map(variant => 
        fetchProductFromNZStores(variant).catch(err => {
          const errorMessage = err instanceof Error ? err.message : String(err);
          logger.debug(`NZ store fetch error for ${variant}:`, errorMessage);
          return null;
        })
      );
      
      const nzStoreResults = await Promise.allSettled(nzStorePromises);
      for (const result of nzStoreResults) {
        if (result.status === 'fulfilled' && result.value) {
          product = result.value;
          logger.debug(`Found product in NZ store API: ${barcode}`);
          break;
        }
      }
      
      // Try FSANZ NZ database if store APIs didn't find product
      if (!product) {
        logger.debug(`Trying FSANZ NZ database for barcode variants: ${barcodeVariants.join(', ')}`);
        for (const variant of barcodeVariants) {
          const fsanzProduct = await fetchProductFromFSANZ(variant);
          if (fsanzProduct) {
            product = fsanzProduct;
            logger.debug(`Found product in FSANZ NZ: ${variant}`);
            break;
          }
        }
      }
    }
    
    // Try AU retailer APIs if user is in Australia
    if (!product && userCountry === 'AU') {
      logger.debug(`Trying AU retailer APIs for barcode variants: ${barcodeVariants.join(', ')}`);
      const auRetailerPromises = barcodeVariants.map(variant => 
        fetchProductFromAURetailers(variant).catch(err => {
          const errorMessage = err instanceof Error ? err.message : String(err);
          logger.debug(`AU retailer fetch error for ${variant}:`, errorMessage);
          return null;
        })
      );
      
      const auRetailerResults = await Promise.allSettled(auRetailerPromises);
      for (const result of auRetailerResults) {
        if (result.status === 'fulfilled' && result.value) {
          product = result.value;
          logger.debug(`Found product in AU retailer API: ${barcode}`);
          break;
        }
      }
      
      // Try FSANZ AU database if retailer APIs didn't find product
      if (!product) {
        logger.debug(`Trying FSANZ AU database for barcode variants: ${barcodeVariants.join(', ')}`);
        for (const variant of barcodeVariants) {
          const fsanzProduct = await fetchProductFromFSANZ(variant);
          if (fsanzProduct) {
            product = fsanzProduct;
            logger.debug(`Found product in FSANZ AU: ${variant}`);
            break;
          }
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
    
    // NEW: Add Barcode Lookup API (free tier: 50/day)
    const barcodeLookupPromises = barcodeVariants.map(variant => 
      fetchProductFromBarcodeLookup(variant).catch(err => {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.debug(`Barcode Lookup fetch error for ${variant}:`, errorMessage);
        return null;
      })
    );
    
    const goUpcPromises = barcodeVariants.map(variant => 
      fetchProductFromGoUPC(variant).catch(err => {
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
      fetchProductFromOpenGTIN(variant).catch(err => {
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
    
    const [upcitemdbResults, barcodeSpiderResults, barcodeLookupResults, goUpcResults, buycottResults, openGtinResults, barcodeMonsterResults] = await Promise.allSettled([
      Promise.all(upcitemdbPromises),
      Promise.all(barcodeSpiderPromises),
      Promise.all(barcodeLookupPromises),
      Promise.all(goUpcPromises),
      Promise.all(buycottPromises),
      Promise.all(openGtinPromises),
      Promise.all(barcodeMonsterPromises),
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
    
    // Check Go-UPC results (500M+ products)
    if (!product && goUpcResults.status === 'fulfilled') {
      for (const result of goUpcResults.value) {
        if (result) {
          product = result;
          logger.debug(`Found product in Go-UPC: ${barcode}`);
          break;
        }
      }
    }
    
    // Check Buycott results (150M+ products)
    if (!product && buycottResults.status === 'fulfilled') {
      for (const result of buycottResults.value) {
        if (result) {
          product = result;
          logger.debug(`Found product in Buycott: ${barcode}`);
          break;
        }
      }
    }
    
    // Check Open GTIN results (free, no API key required)
    if (!product && openGtinResults.status === 'fulfilled') {
      for (const result of openGtinResults.value) {
        if (result) {
          product = result;
          logger.debug(`Found product in Open GTIN: ${barcode}`);
          break;
        }
      }
    }
    
    // Check Barcode Monster results (free, no API key required)
    if (!product && barcodeMonsterResults.status === 'fulfilled') {
      for (const result of barcodeMonsterResults.value) {
        if (result) {
          product = result;
          logger.debug(`Found product in Barcode Monster: ${barcode}`);
          break;
        }
      }
    }

  }

  // FINAL FALLBACK: Web Search - ensures we ALWAYS return a result
  // This guarantees that every scanned barcode returns SOME product data
  // Try primary barcode first, then fall back to original if different
  if (!product) {
    logger.warn(`All databases failed, using web search fallback: ${primaryBarcode}`);
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
  }

  // Calculate trust score (works even for minimal web search products)
  const productWithTrustScore = calculateTrustScore(product);
  
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
    
    return calculateTrustScore(fallbackProduct);
  }
}

/**
 * Refresh product data (skip cache)
 */
export async function refreshProduct(barcode: string): Promise<ProductWithTrustScore | null> {
  return fetchProduct(barcode, false);
}

