/**
 * Body Pillar (25 pts)
 *
 * Source of truth: Body_Scoring_Specification_V12_Cursor_Submit_20260327_Final.xlsx
 * + Body_Pillar_Implementation_Guidance_Additives_20260327_v1.3
 *
 * Elements: base 15; Nutri-Score; NOVA; Food Additives of Concern (MVP registry); floor 2.
 * No legacy IARC sweeps, universal irritants, country deltas, or parallel additive risk lists.
 */

import { Product } from '../../../types/product';
import { detectProductCategory } from '../productCategoryDetection';
import { logger } from '../../../utils/logger';
import { powershellLogger } from '../../../utils/powershellLogger';
import {
  scoreBodyMvpAdditives,
  BODY_RED_ADDITIVE_SCORE_CEILING,
} from './bodyAdditiveScoring';
import {
  evaluateWholeProduceEligibility,
} from '../wholeProduceEligibility';
import {
  BODY_V12_ADJUSTMENT_REGISTRY,
  bodyV12AdditiveAdjustmentId,
  bodyV12NovaAdjustmentId,
  bodyV12NutriScoreAdjustmentId,
  type BodyV12AdjustmentFamily,
  type BodyV12AdjustmentId,
} from './bodyPillarV12Registry';
import {
  bodyNova1AdjustmentId,
  ensureNova1ProvenanceOnProduct,
  resolveNova1Provenance,
} from '../../../utils/nova1Provenance';

/** Rveel Whole Produce nutrition bonus when eligibility gate passes and no valid OFF Nutri A–E. */
export const WHOLE_PRODUCE_NUTRITION_BONUS = 7;

/** Structured, non-arithmetic context carried alongside a fired adjustment (S12/S28 commentary binding). */
export type BodyPillarAdjustmentMetadata = Record<string, string | number | boolean>;

export interface BodyPillarAdjustment {
  /** Locked Body v12 ID. Absent only if a governed additive somehow has no registered ID. */
  id?: BodyV12AdjustmentId;
  description: string;
  value: number;
  type: 'positive' | 'negative' | 'neutral';
  highlightEligible: boolean;
  family: BodyV12AdjustmentFamily;
  metadata?: BodyPillarAdjustmentMetadata;
}

export interface BodyPillarResult {
  score: number;
  base: number;
  adjustments: BodyPillarAdjustment[];
  details: {
    hasNutriScore: boolean;
    nutriscoreGrade?: string;
    nutriscoreValue?: number;
    /** Total points subtracted by MVP additive element (max 8). */
    additiveElementDeduction: number;
    bodyMvpAdditiveMatchCount: number;
    hasRedBodyAdditive: boolean;
    novaAdjustment: number;
    /** False when category is not human food/beverage — additive rules skipped. */
    foodAdditivesApplied: boolean;
    redAdditiveCeilingApplied: boolean;
    /** True when Whole Produce nutrition bonus applied (no valid OFF Nutri-Score; NOVA 1; eligible category). */
    wholeProduceAdjustmentApplied: boolean;
  };
}

/** OFF soft drinks/juices use source openfoodfacts → detectProductCategory is 'food'; beverages are not excluded. */
function isHumanFoodOrBeverageCategory(product: Product): boolean {
  const cat = detectProductCategory(product);
  return cat === 'food' || cat === 'unknown';
}

/**
 * Nutri-Score: base 15 + adjustment → A 22, B 18, C 14, D 12, E 8 (C = −1 from base).
 */
function nutriscoreContribution(grade: string | undefined): {
  value: number;
  adjustmentFromBase: number;
} | null {
  if (!grade) return null;
  const g = grade.toLowerCase();
  const map: Record<string, number> = { a: 22, b: 18, c: 14, d: 12, e: 8 };
  const value = map[g];
  if (value === undefined) return null;
  return { value, adjustmentFromBase: value - 15 };
}

function adjustmentType(value: number): 'positive' | 'negative' | 'neutral' {
  return value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral';
}

