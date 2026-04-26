import type { FrozenBenchmarkAttributionObject } from './types';
import { frozenAttributionRowKey } from './frozenAttributionRowKey';

export type AttributionFieldChange = { path: string; from: string; to: string };

export interface BenchmarkAttributionVersionDiff {
  from_key: string;
  to_key: string;
  field_changes: AttributionFieldChange[];
  /** Human rationale for supersession (e.g. correction workflow). */
  rationale: string;
  /** Accountable approver or system ref for audit. */
  approver_ref: string;
  created_at: string; // ISO
  diff_id: string;
}

let diffSeq = 0;
function nextDiffId(): string {
  diffSeq += 1;
  return `p6-diff-${diffSeq.toString(36).padStart(6, '0')}`;
}

export function resetAttributionDiffSequenceForTests(): void {
  diffSeq = 0;
}

/**
 * Comparison-oriented diff only: a bounded set of field paths, keys, ids, and rationale/approver —
 * not a dump of full record payloads. Keep it stable for audit logs; do not bloat with raw
 * snapshot blobs.
 */
export function computeBenchmarkAttributionDiff(
  from: FrozenBenchmarkAttributionObject,
  to: FrozenBenchmarkAttributionObject,
  input: { rationale: string; approver_ref: string; createdAt?: string }
): BenchmarkAttributionVersionDiff {
  const changes: AttributionFieldChange[] = [];
  const push = (path: string, a: string, b: string): void => {
    if (a !== b) changes.push({ path, from: a, to: b });
  };

  push('snapshot_version', from.snapshot_ref.snapshot_version, to.snapshot_ref.snapshot_version);
  push('benchmark_owner_entity_id', from.subject_resolution.benchmark_owner_entity_id, to.subject_resolution.benchmark_owner_entity_id);
  push('benchmark_owner_legal_name', from.subject_resolution.benchmark_owner_legal_name, to.subject_resolution.benchmark_owner_legal_name);
  push('ownership_divergence', String(from.comparison_context.ownership_divergence_flag), String(to.comparison_context.ownership_divergence_flag));
  push('ethics_scoring_eligible', String(from.eligibility.ethics_scoring_eligible), String(to.eligibility.ethics_scoring_eligible));
  push('freeze_status', from.freeze.freeze_status, to.freeze.freeze_status);

  return {
    from_key: frozenAttributionRowKey(from),
    to_key: frozenAttributionRowKey(to),
    field_changes: changes,
    rationale: input.rationale,
    approver_ref: input.approver_ref,
    created_at: input.createdAt ?? new Date().toISOString(),
    diff_id: nextDiffId(),
  };
}
