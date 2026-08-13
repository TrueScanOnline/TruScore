/**
 * Wave 4 — central contribution governance policy (MVP).
 *
 * Single typed config contract. UI, API handlers, merge, and scoring consumers
 * must read thresholds from here. Not a generic rules engine.
 *
 * Runtime-neutral: safe for React Native and Vercel Node (no platform imports).
 */

export const CONTRIBUTION_DOMAINS = ['ingredients_nutrition', 'origins', 'certifications'] as const;
export type ContributionDomain = (typeof CONTRIBUTION_DOMAINS)[number];

export const CONTRIBUTION_LIFECYCLE_STATES = [
  'pending',
  'cross_user_eligible',
  'review_required',
  'superseded',
  'withdrawn',
] as const;
export type ContributionLifecycleState = (typeof CONTRIBUTION_LIFECYCLE_STATES)[number];

export const CONTRIBUTION_DISPUTE_REASONS = [
  'claim_not_present',
  'wording_differs',
  'information_appears_changed',
  'wrong_product',
  'other',
] as const;
export type ContributionDisputeReason = (typeof CONTRIBUTION_DISPUTE_REASONS)[number];

export const ORIGIN_CLAIM_TYPES = [
  'made_in',
  'produced_in',
  'grown_in',
  'packed_in',
  'processed_in',
  'other',
] as const;
export type OriginClaimType = (typeof ORIGIN_CLAIM_TYPES)[number];

export const ORIGIN_PERCENTAGE_QUALIFIERS = [
  'at_least',
  'exactly',
  'more_than',
  'less_than',
  'other_unclear',
] as const;
export type OriginPercentageQualifier = (typeof ORIGIN_PERCENTAGE_QUALIFIERS)[number];

/**
 * Founder-approved Ingredients & Nutrition success response direction.
 * Successful submission does not trigger immediate Rveel scoring.
 */
export const INGREDIENTS_NUTRITION_SUCCESS_COPY = {
  title: 'Thanks for helping improve this product.',
  body:
    "We've sent your contribution to Open Food Facts. Once the updated information is available through their public product record, Rveel can use it in a future scan.",
} as const;

export const CONTRIBUTION_POLICY = {
  ingredientsNutrition: {
    personalProvisionalScoring: false,
    communityVerificationApplicable: false,
    localSubmittedEvidenceCrossUserScoring: false,
    canonicalScoringFromLocalContribution: false,
    authorityRoute: 'off_public_product_retrieval' as const,
    successCopy: INGREDIENTS_NUTRITION_SUCCESS_COPY,
  },
  origins: {
    continuedConfirmationAfterPromotion: true,
    independentConfirmationsRequired: 1,
    activeResponsesPerContributorPerEvidenceVersion: 1,
    independentDisputesTriggeringReviewRequired: 2,
    automaticWithdrawal: false,
    founderAdminOverrideSupported: true,
    personalProvisionalScoring: false,
    /** Verified Origins may promote into the existing Open origin path. */
    canonicalPromotionPermission: true,
  },
  certifications: {
    continuedConfirmationAfterPromotion: true,
    independentConfirmationsRequired: 1,
    activeResponsesPerContributorPerEvidenceVersion: 1,
    independentDisputesTriggeringReviewRequired: 2,
    automaticWithdrawal: false,
    founderAdminOverrideSupported: true,
    laneAPersonalProvisionalScoring: false,
    laneBScoring: false,
    /** Lane A recognised schemes may promote; Lane B stays non-scoring. */
    canonicalPromotionPermission: true,
  },
} as const;

export type ContributionPolicy = typeof CONTRIBUTION_POLICY;

export type CommunityVerificationThresholds = {
  independentConfirmationsRequired: number;
  independentDisputesTriggeringReviewRequired: number;
  automaticWithdrawal: boolean;
  continuedConfirmationAfterPromotion: boolean;
};

export function getDomainPolicy(domain: ContributionDomain) {
  if (domain === 'ingredients_nutrition') return CONTRIBUTION_POLICY.ingredientsNutrition;
  if (domain === 'origins') return CONTRIBUTION_POLICY.origins;
  return CONTRIBUTION_POLICY.certifications;
}

export function getCommunityVerificationPolicy(domain: 'origins' | 'certifications') {
  return domain === 'origins' ? CONTRIBUTION_POLICY.origins : CONTRIBUTION_POLICY.certifications;
}

/** Threshold slice shared by client lifecycle and Vercel contribution-evidence. */
export function getCommunityVerificationThresholds(
  domain: 'origins' | 'certifications'
): CommunityVerificationThresholds {
  const policy = getCommunityVerificationPolicy(domain);
  return {
    independentConfirmationsRequired: policy.independentConfirmationsRequired,
    independentDisputesTriggeringReviewRequired: policy.independentDisputesTriggeringReviewRequired,
    automaticWithdrawal: policy.automaticWithdrawal,
    continuedConfirmationAfterPromotion: policy.continuedConfirmationAfterPromotion,
  };
}

/**
 * Pure lifecycle-state transition from confirmation/dispute counts.
 * Used by client lifecycle and backend contribution-evidence — one policy SoT.
 * Optional alternate `thresholds` exists so POL tests can prove configurability
 * without rewriting handlers.
 */
export function resolveVerificationLifecycleState(params: {
  currentState: string;
  independentConfirmationCount: number;
  independentDisputeCount: number;
  thresholds: CommunityVerificationThresholds;
}): ContributionLifecycleState | string {
  const { currentState, independentConfirmationCount, independentDisputeCount, thresholds } = params;
  if (currentState === 'superseded' || currentState === 'withdrawn') {
    return currentState;
  }
  if (independentDisputeCount >= thresholds.independentDisputesTriggeringReviewRequired) {
    return 'review_required';
  }
  if (independentConfirmationCount >= thresholds.independentConfirmationsRequired) {
    return 'cross_user_eligible';
  }
  return 'pending';
}
