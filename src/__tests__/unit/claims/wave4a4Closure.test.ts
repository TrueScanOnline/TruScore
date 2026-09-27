import AsyncStorage from '@react-native-async-storage/async-storage';
import { admitEvidence } from '../../../contributions/admissionContract';
import { __setContributionCreationRecordClassForTests } from '../../../contributions/productionEpoch';
import { submitGovernedEvidence } from '../../../contributions/submitGovernedEvidence';
import type { ContributionEvidence } from '../../../contributions/types';
import {
  PACKET_CLAIMS_CARD_TITLE,
  PACKET_CLAIMS_EXPLAINER_HOOK,
  selectAdmittedPacketAbsence,
  selectPrevailingPacketClaims,
} from '../../../claims/packetClaimReceiver';
import { calculateEthicsPillar } from '../../../lib/truscoreEngine/pillars/ethicsPillar';
import {
  consumerClaimsCommentary,
  consumerClaimsScore,
  isClaimsPacketLaneAssessed,
  publishClaimsPillar,
} from '../../../lib/rateability/claimsPublication';
import fs from 'fs';
import path from 'path';
import { selectScoreHighlights } from '../../../lib/scoreHighlights';
import {
  addManualEvidenceUnit,
  applyReviewAction,
  commitStagedCapture,
  handoffReviewedUnits,
  openSessionForProduct,
  runExtraction,
  setSourceFraming,
} from '../../../packetContribution';
import type { Product } from '../../../types/product';

const BARCODE = '9300673333333';
const memory = new Map<string, string>();

function food(overrides: Partial<Product> = {}): Product {
  return {
    barcode: BARCODE,
    product_name: 'Plain oats',
    source: 'openfoodfacts',
    brands: '',
    labels: '',
    labels_tags: [],
    nutriments: { sugars_100g: 1, 'saturated-fat_100g': 0.2, sodium_100g: 0.02 },
    categories_tags: ['en:breakfast-cereals'],
    ...overrides,
  } as Product;
}

