import {
  OFF_REVALIDATION_MS,
  getOffRevalidationTimestamp,
  needsOffBackgroundRevalidation,
  withOffRevalidationTimestamp,
} from '../../../services/offRevalidationPolicy';
import type { Product } from '../../../types/product';

const baseProduct = (): Product => ({
  barcode: '9300652815573',
  product_name: 'Test Product',
  source: 'openfoodfacts',
});

describe('offRevalidationPolicy', () => {
  const now = 1_700_000_000_000;

  it('returns undefined when _cachedAt is absent', () => {
    expect(getOffRevalidationTimestamp(baseProduct())).toBeUndefined();
  });

  it('needs revalidation when timestamp is unknown (legacy)', () => {
    expect(needsOffBackgroundRevalidation(baseProduct(), now)).toBe(true);
  });

  it('does not need revalidation when product is fresh (<24h)', () => {
    const fresh = withOffRevalidationTimestamp(baseProduct(), now - OFF_REVALIDATION_MS + 1000);
    expect(needsOffBackgroundRevalidation(fresh, now)).toBe(false);
  });

  it('needs revalidation when product is aged (≥24h)', () => {
    const stale = withOffRevalidationTimestamp(baseProduct(), now - OFF_REVALIDATION_MS);
    expect(needsOffBackgroundRevalidation(stale, now)).toBe(true);
  });

  it('stamps _cachedAt on withOffRevalidationTimestamp', () => {
    const stamped = withOffRevalidationTimestamp(baseProduct(), now);
    expect(getOffRevalidationTimestamp(stamped)).toBe(now);
  });
});
