/**
 * Share-path score resolution without coercing null/unavailable → 0.
 * Uses Wave 3 publication publishedScore only — never internal arithmetic while checking/NR.
 *
 * NA-018 / Pass 3: Overall and pillar assessment sharing may derive only from the
 * authorised current TruScoreResult supplied by Result.
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
 * Overall share score from publication.overall.publishedScore when present;
 * otherwise falls back to authorised truscore only when no publication snapshot exists.
 * checking/NR → null (never internal sum).
 */
export function resolveShareOverallScore(
  truScore: TruScoreResult | null | undefined
): number | null {
  if (truScore == null) return null;
  const pub = truScore.publication;
  if (pub) {
    if (pub.overall.publicationStatus !== 'rated') return null;
    const published = pub.overall.publishedScore;
    return isGenuineNumber(published) ? published : null;
  }
  const ts = truScore.truscore;
  return isGenuineNumber(ts) ? ts : null;
}

/**
 * Pillar breakdown for share from each pillar's publishedScore only.
 * Any checking/NR pillar → null breakdown (suppress score-bearing pillar share).
 */
export function resolveGenuinePillarBreakdown(
  truScore: TruScoreResult | null | undefined
): GenuinePillarBreakdown | null {
  if (truScore == null) return null;
  const pub = truScore.publication;
  if (pub) {
    const body = pub.body;
    const planet = pub.planet;
    const claims = pub.claims;
    const transparency = pub.transparency;
    if (
      body.publicationStatus !== 'rated' ||
      planet.publicationStatus !== 'rated' ||
      claims.publicationStatus !== 'rated' ||
      transparency.publicationStatus !== 'rated'
    ) {
      return null;
    }
    if (
      !isGenuineNumber(body.publishedScore) ||
      !isGenuineNumber(planet.publishedScore) ||
      !isGenuineNumber(claims.publishedScore) ||
      !isGenuineNumber(transparency.publishedScore)
    ) {
      return null;
    }
    return {
      Body: body.publishedScore,
      Planet: planet.publishedScore,
      Ethics: claims.publishedScore,
      Open: transparency.publishedScore,
    };
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

/** Breakdown for share only when overall is a scored number and pillars are all rated. */
export function resolveShareBreakdownForOverall(
  overall: number | null,
  truScore: TruScoreResult | null | undefined
): GenuinePillarBreakdown | null {
  if (overall === null) return null;
  return resolveGenuinePillarBreakdown(truScore);
}
