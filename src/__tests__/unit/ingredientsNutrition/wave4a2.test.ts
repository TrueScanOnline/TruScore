import AsyncStorage from '@react-native-async-storage/async-storage';
import { __clearBodyReceiverPredicatesForTests } from '../../../contributions/bodyReceiverRegistry';
import { getLocalEvidenceForBarcode } from '../../../contributions/evidenceStore';
import { toScoringProduct } from '../../../contributions/eligibilityBoundary';
import { __setContributionCreationRecordClassForTests } from '../../../contributions/productionEpoch';
import { calculateTruScore } from '../../../lib/truscoreEngine';
import {
  admitIngredientsNutritionEvidence,
  submitIngredientsNutritionEvidence,
} from '../../../ingredientsNutrition/governed';
import {
  dispatchIngredientsNutritionToOff,
  offDispatchConsumerCopy,
} from '../../../ingredientsNutrition/offDispatch';
import { establishNutrition, nutritionPanelIsComplete, projectOffWriteFields } from '../../../ingredientsNutrition/nutritionSchema';
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

const BARCODE = '9300673999994';
const memory = new Map<string, string>();

function product(overrides: Partial<Product> = {}): Product {
  return {
    barcode: BARCODE,
    product_name: 'Wave 4A.2 fixture',
    source: 'openfoodfacts',
    ...overrides,
  } as Product;
}

function bodyOf(scored: ReturnType<typeof calculateTruScore>) {
  return scored.publication?.body;
}

beforeEach(() => {
  memory.clear();
  __clearBodyReceiverPredicatesForTests();
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
  __clearBodyReceiverPredicatesForTests();
});

