/**
 * Open Pillar Calculation
 * 
 * Base Score: 15/25
 * Adjustments:
 * - Ingredients disclosure: Full (>100 chars)=+0 (stays 15), Partial (50-100 chars)=-5, Minimal (<50 chars)=-5, None=-5
 * - Hidden terms: 1=-5, 2=-10, ≥3=-15 (cap -20)
 * - NOVA amplification: +1 to hidden count if NOVA≥3 & disclosure partial/none
 * - Zero hidden rewards: +5 (zero hidden + NOVA 1-2) OR +2 (zero hidden but not NOVA 1-2)
 * - Origin: No origin=-8
 * - Brand ownership: Hidden/opaque parent=-3
 * 
 * Final: Capped at 0-25
 */

import { Product } from '../../../types/product';
import { logger } from '../../../utils/logger';
import { getBrandData } from '../../../data/brandDatabase';
import { matchBrands, getBestBrandMatch } from '../../../services/brandMatchingService';
import { powershellLogger } from '../../../utils/powershellLogger';

const HIDDEN_TERMS = [
  'parfum',
  'fragrance',
  'aroma',
  'flavor',
  'flavour',
  'natural flavor',
  'natural flavour',
  'artificial flavor',
  'artificial flavour',
  'natural flavoring',
  'natural flavouring',
  'artificial flavoring',
  'artificial flavouring',
  'proprietary',
  'proprietary blend',
  'secret formula',
  'essence',
  'spice',
  'extract',
];

export interface OpenPillarResult {
  score: number;
  base: number;
  adjustments: Array<{
    description: string;
    value: number;
    type: 'positive' | 'negative' | 'neutral';
  }>;
  details: {
    ingredientsScore: number;
    ingredientsLength: number;
    hiddenTermsPenalty: number;
    hiddenTermsCount: number;
    effectiveHiddenCount: number;
    sophisticationBonus: number;
    nutritionalInfoAdjustment: number;
    originPenalty: number;
    brandOwnershipPenalty: number;
  };
}

/**
 * Calculate Open Pillar score
 * Always starts at base 15, then applies adjustments
 */
