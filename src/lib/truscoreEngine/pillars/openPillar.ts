/**
 * Open Pillar Calculation — Open_Scoring_Specification_v14 (food & beverage MVP)
 *
 * Base: 15/25 (uniform across pillars)
 * - Ingredients: `ingredients_text` if non-empty after trim, else `ingredients_text_en` (OFF English fallback);
 *   same normalized string for presence, placeholder check, and hidden-term hits
 * - Presence: present +2 / none or placeholder −3
 * - Hidden / vague terms (tokenized + guardrails): 1 = −4, 2 = −8, ≥3 = −11
 * - Zero vague-term hits + NOVA 1–2: +4; zero hits + NOVA 3–4: +2; unknown NOVA: no listing-clarity bonus
 * - Nutrition: complete +3 / partial +1 / none −3
 * - Origin: none or placeholder −4; complete +4; partial neutral
 * Final: clamped 0–25
 */

import { Product } from '../../../types/product';
import { logger } from '../../../utils/logger';
import { powershellLogger } from '../../../utils/powershellLogger';
import { countOpenPillarHiddenTermHits } from './openPillarHiddenTerms';

/** Primary OFF ingredients field, then English fallback (same normalization across Open pillar). */
export function getOpenPillarIngredientsText(product: Product): string {
  const primary =
    typeof product.ingredients_text === 'string' ? product.ingredients_text.trim() : '';
  if (primary.length > 0) return primary;
  const en =
    typeof product.ingredients_text_en === 'string' ? product.ingredients_text_en.trim() : '';
  return en;
}

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
    listingClarityBonus: number;
    nutritionalInfoAdjustment: number;
    originPenalty: number;
  };
}

