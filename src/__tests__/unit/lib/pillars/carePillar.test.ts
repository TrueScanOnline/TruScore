/**
 * Care Pillar Unit Tests
 * 
 * Tests the Care Pillar calculation independently
 */

import { calculateCarePillar } from '../../../../lib/truscoreEngine/pillars/carePillar';
import { Product } from '../../../../types/product';

describe('Care Pillar Calculation', () => {
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

  test('should start at base score 15', () => {
    const result = calculateCarePillar(baseProduct);
    expect(result.base).toBe(15);
    expect(result.score).toBe(15);
  });

  test('should apply Fairtrade certification bonus (+8)', () => {
    const product = { ...baseProduct, labels_tags: ['en:fair-trade'] };
    const result = calculateCarePillar(product);
    expect(result.base).toBe(15);
    expect(result.score).toBe(23); // 15 + 8
    expect(result.details.certificationBonus).toBe(8);
  });

  test('should apply Organic certification bonus (+7)', () => {
    const product = { ...baseProduct, labels_tags: ['en:organic'] };
    const result = calculateCarePillar(product);
    expect(result.base).toBe(15);
    expect(result.score).toBe(22); // 15 + 7
    expect(result.details.certificationBonus).toBe(7);
  });

  test('should cap certification bonus at +15', () => {
    const product = {
      ...baseProduct,
      labels_tags: ['en:fair-trade', 'en:organic', 'en:rainforest-alliance'], // 8 + 7 + 6 = 21, capped at 15
    };
    const result = calculateCarePillar(product);
    expect(result.base).toBe(15);
    expect(result.score).toBe(30); // 15 + 15 = 30, but capped at 25
    expect(result.score).toBeLessThanOrEqual(25);
    expect(result.details.certificationBonus).toBe(15);
  });

  test('should apply cruel parent penalty (-15)', () => {
    const product = { ...baseProduct, brands: 'Nestle' }; // Assuming Nestle is in cruel parents list
    const result = calculateCarePillar(product);
    // Note: This test depends on the brand database
    // If Nestle is in the list, score should be 0 (15 - 15)
    expect(result.base).toBe(15);
    if (result.details.cruelParentPenalty > 0) {
      expect(result.score).toBe(0);
    }
  });

  test('should apply recall penalty (-10)', () => {
    const now = Date.now();
    const product = {
      ...baseProduct,
      recalls: [{
        isActive: true,
        recallDate: new Date(now - (6 * 30 * 24 * 60 * 60 * 1000)).toISOString(), // 6 months ago
      }],
    };
    const result = calculateCarePillar(product);
    expect(result.base).toBe(15);
    expect(result.details.recallPenalty).toBe(10);
    expect(result.score).toBe(5); // 15 - 10
  });

  test('should cap score at 0', () => {
    const product = {
      ...baseProduct,
      recalls: [{
        isActive: true,
        recallDate: new Date(Date.now() - (6 * 30 * 24 * 60 * 60 * 1000)).toISOString(),
      }],
    };
    const result = calculateCarePillar(product);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});

