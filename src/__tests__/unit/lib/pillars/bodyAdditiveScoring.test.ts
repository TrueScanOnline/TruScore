/**
 * Body MVP additive scoring — exact text fallback (Phase 1) when tags missing or incomplete.
 */

import { scoreBodyMvpAdditives, normalizeOffAdditiveTag } from '../../../../lib/truscoreEngine/pillars/bodyAdditiveScoring';
import { Product } from '../../../../types/product';

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

describe('bodyAdditiveScoring', () => {
  describe('normalizeOffAdditiveTag', () => {
    test('normalizes en:e102', () => {
      expect(normalizeOffAdditiveTag('en:e102')).toBe('e102');
    });
    test('normalizes en:e250', () => {
      expect(normalizeOffAdditiveTag('en:e250')).toBe('e250');
    });
    test('normalizes en:250 to e250', () => {
      expect(normalizeOffAdditiveTag('en:250')).toBe('e250');
    });
    test('normalizes E 250 to e250', () => {
      expect(normalizeOffAdditiveTag('E 250')).toBe('e250');
    });
    test('normalizes e-150d to e150d', () => {
      expect(normalizeOffAdditiveTag('e-150d')).toBe('e150d');
    });
    test('returns null for unrecognised tag', () => {
      expect(normalizeOffAdditiveTag('en:unknown')).toBe(null);
    });
  });

  describe('scoreBodyMvpAdditives — text fallback without OFF tags', () => {
    test('detects tartrazine in ingredients_text when additives_tags empty (e102 orange = −3)', () => {
      const p = baseProduct({
        additives_tags: [],
        ingredients_text: 'Sugar, tartrazine',
      });
      const r = scoreBodyMvpAdditives(p);
      expect(r.matches.map((m) => m.canonicalId)).toContain('e102');
      expect(r.elementDeduction).toBe(3);
      expect(r.hasRedTier).toBe(false);
    });

    test('detects alias phrase "colour (102)" when tags empty', () => {
      const p = baseProduct({
        additives_tags: [],
        ingredients_text: 'Water, colour (102)',
      });
      const r = scoreBodyMvpAdditives(p);
      expect(r.matches.some((m) => m.canonicalId === 'e102')).toBe(true);
    });

    test('detects sodium nitrite phrase in text (e250 red)', () => {
      const p = baseProduct({
        additives_tags: [],
        ingredients_text: 'Pork, sodium nitrite, salt',
      });
      const r = scoreBodyMvpAdditives(p);
      expect(r.matches.some((m) => m.canonicalId === 'e250')).toBe(true);
      expect(r.hasRedTier).toBe(true);
    });

    test('does not treat stray standalone 250 in ingredients as sodium nitrite', () => {
      const p = baseProduct({
        additives_tags: [],
        ingredients_text: 'Water, sugar, 250, acidifier',
      });
      const r = scoreBodyMvpAdditives(p);
      expect(r.matches.some((m) => m.canonicalId === 'e250')).toBe(false);
      expect(r.elementDeduction).toBe(0);
    });

    test('numeric-only OFF tag en:250 still scores via tags', () => {
      const p = baseProduct({
        additives_tags: ['en:250'],
        ingredients_text: 'Water, sugar',
      });
      const r = scoreBodyMvpAdditives(p);
      expect(r.matches.some((m) => m.canonicalId === 'e250')).toBe(true);
      expect(r.hasRedTier).toBe(true);
    });
  });

  describe('scoreBodyMvpAdditives — incomplete tags (text match not in tag set)', () => {
    test('adds e102 from text when tags list only non-MVP additives', () => {
      const p = baseProduct({
        additives_tags: ['en:e100'],
        ingredients_text: 'Flour, tartrazine',
      });
      const r = scoreBodyMvpAdditives(p);
      expect(r.matches.map((m) => m.canonicalId)).toContain('e102');
      expect(r.elementDeduction).toBe(3);
    });
  });

  describe('scoreBodyMvpAdditives — tags present and complete', () => {
    test('does not use text-only duplicate when en:e102 already in tags', () => {
      const p = baseProduct({
        additives_tags: ['en:e102'],
        ingredients_text: 'Also says tartrazine on the label',
      });
      const r = scoreBodyMvpAdditives(p);
      expect(r.matches.filter((m) => m.canonicalId === 'e102')).toHaveLength(1);
      expect(r.elementDeduction).toBe(3);
    });
  });

  describe('element cap', () => {
    test('caps total MVP deduction at 8', () => {
      const p = baseProduct({
        additives_tags: ['en:e102', 'en:e110', 'en:e129', 'en:e171'],
        ingredients_text: '',
      });
      const r = scoreBodyMvpAdditives(p);
      expect(r.rawSumDeduction).toBeGreaterThan(8);
      expect(r.elementDeduction).toBe(8);
    });
  });
});
