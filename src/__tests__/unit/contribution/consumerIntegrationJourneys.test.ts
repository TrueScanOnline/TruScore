/**
 * End-to-end consumer state for the Wave 4A integration corrective package.
 * Each test runs admitted evidence through calculation to the Result-facing product.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { admitEvidence } from '../../../contributions/admissionContract';
import { __setContributionCreationRecordClassForTests } from '../../../contributions/productionEpoch';
import { submitGovernedEvidence } from '../../../contributions/submitGovernedEvidence';
import type { ContributionEvidence } from '../../../contributions/types';
import { resultContributionActions, CONTRIBUTION_NOTICE_ADDED } from '../../../contribution/resultContributionActions';
import { stampCoreTruthAuthority } from '../../../config/coreTruthProductCacheAuthority';
import {
  loadAuthoritativeAssessment,
  projectSnapshotForAssessment,
  rememberedAuthoritativeSnapshot,
  rememberSnapshot,
  authoritativeStateSupersedes,
} from '../../../evidenceAuthority/assessment';
import type { SharedEvidenceSnapshot } from '../../../evidenceAuthority/types';
import {
  admitIngredientsNutritionEvidence,
  submitIngredientsNutritionEvidence,
} from '../../../ingredientsNutrition/governed';
import { calculateOpenPillar } from '../../../lib/truscoreEngine/pillars/openPillar';
import { calculateBodyPillar } from '../../../lib/truscoreEngine/pillars/bodyPillar';
import { calculatePlanetPillar } from '../../../lib/truscoreEngine/pillars/planetPillar';
import { calculateEthicsPillar } from '../../../lib/truscoreEngine/pillars/ethicsPillar';
import { settleCrossPillarPublication } from '../../../lib/rateability/settlePublication';
import { consumerClaimsScore } from '../../../lib/rateability/claimsPublication';
import { assessGovernedNutrientsFromProduct } from '../../../nutrition/governedNutrientAssessment';
import type { Product } from '../../../types/product';
import { calculateTrustScore } from '../../../utils/trustScore';

const BARCODE = '9300673555555';
const memory = new Map<string, string>();

function admitAt(evidence: ContributionEvidence): ContributionEvidence {
  const admitted = admitEvidence(evidence, { admissionReason: 'consumer_integration_journey', timestamp: 50 });
  if (!admitted.ok) throw new Error(admitted.reason);
  return admitted.evidence;
}

function snapshotOf(evidence: ContributionEvidence[], generatedAt = 1000): SharedEvidenceSnapshot {
  return {
    barcode: BARCODE,
    authorityEnv: 'uat',
    epoch: 'wave4a.uat',
    recordClass: 'uat',
    generatedAt,
    prevailing: evidence.map((row, index) => ({
      subjectKey: row.claimKey,
      versionId: row.evidenceId,
      versionNo: row.evidenceVersion,
      admissionSeq: index + 1,
      governance: 'active' as const,
      evidence: row,
    })),
    offDispatch: [],
  };
}

function sourceProduct(overrides: Partial<Product> = {}): Product {
  return stampCoreTruthAuthority({
    barcode: BARCODE,
    product_name: 'Journey oats',
    source: 'openfoodfacts',
    nutriments: { sugars_100g: 10, fat_100g: 1 },
    nutrition_data_per: '100g',
    ...overrides,
  } as Product);
}

async function resultFrom(evidence: ContributionEvidence[], product = sourceProduct()) {
  process.env.EXPO_PUBLIC_EVIDENCE_AUTHORITY_ENV = 'uat';
  return calculateTrustScore(product, { authoritativeSnapshot: snapshotOf(evidence) });
}

beforeEach(() => {
  memory.clear();
  __setContributionCreationRecordClassForTests('production');
  process.env.EXPO_PUBLIC_EVIDENCE_AUTHORITY_ENV = 'uat';
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

describe('consumer integration journeys', () => {
  it('E2E-1 projects admitted nutrition without rewriting source nutriments', async () => {
    const source = sourceProduct();
    const sourceSugars = source.nutriments?.sugars_100g;
    const submitted = await submitIngredientsNutritionEvidence({
      barcode: BARCODE,
      nutritionBasis: 'per_100g',
      amounts: [{ attribute: 'sugars', value: 5.69999980926514, unit: 'g' }],
      persistRemote: false,
    });
    const admitted = await admitIngredientsNutritionEvidence(submitted.evidenceId);
    const shown = await resultFrom([admitted], source);
    expect(projectSnapshotForAssessment(snapshotOf([admitted])).some((row) =>
      row.ingredientsNutrition?.nutriments?.some((amount) => amount.attribute === 'sugars')
    )).toBe(true);
    expect(shown.nutriments?.sugars_100g).toBe(5.7);
    expect(String(shown.nutriments?.sugars_100g)).not.toContain('999999');
    expect(shown.nutriments?.fat_100g).toBe(1);
    expect(shown.rveelGovernedNutrimentKeys).toContain('sugars_100g');
    expect(source.nutriments?.sugars_100g).toBe(sourceSugars);
    expect(assessGovernedNutrientsFromProduct(shown).nutrients.totalSugars.rawPer100).toBe(5.7);
    const reloaded = await resultFrom([admitted], sourceProduct());
    expect(reloaded.nutriments?.sugars_100g).toBe(5.7);
    await rememberSnapshot(snapshotOf([admitted], 2000));
    const rescannedLoad = await loadAuthoritativeAssessment(BARCODE, {
      fetchSnapshot: async () => null,
    });
    expect(rescannedLoad.source).toBe('cache');
    const rescanned = await calculateTrustScore(sourceProduct(), {
      authoritativeSnapshot: (await rememberedAuthoritativeSnapshot(BARCODE))!,
    });
    expect(rescanned.nutriments?.sugars_100g).toBe(5.7);
  });

  it('E2E-2 resolves Ingredient Clarity when the governed list has zero vague terms', async () => {
    const before = await resultFrom([]);
    expect(before._publication?.transparency.assessmentLanes.ingredient_clarity).toBe('unassessed');
    expect(resultContributionActions(before).addIngredients).toBe(true);
    const submitted = await submitIngredientsNutritionEvidence({
      barcode: BARCODE,
      ingredientsText: 'Raspberries',
      persistRemote: false,
    });
    const admitted = await admitIngredientsNutritionEvidence(submitted.evidenceId);
    const shown = await resultFrom([admitted]);
    expect(shown.rveelGovernedIngredientsText).toBe('Raspberries');
    expect(shown.ingredients_text).toBeUndefined();
    const open = calculateOpenPillar(shown);
    expect(open.adjustments.some((row) => row.id === 'open-v15-ing-clarity-zero')).toBe(true);
    expect(shown._publication?.transparency.assessmentLanes.ingredient_clarity).toBe('resolved');
    expect(resultContributionActions(shown).addIngredients).toBe(false);
    expect(resultContributionActions(shown).updateIngredients).toBe(true);
  });

  it('E2E-3 resolves Ingredient Clarity when the governed list contains a vague term', async () => {
    const submitted = await submitIngredientsNutritionEvidence({
      barcode: BARCODE,
      ingredientsText: 'Sugar, natural flavours',
      persistRemote: false,
    });
    const admitted = await admitIngredientsNutritionEvidence(submitted.evidenceId);
    const shown = await resultFrom([admitted]);
    expect(shown.rveelGovernedIngredientsText).toBe('Sugar, natural flavours');
    const open = calculateOpenPillar(shown);
    expect(open.adjustments.some((row) => row.id === 'open-v15-ing-clarity-one')).toBe(true);
    expect(shown._publication?.transparency.assessmentLanes.ingredient_clarity).toBe('resolved');
    expect(resultContributionActions(shown).addIngredients).toBe(false);
    expect(resultContributionActions(shown).updateIngredients).toBe(true);
  });

  it('E2E-4 leaves Claims unpublished when only the benchmark lane is assessed', () => {
    const product = sourceProduct();
    const ethics = calculateEthicsPillar(product);
    const assessment = ethics.details.claimsAssessment!;
    const snap = settleCrossPillarPublication({
      product,
      body: calculateBodyPillar(product),
      planet: calculatePlanetPillar(product),
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
            publication_packet_lane: 'unassessed_or_incomplete',
          },
        },
      },
      open: calculateOpenPillar(product),
      overallInternalScore: 60,
      settled: true,
    });
    expect(snap.claims.publicationStatus).toBe('nr');
    expect(snap.claims.publishedScore).toBeNull();
    expect(consumerClaimsScore(snap.claims)).toBeNull();
    expect(snap.overall.publicationStatus).toBe('nr');
    expect(snap.overall.publishedScore).toBeNull();
    expect(snap.claims.s26?.contributionOpportunity?.routeKey).toBe('packet_claims');
  });

  it('E2E-5 rates Claims from packet absence without a synthetic zero adjustment', async () => {
    const submitted = await submitGovernedEvidence({
      barcode: BARCODE,
      domain: 'packet_claims',
      claimValue: 'unused',
      packetAbsence: true,
      asProductionEpoch: true,
      persistRemote: false,
    });
    const admitted = admitAt(submitted);
    const shown = await resultFrom([admitted]);
    expect(shown.rveelPacketAbsenceEstablished).toBe(true);
    expect(shown._publication?.claims.assessmentLanes.packet).toBe('assessed');
    expect(shown._publication?.claims.publicationStatus).toBe('rated');
    expect(shown._publication?.claims.publishedScore).toBe(15);
    const fired = shown._truscore_analysis?.pillarDetails?.ethics?.adjustments
      ?? calculateEthicsPillar(shown, { admittedPacketAbsence: true }).adjustments;
    expect(fired.some((row) => row.value === 0 && String(row.id).startsWith('claims'))).toBe(false);
    expect(resultContributionActions(shown).packetInformationAction).toBe('update');
  });

  it('E2E-6 keeps a bare made-in statement from resolving Origins disclosure', async () => {
    const submitted = await submitGovernedEvidence({
      barcode: BARCODE,
      domain: 'origins',
      claimValue: 'Australia',
      exactWording: 'Made in Australia',
      asProductionEpoch: true,
      persistRemote: false,
      originStructured: { claimType: 'made_in', primaryCountry: 'Australia' },
    });
    const shown = await resultFrom([admitAt(submitted)]);
    expect(shown.rveelGovernedOrigins?.[0]?.exactWording).toBe('Made in Australia');
    expect(shown.rveelGovernedOrigins?.[0]?.claimType).toBe('made_in');
    expect(shown.rveelGovernedOrigins?.[0]?.percentage).toBeUndefined();
    expect(shown._publication?.transparency.assessmentLanes.origins).toBe('unassessed');
    expect(resultContributionActions(shown).originsAction).toBe('add');
  });

  it('E2E-7 lets an explicit made-in ingredient-origin component resolve Origins disclosure', async () => {
    const wording = 'Made in Australia from at least 92% Australian ingredients';
    const submitted = await submitGovernedEvidence({
      barcode: BARCODE,
      domain: 'origins',
      claimValue: 'Australia',
      exactWording: wording,
      asProductionEpoch: true,
      persistRemote: false,
      originStructured: {
        claimType: 'made_in',
        primaryCountry: 'Australia',
        ingredientOriginPercentage: 92,
        percentageQualifier: 'at_least',
      },
    });
    const before = await resultFrom([]);
    const shown = await resultFrom([admitAt(submitted)]);
    const fact = shown.rveelGovernedOrigins?.[0];
    expect(fact?.exactWording).toBe(wording);
    expect(fact?.claimType).toBe('made_in');
    expect(fact?.countries).toEqual(['Australia']);
    expect(fact?.percentage).toBe(92);
    expect(fact?.percentageQualifier).toBe('at_least');
    expect(before._publication?.transparency.assessmentLanes.origins).toBe('unassessed');
    expect(shown._publication?.transparency.assessmentLanes.origins).toBe('resolved');
    expect(shown._publication?.transparency.diagnostic.originsDisclosureRequirement).toBe('qualified_partial');
    expect(calculateOpenPillar(shown).details.originsAdjustmentId).toBe('open-v15-origins-insufficient');
    expect(resultContributionActions(shown).originsAction).toBe('update');
  });

  it('E2E-8 keeps admitted nutrition and origins across reload and rejects an older source load', async () => {
    expect(CONTRIBUTION_NOTICE_ADDED).toBe('Thanks - your contribution has been added.');
    const nutrition = await admitIngredientsNutritionEvidence(
      (
        await submitIngredientsNutritionEvidence({
          barcode: BARCODE,
          nutritionBasis: 'per_100g',
          amounts: [{ attribute: 'sugars', value: 2, unit: 'g' }],
          persistRemote: false,
        })
      ).evidenceId
    );
    const origin = admitAt(
      await submitGovernedEvidence({
        barcode: BARCODE,
        domain: 'origins',
        claimValue: 'Australia',
        exactWording: 'Made in Australia from at least 92% Australian ingredients',
        asProductionEpoch: true,
        persistRemote: false,
        originStructured: {
          claimType: 'made_in',
          primaryCountry: 'Australia',
          ingredientOriginPercentage: 92,
          percentageQualifier: 'at_least',
        },
      })
    );
    const ingredients = await admitIngredientsNutritionEvidence(
      (
        await submitIngredientsNutritionEvidence({
          barcode: BARCODE,
          ingredientsText: 'Raspberries',
          persistRemote: false,
        })
      ).evidenceId
    );
    const snapshot = snapshotOf([nutrition, origin, ingredients], 3000);
    const first = await calculateTrustScore(sourceProduct(), { authoritativeSnapshot: snapshot });
    const reloaded = await calculateTrustScore(sourceProduct(), { authoritativeSnapshot: snapshot });
    expect(reloaded.nutriments?.sugars_100g).toBe(first.nutriments?.sugars_100g);
    expect(reloaded.rveelGovernedIngredientsText).toBe('Raspberries');
    expect(reloaded.rveelGovernedOrigins?.[0]?.percentage).toBe(92);
    await rememberSnapshot(snapshot);
    const missed = await loadAuthoritativeAssessment(BARCODE, { fetchSnapshot: async () => null });
    expect(missed.evidence.length).toBeGreaterThan(0);
    const staleSource = sourceProduct({ nutriments: { sugars_100g: 10, fat_100g: 1 } });
    expect(authoritativeStateSupersedes(snapshot.generatedAt, 0)).toBe(false);
    expect(authoritativeStateSupersedes(snapshot.generatedAt, snapshot.generatedAt)).toBe(true);
    const reprojected = await calculateTrustScore(staleSource, { authoritativeSnapshot: snapshot });
    expect(reprojected.nutriments?.sugars_100g).toBe(2);
    expect(staleSource.nutriments?.sugars_100g).toBe(10);
  });
});
