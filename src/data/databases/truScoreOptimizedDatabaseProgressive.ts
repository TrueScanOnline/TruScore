// Progressive Product Query Service
// Implements optimal algorithm: ALL queries in parallel, progressive merging, incremental display
// Goals: Maximum success rate, minimum time to display, maximum information

import { Product } from '../../types/product';
import { getUserCountryCode } from '../../utils/countryDetection';
import { logger } from '../../utils/logger';
import { mergeProducts } from '../../services/productDataMerger';
import { extractProductName } from '../../services/productNameDiscovery';

// Import all database services
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
// Tesco Labs API removed - service discontinued December 2025
// import { fetchProductFromTesco } from '../../services/tescoLabsApi';
import { fetchProductFromWalmart } from '../../services/walmartOpenApi';
import { fetchProductFromFoodRepo } from '../../services/foodRepoApi';
import { fetchProductFromEdamam } from '../../services/edamamApi';
import { fetchProductFromNutritionix } from '../../services/nutritionixApi';
import { fetchProductFromSpoonacular } from '../../services/spoonacularApi';
import { queryFSANZByProductName } from '../../services/fsanzQueryService';
import { enhanceProductWithNZFCD } from '../../services/nzfcdDatabase';
import { enhanceProductWithAFCD } from '../../services/afcdDatabase';
import { queryFoodAtlasByProductName } from '../../services/foodAtlasQueryService';
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
import { fetchProductFromOpenEAN } from '../../services/openEanApi';
import { fetchProductFromProductOpenData } from '../../services/productOpenDataApi';
import { fetchProductFromBarcodeLookupCom } from '../../services/barcodeLookupComApi';

export interface ProgressiveQueryOptions {
  onProductUpdate?: (product: Product) => void; // Callback for progressive updates
  earlyProductName?: string | null; // Product name discovered early
}

/**
 * Query ALL databases in parallel with progressive merging
 * 
 * Algorithm:
 * 1. Fire ALL queries simultaneously (no phases, no waiting)
 * 2. Display first result immediately (0.5-2s)
 * 3. Merge results as they arrive (progressive enhancement)
 * 4. Continue querying in background (no artificial timeout)
 * 5. Update UI incrementally as new data arrives
 * 
 * @param barcode - Product barcode
 * @param userCountry - User's country code
 * @param options - Progressive query options
 * @returns Final merged product with maximum data
 */
