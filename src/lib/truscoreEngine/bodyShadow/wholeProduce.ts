/**
 * Whole Produce +4 Body candidate — shadow only.
 */

import type { Product } from '../../../types/product';

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

export interface WholeProduceShadowResult {
  candidate: boolean;
  reason: string;
  expectedBodyBump: number;
}

function hasExcludedCategory(tags: string[]): boolean {
  return tags.some((t) => EXCLUDE_CATEGORY_PATTERNS.some((p) => p.test(t)));
}

function hasEligibleCategory(tags: string[]): boolean {
  return tags.some((t) => ELIGIBLE_FRESH_PATTERNS.some((p) => p.test(t)));
}

function ingredientsAreWholeProduceOnly(ingredientsText?: string): boolean {
  if (!ingredientsText?.trim()) return false;
  const normalized = ingredientsText.trim().toLowerCase();
  if (/[,;]| and | with | containing /.test(normalized)) {
    return false;
  }
  return normalized.length > 0;
}

export function evaluateWholeProduceCandidate(product: Product): WholeProduceShadowResult {
  const tags = product.categories_tags ?? [];
  const nova = product.nova_group;

  if (nova !== 1) {
    return { candidate: false, reason: 'nova_not_1', expectedBodyBump: 0 };
  }

  if (hasExcludedCategory(tags)) {
    return { candidate: false, reason: 'excluded_category', expectedBodyBump: 0 };
  }

  if (!hasEligibleCategory(tags)) {
    return { candidate: false, reason: 'no_eligible_category_evidence', expectedBodyBump: 0 };
  }

  if (!ingredientsAreWholeProduceOnly(product.ingredients_text)) {
    return { candidate: false, reason: 'ingredients_not_whole_produce_only', expectedBodyBump: 0 };
  }

  return { candidate: true, reason: 'whole_produce_gate_passed', expectedBodyBump: 4 };
}

/** Body v12 Nutri-Score grade → points (certified mapping — shadow comparison only). */
export function bodyNutriAdjustmentFromGrade(grade: string | null | undefined): number {
  if (!grade) return 0;
  const map: Record<string, number> = { a: 7, b: 3, c: -1, d: -3, e: -7 };
  return map[grade.toLowerCase()] ?? 0;
}

export function shadowBodyNutriPoints(
  localGrade: string | null,
  offGrade: string | null
): { usedGrade: string | null; adjustment: number; source: 'off' | 'local' | 'none' } {
  if (offGrade) {
    return { usedGrade: offGrade, adjustment: bodyNutriAdjustmentFromGrade(offGrade), source: 'off' };
  }
  if (localGrade) {
    return { usedGrade: localGrade, adjustment: bodyNutriAdjustmentFromGrade(localGrade), source: 'local' };
  }
  return { usedGrade: null, adjustment: 0, source: 'none' };
}

export function shadowBodyScoreEstimate(input: {
  product: Product;
  localGrade: string | null;
  offGrade: string | null;
  wholeProduceCandidate: boolean;
}): number {
  const base = 15;
  const nutri = shadowBodyNutriPoints(input.localGrade, input.offGrade);
  let score = base + nutri.adjustment;
  if (input.product.nova_group === 1) score += 3;
  else if (input.product.nova_group === 2) score += 1;
  else if (input.product.nova_group === 3) score -= 1;
  else if (input.product.nova_group === 4) score -= 6;

  if (input.wholeProduceCandidate && !input.offGrade && !input.localGrade) {
    score += 4;
  }
  return Math.max(2, score);
}
