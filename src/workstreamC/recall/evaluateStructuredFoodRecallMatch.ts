/**
 * Generic exact-GTIN food-recall eligibility evaluator.
 * Pack-driven — does not originate Signal content. Callers must authorise via a governed Asset Signal.
 */

import { normalizeBatchCode, normalizeBestBeforeMonthYear } from './normalizeBatchDate';
import type {
  FoodRecallEvaluationClock,
  FoodRecallInputStatus,
  FoodRecallMatchResult,
  FoodRecallMatchState,
  FoodRecallSubmittedMarkings,
  GtinVerificationStatus,
} from './types';

export type StructuredRecallAffectedVariant = {
  recall_variant_id: string;
  gtin: string;
  listed_batch_codes: readonly string[];
  gtin_verification_status: GtinVerificationStatus;
  official_product_name?: string;
  pack_size?: string;
};

export type StructuredRecallRelatedGtin = {
  gtin: string;
  gtin_verification_status: GtinVerificationStatus;
};

/** Smallest durable eligibility pack bound to a governed Asset Safety Signal. */
export type StructuredFoodRecallNotice = {
  recall_notice_id: string;
  /** Must equal the authorising Asset signal_id when used on the production path. */
  signal_id: string;
  official_source_url: string;
  hazard: string;
  consumer_action: string;
  bb_month: number;
  bb_year: number;
  recall_product_family_id?: string;
  affected_variants: readonly StructuredRecallAffectedVariant[];
  related_family_gtins?: readonly StructuredRecallRelatedGtin[];
};

function stableDedupeKey(noticeId: string, gtin: string): string {
  return `p6|food_recall|${noticeId}|${gtin}`;
}

function severityFor(state: FoodRecallMatchState): 'high' | 'medium' | 'low' {
  switch (state) {
    case 'confirmed_affected':
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

function baseResult(
  partial: Omit<
    FoodRecallMatchResult,
    'dedupe_key' | 'severity' | 'consumer_message_key' | 'needs_batch_entry'
  > & {
    needs_batch_entry?: boolean;
  }
): FoodRecallMatchResult {
  const state = partial.match_state;
  return {
    ...partial,
    dedupe_key: stableDedupeKey(partial.recall_notice_id, partial.scanned_gtin),
    severity: severityFor(state),
    consumer_message_key: `food_recall.state.${state}`,
    needs_batch_entry: partial.needs_batch_entry ?? state === 'batch_check_required',
  };
}

/** Classify batch + BB input (both required for confirmation). */
export function classifyFoodRecallMarkingInput(markings?: FoodRecallSubmittedMarkings | null): {
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

function isBatchListed(batchNormalized: string, variant: StructuredRecallAffectedVariant): boolean {
  const listed = new Set(variant.listed_batch_codes.map((b) => b.toUpperCase()));
  return listed.has(batchNormalized.toUpperCase());
}

/**
 * Evaluate GTIN/batch/date eligibility against a structured notice pack.
 * Does not consult env flags or Asset publication state — callers gate those.
 */
export function evaluateStructuredFoodRecallMatch(input: {
  notice: StructuredFoodRecallNotice;
  gtin: string;
  markings?: FoodRecallSubmittedMarkings | null;
  clock: FoodRecallEvaluationClock;
}): FoodRecallMatchResult {
  const gtin = (input.gtin || '').trim();
  const evaluated_at = input.clock.nowIso();
  const notice = input.notice;
  const common = {
    signal_id: notice.signal_id,
    recall_notice_id: notice.recall_notice_id,
    scanned_gtin: gtin,
    official_source_url: notice.official_source_url,
    hazard: notice.hazard,
    consumer_action: notice.consumer_action,
    evaluated_at,
  };

  const affected = notice.affected_variants.find((v) => v.gtin === gtin);
  if (affected) {
    const classified = classifyFoodRecallMarkingInput(input.markings);
    if (classified.status !== 'complete') {
      return baseResult({
        ...common,
        match_state: 'batch_check_required',
        input_status: classified.status,
        matched_gtin: gtin,
        recall_variant_id: affected.recall_variant_id,
        recall_product_family_id: notice.recall_product_family_id,
        gtin_verification_status: affected.gtin_verification_status,
        submitted_batch_raw: input.markings?.batchCodeRaw ?? undefined,
        submitted_batch_normalized: classified.batchNormalized,
        submitted_bb_month: classified.bbMonth,
        submitted_bb_year: classified.bbYear,
        match_reason_code: `markings_${classified.status}`,
        needs_batch_entry: true,
      });
    }

    const batchOk = isBatchListed(classified.batchNormalized!, affected);
    const bbOk =
      classified.bbMonth === notice.bb_month && classified.bbYear === notice.bb_year;
    if (batchOk && bbOk) {
      return baseResult({
        ...common,
        match_state: 'confirmed_affected',
        input_status: 'complete',
        matched_gtin: gtin,
        recall_variant_id: affected.recall_variant_id,
        recall_product_family_id: notice.recall_product_family_id,
        gtin_verification_status: affected.gtin_verification_status,
        submitted_batch_raw: input.markings?.batchCodeRaw ?? undefined,
        submitted_batch_normalized: classified.batchNormalized,
        submitted_bb_month: classified.bbMonth,
        submitted_bb_year: classified.bbYear,
        match_reason_code: 'variant_batch_and_bb_match',
        needs_batch_entry: false,
      });
    }

    return baseResult({
      ...common,
      match_state: 'batch_not_listed',
      input_status: 'complete',
      matched_gtin: gtin,
      recall_variant_id: affected.recall_variant_id,
      recall_product_family_id: notice.recall_product_family_id,
      gtin_verification_status: affected.gtin_verification_status,
      submitted_batch_raw: input.markings?.batchCodeRaw ?? undefined,
      submitted_batch_normalized: classified.batchNormalized,
      submitted_bb_month: classified.bbMonth,
      submitted_bb_year: classified.bbYear,
      match_reason_code: batchOk
        ? 'complete_bb_nonmatching'
        : 'complete_batch_not_on_this_variant',
      needs_batch_entry: false,
    });
  }

  const related = (notice.related_family_gtins ?? []).find((r) => r.gtin === gtin);
  if (related) {
    return baseResult({
      ...common,
      match_state: 'related_recall_variant_unconfirmed',
      recall_product_family_id: notice.recall_product_family_id,
      gtin_verification_status: related.gtin_verification_status,
      match_reason_code: 'reviewed_family_membership_not_affected_variant',
      needs_batch_entry: false,
    });
  }

  return baseResult({
    ...common,
    match_state: 'not_applicable',
    match_reason_code: 'not_affected_gtin_and_not_family_member',
    needs_batch_entry: false,
  });
}
