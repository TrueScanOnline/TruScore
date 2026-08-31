/**
 * Whole Produce eligibility gate — H1/H2/H3 hardening regressions.
 */

import { evaluateWholeProduceEligibility } from '../../../lib/truscoreEngine/wholeProduceEligibility';
import { assignNOVA1IfHighConfidence } from '../../../utils/novaAssessment';
import type { Product } from '../../../types/product';

function baseProduct(over: Partial<Product> = {}): Product {
  return {
    barcode: 'test',
    product_name: 'Test',
    brands: '',
    categories: '',
    categories_tags: ['en:fruits'],
    labels_tags: [],
    ingredients_text: 'apple',
    ingredients_analysis_tags: [],
    additives_tags: [],
    nutriments: {},
    source: 'openfoodfacts',
    nova_group: 1,
    ...over,
  };
}

describe('evaluateWholeProduceEligibility — hardening H1/H2/H3', () => {
  test('strawberry jam + generic fruit category + NOVA1 → not eligible', () => {
    const result = evaluateWholeProduceEligibility(
      baseProduct({
        ingredients_text: 'strawberry jam',
        categories_tags: ['en:fruits'],
        nova_group: 1,
      })
    );
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('ingredients_not_whole_produce_only');
  });

  test('apple juice → not eligible', () => {
    const result = evaluateWholeProduceEligibility(
      baseProduct({
        ingredients_text: 'apple juice',
        categories_tags: ['en:apple-juices', 'en:juices'],
      })
    );
    expect(result.eligible).toBe(false);
  });

  test('dried blueberries — NOVA1 rescue may succeed but Whole Produce gate fails', () => {
    const product = baseProduct({
      ingredients_text: 'dried blueberries',
      categories_tags: ['en:berries', 'en:fruits'],
      nova_group: undefined,
    });
    const rescued = assignNOVA1IfHighConfidence({ ...product });
    expect(rescued.nova_group).toBe(1);
    const result = evaluateWholeProduceEligibility(rescued);
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('ingredients_not_whole_produce_only');
  });

  test('roasted carrots → not eligible', () => {
    const result = evaluateWholeProduceEligibility(
      baseProduct({
        ingredients_text: 'roasted carrots',
        categories_tags: ['en:vegetables', 'en:carrots'],
      })
    );
    expect(result.eligible).toBe(false);
  });

  test('seasoned potato → not eligible', () => {
    const result = evaluateWholeProduceEligibility(
      baseProduct({
        ingredients_text: 'seasoned potato',
        categories_tags: ['en:fresh-potatoes', 'en:vegetables'],
      })
    );
    expect(result.eligible).toBe(false);
  });

  test('additive-bearing generic produce + NOVA1 → not eligible (H2)', () => {
    const result = evaluateWholeProduceEligibility(
      baseProduct({
        ingredients_text: 'spinach',
        categories_tags: ['en:vegetables'],
        additives_tags: ['en:e300'],
      })
    );
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('additive_tags_present');
  });

  test('apples & pears → not eligible (H3 separator)', () => {
    const result = evaluateWholeProduceEligibility(
      baseProduct({
        ingredients_text: 'apples & pears',
        categories_tags: ['en:fresh-fruits', 'en:fruits'],
      })
    );
    expect(result.eligible).toBe(false);
  });

  test('apples/pears slash separator → not eligible', () => {
    const result = evaluateWholeProduceEligibility(
      baseProduct({
        ingredients_text: 'apples / pears',
        categories_tags: ['en:fresh-fruits'],
      })
    );
    expect(result.eligible).toBe(false);
  });

  test('blanched single-ingredient spinach remains eligible', () => {
    const result = evaluateWholeProduceEligibility(
      baseProduct({
        ingredients_text: 'blanched spinach',
        categories_tags: ['en:vegetables'],
      })
    );
    expect(result.eligible).toBe(true);
  });

  test('frozen peas remains eligible', () => {
    const result = evaluateWholeProduceEligibility(
      baseProduct({
        ingredients_text: 'frozen peas',
        categories_tags: ['en:legumes', 'en:pulses'],
      })
    );
    expect(result.eligible).toBe(true);
  });

  test('peeled potato remains eligible', () => {
    const result = evaluateWholeProduceEligibility(
      baseProduct({
        ingredients_text: 'peeled potato',
        categories_tags: ['en:fresh-potatoes', 'en:vegetables'],
      })
    );
    expect(result.eligible).toBe(true);
  });

  test('cut mango remains eligible', () => {
    const result = evaluateWholeProduceEligibility(
      baseProduct({
        ingredients_text: 'cut mango',
        categories_tags: ['en:fresh-fruits', 'en:fruits'],
      })
    );
    expect(result.eligible).toBe(true);
  });
});
