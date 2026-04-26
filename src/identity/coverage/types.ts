import type { SharedIdentityContext } from '../types';

/**
 * Slice 2 operational scaffolding types.
 * These support coverage/stewardship workflows and are not authoritative identity storage.
 */

export type IdentitySeedSourceType =
  | 'catalog_import'
  | 'retailer_feed'
  | 'manual_stewardship'
  | 'runtime_inference';

export interface IdentitySeedSourceRecord {
  id: string;
  gtin: string;
  market_key: SharedIdentityContext['resolution_key']['market_key'];
  source_type: IdentitySeedSourceType;
  source_ref: string;
  created_at: string;
}

export type StewardshipActionType =
  | 'review_started'
  | 'review_completed'
  | 'alias_added'
  | 'owner_corrected'
  | 'queued_for_review';

export interface IdentityStewardActionLogEntry {
  id: string;
  action_type: StewardshipActionType;
  /** Human-accountable actor/owner (AI tools may assist, but actor remains human). */
  actor: string;
  reason: string;
  gtin?: string;
  market_key?: SharedIdentityContext['resolution_key']['market_key'];
  created_at: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export const REVIEW_QUEUE_PRIORITIES = ['high', 'medium', 'low'] as const;
export type ReviewQueuePriority = (typeof REVIEW_QUEUE_PRIORITIES)[number];

export const REVIEW_QUEUE_REASONS = [
  'missing_brand_candidate',
  'multiple_brand_candidates',
  'resolution_not_resolved',
] as const;
export type ReviewQueueReason = (typeof REVIEW_QUEUE_REASONS)[number];

export interface IdentityCoverageScorecard {
  generated_at: string;
  total_contexts: number;
  by_market: Record<'AU' | 'NZ' | 'AU+NZ', number>;
  ambiguity_count: number;
  reviewed_count: number;
  own_label_priority_count: number;
}

export interface IdentityReviewQueueItem {
  id: string;
  gtin: string;
  market_key: SharedIdentityContext['resolution_key']['market_key'];
  reason: ReviewQueueReason;
  priority: ReviewQueuePriority;
  created_at: string;
}

