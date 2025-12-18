// Product Data Merger Service
// Merges product data from multiple sources with weighted priority
// Ensures best-quality data is used when multiple sources return results

import { Product, ProductNutriments, Certification } from '../types/product';
import { logger } from '../utils/logger';
import { calculateDataCompleteness, formatCompletenessMetrics } from '../utils/dataCompleteness';

export interface MergeOptions {
  // Source weights (0-1, where 1 = highest priority)
  sourceWeights?: Record<NonNullable<Product['source']>, number>;
  // Whether to normalize nutrition to per-100g
  normalizeNutrition?: boolean;
  // Whether to merge certifications
  shouldMergeCertifications?: boolean;
}

/**
 * Default source weights (TruScore-optimized)
 * Higher weight = more trusted source
 * Updated to match TruScoreOptimizedDatabase weights for consistency
 */
const DEFAULT_SOURCE_WEIGHTS: Record<NonNullable<Product['source']>, number> = {
  // User-Contributed Data (HIGHEST PRIORITY - user-entered data from package)
  // This ensures user-submitted data always overrides database data for accuracy
  'user_contributed': 1.0,
  
  // Gold Standard (highest priority) - Government databases
  'fsanz_au': 0.50,
  'fsanz_nz': 0.50,
  'nzfcd': 0.50, // FSANZ NZFCD database (from fsanzQueryService)
  'afcd': 0.50, // FSANZ AFCD database (from fsanzQueryService)
  'nzfcd-fallback': 0.50, // NZFCD used as fallback for AU users
  'usda_fooddata': 0.50,
  'gs1_datasource': 0.45,
  'health_canada_cnf': 0.50,
  'uk_fsa': 0.50,
  'efsa': 0.50,
  
  // Open Facts databases (high priority)
  'openfoodfacts': 0.45,
  'openbeautyfacts': 0.40,
  'openpetfoodfacts': 0.40,
  'openproductsfacts': 0.35,
  
  // Regional Store APIs (medium-high priority)
  'tesco_labs': 0.35,
  'walmart_open': 0.35,
  'foodrepo': 0.35,
  
  // Store APIs (medium priority)
  'woolworths_au': 0.35,
  'coles_au': 0.35,
  'iga_au': 0.35,
  'woolworths_nz': 0.35,
  'paknsave': 0.35,
  'newworld': 0.35,
  
  // Nutrition APIs (medium priority)
  'edamam': 0.30,
  'nutritionix': 0.30,
  'spoonacular': 0.30,
  
  // Verified APIs (medium-low priority)
  'go_upc': 0.20,
  'buycott': 0.20,
  
  // Free APIs (low priority)
  'open_gtin': 0.20,
  'barcode_monster': 0.20,
  'upcitemdb': 0.20,
  'barcode_spider': 0.20,
  'ean_search': 0.20,
  
  // Fallback (lowest priority)
  'web_search': 0.10,
  
  // Unknown sources
  'off_api': 0.30,
  'nz_store_api': 0.30,
};

/**
 * Merge multiple products into one, using weighted source priority
 * 
 * @param products - Array of products from different sources
 * @param options - Merge options
 * @returns Merged product with best data from all sources
 */
