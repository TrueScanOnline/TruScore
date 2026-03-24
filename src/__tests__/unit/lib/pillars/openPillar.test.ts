/**
 * Open Pillar — Open_Scoring_Specification_v14 (food & beverage)
 */

import { calculateOpenPillar } from '../../../../lib/truscoreEngine/pillars/openPillar';
import {
  countOpenPillarHiddenTermHits,
  countHiddenTermHitsInToken,
  tokenizeIngredientsText,
} from '../../../../lib/truscoreEngine/pillars/openPillarHiddenTerms';
import { Product } from '../../../../types/product';

describe('Open Pillar v14', () => {
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

  test('base score is 15', () => {
    const result = calculateOpenPillar(baseProduct);
    expect(result.base).toBe(15);
  });

  test('no ingredients: −3 and other adjustments still apply', () => {
    const result = calculateOpenPillar(baseProduct);
    expect(result.details.ingredientsScore).toBe(-3);
    expect(result.adjustments.some((a) => a.description.includes('No ingredients'))).toBe(true);
  });

  test('ingredients present: +2', () => {
    const product = { ...baseProduct, ingredients_text: 'Water, sugar, salt.' };
    const result = calculateOpenPillar(product);
    expect(result.details.ingredientsScore).toBe(2);
  });

  test('placeholder ingredients: −3', () => {
    const product = { ...baseProduct, ingredients_text: 'n/a' };
    const result = calculateOpenPillar(product);
    expect(result.details.ingredientsScore).toBe(-3);
  });

  test('one vague term: hidden penalty 4', () => {
    const product = {
      ...baseProduct,
      ingredients_text: 'Water, natural flavor.',
      origins: 'France',
    };
    const result = calculateOpenPillar(product);
    expect(result.details.hiddenTermsCount).toBeGreaterThanOrEqual(1);
    expect(result.details.hiddenTermsPenalty).toBe(4);
  });

  test('two vague terms: hidden penalty 8', () => {
    const product = {
      ...baseProduct,
      ingredients_text: 'Water, natural flavor, spice extractives.',
      origins: 'France',
    };
    const result = calculateOpenPillar(product);
    expect(result.details.hiddenTermsCount).toBeGreaterThanOrEqual(2);
    expect(result.details.hiddenTermsPenalty).toBe(8);
  });

  test('three or more vague terms: hidden penalty 11', () => {
    const product = {
      ...baseProduct,
      ingredients_text: 'Water, natural flavor, aroma, smoke flavouring, artificial flavouring.',
      origins: 'France',
    };
    const result = calculateOpenPillar(product);
    expect(result.details.hiddenTermsCount).toBeGreaterThanOrEqual(3);
    expect(result.details.hiddenTermsPenalty).toBe(11);
  });

  test('NOVA is not added to hidden count (only literal matches)', () => {
    const product = {
      ...baseProduct,
      ingredients_text: 'Water, sugar, salt.',
      nova_group: 4,
      origins: 'France',
    };
    const result = calculateOpenPillar(product);
    expect(result.details.hiddenTermsCount).toBe(0);
    expect(result.details.hiddenTermsPenalty).toBe(0);
  });

  test('zero hidden + NOVA 1: listing clarity +4', () => {
    const product = {
      ...baseProduct,
      ingredients_text: 'Water, organic cane sugar, sea salt.',
      nova_group: 1,
      origins: 'New Zealand',
    };
    const result = calculateOpenPillar(product);
    expect(result.details.hiddenTermsCount).toBe(0);
    expect(result.details.listingClarityBonus).toBe(4);
  });

  test('zero hidden + NOVA 3: listing clarity +2', () => {
    const product = {
      ...baseProduct,
      ingredients_text: 'Water, organic cane sugar, sea salt.',
      nova_group: 3,
      origins: 'New Zealand',
    };
    const result = calculateOpenPillar(product);
    expect(result.details.hiddenTermsCount).toBe(0);
    expect(result.details.listingClarityBonus).toBe(2);
  });

  test('zero hidden + unknown NOVA: no listing clarity bonus', () => {
    const product = {
      ...baseProduct,
      ingredients_text: 'Water, organic cane sugar, sea salt.',
      origins: 'New Zealand',
    };
    const result = calculateOpenPillar(product);
    expect(result.details.hiddenTermsCount).toBe(0);
    expect(result.details.listingClarityBonus).toBe(0);
  });

  test('no origin: origin penalty magnitude 4', () => {
    const result = calculateOpenPillar(baseProduct);
    expect(result.details.originPenalty).toBe(4);
  });

  test('vanilla extract does not count as generic extract', () => {
    expect(countHiddenTermHitsInToken('vanilla extract')).toBe(0);
    expect(countOpenPillarHiddenTermHits('sugar, vanilla extract, water')).toBe(0);
  });

  test('paprika extract excluded', () => {
    expect(countHiddenTermHitsInToken('paprika extract')).toBe(0);
  });

  test('emulsifier (471) counts; emulsifier (soy lecithin) does not', () => {
    expect(countHiddenTermHitsInToken('emulsifier (471)')).toBe(1);
    expect(countHiddenTermHitsInToken('emulsifier (soy lecithin)')).toBe(0);
  });

  test('E621 and INS 621 count', () => {
    expect(countHiddenTermHitsInToken('E621')).toBe(1);
    expect(countHiddenTermHitsInToken('INS 621')).toBe(1);
  });

  test('allspice does not match spice term', () => {
    expect(countHiddenTermHitsInToken('allspice')).toBe(0);
  });

  test('tokenize respects parentheses', () => {
    const t = tokenizeIngredientsText('emulsifier (soy, modified), salt');
    expect(t).toEqual(['emulsifier (soy, modified)', 'salt']);
  });

  test('score clamps at 0', () => {
    const product = {
      ...baseProduct,
      ingredients_text: 'natural flavor, aroma, smoke flavouring, artificial flavouring, colour, preservative.',
    };
    const result = calculateOpenPillar(product);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});