export function calculateOpenPillar(product: Product): OpenPillarResult {
  const adjustments: OpenPillarResult['adjustments'] = [];
  let score = 15; // Base score (always 15)
  const base = 15;
  
  const ingredientsText = product.ingredients_text || '';
  const ingredientsLength = ingredientsText.trim().length;
  
  // Helper: word boundary matching
  const hasTerm = (term: string): boolean => {
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    return regex.test(ingredientsText.toLowerCase());
  };
  
  // Base score note
  adjustments.push({
    description: 'Base score (assumes transparent until hidden)',
    value: 0,
    type: 'neutral',
  });
  
  // Ingredients disclosure adjustment
  // NEW SPEC: Present=+2, none=-3 (simplified binary check)
  let ingredientsScore = 0;
  if (!ingredientsText || ingredientsLength === 0) {
    ingredientsScore = -3;
    adjustments.push({
      description: 'No ingredients listed',
      value: ingredientsScore,
      type: 'negative',
    });
    score += ingredientsScore; // Already negative
  } else {
    // Check for placeholder
    const isPlaceholder = /^(product|item|n\/a|not available|unknown|missing|no ingredients|ingredients not listed)/i.test(
      ingredientsText.trim()
    );
    if (isPlaceholder) {
      ingredientsScore = -3;
      adjustments.push({
        description: 'Ingredients placeholder text (not real ingredients)',
        value: ingredientsScore,
        type: 'negative',
      });
      score += ingredientsScore; // Already negative
    } else {
      // Present = +2 bonus
      ingredientsScore = 2;
        adjustments.push({
        description: 'Ingredients disclosure present',
          value: ingredientsScore,
        type: 'positive',
        });
      score += ingredientsScore;
    }
  }
  
  // Hidden terms penalty (includes fragrance - merged into main list)
  // SPEC per document: 1=-2, 2=-6, >=3=-11; if NOVA>=3 add +1 to count; zero hidden & NOVA1-2 = +4; zero hidden & NOVA3-4 = +2
  const hiddenCount = HIDDEN_TERMS.filter((t) => hasTerm(t)).length;
  
  // NOVA amplification: +1 count if NOVA≥3
  let effectiveHiddenCount = hiddenCount;
  if (product.nova_group !== undefined && product.nova_group >= 3) {
      effectiveHiddenCount += 1;
  }
  
  // Apply penalty based on effective count (per document spec: 1=-2, 2=-6, >=3=-11)
  let hiddenTermsPenalty = 0;
  if (effectiveHiddenCount >= 3) {
    hiddenTermsPenalty = 11; // -11
  } else if (effectiveHiddenCount === 2) {
    hiddenTermsPenalty = 6; // -6 (per document spec)
  } else if (effectiveHiddenCount === 1) {
    hiddenTermsPenalty = 2; // -2 (per document spec)
  }
  
  if (hiddenTermsPenalty > 0) {
    const description = effectiveHiddenCount > hiddenCount
      ? `${effectiveHiddenCount} hidden ingredient term(s) (${hiddenCount} detected + NOVA amplification)`
      : `${effectiveHiddenCount} hidden ingredient term(s)`;
    adjustments.push({
      description,
      value: -hiddenTermsPenalty,
      type: 'negative',
    });
    score -= hiddenTermsPenalty;
  }
  
  // Zero hidden rewards: +4 for NOVA 1-2, +2 for NOVA 3-4
  let sophisticationBonus = 0;
  if (hiddenCount === 0) {
    const nova = product.nova_group;
    if (nova === 1 || nova === 2) {
      sophisticationBonus = 4; // +4 for zero hidden + NOVA 1-2
      adjustments.push({
        description: 'Sophistication bonus (zero hidden ingredients + NOVA 1-2)',
        value: sophisticationBonus,
        type: 'positive',
      });
      score += sophisticationBonus;
    } else {
      sophisticationBonus = 2; // +2 for zero hidden but NOVA 3-4
      adjustments.push({
        description: 'Transparency bonus (zero hidden ingredients + NOVA 3-4)',
        value: sophisticationBonus,
        type: 'positive',
      });
      score += sophisticationBonus;
    }
  }
  
  // NEW: Nutritional Information scoring
  // NEW SPEC: Complete (per 100g/serve benchmarks)=+3, partial=+1, none=-3
  let nutritionalInfoAdjustment = 0;
  const nutrients = product.nutriments || {};
  const hasNutrients = Object.keys(nutrients).length > 0;
  
  if (!hasNutrients) {
    nutritionalInfoAdjustment = -3;
    adjustments.push({
      description: 'No nutritional information disclosed',
      value: nutritionalInfoAdjustment,
      type: 'negative',
    });
    score += nutritionalInfoAdjustment; // Already negative
  } else {
    // Check if complete (has _100g keys and serving_size)
    const hasPer100g = Object.keys(nutrients).some(key => key.includes('_100g'));
    const hasServingSize = !!product.serving_size || !!nutrients.serving_size;
    const hasCompleteFormat = hasPer100g && hasServingSize;
    
    // Check for key nutrients (energy, fat, carbs, protein, salt, sugars)
    const keyNutrients = ['energy', 'fat', 'carbohydrates', 'proteins', 'salt', 'sugars'];
    const hasKeyNutrients = keyNutrients.some(nutrient => 
      Object.keys(nutrients).some(key => key.toLowerCase().includes(nutrient))
    );
    
    if (hasCompleteFormat && hasKeyNutrients) {
      nutritionalInfoAdjustment = 3; // Complete = +3
      adjustments.push({
        description: 'Complete nutritional information (per 100g/serve benchmarks)',
        value: nutritionalInfoAdjustment,
        type: 'positive',
      });
      score += nutritionalInfoAdjustment;
    } else if (hasKeyNutrients) {
      nutritionalInfoAdjustment = 1; // Partial = +1
      adjustments.push({
        description: 'Partial nutritional information disclosed',
        value: nutritionalInfoAdjustment,
        type: 'positive',
      });
      score += nutritionalInfoAdjustment;
    } else {
      // Has nutrients but incomplete - no adjustment (neutral)
      adjustments.push({
        description: 'Nutritional information present but incomplete',
        value: 0,
        type: 'neutral',
      });
    }
  }
  
  // Origin penalty/bonus
  // NEW SPEC: No origin=-4, complete=+4 bonus
  // Check all possible fields where origin/manufacturing info might be stored
  // This matches the logic in extractManufacturingCountry() to ensure consistency
  const hasOriginTags = Array.isArray(product.origins_tags) && product.origins_tags.length > 0;
  const hasManufacturingTags = Array.isArray(product.manufacturing_places_tags) && product.manufacturing_places_tags.length > 0;
  const hasOriginString = !!(product.origins && typeof product.origins === 'string' && product.origins.trim().length > 0);
  const hasManufacturingString = !!(product.manufacturing_places && typeof product.manufacturing_places === 'string' && product.manufacturing_places.trim().length > 0);
  
  // Also check text fields where "Product made in X" might appear
  // (e.g., product_name, generic_name, labels, labels_en)
  const textFields = [
    product.product_name,
    product.product_name_en,
    product.generic_name,
    product.labels,
    product.labels_en,
  ].filter(Boolean).join(' ').toLowerCase();
  
  // Pattern to match "Product of X", "Made in X", "Manufactured in X", etc.
  const originPattern = /(?:product\s+(?:of|made\s+in)|made\s+in|origin:|origin\s+of|manufactured\s+in)\s+([a-z\s]+?)(?:[,;]|\s*$)/i;
  const hasOriginInText = originPattern.test(textFields);
  
  const placeholderValues = ['unknown', 'n/a', 'not available', 'missing', 'not disclosed', 'not specified'];
  const originArrayValues = [
    ...(Array.isArray(product.origins_tags) ? product.origins_tags.map(v => String(v).toLowerCase()) : []),
    ...(Array.isArray(product.manufacturing_places_tags) ? product.manufacturing_places_tags.map(v => String(v).toLowerCase()) : []),
  ];
  const originString = (product.origins || product.manufacturing_places || '').toString().toLowerCase();
  const allOriginValues = [...originArrayValues, originString, textFields].join(' ');
  
  // Has origin if found in any field (tags, strings, or text fields)
  const hasOrigin: boolean = hasOriginTags || hasManufacturingTags || hasOriginString || hasManufacturingString || hasOriginInText;
  
  // Check if origin is complete (has both tags and string, or multiple tags)
  const isOriginComplete = (hasOriginTags && hasOriginString) || 
                          (hasOriginTags && product.origins_tags && product.origins_tags.length > 1) ||
                          (hasManufacturingTags && hasManufacturingString);
  
  let originAdjustment = 0;
  if (!hasOrigin) {
    originAdjustment = -4; // No origin = -4
    adjustments.push({
      description: 'No origin information',
      value: originAdjustment,
      type: 'negative',
    });
    score += originAdjustment; // Already negative
  } else {
    // Check for placeholder values
    if (placeholderValues.some(placeholder => allOriginValues.includes(placeholder))) {
      originAdjustment = -4; // Placeholder = -4 (same as no origin)
      adjustments.push({
        description: 'Origin information is placeholder text (not real origin)',
        value: originAdjustment,
        type: 'negative',
      });
      score += originAdjustment; // Already negative
    } else if (isOriginComplete) {
      originAdjustment = 4; // Complete origin = +4 bonus
      adjustments.push({
        description: 'Complete origin information disclosed',
        value: originAdjustment,
        type: 'positive',
      });
      score += originAdjustment;
    } else {
      // Origin found but not complete - no adjustment
      adjustments.push({
        description: 'Origin information available (partial)',
        value: 0,
        type: 'neutral',
      });
    }
  }
  
  // Brand ownership transparency check
  // Helper function to check if value is placeholder
  const isPlaceholderValue = (value: string): boolean => {
    const placeholderValues = ['unknown', 'n/a', 'not available', 'missing', 'not disclosed', 'not specified'];
    return placeholderValues.some(placeholder => value.toLowerCase().includes(placeholder));
  };
  
  // NEW SPEC: Hidden/opaque parent=-3
  let brandOwnershipPenalty = 0;
  const hasBrandOwner = !!(product.brand_owner && 
    !isPlaceholderValue(product.brand_owner));
  
  if (!hasBrandOwner) {
    // FUZZY MATCHING: Use fuzzy matching to find parent company
    const brandMatch = getBestBrandMatch(product, 0.75);
    const brandData = brandMatch?.matchedData || null;
    const hasParentInDatabase = !!(brandData?.parentCompany || brandMatch?.parentCompany);
    
    if (!hasParentInDatabase) {
      // Parent company is hidden/opaque - apply penalty
      brandOwnershipPenalty = 3; // Updated from -5 to -3
      adjustments.push({
        description: 'Hidden/opaque parent company',
        value: -brandOwnershipPenalty,
        type: 'negative',
      });
      score -= brandOwnershipPenalty;
    } else {
      // Parent found in database - no penalty
      adjustments.push({
        description: 'Parent company identified via brand database',
        value: 0,
        type: 'neutral',
      });
    }
  } else {
    // Brand owner disclosed - no penalty
    adjustments.push({
      description: 'Parent company disclosed',
      value: 0,
      type: 'neutral',
    });
  }
  
  // Cap at 0-25
  score = Math.max(0, Math.min(25, Math.round(score)));
  
  logger.debug('[OpenPillar] Calculation:', {
    base,
    ingredientsScore,
    hiddenTermsPenalty,
    hiddenCount,
    effectiveHiddenCount,
    sophisticationBonus,
    nutritionalInfoAdjustment,
    originPenalty: originAdjustment,
    brandOwnershipPenalty,
    final: score,
  });
  
  const result: OpenPillarResult = {
    score,
    base,
    adjustments,
    details: {
      ingredientsScore,
      ingredientsLength,
      hiddenTermsPenalty,
      hiddenTermsCount: hiddenCount,
      effectiveHiddenCount,
      sophisticationBonus,
      nutritionalInfoAdjustment,
      originPenalty: Math.abs(originAdjustment < 0 ? originAdjustment : 0),
      brandOwnershipPenalty,
    },
  };

  // PowerShell logging for Open Pillar
  powershellLogger.pillarCalculation(
    product.barcode || 'unknown',
    'Open',
    base,
    score,
    adjustments,
    result.details
  );

  return result;
}

