// Open Food Facts API client
import { Product, PalmOilAnalysis, PackagingData, PackagingItem, AgribalyseData } from '../types/product';
import { logger } from '../utils/logger';
import { fetchWithRateLimit } from '../utils/timeoutHelper';
import { normalizeBarcode } from '../utils/barcodeNormalization';
import {
  ETHICS_ORGANIC_TAG_ALLOWLIST,
  collectOffLabelTagsForCertDisplay,
  evaluateOrganicMatchForCertDisplay,
} from './ethicsCertificationsService';
import { ORGANIC_LABEL_TEXT_CLAIM_TAG, ORGANIC_PRODUCT_NAME_CLAIM_TAG } from '../constants/certDisplay';
import { applyResolvedNutrientLevels } from '../utils/resolveNutrientLevels';
import { markNova1ProvenanceOff } from '../utils/nova1Provenance';
import {
  backoffDelayMs,
  classifyFetchException,
  classifyHttpStatus,
  OFF_MAX_TRANSIENT_ATTEMPTS,
  type OffFetchResult,
  type OffRetrievalFailureReason,
  type OffVariantAttemptOutcome,
} from './offRetrievalOutcome';

export type { OffFetchResult, OffRetrievalFailureReason } from './offRetrievalOutcome';

export { ORGANIC_LABEL_TEXT_CLAIM_TAG, ORGANIC_PRODUCT_NAME_CLAIM_TAG };

const OFF_API_BASE = 'https://world.openfoodfacts.org/api/v2/product';
const USER_AGENT = 'Rveel/1.0.0';

