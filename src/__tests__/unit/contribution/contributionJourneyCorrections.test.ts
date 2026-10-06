import { nutritionAmountsToSubmit, nutritionPrefillFromSource, formatConsumerNutrient } from '../../../contribution/governedDisplayProjection';
import { offNutrientValue } from '../../../ingredientsNutrition/nutritionSchema';
import { sodiumMgFromNutriments } from '../../../nutrition/governedNutrientAssessment';
import { reviewedUnitSupport } from '../../../contribution/submissionReadiness';
import { capturedOriginQualifications } from '../../../contributions/originStructured';
import { formatGovernedOriginFactLine } from '../../../origins/productOriginsCard';
import { buildManualTextDocument, canonicalManualOriginContent } from '../../../evidenceAuthority/manualTextAsset';
import { assessNOVAGroup1 } from '../../../utils/novaAssessment';
import { evidenceImageStatus } from '../../../evidenceImage/pipeline';
import type { GovernedOriginFact } from '../../../origins/governedFacts';
import type { Product } from '../../../types/product';

describe('contribution journey corrections', () => {
  test('668 mg sodium is stored once as grams and shown once as 668 mg', () => {
    const prefill = nutritionPrefillFromSource({ sodium_100g: 0.668, fat_100g: 24.117647, 'energy-kcal_100g': 406.309751 }, '100g');
    expect(prefill.sodiumUnit).toBe('mg');
    expect(prefill.amounts.sodium).toBe('668');
    expect(prefill.amounts.fat).toBe('24.12');
    expect(prefill.amounts['energy-kcal']).toBe('406.3');
    const stated = nutritionAmountsToSubmit(
      { ...prefill, amounts: { ...prefill.amounts, sodium: '668' } },
      { ...prefill, amounts: { ...prefill.amounts, sodium: '400' } },
      ['sodium']
    );
    expect(stated).toEqual([{ attribute: 'sodium', value: 668, unit: 'mg' }]);
    const grams = Number(offNutrientValue(stated[0]));
    expect(grams).toBeCloseTo(0.668, 6);
    const shown = sodiumMgFromNutriments({ sodium_100g: grams });
    expect(shown.mgPer100).toBeCloseTo(668, 5);
    expect(formatConsumerNutrient(shown.mgPer100 || 0, 'mg')).toBe('668');
  });

  test('an unready photo does not hold a reviewed structured unit', () => {
    const preparing = reviewedUnitSupport({
      unitId: 'eu_1',
      packetAbsence: false,
      photos: [{ assetId: 'src_photo', imagePhase: 'preparing' }],
    });
    expect(preparing.sourceAssetId).toBe('manual-text:eu_1');
    expect(preparing.companionSourceAssetIds).toBeUndefined();
    const ready = reviewedUnitSupport({
      unitId: 'eu_1',
      packetAbsence: false,
      photos: [{ assetId: 'src_photo', imagePhase: 'available', remoteAssetId: 'asset_ready' }],
    });
    expect(ready.sourceAssetId).toBe('src_photo');
    const absence = reviewedUnitSupport({
      unitId: 'eu_abs',
      packetAbsence: true,
      photos: [{ assetId: 'src_photo', imagePhase: 'uploading' }],
    });
    expect(absence.sourceAssetId).toBe('src_photo');
  });

  test('local and imported can both be captured, and an unstated percentage stays unstated', () => {
    const both = capturedOriginQualifications({ local: true, imported: true, multiple: false });
    expect(both.originQualifications).toEqual(['local', 'imported']);
    expect(both.originQualification).toBeUndefined();
    const document = buildManualTextDocument({
      barcode: '9300675000000',
      sessionId: 'ses_photo',
      unitId: 'eu_1',
      domain: 'origins',
      statement: 'Packed in Serbia from local and imported ingredients',
      originClaimType: 'packed_in',
      originCountry: 'Serbia',
      originQualifications: both.originQualifications,
      percentageNotStated: true,
    });
    const parsed = document ? canonicalManualOriginContent(document) : null;
    expect(parsed?.originStructured.originQualifications).toEqual(['local', 'imported']);
    expect(parsed?.originStructured.ingredientOriginPercentage).toBeUndefined();
    expect(parsed?.originStructured.percentageNotStated).toBe(true);
    const fact: GovernedOriginFact = {
      evidenceId: 'origin-1',
      subjectKey: 'packed_in',
      claimType: 'packed_in',
      countries: ['Serbia'],
      exactWording: 'Packed in Serbia from local and imported ingredients',
      originQualifications: ['local', 'imported'],
      percentageNotStated: true,
      confidence: 'limited',
    };
    expect(formatGovernedOriginFactLine(fact)).toBe('Packed in · Serbia · Not stated · Local, Imported');
  });

  test('consumer photo status does not expose recovery or admission terminology', () => {
    expect(evidenceImageStatus({ imagePhase: 'preparing' })).toBe('Preparing photo…');
    expect(evidenceImageStatus({ imagePhase: 'available' })).toBe('');
    expect(evidenceImageStatus({ imagePhase: 'parked_after_interrupted_resume' })).toBe('This photo needs attention.');
    expect(evidenceImageStatus({ imagePhase: 'failed_retryable', lastPutStatus: 500 })).not.toContain('admitted');
  });

  test('raspberries (100%) normalizes inside the existing NOVA 1 gate and does not match the whitelist', () => {
    const product = {
      barcode: '1',
      ingredients_text: 'Raspberries (100%)',
      additives_tags: [],
    } as Product;
    const assessment = assessNOVAGroup1(product);
    expect(assessment.likelyNOVA1).toBe(false);
    expect(assessment.reason).toBe('Single ingredient not on NOVA 1 whitelist');
  });
});
