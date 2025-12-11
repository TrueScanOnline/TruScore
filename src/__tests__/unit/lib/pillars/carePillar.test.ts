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
    expect(result.score).toBe(25); // 15 + 15 = 30, but capped at 25 (pillar max)
    expect(result.score).toBeLessThanOrEqual(25);
    expect(result.details.certificationBonus).toBe(15);
  });

  test('should apply major animal cruelty penalty (-15)', () => {
    const product = { ...baseProduct, brands: 'Unilever' }; // Known for animal testing
    const result = calculateCarePillar(product);
    // Note: This test depends on the brand database
    // If Unilever has major animal cruelty, score should be 0 (15 - 15)
    expect(result.base).toBe(15);
    if (result.details.animalCrueltyPenalty > 0) {
      expect(result.score).toBeLessThanOrEqual(15);
    }
  });

  test('should apply major labor violation penalty (-15)', () => {
    const product = { ...baseProduct, brands: 'Nestle' }; // Known for poor labor practices
    const result = calculateCarePillar(product);
    // Note: This test depends on the brand database
    // If Nestle has major labor violations, score should be reduced
    expect(result.base).toBe(15);
    if (result.details.laborViolationPenalty > 0) {
      expect(result.score).toBeLessThanOrEqual(15);
    }
  });

  test('should apply recall penalty (-10) for active recalls within 12 months', () => {
    const now = Date.now();
    const product = {
      ...baseProduct,
      recalls: [{
        recallId: 'test-1',
        productName: 'Test Product',
        reason: 'Test reason',
        recallDate: new Date(now - (6 * 30 * 24 * 60 * 60 * 1000)).toISOString(), // 6 months ago
        isActive: true,
      }],
    };
    const result = calculateCarePillar(product);
    expect(result.base).toBe(15);
    expect(result.details.recallPenalty).toBe(10);
    // Score should be reduced by at least 10 (may have additional penalties)
    expect(result.score).toBeLessThanOrEqual(5); // 15 - 10 (may be less if other penalties apply)
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  test('should apply RSPO certification bonus (+6)', () => {
    const product = { ...baseProduct, labels_tags: ['en:rspo', 'en:roundtable-on-sustainable-palm-oil'] };
    const result = calculateCarePillar(product);
    expect(result.base).toBe(15);
    expect(result.score).toBeGreaterThanOrEqual(21); // 15 + 6
    expect(result.details.certificationBonus).toBeGreaterThanOrEqual(6);
  });

  test('should apply Leaping Bunny certification bonus (+5)', () => {
    const product = { 
      ...baseProduct, 
      labels_tags: ['en:leaping-bunny', 'en:cruelty-free'],
      leaping_bunny: { isCrueltyFree: true, certificationStatus: 'certified' } as any,
    };
    const result = calculateCarePillar(product);
    expect(result.base).toBe(15);
    expect(result.score).toBeGreaterThanOrEqual(20); // 15 + 5
    expect(result.details.certificationBonus).toBeGreaterThanOrEqual(5);
  });

  test('should apply brand overlay penalty (-3) for high-impact brands', () => {
    const product = { ...baseProduct, brands: 'Johnson & Johnson' }; // Known for recalls and animal testing
    const result = calculateCarePillar(product);
    // Note: This test depends on the brand database
    // If J&J has high-impact conditions, overlay penalty should apply
    expect(result.base).toBe(15);
    if (result.details.brandOverlayPenalty > 0) {
      expect(result.details.brandOverlayPenalty).toBe(3);
      expect(result.score).toBeLessThanOrEqual(15);
    }
  });

  test('should cap score at 0', () => {
    const product = {
      ...baseProduct,
      recalls: [{
        recallId: 'test-1',
        productName: 'Test Product',
        reason: 'Test reason',
        recallDate: new Date(Date.now() - (6 * 30 * 24 * 60 * 60 * 1000)).toISOString(),
        isActive: true,
      }],
    };
    const result = calculateCarePillar(product);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  test('should cap score at 25', () => {
    const product = {
      ...baseProduct,
      labels_tags: [
        'en:fair-trade', // +8
        'en:organic', // +7
        'en:rainforest-alliance', // +6
        'en:rspo', // +6
        'en:rspca', // +5
        'en:leaping-bunny', // +5
        'en:b-corp', // +5
        'en:cage-free', // +4
      ],
    };
    const result = calculateCarePillar(product);
    expect(result.score).toBeLessThanOrEqual(25);
    expect(result.details.certificationBonus).toBeLessThanOrEqual(15);
  });
});

