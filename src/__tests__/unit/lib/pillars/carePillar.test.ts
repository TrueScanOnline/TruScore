/**
 * Ethics Pillar Unit Tests
 *
 * SPEC: Database files/ETHICS Pillar/ETHICS SPEC sheet.xlsx — Base 15 + BBFAW + KTC + certifications (cap 0–25).
 */

import { calculateEthicsPillar } from '../../../../lib/truscoreEngine/pillars/ethicsPillar';
import { Product } from '../../../../types/product';

describe('Ethics Pillar Calculation (BBFAW + KTC + certifications)', () => {
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

  test('should start at base score 15 when no BBFAW match', () => {
    const result = calculateEthicsPillar(baseProduct);
    expect(result.base).toBe(15);
    expect(result.score).toBe(15);
    expect(result.details.bbfawMatchedCompany).toBeNull();
  });

  test('should apply nil return when brand not in BBFAW', () => {
    const product = { ...baseProduct, brands: 'Unknown Small Brand Ltd' };
    const result = calculateEthicsPillar(product);
    expect(result.base).toBe(15);
    expect(result.score).toBe(15);
    expect(result.details.bbfawMatchedCompany).toBeNull();
  });

  test('should use brand_owner over brands for BBFAW lookup', () => {
    const product = { ...baseProduct, brand_owner: 'Marks & Spencer PLC', brands: 'Unknown Brand' };
    const result = calculateEthicsPillar(product);
    expect(result.details.bbfawMatchedCompany).toBe('Marks & Spencer PLC');
    expect(result.score).toBe(22);
  });

  test('should resolve alias "M&S" to Marks & Spencer PLC via BBFAW mapping', () => {
    const product = { ...baseProduct, brands: 'M&S' };
    const result = calculateEthicsPillar(product);
    expect(result.details.bbfawMatchedCompany).toBe('Marks & Spencer PLC');
    expect(result.details.bbfawTier).toBe(2);
    expect(result.score).toBe(22);
  });

  test('should resolve alias "Batchelors" to Premier Foods PLC via BBFAW mapping', () => {
    const product = { ...baseProduct, brands: 'Batchelors' };
    const result = calculateEthicsPillar(product);
    expect(result.details.bbfawMatchedCompany).toBe('Premier Foods PLC');
    expect(result.details.bbfawTier).toBe(2);
  });

  test('should try second brand when first fails (Unknown, Activia)', () => {
    const product = { ...baseProduct, brands: 'Unknown, Activia' };
    const result = calculateEthicsPillar(product);
    expect(result.details.bbfawMatchedCompany).toBe('Groupe Danone SA');
    expect(result.details.bbfawTier).toBe(3);
  });

  test('should match Nestlé with accent via parent_entity_exact indexing', () => {
    const product = { ...baseProduct, brand_owner: 'Nestlé SA' };
    const result = calculateEthicsPillar(product);
    expect(result.details.bbfawMatchedCompany).toBeTruthy();
  });

  test('should require exact match - Unilever does not match Unilever NV', () => {
    const product = { ...baseProduct, brands: 'Unilever' };
    const result = calculateEthicsPillar(product);
    expect(result.details.bbfawMatchedCompany).toBeNull();
    expect(result.score).toBe(15);
  });

  test('should apply BBFAW Tier 2 + Impact B for Marks & Spencer', () => {
    const product = { ...baseProduct, brands: 'Marks & Spencer PLC' };
    const result = calculateEthicsPillar(product);
    expect(result.base).toBe(15);
    // Tier 2 = +4, Impact B = +3 => 15 + 4 + 3 = 22
    expect(result.details.bbfawMatchedCompany).toBeTruthy();
    expect(result.details.bbfawTier).toBe(2);
    expect(result.details.bbfawTierScore).toBe(4);
    expect(result.details.bbfawImpactScore).toBe(3);
    expect(result.score).toBe(22);
  });

  test('should apply BBFAW Tier 2 for Greggs', () => {
    const product = { ...baseProduct, brands: 'Greggs PLC' };
    const result = calculateEthicsPillar(product);
    expect(result.base).toBe(15);
    expect(result.details.bbfawTier).toBe(2);
    expect(result.details.bbfawTierScore).toBe(4);
    // Greggs has Impact C = +1
    expect(result.details.bbfawImpactScore).toBe(1);
    expect(result.score).toBe(20); // 15 + 4 + 1
  });

  test('should apply BBFAW Tier 3 for Groupe Danone', () => {
    const product = { ...baseProduct, brands: 'Groupe Danone SA' };
    const result = calculateEthicsPillar(product);
    expect(result.details.bbfawTier).toBe(3);
    expect(result.details.bbfawTierScore).toBe(2);
    // Danone has Impact C = +1
    expect(result.score).toBe(18); // 15 + 2 + 1
  });

  test('should apply BBFAW Tier 6 penalty for Tyson Foods', () => {
    const product = { ...baseProduct, brands: 'Tyson Foods' };
    const result = calculateEthicsPillar(product);
    expect(result.details.bbfawMatchedCompany).toBeTruthy();
    expect(result.details.bbfawTier).toBe(6);
    expect(result.details.bbfawTierScore).toBe(-6);
    // Tyson has Impact F = -3
    expect(result.details.bbfawImpactScore).toBe(-3);
    expect(result.score).toBe(6); // 15 - 6 - 3
  });

  test('should cap score at 0', () => {
    const product = { ...baseProduct, brands: 'JBS SA' }; // Tier 6, Impact F
    const result = calculateEthicsPillar(product);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  test('should cap score at 25', () => {
    // Tier 1 + Impact A/B could theoretically exceed 25 - cap applies
    const product = { ...baseProduct, brands: 'Marks & Spencer PLC' }; // 15+4+3=22, within cap
    const result = calculateEthicsPillar(product);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  test('should add certifications (max scheme) when BBFAW does not apply', () => {
    const product = {
      ...baseProduct,
      brands: 'Totally Unknown Indie Brand',
      labels_tags: ['en:fair-trade'],
    };
    const result = calculateEthicsPillar(product);
    expect(result.details.certificationsAdjustment).toBe(5);
    expect(result.details.certificationsWinningScheme).toBe('fairtrade');
    expect(result.score).toBe(20);
  });
});
