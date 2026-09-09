/**
 * Share-path score resolution without coercing null/unavailable → 0.
 * Null overall TruScore must not become score-bearing share content.
 *
 * NA-018 / Pass 3: Overall and pillar assessment sharing may derive only from the
 * authorised current TruScoreResult supplied by Result (or an equivalently explicit
 * authority-bound assessment object). Raw product.trust_score /
 * product.trust_score_breakdown must never resurrect an assessment when truScore is null.
 */

import type { TruScoreResult } from '../lib/truscoreEngine';

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
 * Overall share score from the authorised TruScoreResult only.
 * Missing/null truScore → no assessment content (product-info share may still proceed without scores).
 */
export function resolveShareOverallScore(
  truScore: TruScoreResult | null | undefined
): number | null {
  if (truScore == null) {
    return null;
  }
  const ts = truScore.truscore;
  return isGenuineNumber(ts) ? ts : null;
}

/**
 * Pillar breakdown for share only when all four values are genuine numbers on the
 * authorised TruScoreResult. Does not coerce missing pillars to 0 and does not read
 * product.trust_score_breakdown.
 */
export function resolveGenuinePillarBreakdown(
  truScore: TruScoreResult | null | undefined
): GenuinePillarBreakdown | null {
  if (truScore == null) {
    return null;
  }
  const b = truScore.breakdown;
  if (
    b &&
    isGenuineNumber(b.Body) &&
    isGenuineNumber(b.Planet) &&
    isGenuineNumber(b.Ethics) &&
    isGenuineNumber(b.Open)
  ) {
    return { Body: b.Body, Planet: b.Planet, Ethics: b.Ethics, Open: b.Open };
  }
  return null;
}

/** Breakdown for share only when overall is a scored number and pillars are genuine. */
export function resolveShareBreakdownForOverall(
  overall: number | null,
  truScore: TruScoreResult | null | undefined
): GenuinePillarBreakdown | null {
  if (overall === null) return null;
  return resolveGenuinePillarBreakdown(truScore);
}
