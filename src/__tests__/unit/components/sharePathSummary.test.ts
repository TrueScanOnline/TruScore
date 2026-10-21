import { sharePathSummary } from '../../../components/sharePathSummary';
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
    },
    ingredients_text: 'Sugar, cocoa butter, milk',
    nova_group: 4,
    ...overrides,
  } as Product;
}

describe('share path summary', () => {
  it('shows the nutrition card values for a nutrition share', () => {
    const text = sharePathSummary({
      shareType: 'nutrition',
      product: product(),
      scoreCaption: 'Rveel Score',
      scoreValue: '23/100',
      pillars: null,
    });
    expect(text).toContain('Per 100 g');
    expect(text).toContain('Energy 534 kcal');
    expect(text).toContain('Sugars 56 g · High');
    expect(text).toContain('Saturated fat 18 g · High');
    expect(text).not.toContain('23/100');
  });

  it('shows the ingredients list for an ingredients share', () => {
    const text = sharePathSummary({
      shareType: 'ingredients',
      product: product(),
      scoreCaption: 'Rveel Score',
      scoreValue: '23/100',
      pillars: null,
    });
    expect(text).toBe('Sugar, cocoa butter, milk');
  });

  it('shows the score card lines for a score share', () => {
    const text = sharePathSummary({
      shareType: 'truScore',
      product: product(),
      scoreCaption: 'Rveel Score',
      scoreValue: '23/100',
      pillars: [{ label: 'Body', value: '2/25' }],
    });
    expect(text).toContain('Rveel Score 23/100');
    expect(text).toContain('Body 2/25');
  });

  it('shows the lines on the What we found card, in that order', () => {
    const text = sharePathSummary({
      shareType: 'highlights',
      product: product(),
      scoreCaption: 'Rveel Score',
      scoreValue: '23/100',
      pillars: [{ label: 'Body', value: '2/25' }],
      highlightLines: ['Fairtrade certified', 'High in sugar'],
    });
    expect(text).toBe('Fairtrade certified\nHigh in sugar');
  });
});
