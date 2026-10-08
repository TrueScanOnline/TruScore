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

function isGenuinePublishedScore(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

function unavailablePresentation(): TruScoreConsumerPresentation {
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

/**
 * Pure presentation contract for Result TruScore surface.
 * Published state only. A missing publication fails closed and never reads the internal score.
 */
export function getTruScoreConsumerPresentation(
  truScore: Pick<TruScoreResult, 'truscore' | 'publication'>,
  options?: { publicationSettled?: boolean }
): TruScoreConsumerPresentation {
  const latchOpen = options?.publicationSettled !== false;
  const pub: CrossPillarPublicationSnapshot | undefined = truScore.publication;

  if (!latchOpen) {
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

  if (!pub?.overall || typeof pub.overall.publicationStatus !== 'string') {
    return unavailablePresentation();
  }

  if (pub.settled === false) {
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

  if (pub.settled !== true) {
    return unavailablePresentation();
  }

  if (pub.overall.publicationStatus === 'checking') {
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

  if (pub.overall.publicationStatus === 'nr') {
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

  if (pub.overall.publicationStatus !== 'rated' || !isGenuinePublishedScore(pub.overall.publishedScore)) {
    return unavailablePresentation();
  }

  return {
    kind: 'scored',
    score: pub.overall.publishedScore,
    showScoreCircle: true,
    showScoreLabel: true,
    showNumericScore: true,
    showPillarBars: true,
  };
}

/** Score-band input for card chrome. Null means neutral: NR, Checking, or no publication. */
export function publishedOverallVisualScore(
  truScore: Pick<TruScoreResult, 'truscore' | 'publication'>,
  options?: { publicationSettled?: boolean }
): number | null {
  const presentation = getTruScoreConsumerPresentation(truScore, options);
  return presentation.kind === 'scored' ? presentation.score : null;
}

/** Highlights header scores. A non-Rated pillar is null, including when an internal score exists. */
export function publishedHighlightPillarScores(
  truScore: Pick<TruScoreResult, 'publication'> | null | undefined,
  options?: { publicationSettled?: boolean }
): { Body: number | null; Planet: number | null; Ethics: number | null; Open: number | null } {
  const hidden = { Body: null, Planet: null, Ethics: null, Open: null };
  const pick = (
    pillar: { publicationStatus?: string; publishedScore?: number | null } | undefined
  ): number | null => {
    if (!pillar || pillar.publicationStatus !== 'rated') return null;
    const score = pillar.publishedScore;
    return isGenuinePublishedScore(score) ? score : null;
  };
  const pub = truScore?.publication;
  if (options?.publicationSettled === false || !pub || pub.settled !== true) {
    return hidden;
  }
  return {
    Body: pick(pub?.body),
    Planet: pick(pub?.planet),
    Ethics: pick(pub?.claims),
    Open: pick(pub?.transparency),
  };
}

/** Consumer pillar value. A published zero stays 0/25. Unpublished stays an em dash. */
export function publishedPillarValueLabel(value: number | null): string {
  if (value == null) return '—';
  return `${value}/25`;
}

export { publishedScoreDisplay };
