/**
 * Stage 2 MVP — Food recall match types.
 * Provisional consumer copy — founder/legal approval required before launch.
 */

export type FoodRecallMatchState =
  | 'confirmed_affected'
  | 'batch_check_required'
  | 'batch_not_listed'
  | 'related_recall_variant_unconfirmed'
  | 'not_applicable';

export type FoodRecallInputStatus = 'missing' | 'partial' | 'malformed' | 'complete';

export type GtinVerificationStatus =
  | 'verified_for_consumer'
  | 'controlled_test_awaiting_external_verification'
  | 'controlled_test_synthetic';

export type FoodRecallNoticeActivation =
  | 'corrected_matcher_active'
  | 'unavailable_for_scan_alerts'
  | 'held_non_gtin';

export interface FoodRecallSubmittedMarkings {
  batchCodeRaw?: string | null;
  /** Month 1–12; year e.g. 2026 — product marking, not a UTC instant */
  bestBeforeMonth?: number | null;
  bestBeforeYear?: number | null;
}

export interface FoodRecallMatchResult {
  match_state: FoodRecallMatchState;
  input_status?: FoodRecallInputStatus;
  signal_id: string;
  recall_notice_id: string;
  scanned_gtin: string;
  matched_gtin?: string;
  recall_variant_id?: string;
  recall_product_family_id?: string;
  submitted_batch_raw?: string;
  submitted_batch_normalized?: string;
  submitted_bb_month?: number;
  submitted_bb_year?: number;
  match_reason_code: string;
  consumer_message_key: string;
  official_source_url: string;
  hazard: string;
  consumer_action: string;
  severity: 'high' | 'medium' | 'low';
  needs_batch_entry: boolean;
  evaluated_at: string;
  /** Stable public card identity — must NOT include match_state */
  dedupe_key: string;
  /** Present when GTIN is on pack / related list — drives publication metadata */
  gtin_verification_status?: GtinVerificationStatus;
}

export interface FoodRecallEvaluationClock {
  nowIso(): string;
}

export function createFixedFoodRecallClock(iso: string): FoodRecallEvaluationClock {
  return { nowIso: () => iso };
}
