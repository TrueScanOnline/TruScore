import { classAllowsPublishable, initialSignalPublicationState } from './classGatePolicy';
import { buildPublicationDedupeKey, buildSignalId } from './signalIdentity';
import type { IngestedSignalCandidate } from '../ingest/types';
import type { IngestionClock } from '../ingest/ingestionClock';
import type { DynamicSignalPublicationRecord, MyChoicesChainContext } from './types';
import { computeValidUntilIso, isPastValidUntil } from './validityPolicy';
import { fnv1a32Hex } from './stringHash';

type PublicationIntent =
  | { type: 'to_publishable' }
  | { type: 'to_held_for_review' }
  | { type: 'to_suppressed' }
  | { type: 'to_expired' }
  | { type: 'to_editorial_held' };

/**
 * **5B** — the only place that may assign `signal_id`, `dedupe_key`, and `signal_publication_state`
 * from a 5A candidate. 5A has no `signal_id`; callers must not merge publication fields in the ingester.
 */
export function materializePublicationFromCandidate(
  candidate: IngestedSignalCandidate,
  state: DynamicSignalPublicationRecord['state'],
  input: { clock: IngestionClock; myChoicesContext?: MyChoicesChainContext }
): DynamicSignalPublicationRecord {
  const dedupe_key = buildPublicationDedupeKey(candidate);
  const signal_id = buildSignalId(dedupe_key);
  const pub = initialSignalPublicationState(candidate.signal_class, state, input.myChoicesContext);
  return applyMislinkPublicationCapIfNeeded({
    signal_id,
    dedupe_key,
    signal_class: candidate.signal_class,
    signal_publication_state: pub,
    resolution_key: candidate.resolution_key,
    state,
    lineage_reference: `phase6:pub:signal:${signal_id}`,
    ingestion_candidate_lineage_ref: candidate.lineage.lineage_reference,
    source_system: candidate.source_system,
    source_record_id: candidate.source_record_id,
    source_idempotency_key: candidate.idempotency_key,
    staleness: { valid_until: computeValidUntilIso(candidate.signal_class, input.clock) },
    editorial: { priority: 0, due_at: null, last_reviewed_at: null },
    mislink: { open_report_count: 0, last_event_at: null },
  });
}

function applyMislinkPublicationCapIfNeeded(
  r: DynamicSignalPublicationRecord
): DynamicSignalPublicationRecord {
  if (r.mislink.open_report_count === 0) return r;
  if (r.signal_publication_state === 'publishable') {
    return { ...r, signal_publication_state: 'held_for_review' };
  }
  return r;
}

export function recordMislinkReport(
  record: DynamicSignalPublicationRecord,
  clock: IngestionClock
): DynamicSignalPublicationRecord {
  const when = clock.nowIso();
  return applyMislinkPublicationCapIfNeeded({
    ...record,
    mislink: { open_report_count: record.mislink.open_report_count + 1, last_event_at: when },
    editorial: {
      ...record.editorial,
      priority: Math.max(record.editorial.priority, 1),
      due_at: record.editorial.due_at ?? when,
    },
  });
}

export function scheduleEditorial(
  record: DynamicSignalPublicationRecord,
  whenIso: string,
  priority: number
): DynamicSignalPublicationRecord {
  return {
    ...record,
    signal_publication_state: record.signal_publication_state === 'expired' ? 'expired' : 'held_for_review',
    editorial: { ...record.editorial, due_at: whenIso, priority: Math.max(record.editorial.priority, priority) },
  };
}

/**
 * Staleness: if past `valid_until` and the record is not already **terminal** (`expired` / `suppressed`),
 * transition to `expired`. **Clock-injected** — not `Date.now()`.
 */
export function applyStalenessExpiryIfDue(
  record: DynamicSignalPublicationRecord,
  clock: IngestionClock
): DynamicSignalPublicationRecord {
  if (record.signal_publication_state === 'expired' || record.signal_publication_state === 'suppressed') {
    return record;
  }
  if (isPastValidUntil(record.staleness.valid_until, clock)) {
    if (
      record.signal_publication_state === 'candidate' ||
      record.signal_publication_state === 'held_for_review' ||
      record.signal_publication_state === 'publishable'
    ) {
      return { ...record, signal_publication_state: 'expired' };
    }
  }
  return record;
}

/**
 * 5B-only FSM step (publication, not 5A ingestion). Blocked/needs_review and class gates
 * re-validated; mislink blocks `publishable`.
 */
export function tryApplyPublicationIntent(
  record: DynamicSignalPublicationRecord,
  intent: PublicationIntent,
  ctx: { clock: IngestionClock; myChoicesContext?: MyChoicesChainContext }
):
  | { ok: true; record: DynamicSignalPublicationRecord }
  | { ok: false; reason: string } {
  if (record.signal_publication_state === 'expired') {
    return { ok: false, reason: 'expired_is_terminal' };
  }

  if (intent.type === 'to_expired') {
    return { ok: true, record: { ...record, signal_publication_state: 'expired' } };
  }
  if (intent.type === 'to_suppressed') {
    return { ok: true, record: { ...record, signal_publication_state: 'suppressed' } };
  }
  if (intent.type === 'to_held_for_review' || intent.type === 'to_editorial_held') {
    return { ok: true, record: { ...record, signal_publication_state: 'held_for_review' } };
  }

  if (intent.type === 'to_publishable') {
    if (record.mislink.open_report_count > 0) {
      return { ok: false, reason: 'mislink_blocks_publishable' };
    }
    if (isPastValidUntil(record.staleness.valid_until, ctx.clock)) {
      return { ok: false, reason: 'past_valid_until' };
    }
    if (record.state.resolution_status === 'blocked' || record.state.resolution_status === 'needs_review') {
      return { ok: false, reason: 'doc5_no_publishable_for_blocked_or_needs_review' };
    }
    const g = classAllowsPublishable(record.signal_class, record.state, ctx.myChoicesContext);
    if (!g.allowed) {
      return { ok: false, reason: g.reason };
    }
    return { ok: true, record: { ...record, signal_publication_state: 'publishable' } };
  }

  return { ok: false, reason: 'unhandled_intent' };
}

/** Fingerprint for tests that 5A cannot set publication fields (stable hash of 5A-only data). */
export function fingerprint5ANonPublicationData(candidate: IngestedSignalCandidate): string {
  return fnv1a32Hex(`${candidate.idempotency_key}|${candidate.content_summary.raw_fingerprint}`);
}
