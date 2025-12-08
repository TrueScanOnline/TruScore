/**
 * Body Pillar Unit Tests
 * 
 * Tests the Body Pillar calculation independently
 */

import { calculateBodyPillar } from '../../../../lib/truscoreEngine/pillars/bodyPillar';
import { Product } from '../../../../types/product';

describe('Body Pillar Calculation', () => {
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

  test('should start at base score 15 when no data', () => {
    const result = calculateBodyPillar(baseProduct);
    expect(result.base).toBe(15);
    expect(result.score).toBe(15);
  });

  test('should apply Nutri-Score A adjustment (+10 from base 15)', () => {
    const product = { ...baseProduct, nutriscore_grade: 'a' };
    const result = calculateBodyPillar(product);
    expect(result.base).toBe(15);
    expect(result.score).toBe(25); // 15 + 10
    expect(result.details.nutriscoreValue).toBe(25);
  });

  test('should apply Nutri-Score D adjustment (-5 from base 15)', () => {
    const product = { ...baseProduct, nutriscore_grade: 'd' };
    const result = calculateBodyPillar(product);
    expect(result.base).toBe(15);
    expect(result.score).toBe(10); // 15 - 5
    expect(result.details.nutriscoreValue).toBe(10);
  });

  test('should apply Nutri-Score E adjustment (-10 from base 15)', () => {
    const product = { ...baseProduct, nutriscore_grade: 'e' };
    const result = calculateBodyPillar(product);
    expect(result.base).toBe(15);
    expect(result.score).toBe(5); // 15 - 10
    expect(result.details.nutriscoreValue).toBe(5);
  });

  test('should apply NOVA Group 4 penalty (-8)', () => {
    const product = { ...baseProduct, nova_group: 4 };
    const result = calculateBodyPillar(product);
    expect(result.base).toBe(15);
    expect(result.score).toBe(7); // 15 - 8
  });

  test('should apply NOVA Group 1 bonus (+3)', () => {
    const product = { ...baseProduct, nova_group: 1 };
    const result = calculateBodyPillar(product);
    expect(result.base).toBe(15);
    expect(result.score).toBe(18); // 15 + 3
  });

  test('should apply additive penalties', () => {
    const product = { ...baseProduct, additives_tags: ['en:e102', 'en:e104'] };
    const result = calculateBodyPillar(product);
    expect(result.base).toBe(15);
    expect(result.details.additivePenalty).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(15);
  });

  test('should cap score at 0', () => {
    const product = {
      ...baseProduct,
      nutriscore_grade: 'e', // -10
      nova_group: 4, // -8
      additives_tags: ['en:e102', 'en:e104', 'en:e110', 'en:e122'], // Additional penalties
    };
    const result = calculateBodyPillar(product);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  test('should cap score at 25', () => {
    const product = {
      ...baseProduct,
      nutriscore_grade: 'a', // +10
      nova_group: 1, // +3
    };
    const result = calculateBodyPillar(product);
    expect(result.score).toBeLessThanOrEqual(25);
  });
});

