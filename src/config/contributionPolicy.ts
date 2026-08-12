/**
 * Wave 4 — central contribution governance policy (MVP).
 *
 * Single typed config contract. UI, API handlers, merge, and scoring consumers
 * must read thresholds from here. Not a generic rules engine.
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

export const CONTRIBUTION_POLICY = {
  ingredientsNutrition: {
    personalProvisionalScoring: false,
    communityVerificationApplicable: false,
    localSubmittedEvidenceCrossUserScoring: false,
    canonicalScoringFromLocalContribution: false,
    authorityRoute: 'off_public_product_retrieval' as const,
  },
  origins: {
    continuedConfirmationAfterPromotion: true,
    independentConfirmationsRequired: 1,
    activeResponsesPerContributorPerEvidenceVersion: 1,
    independentDisputesTriggeringReviewRequired: 2,
    automaticWithdrawal: false,
    founderAdminOverrideSupported: true,
    personalProvisionalScoring: false,
    canonicalPromotionPermission: false,
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
    canonicalPromotionPermission: true,
  },
} as const;

export type ContributionPolicy = typeof CONTRIBUTION_POLICY;

export function getDomainPolicy(domain: ContributionDomain) {
  if (domain === 'ingredients_nutrition') return CONTRIBUTION_POLICY.ingredientsNutrition;
  if (domain === 'origins') return CONTRIBUTION_POLICY.origins;
  return CONTRIBUTION_POLICY.certifications;
}

export function getCommunityVerificationPolicy(domain: 'origins' | 'certifications') {
  return domain === 'origins' ? CONTRIBUTION_POLICY.origins : CONTRIBUTION_POLICY.certifications;
}
