/**
 * Founder-UAT contribution corrections.
 * Each case runs the production admission, assessment, and Result projection path.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import fs from 'fs';
import path from 'path';
import { __setContributionCreationRecordClassForTests } from '../../../contributions/productionEpoch';
import { submitIngredientsNutritionEvidence } from '../../../ingredientsNutrition/governed';
import { admitEvidence } from '../../../contributions/admissionContract';
import {
  originRowsToSubmit,
  transparencyShowsSeparateAddIngredients,
} from '../../../contribution/governedDisplayProjection';
import { resultContributionActions } from '../../../contribution/resultContributionActions';
import { stampCoreTruthAuthority } from '../../../config/coreTruthProductCacheAuthority';
import { EvidenceAuthority } from '../../../evidenceAuthority/authority';
import { authoritativeStateSupersedes } from '../../../evidenceAuthority/assessment';
import { MemoryAuthorityStore } from '../../../evidenceAuthority/memoryStore';
import { calculateEthicsPillar } from '../../../lib/truscoreEngine/pillars/ethicsPillar';
import {
  benchmarkHasSubstantiveScoringFinding,
  publishClaimsPillar,
} from '../../../lib/rateability/claimsPublication';
import { productOriginsCardPresentation, projectOriginConsumerLines } from '../../../origins/productOriginsCard';
import { sha256Hex } from '../../../packetContribution/sha256';
import type { Product } from '../../../types/product';
import { calculateTrustScore } from '../../../utils/trustScore';

const BARCODE = '9300673666666';
const memory = new Map<string, string>();
const packetBytes = new TextEncoder().encode('founder-packet');
const packetHash = sha256Hex(packetBytes);

function food(overrides: Partial<Product> = {}): Product {
  return stampCoreTruthAuthority({
    barcode: BARCODE,
    product_name: 'Founder oats',
    source: 'openfoodfacts',
    nutriments: { sugars_100g: 4, fat_100g: 2, proteins_100g: 8, energy_100g: 1500 },
    nutrition_data_per: '100g',
    nutriscore_grade: 'b',
    nova_group: 1,
    ecoscore_grade: 'b',
    ingredients_text: 'Wholegrain oats',
    ...overrides,
  } as Product);
}

function authority() {
  return new EvidenceAuthority(new MemoryAuthorityStore(), {
    authorityEnv: 'uat',
    now: () => 8_000,
  });
}

beforeEach(() => {
  memory.clear();
  __setContributionCreationRecordClassForTests('production');
  process.env.EXPO_PUBLIC_EVIDENCE_AUTHORITY_ENV = 'uat';
  (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => memory.get(key) ?? null);
  (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key: string, value: string) => {
    memory.set(key, value);
  });
});

afterEach(() => {
  __setContributionCreationRecordClassForTests(null);
});

describe('founder UAT contribution corrections', () => {
  it('requires a deliberate origin type, then projects the prevailing structured Made in line', async () => {
    const wording = 'Made in Australia from at least 99% Australian ingredients';
    const unselected = originRowsToSubmit([
      {
        claimType: null,
        wording,
        place: 'Australia',
        ingredient: '',
        percentage: '99',
        qualifier: 'at_least',
        intent: 'new',
      },
    ]);
    expect(unselected).toHaveLength(0);

    const selected = originRowsToSubmit([
      {
        claimType: 'made_in',
        wording,
        place: 'Australia',
        ingredient: '',
        percentage: '99',
        qualifier: 'at_least',
        intent: 'new',
      },
    ]);
    expect(selected.map((row) => row.claimType)).toEqual(['made_in']);

    const service = authority();
    const contributor = await service.issueCredential();
    const admitted = await service.submit(contributor.contributorId, {
      idempotencyKey: 'origin-made-in',
      barcode: BARCODE,
      sourceBytes: packetBytes,
      declaredSha256: packetHash,
      facts: [
        {
          domain: 'origins',
          exactWording: wording,
          claimValue: 'Australia',
          originStructured: {
            claimType: 'made_in',
            primaryCountry: 'Australia',
            ingredientOriginPercentage: 99,
            percentageQualifier: 'at_least',
          },
        },
      ],
    });
    expect(admitted.status).toBe('admitted');
    const snapshot = admitted.snapshot!;
    expect(snapshot.prevailing).toHaveLength(1);
    expect(snapshot.prevailing[0].evidence.exactWording).toBe(wording);

    const shown = await calculateTrustScore(
      food({ manufacturing_places: 'Australia', ingredients_text: 'Wholegrain oats' }),
      { authoritativeSnapshot: snapshot }
    );
    const card = productOriginsCardPresentation(shown);
    expect(card.offCountry).toBeNull();
    expect(card.facts).toHaveLength(1);
    expect(card.facts[0].exactWording).toBe(wording);
    expect(projectOriginConsumerLines(card.facts)[0]?.primary).toBe('🇦🇺 Made in Australia');
    expect(projectOriginConsumerLines(card.facts)[0]?.supporting).toContain('at least 99%');
    expect(projectOriginConsumerLines(card.facts)[0]?.primary).not.toContain(wording);
    expect(shown._publication?.transparency.assessmentLanes.origins).toBe('resolved');

    const reloaded = await calculateTrustScore(
      food({ manufacturing_places: 'Australia' }),
      { authoritativeSnapshot: snapshot }
    );
    expect(projectOriginConsumerLines(productOriginsCardPresentation(reloaded).facts)[0]?.primary).toBe(
      '🇦🇺 Made in Australia'
    );
    expect(authoritativeStateSupersedes(snapshot.generatedAt, snapshot.generatedAt - 1)).toBe(false);
  });

  it('publishes Claims from a substantive Benchmark finding and keeps a no-finding Benchmark unpublished', () => {
    const base = calculateEthicsPillar(food());
    const withChecks = (
      checks: Array<{ source: 'ktc' | 'bbfaw'; status: 'positive' | 'adverse' | 'no_finding' }>,
      packet: 'assessed' | 'unassessed_or_incomplete'
    ) =>
      publishClaimsPillar({
        product: food(),
        ethics: {
          ...base,
          details: {
            ...base.details,
            claimsAssessment: {
              ...base.details.claimsAssessment!,
              publication_packet_lane: packet,
              benchmark_checks: checks,
            },
          },
        },
      });

    const substantive = withChecks(
      [
        { source: 'ktc', status: 'adverse' },
        { source: 'bbfaw', status: 'no_finding' },
      ],
      'unassessed_or_incomplete'
    );
    expect(
      benchmarkHasSubstantiveScoringFinding({
        ...base.details.claimsAssessment!,
        benchmark_checks: [
          { source: 'ktc', status: 'adverse' },
          { source: 'bbfaw', status: 'no_finding' },
        ],
      })
    ).toBe(true);
    expect(substantive.publicationStatus).toBe('rated');
    expect(substantive.publishedScore).toBe(base.score);
    expect(substantive.assessmentLanes.packet).toBe('unassessed_or_incomplete');
    expect(substantive.s26?.code).toBe('CLAIMS_LIMITED_BENCHMARK_ONLY');
    expect(substantive.s26?.contributionOpportunity?.routeKey).toBe('packet_claims');

    const neutral = withChecks(
      [
        { source: 'ktc', status: 'no_finding' },
        { source: 'bbfaw', status: 'no_finding' },
      ],
      'unassessed_or_incomplete'
    );
    expect(neutral.publicationStatus).toBe('nr');
    expect(neutral.publishedScore).toBeNull();
    expect(neutral.s26?.code).toBe('CLAIMS_NR');

    const packetOnly = withChecks(
      [
        { source: 'ktc', status: 'no_finding' },
        { source: 'bbfaw', status: 'no_finding' },
      ],
      'assessed'
    );
    expect(packetOnly.publicationStatus).toBe('rated');
    expect(packetOnly.publishedScore).toBe(base.score);
    expect(packetOnly.assessmentLanes.packet).toBe('assessed');
    expect(packetOnly.assessmentLanes.benchmark).toBe('assessed');

    const both = withChecks(
      [
        { source: 'ktc', status: 'positive' },
        { source: 'bbfaw', status: 'adverse' },
      ],
      'assessed'
    );
    expect(both.publicationStatus).toBe('rated');
    expect(both.assessmentLanes.packet).toBe('assessed');
    expect(both.assessmentLanes.benchmark).toBe('assessed');
    expect(both.confidence).toBe('moderate');
    expect(packetOnly.confidence).toBe('moderate');
  });

  it('admits High Fibre and keeps the rated Claims Result ahead of a stale reload', async () => {
    const service = authority();
    const contributor = await service.issueCredential();
    const admitted = await service.submit(contributor.contributorId, {
      idempotencyKey: 'high-fibre',
      barcode: BARCODE,
      sourceBytes: packetBytes,
      declaredSha256: packetHash,
      facts: [{ domain: 'packet_claims', exactWording: 'High Fibre', claimValue: 'High Fibre' }],
    });
    expect(admitted.status).toBe('admitted');
    const snapshot = admitted.snapshot!;
    expect(snapshot.prevailing[0].evidence.domain).toBe('packet_claims');
    expect(snapshot.prevailing[0].evidence.exactWording).toBe('High Fibre');
    expect(snapshot.prevailing[0].subjectKey).toContain('dietary_fibre');

    const before = await calculateTrustScore(food());
    expect(before._publication?.claims.publicationStatus).toBe('nr');
    expect(resultContributionActions(before).packetInformationAction).toBe('add');

    const shown = await calculateTrustScore(food(), { authoritativeSnapshot: snapshot });
    expect(shown.rveelGovernedPacketClaims?.[0]?.exactWording).toBe('High Fibre');
    expect(shown._publication?.claims.assessmentLanes.packet).toBe('assessed');
    expect(shown._publication?.claims.publicationStatus).toBe('rated');
    expect(resultContributionActions(shown).packetInformationAction).toBe('update');

    expect(authoritativeStateSupersedes(snapshot.generatedAt, 1)).toBe(false);
    const reloaded = await calculateTrustScore(food(), { authoritativeSnapshot: snapshot });
    expect(reloaded._publication?.claims.publicationStatus).toBe('rated');
    expect(resultContributionActions(reloaded).packetInformationAction).toBe('update');

    const resultScreen = fs.readFileSync(path.join(__dirname, '../../../../app/result/[barcode].tsx'), 'utf8');
    const admittedHandler = resultScreen.slice(resultScreen.indexOf('onSharedEvidenceAdmitted'));
    expect(admittedHandler.indexOf('appliedSnapshotAtRef.current = Math.max')).toBeLessThan(
      admittedHandler.indexOf('calculateTrustScore')
    );
  });

  it('keeps one Add ingredients action beside unresolved Origins, then removes it after admission', async () => {
    const missing = food({
      ingredients_text: '',
      ingredients_text_en: '',
      manufacturing_places: undefined,
      origins: undefined,
      origins_tags: [],
    });
    const open = await calculateTrustScore(missing);
    expect(open._publication?.transparency.assessmentLanes.ingredient_clarity).toBe('unassessed');
    expect(open._publication?.transparency.assessmentLanes.origins).toBe('unassessed');
    expect(open._publication?.transparency.s26?.contributionOpportunity?.routeKey).toBe('origins');
    expect(resultContributionActions(open).addIngredients).toBe(true);
    expect(transparencyShowsSeparateAddIngredients(open)).toBe(true);

    const submitted = await submitIngredientsNutritionEvidence({
      barcode: BARCODE,
      ingredientsText: 'Wholegrain oats, water',
      asProductionEpoch: true,
    });
    const admitted = admitEvidence(submitted, { admissionReason: 'founder_ingredients', timestamp: 20 });
    if (!admitted.ok) throw new Error(admitted.reason);
    const snapshot = {
      barcode: BARCODE,
      authorityEnv: 'uat' as const,
      epoch: 'wave4a.uat',
      recordClass: 'uat' as const,
      generatedAt: 9000,
      prevailing: [
        {
          subjectKey: admitted.evidence.claimKey,
          versionId: admitted.evidence.evidenceId,
          versionNo: admitted.evidence.evidenceVersion,
          admissionSeq: 1,
          governance: 'active' as const,
          evidence: admitted.evidence,
        },
      ],
      offDispatch: [],
    };
    const resolved = await calculateTrustScore(missing, { authoritativeSnapshot: snapshot });
    expect(resolved._publication?.transparency.assessmentLanes.ingredient_clarity).toBe('resolved');
    expect(resultContributionActions(resolved).addIngredients).toBe(false);
    expect(transparencyShowsSeparateAddIngredients(resolved)).toBe(false);
    expect(resolved._publication?.transparency.s26?.contributionOpportunity?.routeKey).toBe('origins');
  });
});
