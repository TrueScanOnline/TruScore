/**
 * Planet Pillar Unit Tests
 *
 * Aligns with shipped planetPillar.ts: Eco-Score grade → absolute pillar values
 * A=22, B=18, C=15, D=12, E=8 (from base 15 via adjustment); palm oil −8 uncertified, etc.
 */

import { calculatePlanetPillar } from '../../../../lib/truscoreEngine/pillars/planetPillar';
import { Product } from '../../../../types/product';
import { initializeCSVDatabases } from '../../../../services/csvDatabases/csvDatabaseService';

describe('Planet Pillar Calculation', () => {
  beforeAll(async () => {
    await initializeCSVDatabases();
  });

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
    const result = calculatePlanetPillar(baseProduct);
    expect(result.base).toBe(15);
    expect(result.score).toBe(15);
  });

  test('should apply Eco-Score A adjustment (+7 from base 15 → 22)', () => {
    const product = { ...baseProduct, ecoscore_grade: 'a' };
    const result = calculatePlanetPillar(product);
    expect(result.base).toBe(15);
    expect(result.score).toBe(22);
    expect(result.details.ecoscoreValue).toBe(22);
  });

  test('should apply Eco-Score E adjustment (−7 from base 15 → 8)', () => {
    const product = { ...baseProduct, ecoscore_grade: 'e' };
    const result = calculatePlanetPillar(product);
    expect(result.base).toBe(15);
    expect(result.score).toBe(8);
    expect(result.details.ecoscoreValue).toBe(8);
  });

  test('should apply palm oil penalty (-8)', () => {
    const product = {
      ...baseProduct,
      palm_oil_analysis: {
        containsPalmOil: true,
        isPalmOilFree: false,
        isCertifiedSustainable: false,
        isNonSustainable: true,
        score: -8,
      },
    };
    const result = calculatePlanetPillar(product);
    expect(result.base).toBe(15);
    expect(result.details.palmOilPenalty).toBe(8);
    expect(result.score).toBe(7); // 15 - 8
  });

  test('should apply 0 penalty for RSPO certified palm oil (Unilever)', () => {
    const product = {
      ...baseProduct,
      brand_owner: 'Unilever',
      palm_oil_analysis: {
        containsPalmOil: true,
        isPalmOilFree: false,
        isCertifiedSustainable: true,
        isNonSustainable: false,
        score: 0,
      },
    };
    const result = calculatePlanetPillar(product);
    expect(result.base).toBe(15);
    // RSPO certified should be 0 (neutral), not -5
    expect(result.details.palmOilPenalty).toBe(0);
    expect(result.score).toBeGreaterThanOrEqual(15); // No penalty
  });

  test('should apply -5 for certified sustainable (non-RSPO)', () => {
    const product = {
      ...baseProduct,
      brand_owner: 'Unknown Brand',
      palm_oil_analysis: {
        containsPalmOil: true,
        isPalmOilFree: false,
        isCertifiedSustainable: true,
        isNonSustainable: false,
        score: -5,
      },
    };
    const result = calculatePlanetPillar(product);
    expect(result.base).toBe(15);
    expect(result.details.palmOilPenalty).toBe(5);
    expect(result.score).toBe(10); // 15 - 5
  });

  test('should cap score at 0 when penalties exceed base', () => {
    const product = {
      ...baseProduct,
      ecoscore_grade: 'e', // 8 after eco adjustment (15−7)
      palm_oil_analysis: {
        containsPalmOil: true,
        isPalmOilFree: false,
        isCertifiedSustainable: false,
        isNonSustainable: true,
        score: -8,
      }, // -8
    };
    const result = calculatePlanetPillar(product);
    expect(result.score).toBe(0); // 5 - 8 = -3 → capped at 0
  });

  test('should cap score at 25', () => {
    const product = {
      ...baseProduct,
      ecoscore_grade: 'a', // +10
      packagings: [{ material: 'plastic', shape: 'bottle' }],
    };
    const result = calculatePlanetPillar(product);
    expect(result.score).toBeLessThanOrEqual(25);
  });
});

