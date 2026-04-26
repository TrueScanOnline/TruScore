import { resolveSharedIdentityContext } from '../../../identity/resolveSharedIdentityContext';
import type { Product } from '../../../types/product';

function baseProduct(overrides: Partial<Product> = {}): Product {
  return {
    barcode: '9300633072391',
    brand_owner: 'Acme Foods Pty Ltd',
    brands: 'Acme',
    source: 'openfoodfacts',
    ...overrides,
  };
}

describe('resolveSharedIdentityContext (Slice 1)', () => {
  it('does_not_expose_AU_NZ_as_public_market', () => {
    const out = resolveSharedIdentityContext({
      gtin: '9300633072391',
      marketHint: 'AU+NZ',
      product: baseProduct(),
    });

    expect(out.context.resolution_key.market_key).toBe('AU+NZ');
    expect(out.public_market).toBe('UNKNOWN');
  });

  it('emits ambiguity flags for multiple brand candidates', () => {
    const out = resolveSharedIdentityContext({
      gtin: '9300633072391',
      product: baseProduct({
        brand_owner: 'Owner Co',
        brands: 'Brand One, Brand Two',
      }),
    });

    expect(out.context.quality.ambiguity_flags).toContain('multiple_brand_candidates');
    expect(out.context.quality.resolution_status).toBe('ambiguous');
  });
});

