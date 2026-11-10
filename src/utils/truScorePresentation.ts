/**
 * Consumer presentation helpers for overall TruScore.
 * Distinguishes technical unavailable, Wave 3 checking/NR (unrevealed), and Rated.
 */

import type { TruScoreResult } from '../lib/truscoreEngine';
import type { CrossPillarPublicationSnapshot } from '../lib/rateability';
import { publishedScoreDisplay } from '../lib/rateability';
import { consumerPillarLabel } from '../lib/scoreHighlights/consumerPillarLabels';
import type { ScoreHighlightPillar } from '../lib/scoreHighlights/types';

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

const NR_PILLARS: ReadonlyArray<{
  field: 'body' | 'planet' | 'claims' | 'transparency';
  pillar: ScoreHighlightPillar;
}> = [
  { field: 'body', pillar: 'Body' },
  { field: 'planet', pillar: 'Planet' },
  { field: 'claims', pillar: 'Ethics' },
  { field: 'transparency', pillar: 'Open' },
];

const NR_OVERALL_FALLBACK = "The overall Rveel Score isn't ready to reveal yet.";

function nrPillarList(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/**
 * Names the NR pillars when every pillar status is Rated or NR and at least one is NR.
 * Any other Overall NR snapshot stays neutral.
 */
function nrExplanation(publication: CrossPillarPublicationSnapshot): string {
  const reliable = NR_PILLARS.every((entry) => {
    const status = publication[entry.field]?.publicationStatus;
    return status === 'rated' || status === 'nr';
  });
  const names = NR_PILLARS.flatMap((entry) =>
    publication[entry.field]?.publicationStatus === 'nr' ? [consumerPillarLabel(entry.pillar)] : []
  );
  if (!reliable || names.length === 0) return NR_OVERALL_FALLBACK;
  const verb = names.length === 1 ? "isn't" : "aren't";
  return (
    'To reveal the overall Rveel Score, all four cards need a rating. ' +
    `${nrPillarList(names)} ${verb} rated yet. Tap on any of the cards to add more information.`
  );
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
      title: 'UnRevealed?',
      explanation: nrExplanation(pub),
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
