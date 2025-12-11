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
 * - Brand ownership: Hidden/opaque parent=-5
 * 
 * Final: Capped at 0-25
 */

import { Product } from '../../../types/product';
import { logger } from '../../../utils/logger';
import { getBrandData } from '../../../data/brandDatabase';

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
  // IMPORTANT: Simple products (e.g., "99.5% peanuts, 0.05% salt") are complete even if short
  // We check for completeness indicators rather than just character count
  let ingredientsScore = 0;
  if (!ingredientsText || ingredientsLength === 0) {
    ingredientsScore = -5;
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
      ingredientsScore = -5;
      adjustments.push({
        description: 'Ingredients placeholder text (not real ingredients)',
        value: ingredientsScore,
        type: 'negative',
      });
      score += ingredientsScore; // Already negative
    } else {
      // Check for completeness indicators (percentages, multiple ingredients, etc.)
      const hasPercentages = /\d+\.?\d*\s*%/.test(ingredientsText);
      const hasMultipleIngredients = ingredientsText.split(',').length >= 2 || ingredientsText.split(/[,\n;]/).length >= 2;
      const hasCompleteFormat = hasPercentages || (hasMultipleIngredients && ingredientsLength >= 20);
      
      // Simple products with percentages are considered complete even if short
      // Example: "99.5% peanuts, 0.05% salt" is complete (has percentages, multiple ingredients)
      if (hasCompleteFormat || (hasPercentages && ingredientsLength >= 15)) {
        // Complete disclosure - no penalty
        ingredientsScore = 0;
        adjustments.push({
          description: 'Complete ingredients disclosure',
          value: 0,
          type: 'neutral',
        });
      } else if (ingredientsLength >= 100) {
        // Long list = likely complete
        ingredientsScore = 0;
        adjustments.push({
          description: 'Full ingredients disclosure (>100 characters)',
          value: 0,
          type: 'neutral',
        });
      } else if (ingredientsLength >= 50) {
        // Medium length = partial
        ingredientsScore = -5;
        adjustments.push({
          description: 'Partial ingredients disclosure (50-100 characters, may be incomplete)',
          value: ingredientsScore,
          type: 'negative',
        });
        score += ingredientsScore; // Already negative
      } else {
        // Short and no completeness indicators = likely incomplete
        ingredientsScore = -5;
        adjustments.push({
          description: 'Minimal ingredients disclosure (<50 characters, likely incomplete)',
          value: ingredientsScore,
          type: 'negative',
        });
        score += ingredientsScore; // Already negative
      }
    }
  }
  
  // Hidden terms penalty (includes fragrance - merged into main list)
  const hiddenCount = HIDDEN_TERMS.filter((t) => hasTerm(t)).length;
  
  // NOVA amplification: +1 count if NOVA≥3 & disclosure partial/none
  let effectiveHiddenCount = hiddenCount;
  if (product.nova_group !== undefined && product.nova_group >= 3) {
    const isDisclosurePartial = ingredientsLength < 100 || ingredientsScore < 0;
    if (isDisclosurePartial) {
      effectiveHiddenCount += 1;
    }
  }
  
  // Apply penalty based on effective count (per spec: 1=-5, 2=-10, ≥3=-15, cap -20)
  let hiddenTermsPenalty = 0;
  if (effectiveHiddenCount >= 3) {
    hiddenTermsPenalty = 15; // -15 (cap -20 total)
  } else if (effectiveHiddenCount === 2) {
    hiddenTermsPenalty = 10; // -10
  } else if (effectiveHiddenCount === 1) {
    hiddenTermsPenalty = 5; // -5
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
  
  // Zero hidden rewards: +5 for NOVA 1-2, +2 for others
  let sophisticationBonus = 0;
  if (hiddenCount === 0) {
    const nova = product.nova_group;
    if (nova === 1 || nova === 2) {
      sophisticationBonus = 5; // +5 for zero hidden + NOVA 1-2
      adjustments.push({
        description: 'Sophistication bonus (zero hidden ingredients + NOVA 1-2)',
        value: sophisticationBonus,
        type: 'positive',
      });
      score += sophisticationBonus;
    } else {
      sophisticationBonus = 2; // +2 for zero hidden but not NOVA 1-2
      adjustments.push({
        description: 'Transparency bonus (zero hidden ingredients)',
        value: sophisticationBonus,
        type: 'positive',
      });
      score += sophisticationBonus;
    }
  }
  
  // Origin penalty
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
  
  let originPenalty = 0;
  if (!hasOrigin) {
    originPenalty = 8;
    adjustments.push({
      description: 'No origin information',
      value: -originPenalty,
      type: 'negative',
    });
    score -= originPenalty;
  } else {
    // Check for placeholder values
    if (placeholderValues.some(placeholder => allOriginValues.includes(placeholder))) {
      originPenalty = 8;
      adjustments.push({
        description: 'Origin information is placeholder text (not real origin)',
        value: -originPenalty,
        type: 'negative',
      });
      score -= originPenalty;
    } else {
      // Origin found - no penalty
      adjustments.push({
        description: 'Origin information available',
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
  
  let brandOwnershipPenalty = 0;
  const hasBrandOwner = !!(product.brand_owner && 
    !isPlaceholderValue(product.brand_owner));
  
  if (!hasBrandOwner) {
    // Check if we can determine parent from brand database
    // Try to get parent company from brand database
    const brandName = product.brands || '';
    const brandData = brandName ? getBrandData(brandName) : null;
    const hasParentInDatabase = !!(brandData?.parentCompany);
    
    if (!hasParentInDatabase) {
      // Parent company is hidden/opaque - apply penalty
      brandOwnershipPenalty = 5;
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
    originPenalty,
    brandOwnershipPenalty,
    final: score,
  });
  
  return {
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
      originPenalty,
      brandOwnershipPenalty,
    },
  };
}

