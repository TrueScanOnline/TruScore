import { highlightShareRows, nutritionShareRows, originShareRows } from '../../../components/shareCardRows';
import type { Product } from '../../../types/product';

function product(overrides: Partial<Product> = {}): Product {
  return {
    barcode: '9300617064879',
    product_name: 'Dairy Milk',
    nutriments: {
      'energy-kcal_100g': 534,
      fat_100g: 30,
      'saturated-fat_100g': 18,
      carbohydrates_100g: 57,
      sugars_100g: 56,
      proteins_100g: 7.3,
      sodium_100g: 0.08,
    },
    ...overrides,
  } as Product;
}

describe('share card marks', () => {
  it('puts the Body logo colour and glyph on a What we found line', () => {
    const rows = highlightShareRows([{ pillar: 'Body', text: 'High in sugar' }], false);
    expect(rows).toEqual([
      expect.objectContaining({ kind: 'pillar', glyph: 'apple', text: 'High in sugar', color: '#EC514F' }),
    ]);
  });

  it('puts Low, Mid, or High only on the nutrients that carry that label', () => {
    const rows = nutritionShareRows(product(), false);
    const sugars = rows.find((row) => row.kind === 'nutrient' && row.text.startsWith('Sugars'));
    const fat = rows.find((row) => row.kind === 'nutrient' && row.text.startsWith('Fat '));
    const sodium = rows.find((row) => row.kind === 'nutrient' && row.text.startsWith('Sodium'));
    expect(sugars).toEqual(expect.objectContaining({ level: 'High' }));
    expect(fat).toEqual({ kind: 'nutrient', text: 'Fat 30 g' });
    expect(sodium).toEqual(expect.objectContaining({ text: 'Sodium 80 mg' }));
    expect(sodium && sodium.kind === 'nutrient' ? sodium.level : undefined).toBeDefined();
  });

  it('keeps the country flag lockup for a product origins line', () => {
    const rows = originShareRows(
      product({
        rveelGovernedOrigins: [
          {
            evidenceId: 'e1',
            subjectKey: 'produced_in',
            claimType: 'produced_in',
            countries: ['New Zealand'],
            confidence: 'high',
          },
        ],
      } as Partial<Product>)
    );
    expect(rows).toEqual([
      expect.objectContaining({ kind: 'origin', statement: 'Product of', country: 'New Zealand' }),
    ]);
  });
});
