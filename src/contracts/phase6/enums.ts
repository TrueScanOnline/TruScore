/**
 * Phase 6 foundational enums mirrored from locked Document 5 v0.4.
 * Keep these literals centralized to avoid naming drift.
 */

export const CONFIDENCE_STATES = [
  'confirmed',
  'strong',
  'probable',
  'low',
  'rejected',
] as const;
export type ConfidenceState = (typeof CONFIDENCE_STATES)[number];

export const REVIEW_STATES = [
  'seeded',
  'provisional',
  'reviewed',
  'disputed',
  'archived',
] as const;
export type ReviewState = (typeof REVIEW_STATES)[number];

export const RESOLUTION_STATUSES = [
  'resolved',
  'resolved_with_warning',
  'ambiguous',
  'blocked',
  'needs_review',
] as const;
export type ResolutionStatus = (typeof RESOLUTION_STATUSES)[number];

export const FREEZE_STATUSES = ['draft', 'frozen', 'superseded'] as const;
export type FreezeStatus = (typeof FREEZE_STATUSES)[number];

export const SIGNAL_PUBLICATION_STATES = [
  'candidate',
  'held_for_review',
  'publishable',
  'suppressed',
  'expired',
] as const;
export type SignalPublicationState = (typeof SIGNAL_PUBLICATION_STATES)[number];

export const NORMATIVE_SIGNAL_CLASSES = [
  'safety_regulatory',
  'in_the_news',
  'my_choices_chain',
] as const;
export type NormativeSignalClass = (typeof NORMATIVE_SIGNAL_CLASSES)[number];

export const MARKET_KEYS = ['AU', 'NZ', 'AU+NZ'] as const;
export type MarketKeyResolution = (typeof MARKET_KEYS)[number];

