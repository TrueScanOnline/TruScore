/**
 * Wave 3 corrective: initial assessment settlement follows the user-contributed merge
 * lifecycle (success / failure / USER_CONTRIBUTED_MERGE_RACE_MS) — not the 450ms first-paint race.
 */
import { fetchProductFromOFF } from '../../../services/openFoodFacts';
import {
  lookupProductFast,
  saveProductToCache,
  mergeUserContributedData,
  enhanceProductWithComputedFields,
} from '../../../services/productCacheService';
import { fetchProductOptimized } from '../../../services/productServiceOptimized';
import {
  USER_CONTRIBUTED_FIRST_PAINT_RACE_MS,
  USER_CONTRIBUTED_MERGE_RACE_MS,
} from '../../../services/userContributedProductsService';
import type { Product } from '../../../types/product';
import { calculateTrustScore } from '../../../utils/trustScore';

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
  calculateTrustScore: jest.fn(async (p: Product, options?: { publicationSettled?: boolean }) => ({
    ...p,
    trust_score: 72,
    trust_score_breakdown: { body: 18, planet: 18, ethics: 18, open: 18 },
    _publication: {
      settled: options?.publicationSettled !== false,
      overall: {
        publicationStatus: options?.publicationSettled === false ? 'checking' : 'rated',
        publishedScore: options?.publicationSettled === false ? null : 72,
        internalScore: 72,
      },
    },
  })),
}));

jest.mock('../../../utils/confidenceScoring', () => ({
  applyConfidenceScore: jest.fn((p: Product) => p),
}));

jest.mock('../../../services/productEnhancementService', () => ({
  enhanceProduct: jest.fn(async (p: Product) => p),
  applyGovernedProductTransforms: jest.fn((p: Product, options?: { stampAuthority?: boolean }) => {
    if (options?.stampAuthority) {
      (p as Product & { _rveelCoreTruthAuthority?: string })._rveelCoreTruthAuthority =
        'rveel-core-truth-v1';
    }
    return p;
  }),
}));

const mockedOff = fetchProductFromOFF as jest.MockedFunction<typeof fetchProductFromOFF>;
const mockedLookup = lookupProductFast as jest.MockedFunction<typeof lookupProductFast>;
const mockedMerge = mergeUserContributedData as jest.MockedFunction<typeof mergeUserContributedData>;
const mockedScore = calculateTrustScore as jest.MockedFunction<typeof calculateTrustScore>;

const BARCODE = '9300652815579';

function offHit(): Product {
  return {
    barcode: BARCODE,
    product_name: 'Settlement Oats',
    source: 'openfoodfacts',
    nutriscore_grade: 'a',
  };
}

describe('assessment-cycle settlement barrier (Wave 3 corrective)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockedLookup.mockResolvedValue(null);
    mockedOff.mockResolvedValue({ kind: 'hit', product: offHit() } as never);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('delayed merge beyond 450ms keeps first paint unsettled then settles once on merge', async () => {
    let mergeResolve!: (p: Product) => void;
    mockedMerge.mockImplementation(
      () =>
        new Promise<Product>((resolve) => {
          mergeResolve = resolve;
        })
    );

    const phases: Array<{ phase: string; settled?: boolean }> = [];
    const fetchPromise = fetchProductOptimized(BARCODE, true, false, false, (progress) => {
      phases.push({
        phase: progress.phase,
        settled: progress.product?._assessmentCycleSettled,
      });
    });

    // First-paint race fires — product chrome may paint; assessment remains unsettled.
    await jest.advanceTimersByTimeAsync(USER_CONTRIBUTED_FIRST_PAINT_RACE_MS + 20);
    await Promise.resolve();
    await Promise.resolve();

    const early = phases.find((p) => p.phase === 'product_ready');
    expect(early).toBeDefined();
    expect(early!.settled).toBe(false);
    expect(
      mockedScore.mock.calls.some((c) => c[1]?.publicationSettled === false)
    ).toBe(true);

    // Merge completes well after the former 450ms race — settlement fires once.
    const enriched = { ...offHit(), ingredients_text: 'oats from user contrib' };
    mergeResolve(enriched);
    await Promise.resolve();
    await Promise.resolve();
    await jest.advanceTimersByTimeAsync(0);

    const refined = phases.find((p) => p.phase === 'product_refined');
    expect(refined).toBeDefined();
    expect(refined!.settled).toBe(true);
    expect(
      mockedScore.mock.calls.some((c) => c[1]?.publicationSettled === true)
    ).toBe(true);

    // Advance remaining merge race — must not settle a second time / unsettle.
    await jest.advanceTimersByTimeAsync(USER_CONTRIBUTED_MERGE_RACE_MS);
    const refinedCount = phases.filter((p) => p.phase === 'product_refined').length;
    expect(refinedCount).toBe(1);

    await fetchPromise;
  });

  it('MERGE_RACE expiry is a terminal settle — late merge cannot mutate publication', async () => {
    let mergeResolve!: (p: Product) => void;
    mockedMerge.mockImplementation(
      () =>
        new Promise<Product>((resolve) => {
          mergeResolve = resolve;
        })
    );

    const phases: Array<{ phase: string; settled?: boolean; reason?: string }> = [];
    const fetchPromise = fetchProductOptimized(BARCODE, true, false, false, (progress) => {
      phases.push({
        phase: progress.phase,
        settled: progress.product?._assessmentCycleSettled,
        reason: progress.product?._assessmentCycleSettleReason,
      });
    });

    await jest.advanceTimersByTimeAsync(USER_CONTRIBUTED_FIRST_PAINT_RACE_MS + 20);
    await Promise.resolve();
    await Promise.resolve();

    // Terminal merge-cycle ceiling (not first-paint): settle once as merge_timeout.
    await jest.advanceTimersByTimeAsync(USER_CONTRIBUTED_MERGE_RACE_MS);
    await Promise.resolve();
    await Promise.resolve();

    const refinedBeforeLate = phases.filter((p) => p.phase === 'product_refined');
    expect(refinedBeforeLate.length).toBe(1);
    expect(refinedBeforeLate[0].settled).toBe(true);
    expect(refinedBeforeLate[0].reason).toBe('merge_timeout');

    // Late same-cycle merge completion must not publish a second snapshot.
    mergeResolve({ ...offHit(), ingredients_text: 'late oats' });
    await Promise.resolve();
    await Promise.resolve();
    await jest.advanceTimersByTimeAsync(0);

    expect(phases.filter((p) => p.phase === 'product_refined').length).toBe(1);
    await fetchPromise;
  });
});
