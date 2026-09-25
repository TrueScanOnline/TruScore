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
import { CORE_TRUTH_PRODUCT_CACHE_AUTHORITY } from '../../../config/coreTruthProductCacheAuthority';
import { logScanObs } from '../../../services/scanObservability';

jest.mock('../../../services/openFoodFacts', () => ({
  fetchProductFromOFF: jest.fn(),
}));

jest.mock('../../../services/scanObservability', () => ({
  logScanObs: jest.fn(),
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
  applyGovernedProductTransforms: jest.fn((p: Product, options?: { stampAuthority?: boolean }) => {
    if (options?.stampAuthority) {
      p._rveelCoreTruthAuthority = 'rveel-core-truth-v1';
    }
    return p;
  }),
}));

const mockedOff = fetchProductFromOFF as jest.MockedFunction<typeof fetchProductFromOFF>;
const mockedLookup = lookupProductFast as jest.MockedFunction<typeof lookupProductFast>;
const mockedMerge = mergeUserContributedData as jest.MockedFunction<typeof mergeUserContributedData>;
const mockedSave = saveProductToCache as jest.MockedFunction<typeof saveProductToCache>;
const mockedLogScanObs = logScanObs as jest.MockedFunction<typeof logScanObs>;

const BARCODE = '9300652815573';

