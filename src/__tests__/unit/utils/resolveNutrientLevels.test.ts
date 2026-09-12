/**
 * Legacy OFF resolver is now a no-op — ratings live in assessGovernedNutrients.
 */
import {
  deriveNutrientLevelsFromNutriments,
  resolveNutrientLevels,
  applyResolvedNutrientLevels,
} from '../../../utils/resolveNutrientLevels';
import type { Product } from '../../../types/product';

describe('resolveNutrientLevels (legacy no-op)', () => {
  it('does not derive OFF-legacy levels from nutriments', () => {
    expect(
      deriveNutrientLevelsFromNutriments({ sugars_100g: 77, salt_100g: 0.5 }, undefined)
    ).toEqual({});
  });

  it('does not prefer API nutrient_levels', () => {
    expect(
      resolveNutrientLevels({ sugars_100g: 50, fat_100g: 25 }, { sugars: 'low', fat: 'high' }, undefined)
    ).toEqual({});
  });

  it('does not mutate product.nutrient_levels', () => {
    const product = {
      barcode: '1',
      nutriments: { sugars_100g: 50 },
      nutrient_levels: { sugars: 'high' as const },
    } as Product;
    applyResolvedNutrientLevels(product);
    expect(product.nutrient_levels).toEqual({ sugars: 'high' });
  });
});
