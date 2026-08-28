import { deriveScanTerminalState } from '../../../utils/deriveScanTerminalState';
import type { ProductWithTrustScore } from '../../../types/product';

const minimalProduct = (over: Partial<ProductWithTrustScore> = {}): ProductWithTrustScore =>
  ({
    barcode: '123',
    product_name: 'Real Product Name Here',
    brands: 'Unilever',
    source: 'openfoodfacts',
    trust_score: 50,
    trust_score_breakdown: { body: 12, planet: 12, ethics: 13, open: 13, reasons: [] },
    ...over,
  }) as ProductWithTrustScore;

describe('deriveScanTerminalState', () => {
  it('returns error when load error and no product', () => {
    expect(
      deriveScanTerminalState({
        loadError: 'x',
        product: null,
        isOffline: false,
        fetchPhase: 'complete',
        isFetchLoading: false,
      })
    ).toBe('error');
  });

  it('returns offline when load error and offline and no product', () => {
    expect(
      deriveScanTerminalState({
        loadError: 'x',
        product: null,
        isOffline: true,
        fetchPhase: 'complete',
        isFetchLoading: false,
      })
    ).toBe('offline');
  });

  it('returns partial while fetch loading', () => {
    expect(
      deriveScanTerminalState({
        loadError: null,
        product: minimalProduct(),
        isOffline: false,
        fetchPhase: 'product_ready',
        isFetchLoading: true,
      })
    ).toBe('partial');
  });

  it('returns partial when phase not terminal', () => {
    expect(
      deriveScanTerminalState({
        loadError: null,
        product: minimalProduct(),
        isOffline: false,
        fetchPhase: 'product_ready',
        isFetchLoading: false,
      })
    ).toBe('partial');
  });

  it('returns success when complete and scored', () => {
    expect(
      deriveScanTerminalState({
        loadError: null,
        product: minimalProduct(),
        isOffline: false,
        fetchPhase: 'complete',
        isFetchLoading: false,
      })
    ).toBe('success');
  });

  it('returns success for product_enhanced', () => {
    expect(
      deriveScanTerminalState({
        loadError: null,
        product: minimalProduct(),
        isOffline: false,
        fetchPhase: 'product_enhanced',
        isFetchLoading: false,
      })
    ).toBe('success');
  });

  it('returns success when scored product_refined arrives after completion', () => {
    expect(
      deriveScanTerminalState({
        loadError: null,
        product: minimalProduct({ trust_score: 72 }),
        isOffline: false,
        fetchPhase: 'product_refined',
        isFetchLoading: false,
      })
    ).toBe('success');
  });

  it('returns partial when product_refined is genuinely unscored', () => {
    expect(
      deriveScanTerminalState({
        loadError: null,
        product: minimalProduct({ trust_score: null, trust_score_breakdown: null }),
        isOffline: false,
        fetchPhase: 'product_refined',
        isFetchLoading: false,
      })
    ).toBe('partial');
  });

  it('returns partial when identity present but trust_score null on complete', () => {
    expect(
      deriveScanTerminalState({
        loadError: null,
        product: minimalProduct({ trust_score: null, trust_score_breakdown: null }),
        isOffline: false,
        fetchPhase: 'complete',
        isFetchLoading: false,
      })
    ).toBe('partial');
  });
});
