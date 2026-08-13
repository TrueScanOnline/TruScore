import {
  CONTRIBUTION_POLICY,
  getCommunityVerificationPolicy,
  getCommunityVerificationThresholds,
  getDomainPolicy,
  INGREDIENTS_NUTRITION_SUCCESS_COPY,
  resolveVerificationLifecycleState,
} from '../../../config/contributionPolicy';
import {
  confirmEvidence,
  createPendingEvidence,
} from '../../../contributions/lifecycle';
import { buildVercelManualProductPayload } from '../../../utils/vercelProprietaryManualProduct';
import type { ManualProductData } from '../../../types/manualProduct';

describe('POL — contribution policy contract (configurable thresholds)', () => {
  it('POL-01 changing independent-confirmation threshold changes promotion eligibility without pillar/handler rewrites', () => {
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

    // Same transition helper used by backend contribution-evidence — raise threshold without editing the endpoint.
    const mvpThresholds = getCommunityVerificationThresholds('origins');
    expect(
      resolveVerificationLifecycleState({
        currentState: 'pending',
        independentConfirmationCount: 1,
        independentDisputeCount: 0,
        thresholds: mvpThresholds,
      })
    ).toBe('cross_user_eligible');

    const raised = {
      ...mvpThresholds,
      independentConfirmationsRequired: 2,
    };
    expect(
      resolveVerificationLifecycleState({
        currentState: 'pending',
        independentConfirmationCount: 1,
        independentDisputeCount: 0,
        thresholds: raised,
      })
    ).toBe('pending');
    expect(
      resolveVerificationLifecycleState({
        currentState: 'pending',
        independentConfirmationCount: 2,
        independentDisputeCount: 0,
        thresholds: raised,
      })
    ).toBe('cross_user_eligible');
  });

  it('POL-02 changing dispute-review threshold changes review behaviour without pillar/handler rewrites', () => {
    const mvp = getCommunityVerificationThresholds('certifications');
    expect(mvp.independentDisputesTriggeringReviewRequired).toBe(2);
    expect(
      resolveVerificationLifecycleState({
        currentState: 'cross_user_eligible',
        independentConfirmationCount: 1,
        independentDisputeCount: 2,
        thresholds: mvp,
      })
    ).toBe('review_required');

    const raised = { ...mvp, independentDisputesTriggeringReviewRequired: 3 };
    expect(
      resolveVerificationLifecycleState({
        currentState: 'cross_user_eligible',
        independentConfirmationCount: 1,
        independentDisputeCount: 2,
        thresholds: raised,
      })
    ).toBe('cross_user_eligible');
    expect(
      resolveVerificationLifecycleState({
        currentState: 'cross_user_eligible',
        independentConfirmationCount: 1,
        independentDisputeCount: 3,
        thresholds: raised,
      })
    ).toBe('review_required');
  });

  it('POL-03 automatic withdrawal remains disabled; continuing confirmation remains policy-enabled', () => {
    expect(CONTRIBUTION_POLICY.origins.automaticWithdrawal).toBe(false);
    expect(CONTRIBUTION_POLICY.certifications.automaticWithdrawal).toBe(false);
    expect(getCommunityVerificationThresholds('origins').automaticWithdrawal).toBe(false);
    expect(getCommunityVerificationThresholds('origins').continuedConfirmationAfterPromotion).toBe(
      true
    );
    expect(getDomainPolicy('ingredients_nutrition').authorityRoute).toBe('off_public_product_retrieval');
    expect(INGREDIENTS_NUTRITION_SUCCESS_COPY.title).toContain('Thanks for helping');
  });

  it('POL-04 backend evidence transitions use the same policy SoT as client lifecycle (no hardcoded 1/2 in handler path)', () => {
    // Mirrors contribution-evidence.ts: thresholds from getCommunityVerificationThresholds + resolveVerificationLifecycleState.
    const origins = getCommunityVerificationThresholds('origins');
    const certs = getCommunityVerificationThresholds('certifications');
    expect(origins.independentConfirmationsRequired).toBe(
      getCommunityVerificationPolicy('origins').independentConfirmationsRequired
    );
    expect(certs.independentDisputesTriggeringReviewRequired).toBe(
      getCommunityVerificationPolicy('certifications').independentDisputesTriggeringReviewRequired
    );

    // Simulate backend confirm path after one independent confirmation.
    expect(
      resolveVerificationLifecycleState({
        currentState: 'pending',
        independentConfirmationCount: 1,
        independentDisputeCount: 0,
        thresholds: origins,
      })
    ).toBe('cross_user_eligible');

    // Simulate backend dispute path after two independent disputes.
    expect(
      resolveVerificationLifecycleState({
        currentState: 'cross_user_eligible',
        independentConfirmationCount: 1,
        independentDisputeCount: 2,
        thresholds: certs,
      })
    ).toBe('review_required');
  });

  it('Origins and Certifications both allow canonical promotion; personal provisional remains off', () => {
    expect(CONTRIBUTION_POLICY.origins.canonicalPromotionPermission).toBe(true);
    expect(CONTRIBUTION_POLICY.certifications.canonicalPromotionPermission).toBe(true);
    expect(CONTRIBUTION_POLICY.origins.personalProvisionalScoring).toBe(false);
    expect(CONTRIBUTION_POLICY.certifications.laneAPersonalProvisionalScoring).toBe(false);
    expect(CONTRIBUTION_POLICY.certifications.laneBScoring).toBe(false);
  });
});

describe('P3 — Origins/Certifications do not duplicate onto manual-products', () => {
  it('origin/cert-only Manual Edit payload does not produce a legacy proprietary Vercel body', () => {
    const payload = buildVercelManualProductPayload({
      barcode: '9300000000111',
      product_name: 'Origin cert only',
      timestamp: 1,
      manufacturing_places: 'New Zealand',
      countries: 'New Zealand',
      labels_tags: ['en:fair-trade'],
      labels_hierarchy: ['en:fair-trade'],
    } as ManualProductData);
    expect(Object.keys(payload)).toEqual([]);
  });

  it('allergens/additives remain the only residual manual-products proprietary fields', () => {
    const payload = buildVercelManualProductPayload({
      barcode: '9300000000112',
      product_name: 'Allergen residual',
      timestamp: 1,
      manufacturing_places: 'Australia',
      labels_tags: ['en:organic'],
      allergens_tags: ['en:milk'],
      additives_tags: ['en:e330'],
    } as ManualProductData);
    expect(Object.keys(payload).sort()).toEqual(['additives_tags', 'allergens_tags']);
    expect(payload).not.toHaveProperty('manufacturing_places');
    expect(payload).not.toHaveProperty('labels_tags');
  });
});
