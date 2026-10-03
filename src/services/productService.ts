/**
 * Main product service — Wave 2 Core Truth Pipeline
 *
 * Production Result error-fallback / refresh / favourites / search all go through
 * fetchProductOptimized (cache → World OFF → process/score). Multi-provider
 * mergeProducts / FSANZ / FoodAtlas / OBF fan-out is intentionally not reintroduced here.
 */

import { SNAPSHOT_FETCH_TIMEOUT_MS } from '../evidenceAuthority/assessment';
import { ProductWithTrustScore } from '../types/product';
import { fetchProductOptimized } from './productServiceOptimized';
import { USER_CONTRIBUTED_MERGE_RACE_MS } from './userContributedProductsService';

/**
 * Progress callback type for progressive product display
 */
export type ProductProgressCallback = (progress: {
  phase: string;
  product?: ProductWithTrustScore;
}) => void;

/**
 * Fetch product data via the Wave 2 Core Truth path (OFF-only after cache).
 *
 * @param barcode - Product barcode (8-14 digits, will be normalized)
 * @param useCache - Whether to use cache (default: true)
 * @param isPremium - Whether user has premium subscription (affects cache size)
 * @param isOffline - Whether device is offline (affects query strategy)
 * @param onProgress - Optional progressive display callback
 * @returns Product with TruScore, or null if not found
 */
export async function fetchProduct(
  barcode: string,
  useCache = true,
  isPremium = false,
  isOffline = false,
  onProgress?: ProductProgressCallback
): Promise<ProductWithTrustScore | null> {
  return fetchProductOptimized(barcode, useCache, isPremium, isOffline, onProgress);
}

/** Ceiling for the settled assessment cycle after first paint has already returned. */
export const SETTLED_REFRESH_WAIT_MS = USER_CONTRIBUTED_MERGE_RACE_MS + SNAPSHOT_FETCH_TIMEOUT_MS + 1000;

/**
 * Wait for the existing assessment cycle's settled product.
 * A first-paint checking product is not a refresh result.
 */
export async function awaitSettledRefresh(
  load: (onProgress: ProductProgressCallback) => Promise<ProductWithTrustScore | null>
): Promise<ProductWithTrustScore | null> {
  let settled: ProductWithTrustScore | null = null;
  let resolveSettled: (product: ProductWithTrustScore) => void = () => undefined;
  const settledPromise = new Promise<ProductWithTrustScore>((resolve) => {
    resolveSettled = resolve;
  });
  const returned = await load((progress) => {
    if (progress.product?._assessmentCycleSettled === true) {
      settled = progress.product;
      resolveSettled(progress.product);
    }
  });
  if (!returned) return null;
  if (returned._assessmentCycleSettled === true) return returned;
  if (settled) return settled;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const ceiling = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), SETTLED_REFRESH_WAIT_MS);
  });
  const winner = await Promise.race([settledPromise, ceiling]);
  if (timer) clearTimeout(timer);
  return winner;
}

/**
 * Force a fresh query bypassing AsyncStorage cache (SQLite may still hit).
 * Returns only the settled assessment cycle, never the transient checking paint.
 */
export async function refreshProduct(barcode: string): Promise<ProductWithTrustScore | null> {
  return awaitSettledRefresh((onProgress) => fetchProduct(barcode, false, false, false, onProgress));
}
