/**
 * Body shadow orchestration — offline validation only.
 */

import type { Product } from '../../../types/product';
import { calculateBodyPillar } from '../pillars/bodyPillar';
import {
  evaluateLocalNutriScoreFromOffProduct,
  offGradeForComparison,
} from './nutriScore2023/offEvidenceMapper';
import type { NutriScore2023Outcome, ShadowClassification } from './nutriScore2023/types';
import {
  evaluateWholeProduceCandidate,
  shadowBodyScoreEstimate,
} from './wholeProduce';
import { classifyMissingOffGradeProduct } from './nutriScore2023/offEvidenceMapper';

export type BodyShadowRow = {
  gtin: string;
  productName: string | null;
  offGrade: string | null;
  localGrade: string | null;
  localNumericScore: number | null;
  branch: string | null;
  classification: ShadowClassification;
  unresolvedReason?: string;
  exactMatch: boolean | null;
  productionBodyScore: number;
  shadowBodyScoreEstimate: number;
  wholeProduceCandidate: boolean;
  completeOutcomeKind: NutriScore2023Outcome['kind'] | null;
};

export function evaluateBodyShadowRow(product: Product): BodyShadowRow {
  const gtin = product.barcode ?? '';
  const offGrade = offGradeForComparison(product);
  const local = evaluateLocalNutriScoreFromOffProduct(product);
  const wholeProduce = evaluateWholeProduceCandidate(product);

  let localGrade: string | null = null;
  let localNumericScore: number | null = null;
  let completeOutcomeKind: NutriScore2023Outcome['kind'] | null = null;

  const outcome = local.boundsOutcome ?? local.completeOutcome;
  if (outcome?.kind === 'calculated') {
    localGrade = outcome.grade;
    localNumericScore = outcome.numericScore;
    completeOutcomeKind = outcome.kind;
  } else if (outcome?.kind === 'bounds_invariant_grade') {
    localGrade = outcome.grade;
    completeOutcomeKind = outcome.kind;
  }

  let classification: ShadowClassification = local.classification;
  if (offGrade && localGrade) {
    classification = local.classification;
  } else if (offGrade && !localGrade) {
    classification = 'OFF_GRADE_PRESENT_NO_LOCAL_RECOVERY';
  } else if (!offGrade) {
    classification = classifyMissingOffGradeProduct(product);
  }

  const productionBody = calculateBodyPillar(product).score;
  const shadowEstimate = shadowBodyScoreEstimate({
    product,
    localGrade,
    offGrade,
    wholeProduceCandidate: wholeProduce.candidate,
  });

  const exactMatch =
    offGrade && localGrade ? offGrade.toLowerCase() === localGrade.toLowerCase() : null;

  return {
    gtin,
    productName: product.product_name ?? product.product_name_en ?? null,
    offGrade,
    localGrade,
    localNumericScore,
    branch: local.mapped.inputs?.branch ?? null,
    classification,
    unresolvedReason: local.unresolvedReason,
    exactMatch,
    productionBodyScore: productionBody,
    shadowBodyScoreEstimate: shadowEstimate,
    wholeProduceCandidate: wholeProduce.candidate,
    completeOutcomeKind,
  };
}

export const BODY_SHADOW_MODULE_VERSION = '20260830-offline-v1';

export const METHODOLOGY_SOURCES = [
  'Santé publique France — Nutri-Score (current page, consulted 2026-08-30)',
  'Conditions of Use — Exhibit 1B Specifications of the Updated Algorithm',
  'Scientific and Technical Q&A — Updated Algorithm',
  'Nutri-Score Scientific Committee 2022 (solid foods) / 2023 (beverages) final reports',
  'Open Food Facts nutriscore.2023 branch metadata (mapping reference only, not methodology authority)',
];
