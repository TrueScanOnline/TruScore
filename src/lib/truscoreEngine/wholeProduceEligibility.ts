/**
 * Whole Produce eligibility gate — shared between production Body and shadow validation.
 * Fail-closed: category tags + single-ingredient evidence only; no product-name inference.
 */

import type { Product } from '../../types/product';
import {
  hasExactlyOneSurvivingIngredientPart,
  hasMultipleIngredientParts,
  rawIngredientTextHasProcessedForm,
} from '../../utils/ingredientTextPrimitives';

const EXCLUDE_CATEGORY_PATTERNS = [
  /juice/i,
  /smoothie/i,
  /puree|purée|pulp/i,
  /dried|dehydrated|freeze-dried/i,
  /concentrate/i,
  /powder|flour/i,
  /oil/i,
  /nut|seed/i,
  /coconut/i,
  /peanut/i,
  /canned/i,
  /pickled|fermented/i,
  /dairy|milk|cheese|yog/i,
  /meat|fish|egg/i,
  /cereal|grain|rice|pasta|bread/i,
];

const ELIGIBLE_FRESH_PATTERNS = [
  /en:fresh-fruits/i,
  /en:fresh-vegetables/i,
  /en:fresh-berries/i,
  /en:fresh-raspberries/i,
  /en:fresh-apples/i,
  /en:fresh-potatoes/i,
  /en:vegetables$/i,
  /en:fruits$/i,
  /en:berries$/i,
  /en:legumes$/i,
  /en:pulses$/i,
];

export interface WholeProduceEligibilityResult {
  eligible: boolean;
  reason: string;
}

function hasExcludedCategory(tags: string[]): boolean {
  return tags.some((t) => EXCLUDE_CATEGORY_PATTERNS.some((p) => p.test(t)));
}

function hasEligibleCategory(tags: string[]): boolean {
  return tags.some((t) => ELIGIBLE_FRESH_PATTERNS.some((p) => p.test(t)));
}

function ingredientsAreWholeProduceOnly(ingredientsText?: string): boolean {
  if (!ingredientsText?.trim()) return false;

  // H1: test raw text before any normalization that would erase qualifiers such as "dried".
  if (rawIngredientTextHasProcessedForm(ingredientsText)) {
    return false;
  }

  // H3: broad multi-ingredient separator detection.
  if (hasMultipleIngredientParts(ingredientsText)) {
    return false;
  }

  // N1: require exactly one surviving normalized part (malformed separator-only fails closed).
  if (!hasExactlyOneSurvivingIngredientPart(ingredientsText)) {
    return false;
  }

  return true;
}

/** Valid OFF Nutri-Score grades that trigger the Body v12 Nutri adjustment (A–E only). */
export function hasValidOffNutriScoreGrade(grade: string | undefined | null): boolean {
  if (!grade) return false;
  return ['a', 'b', 'c', 'd', 'e'].includes(grade.toLowerCase());
}

export function evaluateWholeProduceEligibility(product: Product): WholeProduceEligibilityResult {
  const tags = product.categories_tags ?? [];
  const nova = product.nova_group;

  if (nova !== 1) {
    return { eligible: false, reason: 'nova_not_1' };
  }

  // H2: contradictory additive evidence — fail closed.
  if (product.additives_tags && product.additives_tags.length > 0) {
    return { eligible: false, reason: 'additive_tags_present' };
  }

  if (hasExcludedCategory(tags)) {
    return { eligible: false, reason: 'excluded_category' };
  }

  if (!hasEligibleCategory(tags)) {
    return { eligible: false, reason: 'no_eligible_category_evidence' };
  }

  if (!ingredientsAreWholeProduceOnly(product.ingredients_text)) {
    return { eligible: false, reason: 'ingredients_not_whole_produce_only' };
  }

  return { eligible: true, reason: 'whole_produce_gate_passed' };
}
