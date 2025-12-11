/**
 * Planet Pillar Calculation
 * 
 * Base Score: 15/25
 * Adjustments:
 * - Eco-Score: A=+10, B=+5, C=0, D=-5, E=-10 (from base 15)
 * - Eco-Score CSV fallback: High carbon = -5 if OFF missing
 * - Palm oil: -8 (non-certified), 0 (RSPO certified), -5 (brand/parent low WWF/RSPO overlay)
 * - Recyclable packaging: +5 (all) or +2 (some)
 * - Packaging eco-cost: -5 (high eco-cost materials)
 * - Non-Animal Farming: -5 (high-impact), +3 (low-impact), -3 (brand/parent high-impact overlay)
 * 
 * Final: Capped at 0-25 (minimum floor: 0)
 */

import { Product } from '../../../types/product';
import { getLocalRecyclabilityStatus } from '../../../utils/packagingRecyclability';
import { logger } from '../../../utils/logger';
import { getCSVDatabaseService } from '../../../services/csvDatabases/csvDatabaseService';

export interface PlanetPillarResult {
  score: number;
  base: number;
  adjustments: Array<{
    description: string;
    value: number;
    type: 'positive' | 'negative' | 'neutral';
  }>;
  details: {
    hasEcoScore: boolean;
    ecoscoreGrade?: string;
    ecoscoreValue?: number;
    palmOilPenalty: number;
    recyclableBonus: number;
    packagingEcoCostPenalty: number;
    farmingImpactAdjustment: number;
    brandOverlayPenalty: number;
  };
}

/**
 * Extract brand/parent company name from product
 */
function extractBrandOrParent(product: Product): string | null {
  // Priority: brand_owner > brands > first brand from brands_tags
  if (product.brand_owner) {
    return product.brand_owner;
  }
  
  if (product.brands) {
    // brands is often comma-separated, take first
    const firstBrand = product.brands.split(',')[0].trim();
    if (firstBrand) return firstBrand;
  }
  
  // Try to extract from brands_tags if available
  // Note: brands_tags might not exist in Product interface, but check anyway
  const brandsTags = (product as any).brands_tags;
  if (Array.isArray(brandsTags) && brandsTags.length > 0) {
    const firstTag = String(brandsTags[0]).replace(/^en:/, '').replace(/-/g, ' ');
    if (firstTag) return firstTag;
  }
  
  return null;
}

/**
 * Extract crop names from ingredients_text
 * More reliable than origins_tags (which contains country codes, not crop names)
 * 
 * Strategy:
 * 1. Search for known crop names from our databases
 * 2. Use word boundaries to avoid false matches
 * 3. Normalize to singular form for database lookup
 */
function extractCropsFromIngredients(ingredientsText: string): string[] {
  const crops: string[] = [];
  if (!ingredientsText || ingredientsText.trim().length === 0) return crops;
  
  // Known crop names to search for (from our databases - EWG, FAO, USDA)
  // Organized by category for maintainability
  const knownCrops = [
    // Grains & Cereals
    'rice', 'wheat', 'corn', 'maize', 'soy', 'soybean', 'soybeans', 'barley', 'oats', 'oat', 
    'rye', 'quinoa', 'millet', 'sorghum',
    // Fruits (Dirty Dozen candidates)
    'strawberries', 'strawberry', 'apple', 'apples', 'peach', 'peaches', 'pear', 'pears', 
    'nectarine', 'nectarines', 'cherry', 'cherries', 'blueberries', 'blueberry', 'grapes', 'grape',
    // Vegetables (Dirty Dozen candidates)
    'spinach', 'kale', 'lettuce', 'tomato', 'tomatoes', 'potato', 'potatoes', 
    'carrot', 'carrots', 'onion', 'onions', 'pepper', 'peppers', 'bell pepper', 'bell peppers',
    'hot pepper', 'hot peppers', 'green beans', 'snap peas', 'celery',
    // Nuts & Seeds (high water usage)
    'almond', 'almonds', 'walnut', 'walnuts', 'pistachio', 'pistachios', 'avocado', 'avocados',
    // Beverages & High-Impact Crops
    'coffee', 'cocoa', 'chocolate', 'tea', 'sugar', 'sugar cane', 'sugarcane', 'cotton',
    // Legumes
    'beans', 'bean', 'lentils', 'lentil', 'chickpeas', 'chickpea',
  ];
  
  const textLower = ingredientsText.toLowerCase();
  const foundCrops = new Set<string>(); // Use Set to avoid duplicates
  
  knownCrops.forEach(crop => {
    // Escape special regex characters in crop name
    const escaped = crop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Use word boundaries to avoid false matches
    // Example: "tomato" matches "tomato" but not "tomatoes" (unless we include both)
    const pattern = new RegExp(`\\b${escaped}\\b`, 'i');
    if (pattern.test(textLower)) {
      // Normalize to singular form for database lookup
      // Keep both singular and plural in database, but normalize here
      let normalized = crop.toLowerCase();
      // Remove trailing 's' for plural forms, but keep if it's part of the word
      if (normalized.endsWith('s') && normalized.length > 3) {
        // Check if removing 's' gives us a valid crop name
        const singular = normalized.slice(0, -1);
        if (knownCrops.some(c => c.toLowerCase() === singular)) {
          normalized = singular;
        }
      }
      foundCrops.add(normalized);
    }
  });
  
  return Array.from(foundCrops);
}

