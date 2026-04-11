import type { Product } from '../../../types/product';
import { getOffCarbonFootprintRows } from '../../../utils/carbonOffDisplay';

describe('getOffCarbonFootprintRows', () => {
  it('omits OFF debug fields and raw formula strings', () => {
    const product = {
      barcode: '123',
      nutriments: {
        'carbon-footprint-from-known-ingredients_100g': 51,
        'carbon-footprint-from-known-ingredients-debug': 'en:wheat-bran 85% x 0.6',
      },
      carbon_footprint_from_known_ingredients_debug:
        'Carbon Footprint From Known Ingredients Debug: en:wheat-bran 85% x 0.6 = 51 g -',
      carbon_footprint_percent_of_known_ingredients: 85,
    } as Product;

    const rows = getOffCarbonFootprintRows(product, { includeHints: false });
    const keys = rows.map((r) => r.labelKey);

    expect(keys).toContain('result.carbonOffIngredients100g');
    expect(keys).toContain('result.carbonOffKnownIngredientsPercent');
    expect(keys.filter((k) => k === 'result.carbonOffNutrimentField')).toHaveLength(0);
  });

  it('maps percent of known ingredients to the dedicated label row', () => {
    const product = {
      barcode: '456',
      'carbon-footprint-percent-of-known-ingredients': 72,
    } as unknown as Product;

    const rows = getOffCarbonFootprintRows(product, { includeHints: false });
    const pctRow = rows.find((r) => r.labelKey === 'result.carbonOffKnownIngredientsPercent');
    expect(pctRow?.labelParams).toEqual({ percent: 72 });
  });
});
