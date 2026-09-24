/**
 * Consumer presentation helpers for overall TruScore.
 * Distinguishes technical unavailable, Wave 3 checking/NR (unrevealed), and Rated.
 */

import type { TruScoreResult } from '../lib/truscoreEngine';
import type { CrossPillarPublicationSnapshot } from '../lib/rateability';
import { publishedScoreDisplay } from '../lib/rateability';

export const RVEEL_SCORE_UNAVAILABLE_TITLE = 'Rveel Score unavailable';
export const RVEEL_SCORE_UNAVAILABLE_EXPLANATION =
  "We couldn't calculate a Rveel Score for this product right now.";

/** Neutral chrome when overall score is unavailable (not a score colour). */
export const RVEEL_SCORE_UNAVAILABLE_NEUTRAL_COLOR = '#8a8a8a';

export function isOverallTruScoreUnavailable(truscore: number | null | undefined): boolean {
  return truscore === null;
}

export type TruScoreConsumerPresentation =
  | {
      kind: 'unavailable';
      title: string;
      explanation: string;
      showScoreCircle: false;
      showScoreLabel: false;
      showNumericScore: false;
      showPillarBars: false;
      forbiddenConsumerTokens: readonly string[];
    }
  | {
      kind: 'checking';
      title: string;
      explanation: string;
      showScoreCircle: false;
      showScoreLabel: false;
      showNumericScore: false;
      showPillarBars: true;
      overallDisplay: '—';
    }
  | {
      kind: 'nr';
      title: string;
      explanation: string;
      showScoreCircle: false;
      showScoreLabel: false;
      showNumericScore: false;
      showPillarBars: true;
      overallDisplay: '—';
    }
  | {
      kind: 'scored';
      score: number;
      showScoreCircle: true;
      showScoreLabel: true;
      showNumericScore: true;
      showPillarBars: true;
    };

/**
 * Pure presentation contract for Result TruScore surface.
 * Uses publication snapshot when present; falls back to legacy null=unavailable.
 */
export function getTruScoreConsumerPresentation(
  truScore: Pick<TruScoreResult, 'truscore' | 'publication'>,
  options?: { publicationSettled?: boolean }
): TruScoreConsumerPresentation {
  const settled = options?.publicationSettled !== false;
  const pub: CrossPillarPublicationSnapshot | undefined = truScore.publication;

  if (isOverallTruScoreUnavailable(truScore.truscore) && !pub) {
    return {
      kind: 'unavailable',
      title: RVEEL_SCORE_UNAVAILABLE_TITLE,
      explanation: RVEEL_SCORE_UNAVAILABLE_EXPLANATION,
      showScoreCircle: false,
      showScoreLabel: false,
      showNumericScore: false,
      showPillarBars: false,
      forbiddenConsumerTokens: ['Poor', '0/25', '0/100', 'Confidence'],
    };
  }

  if (!settled || pub?.overall.publicationStatus === 'checking') {
    return {
      kind: 'checking',
      title: 'Seeing what we can find…',
      explanation: 'Assessment still settling.',
      showScoreCircle: false,
      showScoreLabel: false,
      showNumericScore: false,
      showPillarBars: true,
      overallDisplay: '—',
    };
  }

  if (pub?.overall.publicationStatus === 'nr') {
    return {
      kind: 'nr',
      title: 'Overall unrevealed',
      explanation: pub.overall.s26?.explanation ?? 'Overall result not yet revealable.',
      showScoreCircle: false,
      showScoreLabel: false,
      showNumericScore: false,
      showPillarBars: true,
      overallDisplay: '—',
    };
  }

  const published =
    pub?.overall.publishedScore ??
    (typeof truScore.truscore === 'number' ? truScore.truscore : null);
  if (published == null) {
    return {
      kind: 'unavailable',
      title: RVEEL_SCORE_UNAVAILABLE_TITLE,
      explanation: RVEEL_SCORE_UNAVAILABLE_EXPLANATION,
      showScoreCircle: false,
      showScoreLabel: false,
      showNumericScore: false,
      showPillarBars: false,
      forbiddenConsumerTokens: ['Poor', '0/25', '0/100', 'Confidence'],
    };
  }

  return {
    kind: 'scored',
    score: published,
    showScoreCircle: true,
    showScoreLabel: true,
    showNumericScore: true,
    showPillarBars: true,
  };
}

export { publishedScoreDisplay };
