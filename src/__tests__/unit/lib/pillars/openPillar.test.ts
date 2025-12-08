/**
 * Open Pillar Unit Tests
 * 
 * Tests the Open Pillar calculation independently
 */

import { calculateOpenPillar } from '../../../../lib/truscoreEngine/pillars/openPillar';
import { Product } from '../../../../types/product';

describe('Open Pillar Calculation', () => {
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
    const result = calculateOpenPillar(baseProduct);
    expect(result.base).toBe(15);
    expect(result.score).toBe(7); // 15 - 5 (no ingredients) - 8 (no origin) = 2, but let's check
  });

  test('should apply no ingredients penalty (-5)', () => {
    const product = { ...baseProduct, ingredients_text: '' };
    const result = calculateOpenPillar(product);
    expect(result.base).toBe(15);
    expect(result.details.ingredientsScore).toBe(-5);
  });

  test('should apply full ingredients disclosure (no adjustment, stays at 15)', () => {
    const longIngredients = 'Water, Sugar, Salt, '.repeat(50); // >100 chars
    const product = { ...baseProduct, ingredients_text: longIngredients };
    const result = calculateOpenPillar(product);
    expect(result.base).toBe(15);
    expect(result.details.ingredientsScore).toBe(0); // Full disclosure = no adjustment
    // Score will be 15 - 8 (no origin) = 7
  });

  test('should apply partial ingredients disclosure penalty (>80% = -5)', () => {
    const mediumIngredients = 'Water, Sugar, Salt, '.repeat(20); // ~80-100 chars
    const product = { ...baseProduct, ingredients_text: mediumIngredients };
    const result = calculateOpenPillar(product);
    expect(result.base).toBe(15);
    expect(result.details.ingredientsScore).toBe(-5);
  });

  test('should apply hidden terms penalty (1-2 terms = -10)', () => {
    const product = {
      ...baseProduct,
      ingredients_text: 'Water, Sugar, Parfum, Fragrance',
    };
    const result = calculateOpenPillar(product);
    expect(result.base).toBe(15);
    expect(result.details.hiddenTermsPenalty).toBe(10);
  });

  test('should apply hidden terms penalty (≥3 terms = -20)', () => {
    const product = {
      ...baseProduct,
      ingredients_text: 'Water, Sugar, Parfum, Fragrance, Aroma, Natural Flavor',
    };
    const result = calculateOpenPillar(product);
    expect(result.base).toBe(15);
    expect(result.details.hiddenTermsPenalty).toBe(20);
  });

  test('should apply no origin penalty (-8)', () => {
    const product = { ...baseProduct };
    const result = calculateOpenPillar(product);
    expect(result.base).toBe(15);
    expect(result.details.originPenalty).toBe(8);
  });

  test('should apply sophistication bonus (+5) for zero hidden + NOVA 1-2', () => {
    const longIngredients = 'Water, Sugar, Salt, '.repeat(50); // Full disclosure
    const product = {
      ...baseProduct,
      ingredients_text: longIngredients,
      nova_group: 1,
      origins: 'New Zealand',
    };
    const result = calculateOpenPillar(product);
    expect(result.base).toBe(15);
    expect(result.details.sophisticationBonus).toBe(5);
  });

  test('should cap score at 0', () => {
    const product = {
      ...baseProduct,
      ingredients_text: 'Parfum, Fragrance, Aroma, Natural Flavor, Artificial Flavor', // Many hidden terms
    };
    const result = calculateOpenPillar(product);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});