export function mergeProducts(
  products: Product[],
  options: MergeOptions = {}
): Product {
  if (products.length === 0) {
    throw new Error('Cannot merge empty product array');
  }
  
  if (products.length === 1) {
    return products[0];
  }
  
  const sourceWeights = options.sourceWeights || DEFAULT_SOURCE_WEIGHTS;
  const normalizeNutrition = options.normalizeNutrition !== false; // Default true
  const shouldMergeCertifications = options.shouldMergeCertifications !== false; // Default true
  
  // OPTIMIZATION: Use Map for faster source weight lookups (O(1) instead of O(n))
  // This improves merging performance, especially with many products
  // Works globally on iOS and Android
  const sourceWeightsMap = new Map(Object.entries(sourceWeights));
  
  /**
   * Calculate TruScore field completeness score (0-100)
   * Higher score = more TruScore-critical fields present
   */
  function calculateTruScoreCompleteness(product: Product): number {
    let score = 0;
    
    // Body Pillar fields (25 points max)
    if (product.nutriscore_grade) score += 10; // Nutri-Score is critical
    if (product.nova_group) score += 5; // NOVA group
    if (product.nutriments && Object.keys(product.nutriments).length > 0) score += 5; // Nutrition data
    if (product.additives_tags && product.additives_tags.length > 0) score += 3; // Additives
    if (product.ingredients_analysis_tags && product.ingredients_analysis_tags.length > 0) score += 2; // Analysis tags
    
    // Planet Pillar fields (25 points max)
    if (product.ecoscore_grade) score += 10; // Eco-Score is critical
    if (product.palm_oil_analysis) score += 5; // Palm oil analysis
    if (product.packagings && product.packagings.length > 0) score += 5; // Packaging
    if (product.ingredients_analysis?.['en:palm-oil']) score += 5; // Palm oil tag
    
    // Care Pillar fields (25 points max)
    if (product.labels_tags && product.labels_tags.length > 0) score += 15; // Labels/certifications
    if (product.certifications && product.certifications.length > 0) score += 10; // Certifications
    
    // Open Pillar fields (25 points max)
    if (product.ingredients_text && product.ingredients_text.trim().length > 10) score += 15; // Ingredients text (CRITICAL)
    if (product.origins_tags && product.origins_tags.length > 0) score += 5; // Origins
    if (product.manufacturing_places_tags && product.manufacturing_places_tags.length > 0) score += 5; // Manufacturing
    
    return Math.min(100, score);
  }
  
  // OPTIMIZATION: Score each product by TruScore completeness using Map for faster lookups
  const scoredProducts = products.map(p => ({
    product: p,
    truScoreCompleteness: calculateTruScoreCompleteness(p),
    sourceWeight: sourceWeightsMap.get(p.source || 'web_search') || 0.1,
  }));
  
  // Sort by combined score: 60% TruScore completeness + 40% source weight
  // CRITICAL: User-contributed data (weight = 1.0) always takes highest priority
  // This ensures user-entered data from package labels overrides database data
  const sortedProducts = scoredProducts.sort((a, b) => {
    // User-contributed products ALWAYS come first (highest priority)
    const isUserContributedA = a.product.source === 'user_contributed';
    const isUserContributedB = b.product.source === 'user_contributed';
    
    if (isUserContributedA && !isUserContributedB) return -1; // A comes first
    if (!isUserContributedA && isUserContributedB) return 1; // B comes first
    
    // If both or neither are user-contributed, use combined score
    const completenessA = a.truScoreCompleteness / 100; // 0-1
    const completenessB = b.truScoreCompleteness / 100; // 0-1
    const weightA = a.sourceWeight; // Already 0-1
    const weightB = b.sourceWeight; // Already 0-1
    
    // Combined score: 60% completeness + 40% source weight
    const combinedA = completenessA * 0.6 + weightA * 0.4;
    const combinedB = completenessB * 0.6 + weightB * 0.4;
    
    return combinedB - combinedA; // Higher score first
  });
  
  // Use highest combined-score product as base
  const baseProduct = sortedProducts[0].product;
  const mergedProduct: Product = { ...baseProduct };
  
  // Log base selection reasoning
  logger.info(`═══════════════════════════════════════════════════════════════`);
  logger.info(`📊 TRUSCORE-AWARE BASE SELECTION`);
  logger.info(`═══════════════════════════════════════════════════════════════`);
  sortedProducts.forEach((scored, index) => {
    const completeness = scored.truScoreCompleteness;
    const weight = scored.sourceWeight;
    const combined = (completeness / 100) * 0.6 + weight * 0.4;
    logger.info(`Product ${index + 1}: ${scored.product.source || 'unknown'}`);
    logger.info(`  TruScore Completeness: ${completeness}%`);
    logger.info(`  Source Weight: ${(weight * 100).toFixed(1)}%`);
    logger.info(`  Combined Score: ${(combined * 100).toFixed(1)}%`);
    if (index === 0) {
      logger.info(`  ✅ SELECTED AS BASE (highest combined score)`);
    }
  });
  
  // OPTIMIZATION: Merge fields from other products (weighted) using Map for faster lookups
  // Use source weights from the scored products
  const weights = sortedProducts.map(scored => 
    sourceWeightsMap.get(scored.product.source || 'web_search') || 0.1
  );
  
  // Normalize weights to sum to 1
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const normalizedWeights = weights.map(w => w / totalWeight);
  
  // Extract products from scored products for merging
  const productsToMerge = sortedProducts.map(scored => scored.product);
  
  // Merge product name (use best one)
  mergedProduct.product_name = baseProduct.product_name || 
    productsToMerge.find(p => p.product_name)?.product_name || 
    'Unknown Product';
  
  // ENHANCED: Merge brands from all sources and all field names
  // This preserves brand data even when databases use different field names
  mergedProduct.brands = mergeBrandFields(productsToMerge);
  
  // Also merge brand_owner if available
  mergedProduct.brand_owner = baseProduct.brand_owner || 
    productsToMerge.find(p => p.brand_owner)?.brand_owner;
  
  // Merge image (use best one - prefer non-null)
  mergedProduct.image_url = baseProduct.image_url || 
    productsToMerge.find(p => p.image_url)?.image_url;
  
  // Merge nutrition data
  // CRITICAL: User-contributed nutrition data takes absolute priority (from package label)
  const userContributedProduct = productsToMerge.find(p => p.source === 'user_contributed');
  const allNutriments = productsToMerge
    .map(p => p.nutriments)
    .filter((n): n is ProductNutriments => n !== undefined);
  
  if (allNutriments.length > 0) {
    // If user-contributed product has nutrition data, use it exclusively (most accurate)
    if (userContributedProduct && userContributedProduct.nutriments) {
      mergedProduct.nutriments = { ...userContributedProduct.nutriments };
      logger.info(`  Nutrition: Using user-contributed data (from package label) - highest accuracy`);
    } else {
      // Otherwise use weighted average from all sources
      mergedProduct.nutriments = mergeNutriments(allNutriments, normalizedWeights);
    }
    
    // Normalize to per-100g if requested
    if (normalizeNutrition) {
      mergedProduct.nutriments = normalizeNutritionToPer100g(mergedProduct.nutriments);
    }
  }
  
  // Merge ingredients
  // CRITICAL: User-contributed ingredients take absolute priority (from package label)
  const ingredientsList = productsToMerge
    .map(p => p.ingredients_text)
    .filter((i): i is string => !!i && i.length > 0);
  
  if (ingredientsList.length > 0) {
    // If user-contributed product has ingredients, use it exclusively (most accurate)
    if (userContributedProduct && userContributedProduct.ingredients_text && userContributedProduct.ingredients_text.trim().length > 0) {
      mergedProduct.ingredients_text = userContributedProduct.ingredients_text;
      logger.info(`  Ingredients: Using user-contributed data (from package label) - highest accuracy`);
    } else {
      // Otherwise use longest ingredients list (most complete)
      mergedProduct.ingredients_text = ingredientsList.reduce((longest, current) => 
        current.length > longest.length ? current : longest
      );
    }
  }
  
  // Merge certifications (union with priority)
  const allCertifications = productsToMerge
    .map(p => p.certifications)
    .filter((c): c is Certification[] => Array.isArray(c) && c.length > 0);
  
  if (shouldMergeCertifications && allCertifications.length > 0) {
    mergedProduct.certifications = mergeCertificationsList(allCertifications, normalizedWeights);
  }
  
  // Merge categories (union)
  const allCategories = productsToMerge
    .map(p => p.categories)
    .filter((c): c is string => !!c);
  
  if (allCategories.length > 0) {
    // Use most specific (longest) category string
    mergedProduct.categories = allCategories.reduce((longest, current) => 
      current.length > longest.length ? current : longest
    );
  }

  // ===== CRITICAL: Merge TruScore-critical fields =====
  // These fields are essential for TruScore calculation and must be explicitly merged
  
  // Merge labels_tags (Care pillar - certifications)
  const allLabelsTags = productsToMerge
    .map(p => p.labels_tags)
    .filter((tags): tags is string[] => Array.isArray(tags) && tags.length > 0);
  
  if (allLabelsTags.length > 0) {
    const uniqueLabels = new Set<string>();
    allLabelsTags.forEach(tags => {
      tags.forEach(tag => {
        if (typeof tag === 'string' && tag.trim().length > 0) {
          uniqueLabels.add(tag.trim());
        }
      });
    });
    mergedProduct.labels_tags = Array.from(uniqueLabels);
    logger.info(`  Labels Tags: Merged ${uniqueLabels.size} unique labels from ${allLabelsTags.length} sources`);
  }

  // Merge ingredients_analysis_tags (Body/Planet pillars - risk tags)
  const allAnalysisTags = productsToMerge
    .map(p => p.ingredients_analysis_tags)
    .filter((tags): tags is string[] => Array.isArray(tags) && tags.length > 0);
  
  if (allAnalysisTags.length > 0) {
    const uniqueAnalysisTags = new Set<string>();
    allAnalysisTags.forEach(tags => {
      tags.forEach(tag => {
        if (typeof tag === 'string' && tag.trim().length > 0) {
          uniqueAnalysisTags.add(tag.trim());
        }
      });
    });
    mergedProduct.ingredients_analysis_tags = Array.from(uniqueAnalysisTags);
    logger.info(`  Analysis Tags: Merged ${uniqueAnalysisTags.size} unique tags from ${allAnalysisTags.length} sources`);
  }

  // Merge packagings (Planet pillar - recyclability)
  const allPackagings = productsToMerge
    .map(p => p.packagings)
    .filter((p): p is NonNullable<Product['packagings']> => Array.isArray(p) && p.length > 0);
  
  if (allPackagings.length > 0) {
    // Deduplicate packagings by material and shape
    // Import PackagingItem type
    type PackagingItem = NonNullable<Product['packagings']>[number];
    const packagingMap = new Map<string, PackagingItem>();
    allPackagings.forEach(packagings => {
      packagings.forEach(pkg => {
        if (pkg && typeof pkg === 'object') {
          const key = `${pkg.material || 'unknown'}_${pkg.shape || 'unknown'}_${pkg.recycling || 'unknown'}`;
          if (!packagingMap.has(key)) {
            packagingMap.set(key, pkg);
          }
        }
      });
    });
    mergedProduct.packagings = Array.from(packagingMap.values());
    logger.info(`  Packagings: Merged ${packagingMap.size} unique items from ${allPackagings.length} sources`);
  }

  // Merge origins_tags (Open pillar - transparency)
  const allOriginsTags = productsToMerge
    .map(p => p.origins_tags)
    .filter((tags): tags is string[] => Array.isArray(tags) && tags.length > 0);
  
  if (allOriginsTags.length > 0) {
    const uniqueOrigins = new Set<string>();
    allOriginsTags.forEach(tags => {
      tags.forEach(tag => {
        if (typeof tag === 'string' && tag.trim().length > 0) {
          uniqueOrigins.add(tag.trim());
        }
      });
    });
    mergedProduct.origins_tags = Array.from(uniqueOrigins);
    logger.info(`  Origins Tags: Merged ${uniqueOrigins.size} unique origins from ${allOriginsTags.length} sources`);
  }

  // Merge manufacturing_places_tags (Open pillar - transparency)
  const allManufacturingTags = productsToMerge
    .map(p => p.manufacturing_places_tags)
    .filter((tags): tags is string[] => Array.isArray(tags) && tags.length > 0);
  
  if (allManufacturingTags.length > 0) {
    const uniqueManufacturing = new Set<string>();
    allManufacturingTags.forEach(tags => {
      tags.forEach(tag => {
        if (typeof tag === 'string' && tag.trim().length > 0) {
          uniqueManufacturing.add(tag.trim());
        }
      });
    });
    mergedProduct.manufacturing_places_tags = Array.from(uniqueManufacturing);
    logger.info(`  Manufacturing Tags: Merged ${uniqueManufacturing.size} unique places from ${allManufacturingTags.length} sources`);
  }

  // Merge additives_tags (Body pillar - additive penalties)
  const allAdditivesTags = productsToMerge
    .map(p => p.additives_tags)
    .filter((tags): tags is string[] => Array.isArray(tags) && tags.length > 0);
  
  if (allAdditivesTags.length > 0) {
    const uniqueAdditives = new Set<string>();
    allAdditivesTags.forEach(tags => {
      tags.forEach(tag => {
        if (typeof tag === 'string' && tag.trim().length > 0) {
          uniqueAdditives.add(tag.trim());
        }
      });
    });
    mergedProduct.additives_tags = Array.from(uniqueAdditives);
    logger.info(`  Additives Tags: Merged ${uniqueAdditives.size} unique additives from ${allAdditivesTags.length} sources`);
  }

  // Merge allergens_tags (safety information)
  const allAllergensTags = productsToMerge
    .map(p => p.allergens_tags)
    .filter((tags): tags is string[] => Array.isArray(tags) && tags.length > 0);
  
  if (allAllergensTags.length > 0) {
    const uniqueAllergens = new Set<string>();
    allAllergensTags.forEach(tags => {
      tags.forEach(tag => {
        if (typeof tag === 'string' && tag.trim().length > 0) {
          uniqueAllergens.add(tag.trim());
        }
      });
    });
    mergedProduct.allergens_tags = Array.from(uniqueAllergens);
    logger.info(`  Allergens Tags: Merged ${uniqueAllergens.size} unique allergens from ${allAllergensTags.length} sources`);
  }

  // Merge origins and manufacturing_places strings (fallback if tags not available)
  const allOriginsStrings = productsToMerge
    .map(p => p.origins)
    .filter((o): o is string => !!o && typeof o === 'string' && o.trim().length > 0);
  
  if (allOriginsStrings.length > 0 && !mergedProduct.origins) {
    // Use longest/most specific origin string
    mergedProduct.origins = allOriginsStrings.reduce((longest, current) => 
      current.length > longest.length ? current : longest
    );
  }

  const allManufacturingStrings = productsToMerge
    .map(p => p.manufacturing_places)
    .filter((m): m is string => !!m && typeof m === 'string' && m.trim().length > 0);
  
  if (allManufacturingStrings.length > 0 && !mergedProduct.manufacturing_places) {
    // Use longest/most specific manufacturing place string
    mergedProduct.manufacturing_places = allManufacturingStrings.reduce((longest, current) => 
      current.length > longest.length ? current : longest
    );
  }

  // Merge ingredients_analysis object (Planet pillar - palm oil, vegan, etc.)
  const allIngredientsAnalysis = productsToMerge
    .map(p => p.ingredients_analysis)
    .filter((a): a is NonNullable<Product['ingredients_analysis']> => 
      a !== undefined && a !== null && typeof a === 'object' && Object.keys(a).length > 0
    );
  
  if (allIngredientsAnalysis.length > 0) {
    // Merge analysis objects, prefer values from higher-weight sources
    const mergedAnalysis: Product['ingredients_analysis'] = {};
    productsToMerge.forEach((p, index) => {
      if (p.ingredients_analysis && typeof p.ingredients_analysis === 'object') {
        Object.entries(p.ingredients_analysis).forEach(([key, value]) => {
          // Only set if not already set (higher weight sources processed first)
          if (!mergedAnalysis[key as keyof typeof mergedAnalysis]) {
            mergedAnalysis[key as keyof typeof mergedAnalysis] = value as any;
          }
        });
      }
    });
    mergedProduct.ingredients_analysis = mergedAnalysis;
    logger.info(`  Ingredients Analysis: Merged ${Object.keys(mergedAnalysis).length} analysis fields from ${allIngredientsAnalysis.length} sources`);
  }
  
  // Merge quality metrics (weighted average)
  const qualityValues = productsToMerge
    .map(p => p.quality)
    .filter((q): q is number => q !== undefined);
  
  if (qualityValues.length > 0) {
    mergedProduct.quality = Math.round(
      qualityValues.reduce((sum, q, i) => sum + q * normalizedWeights[i], 0)
    );
  }
  
  const completionValues = productsToMerge
    .map(p => p.completion)
    .filter((c): c is number => c !== undefined);
  
  if (completionValues.length > 0) {
    mergedProduct.completion = Math.round(
      completionValues.reduce((sum, c, i) => sum + c * normalizedWeights[i], 0)
    );
  }
  
  // Use source from base product (highest combined score)
  mergedProduct.source = baseProduct.source;
  
  // Merge other fields (use best available)
  mergedProduct.packaging = baseProduct.packaging || 
    productsToMerge.find(p => p.packaging)?.packaging;
  
  mergedProduct.serving_size = baseProduct.serving_size || 
    productsToMerge.find(p => p.serving_size)?.serving_size;
  
  mergedProduct.quantity = baseProduct.quantity || 
    productsToMerge.find(p => p.quantity)?.quantity;
  
  // Log detailed merging information
  logger.info(`═══════════════════════════════════════════════════════════════`);
  logger.info(`📊 DATABASE MERGER: Merging ${products.length} products`);
  logger.info(`═══════════════════════════════════════════════════════════════`);
  
  // Log each source with completeness
  sortedProducts.forEach((scored, index) => {
    const p = scored.product;
    const weight = sourceWeights[p.source || 'web_search'] || 0.1;
    const completeness = calculateDataCompleteness(p);
    const truScoreCompleteness = scored.truScoreCompleteness;
    logger.info(`Source ${index + 1}: ${p.source || 'unknown'} (Weight: ${(weight * 100).toFixed(1)}%, TruScore Completeness: ${truScoreCompleteness}%)`);
    logger.info(`  ${formatCompletenessMetrics(completeness, p.source || 'unknown')}`);
  });
  
  // Log what was used from each source
  logger.info(`───────────────────────────────────────────────────────────────`);
  logger.info(`🔀 MERGING DECISIONS:`);
  logger.info(`  Base Product: ${baseProduct.source} (highest combined score: TruScore completeness + source weight)`);
  
  if (allNutriments.length > 0) {
    logger.info(`  Nutrition: Merged from ${allNutriments.length} sources (weighted average)`);
  }
  
  if (ingredientsList.length > 0) {
    const longestSource = productsToMerge.find(p => 
      p.ingredients_text === mergedProduct.ingredients_text
    )?.source || 'unknown';
    logger.info(`  Ingredients: Used from ${longestSource} (longest/most complete)`);
  }
  
  if (allCertifications.length > 0) {
    logger.info(`  Certifications: Merged from ${allCertifications.length} sources (union)`);
  }
  
  if (allCategories.length > 0) {
    const longestCategorySource = productsToMerge.find(p => 
      p.categories === mergedProduct.categories
    )?.source || 'unknown';
    logger.info(`  Categories: Used from ${longestCategorySource} (most specific)`);
  }
  
  // Log final merged product completeness
  const finalCompleteness = calculateDataCompleteness(mergedProduct);
  logger.info(`───────────────────────────────────────────────────────────────`);
  logger.info(`✅ FINAL MERGED PRODUCT:`);
  logger.info(`  ${formatCompletenessMetrics(finalCompleteness, 'MERGED')}`);
  logger.info(`  Source: ${mergedProduct.source}`);
  logger.info(`  Quality: ${mergedProduct.quality || 'N/A'}`);
  logger.info(`  Completion: ${mergedProduct.completion || 'N/A'}`);
  logger.info(`═══════════════════════════════════════════════════════════════`);
  
  return mergedProduct;
}

