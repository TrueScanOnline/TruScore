/**
 * Open Pillar — Open_Scoring_Specification_v15 (food & beverage)
 */

import {
  calculateOpenPillar,
  getOpenPillarIngredientsText,
} from '../../../../lib/truscoreEngine/pillars/openPillar';
import {
  assessOpenOriginsV15,
  getRawOffIngredientOriginTags,
  hasNestedCompositionList,
  resolveDistinctOffOriginCountries,
} from '../../../../lib/truscoreEngine/pillars/openPillarOriginsV15';
import {
  OPEN_V15_ADJUSTMENT_REGISTRY,
  OPEN_V15_MVP_UNREACHABLE_ORIGINS_IDS,
} from '../../../../lib/truscoreEngine/pillars/openPillarV15Registry';
import {
  countOpenPillarHiddenTermHits,
  countHiddenTermHitsInToken,
  tokenizeIngredientsText,
} from '../../../../lib/truscoreEngine/pillars/openPillarHiddenTerms';
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

  test('genuine single-ingredient + raw OFF origin: +8 evidently complete', () => {
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

  test('origins and origins_tags lexical variants resolve to one country (not conflict)', () => {
    const product = {
      ...baseProduct,
      ingredients_text: 'Honey',
      origins: 'New Zealand',
      origins_tags: ['en:new-zealand'],
    };
    expect(resolveDistinctOffOriginCountries(product)).toEqual(['new zealand']);
    const result = calculateOpenPillar(product);
    expect(result.adjustments.some((a) => a.id === 'open-v15-origins-evidently-complete' && a.value === 8)).toBe(
      true
    );
  });

  test('vague sole ingredient with origin present fails +8', () => {
    const product = {
      ...baseProduct,
      ingredients_text: 'natural flavor',
      origins_tags: ['en:france'],
    };
    const result = calculateOpenPillar(product);
    expect(result.adjustments.some((a) => a.id === 'open-v15-origins-evidently-complete')).toBe(false);
    expect(result.adjustments.some((a) => a.id === 'open-v15-origins-insufficient')).toBe(true);
    expect(result.score).toBe(13);
  });

  test('nested compound ingredient with origin present fails +8', () => {
    expect(hasNestedCompositionList('Honey (raw, unfiltered)')).toBe(true);
    const product = {
      ...baseProduct,
      ingredients_text: 'Honey (raw, unfiltered)',
      origins_tags: ['en:new-zealand'],
    };
    const result = calculateOpenPillar(product);
    expect(result.adjustments.some((a) => a.id === 'open-v15-origins-evidently-complete')).toBe(false);
    expect(result.adjustments.some((a) => a.id === 'open-v15-origins-insufficient')).toBe(true);
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

  test('two or more distinct OFF countries: insufficient 0 (not +8)', () => {
    const product = {
      ...baseProduct,
      ingredients_text: 'Honey',
      origins_tags: ['en:new-zealand', 'en:australia'],
    };
    const result = calculateOpenPillar(product);
    expect(resolveDistinctOffOriginCountries(product).length).toBe(2);
    expect(result.adjustments.some((a) => a.id === 'open-v15-origins-evidently-complete')).toBe(false);
    expect(result.adjustments.some((a) => a.id === 'open-v15-origins-insufficient' && a.value === 0)).toBe(
      true
    );
    expect(result.adjustments.some((a) => a.id === 'open-v15-origins-conflict')).toBe(false);
  });

  test('malformed non-string origins_tags ignored — no throw, +8 when one valid string remains', () => {
    const product = {
      ...baseProduct,
      ingredients_text: 'Honey',
      origins_tags: [123 as unknown as string, null as unknown as string, { origin: 'en:france' } as unknown as string, 'en:new-zealand'],
    };
    expect(() => getRawOffIngredientOriginTags(product)).not.toThrow();
    expect(getRawOffIngredientOriginTags(product)).toEqual(['new zealand']);
    const result = calculateOpenPillar(product);
    expect(result.adjustments.some((a) => a.id === 'open-v15-origins-evidently-complete' && a.value === 8)).toBe(
      true
    );
  });

  test('malformed origins_tags with no valid strings: insufficient 0, no throw', () => {
    const product = {
      ...baseProduct,
      ingredients_text: 'Honey',
      origins_tags: [42 as unknown as string, null as unknown as string],
    };
    expect(() => calculateOpenPillar(product)).not.toThrow();
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
    const assessment = assessOpenOriginsV15(product, product.ingredients_text!, true, 0);
    expect(assessment.id).toBe('open-v15-origins-insufficient');
    expect(assessment.value).toBe(0);
  });

  test('Environmental/Eco-Score aggregated origins alone are score-inert (no +8)', () => {
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
    expect(getRawOffIngredientOriginTags(product)).toEqual([]);
    expect(resolveDistinctOffOriginCountries(product)).toEqual([]);
    const result = calculateOpenPillar(product);
    expect(result.adjustments.some((a) => a.id === 'open-v15-origins-evidently-complete')).toBe(false);
    expect(result.adjustments.some((a) => a.id === 'open-v15-origins-insufficient' && a.value === 0)).toBe(
      true
    );
    expect(result.score).toBe(16);
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

describe('Open v15 S28 diagnostic trace', () => {
  const product: Product = {
    barcode: '999',
    product_name: 'Honey NZ',
    ingredients_text: 'Honey',
    origins_tags: ['en:new-zealand'],
    origins: 'New Zealand',
    source: 'test',
  };

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
