/**
 * Map FoodRecallMatchResult → DynamicSignalPublicationRecord (Safety only).
 *
 * Controlled-test / synthetic GTINs must NOT appear as consumer-verified facts.
 * They retain Skeleton UAT visibility via an explicit uat_only override that cannot
 * enter a production profile (production lacks WORKSTREAMC_SKELETON_UAT=1).
 * Only verified_for_consumer may use confirmed / reviewed / resolved production metadata.
 */

import type { DynamicSignalPublicationRecord } from '../../dynamicSignals/publish/types';
import { provisionalCopyForMatchState } from './evaluateFoodRecallMatch';
import type { FoodRecallMatchResult, GtinVerificationStatus } from './types';

const VALID_FAR = '2099-12-31T00:00:00.000Z';

function isConsumerVerified(status?: GtinVerificationStatus): boolean {
  return status === 'verified_for_consumer';
}

export function publicationStateForGtinVerification(
  status?: GtinVerificationStatus
): DynamicSignalPublicationRecord['state'] {
  if (isConsumerVerified(status)) {
    return {
      confidence_state: 'confirmed',
      review_state: 'reviewed',
      resolution_status: 'resolved',
    };
  }
  // Controlled / synthetic / unknown — provisional, needs review; not consumer-verified facts
  return {
    confidence_state: 'low',
    review_state: 'provisional',
    resolution_status: 'resolved_with_warning',
  };
}

export function mapFoodRecallMatchToPublicationRecord(
  match: FoodRecallMatchResult
): DynamicSignalPublicationRecord | null {
  if (match.match_state === 'not_applicable') return null;

  const copy = provisionalCopyForMatchState(match.match_state);
  const verified = isConsumerVerified(match.gtin_verification_status);
  return {
    signal_id: match.signal_id,
    dedupe_key: match.dedupe_key,
    signal_class: 'safety_regulatory',
    signal_publication_state: 'publishable',
    resolution_key: { gtin: match.scanned_gtin, market_key: 'AU' },
    state: publicationStateForGtinVerification(match.gtin_verification_status),
    lineage_reference: `phase6:pub:signal:${match.signal_id}`,
    source_system: 'SRC_FSANZ_RECALLS',
    source_record_id: match.recall_notice_id,
    source_record_url: match.official_source_url,
    source_idempotency_key: match.dedupe_key,
    staleness: { valid_until: VALID_FAR },
    editorial: { priority: 0, due_at: null, last_reviewed_at: null },
    mislink: { open_report_count: 0, last_event_at: null },
    skeleton_card_copy: copy,
    food_recall: {
      match_state: match.match_state,
      severity_override: match.severity,
      needs_batch_entry: match.needs_batch_entry,
      recall_notice_id: match.recall_notice_id,
      gtin_verification_status: match.gtin_verification_status,
      uat_only_override: !verified,
    },
  };
}