async function admitAbsence(timestamp: number): Promise<ContributionEvidence> {
  const submitted = await submitGovernedEvidence({
    barcode: BARCODE,
    domain: 'packet_claims',
    claimValue: 'ignored',
    packetAbsence: true,
    asProductionEpoch: true,
  });
  const admitted = admitEvidence(submitted, { admissionReason: 'primary_user_packet_absence', timestamp });
  if (!admitted.ok) throw new Error(admitted.reason);
  return admitted.evidence;
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

describe('Wave 4A.4 Claims publication closure', () => {
  it('keeps Claims NR when neither lane is assessed even though the internal score is 15', () => {
    const ethics = calculateEthicsPillar(food());
    expect(ethics.score).toBe(15);
    expect(ethics.details.claimsAssessment?.assessment_state).toBe('unassessed');
    expect(ethics.details.claimsAssessment?.packet_coverage_state).toBe('incomplete');
    expect(ethics.details.claimsAssessment?.admitted_claims).toHaveLength(0);
    expect(ethics.details.claimsAssessment?.publication_packet_lane).toBe('unassessed_or_incomplete');
    const published = publishClaimsPillar({ product: food(), ethics });
    expect(published.publicationStatus).toBe('nr');
    expect(published.internalScore).toBe(15);
    expect(published.publishedScore).toBeNull();
    expect(consumerClaimsScore(published)).toBeNull();
    expect(published.s26?.code).toBe('CLAIMS_NR');
    expect(published.s26?.contributionOpportunity?.routeStatus).toBe('live');
    expect(published.s26?.contributionOpportunity?.routeKey).toBe('packet_claims');
    expect(consumerClaimsScore(published)).toBeNull();
    expect(
      consumerClaimsCommentary(published.publicationStatus, {
        route: 'assessed_neutral',
        l2: 'We checked the packet for the product claims and certifications we currently assess, and our independent company-level benchmark checks did not produce a positive or adverse finding.',
      })
    ).toBeNull();
  });

  it('does not let incomplete coverage, silence, or an empty register establish packet absence', () => {
    const incomplete = calculateEthicsPillar(food(), { packetCoverageState: 'incomplete' });
    expect(isClaimsPacketLaneAssessed(incomplete.details.claimsAssessment)).toBe(false);
    const covered = calculateEthicsPillar(food(), { packetCoverageState: 'complete' });
    expect(covered.details.claimsAssessment?.admitted_claims).toHaveLength(0);
    expect(isClaimsPacketLaneAssessed(covered.details.claimsAssessment)).toBe(false);
    const unmatched = calculateEthicsPillar(food({ labels: 'Responsibly sourced' }));
    expect(unmatched.details.claimsAssessment?.admitted_claims).toHaveLength(0);
    expect(unmatched.details.claimsAssessment?.publication_packet_lane).toBe('unassessed_or_incomplete');
    expect(
      isClaimsPacketLaneAssessed({
        ...covered.details.claimsAssessment!,
        publication_packet_lane: 'unassessed_or_incomplete',
        packet_coverage_state: 'complete',
        assessment_state: 'assessed_neutral',
      })
    ).toBe(false);
  });

  it('resolves the Packet lane from an admitted absence affirmation without a fired event or highlight', async () => {
    const submitted = await submitGovernedEvidence({
      barcode: BARCODE,
      domain: 'packet_claims',
      claimValue: 'ignored',
      packetAbsence: true,
      asProductionEpoch: true,
    });
    expect(submitted.admissionStatus).toBe('submitted');
    expect(selectAdmittedPacketAbsence([submitted])).toBe(false);
    expect(selectPrevailingPacketClaims([submitted])).toHaveLength(0);

    const admitted = await admitAbsence(1);
    expect(admitted.confirmations).toHaveLength(0);
    expect(selectAdmittedPacketAbsence([admitted])).toBe(true);

    const ethics = calculateEthicsPillar(food(), { admittedPacketAbsence: true });
    const assessment = ethics.details.claimsAssessment!;
    expect(assessment.publication_packet_lane).toBe('assessed');
    expect(assessment.assessment_state).toBe('assessed_neutral');
    expect(assessment.fired_adjustments).toHaveLength(0);
    expect(ethics.score).toBe(15);
    expect(ethics.details.primaryUserClaimsDependence).toBe(true);
    expect(ethics.adjustments.some((row) => row.highlightEligible && row.value === 0 && row.id.startsWith('claims.'))).toBe(
      false
    );
    const highlights = selectScoreHighlights(
      ethics.adjustments.map((row) => ({
        pillar: 'Ethics' as const,
        id: row.id,
        value: row.value,
        highlightEligible: row.highlightEligible,
      }))
    );
    expect(highlights.byPillar.Ethics).toHaveLength(0);

    const packetOnly = publishClaimsPillar({ product: food(), ethics });
    expect(packetOnly.publicationStatus).toBe('rated');
    expect(packetOnly.publishedScore).toBe(15);
    expect(packetOnly.confidence).toBe('limited');
    expect(packetOnly.confidenceReasonCode).toBe('claims_primary_contribution_limited');
    expect(consumerClaimsScore(packetOnly)).toBe(15);
    expect(`${consumerClaimsScore(packetOnly)}/25`).toBe('15/25');
    expect(assessment.fired_adjustments.some((row) => row.points === 0)).toBe(false);
    expect(consumerClaimsCommentary(packetOnly.publicationStatus, assessment.commentary_payload)?.route).not.toBe(
      'none'
    );
  });

  it('publishes benchmark-only and both-lane neutral results from the lane flags', () => {
    const ethics = calculateEthicsPillar(food());
    const assessment = ethics.details.claimsAssessment!;
    const benchmarkOnly = publishClaimsPillar({
      product: food(),
      ethics: {
        ...ethics,
        details: {
          ...ethics.details,
          claimsAssessment: {
            ...assessment,
            benchmark_checks: [
              { source: 'ktc', status: 'no_finding' },
              { source: 'bbfaw', status: 'no_finding' },
            ],
          },
        },
      },
    });
    expect(benchmarkOnly.publicationStatus).toBe('rated');
    expect(benchmarkOnly.publishedScore).toBe(15);
    expect(benchmarkOnly.confidence).toBe('limited');
    expect(benchmarkOnly.s26?.code).toBe('CLAIMS_LIMITED_BENCHMARK_ONLY');
    expect(benchmarkOnly.assessmentLanes.packet).toBe('unassessed_or_incomplete');
    expect(benchmarkOnly.publishedScore).toBe(15);
    expect(`${benchmarkOnly.publishedScore}/25`).toBe('15/25');
    expect(ethics.adjustments.filter((row) => row.highlightEligible && row.id.startsWith('claims.'))).toHaveLength(0);

    const both = calculateEthicsPillar(food(), { admittedPacketAbsence: true });
    const bothAssessment = both.details.claimsAssessment!;
    const dependent = publishClaimsPillar({
      product: food(),
      ethics: {
        ...both,
        details: {
          ...both.details,
          claimsAssessment: {
            ...bothAssessment,
            benchmark_checks: [
              { source: 'ktc', status: 'no_finding' },
              { source: 'bbfaw', status: 'no_finding' },
            ],
          },
        },
      },
      authoritative: { claimsPacket: true, claimsBenchmark: true },
    });
    expect(dependent.confidence).toBe('limited');
    expect(dependent.publishedScore).toBe(15);
    expect(dependent.s26?.code).toBe('CLAIMS_LIMITED_PRIMARY_CONTRIBUTION');

    const independent = publishClaimsPillar({
      product: food(),
      ethics: {
        ...both,
        details: {
          ...both.details,
          primaryUserClaimsDependence: false,
          claimsAssessment: {
            ...bothAssessment,
            benchmark_checks: [
              { source: 'ktc', status: 'no_finding' },
              { source: 'bbfaw', status: 'no_finding' },
            ],
          },
        },
      },
      authoritative: { claimsPacket: true, claimsBenchmark: true },
    });
    expect(independent.confidence).toBe('high');
    expect(independent.publishedScore).toBe(15);
    expect(bothAssessment.fired_adjustments).toHaveLength(0);
    expect(`${dependent.publishedScore}/25`).toBe('15/25');
  });

  it('lets the later admitted packet row prevail when absence and a positive claim contradict', async () => {
    const positive = admitEvidence(
      await submitGovernedEvidence({
        barcode: BARCODE,
        domain: 'packet_claims',
        claimValue: 'High protein',
        exactWording: 'High protein',
        asProductionEpoch: true,
      }),
      { admissionReason: 'primary_user_packet_claim', timestamp: 1 }
    );
    const absence = admitEvidence(
      await submitGovernedEvidence({
        barcode: BARCODE,
        domain: 'packet_claims',
        claimValue: 'ignored',
        packetAbsence: true,
        asProductionEpoch: true,
      }),
      { admissionReason: 'primary_user_packet_absence', timestamp: 2 }
    );
    if (!positive.ok || !absence.ok) throw new Error('admission failed');
    const history = [positive.evidence, absence.evidence];
    expect(history.map((row) => row.evidenceId).sort()).toEqual(
      [positive.evidence.evidenceId, absence.evidence.evidenceId].sort()
    );
    expect(selectPrevailingPacketClaims(history)).toHaveLength(0);
    expect(selectAdmittedPacketAbsence(history)).toBe(true);

    const organic = admitEvidence(
      await submitGovernedEvidence({
        barcode: BARCODE,
        domain: 'packet_claims',
        claimValue: 'Organic',
        exactWording: 'Organic',
        asProductionEpoch: true,
      }),
      { admissionReason: 'primary_user_packet_claim', timestamp: 3 }
    );
    if (!organic.ok) throw new Error(organic.reason);
    const after = [...history, organic.evidence];
    expect(after).toHaveLength(3);
    expect(selectAdmittedPacketAbsence(after)).toBe(false);
    expect(selectPrevailingPacketClaims(after).map((row) => row.exactWording)).toEqual(['Organic']);

    const compatible = admitEvidence(
      await submitGovernedEvidence({
        barcode: BARCODE,
        domain: 'packet_claims',
        claimValue: 'Gluten free',
        exactWording: 'Gluten free',
        asProductionEpoch: true,
      }),
      { admissionReason: 'primary_user_packet_claim', timestamp: 4 }
    );
    if (!compatible.ok) throw new Error(compatible.reason);
    const wordings = selectPrevailingPacketClaims([...after, compatible.evidence]).map((row) => row.exactWording);
    expect(wordings.sort()).toEqual(['Gluten free', 'Organic']);
  });

  it('keeps the Packet Claims title and an empty L1/L2/L3 hook', () => {
    expect(PACKET_CLAIMS_CARD_TITLE).toBe('Packet Claims');
    expect(PACKET_CLAIMS_EXPLAINER_HOOK).toEqual({
      surface: 'packet_claims',
      levels: ['L1', 'L2', 'L3'],
      editorial: 'deferred',
      content: '(Awaiting founder input)',
    });
    const screen = fs.readFileSync(path.join(__dirname, '../../../../app/result/[barcode].tsx'), 'utf8');
    expect(screen).toContain('{PACKET_CLAIMS_CARD_TITLE}');
    expect(screen).toContain('PACKET_CLAIMS_EXPLAINER_HOOK.levels.map');
    expect(screen).toContain('PACKET_CLAIMS_EXPLAINER_HOOK.content');
  });

  it('submits a reviewed absence affirmation and does not treat capture or extraction silence as assessment', async () => {
    const session = await openSessionForProduct({ barcode: BARCODE });
    const photo = await commitStagedCapture({
      sessionId: session.sessionId,
      bytes: new Uint8Array([9, 9, 9]),
      source: 'camera',
    });
    const extracted = await runExtraction({ sessionId: session.sessionId });
    expect(extracted.run.observations).toHaveLength(0);
    expect(extracted.session.units.some((unit) => unit.packetAbsenceAffirmation)).toBe(false);

    await setSourceFraming(session.sessionId, photo.asset.assetId, 'targeted');
    const unit = await addManualEvidenceUnit({
      sessionId: session.sessionId,
      domain: 'packet_claims',
      statement: '',
      packetAbsenceAffirmation: true,
      support: { coverage: 'whole_image', sourceAssetId: photo.asset.assetId },
    });
    const beforeReview = await handoffReviewedUnits({ sessionId: session.sessionId });
    expect(beforeReview[0]?.outcome).toBe('skipped');
    await applyReviewAction({
      sessionId: session.sessionId,
      unitId: unit.unitId,
      action: 'manual_entry',
    });
    const handed = await handoffReviewedUnits({ sessionId: session.sessionId });
    expect(handed[0]?.outcome).toBe('submitted');
    if (handed[0]?.outcome === 'submitted') {
      expect(handed[0].admissionStatus).toBe('submitted');
    }
  });
});
