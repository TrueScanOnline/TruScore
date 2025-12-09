/**
 * Open Pillar Calculation
 * 
 * Base Score: 15/25
 * Adjustments:
 * - Ingredients disclosure: Full (>100 chars)=+0 (stays 15), >80%=+0 (becomes 10), 50-80%=+0 (becomes 5), None=-5
 * - Hidden terms: 1-2=-10, ≥3=-20
 * - Sophistication bonus: +5 (zero hidden + NOVA 1-2)
 * - Origin: No origin=-8
 * 
 * Final: Capped at 0-25
 */

import { Product } from '../../../types/product';
import { logger } from '../../../utils/logger';

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
];

// Fragrance terms (moved from BODY Pillar - transparency issue, not body safety)
const FRAGRANCE_TERMS = ['parfum', 'fragrance', 'aroma'];

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
    fragrancePenalty: number;
    sophisticationBonus: number;
    originPenalty: number;
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
  
  // Hidden terms penalty (excludes fragrance - handled separately)
  const nonFragranceHiddenTerms = HIDDEN_TERMS.filter(t => !FRAGRANCE_TERMS.includes(t));
  const hiddenCount = nonFragranceHiddenTerms.filter((t) => hasTerm(t)).length;
  let hiddenTermsPenalty = 0;
  if (hiddenCount >= 3) {
    hiddenTermsPenalty = 20;
    adjustments.push({
      description: `${hiddenCount} hidden ingredient term(s) (flavor, proprietary, etc.)`,
      value: -hiddenTermsPenalty,
      type: 'negative',
    });
    score -= hiddenTermsPenalty;
  } else if (hiddenCount >= 1) {
    hiddenTermsPenalty = 10;
    adjustments.push({
      description: `${hiddenCount} hidden ingredient term(s) (flavor, proprietary, etc.)`,
      value: -hiddenTermsPenalty,
      type: 'negative',
    });
    score -= hiddenTermsPenalty;
  }
  
  // Fragrance penalty (moved from BODY Pillar - transparency issue)
  const hasFragrance = FRAGRANCE_TERMS.some((a) => hasTerm(a));
  const fragrancePenalty = hasFragrance ? 10 : 0;
  if (fragrancePenalty > 0) {
    adjustments.push({
      description: 'Contains fragrance/parfum (hidden ingredients - transparency issue)',
      value: -fragrancePenalty,
      type: 'negative',
    });
    score -= fragrancePenalty;
  }
  
  // Sophistication bonus: +5 for zero hidden ingredients + NOVA1-2
  let sophisticationBonus = 0;
  if (ingredientsScore >= -5 && hiddenCount === 0) {
    const nova = product.nova_group;
    const isNOVA12 = nova === 1 || nova === 2;
    if (isNOVA12) {
      sophisticationBonus = 5;
      adjustments.push({
        description: 'Sophistication bonus (zero hidden ingredients + NOVA 1-2)',
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
  
  // Cap at 0-25
  score = Math.max(0, Math.min(25, Math.round(score)));
  
  logger.debug('[OpenPillar] Calculation:', {
    base,
    ingredientsScore,
    hiddenTermsPenalty,
    sophisticationBonus,
    originPenalty,
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
      fragrancePenalty,
      sophisticationBonus,
      originPenalty,
    },
  };
}

