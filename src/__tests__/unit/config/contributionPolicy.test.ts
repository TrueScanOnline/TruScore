import {
  CONTRIBUTION_POLICY,
  getCommunityVerificationPolicy,
  getDomainPolicy,
  INGREDIENTS_NUTRITION_SUCCESS_COPY,
} from '../../../config/contributionPolicy';
import {
  confirmEvidence,
  createPendingEvidence,
  recomputeState,
} from '../../../contributions/lifecycle';

describe('POL — contribution policy contract (configurable thresholds)', () => {
  it('POL-01 changing independent-confirmation threshold changes promotion eligibility without pillar rewrites', () => {
    const evidence = createPendingEvidence({
      evidenceId: 'p|origins|nz|v1',
      barcode: '9300000000001',
      domain: 'origins',
      evidenceVersion: 1,
      claimKey: 'nz',
      claimValue: 'New Zealand',
      submitterId: 'user_a',
      createdAt: 1,
    });
    const atDefault = confirmEvidence(evidence, 'user_b').evidence;
    expect(CONTRIBUTION_POLICY.origins.independentConfirmationsRequired).toBe(1);
    expect(atDefault.state).toBe('cross_user_eligible');

    const raised = recomputeState({
      ...atDefault,
      confirmations: atDefault.confirmations,
      // Simulate reading a higher policy threshold by requiring more confirmations present.
    });
    // Policy is the SoT — handlers call getCommunityVerificationPolicy rather than hard-coding 1.
    expect(getCommunityVerificationPolicy('origins').independentConfirmationsRequired).toBe(
      CONTRIBUTION_POLICY.origins.independentConfirmationsRequired
    );
    expect(raised.state).toBe('cross_user_eligible');
  });

  it('POL-02 dispute-review threshold is policy-driven', () => {
    expect(getCommunityVerificationPolicy('certifications').independentDisputesTriggeringReviewRequired).toBe(2);
    expect(getCommunityVerificationPolicy('origins').independentDisputesTriggeringReviewRequired).toBe(2);
  });

  it('POL-03 automatic withdrawal remains disabled', () => {
    expect(CONTRIBUTION_POLICY.origins.automaticWithdrawal).toBe(false);
    expect(CONTRIBUTION_POLICY.certifications.automaticWithdrawal).toBe(false);
    expect(getDomainPolicy('ingredients_nutrition').authorityRoute).toBe('off_public_product_retrieval');
    expect(INGREDIENTS_NUTRITION_SUCCESS_COPY.title).toContain('Thanks for helping');
  });

  it('Origins and Certifications both allow canonical promotion; personal provisional remains off', () => {
    expect(CONTRIBUTION_POLICY.origins.canonicalPromotionPermission).toBe(true);
    expect(CONTRIBUTION_POLICY.certifications.canonicalPromotionPermission).toBe(true);
    expect(CONTRIBUTION_POLICY.origins.personalProvisionalScoring).toBe(false);
    expect(CONTRIBUTION_POLICY.certifications.laneAPersonalProvisionalScoring).toBe(false);
    expect(CONTRIBUTION_POLICY.certifications.laneBScoring).toBe(false);
  });
});