export async function queryAllDatabasesProgressive(
  barcode: string,
  userCountry: string | null,
  options: ProgressiveQueryOptions = {}
): Promise<Product> {
  const { onProductUpdate, earlyProductName } = options;
  const startTime = Date.now();
  
  logger.info(`═══════════════════════════════════════════════════════════════`);
  logger.info(`🚀 PROGRESSIVE QUERY: ${barcode} (ALL databases in parallel)`);
  logger.info(`═══════════════════════════════════════════════════════════════`);
  
  // Build ALL queries simultaneously (no phases)
  const allQueries: Array<{ name: string; query: Promise<Product | null>; tier: number }> = [];
  
  // TIER 1: Fast & Reliable (0.5-2s) - Display First
  allQueries.push(
    { name: 'Open Food Facts', query: fetchProductFromOFF(barcode), tier: 1 },
    { name: 'Open Beauty Facts', query: fetchProductFromOBF(barcode), tier: 1 },
    { name: 'Open Pet Food Facts', query: fetchProductFromOPFF(barcode), tier: 1 },
    { name: 'Open Products Facts', query: fetchProductFromOPF(barcode), tier: 1 },
  );
  
  // TIER 2: Medium & Authoritative (2-5s) - Enhance
  if (userCountry === 'US') {
    allQueries.push({ name: 'USDA', query: fetchProductFromUSDA(barcode), tier: 2 });
  }
  if (userCountry === 'CA') {
    allQueries.push({ name: 'Health Canada', query: fetchProductFromHealthCanada(barcode), tier: 2 });
  }
  if (userCountry === 'GB') {
    allQueries.push({ name: 'UK FSA', query: fetchProductFromUKFSA(barcode), tier: 2 });
  }
  if (userCountry && ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'].includes(userCountry)) {
    allQueries.push({ name: 'EFSA', query: fetchProductFromEFSA(barcode), tier: 2 });
  }
  if (userCountry === 'NZ' || userCountry === 'AU') {
    if (earlyProductName && !earlyProductName.startsWith('Product ')) {
      allQueries.push({ 
        name: 'FSANZ', 
        query: queryFSANZByProductName(earlyProductName, userCountry as 'NZ' | 'AU').then(p => p ? { ...p, barcode, source: `fsanz_${userCountry.toLowerCase()}` as const } : null), 
        tier: 2 
      });
    }
  }
  if (userCountry === 'NZ') {
    allQueries.push({ name: 'NZ Stores', query: fetchProductFromNZStores(barcode), tier: 2 });
  }
  if (userCountry === 'AU') {
    allQueries.push({ name: 'AU Retailers', query: fetchProductFromAURetailers(barcode), tier: 2 });
  }
  // Tesco Labs API removed - service discontinued December 2025
  // if (userCountry === 'GB') {
  //   allQueries.push({ name: 'Tesco', query: fetchProductFromTesco(barcode), tier: 2 });
  // }
  if (userCountry === 'US') {
    allQueries.push({ name: 'Walmart', query: fetchProductFromWalmart(barcode), tier: 2 });
    allQueries.push({ name: 'FoodRepo', query: fetchProductFromFoodRepo(barcode), tier: 2 });
  }
  
  // TIER 3: Slow but Valuable (5-15s) - Complete
  allQueries.push({ name: 'GS1', query: fetchProductFromGS1(barcode), tier: 3 });
  allQueries.push({ name: 'Edamam', query: fetchProductFromEdamam(barcode), tier: 3 });
  allQueries.push({ name: 'Nutritionix', query: fetchProductFromNutritionix(barcode), tier: 3 });
  allQueries.push({ name: 'Spoonacular', query: fetchProductFromSpoonacular(barcode), tier: 3 });
  
  // Early name-based queries
  if (earlyProductName && !earlyProductName.startsWith('Product ')) {
    allQueries.push({ 
      name: 'FoodAtlas', 
      query: queryFoodAtlasByProductName(earlyProductName).then(p => p && p.nutriments ? { ...p, barcode, source: 'foodatlas' as const } : null), 
      tier: 2 
    });
  }
  
  // TIER 4: Fallbacks (2-10s) - Maximum Coverage
  allQueries.push(
    { name: 'Datakick', query: fetchProductFromDatakick(barcode), tier: 4 },
    { name: 'OpenEAN', query: fetchProductFromOpenEAN(barcode), tier: 4 },
    { name: 'Product Open Data', query: fetchProductFromProductOpenData(barcode), tier: 4 },
    { name: 'UPCitemdb', query: fetchProductFromUPCitemdb(barcode), tier: 4 },
    { name: 'EAN-Search', query: fetchProductFromEANSearch(barcode), tier: 4 },
    { name: 'Barcode Spider', query: fetchProductFromBarcodeSpider(barcode), tier: 4 },
    { name: 'GoUPC', query: fetchProductFromGoUpc(barcode), tier: 4 },
    { name: 'Buycott', query: fetchProductFromBuycott(barcode), tier: 4 },
    { name: 'Open GTIN', query: fetchProductFromOpenGtin(barcode), tier: 4 },
    { name: 'Barcode Monster', query: fetchProductFromBarcodeMonster(barcode), tier: 4 },
    { name: 'UPC Database', query: fetchProductFromUPCDatabase(barcode), tier: 4 },
    { name: 'Barcode Lookup', query: fetchProductFromBarcodeLookup(barcode), tier: 4 },
    { name: 'EAN Data', query: fetchProductFromEANData(barcode), tier: 4 },
    { name: 'Best Buy', query: fetchProductFromBestBuy(barcode), tier: 4 },
    { name: 'Barcode Lookup Com', query: fetchProductFromBarcodeLookupCom(barcode), tier: 4 },
  );
  
  // Track merged product and update count
  let mergedProduct: Product | null = null;
  let updateCount = 0;
  const productsFound: Product[] = [];
  
  // Process results as they arrive (progressive merging)
  const processResult = (name: string, product: Product | null, tier: number) => {
    if (!product) return;
    
    productsFound.push(product);
    updateCount++;
    
    const arrivalTime = Date.now() - startTime;
    logger.info(`✅ [${arrivalTime}ms] ${name} arrived (Tier ${tier}) - ${updateCount}/${allQueries.length} databases`);
    
    if (!mergedProduct) {
      // FIRST RESULT - Display immediately!
      mergedProduct = product;
      logger.info(`🚀 FIRST RESULT in ${arrivalTime}ms - Displaying immediately!`);
      if (onProductUpdate) {
        onProductUpdate(mergedProduct);
      }
    } else {
      // MERGE with existing product (progressive enhancement)
      try {
        mergedProduct = mergeProducts([mergedProduct, product]);
        logger.info(`🔄 Merged ${name} - Product enhanced (${updateCount} sources)`);
        if (onProductUpdate) {
          onProductUpdate(mergedProduct);
        }
      } catch (error) {
        logger.warn(`Error merging ${name}:`, error);
      }
    }
  };
  
  // Fire ALL queries and process results as they arrive
  const queryPromises = allQueries.map(({ name, query, tier }) => 
    query
      .then(product => {
        processResult(name, product, tier);
        return product;
      })
      .catch(error => {
        logger.debug(`Query ${name} failed (non-critical):`, error);
        return null;
      })
  );
  
  // Wait for ALL queries to complete (no artificial timeout)
  // Each query has its own timeout, but we don't block on slow ones
  await Promise.allSettled(queryPromises);
  
  const totalTime = Date.now() - startTime;
  logger.info(`═══════════════════════════════════════════════════════════════`);
  logger.info(`✅ PROGRESSIVE QUERY COMPLETE: ${updateCount}/${allQueries.length} databases in ${totalTime}ms`);
  logger.info(`═══════════════════════════════════════════════════════════════`);
  
  // Return merged product or create minimal product if nothing found
  if (!mergedProduct) {
    logger.warn(`No product found in any database for ${barcode}`);
    return {
      barcode,
      product_name: `Product ${barcode}`,
      source: 'unknown',
    } as Product;
  }
  
  return mergedProduct;
}

/**
 * Create minimal product when no data found
 */
function createMinimalProduct(barcode: string): Product {
  return {
    barcode,
    product_name: `Product ${barcode}`,
    source: 'unknown',
  } as Product;
}
