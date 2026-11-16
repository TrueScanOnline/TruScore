/**
 * List/surface Overall score for Search / Favourites — publication publishedScore only.
 * Fail closed: no publication snapshot, checking, or NR → null (never trust_score fallback).
 *
 * Administrative holds: list rows do not perform live hold verification, so they must not
 * show a cached assessment score unless the caller has verified hold state is "none".
 */

import type { Product, ProductWithTrustScore } from '../types/product';

/**
 * Returns Overall publishedScore only when publication is settled Rated AND
 * the caller confirms the product is not under an administrative hold.
 * Cached/legacy products lacking `_publication` → null (unrevealed).
 */
export function listPublishedOverallScore(
  product: Product | ProductWithTrustScore | null | undefined,
  options?: { holdVerifiedNotWithheld?: boolean }
): number | null {
  // Search / Favourites default: do not republish possibly disputed scores from local cache.
  if (!options?.holdVerifiedNotWithheld) return null;
  if (!product) return null;
  const pub = (product as ProductWithTrustScore)._publication?.overall;
  if (!pub) return null;
  if (pub.publicationStatus !== 'rated') return null;
  if (typeof pub.publishedScore !== 'number' || !Number.isFinite(pub.publishedScore)) {
    return null;
  }
  return pub.publishedScore;
}
