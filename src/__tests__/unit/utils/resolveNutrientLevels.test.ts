import {
  deriveNutrientLevelsFromNutriments,
  resolveNutrientLevels,
} from '../../../utils/resolveNutrientLevels';
import type { ProductNutriments, ProductNutrientLevels } from '../../../types/product';

describe('resolveNutrientLevels', () => {
  it('marks very high sugar as high (G Syrup–style OFF payload with empty nutrient_levels)', () => {
    const nutriments: ProductNutriments = {
      sugars_100g: 77.1428571428571,
      salt_100g: 0.5,
    };
    const derived = deriveNutrientLevelsFromNutriments(nutriments, undefined);
    expect(derived.sugars).toBe('high');
    expect(derived.salt).toBe('moderate');

    const merged = resolveNutrientLevels(nutriments, {}, undefined);
    expect(merged.sugars).toBe('high');
    expect(merged.salt).toBe('moderate');
  });

  it('keeps API nutrient_levels when present and only fills gaps', () => {
    const nutriments: ProductNutriments = { sugars_100g: 50, fat_100g: 25 };
    const api: ProductNutrientLevels = { sugars: 'low' }; // trust API for sugars
    const merged = resolveNutrientLevels(nutriments, api, undefined);
    expect(merged.sugars).toBe('low');
    expect(merged.fat).toBe('high');
  });

  it('halves sugar thresholds for en:beverages like OFF server', () => {
    const nutriments: ProductNutriments = { sugars_100g: 7 };
    const food = deriveNutrientLevelsFromNutriments(nutriments, undefined);
    expect(food.sugars).toBe('moderate'); // between 5 and 12.5

    const drink = deriveNutrientLevelsFromNutriments(nutriments, ['en:beverages']);
    expect(drink.sugars).toBe('high'); // low 2.5, high 6.25 → 7 > 6.25
  });
});