export interface OFFResponse {
  status: number;
  status_verbose: string;
  product?: Product;
  code?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Single OFF World request — no nested retries (recovery is orchestrated in fetchProductFromOFF).
 */
async function fetchProductFromOFFInstanceOnce(
  barcode: string,
  instance: string
): Promise<OffVariantAttemptOutcome> {
  try {
    const url = `https://${instance}/api/v2/product/${barcode}.json`;

    const response = await fetchWithRateLimit(
      url,
      {
        headers: {
          'User-Agent': USER_AGENT,
        },
      },
      'openfoodfacts',
      'best_effort'
    );

    if (!response.ok) {
      const classified = classifyHttpStatus(response.status);
      if (classified === 'not_found') {
        return { kind: 'not_found' };
      }
      if (response.status !== 404) {
        logger.debug(`OFF API error (${instance}): ${response.status} ${response.statusText}`);
      }
      return { kind: 'transient', reason: classified };
    }

    let data: OFFResponse;
    try {
      data = await response.json();
    } catch {
      return { kind: 'transient', reason: 'malformed_response_exhausted' };
    }

    if (!data.product) {
      return { kind: 'not_found' };
    }

    if (data.status === 0) {
      logger.debug(
        `OFF API returned status: 0 but product data exists for ${barcode} (accepting product - Yuka-compatible behavior)`
      );
    }

    const product: Product = {
      ...data.product,
      barcode,
      source: 'openfoodfacts',
    };

    // Affirmative external NOVA 1 from OFF — durable Highlight-eligible provenance.
    if (product.nova_group === 1) {
      markNova1ProvenanceOff(product);
    }

    enhanceProductWithSustainabilityData(product);
    applyResolvedNutrientLevels(product);

    return { kind: 'hit', product };
  } catch (error) {
    logger.debug(`Error fetching from ${instance}:`, error);
    return { kind: 'transient', reason: classifyFetchException(error) };
  }
}

/**
 * Fetch product data from Open Food Facts canonical World API by exact GTIN.
 * Wave 2: Country/regional hosts are not alternative factual product sources —
 * world.openfoodfacts.org is the sole governed OFF retrieval endpoint.
 *
 * Transient failures retry up to OFF_MAX_TRANSIENT_ATTEMPTS total (including initial).
 * Authoritative 404 on a variant proceeds to the next variant without consuming retry budget.
 */
export async function fetchProductFromOFF(barcode: string): Promise<OffFetchResult> {
  const barcodeVariants = normalizeBarcode(barcode);
  const uniqueVariants = Array.from(new Set(barcodeVariants));

  logger.debug(
    `Trying ${uniqueVariants.length} barcode variants for OFF World query: ${uniqueVariants.join(', ')}`
  );

  let transientAttempts = 0;
  let lastTransientReason: OffRetrievalFailureReason = 'retrieval_other';
  let variantIndex = 0;

  while (variantIndex < uniqueVariants.length) {
    const variant = uniqueVariants[variantIndex];
    const outcome = await fetchProductFromOFFInstanceOnce(variant, 'world.openfoodfacts.org');

    if (outcome.kind === 'hit') {
      logger.debug(
        `Found product in OFF (world.openfoodfacts.org) with variant ${variant}: ${barcode}`
      );
      return { kind: 'hit', product: outcome.product };
    }

    if (outcome.kind === 'not_found') {
      variantIndex += 1;
      continue;
    }

    lastTransientReason = outcome.reason;
    transientAttempts += 1;
    logger.debug(
      `OFF transient failure for ${variant} (${lastTransientReason}) attempt ${transientAttempts}/${OFF_MAX_TRANSIENT_ATTEMPTS}`
    );

    if (transientAttempts >= OFF_MAX_TRANSIENT_ATTEMPTS) {
      logger.warn(
        `OFF retrieval exhausted for ${barcode} after ${transientAttempts} transient attempt(s): ${lastTransientReason}`
      );
      return { kind: 'retrieval_error', reason: lastTransientReason };
    }

    await sleep(backoffDelayMs(transientAttempts - 1));
  }

  logger.debug(`Product not found in OFF World for any barcode variant: ${barcode}`);
  return { kind: 'not_found' };
}

/** Convenience for callers that only need a product or null (non-production diagnostic paths). */
export async function fetchProductFromOFFOrNull(barcode: string): Promise<Product | null> {
  const result = await fetchProductFromOFF(barcode);
  return result.kind === 'hit' ? result.product : null;
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

const CERTIFICATION_DISPLAY_MAP: Record<string, { name: string; icon_url?: string; description?: string }> = {
  // Organic family — aligned with ETHICS_ORGANIC_TAG_ALLOWLIST / ethics scoring
  'en:organic': {
    name: 'Organic',
    description: 'Organic (generic OFF label)',
  },
  'en:aco-certified-organic': {
    name: 'ACO Certified Organic',
    description: 'Australian Certified Organic (ACO)',
  },
  'en:australian-certified-organic': {
    name: 'Australian Certified Organic',
    description: 'Australian certified organic',
  },
  'en:eu-organic': {
    name: 'EU Organic',
    description: 'EU organic certification',
  },
  'en:european-organic': {
    name: 'European Organic',
    description: 'European organic',
  },
  'en:usda-organic': {
    name: 'USDA Organic',
    description: 'USDA organic',
  },
  'en:soil-association-organic': {
    name: 'Soil Association Organic',
    description: 'Soil Association organic',
  },
  'en:organic-food-chain': {
    name: 'Organic Food Chain',
    description: 'Organic Food Chain',
  },
  'en:demeter': {
    name: 'Demeter',
    description: 'Demeter biodynamic',
  },
  'en:biodynamic': {
    name: 'Biodynamic',
    description: 'Biodynamic agriculture',
  },
  'en:biodynamic-agriculture': {
    name: 'Biodynamic Agriculture',
    description: 'Biodynamic agriculture',
  },
  'en:naturland': {
    name: 'Naturland',
    description: 'Naturland organic',
  },
  'en:ccof-certified-organic': {
    name: 'CCOF Certified Organic',
    description: 'CCOF certified organic',
  },
  'en:canada-organic': {
    name: 'Canada Organic',
    description: 'Canada organic',
  },
  'en:bioland': {
    name: 'Bioland',
    description: 'Bioland organic association',
  },
  'en:biokreis': {
    name: 'Biokreis',
    description: 'Biokreis organic',
  },
  'en:danish-state-controlled-organic': {
    name: 'Danish State-Controlled Organic',
    description: 'Danish state-controlled organic',
  },
  'en:luomu-controlled-organic-production': {
    name: 'Luomu Controlled Organic',
    description: 'Luomu controlled organic production',
  },
  'en:finnish-organic-association': {
    name: 'Finnish Organic Association',
    description: 'Finnish organic association',
  },
  'en:tun-certified-organic': {
    name: 'TUN Certified Organic',
    description: 'TUN certified organic',
  },
  'en:debio-organic': {
    name: 'Debio Organic',
    description: 'Debio organic',
  },
  'en:southern-cross-certified': {
    name: 'Southern Cross Certified',
    description: 'Southern Cross certified',
  },
  'en:southern-cross-organic': {
    name: 'Southern Cross Organic',
    description: 'Southern Cross organic',
  },
  'en:acos-organic': {
    name: 'ACOS Organic',
    description: 'Legacy OFF organic tag (ACOS)',
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

/**
 * Format certifications from OFF labels (tags + hierarchy union), plus display-only organic claims when MVP ethics
 * matches organic via product name or label/cert text but there is no matching OFF tag in the union.
 */
export function formatCertifications(product: Product): Product['certifications'] {
  const union = collectOffLabelTagsForCertDisplay(product);

  const certifications: NonNullable<Product['certifications']> = [];
  let organicBadgeAdded = false;

  for (const tag of union) {
    const meta = CERTIFICATION_DISPLAY_MAP[tag];
    if (!meta) continue;

    const isOrganicFamily = ETHICS_ORGANIC_TAG_ALLOWLIST.has(tag);
    if (isOrganicFamily) {
      if (organicBadgeAdded) continue;
      organicBadgeAdded = true;
    }

    certifications.push({
      id: tag,
      name: meta.name,
      tag,
      icon_url: meta.icon_url,
      description: meta.description,
    });
  }

  const organicUi = evaluateOrganicMatchForCertDisplay(product);
  if (organicUi.matched && !organicBadgeAdded) {
    if (organicUi.source === 'product_name') {
      certifications.push({
        id: ORGANIC_PRODUCT_NAME_CLAIM_TAG,
        tag: ORGANIC_PRODUCT_NAME_CLAIM_TAG,
        name: 'Organic',
        description: 'Organic claim detected in product name',
      });
    } else if (organicUi.source === 'label_or_cert_text') {
      certifications.push({
        id: ORGANIC_LABEL_TEXT_CLAIM_TAG,
        tag: ORGANIC_LABEL_TEXT_CLAIM_TAG,
        name: 'Organic',
        description: 'Organic claim detected in label or certification text',
      });
    }
  }

  return certifications.length > 0 ? certifications : undefined;
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

  // Extract palm oil analysis - always create if we have ingredients data
  // This ensures consistency with user alert insights (which checks ingredients_text)
  if (product.ingredients_analysis_tags || product.ingredients_analysis || product.ingredients_text) {
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
  const ingredientsText = (product.ingredients_text || '').toLowerCase();

  // Check OFF structured data first (most reliable)
  let containsPalmOil = 
    tags.includes('en:palm-oil') || 
    analysis['en:palm-oil'] === 'yes' ||
    analysis['en:palm-oil'] === 'maybe';

  let isPalmOilFree = 
    tags.includes('en:palm-oil-free') || 
    analysis['en:palm-oil'] === 'no';

  let isNonSustainable = 
    tags.includes('en:non-sustainable-palm-oil');

  // Track if detection came from ingredients_text (for transparency)
  let detectedFromIngredientsText = false;
  
  // Fallback: Always check ingredients_text if OFF data doesn't explicitly say palm-oil-free
  // This ensures consistency with user alert insight detection
  // Only skip if OFF explicitly says it's palm-oil-free (trust OFF certification)
  if (!isPalmOilFree && ingredientsText) {
    // COMPREHENSIVE PALM OIL DETECTION
    // Suppliers often hide palm oil under alternative names to avoid negative perception
    // We check for ALL known variations and derivatives
    
    // Direct palm oil names (explicit)
    const palmOilDirectPattern = /\bpalm\s+oil\b/i;
    const palmOilVariations = /\b(palmolein|palm\s+fat|palm\s+kernel\s+oil|palm\s+stearin|palm\s+olein|palm\s+fruit\s+oil)\b/i;
    
    // Chemical derivatives (palm oil derivatives)
    const palmDerivativesPattern = /\b(palmate|palmitate|palmityl|palmitic\s+acid|stearic\s+acid|glyceryl\s+stearate)\b/i;
    
    // Scientific name
    const palmScientificPattern = /\belaeis\s+guineensis\b/i;
    
    // Sodium-based derivatives (common in soaps/detergents)
    const palmSodiumPattern = /\b(sodium\s+lauryl\s+sulfate|sodium\s+kernelate|sodium\s+palm\s+kernelate)\b/i;
    
    // Generic vegetable oil/fat (WARNING: This is a weak indicator - many products use other vegetable oils)
    // We only flag this if combined with other indicators or if explicitly suspicious
    // NOTE: We're NOT flagging generic "vegetable oil" alone as it's too broad and would cause false positives
    
    // Palm-oil-free explicit statement (highest priority - trust this)
    const palmOilFreePattern = /\bpalm[-\s]?oil[-\s]?free\b/i;
    
    if (palmOilFreePattern.test(ingredientsText)) {
      // Explicitly marked as palm-oil-free in ingredients
      isPalmOilFree = true;
      containsPalmOil = false;
      detectedFromIngredientsText = true;
    } else if (
      palmOilDirectPattern.test(ingredientsText) || 
      palmOilVariations.test(ingredientsText) ||
      palmDerivativesPattern.test(ingredientsText) ||
      palmScientificPattern.test(ingredientsText) ||
      palmSodiumPattern.test(ingredientsText)
    ) {
      // Contains palm oil or palm oil derivatives in ingredients
      // Override OFF data if OFF didn't detect it (OFF might have incomplete data)
      containsPalmOil = true;
      detectedFromIngredientsText = true;
      // Note: We don't set isNonSustainable = true here because we can't determine
      // sustainability from ingredients text alone - it requires certification data
    }
  }

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
    detectedFromIngredientsText,
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