/**
 * ENHANCED: Merge brand fields from all products and all field name variations
 * This is critical because different databases use different field names:
 * - OFF: brands, brand_owner, brands_tags
 * - USDA: brandOwner, brandName (converted to brands)
 * - FSANZ: brand (converted to brands)
 * - UPCitemdb: brand (converted to brands)
 * 
 * This function collects brands from ALL possible field names to prevent data loss
 */
function mergeBrandFields(products: Product[]): string | undefined {
  const brands = new Set<string>();
  
  // Collect brands from all products and all field name variations
  products.forEach(p => {
    // 1. Primary brands field (may contain comma-separated values)
    if (p.brands && typeof p.brands === 'string') {
      const brandList = p.brands.split(',').map(b => b.trim()).filter(Boolean);
      brandList.forEach(b => {
        if (b && b !== 'Unknown') {
          brands.add(b);
        }
      });
    }
    
    // 2. Brand owner field
    if (p.brand_owner && typeof p.brand_owner === 'string') {
      const brandOwner = p.brand_owner.trim();
      if (brandOwner && brandOwner !== 'Unknown') {
        brands.add(brandOwner);
      }
    }
    
    // 3. Brands tags (OFF-specific field)
    const brandsTags = (p as any).brands_tags;
    if (Array.isArray(brandsTags) && brandsTags.length > 0) {
      brandsTags.forEach((tag: string) => {
        if (typeof tag === 'string') {
          // Remove 'en:' prefix if present
          const brand = tag.replace(/^en:/, '').trim();
          if (brand && brand !== 'Unknown') {
            brands.add(brand);
          }
        }
      });
    }
    
    // 4. Brand owner tags (OFF-specific field)
    const brandOwnerTags = (p as any).brand_owner_tags;
    if (Array.isArray(brandOwnerTags) && brandOwnerTags.length > 0) {
      brandOwnerTags.forEach((tag: string) => {
        if (typeof tag === 'string') {
          const brand = tag.replace(/^en:/, '').trim();
          if (brand && brand !== 'Unknown') {
            brands.add(brand);
          }
        }
      });
    }
    
    // 5. Database-specific field names (check raw data)
    const rawProduct = p as any;
    
    // USDA uses brandOwner or brandName (before conversion)
    if (rawProduct.brandOwner && typeof rawProduct.brandOwner === 'string') {
      const brandOwner = rawProduct.brandOwner.trim();
      if (brandOwner && brandOwner !== 'Unknown') {
        brands.add(brandOwner);
      }
    }
    if (rawProduct.brandName && typeof rawProduct.brandName === 'string') {
      const brandName = rawProduct.brandName.trim();
      if (brandName && brandName !== 'Unknown') {
        brands.add(brandName);
      }
    }
    
    // FSANZ/UPCitemdb use 'brand' (before conversion)
    if (rawProduct.brand && typeof rawProduct.brand === 'string') {
      const brand = rawProduct.brand.trim();
      if (brand && brand !== 'Unknown') {
        brands.add(brand);
      }
    }
    
    // Manufacturer field (sometimes contains brand info)
    if (rawProduct.manufacturer && typeof rawProduct.manufacturer === 'string') {
      const manufacturer = rawProduct.manufacturer.trim();
      if (manufacturer && manufacturer !== 'Unknown') {
        brands.add(manufacturer);
      }
    }
  });
  
  // Filter out generic terms
  const validBrands = Array.from(brands).filter(brand => {
    const brandLower = brand.toLowerCase();
    const genericTerms = [
      'unknown', 'n/a', 'not available', 'missing', 'not disclosed',
      'product', 'food', 'item', 'goods', 'merchandise', 'generic',
      'store brand', 'private label', 'no name'
    ];
    return !genericTerms.some(term => brandLower.includes(term)) && brand.length >= 2;
  });
  
  if (validBrands.length === 0) {
    return undefined;
  }
  
  // Join unique brands (comma-separated)
  const mergedBrands = validBrands.join(', ');
  
  logger.info(`  Brands: Merged ${validBrands.length} unique brands from ${products.length} sources: ${mergedBrands}`);
  
  return mergedBrands;
}

