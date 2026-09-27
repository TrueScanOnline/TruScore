import AsyncStorage from '@react-native-async-storage/async-storage';
import { admitEvidence, canApplyToProductionReceiver } from '../../../contributions/admissionContract';
import { __setContributionCreationRecordClassForTests } from '../../../contributions/productionEpoch';
import { submitGovernedEvidence } from '../../../contributions/submitGovernedEvidence';
import type { ContributionEvidence } from '../../../contributions/types';
import { toScoringProduct } from '../../../contributions/eligibilityBoundary';
import {
  packetClaimsToObservations,
  selectPrevailingPacketClaims,
} from '../../../claims/packetClaimReceiver';
import { matchAdmittedObservations } from '../../../lib/truscoreEngine/claims/matchRegister';
import { calculateEthicsPillar } from '../../../lib/truscoreEngine/pillars/ethicsPillar';
import { publishClaimsPillar } from '../../../lib/rateability/claimsPublication';
import {
  addManualEvidenceUnit,
  applyReviewAction,
  assignReviewDisposition,
  commitStagedCapture,
  handoffReviewedUnits,
  openSessionForProduct,
  setSourceFraming,
} from '../../../packetContribution';
import type { Product } from '../../../types/product';

const BARCODE = '9300673222222';
const memory = new Map<string, string>();

function admitAt(evidence: ContributionEvidence, timestamp: number): ContributionEvidence {
  const admitted = admitEvidence(evidence, { admissionReason: 'primary_user_packet_claim', timestamp });
  if (!admitted.ok) throw new Error(admitted.reason);
  return admitted.evidence;
}

async function claim(wording: string, timestamp: number): Promise<ContributionEvidence> {
  return admitAt(
    await submitGovernedEvidence({
      barcode: BARCODE,
      domain: 'packet_claims',
      claimValue: wording,
      exactWording: wording,
      asProductionEpoch: true,
    }),
    timestamp
  );
}

function food(overrides: Partial<Product> = {}): Product {
  return {
    barcode: BARCODE,
    product_name: 'Plain oats',
    source: 'openfoodfacts',
    nutriments: { sugars_100g: 1, 'saturated-fat_100g': 0.2, sodium_100g: 0.02 },
    categories_tags: ['en:breakfast-cereals'],
    ...overrides,
  } as Product;
}

