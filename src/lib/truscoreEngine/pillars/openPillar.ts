/**
 * Open Pillar Calculation — Open_Scoring_Specification_v15 (food & beverage MVP)
 *
 * Base: 15/25 (Highlight-ineligible)
 * Ingredient wording clarity (governed flags): +1 / −2 / −4 / −6 / 0 unavailable
 * Origins (OFF ingredient-origin gate): +8 single-ingredient evidently complete; other bands registered;
 *   percentage/qualified/packet-gap unreachable under OFF-only MVP; insufficient/conflict → 0
 * Final: clamped 0–25 (Highlight-ineligible)
 *
 * Supersedes v14: ingredient presence ±, NIP, NOVA listing bonus, field-presence origins ±.
 */

import { Product } from '../../../types/product';
import { logger } from '../../../utils/logger';
import { powershellLogger } from '../../../utils/powershellLogger';
import { countOpenPillarHiddenTermHits } from './openPillarHiddenTerms';
import { assessOpenOriginsV15 } from './openPillarOriginsV15';
import {
  OPEN_V15_ADJUSTMENT_REGISTRY,
  type OpenV15AdjustmentId,
} from './openPillarV15Registry';

/** Primary OFF ingredients field, then English fallback (same normalization across Open pillar). */
export function getOpenPillarIngredientsText(product: Product): string {
  const primary =
    typeof product.ingredients_text === 'string' ? product.ingredients_text.trim() : '';
  if (primary.length > 0) return primary;
  const en =
    typeof product.ingredients_text_en === 'string' ? product.ingredients_text_en.trim() : '';
  return en;
}

export interface OpenPillarAdjustment {
  id: OpenV15AdjustmentId;
  description: string;
  value: number;
  type: 'positive' | 'negative' | 'neutral';
  highlightEligible: boolean;
  family: 'system' | 'ingredients' | 'origins';
}

export interface OpenPillarResult {
  score: number;
  base: number;
  adjustments: OpenPillarAdjustment[];
  details: {
    ingredientsLength: number;
    governedFlagCount: number;
    ingredientClarityAdjustment: number;
    originsAdjustmentId: OpenV15AdjustmentId;
    originsAdjustment: number;
    originsProvenance: string;
  };
}

function isPlaceholderIngredients(text: string): boolean {
  return /^(product|item|n\/a|not available|unknown|missing|no ingredients|ingredients not listed)/i.test(
    text.trim()
  );
}

function ingredientsUsableForV15(ingredientsText: string): boolean {
  if (!ingredientsText || ingredientsText.trim().length === 0) return false;
  if (isPlaceholderIngredients(ingredientsText)) return false;
  return true;
}

function pushAdjustment(
  adjustments: OpenPillarAdjustment[],
  id: OpenV15AdjustmentId
): OpenPillarAdjustment {
  const meta = OPEN_V15_ADJUSTMENT_REGISTRY[id];
  const adj: OpenPillarAdjustment = {
    id,
    description: meta.description,
    value: meta.points,
    type: meta.points > 0 ? 'positive' : meta.points < 0 ? 'negative' : 'neutral',
    highlightEligible: meta.highlightEligible,
    family: meta.family,
  };
  adjustments.push(adj);
  return adj;
}

function ingredientClarityId(flagCount: number, usable: boolean): OpenV15AdjustmentId {
  if (!usable) return 'open-v15-ing-clarity-unavailable';
  if (flagCount === 0) return 'open-v15-ing-clarity-zero';
  if (flagCount === 1) return 'open-v15-ing-clarity-one';
  if (flagCount === 2) return 'open-v15-ing-clarity-two';
  return 'open-v15-ing-clarity-three-plus';
}

export function calculateOpenPillar(product: Product): OpenPillarResult {
  const adjustments: OpenPillarAdjustment[] = [];
  let score = 15;
  const base = 15;

  const ingredientsText = getOpenPillarIngredientsText(product);
  const ingredientsLength = ingredientsText.length;
  const usable = ingredientsUsableForV15(ingredientsText);

  const governedFlagCount = usable ? countOpenPillarHiddenTermHits(ingredientsText) : 0;
  const clarityId = ingredientClarityId(governedFlagCount, usable);
  const clarityAdj = pushAdjustment(adjustments, clarityId);
  score += clarityAdj.value;

  const originsAssessment = assessOpenOriginsV15(
    product,
    ingredientsText,
    usable,
    governedFlagCount
  );
  const originsAdj = pushAdjustment(adjustments, originsAssessment.id);
  score += originsAdj.value;

  score = Math.max(0, Math.min(25, Math.round(score)));

  logger.debug('[OpenPillar] v15 calculation:', {
    base,
    governedFlagCount,
    clarityId,
    originsId: originsAssessment.id,
    originsProvenance: originsAssessment.provenance,
    final: score,
  });

  const result: OpenPillarResult = {
    score,
    base,
    adjustments,
    details: {
      ingredientsLength,
      governedFlagCount,
      ingredientClarityAdjustment: clarityAdj.value,
      originsAdjustmentId: originsAssessment.id,
      originsAdjustment: originsAdj.value,
      originsProvenance: originsAssessment.provenance,
    },
  };

  powershellLogger.pillarCalculation(
    product.barcode || 'unknown',
    'Open',
    base,
    score,
    adjustments.map((a) => ({ description: a.description, value: a.value, type: a.type })),
    result.details
  );

  return result;
}
