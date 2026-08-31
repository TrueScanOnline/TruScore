/**
 * Whole Produce shadow helpers — eligibility reuses shared production gate.
 */

import type { Product } from '../../../types/product';
import {
  evaluateWholeProduceEligibility,
  hasValidOffNutriScoreGrade,
} from '../wholeProduceEligibility';
import { WHOLE_PRODUCE_NUTRITION_BONUS } from '../pillars/bodyPillar';

export interface WholeProduceShadowResult {
  candidate: boolean;
  reason: string;
  expectedBodyBump: number;
}

export function evaluateWholeProduceCandidate(product: Product): WholeProduceShadowResult {
  const result = evaluateWholeProduceEligibility(product);
  return {
    candidate: result.eligible,
    reason: result.reason,
    expectedBodyBump: result.eligible ? WHOLE_PRODUCE_NUTRITION_BONUS : 0,
  };
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
  if (offGrade && hasValidOffNutriScoreGrade(offGrade)) {
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

  const offNutriBlocksWholeProduce =
    !!input.offGrade && hasValidOffNutriScoreGrade(input.offGrade);
  if (input.wholeProduceCandidate && !offNutriBlocksWholeProduce && !input.localGrade) {
    score += WHOLE_PRODUCE_NUTRITION_BONUS;
  }
  return Math.max(2, Math.min(25, Math.round(score)));
}
