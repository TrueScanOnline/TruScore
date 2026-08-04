/**
 * Stage 2 MVP — exact-GTIN food recall matcher (MILO reference case).
 */

import {
  MILO_AFFECTED_VARIANTS,
  MILO_BB_MONTH,
  MILO_BB_YEAR,
  MILO_CONSUMER_ACTION,
  MILO_FAMILY_ID,
  MILO_HAZARD,
  MILO_LISTED_BATCH_CODES,
  MILO_NOTICE_ACTIVATION,
  MILO_OFFICIAL_SOURCE_URL,
  MILO_RECALL_NOTICE_ID,
  MILO_RELATED_FAMILY_GTINS,
  MILO_SIGNAL_ID,
} from './miloRecallPack';
import { isAugust2026BestBefore, normalizeBatchCode, normalizeBestBeforeMonthYear } from './normalizeBatchDate';
import type {
  FoodRecallEvaluationClock,
  FoodRecallInputStatus,
  FoodRecallMatchResult,
  FoodRecallMatchState,
  FoodRecallSubmittedMarkings,
} from './types';

const LISTED = new Set(MILO_LISTED_BATCH_CODES.map((b) => b.toUpperCase()));

function stableDedupeKey(noticeId: string, gtin: string): string {
  return `p6|food_recall|${noticeId}|${gtin}`;
}

function severityFor(state: FoodRecallMatchState): 'high' | 'medium' | 'low' {
  switch (state) {
    case 'confirmed_affected':
      return 'high';
    case 'batch_check_required':
      return 'high';
    case 'batch_not_listed':
      return 'medium';
    case 'related_recall_variant_unconfirmed':
      return 'low';
    default:
      return 'low';
  }
}

function messageKey(state: FoodRecallMatchState): string {
  return `food_recall.state.${state}`;
}

function baseResult(
  partial: Omit<FoodRecallMatchResult, 'dedupe_key' | 'severity' | 'consumer_message_key' | 'needs_batch_entry'> & {
    needs_batch_entry?: boolean;
  }
): FoodRecallMatchResult {
  const state = partial.match_state;
  return {
    ...partial,
    dedupe_key: stableDedupeKey(partial.recall_notice_id, partial.scanned_gtin),
    severity: severityFor(state),
    consumer_message_key: messageKey(state),
    needs_batch_entry: partial.needs_batch_entry ?? state === 'batch_check_required',
  };
}

/**
 * Classify batch+BB input for MILO (both required).
 * Partial/malformed must NOT become batch_not_listed.
 */
export function classifyMiloMarkingInput(markings?: FoodRecallSubmittedMarkings | null): {
  status: FoodRecallInputStatus;
  batchNormalized?: string;
  bbMonth?: number;
  bbYear?: number;
} {
  const batchRes = normalizeBatchCode(markings?.batchCodeRaw);
  const bbRes = normalizeBestBeforeMonthYear(markings?.bestBeforeMonth, markings?.bestBeforeYear);

  const batchMissing = !batchRes.ok && batchRes.reason === 'missing';
  const bbMissing = !bbRes.ok && bbRes.reason === 'missing';
  const batchMalformed = !batchRes.ok && batchRes.reason === 'malformed';
  const bbMalformed = !bbRes.ok && (bbRes.reason === 'malformed' || bbRes.reason === 'partial');

  if (batchMissing && bbMissing) return { status: 'missing' };
  if (batchMalformed || bbMalformed) return { status: 'malformed' };
  if (!batchRes.ok || !bbRes.ok) return { status: 'partial' };

  return {
    status: 'complete',
    batchNormalized: batchRes.normalized,
    bbMonth: bbRes.month,
    bbYear: bbRes.year,
  };
}

