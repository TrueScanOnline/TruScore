/**
 * Wave 2 P0 — technical scoring failures must be unavailable/non-assessment.
 */
import { calculateTruScore, calculatePlanetPillar } from '../../../lib/truscoreEngine';
import * as packagingFallback from '../../../lib/truscoreEngine/pillars/planetPackagingFallback';
import type { Product } from '../../../types/product';

const baseProduct = {
  barcode: '9300605157200',
  product_name: 'Trix',
  brands: 'Nestlé',
  source: 'openfoodfacts',
  nutriscore_grade: 'c',
  nova_group: 4,
  ecoscore_grade: 'd',
  ingredients_text: 'sugar, corn',
  nutriments: {
    'energy-kcal_100g': 380,
    sugars_100g: 30,
    fat_100g: 3,
    salt_100g: 0.5,
    proteins_100g: 5,
    fiber_100g: 2,
  },
} as Product;

describe('Wave 2 P0 scoring unavailable', () => {
  it('returns numeric scores for a normal OFF product (genuine scores preserved)', () => {
    const r = calculateTruScore(baseProduct);
    expect(r.scoringUnavailable).toBeFalsy();
    expect(typeof r.truscore).toBe('number');
    expect(r.truscore).toBeGreaterThan(0);
    expect(typeof r.breakdown.Body).toBe('number');
    expect(typeof r.breakdown.Planet).toBe('number');
    expect(typeof r.breakdown.Ethics).toBe('number');
    expect(typeof r.breakdown.Open).toBe('number');
  });

  it('outer wrapper: invalid product → unavailable (not Overall 0)', () => {
    const r = calculateTruScore(null as unknown as Product);
    expect(r.scoringUnavailable).toBe(true);
    expect(r.truscore).toBeNull();
    expect(r.breakdown.Body).toBeNull();
    expect(r.breakdown.Planet).toBeNull();
    expect(r.breakdown.Ethics).toBeNull();
    expect(r.breakdown.Open).toBeNull();
  });

  it('Planet technical failure → unavailable (not Planet 15 / Overall zeros)', () => {
    const spy = jest.spyOn(packagingFallback, 'computePackagingFallback').mockImplementation(() => {
      throw new Error('forced Planet technical failure');
    });
    const p = { ...baseProduct, ecoscore_grade: undefined, ecoscore_score: undefined } as Product;
    const r = calculateTruScore(p);
    expect(r.scoringUnavailable).toBe(true);
    expect(r.truscore).toBeNull();
    expect(r.breakdown).toEqual({ Body: null, Planet: null, Ethics: null, Open: null });
    spy.mockRestore();
  });

  it('Planet pillar rethrows rather than returning baseline 15', () => {
    const spy = jest.spyOn(packagingFallback, 'computePackagingFallback').mockImplementation(() => {
      throw new Error('forced');
    });
    const p = { ...baseProduct, ecoscore_grade: undefined } as Product;
    expect(() => calculatePlanetPillar(p)).toThrow(/forced/);
    spy.mockRestore();
  });
});