function localProduct(cachedAt?: number): Product {
  const p: Product = {
    barcode: BARCODE,
    product_name: 'Cached Oats',
    source: 'openfoodfacts',
    nutriscore_grade: 'b',
    _rveelCoreTruthAuthority: CORE_TRUTH_PRODUCT_CACHE_AUTHORITY,
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
        {
          ...localProduct(Date.now() - 1000),
          source: 'sqlite',
          _rveelCoreTruthAuthority: CORE_TRUTH_PRODUCT_CACHE_AUTHORITY,
        },
        Date.now() - 1000
      )
    );

    const promise = fetchProductOptimized(BARCODE, true, false, false);
    await jest.advanceTimersByTimeAsync(USER_CONTRIBUTED_FIRST_PAINT_RACE_MS + 20);
    await promise;

    expect(mockedOff).not.toHaveBeenCalled();
    expect(enhanceProductWithComputedFields).toHaveBeenCalled();
  });

  it('legacy local hit without Core Truth authority requires World OFF before scoring', async () => {
    mockedLookup.mockResolvedValueOnce({
      barcode: BARCODE,
      product_name: 'Legacy Cache',
      source: 'openfoodfacts',
      // no _rveelCoreTruthAuthority
    });
    mockedOff.mockResolvedValueOnce({ kind: 'hit', product: offHit('Revalidated') });

    const promise = fetchProductOptimized(BARCODE, true, false, false);
    await jest.advanceTimersByTimeAsync(USER_CONTRIBUTED_MERGE_RACE_MS + 50);
    const result = await promise;

    expect(mockedOff).toHaveBeenCalled();
    expect(result?.product_name).toBe('Revalidated');
    expect(result?._rveelCoreTruthAuthority).toBe(CORE_TRUTH_PRODUCT_CACHE_AUTHORITY);
    expect(mockedSave).toHaveBeenCalled();
  });

  it('legacy local hit without authority and OFF miss releases no product object (NA-003 Candidate 2)', async () => {
    mockedLookup.mockResolvedValueOnce({
      barcode: BARCODE,
      product_name: 'Legacy Only',
      source: 'web_search',
    });
    mockedOff.mockResolvedValueOnce({ kind: 'not_found' });

    const phases: string[] = [];
    const result = await fetchProductOptimized(BARCODE, true, false, false, ({ phase }) => {
      phases.push(phase);
    });

    expect(result).toBeNull();
    expect(phases).toContain('not_found');
    expect(phases).not.toContain('retrieval_error');
    expect(mockedSave).not.toHaveBeenCalled();
    expect(mockedLogScanObs).not.toHaveBeenCalledWith(
      expect.objectContaining({ event: 'retrieval_error' })
    );
  });

  it('legacy unstamped local + OFF retrieval_error preserves retrieval_error (Candidate 3)', async () => {
    mockedLookup.mockResolvedValueOnce({
      barcode: BARCODE,
      product_name: 'Legacy Only',
      source: 'openfoodfacts',
    });
    mockedOff.mockResolvedValueOnce({ kind: 'retrieval_error', reason: 'retrieval_other' });

    const phases: string[] = [];
    const result = await fetchProductOptimized(BARCODE, true, false, false, ({ phase }) => {
      phases.push(phase);
    });

    expect(result).toBeNull();
    expect(phases).toContain('retrieval_error');
    expect(phases).not.toContain('not_found');
    expect(mockedSave).not.toHaveBeenCalled();
    expect(mockedLogScanObs).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'retrieval_error',
        barcode: BARCODE,
        retrieval_reason: 'retrieval_other',
        phase: 'retrieval_error',
      })
    );
  });

  it('false provenance source=openfoodfacts without marker does not stamp via local display path', async () => {
    // Authoritative local path is skipped when marker absent — OFF required.
    // When OFF hits, stamp comes from processProductFast (stampAuthority: true), not source label.
    mockedLookup.mockResolvedValueOnce({
      barcode: BARCODE,
      product_name: 'Legacy OFF-labelled',
      source: 'openfoodfacts',
    });
    mockedOff.mockResolvedValueOnce({ kind: 'hit', product: offHit('Canonical') });

    const promise = fetchProductOptimized(BARCODE, true, false, false);
    await jest.advanceTimersByTimeAsync(USER_CONTRIBUTED_MERGE_RACE_MS + 50);
    const result = await promise;

    expect(result?._rveelCoreTruthAuthority).toBe(CORE_TRUTH_PRODUCT_CACHE_AUTHORITY);
    expect(result?.product_name).toBe('Canonical');
  });

  it('cold OFF hit receives Core Truth stamp and scores (stampAuthority from OFF retrieval)', async () => {
    mockedLookup.mockResolvedValueOnce(null);
    mockedOff.mockResolvedValueOnce({ kind: 'hit', product: offHit() });

    const promise = fetchProductOptimized(BARCODE, true, false, false);
    await jest.advanceTimersByTimeAsync(USER_CONTRIBUTED_FIRST_PAINT_RACE_MS + 20);
    const result = await promise;

    expect(result?._rveelCoreTruthAuthority).toBe(CORE_TRUTH_PRODUCT_CACHE_AUTHORITY);
    expect(result?.trust_score).toBe(72);
    expect(mockedSave).toHaveBeenCalled();
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

  it('cold OFF path writes stamped cache once without post-score enhancement save (NA-004/017)', async () => {
    mockedLookup.mockResolvedValueOnce(null);
    mockedOff.mockResolvedValueOnce({ kind: 'hit', product: offHit() });

    const promise = fetchProductOptimized(BARCODE, true, false, false);
    await jest.advanceTimersByTimeAsync(USER_CONTRIBUTED_FIRST_PAINT_RACE_MS + 20);
    await promise;
    await jest.runAllTimersAsync();
    await Promise.resolve();
    await Promise.resolve();

    const offStampedSaves = mockedSave.mock.calls.filter(
      (call) => (call[3] as { offRevalidatedAt?: number } | undefined)?.offRevalidatedAt !== undefined
    );
    const enhancementSaves = mockedSave.mock.calls.filter(
      (call) => (call[3] as { offRevalidatedAt?: number } | undefined)?.offRevalidatedAt === undefined
    );

    expect(offStampedSaves.length).toBeGreaterThanOrEqual(1);
    expect(enhancementSaves).toHaveLength(0);
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
    // Full-merge refine awaits scoreWithGovernedTransforms → calculateTrustScore
    for (let i = 0; i < 10; i++) {
      await Promise.resolve();
    }

    expect(phases).toContain('product_refined');
  });

  describe('offline vs authoritative not_found (W3-S36 vs W3-S35)', () => {
    it('offline/unreachable + no local hit → retrieval_error (W3-S36), never not_found', async () => {
      mockedLookup.mockResolvedValueOnce(null);

      const phases: string[] = [];
      const result = await fetchProductOptimized(BARCODE, true, false, true, ({ phase }) => {
        phases.push(phase);
      });

      expect(result).toBeNull();
      expect(mockedOff).not.toHaveBeenCalled();
      expect(phases).toEqual(['retrieval_error']);
      expect(phases).not.toContain('not_found');
      expect(mockedLogScanObs).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'retrieval_error',
          barcode: BARCODE,
          phase: 'retrieval_error',
          retrieval_reason: 'network_timeout_exhausted',
        })
      );
    });

    it('online + authoritative OFF miss → not_found (W3-S35)', async () => {
      mockedLookup.mockResolvedValueOnce(null);
      mockedOff.mockResolvedValueOnce({ kind: 'not_found' });

      const phases: string[] = [];
      const result = await fetchProductOptimized(BARCODE, true, false, false, ({ phase }) => {
        phases.push(phase);
      });

      expect(result).toBeNull();
      expect(mockedOff).toHaveBeenCalled();
      expect(phases).toContain('not_found');
      expect(phases).not.toContain('retrieval_error');
    });

    it('online + OFF hit → product returned', async () => {
      mockedLookup.mockResolvedValueOnce(null);
      mockedOff.mockResolvedValueOnce({ kind: 'hit', product: offHit('Live Mayonnaise') });

      const promise = fetchProductOptimized(BARCODE, true, false, false);
      await jest.advanceTimersByTimeAsync(USER_CONTRIBUTED_MERGE_RACE_MS + 50);
      const result = await promise;

      expect(result?.product_name).toBe('Live Mayonnaise');
      expect(result?._rveelCoreTruthAuthority).toBe(CORE_TRUTH_PRODUCT_CACHE_AUTHORITY);
      expect(mockedOff).toHaveBeenCalled();
    });

    /**
     * ResultScreen miss handling (production mirror): product is not cleared on miss.
     * - not_found sets a truthy error → Unknown Product (S35) even if product was already set.
     * - retrieval_error sets error=null → existing successful product remains visible.
     * After offline→retrieval_error, a later NetInfo offline rerun therefore does not
     * overwrite a successful product into S35. There is still no load-generation cancel;
     * see companion assertion below.
     */
    it('Result miss semantics: offline retrieval_error does not overwrite an already successful product UI', () => {
      const successful = {
        barcode: BARCODE,
        product_name: 'Live Mayonnaise',
        trust_score: 40,
      };

      // Mirrors app/result/[barcode].tsx miss branch (productData falsy).
      function applyResultMiss(
        existingProduct: typeof successful | null,
        lastFetchPhase: string
      ): { product: typeof successful | null; error: string | null; showsUnknownProductPage: boolean } {
        if (lastFetchPhase === 'retrieval_error') {
          const error = null;
          const product = existingProduct; // production does not setProduct(null)
          return {
            product,
            error,
            showsUnknownProductPage: !!(error || !product),
          };
        }
        const error =
          'Product not found in our databases. You can help by adding this product manually.';
        const product = existingProduct;
        return {
          product,
          error,
          showsUnknownProductPage: !!(error || !product),
        };
      }

      const afterOfflineRerun = applyResultMiss(successful, 'retrieval_error');
      expect(afterOfflineRerun.product?.product_name).toBe('Live Mayonnaise');
      expect(afterOfflineRerun.error).toBeNull();
      expect(afterOfflineRerun.showsUnknownProductPage).toBe(false);

      // Contrast: legacy offline→not_found would have flipped the consumer to S35.
      const legacyNotFoundOverwrite = applyResultMiss(successful, 'not_found');
      expect(legacyNotFoundOverwrite.showsUnknownProductPage).toBe(true);
    });

    it('fetchProductOptimized does not share in-flight queries across online vs offline keys', async () => {
      // Demonstrates absence of cross-isOffline request coalescing (different queryKey).
      // Broadening Result load-generation cancel is out of scope for this correction.
      mockedLookup.mockResolvedValue(null);
      mockedOff.mockResolvedValue({ kind: 'hit', product: offHit() });

      const online = fetchProductOptimized(BARCODE, true, false, false);
      const offline = fetchProductOptimized(BARCODE, true, false, true);
      await jest.advanceTimersByTimeAsync(USER_CONTRIBUTED_MERGE_RACE_MS + 50);
      const [onlineResult, offlineResult] = await Promise.all([online, offline]);

      expect(onlineResult?.product_name).toBeDefined();
      expect(offlineResult).toBeNull();
      // Offline path must not have blocked or replaced the online OFF attempt.
      expect(mockedOff).toHaveBeenCalled();
    });
  });
});
