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
import { cacheProduct, getCachedProduct } from '../../../services/cacheService';
import {
  NUTRITION_CONTRIBUTION_BASES,
  nutritionAmountsToSubmit,
  nutritionPrefillFromSource,
} from '../../../contribution/governedDisplayProjection';

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

function honeyProduct(overrides: Partial<Product> = {}): Product {
  return sourceProduct({
    product_name: 'Honey',
    ingredients_text: 'honey',
    ingredients_text_en: 'honey',
    lang: 'en',
    ingredients_lc: 'en',
    additives_tags: [],
    ...overrides,
  });
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
    expect(shown._publication?.transparency.diagnostic.originsDisclosureRequirement).toBe('stated_percentage_band');
    const originsAdjustment = calculateOpenPillar(shown).adjustments.find(
      (row) => row.id === 'open-v15-origins-pct-76-94'
    );
    expect(originsAdjustment?.value).toBe(-1);
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

  it('keeps governed nutrition and ingredients as projections through recalculation, withdrawal, and cache', async () => {
    const source = sourceProduct();
    const nutrition = await admitIngredientsNutritionEvidence(
      (
        await submitIngredientsNutritionEvidence({
          barcode: BARCODE,
          nutritionBasis: 'per_100g',
          amounts: [{ attribute: 'sugars', value: 2, unit: 'g' }],
          ingredientsText: 'Raspberries',
          persistRemote: false,
        })
      ).evidenceId
    );
    const snapshot = snapshotOf([nutrition], 4000);
    const shown = await calculateTrustScore(source, { authoritativeSnapshot: snapshot });
    expect(shown.nutriments?.sugars_100g).toBe(2);
    expect(shown.rveelGovernedIngredientsText).toBe('Raspberries');
    expect(shown.rveelSourceNutriments?.sugars_100g).toBe(10);
    expect(shown.ingredients_text).toBeUndefined();
    expect(source.nutriments?.sugars_100g).toBe(10);

    const again = await calculateTrustScore(shown, { authoritativeSnapshot: snapshot });
    expect(again.nutriments?.sugars_100g).toBe(2);
    expect(again.rveelSourceNutriments?.sugars_100g).toBe(10);
    expect(again.rveelGovernedIngredientsText).toBe('Raspberries');
    expect(source.nutriments?.sugars_100g).toBe(10);

    const withdrawn = await calculateTrustScore(again, { authoritativeSnapshot: snapshotOf([], 5000) });
    expect(withdrawn.nutriments?.sugars_100g).toBe(10);
    expect(withdrawn.rveelGovernedNutrimentKeys).toBeUndefined();
    expect(withdrawn.rveelGovernedIngredientsText).toBeUndefined();
    expect(withdrawn.rveelSourceNutriments?.sugars_100g).toBe(10);
    expect(assessGovernedNutrientsFromProduct(withdrawn).nutrients.totalSugars.rawPer100).toBe(10);

    await cacheProduct(shown, false);
    const loaded = await getCachedProduct(BARCODE, false);
    expect(loaded?.nutriments?.sugars_100g).toBe(10);
    expect(loaded?.ingredients_text).toBeUndefined();
    expect(loaded?.rveelGovernedNutrimentKeys).toBeUndefined();
    expect(loaded?.rveelGovernedIngredientsText).toBeUndefined();
    const fromCache = await calculateTrustScore(loaded!, { authoritativeSnapshot: snapshot });
    expect(fromCache.nutriments?.sugars_100g).toBe(2);
    expect(fromCache.rveelGovernedIngredientsText).toBe('Raspberries');
    expect(fromCache.rveelSourceNutriments?.sugars_100g).toBe(10);
  });

  it('prefills, edits, and publishes Nutrition on the Per 100 g basis', async () => {
    expect(NUTRITION_CONTRIBUTION_BASES.map((item) => item.basis)).toEqual(['per_100g']);
    const source = sourceProduct({
      nutriments: { sugars_100g: 10, fat_serving: 4 },
      nutrition_data_per: 'serving',
    });
    const prefill = nutritionPrefillFromSource(
      source.nutriments as Record<string, unknown>,
      source.nutrition_data_per
    );
    expect(prefill.basis).toBe('per_100g');
    expect(prefill.amounts.sugars).toBe('10');
    expect(prefill.amounts.fat).toBeUndefined();
    const edited = { ...prefill, amounts: { ...prefill.amounts, sugars: '2' } };
    expect(nutritionAmountsToSubmit(edited, prefill, ['sugars'])).toEqual([
      { attribute: 'sugars', value: 2, unit: 'g' },
    ]);
    const submitted = await submitIngredientsNutritionEvidence({
      barcode: BARCODE,
      nutritionBasis: 'per_100g',
      amounts: [{ attribute: 'sugars', value: 2, unit: 'g' }],
      persistRemote: false,
    });
    const admitted = await admitIngredientsNutritionEvidence(submitted.evidenceId);
    const shown = await resultFrom([admitted], source);
    expect(shown.nutriments?.sugars_100g).toBe(2);
    expect(shown.nutriments?.fat_serving).toBe(4);
    expect(assessGovernedNutrientsFromProduct(shown).nutrients.totalSugars.rawPer100).toBe(2);
    const reloaded = await calculateTrustScore(shown, { authoritativeSnapshot: snapshotOf([admitted]) });
    expect(reloaded.nutriments?.sugars_100g).toBe(2);
    expect(reloaded.rveelSourceNutriments?.sugars_100g).toBe(10);
  });

  it('does not submit a nutrient whose only change is floating-point formatting', () => {
    const prefill = nutritionPrefillFromSource(
      { fat_100g: 4.98749983310699, sugars_100g: 13.474999666214012 },
      '100g'
    );
    expect(prefill.amounts.fat).toBe('4.9875');
    expect(prefill.amounts.sugars).toBe('13.475');
    expect(prefill.amounts.fat).not.toContain('83310699');
    expect(prefill.amounts.sugars).not.toContain('666214');
    expect(nutritionAmountsToSubmit(prefill, prefill, ['fat', 'sugars'])).toEqual([]);
  });

  it('scores a reviewed 100% ingredient-origin statement as evidently complete', async () => {
    const wording = 'Made in Australia from 100% Australian ingredients';
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
        ingredientOriginPercentage: 100,
        percentageQualifier: 'exactly',
      },
    });
    const before = await resultFrom([]);
    const shown = await resultFrom([admitAt(submitted)]);
    const open = calculateOpenPillar(shown);
    expect(shown.rveelGovernedOrigins?.[0]?.claimType).toBe('made_in');
    expect(shown.rveelGovernedOrigins?.[0]?.percentage).toBe(100);
    expect(open.details.originsAdjustmentId).toBe('open-v15-origins-evidently-complete');
    expect(open.details.originsAdjustment).toBe(8);
    expect(open.score).toBeGreaterThan(calculateOpenPillar(before).score);
    expect(shown._publication?.transparency.assessmentLanes.origins).toBe('resolved');
    expect(resultContributionActions(shown).originsAction).toBe('update');
  });

  it('publishes overall TruScore only after Packet assessment makes every pillar rateable', () => {
    const product = sourceProduct({
      nutriscore_grade: 'a',
      nova_group: 2,
      ecoscore_grade: 'b',
      ingredients_text: 'Raspberries',
      ingredients_text_en: 'Raspberries',
      lang: 'en',
      ingredients_lc: 'en',
    });
    const withBenchmark = (ethics: ReturnType<typeof calculateEthicsPillar>) => ({
      ...ethics,
      details: {
        ...ethics.details,
        claimsAssessment: {
          ...ethics.details.claimsAssessment!,
          benchmark_checks: [
            { source: 'ktc' as const, status: 'no_finding' as const },
            { source: 'bbfaw' as const, status: 'no_finding' as const },
          ],
        },
      },
    });
    const benchmarkOnly = settleCrossPillarPublication({
      product,
      body: calculateBodyPillar(product),
      planet: calculatePlanetPillar(product),
      ethics: withBenchmark(calculateEthicsPillar(product)),
      open: calculateOpenPillar(product),
      overallInternalScore: 60,
      settled: true,
    });
    expect(benchmarkOnly.claims.publicationStatus).toBe('nr');
    expect(benchmarkOnly.overall.publicationStatus).toBe('nr');
    expect(benchmarkOnly.overall.publishedScore).toBeNull();

    const packetAssessed = settleCrossPillarPublication({
      product,
      body: calculateBodyPillar(product),
      planet: calculatePlanetPillar(product),
      ethics: withBenchmark(calculateEthicsPillar(product, { admittedPacketAbsence: true })),
      open: calculateOpenPillar(product),
      overallInternalScore: 60,
      settled: true,
    });
    expect(packetAssessed.claims.publicationStatus).toBe('rated');
    expect(packetAssessed.claims.publishedScore).toBe(15);
    expect(packetAssessed.body.publicationStatus).toBe('rated');
    expect(packetAssessed.planet.publicationStatus).toBe('rated');
    expect(packetAssessed.transparency.publicationStatus).toBe('rated');
    expect(packetAssessed.overall.publicationStatus).toBe('rated');
    expect(packetAssessed.overall.publishedScore).not.toBeNull();
  });

  it('scores grown_in and produced_in as evidently complete for Australia and New Zealand', async () => {
    const cases = [
      { claimType: 'grown_in' as const, country: 'Australia', wording: 'Grown in Australia' },
      { claimType: 'grown_in' as const, country: 'New Zealand', wording: 'Grown in New Zealand' },
      { claimType: 'produced_in' as const, country: 'Australia', wording: 'Produced in Australia' },
      { claimType: 'produced_in' as const, country: 'New Zealand', wording: 'Produced in New Zealand' },
    ];
    for (const item of cases) {
      const admitted = admitAt(
        await submitGovernedEvidence({
          barcode: BARCODE,
          domain: 'origins',
          claimValue: item.country,
          exactWording: item.wording,
          asProductionEpoch: true,
          persistRemote: false,
          originStructured: { claimType: item.claimType, primaryCountry: item.country },
        })
      );
      const shown = await calculateTrustScore(honeyProduct(), { authoritativeSnapshot: snapshotOf([admitted]) });
      const open = calculateOpenPillar(shown);
      expect(open.details.originsAdjustmentId).toBe('open-v15-origins-evidently-complete');
      expect(open.details.originsAdjustment).toBe(8);
      expect(open.adjustments.filter((row) => row.id === 'open-v15-origins-evidently-complete')).toHaveLength(1);
      expect(shown._publication?.transparency.assessmentLanes.origins).toBe('resolved');
    }
  });

  it('leaves bare made_in and packed_in without an Origins disclosure adjustment', async () => {
    for (const item of [
      { claimType: 'made_in' as const, country: 'Australia', wording: 'Made in Australia' },
      { claimType: 'made_in' as const, country: 'New Zealand', wording: 'Made in New Zealand' },
      { claimType: 'packed_in' as const, country: 'Australia', wording: 'Packed in Australia' },
    ]) {
      const admitted = admitAt(
        await submitGovernedEvidence({
          barcode: BARCODE,
          domain: 'origins',
          claimValue: item.country,
          exactWording: item.wording,
          asProductionEpoch: true,
          persistRemote: false,
          originStructured: { claimType: item.claimType, primaryCountry: item.country },
        })
      );
      const shown = await calculateTrustScore(honeyProduct(), { authoritativeSnapshot: snapshotOf([admitted]) });
      const open = calculateOpenPillar(shown);
      expect(open.details.originsAdjustmentId).toBe('open-v15-origins-insufficient');
      expect(open.details.originsAdjustment).toBe(0);
      expect(shown._publication?.transparency.assessmentLanes.origins).toBe('unassessed');
    }
  });

  it('scores a 100% made-in ingredient proposition without a qualifier as evidently complete', async () => {
    const admitted = admitAt(
      await submitGovernedEvidence({
        barcode: BARCODE,
        domain: 'origins',
        claimValue: 'Australia',
        exactWording: 'Made in Australia from 100% Australian ingredients',
        asProductionEpoch: true,
        persistRemote: false,
        originStructured: {
          claimType: 'made_in',
          primaryCountry: 'Australia',
          ingredientOriginPercentage: 100,
        },
      })
    );
    const shown = await calculateTrustScore(honeyProduct(), { authoritativeSnapshot: snapshotOf([admitted]) });
    const open = calculateOpenPillar(shown);
    expect(shown.rveelGovernedOrigins?.[0]?.claimType).toBe('made_in');
    expect(shown.rveelGovernedOrigins?.[0]?.percentage).toBe(100);
    expect(shown.rveelGovernedOrigins?.[0]?.percentageQualifier).toBeUndefined();
    expect(open.details.originsAdjustmentId).toBe('open-v15-origins-evidently-complete');
    expect(open.details.originsAdjustment).toBe(8);
  });

  it('replaces a conflicting OFF origin adjustment with the prevailing governed proposition', async () => {
    const offAustralia = honeyProduct({ origins_tags: ['en:australia'] });
    const before = calculateOpenPillar(offAustralia);
    expect(before.details.originsAdjustmentId).toBe('open-v15-origins-evidently-complete');
    expect(before.details.originsAdjustment).toBe(8);

    const admitted = admitAt(
      await submitGovernedEvidence({
        barcode: BARCODE,
        domain: 'origins',
        claimValue: 'New Zealand',
        exactWording: 'Grown in New Zealand',
        asProductionEpoch: true,
        persistRemote: false,
        originStructured: { claimType: 'grown_in', primaryCountry: 'New Zealand' },
      })
    );
    const snapshot = snapshotOf([admitted], 7000);
    const shown = await calculateTrustScore(offAustralia, { authoritativeSnapshot: snapshot });
    const open = calculateOpenPillar(shown);
    expect(shown.rveelGovernedOrigins?.[0]?.countries).toEqual(['New Zealand']);
    expect(open.details.originsAdjustmentId).toBe('open-v15-origins-evidently-complete');
    expect(open.details.originsAdjustment).toBe(8);
    expect(open.details.originsProvenance).toBe('governed_packet');
    expect(open.adjustments.filter((row) => row.family === 'origins')).toHaveLength(1);
    expect(shown._publication?.transparency.assessmentLanes.origins).toBe('resolved');
    expect(shown._publication?.transparency.diagnostic.originsDisclosureSource).toBe('primary_contribution');

    const withdrawn = await calculateTrustScore(shown, { authoritativeSnapshot: snapshotOf([], 8000) });
    const restored = calculateOpenPillar(withdrawn);
    expect(withdrawn.rveelGovernedOrigins).toBeUndefined();
    expect(withdrawn.origins_tags).toEqual(['en:australia']);
    expect(restored.details.originsAdjustmentId).toBe('open-v15-origins-evidently-complete');
    expect(restored.details.originsAdjustment).toBe(8);
    expect(restored.details.originsProvenance).toBe('off_raw_origins');
  });

  it('replaces a conflicting OFF origin adjustment with the prevailing percentage band', async () => {
    const admitted = admitAt(
      await submitGovernedEvidence({
        barcode: BARCODE,
        domain: 'origins',
        claimValue: 'New Zealand',
        exactWording: 'Honey from at least 92% New Zealand',
        asProductionEpoch: true,
        persistRemote: false,
        originStructured: {
          claimType: 'ingredient_origin',
          primaryCountry: 'New Zealand',
          ingredientSubject: 'Honey',
          ingredientOriginPercentage: 92,
          percentageQualifier: 'at_least',
        },
      })
    );
    const shown = await calculateTrustScore(honeyProduct({ origins_tags: ['en:australia'] }), {
      authoritativeSnapshot: snapshotOf([admitted]),
    });
    const open = calculateOpenPillar(shown);
    expect(open.details.originsAdjustmentId).toBe('open-v15-origins-pct-76-94');
    expect(open.details.originsAdjustment).toBe(-1);
    expect(open.details.originsProvenance).toBe('governed_packet');
    expect(open.adjustments.filter((row) => row.family === 'origins')).toHaveLength(1);
    expect(shown.rveelGovernedOrigins?.[0]?.percentage).toBe(92);
    expect(shown.rveelGovernedOrigins?.[0]?.percentageQualifier).toBe('at_least');
  });

  it('maps an unquantified sole-ingredient origin to evidently complete for any country', async () => {
    const cases = [
      { subject: 'Honey', country: 'Canada', wording: 'Honey from Canada' },
      { subject: 'Cocoa', country: 'Ghana', wording: 'Cocoa from Ghana' },
    ];
    for (const item of cases) {
      const admitted = admitAt(
        await submitGovernedEvidence({
          barcode: BARCODE,
          domain: 'origins',
          claimValue: item.country,
          exactWording: item.wording,
          asProductionEpoch: true,
          persistRemote: false,
          originStructured: {
            claimType: 'ingredient_origin',
            primaryCountry: item.country,
            ingredientSubject: item.subject,
          },
        })
      );
      const shown = await calculateTrustScore(
        honeyProduct({
          product_name: item.subject,
          ingredients_text: item.subject.toLowerCase(),
          ingredients_text_en: item.subject.toLowerCase(),
        }),
        { authoritativeSnapshot: snapshotOf([admitted]) }
      );
      const open = calculateOpenPillar(shown);
      expect(shown._publication?.transparency.diagnostic.originsDisclosureRequirement).toBe('evidently_complete');
      expect(open.details.originsAdjustmentId).toBe('open-v15-origins-evidently-complete');
      expect(open.details.originsAdjustment).toBe(8);
      expect(open.details.originsProvenance).toBe('governed_packet');
    }
  });

  it('replaces conflicting OFF France with a prevailing unquantified ingredient origin', async () => {
    const admitted = admitAt(
      await submitGovernedEvidence({
        barcode: BARCODE,
        domain: 'origins',
        claimValue: 'Canada',
        exactWording: 'Honey from Canada',
        asProductionEpoch: true,
        persistRemote: false,
        originStructured: {
          claimType: 'ingredient_origin',
          primaryCountry: 'Canada',
          ingredientSubject: 'Honey',
        },
      })
    );
    const shown = await calculateTrustScore(honeyProduct({ origins_tags: ['en:france'] }), {
      authoritativeSnapshot: snapshotOf([admitted]),
    });
    const open = calculateOpenPillar(shown);
    expect(shown._publication?.transparency.assessmentLanes.origins).toBe('resolved');
    expect(shown._publication?.transparency.diagnostic.originsDisclosureSource).toBe('primary_contribution');
    expect(open.details.originsAdjustmentId).toBe('open-v15-origins-evidently-complete');
    expect(open.details.originsAdjustment).toBe(8);
    expect(open.details.originsProvenance).toBe('governed_packet');
    expect(open.adjustments.filter((row) => row.family === 'origins')).toHaveLength(1);
  });

  it('lets a hybrid made-in ingredient origin replace conflicting OFF France', async () => {
    const admitted = admitAt(
      await submitGovernedEvidence({
        barcode: BARCODE,
        domain: 'origins',
        claimValue: 'Canada',
        exactWording: 'Made in Canada from at least 92% Canadian ingredients',
        asProductionEpoch: true,
        persistRemote: false,
        originStructured: {
          claimType: 'made_in',
          primaryCountry: 'Canada',
          ingredientOriginPercentage: 92,
          percentageQualifier: 'at_least',
        },
      })
    );
    const shown = await calculateTrustScore(honeyProduct({ origins_tags: ['en:france'] }), {
      authoritativeSnapshot: snapshotOf([admitted]),
    });
    const open = calculateOpenPillar(shown);
    expect(shown.rveelGovernedOrigins?.[0]?.claimType).toBe('made_in');
    expect(shown.rveelGovernedOrigins?.[0]?.percentage).toBe(92);
    expect(shown.rveelGovernedOrigins?.[0]?.percentageQualifier).toBe('at_least');
    expect(shown._publication?.transparency.diagnostic.originsDisclosureRequirement).toBe('stated_percentage_band');
    expect(open.details.originsAdjustmentId).toBe('open-v15-origins-pct-76-94');
    expect(open.details.originsAdjustment).toBe(-1);
    expect(open.details.originsProvenance).toBe('governed_packet');
    expect(open.adjustments.filter((row) => row.family === 'origins')).toHaveLength(1);
  });

  it('does not let a bare made-in statement displace scoring-eligible OFF origins', async () => {
    const offOnly = calculateOpenPillar(honeyProduct({ origins_tags: ['en:france'] }));
    const admitted = admitAt(
      await submitGovernedEvidence({
        barcode: BARCODE,
        domain: 'origins',
        claimValue: 'Canada',
        exactWording: 'Made in Canada',
        asProductionEpoch: true,
        persistRemote: false,
        originStructured: { claimType: 'made_in', primaryCountry: 'Canada' },
      })
    );
    const shown = await calculateTrustScore(honeyProduct({ origins_tags: ['en:france'] }), {
      authoritativeSnapshot: snapshotOf([admitted]),
    });
    const open = calculateOpenPillar(shown);
    expect(shown.rveelGovernedOrigins?.[0]?.claimType).toBe('made_in');
    expect(shown.rveelGovernedOrigins?.[0]?.percentage).toBeUndefined();
    expect(open.details.originsAdjustmentId).toBe(offOnly.details.originsAdjustmentId);
    expect(open.details.originsAdjustment).toBe(8);
    expect(open.details.originsProvenance).toBe('off_raw_origins');
    expect(open.adjustments.filter((row) => row.family === 'origins')).toHaveLength(1);
  });

  it('leaves packed-in outside Origins scoring', async () => {
    const admitted = admitAt(
      await submitGovernedEvidence({
        barcode: BARCODE,
        domain: 'origins',
        claimValue: 'Italy',
        exactWording: 'Packed in Italy',
        asProductionEpoch: true,
        persistRemote: false,
        originStructured: { claimType: 'packed_in', primaryCountry: 'Italy' },
      })
    );
    const shown = await calculateTrustScore(honeyProduct(), { authoritativeSnapshot: snapshotOf([admitted]) });
    const open = calculateOpenPillar(shown);
    expect(open.details.originsAdjustmentId).toBe('open-v15-origins-insufficient');
    expect(open.details.originsAdjustment).toBe(0);
    expect(shown._publication?.transparency.assessmentLanes.origins).toBe('unassessed');

    const besideOff = await calculateTrustScore(honeyProduct({ origins_tags: ['en:france'] }), {
      authoritativeSnapshot: snapshotOf([admitted]),
    });
    const besideOpen = calculateOpenPillar(besideOff);
    expect(besideOpen.details.originsAdjustmentId).toBe('open-v15-origins-evidently-complete');
    expect(besideOpen.details.originsAdjustment).toBe(8);
    expect(besideOpen.details.originsProvenance).toBe('off_raw_origins');
  });

  it('keeps the source nutrition basis through projection, cache, and withdrawal', async () => {
    for (const basis of ['serving', '100ml', '100g'] as const) {
      const source = sourceProduct({ nutrition_data_per: basis });
      const admitted = await admitIngredientsNutritionEvidence(
        (
          await submitIngredientsNutritionEvidence({
            barcode: BARCODE,
            nutritionBasis: 'per_100g',
            amounts: [{ attribute: 'sugars', value: 2, unit: 'g' }],
            persistRemote: false,
          })
        ).evidenceId
      );
      const snapshot = snapshotOf([admitted], 9000);
      const shown = await calculateTrustScore(source, { authoritativeSnapshot: snapshot });
      const again = await calculateTrustScore(shown, { authoritativeSnapshot: snapshot });
      expect(shown.nutrition_data_per).toBe(basis);
      expect(again.nutrition_data_per).toBe(basis);
      expect(again.rveelSourceNutritionDataPer).toBe(basis);
      expect(again.nutriments?.sugars_100g).toBe(2);
      await cacheProduct(again, false);
      const loaded = await getCachedProduct(BARCODE, false);
      expect(loaded?.nutrition_data_per).toBe(basis);
      expect(loaded?.nutriments?.sugars_100g).toBe(10);
      const withdrawn = await calculateTrustScore(loaded!, { authoritativeSnapshot: snapshotOf([], 9100) });
      expect(withdrawn.nutrition_data_per).toBe(basis);
      expect(withdrawn.nutriments?.sugars_100g).toBe(10);
    }
  });
});