/**
 * Extract crop names from categories_tags
 * Fallback method when ingredients_text is not available
 */
function extractCropsFromCategories(categories: string[]): string[] {
  const crops: string[] = [];
  
  // Map category patterns to crops
  const categoryToCrop: Record<string, string[]> = {
    'strawberr': ['strawberries'],
    'spinach': ['spinach'],
    'kale': ['kale'],
    'tomato': ['tomatoes'],
    'potato': ['potatoes'],
    'rice': ['rice'],
    'wheat': ['wheat'],
    'corn': ['corn'],
    'coffee': ['coffee'],
    'cocoa': ['cocoa'],
    'almond': ['almonds'],
  };
  
  categories.forEach(category => {
    Object.entries(categoryToCrop).forEach(([pattern, cropNames]) => {
      if (category.includes(pattern)) {
        crops.push(...cropNames);
      }
    });
  });
  
  return [...new Set(crops)]; // Deduplicate
}

/**
 * Calculate Planet Pillar score
 * Always starts at base 15, then applies adjustments
 */
export function calculatePlanetPillar(product: Product): PlanetPillarResult {
  const adjustments: PlanetPillarResult['adjustments'] = [];
  let score = 15; // Base score (always 15)
  const base = 15;
  
  const hasEcoScore = !!product.ecoscore_grade;
  const analysisTags = (product.ingredients_analysis_tags || []).filter((tag: unknown) => 
    typeof tag === 'string'
  ) as string[];
  const labels = (product.labels_tags || []).map((l: unknown) => 
    typeof l === 'string' ? l.toLowerCase() : ''
  ).filter(Boolean) as string[];
  const packagings = product.packagings || [];
  const originsTags = (product.origins_tags || []).filter((tag: unknown) => 
    typeof tag === 'string'
  ) as string[];
  
  // Get CSV database service (may not be initialized, handle gracefully)
  let csvService: ReturnType<typeof getCSVDatabaseService> | null = null;
  try {
    csvService = getCSVDatabaseService();
  } catch (error) {
    logger.debug('[PlanetPillar] CSV service not available, continuing without CSV lookups');
  }
  
  // Eco-Score adjustment (from base 15)
  let ecoscoreValue: number | undefined;
  if (hasEcoScore) {
    const es = product.ecoscore_grade?.toLowerCase();
    if (es) {
      const gradeMapping: Record<string, number> = { a: 25, b: 20, c: 15, d: 10, e: 5 };
      ecoscoreValue = gradeMapping[es] || 15;
      const adjustment = ecoscoreValue - 15; // Adjustment from base 15
      
      if (adjustment > 0) {
        adjustments.push({
          description: `Eco-Score Grade ${es.toUpperCase()} (excellent environmental impact)`,
          value: adjustment,
          type: 'positive',
        });
        score += adjustment;
      } else if (adjustment < 0) {
        adjustments.push({
          description: `Eco-Score Grade ${es.toUpperCase()} (poor environmental impact)`,
          value: adjustment,
          type: 'negative',
        });
        score += adjustment; // adjustment is already negative
      } else {
        adjustments.push({
          description: `Eco-Score Grade ${es.toUpperCase()} (average environmental impact)`,
          value: 0,
          type: 'neutral',
        });
      }
      
      logger.debug(`[PlanetPillar] Eco-Score grade "${es.toUpperCase()}" adjustment: ${adjustment} (from base 15)`);
    } else {
      logger.warn('[PlanetPillar] Eco-Score grade is empty/null, using baseline 15');
    }
  } else {
    // NEW: Eco-Score CSV fallback (high carbon = -5 if OFF missing)
    if (csvService) {
      try {
        // Try to determine product category for carbon lookup
        const categories = (product.categories || '').toLowerCase();
        const categoryName = categories.split(',')[0]?.trim() || 'unknown';
        
        if (csvService.hasHighCarbonFootprint(categoryName)) {
          const fallbackAdjustment = -5;
          adjustments.push({
            description: 'High carbon footprint (CSV fallback, Eco-Score unavailable)',
            value: fallbackAdjustment,
            type: 'negative',
          });
          score += fallbackAdjustment;
          logger.debug(`[PlanetPillar] Applied CSV carbon fallback: -5 for category "${categoryName}"`);
        }
      } catch (error) {
        logger.debug('[PlanetPillar] Error checking CSV carbon fallback:', error);
      }
    }
    
    adjustments.push({
      description: 'No Eco-Score available (baseline)',
      value: 0,
      type: 'neutral',
    });
    logger.debug('[PlanetPillar] No Eco-Score available, using baseline 15');
  }
  
  // Palm oil penalty (UPDATED per new spec)
  let palmOilPenalty = 0;
  if (product.palm_oil_analysis) {
    const { containsPalmOil, isPalmOilFree, isCertifiedSustainable } = product.palm_oil_analysis;
    if (containsPalmOil && !isPalmOilFree) {
      // NEW SPEC: RSPO certified = 0 (neutral), not -5
      if (isCertifiedSustainable) {
        // Check if RSPO certified via CSV service
        const brandName = extractBrandOrParent(product);
        const isRSPOCertified = brandName && csvService?.isRSPOCertified(brandName);
        
        if (isRSPOCertified) {
          palmOilPenalty = 0; // NEW: RSPO certified = 0 (neutral)
          adjustments.push({
            description: 'Contains palm oil (RSPO certified - neutral)',
            value: 0,
            type: 'neutral',
          });
          // No score adjustment (0 penalty)
        } else {
          palmOilPenalty = 5; // Certified sustainable but not RSPO = -5
          adjustments.push({
            description: 'Contains palm oil (certified sustainable)',
            value: -palmOilPenalty,
            type: 'negative',
          });
          score -= palmOilPenalty;
        }
      } else {
        palmOilPenalty = 8; // Non-certified = -8
        adjustments.push({
          description: 'Contains palm oil (non-certified)',
          value: -palmOilPenalty,
          type: 'negative',
        });
        score -= palmOilPenalty;
      }
    }
  } else {
    // Fallback: Check tags if palm_oil_analysis doesn't exist
    const hasPalm = analysisTags.some((t: string) => t.toLowerCase().includes('palm'));
    const palmFree = [...analysisTags, ...labels].some((t: string) =>
      t.toLowerCase().includes('palm-oil-free')
    );
    if (hasPalm && !palmFree) {
      palmOilPenalty = 8;
      adjustments.push({
        description: 'Contains palm oil (non-certified, detected from tags)',
        value: -palmOilPenalty,
        type: 'negative',
      });
      score -= palmOilPenalty;
    }
  }
  
  // NEW: Brand/parent overlay penalty for palm oil (accountability)
  // -5 penalty for brand/parent with low WWF/RSPO score, even on clean products
  let brandOverlayPenalty = 0;
  if (csvService) {
    try {
      const brandName = extractBrandOrParent(product);
      if (brandName) {
        // Check if brand has low WWF/RSPO commitment
        const rspoData = csvService.queryRSPOCertified(brandName);
        if (rspoData) {
          const commitment = String(rspoData.commitment || '').toLowerCase();
          if (commitment === 'low' || commitment === 'none') {
            brandOverlayPenalty = 5;
            adjustments.push({
              description: `Brand/parent low WWF/RSPO commitment: ${brandName} (accountability penalty)`,
              value: -brandOverlayPenalty,
              type: 'negative',
            });
            score -= brandOverlayPenalty;
          }
        }
      }
    } catch (error) {
      logger.debug('[PlanetPillar] Error checking brand overlay:', error);
    }
  }
  
  // Recyclable packaging bonus
  let recyclableBonus = 0;
  if (packagings.length > 0) {
    const recyclabilityStatus = getLocalRecyclabilityStatus(packagings);
    
    if (recyclabilityStatus.isRecyclable) {
      if (recyclabilityStatus.recyclableItems.length === packagings.length) {
        recyclableBonus = 5;
        adjustments.push({
          description: 'All packaging recyclable (meets local requirements)',
          value: recyclableBonus,
          type: 'positive',
        });
        score += recyclableBonus;
      } else if (recyclabilityStatus.recyclableItems.length > 0) {
        recyclableBonus = 2;
        adjustments.push({
          description: 'Some packaging recyclable (meets local requirements)',
          value: recyclableBonus,
          type: 'positive',
        });
        score += recyclableBonus;
      }
    }
  }
  
  // NEW: Packaging eco-cost penalty (-5 for high eco-cost materials)
  let packagingEcoCostPenalty = 0;
  if (csvService && packagings.length > 0) {
    try {
      for (const packaging of packagings) {
        const material = packaging.material || '';
        if (csvService.isHighEcoCostMaterial(material)) {
          packagingEcoCostPenalty = 5; // Apply once if any high eco-cost material found
          adjustments.push({
            description: `High eco-cost packaging material: ${material}`,
            value: -packagingEcoCostPenalty,
            type: 'negative',
          });
          score -= packagingEcoCostPenalty;
          break; // Only apply once
        }
      }
    } catch (error) {
      logger.debug('[PlanetPillar] Error checking packaging eco-cost:', error);
    }
  }
  
  // NEW: Non-Animal Farming factor
  // High-water/carbon/land/crop treatment (pesticides/herbicides residue): -5
  // Low-impact: +3
  // Brand/parent high-impact: -3 overlay (accountability)
  // 
  // IMPORTANT: origins_tags contains COUNTRY CODES, not crop names
  // We need to extract crops from ingredients_text instead
  let farmingImpactAdjustment = 0;
  if (csvService) {
    try {
      // Extract crops from ingredients_text (more reliable than origins_tags)
      const ingredientsText = (product.ingredients_text || '').toLowerCase();
      const crops = extractCropsFromIngredients(ingredientsText);
      
      // Also try categories_tags as fallback
      const categories = (product.categories_tags || []).map(c => String(c).toLowerCase());
      const categoryCrops = extractCropsFromCategories(categories);
      const allCrops = [...new Set([...crops, ...categoryCrops])]; // Deduplicate
      
      let hasHighImpact = false;
      let hasLowImpact = false;
      let verifiedCrops: string[] = [];
      
      // Only check crops that we can verify in our databases
      for (const crop of allCrops) {
        // Verify crop exists in at least one database
        const inFAO = csvService.queryFAOCropData(crop) !== null;
        const inEWG = csvService.queryEWGDirtyDozen(crop) !== null;
        const inUSDA = csvService.queryUSDAPDP(crop) !== null;
        
        if (inFAO || inEWG || inUSDA) {
          verifiedCrops.push(crop);
          if (csvService.hasHighFarmingImpact(crop)) {
            hasHighImpact = true;
            break; // One high-impact crop is enough
          }
        }
      }
      
      // Only apply adjustments if we have VERIFIED crops
      // Unknown crops = no penalty (conservative approach)
      if (verifiedCrops.length > 0) {
        if (hasHighImpact) {
          farmingImpactAdjustment = -5;
          adjustments.push({
            description: `High-impact farming detected: ${verifiedCrops.join(', ')}`,
            value: farmingImpactAdjustment,
            type: 'negative',
          });
          score += farmingImpactAdjustment;
          
          // Brand/parent high-impact overlay (-3)
          const brandName = extractBrandOrParent(product);
          if (brandName) {
            const brandOverlay = -3;
            adjustments.push({
              description: `Brand/parent high-impact farming: ${brandName} (accountability)`,
              value: brandOverlay,
              type: 'negative',
            });
            score += brandOverlay;
          }
        } else {
          // All verified crops are low-impact
          farmingImpactAdjustment = 3;
          adjustments.push({
            description: `Low-impact farming practices: ${verifiedCrops.join(', ')}`,
            value: farmingImpactAdjustment,
            type: 'positive',
          });
          score += farmingImpactAdjustment;
        }
      }
      // If no verified crops found, don't apply any adjustment (unknown = neutral)
    } catch (error) {
      logger.debug('[PlanetPillar] Error checking farming impact:', error);
    }
  }
  
  // Cap at 0-25 (minimum floor: 0)
  score = Math.max(0, Math.min(25, Math.round(score)));
  
  return {
    score,
    base,
    adjustments,
    details: {
      hasEcoScore,
      ecoscoreGrade: product.ecoscore_grade,
      ecoscoreValue,
      palmOilPenalty,
      recyclableBonus,
      packagingEcoCostPenalty,
      farmingImpactAdjustment,
      brandOverlayPenalty,
    },
  };
}
