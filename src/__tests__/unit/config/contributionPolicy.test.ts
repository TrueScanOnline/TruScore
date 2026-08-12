import {
  CONTRIBUTION_POLICY,
  getCommunityVerificationPolicy,
  getDomainPolicy,
} from '../../../config/contributionPolicy';

describe('POL — contribution policy contract', () => {
  it('POL-01 Origins: confirm/dispute thresholds and no canonical promotion', () => {
    const origins = CONTRIBUTION_POLICY.origins;
    expect(origins.independentConfirmationsRequired).toBe(1);
    expect(origins.activeResponsesPerContributorPerEvidenceVersion).toBe(1);
    expect(origins.independentDisputesTriggeringReviewRequired).toBe(2);
    expect(origins.automaticWithdrawal).toBe(false);
    expect(origins.founderAdminOverrideSupported).toBe(true);
    expect(origins.personalProvisionalScoring).toBe(false);
    expect(origins.canonicalPromotionPermission).toBe(false);
    expect(origins.continuedConfirmationAfterPromotion).toBe(true);
    expect(getCommunityVerificationPolicy('origins').canonicalPromotionPermission).toBe(false);
  });

  it('POL-02 Certifications: Lane A/B scoring off; promotion permission reserved', () => {
    const certs = CONTRIBUTION_POLICY.certifications;
    expect(certs.laneAPersonalProvisionalScoring).toBe(false);
    expect(certs.laneBScoring).toBe(false);
    expect(certs.canonicalPromotionPermission).toBe(true);
    expect(certs.independentConfirmationsRequired).toBe(1);
    expect(certs.independentDisputesTriggeringReviewRequired).toBe(2);
    expect(certs.automaticWithdrawal).toBe(false);
  });

  it('POL-03 Ingredients/Nutrition: local evidence never scores; authority is OFF read-back', () => {
    const nut = CONTRIBUTION_POLICY.ingredientsNutrition;
    expect(nut.personalProvisionalScoring).toBe(false);
    expect(nut.communityVerificationApplicable).toBe(false);
    expect(nut.localSubmittedEvidenceCrossUserScoring).toBe(false);
    expect(nut.canonicalScoringFromLocalContribution).toBe(false);
    expect(nut.authorityRoute).toBe('off_public_product_retrieval');
    expect(getDomainPolicy('ingredients_nutrition')).toBe(nut);
  });
});
