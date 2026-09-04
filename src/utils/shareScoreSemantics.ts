/**
 * Share-path score resolution without coercing null/unavailable → 0.
 * Null overall TruScore must not become score-bearing share content.
 */

import type { TruScoreResult } from '../lib/truscoreEngine';
import type { ProductWithTrustScore } from '../types/product';

export type GenuinePillarBreakdown = {
  Body: number;
  Planet: number;
  Ethics: number;
  Open: number;
};

function isGenuineNumber(v: unknown): v is number {
  return typeof v === 'number' && !Number.isNaN(v);
}

/**
 * Prefer TruScoreResult when present (including explicit null).
 * Only fall back to product.trust_score when no TruScoreResult was supplied.
 */
export function resolveShareOverallScore(
  truScore: TruScoreResult | null | undefined,
  product: Pick<ProductWithTrustScore, 'trust_score'> | null | undefined
): number | null {
  if (truScore != null) {
    return truScore.truscore;
  }
  const ts = product?.trust_score;
  return isGenuineNumber(ts) ? ts : null;
}

/**
 * Pillar breakdown for share only when all four values are genuine numbers.
 * Does not coerce missing pillars to 0.
 */
export function resolveGenuinePillarBreakdown(
  truScore: TruScoreResult | null | undefined,
  product: Pick<ProductWithTrustScore, 'trust_score_breakdown'> | null | undefined
): GenuinePillarBreakdown | null {
  const b = truScore?.breakdown;
  if (b) {
    if (
      isGenuineNumber(b.Body) &&
      isGenuineNumber(b.Planet) &&
      isGenuineNumber(b.Ethics) &&
      isGenuineNumber(b.Open)
    ) {
      return { Body: b.Body, Planet: b.Planet, Ethics: b.Ethics, Open: b.Open };
    }
    return null;
  }
  const pb = product?.trust_score_breakdown;
  if (
    pb &&
    isGenuineNumber(pb.body) &&
    isGenuineNumber(pb.planet) &&
    isGenuineNumber(pb.ethics) &&
    isGenuineNumber(pb.open)
  ) {
    return { Body: pb.body, Planet: pb.planet, Ethics: pb.ethics, Open: pb.open };
  }
  return null;
}

/** Breakdown for share only when overall is a scored number and pillars are genuine. */
export function resolveShareBreakdownForOverall(
  overall: number | null,
  truScore: TruScoreResult | null | undefined,
  product: Pick<ProductWithTrustScore, 'trust_score_breakdown'> | null | undefined
): GenuinePillarBreakdown | null {
  if (overall === null) return null;
  return resolveGenuinePillarBreakdown(truScore, product);
}
