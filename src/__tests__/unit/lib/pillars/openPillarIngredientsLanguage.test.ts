/**
 * Open v15 English assessability gate — independent of matcher F2/F3 behaviour.
 */

import {
  calculateOpenPillar,
  getOpenPillarIngredientsText,
  isAffirmativelyEnglishIngredientSource,
  resolveOpenV15ScoringIngredients,
} from '../../../../lib/truscoreEngine/pillars/openPillar';
import { Product } from '../../../../types/product';

const base: Product = {
  barcode: 'lang-gate-1',
  product_name: 'Language Gate Fixture',
  source: 'test',
};

describe('Open v15 English ingredient assessability', () => {
  test('English generic text, affirmatively English → normal matcher scoring (+1 clean)', () => {
    const product = {
      ...base,
      ingredients_text: 'Water, organic cane sugar, sea salt.',
      lang: 'en',
    };
    const resolved = resolveOpenV15ScoringIngredients(product);
    expect(resolved).toMatchObject({ usable: true, source: 'ingredients_text' });
    const result = calculateOpenPillar(product);
    expect(result.adjustments.some((a) => a.id === 'open-v15-ing-clarity-zero' && a.value === 1)).toBe(
      true
    );
    expect(result.score).toBe(16);
  });

  test('French generic text, affirmatively French, no English field → unavailable 0', () => {
    const product = {
      ...base,
      ingredients_text: 'Farine de blé, eau, huile de tournesol, sel',
      lang: 'fr',
    };
    expect(isAffirmativelyEnglishIngredientSource(product)).toBe(false);
    const result = calculateOpenPillar(product);
    expect(result.adjustments.some((a) => a.id === 'open-v15-ing-clarity-unavailable' && a.value === 0)).toBe(
      true
    );
    expect(result.adjustments.some((a) => a.id === 'open-v15-ing-clarity-zero')).toBe(false);
    expect(result.score).toBe(15);
  });

  test('Indonesian generic text, non-English → unavailable 0', () => {
    const product = {
      ...base,
      ingredients_text: 'Air, gula, garam, bumbu',
      lang: 'id',
    };
    const result = calculateOpenPillar(product);
    expect(result.adjustments.some((a) => a.id === 'open-v15-ing-clarity-unavailable' && a.value === 0)).toBe(
      true
    );
    expect(result.score).toBe(15);
  });

  test('French displayed generic + usable English ingredients_text_en → score the English field', () => {
    const product = {
      ...base,
      ingredients_text: 'Farine de blé, eau, épices',
      ingredients_text_en: 'Wheat flour, water, spices',
      lang: 'fr',
    };
    const resolved = resolveOpenV15ScoringIngredients(product);
    expect(resolved).toMatchObject({
      usable: true,
      source: 'ingredients_text_en',
      scoringText: 'Wheat flour, water, spices',
    });
    expect(getOpenPillarIngredientsText(product)).toBe('Wheat flour, water, spices');
    const result = calculateOpenPillar(product);
    expect(result.details.governedFlagCount).toBe(1);
    expect(result.adjustments.some((a) => a.id === 'open-v15-ing-clarity-one' && a.value === -2)).toBe(
      true
    );
  });

  test('non-English text containing an English governed token by coincidence → still unavailable', () => {
    const product = {
      ...base,
      // Contains Latin "spices" substring-like English token but lang is not English.
      ingredients_text: 'air, gula, spices, garam',
      lang: 'id',
    };
    const result = calculateOpenPillar(product);
    expect(result.adjustments.some((a) => a.id === 'open-v15-ing-clarity-unavailable' && a.value === 0)).toBe(
      true
    );
    expect(result.adjustments.some((a) => a.id === 'open-v15-ing-clarity-one')).toBe(false);
    expect(result.details.governedFlagCount).toBe(0);
  });

  test('unknown language / no affirmative English metadata → unavailable 0', () => {
    const product = {
      ...base,
      ingredients_text: 'Water, sugar, salt.',
      // no lang / lc / ingredients_lc
    };
    expect(isAffirmativelyEnglishIngredientSource(product)).toBe(false);
    const result = calculateOpenPillar(product);
    expect(result.adjustments.some((a) => a.id === 'open-v15-ing-clarity-unavailable' && a.value === 0)).toBe(
      true
    );
    // Must not award +1 merely because English matcher found no flags on ungated text.
    expect(result.adjustments.some((a) => a.id === 'open-v15-ing-clarity-zero')).toBe(false);
    expect(result.score).toBe(15);
  });

  test('empty / placeholder → existing unavailable 0', () => {
    expect(
      calculateOpenPillar({ ...base, lang: 'en', ingredients_text: '' }).adjustments.some(
        (a) => a.id === 'open-v15-ing-clarity-unavailable'
      )
    ).toBe(true);
    expect(
      calculateOpenPillar({
        ...base,
        lang: 'en',
        ingredients_text: 'Ingredients not listed',
      }).adjustments.some((a) => a.id === 'open-v15-ing-clarity-unavailable' && a.value === 0)
    ).toBe(true);
  });

  test('ordinary English Spices → existing −2', () => {
    const product = { ...base, ingredients_text: 'Spices', lang: 'en' };
    const result = calculateOpenPillar(product);
    expect(result.details.governedFlagCount).toBe(1);
    expect(result.adjustments.some((a) => a.id === 'open-v15-ing-clarity-one' && a.value === -2)).toBe(
      true
    );
    expect(result.score).toBe(13);
  });

  test('ordinary English clean wording → existing +1', () => {
    const product = { ...base, ingredients_text: 'Water, cane sugar, sea salt.', lang: 'en' };
    const result = calculateOpenPillar(product);
    expect(result.adjustments.some((a) => a.id === 'open-v15-ing-clarity-zero' && a.value === 1)).toBe(
      true
    );
  });

  test('ingredients_lc fr overrides lang en for generic text (fail closed)', () => {
    const product = {
      ...base,
      ingredients_text: 'Farine de blé, eau',
      lang: 'en',
      ingredients_lc: 'fr',
    };
    expect(isAffirmativelyEnglishIngredientSource(product)).toBe(false);
    expect(calculateOpenPillar(product).adjustments.some((a) => a.id === 'open-v15-ing-clarity-unavailable')).toBe(
      true
    );
  });

  test('unsupported-language single ingredient cannot earn Origins +8', () => {
    const product = {
      ...base,
      product_name: 'Miel',
      ingredients_text: 'Miel',
      lang: 'fr',
      origins_tags: ['en:new-zealand'],
      origins: 'New Zealand',
    };
    const result = calculateOpenPillar(product);
    expect(result.adjustments.some((a) => a.id === 'open-v15-ing-clarity-unavailable' && a.value === 0)).toBe(
      true
    );
    expect(result.adjustments.some((a) => a.id === 'open-v15-origins-evidently-complete')).toBe(false);
    expect(result.adjustments.some((a) => a.id === 'open-v15-origins-insufficient' && a.value === 0)).toBe(
      true
    );
    expect(result.score).toBe(15);
  });

  test('English Honey + NZ origins still yields Open 24 (+1 clarity and +8 origins)', () => {
    const product = {
      ...base,
      ingredients_text: 'Honey',
      lang: 'en',
      origins_tags: ['en:new-zealand'],
      origins: 'New Zealand',
    };
    const result = calculateOpenPillar(product);
    expect(result.adjustments.some((a) => a.id === 'open-v15-ing-clarity-zero' && a.value === 1)).toBe(
      true
    );
    expect(result.adjustments.some((a) => a.id === 'open-v15-origins-evidently-complete' && a.value === 8)).toBe(
      true
    );
    expect(result.score).toBe(24);
  });
});
