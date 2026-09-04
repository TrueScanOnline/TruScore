/**
 * Consumer presentation helpers for overall TruScore null = unavailable (non-assessment).
 * Do not reuse Confidence language for this technical/unavailable state.
 */

import type { TruScoreResult } from '../lib/truscoreEngine';

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
      kind: 'scored';
      score: number;
      showScoreCircle: true;
      showScoreLabel: true;
      showNumericScore: true;
      showPillarBars: true;
    };

/**
 * Pure presentation contract for Result TruScore surface.
 * Used by TruScore.tsx and regression tests (no Confidence language).
 */
export function getTruScoreConsumerPresentation(
  truScore: Pick<TruScoreResult, 'truscore'>
): TruScoreConsumerPresentation {
  if (isOverallTruScoreUnavailable(truScore.truscore)) {
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
    score: truScore.truscore as number,
    showScoreCircle: true,
    showScoreLabel: true,
    showNumericScore: true,
    showPillarBars: true,
  };
}
