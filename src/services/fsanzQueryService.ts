/**
 * FSANZ Query Service - Query FSANZ databases by product name
 * This is the PRIMARY way to access full FSANZ databases
 * 
 * Flow:
 * 1. User scans barcode → App gets product name from Open Food Facts
 * 2. App queries FSANZ API by product name
 * 3. FSANZ returns official nutrition data
 * 4. App merges FSANZ data into product for TruScore
 */

import { Product, ProductNutriments } from '../types/product';
import { logger } from '../utils/logger';
import { getUserCountryCode } from '../utils/countryDetection';
import { normalizeProductName, generateProductNameVariations } from './productNameDiscovery';

const FSANZ_QUERY_API = process.env.EXPO_PUBLIC_FSANZ_QUERY_URL || 'https://truscoreapi-l69qp6606-leightons-projects-d328c774.vercel.app/api/fsanz-query';

export interface FSANZQueryResponse {
  found: boolean;
  product?: {
    productName: string;
    country: 'NZ' | 'AU';
    energyKcal?: number;
    energyKj?: number;
    fat?: number;
    saturatedFat?: number;
    carbohydrates?: number;
    sugars?: number;
    protein?: number;
    salt?: number;
    sodium?: number;
    dietaryFiber?: number;
    calcium?: number;
    iron?: number;
    foodGroup?: string;
    foodSubgroup?: string;
  };
  country: 'NZ' | 'AU';
  source?: 'nzfcd' | 'afcd' | 'nzfcd-fallback';
  fallback?: boolean;
  message?: string;
}

/**
 * Query FSANZ database by product name
 * This is the PRIMARY way to access full FSANZ databases
 * 
 * @param productName - Product name from barcode scan
 * @param country - Optional country code ('NZ' or 'AU'). If not provided, uses user's country
 * @returns FSANZ product data if found, null otherwise
 */
export async function queryFSANZByProductName(
  productName: string,
  country?: 'NZ' | 'AU'
): Promise<Product | null> {
  try {
    if (!productName || productName.trim().length === 0) {
      return null;
    }

    // CRITICAL: Reject generic product names (e.g., "Product 9310645467740")
    // These are fallback names when no product is found and will never match correctly
    const trimmedName = productName.trim();
    if (trimmedName.match(/^Product\s+\d+$/i) || trimmedName.match(/^Product\s+[a-z0-9]+$/i)) {
      logger.debug(`[FSANZ QUERY] Rejecting generic product name: "${trimmedName}" - will not match correctly`);
      return null;
    }

    const userCountry = country || getUserCountryCode();
    
    // Only query FSANZ for NZ/AU users
    if (userCountry !== 'NZ' && userCountry !== 'AU') {
      return null;
    }

    // Try multiple name variations for better matching
    const nameVariations = generateProductNameVariations(productName);
    logger.info(`🔍 [FSANZ QUERY] Querying ${userCountry} database with ${nameVariations.length} name variation(s)`);
    
    // Try each variation (start with original, then normalized, then keywords)
    for (const nameToTry of nameVariations) {
      const url = `${FSANZ_QUERY_API}?country=${userCountry.toLowerCase()}&productName=${encodeURIComponent(nameToTry)}`;
      
      logger.debug(`   📡 Trying: "${nameToTry}"`);

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Rveel-Mobile/1.0.0',
          },
        });

        if (!response.ok) {
          logger.debug(`   ❌ API request failed: ${response.status}`);
          continue; // Try next variation
        }

        const data: FSANZQueryResponse = await response.json();

        if (data.found && data.product) {
          // Found a match with this variation!
          logger.info(`✅ [FSANZ QUERY] MATCH FOUND using name variation: "${nameToTry}"`);
          return convertFSANZResponseToProduct(data, userCountry as 'NZ' | 'AU');
        }
      } catch (error) {
        logger.debug(`   ❌ Error with variation "${nameToTry}":`, error);
        continue; // Try next variation
      }
    }
    
    // None of the variations matched
    logger.info(`❌ [FSANZ QUERY] No match found in ${userCountry} database for any variation of "${productName}"`);
    
    // For AU users, log that fallback will be tried
    if (userCountry === 'AU') {
      logger.info(`   🔄 [FSANZ FALLBACK] Will try NZFCD fallback for AU user...`);
    }
    return null;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.debug(`Error querying FSANZ by product name: ${errorMessage}`);
    return null;
  }
}