/**
 * Push a fired row carrying its locked Body v12 ID and registry-governed Highlight eligibility.
 * `description` overrides the registry description where the production row is value-specific.
 */
function pushAdjustment(
  adjustments: BodyPillarAdjustment[],
  id: BodyV12AdjustmentId,
  value: number,
  description?: string,
  metadata?: BodyPillarAdjustmentMetadata
): void {
  const meta = BODY_V12_ADJUSTMENT_REGISTRY[id];
  adjustments.push({
    id,
    description: description ?? meta.description,
    value,
    type: adjustmentType(value),
    highlightEligible: meta.highlightEligible,
    family: meta.family,
    ...(metadata && { metadata }),
  });
}

export function calculateBodyPillar(product: Product): BodyPillarResult {
  const adjustments: BodyPillarAdjustment[] = [];
  const base = 15;
  let score = 15;

  // Durable NOVA 1 provenance so the fired ID survives cache/SQLite read-back and later scans.
  ensureNova1ProvenanceOnProduct(product);

  const hasNutriScore = !!product.nutriscore_grade;
  let nutriscoreValue: number | undefined;
  let validNutriScoreApplied = false;

  if (hasNutriScore && product.nutriscore_grade) {
    const nc = nutriscoreContribution(product.nutriscore_grade);
    const nutriId = bodyV12NutriScoreAdjustmentId(product.nutriscore_grade);
    if (nc && nutriId) {
      validNutriScoreApplied = true;
      nutriscoreValue = nc.value;
      const adj = nc.adjustmentFromBase;
      const quality = adj > 0 ? 'excellent nutrition' : adj < 0 ? 'poor nutrition' : 'average nutrition';
      pushAdjustment(
        adjustments,
        nutriId,
        adj,
        `Nutri-Score Grade ${product.nutriscore_grade.toUpperCase()} (${quality})`,
        { nutriscoreGrade: product.nutriscore_grade.toUpperCase() }
      );
      score += adj;
      logger.debug(`[BodyPillar] Nutri-Score "${product.nutriscore_grade}" → total ${nc.value} (adj ${adj})`);
    } else {
      pushAdjustment(adjustments, 'body-v12-nutri-unrecognised', 0, 'Nutri-Score grade not recognised (baseline)', {
        rawNutriscoreGrade: String(product.nutriscore_grade),
      });
    }
  } else {
    pushAdjustment(adjustments, 'body-v12-nutri-unavailable', 0, 'No Nutri-Score available (baseline)');
  }

  let wholeProduceAdjustmentApplied = false;
  if (!validNutriScoreApplied) {
    const wholeProduce = evaluateWholeProduceEligibility(product);
    if (wholeProduce.eligible) {
      wholeProduceAdjustmentApplied = true;
      pushAdjustment(
        adjustments,
        'body-v12-whole-produce-rescue',
        WHOLE_PRODUCE_NUTRITION_BONUS,
        'Whole produce (unprocessed / minimally processed, single ingredient)'
      );
      score += WHOLE_PRODUCE_NUTRITION_BONUS;
      logger.debug(
        `[BodyPillar] Whole Produce +${WHOLE_PRODUCE_NUTRITION_BONUS} applied (no valid OFF Nutri-Score)`
      );
    }
  }

  // NOVA: 1 = +3, 2 = +1, 3 = −1, 4 = −6 (OFF authoritative; internal NOVA 1 only via enhancement)
  const nova = product.nova_group;
  let novaAdjustment = 0;
  if (nova === 1) {
    novaAdjustment = 3;
    const provenance = resolveNova1Provenance(product) ?? 'unknown';
    pushAdjustment(
      adjustments,
      bodyNova1AdjustmentId(provenance),
      3,
      'NOVA Group 1 (unprocessed / minimally processed)',
      { nova1Provenance: provenance }
    );
    score += 3;
  } else if (nova === 2 || nova === 3 || nova === 4) {
    const novaId = bodyV12NovaAdjustmentId(nova);
    if (novaId) {
      novaAdjustment = BODY_V12_ADJUSTMENT_REGISTRY[novaId].points;
      const label =
        nova === 2 ? 'processed culinary ingredients' : nova === 3 ? 'processed' : 'ultra-processed';
      pushAdjustment(adjustments, novaId, novaAdjustment, `NOVA Group ${nova} (${label})`, { novaGroup: nova });
      score += novaAdjustment;
    }
  }

  const foodAdditivesApplied = isHumanFoodOrBeverageCategory(product);
  let additiveElementDeduction = 0;
  let bodyMvpAdditiveMatchCount = 0;
  let hasRedBodyAdditive = false;
  let redAdditiveCeilingApplied = false;

  if (foodAdditivesApplied) {
    const mvp = scoreBodyMvpAdditives(product);
    additiveElementDeduction = mvp.elementDeduction;
    bodyMvpAdditiveMatchCount = mvp.matches.length;
    hasRedBodyAdditive = mvp.hasRedTier;

    // One row per fired additive at its raw deduction, then a cap normaliser so the
    // ledger still reconciles to the capped element deduction the score actually uses.
    for (const match of mvp.matches) {
      const additiveId = bodyV12AdditiveAdjustmentId(match.canonicalId);
      if (!additiveId) {
        logger.warn('[BodyPillar] Governed MVP additive has no locked Wave 3 adjustment ID', {
          canonicalId: match.canonicalId,
        });
      }
      adjustments.push({
        ...(additiveId && { id: additiveId }),
        description: `Food additive of concern: ${match.name} (${match.tier} tier, MVP registry)`,
        value: -match.deduction,
        type: 'negative',
        highlightEligible: additiveId ? BODY_V12_ADJUSTMENT_REGISTRY[additiveId].highlightEligible : false,
        family: 'additives',
        metadata: { canonicalId: match.canonicalId, additiveName: match.name, concernTier: match.tier },
      });
      score -= match.deduction;
    }

    const capNormaliser = mvp.rawSumDeduction - mvp.elementDeduction;
    if (capNormaliser > 0) {
      pushAdjustment(
        adjustments,
        'body-v12-additive-cap',
        capNormaliser,
        `Food additive element cap applied (raw −${mvp.rawSumDeduction} limited to −${mvp.elementDeduction})`,
        { rawSumDeduction: mvp.rawSumDeduction, cappedElementDeduction: mvp.elementDeduction }
      );
      score += capNormaliser;
    }
  }

  if (foodAdditivesApplied && hasRedBodyAdditive) {
    const before = score;
    score = Math.min(score, BODY_RED_ADDITIVE_SCORE_CEILING);
    if (score < before) {
      redAdditiveCeilingApplied = true;
      pushAdjustment(
        adjustments,
        'body-v12-red-additive-ceiling',
        score - before,
        'Red-tier additive present: Body Pillar ceiling 12/25'
      );
    }
  }

  const beforeFloor = Math.min(25, Math.round(score));
  score = Math.max(2, beforeFloor);
  if (score !== beforeFloor) {
    pushAdjustment(adjustments, 'body-v12-final-floor', score - beforeFloor, 'Body Pillar floor 2/25 applied');
  }

  const result: BodyPillarResult = {
    score,
    base,
    adjustments,
    details: {
      hasNutriScore,
      nutriscoreGrade: product.nutriscore_grade,
      nutriscoreValue,
      additiveElementDeduction,
      bodyMvpAdditiveMatchCount,
      hasRedBodyAdditive,
      novaAdjustment,
      foodAdditivesApplied,
      redAdditiveCeilingApplied,
      wholeProduceAdjustmentApplied,
    },
  };

  powershellLogger.pillarCalculation(
    product.barcode || 'unknown',
    'Body',
    base,
    score,
    adjustments.map((adj) => ({
      description: adj.description,
      value: adj.value,
      type: adj.type,
      dataSource: adj.description.includes('Nutri-Score') ? 'OFF' : undefined,
    })),
    result.details
  );

  return result;
}
