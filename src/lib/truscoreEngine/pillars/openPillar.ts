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
import { assessOpenPillarHiddenTerms } from './openPillarHiddenTerms';
import { assessOpenOriginsV15 } from './openPillarOriginsV15';
import {
  buildOpenClarityCommentaryMetadata,
  buildOpenOriginsCommentaryMetadata,
  type OpenCommentaryMetadata,
} from './openPillarCommentaryMetadata';
import {
  resolveOpenV15ScoringIngredients,
  type OpenV15IngredientsResolution,
} from './openPillarIngredientsLanguage';
import { resolvePlanetJurisdiction } from './planetPackagingFallback';
import {
  OPEN_V15_ADJUSTMENT_REGISTRY,
  type OpenV15AdjustmentId,
} from './openPillarV15Registry';

export {
  isAffirmativelyEnglishIngredientSource,
  normalizeOffLanguageCode,
  resolveOpenV15ScoringIngredients,
} from './openPillarIngredientsLanguage';
export type { OpenV15IngredientsResolution, OpenV15IngredientsScoringSource } from './openPillarIngredientsLanguage';

/**
 * Governed Open-v15 scoring ingredient text (English-assessable only).
 * May differ from consumer-displayed `product.ingredients_text`.
 */
export function getOpenPillarIngredientsText(product: Product): string {
  return resolveOpenV15ScoringIngredients(product).scoringText;
}

export function resolveOpenPillarIngredientsForV15(product: Product): OpenV15IngredientsResolution {
  return resolveOpenV15ScoringIngredients(product);
}

export interface OpenPillarAdjustment {
  id: OpenV15AdjustmentId;
  description: string;
  value: number;
  type: 'positive' | 'negative' | 'neutral';
  highlightEligible: boolean;
  family: 'system' | 'ingredients' | 'origins';
  metadata?: OpenCommentaryMetadata;
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

function pushAdjustment(
  adjustments: OpenPillarAdjustment[],
  id: OpenV15AdjustmentId,
  metadata?: OpenCommentaryMetadata
): OpenPillarAdjustment {
  const meta = OPEN_V15_ADJUSTMENT_REGISTRY[id];
  const adj: OpenPillarAdjustment = {
    id,
    description: meta.description,
    value: meta.points,
    type: meta.points > 0 ? 'positive' : meta.points < 0 ? 'negative' : 'neutral',
    highlightEligible: meta.highlightEligible,
    family: meta.family,
    ...(metadata && Object.keys(metadata).length > 0 && { metadata }),
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

  const ingredientsResolution = resolveOpenV15ScoringIngredients(product);
  const ingredientsText = ingredientsResolution.scoringText;
  const ingredientsLength = ingredientsText.length;
  const usable = ingredientsResolution.usable;

  const hiddenTermAssessment = usable ? assessOpenPillarHiddenTerms(ingredientsText) : null;
  const governedFlagCount = hiddenTermAssessment?.flagCount ?? 0;
  const clarityId = ingredientClarityId(governedFlagCount, usable);
  const openMarket = resolvePlanetJurisdiction(product);
  const clarityMetadata =
    usable && hiddenTermAssessment && governedFlagCount > 0
      ? buildOpenClarityCommentaryMetadata(
          {
            termPresentationClass: hiddenTermAssessment.termPresentationClass,
            matchedTerms: hiddenTermAssessment.matchedTerms,
            decodedAdditiveNames: hiddenTermAssessment.decodedAdditiveNames,
            matches: hiddenTermAssessment.matches,
          },
          openMarket === 'AU' || openMarket === 'NZ' ? openMarket : undefined
        )
      : undefined;
  const clarityAdj = pushAdjustment(adjustments, clarityId, clarityMetadata);
  score += clarityAdj.value;

  const originsAssessment = assessOpenOriginsV15(
    product,
    ingredientsText,
    usable,
    governedFlagCount
  );
  const originsMetadata = buildOpenOriginsCommentaryMetadata(
    product,
    ingredientsText,
    originsAssessment
  );
  const originsAdj = pushAdjustment(adjustments, originsAssessment.id, originsMetadata);
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
