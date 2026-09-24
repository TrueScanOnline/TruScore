/**
 * List/surface Overall score for Search / Favourites — publication publishedScore only.
 * Fail closed: no publication snapshot, checking, or NR → null (never trust_score fallback).
 */

import type { Product, ProductWithTrustScore } from '../types/product';

/**
 * Returns Overall publishedScore only when publication is settled Rated.
 * Cached/legacy products lacking `_publication` → null (unrevealed).
 */
export function listPublishedOverallScore(
  product: Product | ProductWithTrustScore | null | undefined
): number | null {
  if (!product) return null;
  const pub = (product as ProductWithTrustScore)._publication?.overall;
  if (!pub) return null;
  if (pub.publicationStatus !== 'rated') return null;
  if (typeof pub.publishedScore !== 'number' || !Number.isFinite(pub.publishedScore)) {
    return null;
  }
  return pub.publishedScore;
}
