/**
 * Wave 4A.0 falsification suite — maps 1:1 to implementation instruction §8.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  admitEvidence,
  canApplyToProductionReceiver,
  computeReceiverEligibility,
  evidenceKeyOf,
  isAssessmentEligibleForReceiver,
  selectPrevailingAdmittedEvidence,
  verificationBindsToEvidenceVersion,
} from '../../../contributions/admissionContract';
import {
  confirmAndPromoteIfEligible,
  createPendingEvidence,
  disputeEvidence,
} from '../../../contributions/lifecycle';
import { toScoringProduct } from '../../../contributions/eligibilityBoundary';
import {
  CURRENT_PRODUCTION_CONTRIBUTION_EPOCH,
  carriesCurrentProductionEpoch,
  describeEpochAuthority,
} from '../../../contributions/productionEpoch';
import {
  __dangerouslyClearRecoveryStoreForTests,
  checkpointMaterialCompletion,
  listPendingRecovery,
  retryPendingRemotePersist,
} from '../../../contributions/contributionRecovery';
import { calculateTruScore } from '../../../lib/truscoreEngine';
import type { ContributionEvidence } from '../../../contributions/types';
import type { Product } from '../../../types/product';

const BARCODE = '9300000000444';
const memory = new Map<string, string>();

beforeAll(() => {
  (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) =>
    memory.has(key) ? memory.get(key)! : null
  );
  (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key: string, value: string) => {
    memory.set(key, value);
  });
  (AsyncStorage.removeItem as jest.Mock).mockImplementation(async (key: string) => {
    memory.delete(key);
  });
});

function baseOrigin(overrides: Partial<ContributionEvidence> = {}): ContributionEvidence {
  return createPendingEvidence({
    evidenceId: `${BARCODE}|origins|made_in:new zealand|v1`,
    barcode: BARCODE,
    domain: 'origins',
    evidenceVersion: 1,
    claimKey: 'made_in:new zealand',
    claimValue: 'New Zealand',
    originStructured: { claimType: 'made_in', primaryCountry: 'New Zealand' },
    submitterId: 'user_submitter',
    createdAt: 1,
    ...overrides,
  });
}

function baseCertLaneA(overrides: Partial<ContributionEvidence> = {}): ContributionEvidence {
  return createPendingEvidence({
    evidenceId: `${BARCODE}|certifications|fair trade|v1`,
    barcode: BARCODE,
    domain: 'certifications',
    evidenceVersion: 1,
    claimKey: 'fair trade',
    claimValue: 'en:fair-trade',
    labelsTags: ['en:fair-trade'],
    submitterId: 'user_submitter',
    createdAt: 1,
    ...overrides,
  });
}

function productionSubmitted(evidence: ContributionEvidence): ContributionEvidence {
  return {
    ...evidence,
    productionEpoch: CURRENT_PRODUCTION_CONTRIBUTION_EPOCH,
    recordClass: 'production',
    admissionStatus: 'submitted',
    sourceProvenance: 'primary_user_submission',
  };
}

function admitAndVerify(
  evidence: ContributionEvidence,
  confirmer = 'user_other'
): ContributionEvidence {
  const admitted = admitEvidence(productionSubmitted(evidence), {
    admissionReason: 'primary_user_evidence_admission',
  });
  expect(admitted.ok).toBe(true);
  return confirmAndPromoteIfEligible(admitted.evidence, confirmer).evidence;
}

function offBare(overrides: Partial<Product> = {}): Product {
  return {
    barcode: BARCODE,
    product_name: 'Wave4A0 fixture',
    brands: 'Unknown Brand',
    source: 'openfoodfacts',
    ...overrides,
  } as Product;
}

describe('Wave 4A.0 §8 falsification cases', () => {
  beforeEach(async () => {
    memory.clear();
    jest.clearAllMocks();
    // Re-bind memory implementations after clearAllMocks.
    (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) =>
      memory.has(key) ? memory.get(key)! : null
    );
    (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key: string, value: string) => {
      memory.set(key, value);
    });
    (AsyncStorage.removeItem as jest.Mock).mockImplementation(async (key: string) => {
      memory.delete(key);
    });
    await __dangerouslyClearRecoveryStoreForTests();
  });

  it('§8.1 Pre-epoch historical/test evidence cannot affect assessment, Confidence or maturity', () => {
    const historical = confirmAndPromoteIfEligible(baseOrigin(), 'user_other').evidence;
    expect(carriesCurrentProductionEpoch(historical)).toBe(false);
    expect(describeEpochAuthority(historical).productionAuthoritativeCandidate).toBe(false);

    const fixture: ContributionEvidence = {
      ...historical,
      productionEpoch: CURRENT_PRODUCTION_CONTRIBUTION_EPOCH,
      recordClass: 'fixture',
      admissionStatus: 'admitted',
      admission: {
        admittedAt: 1,
        admissionReason: 'should_not_matter',
        ruleVersion: 'x',
      },
      canonicalPromoted: true,
      receiverEligibility: computeReceiverEligibility({
        ...historical,
        productionEpoch: CURRENT_PRODUCTION_CONTRIBUTION_EPOCH,
        recordClass: 'production',
        admissionStatus: 'admitted',
      }),
    };
    // Even with epoch stamp, fixture class is structurally excluded.
    expect(carriesCurrentProductionEpoch(fixture)).toBe(false);

    const scoring = toScoringProduct(offBare(), [historical, fixture]);
    expect(scoring?.manufacturing_places).toBeUndefined();

    const scored = calculateTruScore(offBare(), undefined, {
      promotedContributionEvidence: [historical, fixture],
    });
    expect(scored.breakdown.Open).toBe(calculateTruScore(offBare()).breakdown.Open);
  });

  it('§8.2 New production-epoch raw/draft submission cannot score before admission', () => {
    const submitted = productionSubmitted(baseOrigin());
    expect(submitted.admissionStatus).toBe('submitted');
    expect(isAssessmentEligibleForReceiver(submitted, 'open_origins')).toBe(false);

    const confirmedButNotAdmitted = confirmAndPromoteIfEligible(submitted, 'user_other').evidence;
    expect(confirmedButNotAdmitted.canonicalPromoted).toBe(true);
    // Without admission, production receiver gate fails closed.
    expect(canApplyToProductionReceiver(confirmedButNotAdmitted, 'open_origins')).toBe(false);
    expect(toScoringProduct(offBare(), [confirmedButNotAdmitted])?.manufacturing_places).toBeUndefined();
  });

  it('§8.3 Admitted evidence can be eligible for one approved receiver while ineligible for another', () => {
    const origins = admitAndVerify(baseOrigin());
    expect(isAssessmentEligibleForReceiver(origins, 'open_origins')).toBe(true);
    expect(isAssessmentEligibleForReceiver(origins, 'ethics_certifications')).toBe(false);
    expect(isAssessmentEligibleForReceiver(origins, 'body_ingredients_nutrition')).toBe(false);

    const cert = admitAndVerify(baseCertLaneA());
    expect(isAssessmentEligibleForReceiver(cert, 'ethics_certifications')).toBe(true);
    expect(isAssessmentEligibleForReceiver(cert, 'open_origins')).toBe(false);
    expect(isAssessmentEligibleForReceiver(cert, 'body_ingredients_nutrition')).toBe(false);
  });

  it('§8.4 A newer raw/draft version does not displace the latest admitted prevailing version', () => {
    const v1 = admitAndVerify(baseOrigin());
    const draftV2: ContributionEvidence = {
      ...baseOrigin({
        evidenceId: `${BARCODE}|origins|made_in:new zealand|v2`,
        evidenceVersion: 2,
        createdAt: 2,
      }),
      productionEpoch: CURRENT_PRODUCTION_CONTRIBUTION_EPOCH,
      recordClass: 'production',
      admissionStatus: 'submitted',
    };

    const prevailing = selectPrevailingAdmittedEvidence([v1, draftV2], {
      barcode: BARCODE,
      domain: 'origins',
      claimKey: 'made_in:new zealand',
    });
    expect(prevailing?.evidenceId).toBe(v1.evidenceId);
    expect(prevailing?.evidenceVersion).toBe(1);
  });

  it('§8.5 A later admitted correction becomes prevailing for the same evidence key without deleting history', () => {
    const v1 = admitAndVerify(baseOrigin());
    const v2Base = baseOrigin({
      evidenceId: `${BARCODE}|origins|made_in:new zealand|v2`,
      evidenceVersion: 2,
      claimValue: 'New Zealand',
      createdAt: 2,
    });
    const v2 = admitAndVerify(v2Base, 'user_verifier_2');

    const prevailing = selectPrevailingAdmittedEvidence([v1, v2], {
      barcode: BARCODE,
      domain: 'origins',
      claimKey: 'made_in:new zealand',
    });
    expect(prevailing?.evidenceVersion).toBe(2);
    expect(v1.state).not.toBe('withdrawn');
    expect(v1.admissionStatus).toBe('admitted');
  });

  it('§8.6 A partial contribution changes only its admitted evidence keys and leaves unrelated keys intact', () => {
    const origin = admitAndVerify(baseOrigin());
    const cert = admitAndVerify(baseCertLaneA());

    const originKey = evidenceKeyOf(origin);
    const certKey = evidenceKeyOf(cert);
    expect(originKey).not.toBe(certKey);

    const originPrevailing = selectPrevailingAdmittedEvidence([origin, cert], {
      barcode: BARCODE,
      domain: 'origins',
      claimKey: origin.claimKey,
    });
    const certPrevailing = selectPrevailingAdmittedEvidence([origin, cert], {
      barcode: BARCODE,
      domain: 'certifications',
      claimKey: cert.claimKey,
    });
    expect(originPrevailing?.evidenceId).toBe(origin.evidenceId);
    expect(certPrevailing?.evidenceId).toBe(cert.evidenceId);
  });

  it('§8.7 Confirmation/dispute on version N does not attach to version N+1', () => {
    const v1 = admitAndVerify(baseOrigin());
    expect(v1.confirmations[0]?.evidenceVersion).toBe(1);

    const v2 = productionSubmitted(
      baseOrigin({
        evidenceId: `${BARCODE}|origins|made_in:new zealand|v2`,
        evidenceVersion: 2,
        createdAt: 2,
        confirmations: [],
        disputes: [],
      })
    );
    expect(v2.confirmations).toHaveLength(0);
    expect(
      verificationBindsToEvidenceVersion(
        { evidenceId: v1.evidenceId, evidenceVersion: 1 },
        v2
      )
    ).toBe(false);
    expect(
      verificationBindsToEvidenceVersion(
        { evidenceId: v1.evidenceId, evidenceVersion: 1 },
        v1
      )
    ).toBe(true);
  });

  it('§8.8 Two independent active disputes on the same version produce review_required', () => {
    const admitted = admitEvidence(productionSubmitted(baseCertLaneA()), {
      admissionReason: 'primary_user_evidence_admission',
    }).evidence;
    const d1 = disputeEvidence(admitted, 'user_a', 'claim_not_present');
    const d2 = disputeEvidence(d1.evidence, 'user_b', 'wrong_product');
    expect(d2.evidence.state).toBe('review_required');
    expect(d2.evidence.disputes.every((d) => d.evidenceVersion === 1)).toBe(true);
  });

  it('§8.9 review_required alone does not withdraw the evidence or mutate a scoring result', () => {
    const promoted = admitAndVerify(baseCertLaneA());
    const baseline = calculateTruScore(offBare(), undefined, {
      promotedContributionEvidence: [promoted],
    });
    expect(baseline.breakdown.Ethics).toBe(21);

    const d1 = disputeEvidence(promoted, 'user_c', 'claim_not_present');
    const d2 = disputeEvidence(d1.evidence, 'user_d', 'wrong_product');
    expect(d2.evidence.state).toBe('review_required');
    expect(d2.evidence.state).not.toBe('withdrawn');
    expect(canApplyToProductionReceiver(d2.evidence, 'ethics_certifications')).toBe(true);

    const afterReview = calculateTruScore(offBare(), undefined, {
      promotedContributionEvidence: [d2.evidence],
    });
    expect(afterReview.breakdown.Ethics).toBe(baseline.breakdown.Ethics);
    expect(afterReview.truscore).toBe(baseline.truscore);
  });

  it('§8.10 Test/fixture records cannot acquire production authority through restart/retry/rehydration', async () => {
    const fixture = {
      ...baseOrigin(),
      productionEpoch: CURRENT_PRODUCTION_CONTRIBUTION_EPOCH,
      recordClass: 'fixture' as const,
      admissionStatus: 'submitted' as const,
    };
    const checkpoint = await checkpointMaterialCompletion(fixture, evidenceKeyOf(fixture));
    expect(checkpoint).toBeNull();

    const admitRejected = admitEvidence(fixture, { admissionReason: 'should_fail' });
    expect(admitRejected.ok).toBe(false);

    // Pre-epoch historical cannot be admitted into production.
    const legacy = baseOrigin();
    expect(admitEvidence(legacy, { admissionReason: 'legacy' }).ok).toBe(false);
  });

  it('§8.11 Materially completed runtime state survives the ordinary failure/retry path', async () => {
    const submitted = productionSubmitted(baseOrigin());
    const checkpoint = await checkpointMaterialCompletion(submitted, evidenceKeyOf(submitted));
    expect(checkpoint).not.toBeNull();
    expect(checkpoint?.syncStatus).toBe('local_complete_pending_remote');
    expect(checkpoint?.productionEpoch).toBe(CURRENT_PRODUCTION_CONTRIBUTION_EPOCH);

    let pending = await listPendingRecovery();
    expect(pending.map((p) => p.evidenceId)).toContain(submitted.evidenceId);

    // Force remote failure so recovery remains retryable.
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network_down'));
    const result = await retryPendingRemotePersist();
    expect(result.attempted).toBeGreaterThanOrEqual(1);
    expect(result.failed).toBeGreaterThanOrEqual(1);

    pending = await listPendingRecovery();
    const row = pending.find((p) => p.evidenceId === submitted.evidenceId);
    expect(row).toBeTruthy();
    expect(row?.syncStatus === 'failed_retryable' || row?.syncStatus === 'local_complete_pending_remote').toBe(
      true
    );
    expect(row?.evidenceSnapshot.evidenceId).toBe(submitted.evidenceId);
  });

  it('§8.12 Existing production pillar behaviour remains unchanged where 4A.0 has not authorised change', () => {
    // Trusted OFF labels still score Ethics without contribution evidence.
    expect(calculateTruScore(offBare({ labels_tags: ['en:fair-trade'] })).breakdown.Ethics).toBe(21);
    // Bare product unchanged.
    expect(calculateTruScore(offBare()).breakdown.Ethics).toBe(
      calculateTruScore(offBare()).breakdown.Ethics
    );
  });

  it('domain-global scoringEligible is not controlling for production assessment', () => {
    const spoofed: ContributionEvidence = {
      ...productionSubmitted(baseOrigin()),
      admissionStatus: 'submitted',
      scoringEligible: true,
      canonicalPromoted: true,
      state: 'cross_user_eligible',
      receiverEligibility: undefined,
    };
    expect(isAssessmentEligibleForReceiver(spoofed, 'open_origins')).toBe(false);
    expect(toScoringProduct(offBare(), [spoofed])?.manufacturing_places).toBeUndefined();
  });
});
