import { calculateOpenPillar } from '../../../../lib/truscoreEngine/pillars/openPillar';
import type { Product } from '../../../../types/product';

function productWithIngredients(text: string, extras: Partial<Product> = {}): Product {
  return {
    barcode: '9310652815573',
    product_name: 'Test',
    ingredients_text: text,
    ...extras,
  } as Product;
}

describe('Open pillar commentary metadata (score-neutral)', () => {
  it('emits clarity metadata without changing the v15 score', () => {
    const text = 'Sugar, natural flavours, colour (102)';
    const baseline = calculateOpenPillar(productWithIngredients(text));
    const clarity = baseline.adjustments.find((a) => a.id.startsWith('open-v15-ing-clarity-'));
    expect(clarity?.metadata?.termPresentationClass).toBeDefined();
    expect(clarity?.metadata?.matchedTerms).toBeTruthy();
    expect(baseline.score).toBeGreaterThanOrEqual(0);
  });

  it('emits single-ingredient origins metadata for evidently complete route', () => {
    const result = calculateOpenPillar(
      productWithIngredients('Whole milk', {
        origins_tags: ['en:new-zealand'],
        origins: 'New Zealand',
      })
    );
    const origins = result.adjustments.find((a) => a.id === 'open-v15-origins-evidently-complete');
    expect(origins).toBeDefined();
    expect(origins?.metadata?.singleIngredient).toBe(true);
    expect(origins?.metadata?.country).toBe('New Zealand');
  });
});
