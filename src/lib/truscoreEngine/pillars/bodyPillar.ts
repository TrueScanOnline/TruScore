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

export interface BodyPillarResult {
  score: number;
  base: number;
  adjustments: Array<{
    description: string;
    value: number;
    type: 'positive' | 'negative' | 'neutral';
  }>;
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
    /** True when Whole Produce +4 applied (no valid OFF Nutri-Score; NOVA 1; eligible category). */
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

export function calculateBodyPillar(product: Product): BodyPillarResult {
  const adjustments: BodyPillarResult['adjustments'] = [];
  const base = 15;
  let score = 15;

  const hasNutriScore = !!product.nutriscore_grade;
  let nutriscoreValue: number | undefined;
  let validNutriScoreApplied = false;

  if (hasNutriScore && product.nutriscore_grade) {
    const nc = nutriscoreContribution(product.nutriscore_grade);
    if (nc) {
      validNutriScoreApplied = true;
      nutriscoreValue = nc.value;
      const adj = nc.adjustmentFromBase;
      if (adj > 0) {
        adjustments.push({
          description: `Nutri-Score Grade ${product.nutriscore_grade.toUpperCase()} (excellent nutrition)`,
          value: adj,
          type: 'positive',
        });
      } else if (adj < 0) {
        adjustments.push({
          description: `Nutri-Score Grade ${product.nutriscore_grade.toUpperCase()} (poor nutrition)`,
          value: adj,
          type: 'negative',
        });
      } else {
        adjustments.push({
          description: `Nutri-Score Grade ${product.nutriscore_grade.toUpperCase()} (average nutrition)`,
          value: 0,
          type: 'neutral',
        });
      }
      score += adj;
      logger.debug(`[BodyPillar] Nutri-Score "${product.nutriscore_grade}" → total ${nc.value} (adj ${adj})`);
    } else {
      adjustments.push({
        description: 'Nutri-Score grade not recognised (baseline)',
        value: 0,
        type: 'neutral',
      });
    }
  } else {
    adjustments.push({
      description: 'No Nutri-Score available (baseline)',
      value: 0,
      type: 'neutral',
    });
  }

  let wholeProduceAdjustmentApplied = false;
  if (!validNutriScoreApplied) {
    const wholeProduce = evaluateWholeProduceEligibility(product);
    if (wholeProduce.eligible) {
      wholeProduceAdjustmentApplied = true;
      adjustments.push({
        description: 'Whole produce (unprocessed / minimally processed, single ingredient)',
        value: 4,
        type: 'positive',
      });
      score += 4;
      logger.debug('[BodyPillar] Whole Produce +4 applied (no valid OFF Nutri-Score)');
    }
  }

  // NOVA: 1 = +3, 2 = +1, 3 = −1, 4 = −6 (OFF authoritative; internal NOVA 1 only via enhancement)
  const nova = product.nova_group;
  let novaAdjustment = 0;
  if (nova === 1) {
    novaAdjustment = 3;
    adjustments.push({ description: 'NOVA Group 1 (unprocessed / minimally processed)', value: 3, type: 'positive' });
    score += 3;
  } else if (nova === 2) {
    novaAdjustment = 1;
    adjustments.push({ description: 'NOVA Group 2 (processed culinary ingredients)', value: 1, type: 'positive' });
    score += 1;
  } else if (nova === 3) {
    novaAdjustment = -1;
    adjustments.push({ description: 'NOVA Group 3 (processed)', value: -1, type: 'negative' });
    score -= 1;
  } else if (nova === 4) {
    novaAdjustment = -6;
    adjustments.push({ description: 'NOVA Group 4 (ultra-processed)', value: -6, type: 'negative' });
    score -= 6;
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

    if (mvp.elementDeduction > 0) {
      const names = mvp.matches.map((m) => `${m.name} (${m.tier})`).slice(0, 4);
      const extra = mvp.matches.length > 4 ? ` (+${mvp.matches.length - 4} more)` : '';
      adjustments.push({
        description: `Food additives of concern (MVP registry, max −8): ${names.join(', ')}${extra}`,
        value: -mvp.elementDeduction,
        type: 'negative',
      });
      score -= mvp.elementDeduction;
    }
  }

  if (foodAdditivesApplied && hasRedBodyAdditive) {
    const before = score;
    score = Math.min(score, BODY_RED_ADDITIVE_SCORE_CEILING);
    if (score < before) {
      redAdditiveCeilingApplied = true;
      adjustments.push({
        description: 'Red-tier additive present: Body Pillar ceiling 12/25',
        value: score - before,
        type: 'negative',
      });
    }
  }

  score = Math.max(2, Math.min(25, Math.round(score)));

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
      ...adj,
      dataSource: adj.description.includes('Nutri-Score') ? 'OFF' : undefined,
    })),
    result.details
  );

  return result;
}
