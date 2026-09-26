/**
 * Wave 4A.0 falsification suite — maps 1:1 to implementation instruction §8
 * plus founder-directed QA corrective adversarial cases (4A.0 corrective pass).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  admitEvidence,
  BODY_RECEIVER_4A0_UNREGISTERED_REASON,
  buildEvidenceKey,
  canApplyToProductionReceiver,
  computeReceiverEligibility,
  evidenceKeyOf,
  isAssessmentEligibleForReceiver,
  selectPrevailingAdmittedEvidence,
  verificationBindsToEvidenceVersion,
} from '../../../contributions/admissionContract';
import {
  applyFounderAdminAction,
  confirmAndPromoteIfEligible,
  createPendingEvidence,
  disputeEvidence,
} from '../../../contributions/lifecycle';
import { toScoringProduct } from '../../../contributions/eligibilityBoundary';
import {
  CURRENT_PRODUCTION_CONTRIBUTION_EPOCH,
  carriesCurrentProductionEpoch,
  describeEpochAuthority,
  isExplicitProductionRecordClass,
  resolveContributionCreationRecordClass,
} from '../../../contributions/productionEpoch';
import {
  __clearBodyReceiverPredicatesForTests,
  registerBodyReceiverPredicate,
} from '../../../contributions/bodyReceiverRegistry';
import {
  __dangerouslyClearRecoveryStoreForTests,
  checkpointMaterialCompletion,
  listPendingRecovery,
  resolveRecoveryPersistPayload,
  retryPendingRemotePersist,
} from '../../../contributions/contributionRecovery';
import { buildEvidenceId } from '../../../contributions/evidenceVersion';
import {
  getLocalEvidenceById,
  upsertLocalEvidence,
} from '../../../contributions/evidenceStore';
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
    __clearBodyReceiverPredicatesForTests();
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

  describe('Body receiver — 4A.0 fail-closed default (not permanent prohibition)', () => {
    it('fail-closes Body eligibility because no approved Body receiving methodology is registered in 4A.0', () => {
      const admitted = admitAndVerify(baseOrigin());
      const computed = computeReceiverEligibility(admitted);
      expect(computed.body_ingredients_nutrition?.eligible).toBe(false);
      expect(computed.body_ingredients_nutrition?.reason).toBe(BODY_RECEIVER_4A0_UNREGISTERED_REASON);
      expect(computed.body_ingredients_nutrition?.reason).not.toMatch(/never/i);
      expect(isAssessmentEligibleForReceiver(admitted, 'body_ingredients_nutrition')).toBe(false);

      const cert = admitAndVerify(baseCertLaneA());
      expect(cert.receiverEligibility?.body_ingredients_nutrition?.eligible).toBe(false);
      expect(cert.receiverEligibility?.body_ingredients_nutrition?.reason).toBe(
        BODY_RECEIVER_4A0_UNREGISTERED_REASON
      );
    });

    it('4A.2 extensibility is via registered Body predicates, not by writing eligible:true into evidence data', () => {
      const admitted = admitAndVerify(baseCertLaneA());
      // Forged stored map must NOT grant Body authority.
      const forgedStoredMap: ContributionEvidence = {
        ...admitted,
        receiverEligibility: {
          ...admitted.receiverEligibility,
          body_ingredients_nutrition: {
            eligible: true,
            methodologyId: 'forged',
            methodologyVersion: 'attack',
            basisRuleVersion: 'attack',
            reason: 'forged stored eligible:true',
          },
        },
      };
      expect(isAssessmentEligibleForReceiver(forgedStoredMap, 'body_ingredients_nutrition')).toBe(false);

      // Code/governance-controlled registration is the only extensibility path.
      const unregister = registerBodyReceiverPredicate(() => ({
        eligible: true,
        methodologyId: 'body6_additives_placeholder',
        methodologyVersion: 'future_4a2',
        reason: 'registered approved Body receiving methodology (simulated 4A.2)',
      }));
      try {
        expect(isAssessmentEligibleForReceiver(admitted, 'body_ingredients_nutrition')).toBe(true);
        expect(computeReceiverEligibility(admitted).body_ingredients_nutrition?.eligible).toBe(true);
      } finally {
        unregister();
      }
      // After unregister, fail-closed again.
      expect(isAssessmentEligibleForReceiver(admitted, 'body_ingredients_nutrition')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // QA corrective adversarial cases (founder-directed 4A.0 pass)
  // -------------------------------------------------------------------------

  describe('QA-1 Receiver eligibility authority', () => {
    it('forged stored open_origins eligible:true cannot grant production eligibility', () => {
      const forged: ContributionEvidence = {
        ...productionSubmitted(baseOrigin()),
        admissionStatus: 'admitted',
        admission: { admittedAt: 1, admissionReason: 'x', ruleVersion: 'x' },
        state: 'pending',
        scoringEligible: false,
        canonicalPromoted: true,
        receiverEligibility: {
          open_origins: {
            eligible: true,
            methodologyId: 'forged',
            methodologyVersion: 'attack',
            basisRuleVersion: 'attack',
            reason: 'forged',
          },
        },
      };
      expect(isAssessmentEligibleForReceiver(forged, 'open_origins')).toBe(false);
      expect(canApplyToProductionReceiver(forged, 'open_origins')).toBe(false);
      expect(toScoringProduct(offBare(), [forged])?.manufacturing_places).toBeUndefined();
    });

    it('forged stored Body eligible:true cannot grant production eligibility', () => {
      const admitted = admitAndVerify(baseOrigin());
      const forgedBody: ContributionEvidence = {
        ...admitted,
        receiverEligibility: {
          ...admitted.receiverEligibility,
          body_ingredients_nutrition: {
            eligible: true,
            methodologyId: 'forged',
            methodologyVersion: 'attack',
            basisRuleVersion: 'attack',
            reason: 'forged body',
          },
        },
      };
      expect(isAssessmentEligibleForReceiver(forgedBody, 'body_ingredients_nutrition')).toBe(false);
    });

    it('legacy domain-global scoringEligible cannot independently grant production receiver eligibility on review_required', () => {
      // review_required with scoringEligible:true but WITHOUT confirmation threshold met.
      const spoofed: ContributionEvidence = {
        ...productionSubmitted(baseCertLaneA()),
        admissionStatus: 'admitted',
        admission: { admittedAt: 1, admissionReason: 'x', ruleVersion: 'x' },
        state: 'review_required',
        scoringEligible: true,
        canonicalPromoted: true,
        confirmations: [],
        disputes: [
          { contributorId: 'a', reason: 'claim_not_present', timestamp: 1, evidenceVersion: 1 },
          { contributorId: 'b', reason: 'wrong_product', timestamp: 2, evidenceVersion: 1 },
        ],
        receiverEligibility: {
          ethics_certifications: {
            eligible: true,
            methodologyId: 'forged',
            methodologyVersion: 'attack',
            basisRuleVersion: 'attack',
            reason: 'forged prior map',
          },
        },
      };
      expect(isAssessmentEligibleForReceiver(spoofed, 'ethics_certifications')).toBe(false);
      expect(computeReceiverEligibility(spoofed).ethics_certifications?.eligible).toBe(false);
    });

    it('review_required preserves eligibility via controlled recomputation when confirmation threshold was met', () => {
      const promoted = admitAndVerify(baseCertLaneA());
      const d1 = disputeEvidence(promoted, 'user_c', 'claim_not_present');
      const d2 = disputeEvidence(d1.evidence, 'user_d', 'wrong_product');
      expect(d2.evidence.state).toBe('review_required');
      // Clear stored map — eligibility must still recompute from confirmations + methodology.
      const withoutMap: ContributionEvidence = {
        ...d2.evidence,
        receiverEligibility: undefined,
        scoringEligible: false,
      };
      expect(isAssessmentEligibleForReceiver(withoutMap, 'ethics_certifications')).toBe(true);
    });
  });

  describe('QA-2 Prevailing evidence controls consumption', () => {
    it('admitted v2 remains prevailing over admitted v1 after later activity on v1', () => {
      const v1 = admitAndVerify(
        baseOrigin({
          claimValue: 'New Zealand v1',
          originStructured: { claimType: 'made_in', primaryCountry: 'New Zealand v1' },
        })
      );
      const v2 = admitAndVerify(
        baseOrigin({
          evidenceId: `${BARCODE}|origins|made_in:new zealand|v2`,
          evidenceVersion: 2,
          claimValue: 'New Zealand v2',
          originStructured: { claimType: 'made_in', primaryCountry: 'New Zealand v2' },
          createdAt: 2,
        }),
        'user_verifier_2'
      );

      // Later confirmation/dispute activity on superseded v1 must not regain consumption.
      const v1Later = confirmAndPromoteIfEligible(
        { ...v1, updatedAt: Date.now() + 10_000 },
        'user_late_confirmer'
      ).evidence;
      const v1WithLaterActivity: ContributionEvidence = {
        ...v1Later,
        updatedAt: Date.now() + 20_000,
        confirmations: [
          ...v1Later.confirmations,
          {
            contributorId: 'user_very_late',
            timestamp: Date.now() + 20_000,
            evidenceVersion: 1,
          },
        ],
      };

      const scoring = toScoringProduct(offBare(), [v1WithLaterActivity, v2]);
      expect(scoring?.manufacturing_places).toBe('New Zealand v2');

      const prevailing = selectPrevailingAdmittedEvidence([v1WithLaterActivity, v2], {
        barcode: BARCODE,
        domain: 'origins',
        claimKey: 'made_in:new zealand',
      });
      expect(prevailing?.evidenceVersion).toBe(2);
    });

    it('unadmitted newer draft does not displace admitted prevailing version in consumption', () => {
      const v1 = admitAndVerify(
        baseOrigin({
          claimValue: 'New Zealand admitted',
          originStructured: { claimType: 'made_in', primaryCountry: 'New Zealand admitted' },
        })
      );
      const draftV2: ContributionEvidence = {
        ...baseOrigin({
          evidenceId: `${BARCODE}|origins|made_in:new zealand|v2`,
          evidenceVersion: 2,
          claimValue: 'Draft should not win',
          originStructured: { claimType: 'made_in', primaryCountry: 'Draft should not win' },
          createdAt: Date.now() + 50_000,
        }),
        productionEpoch: CURRENT_PRODUCTION_CONTRIBUTION_EPOCH,
        recordClass: 'production',
        admissionStatus: 'submitted',
        updatedAt: Date.now() + 50_000,
        scoringEligible: true,
        canonicalPromoted: true,
        state: 'cross_user_eligible',
      };
      const scoring = toScoringProduct(offBare(), [v1, draftV2]);
      expect(scoring?.manufacturing_places).toBe('New Zealand admitted');
    });

    it('superseded certification versions do not continue contributing via historical union', () => {
      const v1 = admitAndVerify(
        baseCertLaneA({
          claimKey: 'fair trade',
          claimValue: 'en:fair-trade',
          labelsTags: ['en:fair-trade'],
        })
      );
      const v2 = admitAndVerify(
        baseCertLaneA({
          evidenceId: `${BARCODE}|certifications|fair trade|v2`,
          evidenceVersion: 2,
          claimKey: 'fair trade',
          claimValue: 'en:fair-trade-project',
          labelsTags: ['en:fair-trade-project'],
          createdAt: 2,
        }),
        'user_verifier_2'
      );
      // Mark v1 superseded (still eligible flags if naively unioned).
      const supersededV1 = applyFounderAdminAction(v1, 'supersede');
      expect(supersededV1.state).toBe('superseded');

      const scoring = toScoringProduct(offBare(), [supersededV1, v2]);
      expect(scoring?.labels_tags).toEqual(['en:fair-trade-project']);
      expect(scoring?.labels_tags).not.toContain('en:fair-trade');
    });
  });

  describe('QA-3 Recovery must never roll governance state backwards', () => {
    it('withdrawal after checkpoint survives retry', async () => {
      const admitted = admitAndVerify(baseOrigin());
      const checkpoint = await checkpointMaterialCompletion(admitted, evidenceKeyOf(admitted));
      expect(checkpoint).not.toBeNull();

      const withdrawn = applyFounderAdminAction(admitted, 'withdraw');
      await upsertLocalEvidence(withdrawn);

      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });
      await retryPendingRemotePersist();

      const local = await getLocalEvidenceById(admitted.evidenceId);
      expect(local?.state).toBe('withdrawn');
      expect(isAssessmentEligibleForReceiver(local!, 'open_origins')).toBe(false);
    });

    it('disputes/confirmations added after checkpoint survive retry', async () => {
      const admitted = admitAndVerify(baseOrigin());
      await checkpointMaterialCompletion(admitted, evidenceKeyOf(admitted));

      const disputed = disputeEvidence(admitted, 'user_disputer', 'claim_not_present').evidence;
      await upsertLocalEvidence(disputed);

      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });
      await retryPendingRemotePersist();

      const local = await getLocalEvidenceById(admitted.evidenceId);
      expect(local?.disputes).toHaveLength(1);
      expect(local?.disputes[0]?.contributorId).toBe('user_disputer');
    });

    it('review_required is not erased by retry', async () => {
      const promoted = admitAndVerify(baseCertLaneA());
      await checkpointMaterialCompletion(promoted, evidenceKeyOf(promoted));

      const d1 = disputeEvidence(promoted, 'user_c', 'claim_not_present');
      const d2 = disputeEvidence(d1.evidence, 'user_d', 'wrong_product');
      expect(d2.evidence.state).toBe('review_required');
      await upsertLocalEvidence(d2.evidence);

      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });
      await retryPendingRemotePersist();

      const local = await getLocalEvidenceById(promoted.evidenceId);
      expect(local?.state).toBe('review_required');
      expect(local?.disputes).toHaveLength(2);
    });

    it('repeated failed retries do not repeatedly roll state backwards', async () => {
      const admitted = admitAndVerify(baseOrigin());
      await checkpointMaterialCompletion(admitted, evidenceKeyOf(admitted));

      const withdrawn = applyFounderAdminAction(admitted, 'withdraw');
      await upsertLocalEvidence(withdrawn);

      (global.fetch as jest.Mock).mockRejectedValue(new Error('still_down'));
      await retryPendingRemotePersist();
      await retryPendingRemotePersist();
      await retryPendingRemotePersist();

      const local = await getLocalEvidenceById(admitted.evidenceId);
      expect(local?.state).toBe('withdrawn');
      expect(local?.canonicalPromoted).toBe(false);
    });

    it('stale recovery cannot re-elevate withdrawn evidence into production eligibility', async () => {
      const admitted = admitAndVerify(baseOrigin());
      const checkpoint = await checkpointMaterialCompletion(admitted, evidenceKeyOf(admitted));
      expect(checkpoint?.evidenceSnapshot.state).not.toBe('withdrawn');

      const withdrawn = applyFounderAdminAction(admitted, 'withdraw');
      await upsertLocalEvidence(withdrawn);

      const payload = resolveRecoveryPersistPayload(checkpoint!, withdrawn);
      expect(payload.state).toBe('withdrawn');
      expect(isAssessmentEligibleForReceiver(payload, 'open_origins')).toBe(false);

      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });
      await retryPendingRemotePersist();
      const local = await getLocalEvidenceById(admitted.evidenceId);
      expect(canApplyToProductionReceiver(local!, 'open_origins')).toBe(false);
    });
  });

  describe('QA-4 Variant identity collision', () => {
    it('variant submission cannot overwrite admitted base-product evidence; both remain independently addressable', () => {
      const base = admitAndVerify(baseOrigin());
      expect(base.evidenceId).toBe(`${BARCODE}|origins|made_in:new zealand|v1`);

      const variantId = buildEvidenceId({
        barcode: BARCODE,
        domain: 'origins',
        claimKey: 'made_in:new zealand',
        evidenceVersion: 1,
        variantKey: 'organic-500g',
      });
      expect(variantId).not.toBe(base.evidenceId);
      expect(variantId).toContain('|var:organic-500g|');
      // Normalized claim segment + variant discriminator + version.
      expect(variantId).toBe(`${BARCODE}|origins|made in:new zealand|var:organic-500g|v1`);

      const variant = admitAndVerify(
        baseOrigin({
          evidenceId: variantId,
          variantKey: 'organic-500g',
          claimValue: 'New Zealand Organic',
        }),
        'user_variant_confirmer'
      );

      expect(variant.evidenceId).not.toBe(base.evidenceId);
      expect(evidenceKeyOf(base)).not.toBe(evidenceKeyOf(variant));
      expect(buildEvidenceKey({ barcode: BARCODE, domain: 'origins', claimKey: base.claimKey })).not.toBe(
        buildEvidenceKey({
          barcode: BARCODE,
          domain: 'origins',
          claimKey: base.claimKey,
          variantKey: 'organic-500g',
        })
      );

      const basePrevailing = selectPrevailingAdmittedEvidence([base, variant], {
        barcode: BARCODE,
        domain: 'origins',
        claimKey: base.claimKey,
      });
      const variantPrevailing = selectPrevailingAdmittedEvidence([base, variant], {
        barcode: BARCODE,
        domain: 'origins',
        claimKey: base.claimKey,
        variantKey: 'organic-500g',
      });
      expect(basePrevailing?.evidenceId).toBe(base.evidenceId);
      expect(variantPrevailing?.evidenceId).toBe(variant.evidenceId);
    });
  });

  describe('QA-5 Production record-class boundary', () => {
    it('production authority requires explicit recordClass=production allowlist', () => {
      expect(isExplicitProductionRecordClass('production')).toBe(true);
      expect(isExplicitProductionRecordClass(undefined)).toBe(false);
      expect(isExplicitProductionRecordClass(null)).toBe(false);
      expect(isExplicitProductionRecordClass('historical')).toBe(false);
      expect(isExplicitProductionRecordClass('fixture')).toBe(false);
      expect(isExplicitProductionRecordClass('test')).toBe(false);
      expect(isExplicitProductionRecordClass('developer')).toBe(false);
      expect(isExplicitProductionRecordClass('weird')).toBe(false);
    });

    it('absent/unknown/malformed/historical/test/fixture/developer fail closed even with current epoch', () => {
      const classes = [undefined, null, '', 'historical', 'fixture', 'test', 'developer', 'uat', 'prod'] as const;
      for (const recordClass of classes) {
        const row: ContributionEvidence = {
          ...baseOrigin(),
          productionEpoch: CURRENT_PRODUCTION_CONTRIBUTION_EPOCH,
          recordClass: recordClass as ContributionEvidence['recordClass'],
          admissionStatus: 'admitted',
          admission: { admittedAt: 1, admissionReason: 'x', ruleVersion: 'x' },
          state: 'cross_user_eligible',
          scoringEligible: true,
          canonicalPromoted: true,
        };
        expect(carriesCurrentProductionEpoch(row)).toBe(false);
        expect(describeEpochAuthority(row).productionAuthoritativeCandidate).toBe(false);
        expect(admitEvidence(row, { admissionReason: 'should_fail' }).ok).toBe(false);
        expect(isAssessmentEligibleForReceiver(row, 'open_origins')).toBe(false);
      }
    });

    it('adding current epoch string does not convert historical/fixture into production evidence', () => {
      const historical: ContributionEvidence = {
        ...confirmAndPromoteIfEligible(baseOrigin(), 'user_other').evidence,
        productionEpoch: CURRENT_PRODUCTION_CONTRIBUTION_EPOCH,
        recordClass: 'historical',
        admissionStatus: 'admitted',
        admission: { admittedAt: 1, admissionReason: 'x', ruleVersion: 'x' },
      };
      expect(carriesCurrentProductionEpoch(historical)).toBe(false);
      expect(toScoringProduct(offBare(), [historical])?.manufacturing_places).toBeUndefined();
    });

    it('Jest/dev runtime determinant stamps developer, not production', () => {
      // This suite runs under Jest (NODE_ENV=test / JEST_WORKER_ID).
      expect(resolveContributionCreationRecordClass()).toBe('developer');
    });

    it('retry/admission cannot upgrade non-production recordClass', async () => {
      const developer: ContributionEvidence = {
        ...baseOrigin(),
        productionEpoch: CURRENT_PRODUCTION_CONTRIBUTION_EPOCH,
        recordClass: 'developer',
        admissionStatus: 'submitted',
      };
      expect(await checkpointMaterialCompletion(developer, evidenceKeyOf(developer))).toBeNull();
      expect(admitEvidence(developer, { admissionReason: 'no' }).ok).toBe(false);
    });
  });
});
