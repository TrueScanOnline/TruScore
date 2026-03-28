/**
 * Body Pillar Unit Tests
 *
 * Body_Scoring_Specification_V12 (Final): Nutri-Score A=22/B=18/C=14/D=12/E=8;
 * NOVA 1=+3, 2=+1, 3=−1, 4=−6; MVP additives (−1/−3/−6 per tier, element cap −8); red additive ceiling 12; floor 2.
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
    source: 'openfoodfacts',
  };

  test('should start at base score 15 when no data', () => {
    const result = calculateBodyPillar(baseProduct);
    expect(result.base).toBe(15);
    expect(result.score).toBe(15);
  });

  test('should apply Nutri-Score A adjustment (+7 from base 15 → 22)', () => {
    const product = { ...baseProduct, nutriscore_grade: 'a' };
    const result = calculateBodyPillar(product);
    expect(result.base).toBe(15);
    expect(result.score).toBe(22);
    expect(result.details.nutriscoreValue).toBe(22);
  });

  test('should apply Nutri-Score C adjustment (−1 from base 15 → 14)', () => {
    const product = { ...baseProduct, nutriscore_grade: 'c' };
    const result = calculateBodyPillar(product);
    expect(result.score).toBe(14);
    expect(result.details.nutriscoreValue).toBe(14);
  });

  test('should apply Nutri-Score D adjustment (−3 from base 15 → 12)', () => {
    const product = { ...baseProduct, nutriscore_grade: 'd' };
    const result = calculateBodyPillar(product);
    expect(result.base).toBe(15);
    expect(result.score).toBe(12);
    expect(result.details.nutriscoreValue).toBe(12);
  });

  test('should apply Nutri-Score E adjustment (−7 from base 15 → 8)', () => {
    const product = { ...baseProduct, nutriscore_grade: 'e' };
    const result = calculateBodyPillar(product);
    expect(result.base).toBe(15);
    expect(result.score).toBe(8);
    expect(result.details.nutriscoreValue).toBe(8);
  });

  test('should apply NOVA Group 4 (−6)', () => {
    const product = { ...baseProduct, nova_group: 4 };
    const result = calculateBodyPillar(product);
    expect(result.base).toBe(15);
    expect(result.score).toBe(9);
  });

  test('should apply NOVA Group 1 bonus (+3)', () => {
    const product = { ...baseProduct, nova_group: 1 };
    const result = calculateBodyPillar(product);
    expect(result.base).toBe(15);
    expect(result.score).toBe(18);
  });

  test('should apply MVP additive penalties from registry (e102 orange = −3)', () => {
    const product = { ...baseProduct, additives_tags: ['en:e102'] };
    const result = calculateBodyPillar(product);
    expect(result.details.additiveElementDeduction).toBe(3);
    expect(result.score).toBe(12);
  });

  test('applies MVP additives for OFF beverages (still category food)', () => {
    const product = {
      ...baseProduct,
      categories_tags: ['en:beverages', 'en:sodas'],
      additives_tags: ['en:e102'],
    };
    const result = calculateBodyPillar(product);
    expect(result.details.foodAdditivesApplied).toBe(true);
    expect(result.details.additiveElementDeduction).toBe(3);
  });

  test('normalizes en:250 additive tag to e250 for MVP scoring', () => {
    const product = { ...baseProduct, additives_tags: ['en:250'] };
    const result = calculateBodyPillar(product);
    expect(result.details.hasRedBodyAdditive).toBe(true);
    expect(result.details.additiveElementDeduction).toBe(6);
  });

  test('should apply red additive ceiling (max 12/25)', () => {
    const product = {
      ...baseProduct,
      nutriscore_grade: 'a',
      nova_group: 1,
      additives_tags: ['en:e250'],
    };
    const result = calculateBodyPillar(product);
    expect(result.details.hasRedBodyAdditive).toBe(true);
    expect(result.details.redAdditiveCeilingApplied).toBe(true);
    expect(result.score).toBe(12);
  });

  test('should respect floor 2', () => {
    const product = {
      ...baseProduct,
      nutriscore_grade: 'e',
      nova_group: 4,
      additives_tags: ['en:e102', 'en:e110', 'en:e129', 'en:e171'],
    };
    const result = calculateBodyPillar(product);
    expect(result.score).toBeGreaterThanOrEqual(2);
  });

  test('should cap score at 25', () => {
    const product = {
      ...baseProduct,
      nutriscore_grade: 'a',
      nova_group: 1,
    };
    const result = calculateBodyPillar(product);
    expect(result.score).toBe(25);
  });
});
