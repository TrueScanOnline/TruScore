// Open Food Facts API client
import { Product, PalmOilAnalysis, PackagingData, PackagingItem, AgribalyseData } from '../types/product';
import { logger } from '../utils/logger';
import { getUserCountryCode, getCountryCodesToTry, getOFFCountryInstance } from '../utils/countryDetection';
import { fetchWithRateLimit } from '../utils/timeoutHelper';

const OFF_API_BASE = 'https://world.openfoodfacts.org/api/v2/product';
const USER_AGENT = 'TrueScan-FoodScanner/1.0.0';

export interface OFFResponse {
  status: number;
  status_verbose: string;
  product?: Product;
  code?: string;
}

/**
 * Fetch product data from a specific Open Food Facts instance
 */
async function fetchProductFromOFFInstance(barcode: string, instance: string): Promise<Product | null> {
  try {
    const url = `https://${instance}/api/v2/product/${barcode}.json`;
    
    const response = await fetchWithRateLimit(url, {
      headers: {
        'User-Agent': USER_AGENT,
      },
    }, 'openfoodfacts');

    if (!response.ok) {
      if (response.status !== 404) {
        logger.debug(`OFF API error (${instance}): ${response.status} ${response.statusText}`);
      }
      return null;
    }

    const data: OFFResponse = await response.json();

    if (data.status === 0 || !data.product) {
      return null;
    }

    // Add source and barcode
    const product: Product = {
      ...data.product,
      barcode,
      source: 'openfoodfacts',
    };

    // Enhance product with extracted sustainability data
    enhanceProductWithSustainabilityData(product);

    return product;
  } catch (error) {
    logger.debug(`Error fetching from ${instance}:`, error);
    return null;
  }
}

/**
 * Fetch product data from Open Food Facts API
 * Tries country-specific instances first, then falls back to global
 * This significantly improves success rate for country-specific products
 */
export async function fetchProductFromOFF(barcode: string): Promise<Product | null> {
  // Get country codes to try (user's country first, then common countries)
  const countriesToTry = getCountryCodesToTry();
  
  // Build list of instances to try
  const instancesToTry: string[] = [];
  
  // Add country-specific instances first
  for (const countryCode of countriesToTry) {
    const instance = getOFFCountryInstance(countryCode);
    if (instance && !instancesToTry.includes(instance)) {
      instancesToTry.push(instance);
    }
  }
  
  // Always try global instance as fallback
  instancesToTry.push('world.openfoodfacts.org');
  
  // Try instances in parallel for faster lookup
  // User's country instance will likely respond first if product exists there
  const results = await Promise.allSettled(
    instancesToTry.map(instance => fetchProductFromOFFInstance(barcode, instance))
  );
  
  // Return first successful result
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === 'fulfilled' && result.value) {
      const instance = instancesToTry[i];
      logger.debug(`Found product in OFF (${instance}): ${barcode}`);
      return result.value;
    }
  }
  
  // No product found in any instance
  logger.debug(`Product not found in any OFF instance: ${barcode}`);
  return null;
}

/**
 * Format ingredients array from OFF response
 */
export function formatIngredients(product: Product): Product['ingredients'] {
  if (product.ingredients && Array.isArray(product.ingredients)) {
    return product.ingredients.map((ing) => ({
      id: ing.id || '',
      text: ing.text || '',
      percent_estimate: ing.percent_estimate,
      rank: ing.rank,
      vegan: ing.vegan,
      vegetarian: ing.vegetarian,
      origin: ing.origin,
      country: ing.country,
    }));
  }
  return undefined;
}

/**
 * Format certifications from labels
 */
