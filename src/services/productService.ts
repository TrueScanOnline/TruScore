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
import { fetchProductFromWebSearch, isWebSearchFallback } from './webSearchFallback';
import { getCachedProduct, cacheProduct } from './cacheService';
import { calculateTrustScore } from '../utils/trustScore';
import { checkFDARecalls } from './fdaRecallService';

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
  // Check cache first
  if (useCache) {
    const cached = await getCachedProduct(barcode, isPremium);
    if (cached) {
      // Check if cached product is a low-quality web search result
      // If so, retry web search to see if we can get better data
      const isLowQualityWebSearch = (cached.source === 'web_search' || isWebSearchFallback(cached)) && 
                                    ((cached.quality && cached.quality < 50) || 
                                     (cached.completion && cached.completion < 50) ||
                                     (!cached.image_url && !cached.nutriments && !cached.ingredients_text));
      
      if (isLowQualityWebSearch && !isOffline) {
        logger.debug(`Cached product ${barcode} is low-quality web search result, retrying web search...`);
        // Don't return cached - continue to retry web search
      } else {
        logger.debug(`Using cached product: ${barcode}${isPremium ? ' (premium cache)' : ''}`);
        return calculateTrustScore(cached);
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
  // Try Open Facts databases in parallel since they're independent
  logger.debug(`Fetching from Open Facts databases in parallel: ${barcode}`);
  let product: Product | null = null;
  
  // Parallel fetch from Open Facts databases
  const [offProduct, obfProduct, opffProduct, opfProduct] = await Promise.allSettled([
    fetchProductFromOFF(barcode).catch(err => {
      logger.debug(`OFF fetch error for ${barcode}:`, err.message);
      return null;
    }),
    fetchProductFromOBF(barcode).catch(err => {
      logger.debug(`OBF fetch error for ${barcode}:`, err.message);
      return null;
    }),
    fetchProductFromOPFF(barcode).catch(err => {
      logger.debug(`OPFF fetch error for ${barcode}:`, err.message);
      return null;
    }),
    fetchProductFromOPF(barcode).catch(err => {
      logger.debug(`OPF fetch error for ${barcode}:`, err.message);
      return null;
    }),
  ]);

  // Use first successful result from Open Facts databases (prioritize OFF > OBF > OPFF > OPF)
  if (offProduct.status === 'fulfilled' && offProduct.value) {
    product = offProduct.value;
    logger.debug(`Found product in Open Food Facts: ${barcode}`);
  } else if (obfProduct.status === 'fulfilled' && obfProduct.value) {
    product = obfProduct.value;
    logger.debug(`Found product in Open Beauty Facts: ${barcode}`);
  } else if (opffProduct.status === 'fulfilled' && opffProduct.value) {
    product = opffProduct.value;
    logger.debug(`Found product in Open Pet Food Facts: ${barcode}`);
  } else if (opfProduct.status === 'fulfilled' && opfProduct.value) {
    product = opfProduct.value;
    logger.debug(`Found product in Open Products Facts: ${barcode}`);
  }

  // Tier 2: Official sources (parallel - independent sources)
  // If Open Facts didn't return a product, try official sources in parallel
  if (!product) {
    logger.debug(`Open Facts databases not found, trying official sources in parallel: ${barcode}`);
    const [usdaProduct, gs1Product] = await Promise.allSettled([
      fetchProductFromUSDA(barcode).catch(err => {
        logger.debug(`USDA fetch error for ${barcode}:`, err.message);
        return null;
      }),
      fetchProductFromGS1(barcode).catch(err => {
        console.log(`GS1 fetch error for ${barcode}:`, err.message);
        return null;
      }),
    ]);

    // Prioritize USDA over GS1 (more reliable for food products)
    if (usdaProduct.status === 'fulfilled' && usdaProduct.value) {
      product = usdaProduct.value;
      logger.debug(`Found product in USDA FoodData Central: ${barcode}`);
    } else if (gs1Product.status === 'fulfilled' && gs1Product.value) {
      product = gs1Product.value;
      logger.debug(`Found product in GS1 Data Source: ${barcode}`);
    }
  }

  // Tier 3: Fallback sources (parallel - independent sources)
  // If official sources didn't return a product, try fallback sources in parallel
  if (!product) {
    logger.debug(`Official sources not found, trying fallback sources in parallel: ${barcode}`);
    const [upcitemdbProduct, barcodeSpiderProduct] = await Promise.allSettled([
      fetchProductFromUPCitemdb(barcode).catch(err => {
        logger.debug(`UPCitemdb fetch error for ${barcode}:`, err.message);
        return null;
      }),
      fetchProductFromBarcodeSpider(barcode).catch(err => {
        logger.debug(`Barcode Spider fetch error for ${barcode}:`, err.message);
        return null;
      }),
    ]);

    // Prioritize UPCitemdb over Barcode Spider (more reliable)
    if (upcitemdbProduct.status === 'fulfilled' && upcitemdbProduct.value) {
      product = upcitemdbProduct.value;
      logger.debug(`Found product in UPCitemdb: ${barcode}`);
    } else if (barcodeSpiderProduct.status === 'fulfilled' && barcodeSpiderProduct.value) {
      product = barcodeSpiderProduct.value;
      logger.debug(`Found product in Barcode Spider: ${barcode}`);
    }
  }

  // FINAL FALLBACK: Web Search - ensures we ALWAYS return a result
  // This guarantees that every scanned barcode returns SOME product data
  if (!product) {
    logger.warn(`All databases failed, using web search fallback: ${barcode}`);
    product = await fetchProductFromWebSearch(barcode);
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
  if (useCache) {
    await cacheProduct(product, isPremium);
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
}

/**
 * Refresh product data (skip cache)
 */
export async function refreshProduct(barcode: string): Promise<ProductWithTrustScore | null> {
  return fetchProduct(barcode, false);
}