beforeEach(() => {
  memory.clear();
  __setContributionCreationRecordClassForTests('production');
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

afterEach(() => {
  __setContributionCreationRecordClassForTests(null);
});

describe('Wave 4A.4 packet claims receiver', () => {
  it('routes admitted wording through the register without a second confirmation', async () => {
    const protein = await claim('High protein', 1);
    const comparative = await claim('More protein', 2);
    const organic = await claim('Organic', 3);
    const gluten = await claim('Gluten free', 4);
    expect(protein.confirmations).toHaveLength(0);
    expect(canApplyToProductionReceiver(protein, 'claims_packet')).toBe(true);

    const facts = selectPrevailingPacketClaims([protein, comparative, organic, gluten]);
    const matched = matchAdmittedObservations(packetClaimsToObservations(facts));
    expect(matched.matched.find((row) => row.observed_text === 'High protein')?.set).toBe('A');
    expect(matched.matched.find((row) => row.observed_text === 'More protein')?.set).toBe('B');
    expect(matched.matched.find((row) => row.observed_text === 'Organic')?.set).toBe('O');
    expect(matched.matched.find((row) => row.observed_text === 'Gluten free')?.set).toBe('C');

    const ethics = calculateEthicsPillar(food(), {
      admittedPacketObservations: packetClaimsToObservations([facts[0]]),
    });
    expect(ethics.details.claimsAssessment?.packet_context_points).toBe(1);
    expect(ethics.details.claimsAssessment?.fired_adjustments.some((row) => row.points === 0)).toBe(false);
    expect(ethics.details.primaryUserClaimsDependence).toBe(true);
    const published = publishClaimsPillar({ product: food(), ethics });
    expect(published.confidence).toBe('limited');
    expect(published.confidenceReasonCode).toBe('claims_primary_contribution_limited');

    const high = calculateEthicsPillar(
      food({ nutriments: { sugars_100g: 40, 'saturated-fat_100g': 0.2, sodium_100g: 0.02 } }),
      { admittedPacketObservations: packetClaimsToObservations([comparative]) }
    );
    expect(high.details.claimsAssessment?.packet_context_points).toBe(-3);
    expect(high.adjustments.filter((row) => row.id === 'claims.packet_context.adverse.v1')).toHaveLength(1);

    const organicEthics = calculateEthicsPillar(food(), {
      admittedPacketObservations: packetClaimsToObservations([organic]),
    });
    expect(organicEthics.details.claimsAssessment?.organic_claim_only_points).toBe(1);
    expect(organicEthics.details.certificationsAdjustment).toBe(0);

    const certified = calculateEthicsPillar(food({ labels_tags: ['en:organic'] }), {
      admittedPacketObservations: packetClaimsToObservations([organic]),
    });
    expect(certified.details.certificationsAdjustment).toBe(3);
    expect(certified.details.claimsAssessment?.organic_claim_only_points).toBe(0);
    expect(certified.details.claimsAssessment?.suppressed_candidates[0]?.reason_code).toBe(
      'suppressed_by_certified_organic'
    );

    const info = calculateEthicsPillar(food(), {
      admittedPacketObservations: packetClaimsToObservations([gluten]),
    });
    expect(info.details.claimsAssessment?.admitted_claims[0]?.set).toBe('C');
    expect(info.details.claimsAssessment?.packet_context_points).toBe(0);
    expect(info.details.claimsAssessment?.fired_adjustments.some((row) => row.id.startsWith('claims.packet'))).toBe(
      false
    );
  });

  it('fails closed for unrecognised wording and keeps assessed neutral free of a zero event', async () => {
    const unknown = await claim('Banana power blend', 1);
    const matched = matchAdmittedObservations(packetClaimsToObservations(selectPrevailingPacketClaims([unknown])));
    expect(matched.matched).toHaveLength(0);
    expect(matched.unclassified).toHaveLength(1);

    const neutral = calculateEthicsPillar(food(), { packetCoverageState: 'complete' });
    expect(neutral.details.claimsAssessment?.assessment_state).toBe('assessed_neutral');
    expect(neutral.details.claimsAssessment?.fired_adjustments).toHaveLength(0);

    const stillNeutral = calculateEthicsPillar(food(), {
      packetCoverageState: 'complete',
      admittedPacketObservations: packetClaimsToObservations(selectPrevailingPacketClaims([unknown])),
    });
    expect(stillNeutral.details.claimsAssessment?.assessment_state).toBe('assessed_neutral');
    expect(stillNeutral.details.claimsAssessment?.fired_adjustments.some((row) => row.points === 0)).toBe(false);
  });

  it('lets the later admitted wording for the same subject prevail', async () => {
    const first = await claim('High protein', 1);
    const later = await claim('High protein', 5);
    const facts = selectPrevailingPacketClaims([first, later]);
    expect(facts).toHaveLength(1);
    expect(facts[0]?.evidenceId).toBe(later.evidenceId);
    expect(first.evidenceId).not.toBe(later.evidenceId);
  });

  it('does not score a submitted packet claim before admission', async () => {
    const submitted = await submitGovernedEvidence({
      barcode: BARCODE,
      domain: 'packet_claims',
      claimValue: 'High protein',
      exactWording: 'High protein',
      asProductionEpoch: true,
    });
    expect(submitted.admissionStatus).toBe('submitted');
    expect(selectPrevailingPacketClaims([submitted])).toHaveLength(0);
    const session = await openSessionForProduct({ barcode: BARCODE });
    const photo = await commitStagedCapture({
      sessionId: session.sessionId,
      bytes: new Uint8Array([4, 4, 4]),
      source: 'camera',
    });
    await setSourceFraming(session.sessionId, photo.asset.assetId, 'targeted');
    const unit = await addManualEvidenceUnit({
      sessionId: session.sessionId,
      domain: 'packet_claims',
      statement: 'High protein',
      support: { coverage: 'whole_image', sourceAssetId: photo.asset.assetId },
    });
    await assignReviewDisposition({ sessionId: session.sessionId, unitId: unit.unitId, disposition: 'A' });
    await applyReviewAction({ sessionId: session.sessionId, unitId: unit.unitId, action: 'accept' });
    const handed = await handoffReviewedUnits({ sessionId: session.sessionId });
    expect(handed[0]?.outcome).toBe('submitted');
  });

  it('caps a both-lane Claims result to Limited when it depends on primary packet evidence', () => {
    const ethics = calculateEthicsPillar(food(), { packetCoverageState: 'complete' });
    const assessment = ethics.details.claimsAssessment;
    if (!assessment) throw new Error('claims assessment missing');
    const withBenchmarks = {
      ...ethics,
      details: {
        ...ethics.details,
        primaryUserClaimsDependence: true,
        claimsAssessment: {
          ...assessment,
          benchmark_checks: [
            { source: 'ktc' as const, status: 'no_finding' as const },
            { source: 'bbfaw' as const, status: 'no_finding' as const },
          ],
        },
      },
    };
    const dependent = publishClaimsPillar({
      product: food(),
      ethics: withBenchmarks,
      authoritative: { claimsPacket: true, claimsBenchmark: true },
    });
    expect(dependent.confidence).toBe('limited');
    expect(dependent.confidenceReasonCode).toBe('claims_primary_contribution_limited');
    expect(dependent.s26?.code).toBe('CLAIMS_LIMITED_PRIMARY_CONTRIBUTION');

    const independent = publishClaimsPillar({
      product: food(),
      ethics: {
        ...withBenchmarks,
        details: { ...withBenchmarks.details, primaryUserClaimsDependence: false },
      },
      authoritative: { claimsPacket: true, claimsBenchmark: true },
    });
    expect(independent.confidence).toBe('high');
  });

  it('sends an admitted organic certification through the existing certification path', async () => {
    const cert = admitAt(
      await submitGovernedEvidence({
        barcode: BARCODE,
        domain: 'certifications',
        claimValue: 'en:organic',
        labelsTags: ['en:organic'],
        exactWording: 'Certified organic',
        asProductionEpoch: true,
      }),
      1
    );
    const scoring = toScoringProduct(food(), [cert]);
    expect(scoring?.labels_tags).toContain('en:organic');
    expect((scoring as Product & { _rveelPrimaryContributionClaimsDependence?: boolean })._rveelPrimaryContributionClaimsDependence).toBe(
      true
    );
    const ethics = calculateEthicsPillar(scoring as Product);
    expect(ethics.details.certificationsAdjustment).toBe(3);
    const published = publishClaimsPillar({
      product: scoring as Product,
      ethics,
      authoritative: { claimsPacket: true, claimsBenchmark: true },
    });
    expect(published.confidence).toBe('limited');
  });
});