/**
 * Merge nutrition data with weighted average
 */
function mergeNutriments(
  nutriments: ProductNutriments[],
  weights: number[]
): ProductNutriments {
  const merged: ProductNutriments = {};
  
  // Get all unique keys
  const allKeys = new Set<string>();
  nutriments.forEach(n => {
    Object.keys(n).forEach(key => allKeys.add(key));
  });
  
  // Merge each nutrient with weighted average
  allKeys.forEach(key => {
    let totalValue = 0;
    let totalWeight = 0;
    
    nutriments.forEach((n, index) => {
      const value = (n as any)[key];
      if (value !== undefined && value !== null && !isNaN(Number(value))) {
        const numValue = Number(value);
        const weight = weights[index] || 0;
        totalValue += numValue * weight;
        totalWeight += weight;
      }
    });
    
    if (totalWeight > 0) {
      (merged as any)[key] = totalValue / totalWeight;
    }
  });
  
  return merged;
}

/**
 * Normalize nutrition values to per-100g format
 */
function normalizeNutritionToPer100g(nutriments: ProductNutriments): ProductNutriments {
  const normalized: ProductNutriments = { ...nutriments };
  
  // List of nutrients that should have per-100g values
  const nutrients = [
    'energy', 'energy-kcal', 'energy-kj',
    'fat', 'saturated-fat',
    'carbohydrates', 'sugars', 'fiber',
    'proteins', 'salt', 'sodium',
  ];
  
  nutrients.forEach(nutrient => {
    // If we have the base value but not per-100g, use base value
    const baseValue = (normalized as any)[nutrient];
    const per100gValue = (normalized as any)[`${nutrient}_100g`];
    
    if (baseValue !== undefined && per100gValue === undefined) {
      (normalized as any)[`${nutrient}_100g`] = baseValue;
    }
    
    // If we have per-100g but not base, use per-100g
    if (per100gValue !== undefined && baseValue === undefined) {
      (normalized as any)[nutrient] = per100gValue;
    }
  });
  
  return normalized;
}

/**
 * Merge certifications (union with priority)
 * Higher-weight sources' certifications take priority
 */
function mergeCertificationsList(
  certifications: Certification[][],
  weights: number[]
): Certification[] {
  const certificationMap = new Map<string, Certification>();
  
  // Process certifications in order of weight (highest first)
  certifications.forEach((certs, index) => {
    const weight = weights[index] || 0;
    
    certs.forEach(cert => {
      const key = cert.tag || cert.id || cert.name || '';
      
      // Only add if not already present (higher weight sources processed first)
      if (key && !certificationMap.has(key)) {
        certificationMap.set(key, cert);
      }
    });
  });
  
  return Array.from(certificationMap.values());
}

