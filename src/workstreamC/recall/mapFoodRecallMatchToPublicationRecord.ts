/**
 * Map FoodRecallMatchResult → DynamicSignalPublicationRecord (Safety only).
 */

import type { DynamicSignalPublicationRecord } from '../../dynamicSignals/publish/types';
import { provisionalCopyForMatchState } from './evaluateFoodRecallMatch';
import type { FoodRecallMatchResult } from './types';

const VALID_FAR = '2099-12-31T00:00:00.000Z';

export function mapFoodRecallMatchToPublicationRecord(
  match: FoodRecallMatchResult
): DynamicSignalPublicationRecord | null {
  if (match.match_state === 'not_applicable') return null;

  const copy = provisionalCopyForMatchState(match.match_state);
  return {
    signal_id: match.signal_id,
    dedupe_key: match.dedupe_key,
    signal_class: 'safety_regulatory',
    signal_publication_state: 'publishable',
    resolution_key: { gtin: match.scanned_gtin, market_key: 'AU' },
    state: {
      confidence_state: 'confirmed',
      review_state: 'reviewed',
      resolution_status: 'resolved',
    },
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
    },
  };
}
