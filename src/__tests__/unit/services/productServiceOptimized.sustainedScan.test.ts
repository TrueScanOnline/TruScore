import { fetchProductFromOFF } from '../../../services/openFoodFacts';
import {
  lookupProductFast,
  saveProductToCache,
  mergeUserContributedData,
  enhanceProductWithComputedFields,
} from '../../../services/productCacheService';
import { fetchProductOptimized } from '../../../services/productServiceOptimized';
import {
  OFF_REVALIDATION_MS,
  withOffRevalidationTimestamp,
} from '../../../services/offRevalidationPolicy';
import {
  USER_CONTRIBUTED_FIRST_PAINT_RACE_MS,
  USER_CONTRIBUTED_MERGE_RACE_MS,
} from '../../../services/userContributedProductsService';
import { deriveScanTerminalState } from '../../../utils/deriveScanTerminalState';
import type { Product, ProductWithTrustScore } from '../../../types/product';

jest.mock('../../../services/openFoodFacts', () => ({
  fetchProductFromOFF: jest.fn(),
}));

jest.mock('../../../services/productCacheService', () => ({
  lookupProductFast: jest.fn(),
  lookupFromSQLite: jest.fn(),
  saveProductToCache: jest.fn().mockResolvedValue(undefined),
  mergeUserContributedData: jest.fn(),
  enhanceProductWithComputedFields: jest.fn((p: Product) => p),
}));

jest.mock('../../../utils/trustScore', () => ({
  calculateTrustScore: jest.fn(async (p: Product) => ({
    ...p,
    trust_score: 72,
    trust_score_breakdown: { body: 18, planet: 18, ethics: 18, open: 18 },
  })),
}));

jest.mock('../../../utils/confidenceScoring', () => ({
  applyConfidenceScore: jest.fn((p: Product) => p),
}));

jest.mock('../../../services/productEnhancementService', () => ({
  enhanceProduct: jest.fn(async (p: Product) => p),
}));

const mockedOff = fetchProductFromOFF as jest.MockedFunction<typeof fetchProductFromOFF>;
const mockedLookup = lookupProductFast as jest.MockedFunction<typeof lookupProductFast>;
const mockedMerge = mergeUserContributedData as jest.MockedFunction<typeof mergeUserContributedData>;
const mockedSave = saveProductToCache as jest.MockedFunction<typeof saveProductToCache>;

const BARCODE = '9300652815573';

function localProduct(cachedAt?: number): Product {
  const p: Product = {
    barcode: BARCODE,
    product_name: 'Cached Oats',
    source: 'openfoodfacts',
    nutriscore_grade: 'b',
  };
  return cachedAt !== undefined ? withOffRevalidationTimestamp(p, cachedAt) : p;
}

function offHit(name = 'Fresh OFF Oats'): Product {
  return {
    barcode: BARCODE,
    product_name: name,
    source: 'openfoodfacts',
    nutriscore_grade: 'a',
  };
}