export function formatCertifications(product: Product): Product['certifications'] {
  if (!product.labels_tags || product.labels_tags.length === 0) {
    return undefined;
  }

  const certificationMap: Record<string, { name: string; icon_url?: string; description?: string }> = {
    'en:organic': {
      name: 'Organic',
      description: 'EU organic certification',
    },
    'en:fair-trade': {
      name: 'Fair Trade',
      description: 'Fair trade certified',
    },
    'en:rainforest-alliance': {
      name: 'Rainforest Alliance',
      description: 'Rainforest Alliance certified',
    },
    'en:utz': {
      name: 'UTZ Certified',
      description: 'UTZ certified sustainable',
    },
    'en:roundtable-on-sustainable-palm-oil': {
      name: 'RSPO',
      description: 'Roundtable on Sustainable Palm Oil',
    },
    'en:marine-stewardship-council': {
      name: 'MSC',
      description: 'Marine Stewardship Council',
    },
    'en:free-range': {
      name: 'Free Range',
      description: 'Free range certified',
    },
    'en:cage-free': {
      name: 'Cage Free',
      description: 'Cage free eggs/poultry',
    },
    'en:red-tractor': {
      name: 'Red Tractor',
      description: 'Red Tractor assured food',
    },
  };

  return product.labels_tags
    .filter((tag) => certificationMap[tag])
    .map((tag) => ({
      id: tag,
      name: certificationMap[tag].name,
      tag,
      icon_url: certificationMap[tag].icon_url,
      description: certificationMap[tag].description,
    }));
}

/**
 * Extract country of manufacture from product data
 * CRITICAL: "Product of X" labels typically go into origins/origins_tags, NOT countries_tags
 * countries_tags represents where the product is SOLD (e.g., Australia), not where it's MANUFACTURED
 * Priority order ensures we get the actual manufacturing country, not the distribution country
 */
export function extractManufacturingCountry(product: Product): string | null {
  // Priority 1: Manufacturing places tags (most accurate for manufacturing location)
  if (product.manufacturing_places_tags && product.manufacturing_places_tags.length > 0) {
    const tag = product.manufacturing_places_tags[0];
    if (tag && typeof tag === 'string') {
      // Remove 'en:' prefix if present and format
      const country = tag.replace(/^en:/, '').replace(/-/g, ' ').toUpperCase();
      if (country && country.trim()) {
        return country;
      }
    }
  }

  // Priority 2: Manufacturing places text field
  if (product.manufacturing_places && typeof product.manufacturing_places === 'string' && product.manufacturing_places.trim()) {
    const places = product.manufacturing_places.split(',');
    const firstPlace = places[0]?.trim();
    if (firstPlace) {
      return firstPlace.toUpperCase();
    }
  }

  // Priority 3: Origins tags - "Product of X" labels map here (CRITICAL for accurate manufacturing country)
  // This is where "Product of China" would be stored, NOT in countries_tags
  if (product.origins_tags && product.origins_tags.length > 0) {
    const originTag = product.origins_tags[0];
    // Remove 'en:' prefix if present
    if (originTag && typeof originTag === 'string') {
      const country = originTag.replace(/^en:/, '').replace(/-/g, ' ').toUpperCase();
      if (country && country.trim()) {
        return country;
      }
    }
  }

  // Priority 4: Origins text field - "Product of X" labels map here
  if (product.origins && typeof product.origins === 'string' && product.origins.trim()) {
    const origins = product.origins.split(',');
    const firstOrigin = origins[0]?.trim();
    if (firstOrigin) {
      // Clean up common prefixes like "Product of" or "Made in"
      const cleaned = firstOrigin
        .replace(/^(product\s+of|made\s+in|origin:|origin\s+of)\s*/i, '')
        .trim();
      if (cleaned) {
        return cleaned.toUpperCase();
      }
    }
  }

  // Priority 5: Try to extract from labels_text or generic_name if it contains "Product of" or "Made in"
  // Sometimes this information is in the product description or labels text
  const labelsText = (product.labels || product.labels_en || product.generic_name || '').toLowerCase();
  const originsPattern = /(?:product\s+of|made\s+in|origin:|origin\s+of|manufactured\s+in)\s+([a-z\s]+?)(?:[,;]|\s*$)/i;
  const match = labelsText.match(originsPattern);
  if (match && match[1]) {
    const extractedCountry = match[1].trim();
    if (extractedCountry && extractedCountry.length > 2) {
      return extractedCountry.toUpperCase();
    }
  }

  // DO NOT use countries_tags - it represents where SOLD, not where MANUFACTURED
  // For example: A product made in China but sold in Australia would have:
  // - origins/origins_tags = "China" (manufacturing)
  // - countries_tags = "Australia" (distribution/sales)
  // Using countries_tags would incorrectly show "Australia" as manufacturing country
  // If we don't have manufacturing data, return null (don't show incorrect information)

  return null;
}