/**
 * Convert FSANZ API response to Product format (internal helper)
 */
function convertFSANZResponseToProduct(
  data: FSANZQueryResponse,
  userCountry: 'NZ' | 'AU'
): Product {
  // Log successful match with details
  logger.info(`   📦 Product: ${data.product!.productName}`);
  logger.info(`   🏷️  Source: ${data.source || (userCountry === 'NZ' ? 'NZFCD' : 'AFCD')}`);
  logger.info(`   🥗 Food Group: ${data.product!.foodGroup || 'N/A'}`);
  logger.info(`   📊 Nutrition: Energy ${data.product!.energyKcal || 'N/A'} kcal, Protein ${data.product!.protein || 'N/A'}g, Fat ${data.product!.fat || 'N/A'}g`);
  if (data.fallback) {
    logger.info(`   ⚠️  [FALLBACK] Used NZFCD fallback (not found in AFCD)`);
  }

  // Convert to Product format
  return {
    barcode: '', // FSANZ doesn't have barcodes
    product_name: data.product!.productName,
    product_name_en: data.product!.productName,
    categories: data.product!.foodGroup,
    categories_tags: data.product!.foodGroup ? [data.product!.foodGroup.toLowerCase().replace(/\s+/g, '_')] : undefined,
    source: data.source || (userCountry === 'NZ' ? 'nzfcd' : 'afcd'),
    
    // Nutrition data (per 100g)
    nutriments: {
      'energy-kcal_100g': data.product!.energyKcal,
      'energy-kcal': data.product!.energyKcal,
      'energy-kj_100g': data.product!.energyKj,
      'energy-kj': data.product!.energyKj,
      'proteins_100g': data.product!.protein,
      proteins: data.product!.protein,
      'fat_100g': data.product!.fat,
      fat: data.product!.fat,
      'saturated-fat_100g': data.product!.saturatedFat,
      'saturated-fat': data.product!.saturatedFat,
      'carbohydrates_100g': data.product!.carbohydrates,
      carbohydrates: data.product!.carbohydrates,
      'sugars_100g': data.product!.sugars,
      sugars: data.product!.sugars,
      'salt_100g': data.product!.salt,
      salt: data.product!.salt,
      'sodium_100g': data.product!.sodium,
      sodium: data.product!.sodium,
      'fiber_100g': data.product!.dietaryFiber,
      fiber: data.product!.dietaryFiber,
      'calcium_100g': data.product!.calcium,
      calcium: data.product!.calcium,
      'iron_100g': data.product!.iron,
      iron: data.product!.iron,
    },
    
    // Quality indicators (government data is high quality)
    quality: 90,
    completion: 75, // Good nutrition data, but may lack other fields
  };
}

/**
 * Enhance existing product with FSANZ data by querying by product name
 * This is called after product is found from barcode scan
 * 
 * @param product - Product found from barcode scan (must have product_name)
 * @returns Enhanced product with FSANZ nutrition data merged in
 */
