/**
 * Main product service — Wave 2 Core Truth Pipeline
 *
 * Production Result error-fallback / refresh / favourites / search all go through
 * fetchProductOptimized (cache → World OFF → process/score). Multi-provider
 * mergeProducts / FSANZ / FoodAtlas / OBF fan-out is intentionally not reintroduced here.
 */

import { ProductWithTrustScore } from '../types/product';
import { fetchProductOptimized } from './productServiceOptimized';

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

/**
 * Force a fresh query bypassing AsyncStorage cache (SQLite may still hit).
 * Delegates to the same OFF-only path as fetchProduct.
 */
export async function refreshProduct(barcode: string): Promise<ProductWithTrustScore | null> {
  return fetchProduct(barcode, false);
}