/**
 * Extract country of origin from product data
 * @deprecated Use extractManufacturingCountry instead - manufacturing is more significant
 */
export function extractOriginCountry(product: Product): string | null {
  // For backward compatibility, use manufacturing country extractor
  return extractManufacturingCountry(product);
}

/**
 * Enhance product with extracted sustainability data from OFF
 * This extracts all available data that we weren't using before
 */
function enhanceProductWithSustainabilityData(product: Product): void {
  // Extract and enhance Eco-Score data
  if (product.ecoscore_data) {
    enhanceEcoScoreData(product);
  }

  // Extract palm oil analysis
  if (product.ingredients_analysis_tags || product.ingredients_analysis) {
    product.palm_oil_analysis = extractPalmOilAnalysis(product);
  }

  // Extract packaging data
  if (product.packagings || product.packaging_tags) {
    product.packaging_data = extractPackagingData(product);
  }
}

/**
 * Enhance Eco-Score data with full Agribalyse breakdown
 */
function enhanceEcoScoreData(product: Product): void {
  if (!product.ecoscore_data) return;

  const ecoscore = product.ecoscore_data;
  // Type-safe access to agribalyse data
  const ecoscoreData = ecoscore as { agribalyse?: AgribalyseData } | null | undefined;
  const agribalyse = ecoscoreData?.agribalyse;

  // Extract Agribalyse LCA data
  if (agribalyse) {
    ecoscore.agribalyse = agribalyse;
    
    // Map agribalyse fields to top-level for easy access
    if (agribalyse.co2_total !== undefined) {
      ecoscore.co2_total = agribalyse.co2_total;
    }
    if (agribalyse.water_usage !== undefined) {
      ecoscore.water_footprint = agribalyse.water_usage;
    }
    if (agribalyse.land_use !== undefined) {
      ecoscore.land_use = agribalyse.land_use;
    }
    if (agribalyse.biodiversity_threats !== undefined) {
      ecoscore.biodiversity_threats = agribalyse.biodiversity_threats;
    }
  }

  // Extract transport and packaging impacts (if available)
  const ecoscoreAny = ecoscore as any;
  if (ecoscoreAny.transport_impact !== undefined) {
    ecoscore.transport_impact = ecoscoreAny.transport_impact;
  }
  if (ecoscoreAny.packaging_impact !== undefined) {
    ecoscore.packaging_impact = ecoscoreAny.packaging_impact;
  }
  if (ecoscoreAny.origins_of_ingredients !== undefined) {
    ecoscore.origins_of_ingredients = ecoscoreAny.origins_of_ingredients;
  }
}

/**
 * Extract palm oil analysis from ingredients_analysis_tags
 */
export function extractPalmOilAnalysis(product: Product): PalmOilAnalysis {
  const tags = product.ingredients_analysis_tags || [];
  const analysis = product.ingredients_analysis || {};

  const containsPalmOil = 
    tags.includes('en:palm-oil') || 
    analysis['en:palm-oil'] === 'yes' ||
    analysis['en:palm-oil'] === 'maybe';

  const isPalmOilFree = 
    tags.includes('en:palm-oil-free') || 
    analysis['en:palm-oil'] === 'no';

  const isNonSustainable = 
    tags.includes('en:non-sustainable-palm-oil');

  // Calculate score: -10 for non-sustainable palm oil, -5 for palm oil, +10 for palm-oil-free
  let score = 0;
  if (isNonSustainable) {
    score = -10;
  } else if (containsPalmOil && !isPalmOilFree) {
    score = -5;
  } else if (isPalmOilFree) {
    score = 10;
  }

  return {
    containsPalmOil,
    isPalmOilFree,
    isNonSustainable,
    score,
  };
}

