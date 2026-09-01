/**
 * Open Pillar — Open_Scoring_Specification_v15 (food & beverage)
 */

import {
  calculateOpenPillar,
  getOpenPillarIngredientsText,
  type OpenPillarAdjustment,
} from '../../../../lib/truscoreEngine/pillars/openPillar';
import { assessOpenOriginsV15 } from '../../../../lib/truscoreEngine/pillars/openPillarOriginsV15';
import {
  OPEN_V15_ADJUSTMENT_REGISTRY,
  OPEN_V15_MVP_UNREACHABLE_ORIGINS_IDS,
} from '../../../../lib/truscoreEngine/pillars/openPillarV15Registry';
import {
  countOpenPillarHiddenTermHits,
  countHiddenTermHitsInToken,
  tokenizeIngredientsText,
} from '../../../../lib/truscoreEngine/pillars/openPillarHiddenTerms';
import {
  allOpenV15DrillDownHighlights,
  calculateOpenV15Highlights,
  selectOpenV15Highlights,
} from '../../../../utils/openScoreHighlights';
import { buildTruScoreAnalysis, calculateTruScore } from '../../../../lib/truscoreEngine';
import { Product } from '../../../../types/product';

describe('Open Pillar v15', () => {
  const baseProduct: Product = {
    barcode: '1234567890123',
    product_name: 'Test Product',
    brands: '',
    categories: '',
    categories_tags: [],
    labels_tags: [],
    ingredients_text: '',
    ingredients_analysis_tags: [],
    additives_tags: [],
    nutriments: {},
    source: 'test',
  };

  test('base score is 15; base is not a fired-adjustment ledger row', () => {
    const result = calculateOpenPillar(baseProduct);
    expect(result.base).toBe(15);
    expect(result.score).toBe(15);
    expect(result.adjustments.some((a) => a.id === 'open-v15-base')).toBe(false);
  });

  test('zero governed flags: +1 ingredient clarity', () => {
    const product = { ...baseProduct, ingredients_text: 'Water, organic cane sugar, sea salt.' };
    const result = calculateOpenPillar(product);
    expect(result.details.governedFlagCount).toBe(0);
    expect(result.adjustments.some((a) => a.id === 'open-v15-ing-clarity-zero' && a.value === 1)).toBe(
      true
    );
    expect(result.score).toBe(16);
  });

  test('one governed flag: −2', () => {
    const product = { ...baseProduct, ingredients_text: 'Water, natural flavor.' };
    const result = calculateOpenPillar(product);
    expect(result.details.governedFlagCount).toBeGreaterThanOrEqual(1);
    expect(result.adjustments.some((a) => a.id === 'open-v15-ing-clarity-one' && a.value === -2)).toBe(
      true
    );
  });

  test('two governed flags: −4', () => {
    const product = {
      ...baseProduct,
      ingredients_text: 'Water, natural flavor, spice extractives.',
    };
    const result = calculateOpenPillar(product);
    expect(result.adjustments.some((a) => a.id === 'open-v15-ing-clarity-two' && a.value === -4)).toBe(
      true
    );
  });

  test('three or more governed flags: −6', () => {
    const product = {
      ...baseProduct,
      ingredients_text: 'Water, natural flavor, aroma, smoke flavouring, artificial flavouring.',
    };
    const result = calculateOpenPillar(product);
    expect(
      result.adjustments.some((a) => a.id === 'open-v15-ing-clarity-three-plus' && a.value === -6)
    ).toBe(true);
  });

  test('missing ingredients: neutral clarity unavailable (not negative)', () => {
    const result = calculateOpenPillar(baseProduct);
    expect(result.adjustments.some((a) => a.id === 'open-v15-ing-clarity-unavailable')).toBe(true);
    expect(result.adjustments.some((a) => a.id === 'open-v15-ing-clarity-one')).toBe(false);
  });

  test('placeholder ingredients: neutral clarity unavailable', () => {
    const product = { ...baseProduct, ingredients_text: 'n/a' };
    const result = calculateOpenPillar(product);
    expect(result.adjustments.some((a) => a.id === 'open-v15-ing-clarity-unavailable')).toBe(true);
  });

  test('generic vs code-dependent vs named-additive examples', () => {
    expect(countHiddenTermHitsInToken('emulsifier (471)')).toBe(1);
    expect(countHiddenTermHitsInToken('emulsifier (soy lecithin)')).toBe(0);
    expect(countHiddenTermHitsInToken('E621')).toBe(1);
    expect(countHiddenTermHitsInToken('monosodium glutamate')).toBe(0);
    expect(countHiddenTermHitsInToken('flavour enhancer (MSG)')).toBe(0);
    expect(countHiddenTermHitsInToken('monosodium glutamate (621)')).toBe(0);
    expect(countHiddenTermHitsInToken('preservative (potassium sorbate)')).toBe(0);
    expect(countHiddenTermHitsInToken('seasoning (salt, pepper, paprika)')).toBe(0);
  });

  test('NOVA does not affect Open v15 score', () => {
    const product = {
      ...baseProduct,
      ingredients_text: 'Water, sugar, salt.',
      nova_group: 4 as const,
    };
    const result = calculateOpenPillar(product);
    expect(result.adjustments.some((a) => a.description.toLowerCase().includes('nova'))).toBe(false);
  });

  test('NIP / nutriments do not affect Open v15 score', () => {
    const withNip = {
      ...baseProduct,
      ingredients_text: 'Water, sugar.',
      nutriments: { energy_100g: 100, fat_100g: 1, proteins_100g: 1, carbohydrates_100g: 10, sugars_100g: 8, salt_100g: 0.1 },
      serving_size: '100g',
    };
    const withoutNip = { ...baseProduct, ingredients_text: 'Water, sugar.', nutriments: {} };
    expect(calculateOpenPillar(withNip).score).toBe(calculateOpenPillar(withoutNip).score);
  });

  test('missing OFF origin data: neutral insufficient (not v14 −4 penalty)', () => {
    const product = { ...baseProduct, ingredients_text: 'Water, sugar, salt.' };
    const result = calculateOpenPillar(product);
    expect(result.adjustments.some((a) => a.id === 'open-v15-origins-insufficient' && a.value === 0)).toBe(
      true
    );
    expect(result.adjustments.some((a) => a.description.includes('No origin information'))).toBe(false);
  });

  test('single-ingredient + raw OFF origin: +8 evidently complete', () => {
    const product = {
      ...baseProduct,
      ingredients_text: 'Honey',
      origins_tags: ['en:new-zealand'],
      origins: 'New Zealand',
    };
    const result = calculateOpenPillar(product);
    expect(result.adjustments.some((a) => a.id === 'open-v15-origins-evidently-complete' && a.value === 8)).toBe(
      true
    );
    expect(result.score).toBe(24);
  });

  test('multi-ingredient with origin tags: no +8 inference', () => {
    const product = {
      ...baseProduct,
      ingredients_text: 'Honey, water',
      origins_tags: ['en:new-zealand'],
    };
    const result = calculateOpenPillar(product);
    expect(result.adjustments.some((a) => a.id === 'open-v15-origins-evidently-complete')).toBe(false);
    expect(result.adjustments.some((a) => a.id === 'open-v15-origins-insufficient')).toBe(true);
  });

  test('manufacturing-only signal does not score ingredient origins', () => {
    const product = {
      ...baseProduct,
      ingredients_text: 'Honey, water',
      manufacturing_places_tags: ['en:australia'],
      manufacturing_places: 'Australia',
    };
    const assessment = assessOpenOriginsV15(product, product.ingredients_text!, true);
    expect(assessment.id).toBe('open-v15-origins-insufficient');
    expect(assessment.value).toBe(0);
  });

  test('Eco-Score aggregated origins alone do not establish +8', () => {
    const product = {
      ...baseProduct,
      ingredients_text: 'Honey',
      ecoscore_data: {
        score: 80,
        grade: 'a' as const,
        origins_of_ingredients: {
          aggregated_origins: [{ origin: 'en:france', percent: 100 }],
        },
      },
    };
    const result = calculateOpenPillar(product);
    expect(result.adjustments.some((a) => a.id === 'open-v15-origins-evidently-complete')).toBe(false);
  });

  test('conflicting raw OFF origin tags: fail closed neutral', () => {
    const product = {
      ...baseProduct,
      ingredients_text: 'Honey',
      origins_tags: ['en:new-zealand', 'en:australia'],
    };
    const result = calculateOpenPillar(product);
    expect(result.adjustments.some((a) => a.id === 'open-v15-origins-conflict')).toBe(true);
  });

  test('score clamps at 0–25', () => {
    const product = {
      ...baseProduct,
      ingredients_text: 'natural flavor, aroma, smoke flavouring, artificial flavouring, colour, preservative, spices, extract.',
    };
    const result = calculateOpenPillar(product);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  test('ingredients_text_en fallback', () => {
    const product = {
      ...baseProduct,
      ingredients_text: '',
      ingredients_text_en: 'Water, sugar, salt.',
    };
    expect(getOpenPillarIngredientsText(product)).toBe('Water, sugar, salt.');
    expect(calculateOpenPillar(product).details.governedFlagCount).toBe(0);
  });

  test('all v15 adjustment IDs registered with commentary coverage for highlight-eligible rows', () => {
    const firedIds = Object.keys(OPEN_V15_ADJUSTMENT_REGISTRY);
    expect(firedIds).toContain('open-v15-ing-clarity-zero');
    expect(firedIds).toContain('open-v15-origins-evidently-complete');
    for (const meta of Object.values(OPEN_V15_ADJUSTMENT_REGISTRY)) {
      if (meta.highlightEligible && meta.points !== 0) {
        expect(meta.highlightTitle).toBeTruthy();
        expect(meta.highlightExplainer).toBeTruthy();
      }
    }
  });

  test('MVP unreachable origins percentage states documented', () => {
    expect(OPEN_V15_MVP_UNREACHABLE_ORIGINS_IDS.length).toBeGreaterThanOrEqual(6);
    const product = { ...baseProduct, ingredients_text: 'Water, sugar.' };
    const result = calculateOpenPillar(product);
    for (const id of OPEN_V15_MVP_UNREACHABLE_ORIGINS_IDS) {
      expect(result.adjustments.some((a) => a.id === id)).toBe(false);
    }
  });
});

describe('Open v15 Score Highlights (S12)', () => {
  const product: Product = {
    barcode: '999',
    product_name: 'Honey NZ',
    ingredients_text: 'Honey',
    origins_tags: ['en:new-zealand'],
    origins: 'New Zealand',
    source: 'test',
  };

  test('S12 selects at most one positive and one negative; no points displayed', () => {
    const multiFlag: Product = {
      ...product,
      ingredients_text: 'Honey, natural flavor',
      origins_tags: ['en:new-zealand'],
    };
    const highlights = calculateOpenV15Highlights(multiFlag);
    expect(highlights.filter((h) => h.type === 'green').length).toBeLessThanOrEqual(1);
    expect(highlights.filter((h) => h.type === 'red').length).toBeLessThanOrEqual(1);
    highlights.forEach((h) => expect(h.scoreValue).toBe(0));
  });

  test('Origins wins positive tie over ingredient clarity at equal preference when both positive', () => {
    const adjustments = calculateOpenPillar(product).adjustments;
    const selected = selectOpenV15Highlights(adjustments);
    const positive = selected.find((h) => h.type === 'green');
    expect(positive?.highlightId).toBe('open-v15-origins-evidently-complete');
  });

  test('Origins wins negative tie at equal absolute effect (−4 qualified partial vs −4 two flags)', () => {
    const adjustments: OpenPillarAdjustment[] = [
      {
        id: 'open-v15-ing-clarity-two',
        description: OPEN_V15_ADJUSTMENT_REGISTRY['open-v15-ing-clarity-two'].description,
        value: -4,
        type: 'negative',
        highlightEligible: true,
        family: 'ingredients',
      },
      {
        id: 'open-v15-origins-qualified-partial',
        description: OPEN_V15_ADJUSTMENT_REGISTRY['open-v15-origins-qualified-partial'].description,
        value: -4,
        type: 'negative',
        highlightEligible: true,
        family: 'origins',
      },
    ];
    const selected = selectOpenV15Highlights(adjustments);
    const negative = selected.find((h) => h.type === 'red');
    expect(negative?.highlightId).toBe('open-v15-origins-qualified-partial');
  });

  test('S28 analysis: baseScore 15; fired rows carry adjustmentId (no base ledger row)', () => {
    const tru = calculateTruScore(product);
    const analysis = buildTruScoreAnalysis(product, tru);
    const open = analysis?.pillars.Open;
    expect(open?.baseScore).toBe(15);
    const openAdjs = open?.adjustments ?? [];
    expect(openAdjs.length).toBeGreaterThan(0);
    expect(openAdjs.some((a) => a.adjustmentId === 'open-v15-base')).toBe(false);
    openAdjs.forEach((a) => {
      expect(a.adjustmentId).toMatch(/^open-v15-/);
      expect(a.value).toBeDefined();
    });
  });

  test('drill-down exposes all highlight-eligible fired adjustments', () => {
    const multiFlag: Product = {
      ...product,
      ingredients_text: 'Honey, natural flavor',
      origins_tags: ['en:new-zealand'],
    };
    const adjustments = calculateOpenPillar(multiFlag).adjustments.filter(
      (a) => a.highlightEligible && a.value !== 0
    );
    const drill = allOpenV15DrillDownHighlights(multiFlag as any);
    expect(drill.length).toBe(adjustments.length);
    expect(drill.length).toBeGreaterThanOrEqual(1);
  });

  test('base and clamp never appear as highlights', () => {
    const highlights = allOpenV15DrillDownHighlights(product as any);
    expect(highlights.some((h) => h.highlightId === 'open-v15-base')).toBe(false);
  });
});

describe('openPillarHiddenTerms guardrails (v15)', () => {
  test('tokenize respects parentheses', () => {
    const t = tokenizeIngredientsText('emulsifier (soy, modified), salt');
    expect(t).toEqual(['emulsifier (soy, modified)', 'salt']);
  });

  test('allspice does not match spice term', () => {
    expect(countHiddenTermHitsInToken('allspice')).toBe(0);
  });
});
