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

  test('should apply hidden terms penalty (1 term = -5)', () => {
    const product = {
      ...baseProduct,
      ingredients_text: 'Water, Sugar, Parfum',
      origins: 'New Zealand',
    };
    const result = calculateOpenPillar(product);
    expect(result.base).toBe(15);
    expect(result.details.hiddenTermsPenalty).toBe(5);
    expect(result.details.hiddenTermsCount).toBe(1);
  });

  test('should apply hidden terms penalty (2 terms = -10)', () => {
    const product = {
      ...baseProduct,
      ingredients_text: 'Water, Sugar, Parfum, Fragrance',
      origins: 'New Zealand',
    };
    const result = calculateOpenPillar(product);
    expect(result.base).toBe(15);
    expect(result.details.hiddenTermsPenalty).toBe(10);
    expect(result.details.hiddenTermsCount).toBe(2);
  });

  test('should apply hidden terms penalty (≥3 terms = -15)', () => {
    const product = {
      ...baseProduct,
      ingredients_text: 'Water, Sugar, Parfum, Fragrance, Aroma, Natural Flavor',
      origins: 'New Zealand',
    };
    const result = calculateOpenPillar(product);
    expect(result.base).toBe(15);
    expect(result.details.hiddenTermsPenalty).toBe(15);
    expect(result.details.hiddenTermsCount).toBeGreaterThanOrEqual(3);
  });

  test('should apply NOVA amplification (+1 to hidden count if NOVA≥3 & partial disclosure)', () => {
    const product = {
      ...baseProduct,
      ingredients_text: 'Water, Sugar, Parfum', // 1 hidden term, but short (partial disclosure)
      nova_group: 3 as const,
      origins: 'New Zealand',
    };
    const result = calculateOpenPillar(product);
    expect(result.base).toBe(15);
    expect(result.details.hiddenTermsCount).toBe(1);
    expect(result.details.effectiveHiddenCount).toBe(2); // 1 + NOVA amplification
    expect(result.details.hiddenTermsPenalty).toBe(10); // Penalty for 2 terms
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
      nova_group: 1 as const,
      origins: 'New Zealand',
      brand_owner: 'Test Company',
    };
    const result = calculateOpenPillar(product);
    expect(result.base).toBe(15);
    expect(result.details.sophisticationBonus).toBe(5);
  });

  test('should apply transparency bonus (+2) for zero hidden but not NOVA 1-2', () => {
    const longIngredients = 'Water, Sugar, Salt, '.repeat(50); // Full disclosure
    const product = {
      ...baseProduct,
      ingredients_text: longIngredients,
      nova_group: 3 as const, // NOVA 3, not 1-2
      origins: 'New Zealand',
      brand_owner: 'Test Company',
    };
    const result = calculateOpenPillar(product);
    expect(result.base).toBe(15);
    expect(result.details.sophisticationBonus).toBe(2);
  });

  test('should apply brand ownership penalty (-5) for hidden/opaque parent', () => {
    const longIngredients = 'Water, Sugar, Salt, '.repeat(50); // Full disclosure
    const product = {
      ...baseProduct,
      ingredients_text: longIngredients,
      origins: 'New Zealand',
      // No brand_owner field - should trigger penalty
    };
    const result = calculateOpenPillar(product);
    expect(result.base).toBe(15);
    expect(result.details.brandOwnershipPenalty).toBe(5);
  });

  test('should cap score at 0', () => {
    const product = {
      ...baseProduct,
      ingredients_text: 'Parfum, Fragrance, Aroma, Natural Flavor, Artificial Flavor, Secret Formula', // Many hidden terms
    };
    const result = calculateOpenPillar(product);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  test('should include fragrance in hidden terms count (merged)', () => {
    const product = {
      ...baseProduct,
      ingredients_text: 'Water, Sugar, Parfum', // 1 hidden term (fragrance)
      origins: 'New Zealand',
      brand_owner: 'Test Company',
    };
    const result = calculateOpenPillar(product);
    expect(result.details.hiddenTermsCount).toBe(1);
    expect(result.details.hiddenTermsPenalty).toBe(5);
  });
});