export function evaluateMiloFoodRecallMatch(input: {
  gtin: string;
  markings?: FoodRecallSubmittedMarkings | null;
  clock: FoodRecallEvaluationClock;
  /**
   * When false, matcher does not publish (caller may use legacy path for MILO only).
   * Default: notice activation is corrected_matcher_active.
   */
  correctedPathEnabled?: boolean;
}): FoodRecallMatchResult {
  const gtin = (input.gtin || '').trim();
  const evaluated_at = input.clock.nowIso();
  const corrected =
    input.correctedPathEnabled !== false && MILO_NOTICE_ACTIVATION === 'corrected_matcher_active';

  if (!corrected) {
    return baseResult({
      match_state: 'not_applicable',
      signal_id: MILO_SIGNAL_ID,
      recall_notice_id: MILO_RECALL_NOTICE_ID,
      scanned_gtin: gtin,
      match_reason_code: 'corrected_path_disabled',
      official_source_url: MILO_OFFICIAL_SOURCE_URL,
      hazard: MILO_HAZARD,
      consumer_action: MILO_CONSUMER_ACTION,
      evaluated_at,
      needs_batch_entry: false,
    });
  }

  const affected = MILO_AFFECTED_VARIANTS.find((v) => v.gtin === gtin);
  // Consumer activation gate: unverified_for_consumer GTINs allowed only as controlled test
  // under Skeleton UAT (caller already gated). Never treat as verified_for_consumer.
  if (affected) {
    const classified = classifyMiloMarkingInput(input.markings);
    if (classified.status !== 'complete') {
      return baseResult({
        match_state: 'batch_check_required',
        input_status: classified.status,
        signal_id: MILO_SIGNAL_ID,
        recall_notice_id: MILO_RECALL_NOTICE_ID,
        scanned_gtin: gtin,
        matched_gtin: gtin,
        recall_variant_id: affected.recall_variant_id,
        recall_product_family_id: MILO_FAMILY_ID,
        submitted_batch_raw: input.markings?.batchCodeRaw ?? undefined,
        submitted_batch_normalized: classified.batchNormalized,
        submitted_bb_month: classified.bbMonth,
        submitted_bb_year: classified.bbYear,
        match_reason_code: `markings_${classified.status}`,
        official_source_url: MILO_OFFICIAL_SOURCE_URL,
        hazard: MILO_HAZARD,
        consumer_action: MILO_CONSUMER_ACTION,
        evaluated_at,
        needs_batch_entry: true,
      });
    }

    const batchOk = LISTED.has(classified.batchNormalized!);
    const bbOk = isAugust2026BestBefore(classified.bbMonth!, classified.bbYear!);
    if (batchOk && bbOk) {
      return baseResult({
        match_state: 'confirmed_affected',
        input_status: 'complete',
        signal_id: MILO_SIGNAL_ID,
        recall_notice_id: MILO_RECALL_NOTICE_ID,
        scanned_gtin: gtin,
        matched_gtin: gtin,
        recall_variant_id: affected.recall_variant_id,
        recall_product_family_id: MILO_FAMILY_ID,
        submitted_batch_raw: input.markings?.batchCodeRaw ?? undefined,
        submitted_batch_normalized: classified.batchNormalized,
        submitted_bb_month: classified.bbMonth,
        submitted_bb_year: classified.bbYear,
        match_reason_code: 'batch_and_bb_match_rule_group',
        official_source_url: MILO_OFFICIAL_SOURCE_URL,
        hazard: MILO_HAZARD,
        consumer_action: MILO_CONSUMER_ACTION,
        evaluated_at,
        needs_batch_entry: false,
      });
    }

    return baseResult({
      match_state: 'batch_not_listed',
      input_status: 'complete',
      signal_id: MILO_SIGNAL_ID,
      recall_notice_id: MILO_RECALL_NOTICE_ID,
      scanned_gtin: gtin,
      matched_gtin: gtin,
      recall_variant_id: affected.recall_variant_id,
      recall_product_family_id: MILO_FAMILY_ID,
      submitted_batch_raw: input.markings?.batchCodeRaw ?? undefined,
      submitted_batch_normalized: classified.batchNormalized,
      submitted_bb_month: classified.bbMonth,
      submitted_bb_year: classified.bbYear,
      match_reason_code: 'complete_nonmatching_rule_group',
      official_source_url: MILO_OFFICIAL_SOURCE_URL,
      hazard: MILO_HAZARD,
      consumer_action: MILO_CONSUMER_ACTION,
      evaluated_at,
      needs_batch_entry: false,
    });
  }

  const related = MILO_RELATED_FAMILY_GTINS.find((r) => r.gtin === gtin);
  if (related) {
    return baseResult({
      match_state: 'related_recall_variant_unconfirmed',
      signal_id: MILO_SIGNAL_ID,
      recall_notice_id: MILO_RECALL_NOTICE_ID,
      scanned_gtin: gtin,
      recall_product_family_id: MILO_FAMILY_ID,
      match_reason_code: 'reviewed_family_membership_not_affected_variant',
      official_source_url: MILO_OFFICIAL_SOURCE_URL,
      hazard: MILO_HAZARD,
      consumer_action: MILO_CONSUMER_ACTION,
      evaluated_at,
      needs_batch_entry: false,
    });
  }

  return baseResult({
    match_state: 'not_applicable',
    signal_id: MILO_SIGNAL_ID,
    recall_notice_id: MILO_RECALL_NOTICE_ID,
    scanned_gtin: gtin,
    match_reason_code: 'not_affected_gtin_and_not_family_member',
    official_source_url: MILO_OFFICIAL_SOURCE_URL,
    hazard: MILO_HAZARD,
    consumer_action: MILO_CONSUMER_ACTION,
    evaluated_at,
    needs_batch_entry: false,
  });
}

/** Provisional copy — founder/legal approval required before launch */
export function provisionalCopyForMatchState(state: FoodRecallMatchState): {
  title_display: string;
  body_display: string;
  why_display: string;
} {
  switch (state) {
    case 'confirmed_affected':
      return {
        title_display: 'Food recall — this batch is affected',
        body_display: `${MILO_HAZARD} ${MILO_CONSUMER_ACTION}`,
        why_display:
          'Shown because the scanned barcode matches an affected MILO Snack Bar product and the entered batch and best-before marking match the official notice. Provisional wording — founder/legal approval required before launch.',
      };
    case 'batch_check_required':
      return {
        title_display: 'Selected batches of this product have been recalled',
        body_display:
          'Check the batch code and best-before marking (month/year) on the pack to determine whether your product is listed in the official notice.',
        why_display:
          'Shown because the scanned barcode matches an affected product variant. Enter batch and best-before details below. Provisional wording — founder/legal approval required before launch.',
      };
    case 'batch_not_listed':
      return {
        title_display: 'Other batches of this product were recalled',
        body_display:
          'The batch details entered are not listed in the current official recall notice. This does not independently confirm that the product is safe. Check the official notice for updates.',
        why_display:
          'Shown because the barcode matches an affected variant, but the entered batch and/or best-before marking are not listed. Provisional wording — founder/legal approval required before launch.',
      };
    case 'related_recall_variant_unconfirmed':
      return {
        title_display: 'Recall notice for selected variants in this product family',
        body_display:
          'The scanned barcode has not been identified as one of the listed affected variants. Check the affected pack sizes, batch codes and date markings in the official notice.',
        why_display:
          'Shown because this barcode is a reviewed MILO Snack Bar family product that is not on the affected list. Provisional wording — founder/legal approval required before launch.',
      };
    default:
      return { title_display: '', body_display: '', why_display: '' };
  }
}

// Retain month/year constants for tests
export const MILO_MVP_BB = { month: MILO_BB_MONTH, year: MILO_BB_YEAR };
