import type { Product } from '../../../types/product';
import { parseWeightNutrientInputToGramsPer100g, prefillManualNutritionFromProduct } from '../../../utils/manualEditNutritionPrefill';

describe('manualEditNutritionPrefill', () => {
  it('prefills kcal and grams per 100g like NutritionTable resolution', () => {
    const product = {
      barcode: '1',
      nutriments: {
        'energy-kcal_100g': 413,
        fat_100g: 8.2,
        'saturated-fat_100g': 3.1,
        carbohydrates_100g: 66,
        sugars_100g: 24.5,
        fiber_100g: 4,
        proteins_100g: 7.7,
        salt_100g: 0.09,
      },
    } as Product;

    const metric = prefillManualNutritionFromProduct(product, 'metric');
    expect(metric.energy).toBe('413');
    expect(metric.fat).toBe('8.20');
    expect(metric.saturatedFat).toBe('3.10');
    expect(metric.carbs).toBe('66.00');

    const imperial = prefillManualNutritionFromProduct(product, 'imperial');
    const roundTrip = parseWeightNutrientInputToGramsPer100g(imperial.fat, 'imperial');
    // Display uses 2 decimal oz → small drift vs exact grams (acceptable for manual entry)
    expect(roundTrip).not.toBeUndefined();
    expect(Math.abs((roundTrip ?? 0) - 8.2)).toBeLessThan(0.05);
  });

  it('round-trips imperial oz input to grams for save', () => {
    const g = parseWeightNutrientInputToGramsPer100g('0.29', 'imperial');
    expect(g).toBeCloseTo(8.22, 1);
  });
});
