/**
 * Planet Pillar — Planet_Scoring_Specification_v19 + Annex v2
 */

import { calculatePlanetPillar } from '../../../../lib/truscoreEngine/pillars/planetPillar';
import { Product } from '../../../../types/product';

describe('Planet Pillar (v19)', () => {
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

  test('base 15 when no Eco-Score and no packaging evidence', () => {
    const result = calculatePlanetPillar(baseProduct);
    expect(result.base).toBe(15);
    expect(result.score).toBe(15);
    expect(result.details.hasEcoScoreGrade).toBe(false);
    expect(result.details.palmOilPlanetAdjustment).toBe(0);
  });

  test('Eco-Score A => +7 (22)', () => {
    const product = { ...baseProduct, ecoscore_grade: 'a' };
    const result = calculatePlanetPillar(product);
    expect(result.score).toBe(22);
    expect(result.details.hasEcoScoreGrade).toBe(true);
    expect(result.details.ecoscoreAdjustment).toBe(7);
    expect(result.details.packagingFallbackPoints).toBeUndefined();
  });

  test('Eco-Score C => −1 (14)', () => {
    const product = { ...baseProduct, ecoscore_grade: 'c' };
    const result = calculatePlanetPillar(product);
    expect(result.score).toBe(14);
    expect(result.details.ecoscoreAdjustment).toBe(-1);
  });

  test('Eco-Score E => −7 (8)', () => {
    const product = { ...baseProduct, ecoscore_grade: 'e' };
    const result = calculatePlanetPillar(product);
    expect(result.score).toBe(8);
  });

  test('unknown Eco-Score string triggers packaging fallback path (not eco adjustment)', () => {
    const product: Product = {
      ...baseProduct,
      ecoscore_grade: 'unknown',
      true_scan_market: 'AU',
      packagings_complete: true,
      packagings: [{ recycling: 'Recycle' }, { recycling: 'en:recycle' }],
    };
    const result = calculatePlanetPillar(product);
    expect(result.details.hasEcoScoreGrade).toBe(false);
    expect(result.score).toBe(17);
    expect(result.details.packagingFallbackPoints).toBe(2);
  });

  test('palm tags do not change score when Eco-Score missing', () => {
    const product: Product = {
      ...baseProduct,
      ingredients_analysis_tags: ['en:palm-oil'],
      palm_oil_analysis: {
        containsPalmOil: true,
        isPalmOilFree: false,
        isNonSustainable: true,
        isCertifiedSustainable: false,
        score: -8,
      },
      true_scan_market: 'AU',
      packagings: [{ material: 'en:plastic', recycling: 'Check locally' }],
    };
    const result = calculatePlanetPillar(product);
    expect(result.score).toBe(15);
  });
});