export function calculateOpenPillar(product: Product): OpenPillarResult {
  const adjustments: OpenPillarResult['adjustments'] = [];
  let score = 15;
  const base = 15;

  const ingredientsText = getOpenPillarIngredientsText(product);
  const ingredientsLength = ingredientsText.length;

  adjustments.push({
    description: 'Base score (neutral starting point; uniform across pillars)',
    value: 0,
    type: 'neutral',
  });

  let ingredientsScore = 0;
  if (!ingredientsText || ingredientsLength === 0) {
    ingredientsScore = -3;
    adjustments.push({
      description: 'No ingredients listed',
      value: ingredientsScore,
      type: 'negative',
    });
    score += ingredientsScore;
  } else {
    const isPlaceholder = /^(product|item|n\/a|not available|unknown|missing|no ingredients|ingredients not listed)/i.test(
      ingredientsText
    );
    if (isPlaceholder) {
      ingredientsScore = -3;
      adjustments.push({
        description: 'Ingredients placeholder text (not real ingredients)',
        value: ingredientsScore,
        type: 'negative',
      });
      score += ingredientsScore;
    } else {
      ingredientsScore = 2;
      adjustments.push({
        description: 'Ingredients disclosure present',
        value: ingredientsScore,
        type: 'positive',
      });
      score += ingredientsScore;
    }
  }

  const hiddenTermsCount = countOpenPillarHiddenTermHits(ingredientsText);

  let hiddenTermsPenalty = 0;
  if (hiddenTermsCount >= 3) {
    hiddenTermsPenalty = 11;
  } else if (hiddenTermsCount === 2) {
    hiddenTermsPenalty = 8;
  } else if (hiddenTermsCount === 1) {
    hiddenTermsPenalty = 4;
  }

  if (hiddenTermsPenalty > 0) {
    adjustments.push({
      description: `${hiddenTermsCount} vague-ingredient / disclosure-risk pattern(s) (Open v14 list)`,
      value: -hiddenTermsPenalty,
      type: 'negative',
    });
    score -= hiddenTermsPenalty;
  }

  let listingClarityBonus = 0;
  if (hiddenTermsCount === 0) {
    const nova = product.nova_group;
    if (nova === 1 || nova === 2) {
      listingClarityBonus = 4;
      adjustments.push({
        description: 'Listing clarity bonus (no vague-term matches + NOVA 1–2)',
        value: listingClarityBonus,
        type: 'positive',
      });
      score += listingClarityBonus;
    } else if (nova === 3 || nova === 4) {
      listingClarityBonus = 2;
      adjustments.push({
        description: 'Listing clarity bonus (no vague-term matches + NOVA 3–4)',
        value: listingClarityBonus,
        type: 'positive',
      });
      score += listingClarityBonus;
    }
  }

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
    score += nutritionalInfoAdjustment;
  } else {
    const hasPer100g = Object.keys(nutrients).some((key) => key.includes('_100g'));
    const hasServingSize = !!product.serving_size || !!nutrients.serving_size;
    const hasCompleteFormat = hasPer100g && hasServingSize;

    const keyNutrients = ['energy', 'fat', 'carbohydrates', 'proteins', 'salt', 'sugars'];
    const hasKeyNutrients = keyNutrients.some((nutrient) =>
      Object.keys(nutrients).some((key) => key.toLowerCase().includes(nutrient))
    );

    if (hasCompleteFormat && hasKeyNutrients) {
      nutritionalInfoAdjustment = 3;
      adjustments.push({
        description: 'Complete nutritional information (per 100g/serve benchmarks)',
        value: nutritionalInfoAdjustment,
        type: 'positive',
      });
      score += nutritionalInfoAdjustment;
    } else if (hasKeyNutrients) {
      nutritionalInfoAdjustment = 1;
      adjustments.push({
        description: 'Partial nutritional information disclosed',
        value: nutritionalInfoAdjustment,
        type: 'positive',
      });
      score += nutritionalInfoAdjustment;
    } else {
      adjustments.push({
        description: 'Nutritional information present but incomplete',
        value: 0,
        type: 'neutral',
      });
    }
  }

  const hasOriginTags = Array.isArray(product.origins_tags) && product.origins_tags.length > 0;
  const hasManufacturingTags = Array.isArray(product.manufacturing_places_tags) && product.manufacturing_places_tags.length > 0;
  const hasOriginString = !!(product.origins && typeof product.origins === 'string' && product.origins.trim().length > 0);
  const hasManufacturingString = !!(product.manufacturing_places && typeof product.manufacturing_places === 'string' && product.manufacturing_places.trim().length > 0);

  const textFields = [product.product_name, product.product_name_en, product.generic_name, product.labels, product.labels_en]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const originPattern = /(?:product\s+(?:of|made\s+in)|made\s+in|origin:|origin\s+of|manufactured\s+in)\s+([a-z\s]+?)(?:[,;]|\s*$)/i;
  const hasOriginInText = originPattern.test(textFields);

  const placeholderValues = ['unknown', 'n/a', 'not available', 'missing', 'not disclosed', 'not specified'];
  const originArrayValues = [
    ...(Array.isArray(product.origins_tags) ? product.origins_tags.map((v) => String(v).toLowerCase()) : []),
    ...(Array.isArray(product.manufacturing_places_tags) ? product.manufacturing_places_tags.map((v) => String(v).toLowerCase()) : []),
  ];
  const originString = (product.origins || product.manufacturing_places || '').toString().toLowerCase();
  const allOriginValues = [...originArrayValues, originString, textFields].join(' ');

  const hasOrigin: boolean =
    hasOriginTags || hasManufacturingTags || hasOriginString || hasManufacturingString || hasOriginInText;

  const isOriginComplete =
    (hasOriginTags && hasOriginString) ||
    (hasOriginTags && product.origins_tags && product.origins_tags.length > 1) ||
    (hasManufacturingTags && hasManufacturingString);

  let originAdjustment = 0;
  if (!hasOrigin) {
    originAdjustment = -4;
    adjustments.push({
      description: 'No origin information',
      value: originAdjustment,
      type: 'negative',
    });
    score += originAdjustment;
  } else if (placeholderValues.some((placeholder) => allOriginValues.includes(placeholder))) {
    originAdjustment = -4;
    adjustments.push({
      description: 'Origin information is placeholder text (not real origin)',
      value: originAdjustment,
      type: 'negative',
    });
    score += originAdjustment;
  } else if (isOriginComplete) {
    originAdjustment = 4;
    adjustments.push({
      description: 'Complete origin information disclosed',
      value: originAdjustment,
      type: 'positive',
    });
    score += originAdjustment;
  } else {
    adjustments.push({
      description: 'Origin information available (partial)',
      value: 0,
      type: 'neutral',
    });
  }

  score = Math.max(0, Math.min(25, Math.round(score)));

  logger.debug('[OpenPillar] Calculation:', {
    base,
    ingredientsScore,
    hiddenTermsPenalty,
    hiddenTermsCount,
    listingClarityBonus,
    nutritionalInfoAdjustment,
    originAdjustment,
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
      hiddenTermsCount,
      listingClarityBonus,
      nutritionalInfoAdjustment,
      originPenalty: Math.abs(originAdjustment < 0 ? originAdjustment : 0),
    },
  };

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