export async function enhanceProductWithFSANZQuery(
  product: Product
): Promise<Product> {
  try {
    // Only enhance if product has a name
    if (!product.product_name && !product.product_name_en) {
      return product;
    }

    const productName = product.product_name || product.product_name_en || '';
    
    // Only enhance if product lacks comprehensive nutrition data
    const hasGoodNutrition = product.nutriments && Object.keys(product.nutriments).length > 5;
    if (hasGoodNutrition) {
      // Still try FSANZ for additional nutrients (calcium, iron, etc.)
      // but don't skip if already has good data
    }

    const userCountry = getUserCountryCode();
    if (userCountry !== 'NZ' && userCountry !== 'AU') {
      return product;
    }

    logger.info(`───────────────────────────────────────────────────────────────`);
    logger.info(`📊 TIER 1.5: FSANZ Query by Product Name (${userCountry})`);
    logger.info(`───────────────────────────────────────────────────────────────`);
    logger.info(`🔍 Querying FSANZ (${userCountry}) by product name: "${productName}"...`);
    logger.info(`   📝 Product name from barcode scan: "${productName}"`);

    const fsanzProduct = await queryFSANZByProductName(productName, userCountry as 'NZ' | 'AU');

    if (!fsanzProduct || !fsanzProduct.nutriments) {
      logger.info(`❌ [FSANZ ENHANCEMENT] No match found for "${productName}" - product not enhanced`);
      return product;
    }
    
    // Log what nutrients FSANZ is adding
    const existingNutrients = Object.keys(product.nutriments || {}).length;
    const fsanzNutrients = Object.keys(fsanzProduct.nutriments || {}).length;
    logger.info(`   📊 Existing nutrients: ${existingNutrients}, FSANZ nutrients: ${fsanzNutrients}`);

    // Merge nutrition data (prefer existing, fill gaps with FSANZ)
    const mergedNutriments: ProductNutriments = {
      ...product.nutriments,
      ...fsanzProduct.nutriments,
    };

    // Prefer existing values over FSANZ values (existing might be product-specific)
    Object.keys(product.nutriments || {}).forEach(key => {
      if (product.nutriments?.[key as keyof ProductNutriments] !== undefined) {
        mergedNutriments[key as keyof ProductNutriments] = product.nutriments[key as keyof ProductNutriments];
      }
    });

    // But use FSANZ for missing nutrients (calcium, iron, etc.)
    const addedNutrients: string[] = [];
    Object.keys(fsanzProduct.nutriments || {}).forEach(key => {
      if (!product.nutriments?.[key as keyof ProductNutriments] && fsanzProduct.nutriments?.[key as keyof ProductNutriments]) {
        mergedNutriments[key as keyof ProductNutriments] = fsanzProduct.nutriments[key as keyof ProductNutriments];
        addedNutrients.push(key);
      }
    });

    const enhanced = {
      ...product,
      nutriments: mergedNutriments,
      source: product.source ? `${product.source}+${fsanzProduct.source}` : fsanzProduct.source,
    };
    
    const finalNutrients = Object.keys(mergedNutriments).length;
    logger.info(`✅ [FSANZ ENHANCEMENT] Product enhanced with official nutrition data`);
    logger.info(`   📊 Final nutrients: ${finalNutrients} (added ${addedNutrients.length} from FSANZ)`);
    if (addedNutrients.length > 0) {
      logger.info(`   ➕ Added nutrients: ${addedNutrients.slice(0, 5).join(', ')}${addedNutrients.length > 5 ? '...' : ''}`);
    }
    logger.info(`   🏷️  Source: ${enhanced.source}`);
    
    // ===== VERIFICATION: Log TruScore-critical fields =====
    logger.info(`   🔍 [VERIFICATION] TruScore Field Status After FSANZ Enhancement:`);
    logger.info(`      ✅ Nutrition: ${Object.keys(mergedNutriments).length} nutrients`);
    logger.info(`      ${enhanced.ingredients_text ? '✅' : '❌'} Ingredients: ${enhanced.ingredients_text ? `${enhanced.ingredients_text.length} chars` : 'MISSING'}`);
    logger.info(`      ${enhanced.labels_tags && enhanced.labels_tags.length > 0 ? '✅' : '❌'} Labels: ${enhanced.labels_tags?.length || 0} tags`);
    logger.info(`      ${enhanced.packagings && enhanced.packagings.length > 0 ? '✅' : '❌'} Packaging: ${enhanced.packagings?.length || 0} items`);
    logger.info(`      ${enhanced.origins_tags && enhanced.origins_tags.length > 0 ? '✅' : '❌'} Origins: ${enhanced.origins_tags?.length || 0} tags`);
    logger.info(`      ${enhanced.nutriscore_grade ? '✅' : '❌'} Nutri-Score: ${enhanced.nutriscore_grade || 'MISSING'}`);
    logger.info(`      ${enhanced.ecoscore_grade ? '✅' : '❌'} Eco-Score: ${enhanced.ecoscore_grade || 'MISSING'}`);
    logger.info(`      ${enhanced.nova_group ? '✅' : '❌'} NOVA: ${enhanced.nova_group || 'MISSING'}`);
    
    return enhanced;

  } catch (error) {
    logger.debug('Error enhancing product with FSANZ query:', error);
    return product;
  }
}