describe('productServiceOptimized sustained-scan remediation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockedSave.mockResolvedValue(undefined);
    mockedMerge.mockImplementation(async (product) => product);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('fresh cache hit uses bounded first-paint merge (not 14.5s cap)', async () => {
    const now = Date.now();
    mockedLookup.mockResolvedValueOnce(localProduct(now - 60_000));

    let mergeResolve!: (p: Product) => void;
    mockedMerge.mockImplementation(
      () =>
        new Promise<Product>((resolve) => {
          mergeResolve = resolve;
        })
    );

    const fetchPromise = fetchProductOptimized(BARCODE, true, false, false);
    await jest.advanceTimersByTimeAsync(USER_CONTRIBUTED_FIRST_PAINT_RACE_MS + 20);
    const result = await fetchPromise;

    expect(result?.product_name).toBe('Cached Oats');
    expect(result?.trust_score).toBe(72);
    expect(mockedOff).not.toHaveBeenCalled();

    mergeResolve(localProduct(now));
    await Promise.resolve();
  });

  it('fresh cache hit timing stays near first-paint cap when merge is slow', async () => {
    mockedLookup.mockResolvedValueOnce(localProduct(Date.now() - 1000));
    mockedMerge.mockImplementation(
      () => new Promise(() => {
        /* never resolves within test */
      })
    );

    const start = Date.now();
    const promise = fetchProductOptimized(BARCODE, true, false, false);
    await jest.advanceTimersByTimeAsync(USER_CONTRIBUTED_FIRST_PAINT_RACE_MS + 50);
    await promise;
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(USER_CONTRIBUTED_MERGE_RACE_MS);
    expect(elapsed).toBeLessThanOrEqual(USER_CONTRIBUTED_FIRST_PAINT_RACE_MS + 100);
    expect(mockedOff).not.toHaveBeenCalled();
  });

  it('SQLite-sourced local hit behaves like cache hit (450ms path, no OFF when fresh)', async () => {
    mockedLookup.mockResolvedValueOnce(
      withOffRevalidationTimestamp(
        { ...localProduct(Date.now() - 1000), source: 'sqlite' },
        Date.now() - 1000
      )
    );

    const promise = fetchProductOptimized(BARCODE, true, false, false);
    await jest.advanceTimersByTimeAsync(USER_CONTRIBUTED_FIRST_PAINT_RACE_MS + 20);
    await promise;

    expect(mockedOff).not.toHaveBeenCalled();
    expect(enhanceProductWithComputedFields).toHaveBeenCalled();
  });

  it('aged local product (≥24h) returns immediately and triggers one background OFF refresh', async () => {
    const staleAt = Date.now() - OFF_REVALIDATION_MS - 1000;
    mockedLookup.mockResolvedValueOnce(localProduct(staleAt));

    let offResolve!: (value: { kind: 'hit'; product: Product }) => void;
    mockedOff.mockImplementation(
      () =>
        new Promise((resolve) => {
          offResolve = resolve;
        })
    );

    const phases: string[] = [];
    const promise = fetchProductOptimized(BARCODE, true, false, false, ({ phase }) => {
      phases.push(phase);
    });
    await jest.advanceTimersByTimeAsync(USER_CONTRIBUTED_FIRST_PAINT_RACE_MS + 20);
    const foreground = await promise;

    expect(foreground?.product_name).toBe('Cached Oats');
    expect(phases).toContain('product_ready');
    expect(mockedSave).not.toHaveBeenCalled();

    offResolve({ kind: 'hit', product: offHit('Revalidated Oats') });
    await jest.runAllTimersAsync();
    await Promise.resolve();
    await Promise.resolve();

    expect(mockedOff).toHaveBeenCalledTimes(1);
    expect(mockedSave).toHaveBeenCalled();
    const saved = mockedSave.mock.calls[0]?.[0] as ProductWithTrustScore & { _cachedAt?: number };
    const saveOptions = mockedSave.mock.calls[0]?.[3] as { offRevalidatedAt?: number } | undefined;
    expect(saved?.product_name).toBe('Revalidated Oats');
    expect(typeof saved?._cachedAt).toBe('number');
    expect(saved!._cachedAt!).toBeGreaterThan(staleAt);
    expect(saveOptions?.offRevalidatedAt).toBe(saved?._cachedAt);
  });

  it('cold cache miss performs foreground World OFF retrieval and stamps OFF freshness', async () => {
    mockedLookup.mockResolvedValueOnce(null);
    mockedOff.mockResolvedValueOnce({ kind: 'hit', product: offHit() });

    const promise = fetchProductOptimized(BARCODE, true, false, false);
    await jest.advanceTimersByTimeAsync(USER_CONTRIBUTED_FIRST_PAINT_RACE_MS + 20);
    const result = await promise;

    expect(mockedOff).toHaveBeenCalledTimes(1);
    expect(result?.product_name).toBe('Fresh OFF Oats');
    expect(mockedSave).toHaveBeenCalled();
    const initialSave = mockedSave.mock.calls.find(
      (call) => (call[3] as { offRevalidatedAt?: number } | undefined)?.offRevalidatedAt !== undefined
    );
    expect(initialSave).toBeDefined();
    const saved = initialSave?.[0] as ProductWithTrustScore & { _cachedAt?: number };
    expect(typeof saved?._cachedAt).toBe('number');
  });

  it('failed background OFF revalidation does not advance _cachedAt', async () => {
    const staleAt = Date.now() - OFF_REVALIDATION_MS - 1000;
    mockedLookup.mockResolvedValueOnce(localProduct(staleAt));
    mockedOff.mockResolvedValueOnce({ kind: 'retrieval_error', reason: 'retrieval_other' });

    const promise = fetchProductOptimized(BARCODE, true, false, false);
    await jest.advanceTimersByTimeAsync(USER_CONTRIBUTED_FIRST_PAINT_RACE_MS + 20);
    await promise;
    await jest.runAllTimersAsync();
    await Promise.resolve();

    expect(mockedOff).toHaveBeenCalledTimes(1);
    expect(mockedSave).not.toHaveBeenCalled();
  });

  it('background enhancement after cold OFF preserves OFF freshness timestamp', async () => {
    mockedLookup.mockResolvedValueOnce(null);
    mockedOff.mockResolvedValueOnce({ kind: 'hit', product: offHit() });

    const promise = fetchProductOptimized(BARCODE, true, false, false);
    await jest.advanceTimersByTimeAsync(USER_CONTRIBUTED_FIRST_PAINT_RACE_MS + 20);
    await promise;
    await jest.runAllTimersAsync();
    await Promise.resolve();
    await Promise.resolve();

    const offStampedSave = mockedSave.mock.calls.find(
      (call) => (call[3] as { offRevalidatedAt?: number } | undefined)?.offRevalidatedAt !== undefined
    );
    const enhancementSave = mockedSave.mock.calls.find(
      (call) => (call[3] as { offRevalidatedAt?: number } | undefined)?.offRevalidatedAt === undefined
    );

    expect(offStampedSave).toBeDefined();
    const offAt = (offStampedSave![0] as ProductWithTrustScore & { _cachedAt?: number })._cachedAt;
    if (enhancementSave) {
      const enhancedAt = (enhancementSave[0] as ProductWithTrustScore & { _cachedAt?: number })._cachedAt;
      expect(enhancedAt).toBe(offAt);
    }
  });

  it('product_refined after product_ready keeps terminal success state', async () => {
    const product: ProductWithTrustScore = {
      barcode: BARCODE,
      product_name: 'Cached Oats',
      source: 'openfoodfacts',
      trust_score: 72,
      trust_score_breakdown: { body: 18, planet: 18, ethics: 18, open: 18 },
    };

    expect(
      deriveScanTerminalState({
        loadError: null,
        product,
        isOffline: false,
        fetchPhase: 'product_ready',
        isFetchLoading: false,
      })
    ).toBe('partial');

    expect(
      deriveScanTerminalState({
        loadError: null,
        product,
        isOffline: false,
        fetchPhase: 'product_refined',
        isFetchLoading: false,
      })
    ).toBe('success');
  });

  it('emits product_refined from local hit when full merge completes later', async () => {
    mockedLookup.mockResolvedValueOnce(localProduct(Date.now() - 1000));

    let mergeResolve!: (p: Product) => void;
    mockedMerge.mockImplementation(
      () =>
        new Promise<Product>((resolve) => {
          mergeResolve = resolve;
        })
    );

    const phases: string[] = [];
    const promise = fetchProductOptimized(BARCODE, true, false, false, ({ phase }) => {
      phases.push(phase);
    });
    await jest.advanceTimersByTimeAsync(USER_CONTRIBUTED_FIRST_PAINT_RACE_MS + 20);
    await promise;
    expect(phases).toContain('product_ready');
    expect(phases).not.toContain('product_refined');

    mergeResolve({
      ...localProduct(Date.now() - 1000),
      product_name: 'Merged Community Name',
    });
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(phases).toContain('product_refined');
  });
});
