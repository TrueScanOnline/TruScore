/**
 * Wave 2 — mergeProducts demised: single product passthrough only; multi-source throws.
 */
import { mergeProducts } from '../../../services/productDataMerger';
import type { Product } from '../../../types/product';

describe('productDataMerger (Wave 2 demised)', () => {
  it('returns the sole product unchanged', () => {
    const p = { barcode: '1', product_name: 'A', source: 'openfoodfacts' } as Product;
    expect(mergeProducts([p])).toBe(p);
  });

  it('throws on multi-source merge attempts', () => {
    const a = { barcode: '1', product_name: 'A', source: 'openfoodfacts' } as Product;
    const b = { barcode: '1', product_name: 'B', source: 'fsanz_au' } as Product;
    expect(() => mergeProducts([a, b])).toThrow(/demised/i);
  });

  it('throws on empty array', () => {
    expect(() => mergeProducts([])).toThrow(/empty/i);
  });
});
