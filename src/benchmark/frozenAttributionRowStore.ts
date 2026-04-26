import type { FrozenBenchmarkAttributionObject } from './types';
import { frozenAttributionRowKey } from './frozenAttributionRowKey';
import { isInPlaceMutationOnFrozen, logRegisterInitial, logSupersede, type FreezeWriteSource } from './freezeGuards';
import { computeBenchmarkAttributionDiff, type BenchmarkAttributionVersionDiff } from './auditAttributionDiff';

type Row = {
  readonly value: Readonly<FrozenBenchmarkAttributionObject>;
  isSuperseded: boolean;
};

/**
 * In-memory stand-in for a **Slice 4–era MVP**: internal correctness, tests, and a migration
 * target for a real table — **not** a claim of full, authoritative production persistence
 * enforcement (rLS, row locks, out-of-app writers). A future persistence layer should reapply the
 * same invariants. Direct mutation of an attached `FrozenBenchmarkAttributionObject` remains
 * architecturally wrong even if not every runtime can prohibit it (see phase6 Slice 4 note).
 */
export class FrozenAttributionRowStore {
  private readonly byKey = new Map<string, Row>();

  get(key: string): Row | null {
    return this.byKey.get(key) ?? null;
  }

  size(): number {
    return this.byKey.size;
  }

  /** Keys present (including superseded) — for tests and admin introspection. */
  keys(): string[] {
    return Array.from(this.byKey.keys());
  }

  /**
   * Idempotent in tests: clear all rows and metadata.
   */
  resetForTests(): void {
    this.byKey.clear();
  }

  registerInitial(
    attribution: FrozenBenchmarkAttributionObject,
    source: FreezeWriteSource
  ): { ok: true; key: string } | { ok: false; reason: string } {
    const k = frozenAttributionRowKey(attribution);
    if (this.byKey.has(k)) return { ok: false, reason: 'row_already_registered' };
    this.byKey.set(k, { value: attribution, isSuperseded: false });
    logRegisterInitial(k, source, 'initial frozen benchmark row registered');
    return { ok: true, key: k };
  }

  tryInPlaceUpdate(
    nextValue: FrozenBenchmarkAttributionObject,
    source: FreezeWriteSource
  ): { ok: true } | { ok: false; reason: string } {
    const k = frozenAttributionRowKey(nextValue);
    const row = this.byKey.get(k);
    if (!row) return { ok: false, reason: 'row_not_found' };
    if (row.isSuperseded) {
      return { ok: false, reason: 'cannot_in_place_on_superseded_key' };
    }
    const guard = isInPlaceMutationOnFrozen(
      row.value,
      nextValue,
      source,
      row.isSuperseded
    );
    if (guard.blocked) {
      return { ok: false, reason: guard.reason };
    }
    this.byKey.set(k, { value: nextValue, isSuperseded: false });
    return { ok: true };
  }

  applySupersedingCorrection(
    previous: FrozenBenchmarkAttributionObject,
    replacement: FrozenBenchmarkAttributionObject,
    input: { rationale: string; approver_ref: string; source: FreezeWriteSource }
  ):
    | { ok: true; diff: BenchmarkAttributionVersionDiff; from_key: string; to_key: string }
    | { ok: false; reason: string } {
    const fromKey = frozenAttributionRowKey(previous);
    const toKey = frozenAttributionRowKey(replacement);
    if (fromKey === toKey) {
      return { ok: false, reason: 'supersession_requires_different_composite_key_new_snapshot_version' };
    }
    const row = this.byKey.get(fromKey);
    if (!row) return { ok: false, reason: 'previous_row_not_found' };
    if (row.isSuperseded) return { ok: false, reason: 'previous_row_already_superseded' };
    if (this.byKey.has(toKey)) return { ok: false, reason: 'replacement_key_already_exists' };
    this.byKey.set(fromKey, { value: row.value, isSuperseded: true });
    this.byKey.set(toKey, { value: replacement, isSuperseded: false });
    const diff = computeBenchmarkAttributionDiff(row.value, replacement, {
      rationale: input.rationale,
      approver_ref: input.approver_ref,
    });
    logSupersede(fromKey, toKey, input.source, `supersession ${diff.diff_id}`);
    return { ok: true, diff, from_key: fromKey, to_key: toKey };
  }
}