describe('Wave 4A.2 ingredients and nutrition', () => {
  it('keeps ingredients-only and nutrition-only contributions valid and incomplete', async () => {
    const ingredients = await submitIngredientsNutritionEvidence({
      barcode: BARCODE,
      ingredientsText: 'peas',
    });
    const nutrition = await submitIngredientsNutritionEvidence({
      barcode: BARCODE,
      nutritionBasis: 'per_100g',
      amounts: [{ attribute: 'sugars', value: 4, unit: 'g' }],
    });
    expect(ingredients.admissionStatus).toBe('submitted');
    expect(nutrition.admissionStatus).toBe('submitted');
    expect(ingredients.ingredientsNutrition?.nutritionComplete).toBe(false);
    expect(nutrition.ingredientsNutrition?.nutritionComplete).toBe(false);
    expect(nutrition.ingredientsNutrition?.nutriments?.[0]).toEqual({
      attribute: 'sugars',
      value: 4,
      unit: 'g',
    });

    const callerSaysComplete = await submitIngredientsNutritionEvidence({
      barcode: BARCODE,
      nutritionBasis: 'per_100g',
      amounts: [{ attribute: 'sugars', value: 0, unit: 'g' }],
    });
    expect(callerSaysComplete.ingredientsNutrition?.nutritionComplete).toBe(false);
    expect(callerSaysComplete.ingredientsNutrition?.nutriments?.[0]?.value).toBe(0);

    const full = await submitIngredientsNutritionEvidence({
      barcode: BARCODE,
      nutritionBasis: 'per_100g',
      amounts: [
        { attribute: 'energy-kj', value: 0, unit: 'kJ' },
        { attribute: 'fat', value: 0, unit: 'g' },
        { attribute: 'saturated-fat', value: 0, unit: 'g' },
        { attribute: 'carbohydrates', value: 0, unit: 'g' },
        { attribute: 'sugars', value: 0, unit: 'g' },
        { attribute: 'proteins', value: 0, unit: 'g' },
        { attribute: 'sodium', value: 0, unit: 'mg' },
      ],
    });
    expect(full.ingredientsNutrition?.nutritionComplete).toBe(true);
    expect(
      nutritionPanelIsComplete({
        basis: 'per_100g',
        amounts: [{ attribute: 'sugars', value: 4, unit: 'g' }],
      })
    ).toBe(false);
    expect(establishNutrition({ basis: 'per_100g', amounts: [{ attribute: 'sugars', value: 4, unit: 'kcal' }] })).toBe(
      undefined
    );
    expect(establishNutrition({ amounts: [{ attribute: 'sugars', value: 4, unit: 'g' }] })).toBe(undefined);
    expect(establishNutrition({ basis: 'per_100g', amounts: [{ attribute: 'sugars', value: 4 }] })).toBe(undefined);
    const statedZero = projectOffWriteFields({
      barcode: BARCODE,
      nutrition: establishNutrition({
        basis: 'per_100ml',
        amounts: [{ attribute: 'sodium', value: 0, unit: 'mg' }],
      }),
    });
    expect(statedZero).toMatchObject({ nutrition_data_per: '100ml', nutriment_sodium_100g: '0' });
    expect(statedZero && 'nutriment_sodium' in statedZero).toBe(false);
  });

  it('does not turn an unreviewed machine proposal or unadmitted submit into a governed scoring fact', async () => {
    const session = await openSessionForProduct({ barcode: BARCODE });
    const photo = await commitStagedCapture({
      sessionId: session.sessionId,
      bytes: new Uint8Array([1, 2, 3, 4]),
      source: 'camera',
    });
    await setSourceFraming(session.sessionId, photo.asset.assetId, 'targeted');
    const unit = await addManualEvidenceUnit({
      sessionId: session.sessionId,
      domain: 'ingredients_nutrition',
      section: 'ingredients',
      statement: 'tartrazine',
      support: { coverage: 'whole_image', sourceAssetId: photo.asset.assetId },
    });
    const beforeReview = await handoffReviewedUnits({ sessionId: session.sessionId });
    expect(beforeReview[0]?.outcome).toBe('skipped');
    expect(await getLocalEvidenceForBarcode(BARCODE)).toHaveLength(0);

    await assignReviewDisposition({
      sessionId: session.sessionId,
      unitId: unit.unitId,
      disposition: 'A',
    });
    await applyReviewAction({
      sessionId: session.sessionId,
      unitId: unit.unitId,
      action: 'accept',
    });
    const handed = await handoffReviewedUnits({ sessionId: session.sessionId });
    expect(handed[0]?.outcome).toBe('submitted');
    const stored = await getLocalEvidenceForBarcode(BARCODE);
    expect(stored[0]?.admissionStatus).toBe('submitted');
    const scoring = toScoringProduct(product({ nutriscore_grade: 'a', nova_group: 2 }), stored);
    expect(scoring?.ingredients_text).toBeUndefined();
    expect(scoring?._rveelPrimaryContributionBodyDependence).toBeUndefined();
  });

  it('lets admitted ingredient text use existing Body6 scoring and caps confidence at Limited', async () => {
    const base = product({ nutriscore_grade: 'a', nova_group: 2 });
    const before = calculateTruScore(base);
    const submitted = await submitIngredientsNutritionEvidence({
      barcode: BARCODE,
      ingredientsText: 'tartrazine',
    });
    const admitted = await admitIngredientsNutritionEvidence(submitted.evidenceId);
    const after = calculateTruScore(base, undefined, { promotedContributionEvidence: [admitted] });
    expect(after.breakdown.Body).toBeLessThan(before.breakdown.Body as number);
    expect(after.pillarDetails?.body.adjustments.some((row) => row.id.includes('nova'))).toBe(
      before.pillarDetails?.body.adjustments.some((row) => row.id.includes('nova'))
    );
    expect(bodyOf(after)?.confidence).toBe('limited');
    expect(bodyOf(after)?.confidenceReasonCode).toBe('body_primary_contribution_limited');
    expect(bodyOf(after)?.s26?.code).toBe('BODY_LIMITED_PRIMARY_CONTRIBUTION');
    expect(bodyOf(before)?.confidence).toBe('moderate');
    expect(after.pillarDetails?.body.details.hasNutriScore).toBe(true);
    expect(toScoringProduct(base, [admitted])?.nutriscore_grade).toBe('a');
  });

  it('does not let Body6 alone resolve a confidence lane', () => {
    const scored = calculateTruScore(product({ ingredients_text: 'tartrazine' }));
    expect(bodyOf(scored)?.publicationStatus).toBe('nr');
    expect(bodyOf(scored)?.assessmentLanes).toEqual({
      nutrition: 'unassessed',
      processing: 'unassessed',
    });
  });

  it('activates Whole Produce only when the existing predicate already passes', async () => {
    const base = product({
      nova_group: 1,
      nova1Provenance: 'off',
      categories_tags: ['en:fresh-fruits'],
      additives_tags: [],
    });
    const before = calculateTruScore(base);
    expect(before.pillarDetails?.body.details.wholeProduceAdjustmentApplied).toBe(false);
    const admitted = await admitIngredientsNutritionEvidence(
      (
        await submitIngredientsNutritionEvidence({
          barcode: BARCODE,
          ingredientsText: 'apples',
        })
      ).evidenceId
    );
    const after = calculateTruScore(base, undefined, { promotedContributionEvidence: [admitted] });
    expect(after.pillarDetails?.body.details.wholeProduceAdjustmentApplied).toBe(true);
    expect(after.pillarDetails?.body.adjustments.some((row) => row.id === 'body-v12-whole-produce-rescue')).toBe(
      true
    );
    expect(after.pillarDetails?.body.adjustments.some((row) => row.id === 'body-v12-nova-1-inferred')).toBe(false);
    expect(bodyOf(after)?.confidence).toBe('limited');
    expect(bodyOf(after)?.s26?.code).toBe('BODY_LIMITED_PRIMARY_CONTRIBUTION');

    const noCategory = calculateTruScore(
      product({ nova_group: 1, nova1Provenance: 'off', categories_tags: ['en:snacks'] }),
      undefined,
      { promotedContributionEvidence: [admitted] }
    );
    expect(noCategory.pillarDetails?.body.details.wholeProduceAdjustmentApplied).toBe(false);
  });

  it('preserves the existing NOVA 1 rescue predicate and does not infer NOVA from an arbitrary list', async () => {
    const peas = await admitIngredientsNutritionEvidence(
      (
        await submitIngredientsNutritionEvidence({
          barcode: BARCODE,
          ingredientsText: 'peas',
        })
      ).evidenceId
    );
    const rescued = calculateTruScore(
      product({ nutriscore_grade: 'a', categories_tags: ['en:snacks'], additives_tags: [] }),
      undefined,
      { promotedContributionEvidence: [peas] }
    );
    expect(rescued.pillarDetails?.body.adjustments.some((row) => row.id === 'body-v12-nova-1-inferred')).toBe(
      true
    );
    expect(toScoringProduct(product({ nutriscore_grade: 'a' }), [peas])?.nova1Provenance).toBe('inferred');
    expect(bodyOf(rescued)?.confidence).toBe('limited');
    expect(rescued.pillarDetails?.body.details.wholeProduceAdjustmentApplied).toBe(false);

    const apples = await admitIngredientsNutritionEvidence(
      (
        await submitIngredientsNutritionEvidence({
          barcode: BARCODE,
          ingredientsText: 'apples',
        })
      ).evidenceId
    );
    const notRescued = toScoringProduct(product({ nutriscore_grade: 'b', additives_tags: [] }), [apples]);
    expect(notRescued?.nova_group).toBeUndefined();
    expect(notRescued?.nova1Provenance).toBeUndefined();

    const alreadyClassified = toScoringProduct(
      product({ nutriscore_grade: 'a', nova_group: 4, ingredients_text: undefined }),
      [peas]
    );
    expect(alreadyClassified?.nova_group).toBe(4);
    expect(alreadyClassified?.nova1Provenance).toBeUndefined();
  });

  it('does not manufacture Nutri-Score or NOVA from contributed nutrition values', async () => {
    const admitted = await admitIngredientsNutritionEvidence(
      (
        await submitIngredientsNutritionEvidence({
          barcode: BARCODE,
          nutritionBasis: 'per_100g',
          amounts: [
            { attribute: 'energy-kcal', value: 40, unit: 'kcal' },
            { attribute: 'fat', value: 0, unit: 'g' },
          ],
        })
      ).evidenceId
    );
    const scoring = toScoringProduct(product(), [admitted]);
    expect(scoring?.nutriscore_grade).toBeUndefined();
    expect(scoring?.nova_group).toBeUndefined();
    expect(scoring?.nutriments).toBeUndefined();
    expect(scoring?._rveelPrimaryContributionBodyDependence).toBeUndefined();
    const scored = calculateTruScore(product(), undefined, { promotedContributionEvidence: [admitted] });
    expect(bodyOf(scored)?.publicationStatus).toBe('nr');
  });

  it('lets later ordinary OFF Nutri-Score and NOVA supersede the contribution route', async () => {
    const admitted = await admitIngredientsNutritionEvidence(
      (
        await submitIngredientsNutritionEvidence({
          barcode: BARCODE,
          ingredientsText: 'tartrazine',
        })
      ).evidenceId
    );
    const ordinary = product({
      nutriscore_grade: 'a',
      nova_group: 2,
      ingredients_text: 'sugar, wheat flour',
    });
    const withContribution = calculateTruScore(ordinary, undefined, {
      promotedContributionEvidence: [admitted],
    });
    const without = calculateTruScore(ordinary);
    expect(withContribution.breakdown.Body).toBe(without.breakdown.Body);
    expect(bodyOf(withContribution)?.confidence).toBe('moderate');
    expect(bodyOf(withContribution)?.confidenceReasonCode).toBe('body_both_lanes');
    expect(toScoringProduct(ordinary, [admitted])?.ingredients_text).toBe('sugar, wheat flour');
    expect(toScoringProduct(ordinary, [admitted])?._rveelPrimaryContributionBodyDependence).toBeUndefined();
  });

  it('sends only established fields, retries a failed send, and does not treat a write as a classification', async () => {
    const admitted = await admitIngredientsNutritionEvidence(
      (
        await submitIngredientsNutritionEvidence({
          barcode: BARCODE,
          ingredientsText: 'peas',
          nutritionBasis: 'per_100g',
          amounts: [{ attribute: 'sugars', value: 2, unit: 'g' }],
        })
      ).evidenceId
    );
    let calls = 0;
    const failed = await dispatchIngredientsNutritionToOff({
      evidence: admitted,
      fetchImpl: async () => {
        calls += 1;
        throw new Error('offline');
      },
    });
    expect(failed.status).toBe('failed_retryable');
    expect(offDispatchConsumerCopy(failed.status)).toContain('Saved in Rveel');
    expect(offDispatchConsumerCopy(null)).toBe('Saved in Rveel.');

    const sent = await dispatchIngredientsNutritionToOff({
      evidence: admitted,
      fetchImpl: async (url, init) => {
        calls += 1;
        const body = JSON.parse(init.body) as Record<string, unknown>;
        expect(url).toContain('/api/off-product-write');
        expect(body.password).toBeUndefined();
        expect(body.user_id).toBeUndefined();
        expect(JSON.stringify(body)).not.toMatch(/EXPO_PUBLIC_OFF/);
        expect(body.ingredientsText).toBe('peas');
        expect(body.amounts).toEqual([{ attribute: 'sugars', value: 2, unit: 'g' }]);
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true, status: 'sent', visibleOnOff: false, derivedClassification: false }),
        };
      },
    });
    expect(sent.status).toBe('sent');
    expect(sent.fields).toMatchObject({
      ingredients_text: 'peas',
      nutrition_data_per: '100g',
      nutriment_sugars_100g: '2',
    });
    expect(sent.fields.nutriscore_grade).toBeUndefined();
    expect(sent.fields.nova_group).toBeUndefined();
    expect(sent.fields.password).toBeUndefined();
    expect(sent.attemptCount).toBe(2);
    expect(offDispatchConsumerCopy('sent')).not.toMatch(/will derive|Nutri-Score is available|NOVA group is available/i);
    const again = await dispatchIngredientsNutritionToOff({
      evidence: admitted,
      fetchImpl: async () => {
        calls += 1;
        return { ok: true, status: 200 };
      },
    });
    expect(again).toEqual(sent);
    expect(calls).toBe(2);
  });
});
