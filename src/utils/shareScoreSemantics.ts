/**
 * Share-path score resolution without coercing null/unavailable → 0.
 * Uses Wave 3 publication publishedScore only — never internal arithmetic while checking/NR.
 *
 * NA-018 / Pass 3: Overall and pillar assessment sharing may derive only from the
 * authorised current TruScoreResult supplied by Result.
 */

import type { TruScoreResult } from '../lib/truscoreEngine';
import { productIdentity } from '../config/productIdentity';
import {
  getTruScoreConsumerPresentation,
  RVEEL_SCORE_UNAVAILABLE_EXPLANATION,
  RVEEL_SCORE_UNAVAILABLE_TITLE,
} from './truScorePresentation';

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
 * Overall share score from publication.overall.publishedScore when Rated.
 * Missing publication, Checking, and NR fail closed. A genuine published 0 is kept.
 */
export function resolveShareOverallScore(
  truScore: TruScoreResult | null | undefined
): number | null {
  if (truScore == null) return null;
  const pub = truScore.publication;
  const overall = pub?.overall;
  if (!pub || pub.settled !== true || !overall || overall.publicationStatus !== 'rated') return null;
  return isGenuineNumber(overall.publishedScore) ? overall.publishedScore : null;
}

export type ShareImageScoreState = {
  kind: 'rated' | 'nr' | 'checking' | 'unavailable';
  /** Numeric text only when Rated, including a genuine zero. */
  valueText: string | null;
  /** "Rveel Score" only when Rated. Otherwise the existing state title. */
  caption: string;
  neutral: boolean;
};

/** Image-card state. NR, Checking, and technical failure stay distinct and carry no number. */
export function shareImageScoreState(
  truScore: TruScoreResult | null | undefined
): ShareImageScoreState {
  if (truScore == null) {
    return { kind: 'unavailable', valueText: null, caption: RVEEL_SCORE_UNAVAILABLE_TITLE, neutral: true };
  }
  const presentation = getTruScoreConsumerPresentation(truScore, { publicationSettled: true });
  if (presentation.kind === 'scored') {
    return {
      kind: 'rated',
      valueText: `${presentation.score}/100`,
      caption: productIdentity.publicScoreName,
      neutral: false,
    };
  }
  if (presentation.kind === 'nr') {
    return { kind: 'nr', valueText: null, caption: presentation.title, neutral: true };
  }
  if (presentation.kind === 'checking') {
    return { kind: 'checking', valueText: null, caption: presentation.title, neutral: true };
  }
  return { kind: 'unavailable', valueText: null, caption: presentation.title, neutral: true };
}

/** Card share control. A low band is chosen only from a published Rated score. */
export function resolveScoreCardShareType(
  truScore: TruScoreResult | null | undefined,
  options?: { publicationSettled?: boolean }
): 'truScore' | 'negativeTruScore' {
  if (truScore == null) return 'truScore';
  const presentation = getTruScoreConsumerPresentation(truScore, options);
  if (presentation.kind === 'scored' && presentation.score < 40) return 'negativeTruScore';
  return 'truScore';
}

/** Copy for a share that has no published number. NR and Checking stay distinct from technical failure. */
export function unpublishedShareCopy(
  truScore: TruScoreResult | null | undefined
): { title: string; explanation: string } {
  if (truScore == null) {
    return {
      title: RVEEL_SCORE_UNAVAILABLE_TITLE,
      explanation: RVEEL_SCORE_UNAVAILABLE_EXPLANATION,
    };
  }
  const presentation = getTruScoreConsumerPresentation(truScore, {
    publicationSettled: truScore.publication ? truScore.publication.settled : true,
  });
  if (
    presentation.kind === 'nr' ||
    presentation.kind === 'checking' ||
    presentation.kind === 'unavailable'
  ) {
    return { title: presentation.title, explanation: presentation.explanation };
  }
  return {
    title: RVEEL_SCORE_UNAVAILABLE_TITLE,
    explanation: RVEEL_SCORE_UNAVAILABLE_EXPLANATION,
  };
}

/**
 * Pillar breakdown for share from each pillar's publishedScore only.
 * Missing publication, a missing pillar, or any non-Rated pillar → null.
 */
export function resolveGenuinePillarBreakdown(
  truScore: TruScoreResult | null | undefined
): GenuinePillarBreakdown | null {
  if (truScore == null) return null;
  const pub = truScore.publication;
  if (!pub?.body || !pub.planet || !pub.claims || !pub.transparency) return null;
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

/** Breakdown for share only when overall is a scored number and pillars are all rated. */
export function resolveShareBreakdownForOverall(
  overall: number | null,
  truScore: TruScoreResult | null | undefined
): GenuinePillarBreakdown | null {
  if (overall === null) return null;
  return resolveGenuinePillarBreakdown(truScore);
}
