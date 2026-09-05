/**
 * Open Pillar — Open_Scoring_Specification_v15 (food & beverage)
 */

import {
  calculateOpenPillar,
  getOpenPillarIngredientsText,
} from '../../../../lib/truscoreEngine/pillars/openPillar';
import {
  assessOpenOriginsV15,
  auditOriginsTagsEvidence,
  getStructuredOffOriginTags,
  hasNestedCompositionList,
  resolveDistinctOffOriginCountries,
} from '../../../../lib/truscoreEngine/pillars/openPillarOriginsV15';
import {
  OPEN_V15_ADJUSTMENT_REGISTRY,
  OPEN_V15_MVP_UNREACHABLE_ORIGINS_IDS,
} from '../../../../lib/truscoreEngine/pillars/openPillarV15Registry';
import {
  countHiddenTermHitsInToken,
  countOpenPillarHiddenTermHits,
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
    expect(countHiddenTermHitsInToken('emulsifier soy lecithin')).toBe(0);
    expect(countHiddenTermHitsInToken('colour 150a')).toBe(1);
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

  describe('OFF Evidently Complete +8 gate', () => {
    test('Honey + one valid origins_tags country → +8 subject to all other gates', () => {
      const product = {
        ...baseProduct,
        ingredients_text: 'Honey',
        origins_tags: ['en:new-zealand'],
      };
      const result = calculateOpenPillar(product);
      expect(result.adjustments.some((a) => a.id === 'open-v15-origins-evidently-complete' && a.value === 8)).toBe(
        true
      );
      expect(result.score).toBe(24);
    });

    test('Honey + origins: "New Zealand" but no origins_tags → 0', () => {
      const product = {
        ...baseProduct,
        ingredients_text: 'Honey',
        origins: 'New Zealand',
      };
      expect(getStructuredOffOriginTags(product)).toEqual([]);
      const result = calculateOpenPillar(product);
      expect(result.adjustments.some((a) => a.id === 'open-v15-origins-evidently-complete')).toBe(false);
      expect(result.adjustments.some((a) => a.id === 'open-v15-origins-insufficient' && a.value === 0)).toBe(
        true
      );
      expect(result.score).toBe(16);
    });

    test('Honey + origins: "New Zealand and Australia" but no tags → 0', () => {
      const product = {
        ...baseProduct,
        ingredients_text: 'Honey',
        origins: 'New Zealand and Australia',
      };
      const result = calculateOpenPillar(product);
      expect(result.adjustments.some((a) => a.id === 'open-v15-origins-evidently-complete')).toBe(false);
      expect(result.adjustments.some((a) => a.id === 'open-v15-origins-insufficient')).toBe(true);
    });

    test('Honey, water + one tag → 0', () => {
      const product = {
        ...baseProduct,
        ingredients_text: 'Honey, water',
        origins_tags: ['en:new-zealand'],
      };
      const result = calculateOpenPillar(product);
      expect(result.adjustments.some((a) => a.id === 'open-v15-origins-evidently-complete')).toBe(false);
      expect(result.adjustments.some((a) => a.id === 'open-v15-origins-insufficient')).toBe(true);
    });

    test('Corn, salt + one tag → 0', () => {
      const product = {
        ...baseProduct,
        ingredients_text: 'Corn, salt',
        origins_tags: ['en:france'],
      };
      const result = calculateOpenPillar(product);
      expect(result.adjustments.some((a) => a.id === 'open-v15-origins-evidently-complete')).toBe(false);
      expect(result.adjustments.some((a) => a.id === 'open-v15-origins-insufficient')).toBe(true);
    });

    test('Honey (raw, unfiltered) + one tag → 0 under conservative parenthetical guard', () => {
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

    test('consistent free-text origins with single structured tag does not expand eligibility beyond tag', () => {
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

    test('inconsistent free-text origins with single structured tag fails closed → 0', () => {
      const product = {
        ...baseProduct,
        ingredients_text: 'Honey',
        origins: 'New Zealand and Australia',
        origins_tags: ['en:new-zealand'],
      };
      const result = calculateOpenPillar(product);
      expect(result.adjustments.some((a) => a.id === 'open-v15-origins-evidently-complete')).toBe(false);
      expect(result.adjustments.some((a) => a.id === 'open-v15-origins-insufficient')).toBe(true);
    });

    test('vague sole ingredient with structured tag present fails +8', () => {
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

    test('two or more distinct structured origin tags → insufficient 0', () => {
      const product = {
        ...baseProduct,
        ingredients_text: 'Honey',
        origins_tags: ['en:new-zealand', 'en:australia'],
      };
      expect(resolveDistinctOffOriginCountries(product).length).toBe(2);
      const result = calculateOpenPillar(product);
      expect(result.adjustments.some((a) => a.id === 'open-v15-origins-evidently-complete')).toBe(false);
      expect(result.adjustments.some((a) => a.id === 'open-v15-origins-insufficient' && a.value === 0)).toBe(
        true
      );
    });

    test('malformed origins_tags alongside valid tag fail closed → 0, no throw', () => {
      const product = {
        ...baseProduct,
        ingredients_text: 'Honey',
        origins_tags: [123 as unknown as string, null as unknown as string, { origin: 'en:france' } as unknown as string, 'en:new-zealand'],
      };
      expect(() => auditOriginsTagsEvidence(product)).not.toThrow();
      expect(auditOriginsTagsEvidence(product).dirty).toBe(true);
      expect(getStructuredOffOriginTags(product)).toEqual([]);
      const result = calculateOpenPillar(product);
      expect(result.adjustments.some((a) => a.id === 'open-v15-origins-evidently-complete')).toBe(false);
      expect(result.adjustments.some((a) => a.id === 'open-v15-origins-insufficient')).toBe(true);
    });

    test.each([
      ['numeric', 123],
      ['null', null],
      ['object', { origin: 'en:france' }],
      ['unknown placeholder', 'en:unknown'],
      ['n/a placeholder', 'n/a'],
      ['empty tag', 'en:'],
    ] as const)('dirty evidence: %s alongside en:new-zealand → 0', (_label, badEntry) => {
      const product = {
        ...baseProduct,
        ingredients_text: 'Honey',
        origins_tags: [badEntry as unknown as string, 'en:new-zealand'],
      };
      expect(() => calculateOpenPillar(product)).not.toThrow();
      expect(auditOriginsTagsEvidence(product).dirty).toBe(true);
      const result = calculateOpenPillar(product);
      expect(result.adjustments.some((a) => a.id === 'open-v15-origins-evidently-complete')).toBe(false);
      expect(result.adjustments.some((a) => a.id === 'open-v15-origins-insufficient')).toBe(true);
    });

    test('exact duplicate valid origins_tags deduplicate and remain +8 eligible', () => {
      const product = {
        ...baseProduct,
        ingredients_text: 'Honey',
        origins_tags: ['en:new-zealand', 'en:new-zealand'],
      };
      expect(auditOriginsTagsEvidence(product).dirty).toBe(false);
      expect(resolveDistinctOffOriginCountries(product)).toEqual(['new zealand']);
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

    test.each([
      ['en:oceania'],
      ['en:europe'],
      ['en:european-union'],
      ['en:asia'],
      ['en:canterbury'],
    ])('unrecognised structured tag %s alone → insufficient 0', (tag) => {
      const product = {
        ...baseProduct,
        ingredients_text: 'Honey',
        origins_tags: [tag],
      };
      expect(resolveDistinctOffOriginCountries(product)).toEqual([]);
      const result = calculateOpenPillar(product);
      expect(result.adjustments.some((a) => a.id === 'open-v15-origins-evidently-complete')).toBe(false);
      expect(result.adjustments.some((a) => a.id === 'open-v15-origins-insufficient' && a.value === 0)).toBe(
        true
      );
    });

    test.each(['en:new-zealand', 'en:australia', 'en:china'])(
      'recognised country tag %s resolves for clean evidence',
      (tag) => {
        const product = {
          ...baseProduct,
          ingredients_text: 'Honey',
          origins_tags: [tag],
        };
        expect(auditOriginsTagsEvidence(product).dirty).toBe(false);
        expect(resolveDistinctOffOriginCountries(product).length).toBe(1);
      }
    );

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
      expect(getStructuredOffOriginTags(product)).toEqual([]);
      expect(resolveDistinctOffOriginCountries(product)).toEqual([]);
      const result = calculateOpenPillar(product);
      expect(result.adjustments.some((a) => a.id === 'open-v15-origins-evidently-complete')).toBe(false);
      expect(result.adjustments.some((a) => a.id === 'open-v15-origins-insufficient' && a.value === 0)).toBe(
        true
      );
      expect(result.score).toBe(16);
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

  test('tokenize respects brackets and top-level semicolons', () => {
    expect(tokenizeIngredientsText('Water; Thickeners [Methyl Cellulose]; Salt')).toEqual([
      'Water',
      'Thickeners [Methyl Cellulose]',
      'Salt',
    ]);
  });

  test('allspice does not match spice term', () => {
    expect(countHiddenTermHitsInToken('allspice')).toBe(0);
  });

  test('governed terms do not fire on fragments of a more specific ingredient head', () => {
    expect(countHiddenTermHitsInToken('Yeast extract')).toBe(0);
    expect(countHiddenTermHitsInToken('Citric Acid')).toBe(0);
    expect(countOpenPillarHiddenTermHits('Water, Yeast extract, Citric Acid, Salt')).toBe(0);
  });

  test('specifically resolved category shells do not fire a broad category flag', () => {
    expect(countHiddenTermHitsInToken('Thickeners (Methyl Cellulose)')).toBe(0);
    expect(countHiddenTermHitsInToken('Colours (Burnt Sugar, Beetroot Powder)')).toBe(0);
  });

  test('unresolved category and generic terms continue to fire', () => {
    expect(countHiddenTermHitsInToken('Thickeners')).toBe(1);
    expect(countHiddenTermHitsInToken('Colours')).toBe(1);
    expect(countHiddenTermHitsInToken('extract')).toBe(1);
    expect(countHiddenTermHitsInToken('Vegetable extract')).toBe(1);
    expect(countHiddenTermHitsInToken('natural flavor')).toBe(1);
  });

  test('partially resolved category fires only the governed term left inside', () => {
    expect(countHiddenTermHitsInToken('Thickeners (natural flavor)')).toBe(1);
  });
});

describe('Open v15 ingredient clarity after governed-term matcher correction', () => {
  const product = (ingredients_text: string): Product => ({
    barcode: '1234567890123',
    product_name: 'Clarity Fixture',
    ingredients_text,
    source: 'test',
  });

  test('specific named acids and extracts earn the zero-flag clarity credit', () => {
    const result = calculateOpenPillar(product('Water, Yeast extract, Citric Acid, Salt'));
    expect(result.details.governedFlagCount).toBe(0);
    expect(result.adjustments.some((a) => a.id === 'open-v15-ing-clarity-zero' && a.value === 1)).toBe(
      true
    );
  });

  test('unresolved category shell still takes the one-flag clarity penalty', () => {
    const result = calculateOpenPillar(product('Water, Thickeners, Salt'));
    expect(result.details.governedFlagCount).toBe(1);
    expect(result.adjustments.some((a) => a.id === 'open-v15-ing-clarity-one' && a.value === -2)).toBe(
      true
    );
  });

  test('class+identity wording without brackets earns the zero-flag clarity credit', () => {
    const result = calculateOpenPillar(
      product(
        'Water, Emulsifier Soy Lecithin, Thickener Xanthan Gum, Preservative Potassium Sorbate, Antioxidant Ascorbic Acid, Acidity Regulator Citric Acid, Salt'
      )
    );
    expect(result.details.governedFlagCount).toBe(0);
    expect(result.adjustments.some((a) => a.id === 'open-v15-ing-clarity-zero' && a.value === 1)).toBe(
      true
    );
    expect(result.score).toBe(16);
  });

  test('code-only class specification costs exactly one coded clarity flag', () => {
    const result = calculateOpenPillar(product('Water, Colour 150a, Salt'));
    expect(result.details.governedFlagCount).toBe(1);
    const clarity = result.adjustments.find((a) => a.id === 'open-v15-ing-clarity-one');
    expect(clarity?.value).toBe(-2);
    expect(clarity?.metadata?.termPresentationClass).toBe('coded');
  });

  test('founder UAT fixture 1 scores one governed flag (Spices only)', () => {
    const result = calculateOpenPillar(
      product(
        'Water, Soy Protein, Coconut Oil, Potato Starch, Canola Oil, Methylcellulose, Sausage Casing (Sodium Alginate, Calcium Chloride), Yeast Extract, Maltodextrin, Spices, Salt, Sugar, Citric Acid, Potassium Sorbate.'
      )
    );
    expect(result.details.governedFlagCount).toBe(1);
    expect(result.adjustments.some((a) => a.id === 'open-v15-ing-clarity-one' && a.value === -2)).toBe(
      true
    );
    expect(result.score).toBe(13);
  });

  test('founder UAT fixture 2 scores one governed flag (Flavours only)', () => {
    const result = calculateOpenPillar(
      product(
        'Water, Plant Protein 25% (Soy), Vegetable Oils, Thickeners (Methyl Cellulose, Modified Corn Starch, Gellan Gum (Contains Soy), Carrageenan), Vinegar, Colours (Burnt Sugar, Beetroot Powder), Flavours (Contains Glutamic Acid), Cultured Sugar (From Cane), Yeast Extract, Dextrose, Salt, Onion Powder, Iron, Vitamin B12.'
      )
    );
    expect(result.details.governedFlagCount).toBe(1);
    expect(result.adjustments.some((a) => a.id === 'open-v15-ing-clarity-one' && a.value === -2)).toBe(
      true
    );
    expect(result.score).toBe(13);
  });
});
