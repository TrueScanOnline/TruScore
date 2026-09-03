/**
 * Wave 3 Score Highlights — governed consumer selection types (S12 / S12a).
 *
 * Authority: Rveel_Wave3_Consolidated_Score_Highlights_Controlling_Specification_S12_S12a_S28_..._v0_4 §3–§4
 * plus the founder-locked Body v0.5 / Planet v0.1 / Ethics v0.1 / Open v0.1 pillar contracts.
 *
 * The consumer path is one-way: fired scoring ledger → governed registry → selection → L1/L2/L3.
 * Nothing here re-evaluates raw product fields and nothing here matches adjustment descriptions.
 */

export type ScoreHighlightPillar = 'Body' | 'Planet' | 'Ethics' | 'Open';

/** Pillar sequence locked for overall S12 rendering (v0.4 §4.0.1). */
export const SCORE_HIGHLIGHT_PILLAR_ORDER: readonly ScoreHighlightPillar[] = [
  'Body',
  'Planet',
  'Ethics',
  'Open',
] as const;

/**
 * One row of the production fired-adjustment ledger, normalised across the two shapes the app
 * carries it in (`TruScoreResult.pillarDetails` and `TruScoreAnalysis.pillars`).
 */
export interface FiredAdjustment {
  pillar: ScoreHighlightPillar;
  /** Stable production adjustment ID. Rows without one can never reach a consumer surface. */
  id?: string;
  /** Actual scoring effect of the fired row. */
  value: number;
  /** Eligibility as emitted by the scorer; cross-checked against the governed registry. */
  highlightEligible?: boolean;
  metadata?: Record<string, string | number | boolean>;
}

/**
 * Where L2 may continue to. L3 destinations are governed by the locked pillar contracts;
 * this package routes to the in-app additives experience for Body additives where one is
 * available, and otherwise to the governed authoritative source carried by the registry row.
 */
export type ScoreHighlightL3Route =
  | { kind: 'in_app'; target: import('./l3/targets').ScoreHighlightL3InAppTarget; label: string }
  | { kind: 'external_source'; url: string; label: string };

/** Five-band muted materiality treatment locked in v0.4 §4.0.1. */
export type ScoreHighlightBand =
  | 'strong_positive'
  | 'positive'
  | 'light'
  | 'negative'
  | 'strong_negative';

/** One governed consumer story, ready to render under the "What we found" list. */
export interface ScoreHighlightStory {
  pillar: ScoreHighlightPillar;
  /** Stable adjustment ID, or the presentation synthesis family ID for approved synthesis. */
  storyKey: string;
  /** Exact fired production adjustment IDs this story is bound to. */
  boundAdjustmentIds: string[];
  sign: 'positive' | 'negative';
  /** Signed points used for ranking. Synthesis uses its locked presentation materiality. */
  materiality: number;
  /** Locked registry priority within its pillar pool; lower wins equal-materiality ties. */
  priority: number;
  band: ScoreHighlightBand;
  l1: string;
  l2: string;
  l3Route?: ScoreHighlightL3Route;
  /** Fired-row commentary metadata carried for L3 token binding (never from raw product fields). */
  metadata?: Record<string, string | number | boolean>;
  /** True when overall S12 promoted this story for its pillar. */
  promotedOverall?: boolean;
  /** Set for the approved Body colour-warning cluster only. */
  synthesisFamily?: string;
}

/** Why a fired, otherwise-eligible row was withheld from consumer surfaces (S28 / UAT diagnostics). */
export interface ScoreHighlightExclusion {
  pillar: ScoreHighlightPillar;
  adjustmentId: string | null;
  reason:
    | 'no_stable_id'
    | 'unknown_registry_id'
    | 'registry_ineligible'
    | 'scorer_ineligible'
    | 'zero_materiality'
    | 'absorbed_by_synthesis'
    | 'missing_promotion_priority'
    | 'unresolved_locked_copy_token';
}

export interface ScoreHighlightSelection {
  /** Overall S12: at most one positive and one negative per pillar, in locked render order. */
  promoted: ScoreHighlightStory[];
  /** S12a: every eligible story per pillar after synthesis, in locked order. */
  byPillar: Record<ScoreHighlightPillar, ScoreHighlightStory[]>;
  /** Fired rows deliberately withheld from consumer surfaces. Diagnostic only. */
  exclusions: ScoreHighlightExclusion[];
}
