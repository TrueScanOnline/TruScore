/**
 * NOVA 1 whitelist rescue — Implementation Guidance v1.3 minimum examples.
 */

import { assessNOVAGroup1, assignNOVA1IfHighConfidence } from '../../../utils/novaAssessment';
import { Product } from '../../../types/product';

function baseProduct(over: Partial<Product> = {}): Product {
  return {
    barcode: 'test',
    product_name: 'Test',
    brands: '',
    categories: '',
    categories_tags: [],
    labels_tags: [],
    ingredients_text: '',
    ingredients_analysis_tags: [],
    additives_tags: [],
    nutriments: {},
    source: 'openfoodfacts',
    ...over,
  };
}

describe('novaAssessment v1.3 guidance examples', () => {
  describe('should assign NOVA 1 (high confidence)', () => {
    const cases: Array<{ label: string; ingredients_text: string }> = [
      { label: 'peas', ingredients_text: 'peas' },
      { label: 'frozen peas', ingredients_text: 'frozen peas' },
      { label: 'spinach', ingredients_text: 'spinach' },
      { label: 'blueberries', ingredients_text: 'blueberries' },
      { label: 'chickpeas', ingredients_text: 'chickpeas' },
      { label: 'brown rice', ingredients_text: 'brown rice' },
      { label: 'milk', ingredients_text: 'milk' },
      { label: 'eggs', ingredients_text: 'eggs' },
      { label: 'plain yoghurt (single line)', ingredients_text: 'plain yoghurt' },
      { label: 'peas + water', ingredients_text: 'peas, water' },
    ];

    test.each(cases)('$label → likely NOVA1 high', ({ ingredients_text }) => {
      const p = baseProduct({ ingredients_text, additives_tags: [] });
      const a = assessNOVAGroup1(p);
      expect(a.likelyNOVA1).toBe(true);
      expect(a.confidence).toBe('high');
    });

    test('assignNOVA1IfHighConfidence sets nova_group=1 and provenance flags', () => {
      const p = baseProduct({ ingredients_text: 'frozen peas', additives_tags: [] });
      const out = assignNOVA1IfHighConfidence({ ...p });
      expect(out.nova_group).toBe(1);
      expect(out.nova1Provenance).toBe('inferred');
      expect(out._nova_estimated).toBe(true);
      expect(out._nova_confidence).toBe('high');
    });

    test('pre-existing external NOVA 1 is not stamped as inferred', () => {
      const p = baseProduct({
        ingredients_text: 'frozen peas',
        additives_tags: [],
        nova_group: 1,
        nova1Provenance: 'off',
      });
      const out = assignNOVA1IfHighConfidence({ ...p });
      expect(out.nova_group).toBe(1);
      expect(out.nova1Provenance).toBe('off');
      expect(out._nova_estimated).toBeUndefined();
    });

    test('milk + live cultures (plain yoghurt pattern)', () => {
      const p = baseProduct({
        ingredients_text: 'Milk, live cultures, natural yoghurt',
        additives_tags: [],
      });
      const a = assessNOVAGroup1(p);
      expect(a.likelyNOVA1).toBe(true);
      expect(a.confidence).toBe('high');
    });
  });

  describe('should NOT assign NOVA 1', () => {
    test('salt (Group 2)', () => {
      const p = baseProduct({ ingredients_text: 'salt', additives_tags: [] });
      const a = assessNOVAGroup1(p);
      expect(a.likelyNOVA1).toBe(false);
      expect(a.reason).toMatch(/Group 2/i);
    });

    test('sugar (Group 2)', () => {
      const p = baseProduct({ ingredients_text: 'sugar', additives_tags: [] });
      const a = assessNOVAGroup1(p);
      expect(a.likelyNOVA1).toBe(false);
    });

    test('olive oil (Group 2)', () => {
      const p = baseProduct({ ingredients_text: 'olive oil', additives_tags: [] });
      const a = assessNOVAGroup1(p);
      expect(a.likelyNOVA1).toBe(false);
    });

    test('peas + salt', () => {
      const p = baseProduct({ ingredients_text: 'peas, salt', additives_tags: [] });
      const a = assessNOVAGroup1(p);
      expect(a.likelyNOVA1).toBe(false);
    });

    test('bread (composite)', () => {
      const p = baseProduct({ ingredients_text: 'wheat flour, water, salt, yeast', additives_tags: [] });
      const a = assessNOVAGroup1(p);
      expect(a.likelyNOVA1).toBe(false);
    });

    test('any additives_tags present', () => {
      const p = baseProduct({
        ingredients_text: 'peas',
        additives_tags: ['en:e300'],
      });
      const a = assessNOVAGroup1(p);
      expect(a.likelyNOVA1).toBe(false);
      expect(a.reason).toMatch(/Additive tags/i);
    });

    test('does not override existing nova_group', () => {
      const p = baseProduct({
        ingredients_text: 'peas',
        additives_tags: [],
        nova_group: 4,
      });
      const a = assessNOVAGroup1(p);
      expect(a.likelyNOVA1).toBe(false);
      expect(a.reason).toMatch(/already set/i);
    });
  });
});