/**
 * Extract packaging sustainability data
 */
export function extractPackagingData(product: Product): PackagingData {
  const packagings = (product.packagings || []) as PackagingItem[];
  const tags = product.packaging_tags || [];

  const isRecyclable = tags.some(tag => 
    tag.includes('recyclable') && !tag.includes('non-recyclable')
  );
  const isReusable = tags.some(tag => tag.includes('reusable'));
  const isBiodegradable = tags.some(tag => tag.includes('biodegradable'));

  // Calculate recyclability score (0-100)
  let recyclabilityScore = 0;
  
  if (isRecyclable) {
    recyclabilityScore += 50;
  }
  if (isReusable) {
    recyclabilityScore += 30;
  }
  if (isBiodegradable) {
    recyclabilityScore += 20;
  }

  // Check packaging materials for additional scoring
  const hasPlastic = packagings.some(p => p.material?.includes('plastic'));
  const hasCardboard = packagings.some(p => p.material?.includes('cardboard') || p.material?.includes('paper'));
  const hasGlass = packagings.some(p => p.material?.includes('glass'));
  const hasMetal = packagings.some(p => p.material?.includes('metal'));

  // Material-based scoring
  if (hasCardboard || hasGlass || hasMetal) {
    recyclabilityScore += 10; // These are generally more recyclable
  }
  if (hasPlastic && !isRecyclable) {
    recyclabilityScore = Math.max(0, recyclabilityScore - 20); // Penalty for non-recyclable plastic
  }

  return {
    items: packagings,
    isRecyclable,
    isReusable,
    isBiodegradable,
    recyclabilityScore: Math.min(100, recyclabilityScore),
  };
}

/**
 * Calculate Eco-Score grade from score (official Open Food Facts ranges)
 * A: 80-100, B: 70-79, C: 55-69, D: 40-54, E: 0-39
 */
function calculateGradeFromScore(score: number): 'a' | 'b' | 'c' | 'd' | 'e' | 'unknown' {
  if (score >= 80) return 'a';
  if (score >= 70) return 'b';
  if (score >= 55) return 'c';
  if (score >= 40) return 'd';
  if (score >= 0) return 'e';
  return 'unknown';
}

/**
 * Calculate Eco-Score if not provided (enhanced version)
 * If score is available but grade is missing, calculate grade from score
 */
export function calculateEcoScore(product: Product): Product['ecoscore_data'] {
  if (product.ecoscore_data) {
    // Ensure it's enhanced with all available data
    enhanceEcoScoreData(product);
    
    // If we have a score but no grade (or grade is 'unknown'), calculate grade from score
    if (product.ecoscore_data.score !== undefined && product.ecoscore_data.score > 0) {
      if (!product.ecoscore_data.grade || product.ecoscore_data.grade === 'unknown') {
        product.ecoscore_data.grade = calculateGradeFromScore(product.ecoscore_data.score);
      }
    }
    
    return product.ecoscore_data;
  }

  // If we have score and grade from product root level
  if (product.ecoscore_score !== undefined && product.ecoscore_score > 0) {
    // Use provided grade, or calculate from score if missing/unknown
    const grade = product.ecoscore_grade && product.ecoscore_grade !== 'unknown' 
      ? product.ecoscore_grade 
      : calculateGradeFromScore(product.ecoscore_score);
    
    return {
      score: product.ecoscore_score,
      grade: grade,
    };
  }

  // If no eco score, return unknown
  return {
    score: 0,
    grade: 'unknown',
  };
}

