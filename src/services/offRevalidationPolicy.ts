/**
 * World OFF background revalidation policy for locally cached products.
 * 24-hour threshold — refresh interval only, not cache expiry.
 */

import type { Product } from '../types/product';

/** Founder UAT: revalidate local OFF products against World OFF after 24 hours. */
export const OFF_REVALIDATION_MS = 24 * 60 * 60 * 1000;

export type ProductWithOffRevalidation = Product & { _cachedAt?: number };

export function getOffRevalidationTimestamp(product: Product): number | undefined {
  const ts = (product as ProductWithOffRevalidation)._cachedAt;
  return typeof ts === 'number' && Number.isFinite(ts) ? ts : undefined;
}

/**
 * True when a local OFF-backed product should receive a background World OFF refresh.
 * Unknown age (legacy rows) is treated as stale so the gate becomes functional once stamped.
 */
export function needsOffBackgroundRevalidation(product: Product, now = Date.now()): boolean {
  const ts = getOffRevalidationTimestamp(product);
  if (ts === undefined) return true;
  return now - ts >= OFF_REVALIDATION_MS;
}

/** Stamp or refresh the OFF revalidation age on a product prior to persistence. */
export function withOffRevalidationTimestamp(product: Product, timestamp = Date.now()): Product {
  return { ...product, _cachedAt: timestamp };
}
