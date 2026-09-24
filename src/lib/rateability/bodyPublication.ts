/**
 * Body publication / Confidence (§4).
 * Additives never participate in Rateability or Confidence.
 */

import type { Product } from '../../types/product';
import type { BodyPillarResult } from '../truscoreEngine/pillars/bodyPillar';
import { formatS26Explanation } from './s26Copy';
import { applyAuthoritativeHighUplift, defaultProductSourceQuality } from './sourceQuality';
import type {
  AuthoritativeLaneOverrides,
  BodyLaneState,
  BodyPublicationResult,
  BodyS26Code,
  ConfidenceLevel,
  ContributionOpportunity,
} from './types';

function nutritionLaneResolved(product: Product, body: BodyPillarResult): boolean {
  if (body.details.wholeProduceAdjustmentApplied) return true;
  if (!body.details.hasNutriScore) return false;
  const g = (body.details.nutriscoreGrade || product.nutriscore_grade || '').toLowerCase();
  return g === 'a' || g === 'b' || g === 'c' || g === 'd' || g === 'e';
}

function processingLaneResolved(product: Product, body: BodyPillarResult): boolean {
  const nova = product.nova_group;
  if (nova === 1 || nova === 2 || nova === 3 || nova === 4) return true;
  // Inferred / OFF NOVA 1 may be stamped via adjustments even if nova_group cleared anomalously
  return body.adjustments.some(
    (a) =>
      a.id === 'body-v12-nova-1-off' ||
      a.id === 'body-v12-nova-1-inferred' ||
      a.id === 'body-v12-nova-1-unknown' ||
      a.id === 'body-v12-nova-2' ||
      a.id === 'body-v12-nova-3' ||
      a.id === 'body-v12-nova-4'
  );
}

function bodyContributionOpportunity(
  nutrition: BodyLaneState,
  processing: BodyLaneState
): ContributionOpportunity | undefined {
  if (nutrition === 'resolved' && processing === 'resolved') return undefined;
  return {
    material: true,
    domain: 'ingredients_nutrition',
    routeStatus: 'live',
    routeKey: 'ingredients_nutrition',
  };
}

function resolveBodyS26(
  nutrition: BodyLaneState,
  processing: BodyLaneState,
  confidence: ConfidenceLevel | null,
  rated: boolean
): BodyS26Code {
  if (!rated) return 'BODY_NR';
  if (confidence === 'high') return 'BODY_HIGH';
  if (confidence === 'moderate') return 'BODY_MODERATE';
  if (nutrition === 'resolved' && processing === 'unassessed') return 'BODY_LIMITED_NUTRITION_ONLY';
  if (nutrition === 'unassessed' && processing === 'resolved') return 'BODY_LIMITED_PROCESSING_ONLY';
  return 'BODY_LIMITED_NUTRITION_ONLY';
}

export function publishBodyPillar(args: {
  product: Product;
  body: BodyPillarResult;
  checking?: boolean;
  authoritative?: AuthoritativeLaneOverrides;
}): BodyPublicationResult {
  const { product, body, checking, authoritative } = args;
  const sourceQuality = defaultProductSourceQuality(product);
  const nutrition: BodyLaneState = nutritionLaneResolved(product, body) ? 'resolved' : 'unassessed';
  const processing: BodyLaneState = processingLaneResolved(product, body)
    ? 'resolved'
    : 'unassessed';

  if (checking) {
    return {
      publicationStatus: 'checking',
      internalScore: body.score,
      publishedScore: null,
      confidence: null,
      sourceQuality,
      s26: null,
      confidenceReasonCode: 'checking',
      assessmentLanes: { nutrition, processing },
      diagnostic: { nutrition, processing, additivesIgnoredForRateability: true },
    };
  }

  const nutritionAuth = !!authoritative?.bodyNutrition;
  const processingAuth = !!authoritative?.bodyProcessing;

  if (nutrition === 'unassessed' && processing === 'unassessed') {
    const opp = bodyContributionOpportunity(nutrition, processing);
    return {
      publicationStatus: 'nr',
      internalScore: body.score,
      publishedScore: null,
      confidence: null,
      sourceQuality,
      s26: {
        code: 'BODY_NR',
        copyStatus: 'provisional_awaiting_founder_approval',
        explanation: formatS26Explanation('BODY_NR'),
        contributionOpportunity: opp,
      },
      confidenceReasonCode: 'body_nr_no_lanes',
      assessmentLanes: { nutrition, processing },
      diagnostic: { nutrition, processing, additivesIgnoredForRateability: true },
    };
  }

  let structural: ConfidenceLevel =
    nutrition === 'resolved' && processing === 'resolved' ? 'moderate' : 'limited';
  const confidence = applyAuthoritativeHighUplift({
    structural: structural === 'moderate' && nutritionAuth && processingAuth ? 'high' : structural,
    bothLanesResolved: nutrition === 'resolved' && processing === 'resolved',
    laneAAuthoritative: nutritionAuth,
    laneBAuthoritative: processingAuth,
  });

  const code = resolveBodyS26(nutrition, processing, confidence, true);
  const opp = bodyContributionOpportunity(nutrition, processing);

  return {
    publicationStatus: 'rated',
    internalScore: body.score,
    publishedScore: body.score,
    confidence,
    sourceQuality,
    s26: {
      code,
      copyStatus: 'provisional_awaiting_founder_approval',
      explanation: formatS26Explanation(code),
      ...(opp ? { contributionOpportunity: opp } : {}),
    },
    confidenceReasonCode:
      confidence === 'high'
        ? 'body_both_lanes_authoritative'
        : confidence === 'moderate'
          ? 'body_both_lanes'
          : nutrition === 'resolved'
            ? 'body_nutrition_only'
            : 'body_processing_only',
    assessmentLanes: { nutrition, processing },
    diagnostic: {
      nutrition,
      processing,
      additivesIgnoredForRateability: true,
      nutritionAuthoritative: nutritionAuth,
      processingAuthoritative: processingAuth,
    },
  };
}
