/**
 * W5-CD-01 — presentation-only celebration outcomes.
 * Outcomes must map to genuine contribution states; this module never decides them.
 */

export type ContributionCelebrationVariant =
  /** Evidence Authority admitted a complete submission; Result already shows admitted evidence. */
  | 'admitted_visible'
  /** Same admission path, but the journey was a correction/removal (surfaceMode change). */
  | 'correction'
  /** Community Agreement POST succeeded (server ack). Compact acknowledgement only. */
  | 'agreement_compact';

export type ContributionCelebrationRequest = {
  /** Stable id for one logical submission. Duplicates are suppressed. */
  submissionKey: string;
  variant: ContributionCelebrationVariant;
};

export type ContributionCelebrationCopy = {
  title: string;
  body: string;
  status: string | null;
  qualification: string | null;
  primaryAction: string;
  secondaryAction: string | null;
  secondaryDetail: string | null;
};
