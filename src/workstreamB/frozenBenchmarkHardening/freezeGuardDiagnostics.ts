/**
 * Exercise existing freeze APIs — does not reimplement guard logic.
 */

import { FrozenAttributionRowStore } from '../../benchmark/frozenAttributionRowStore';
import {
  getFreezeGuardEvents,
  resetFreezeGuardEventsForTests,
  type FreezeWriteSource,
} from '../../benchmark/freezeGuards';
import type { FrozenBenchmarkAttributionObject } from '../../benchmark/types';
import { assembleFrozenBenchmarkAttributionFromBData } from './bFrozenAttributionAssembler';
import type { CsvRecord } from './bDataCsv';
import type { BenchmarkEntityRow } from './bDataTypes';

export interface FreezeGuardDiagnosticsResult {
  register_initial_ok: boolean;
  in_place_blocked: boolean;
  supersede_ok: boolean;
  correction_rows_processed: number;
  event_tail_count: number;
}

export function runFreezeGuardDiagnostics(input: {
  releaseRows: CsvRecord[];
  sampleEntity: BenchmarkEntityRow;
  /** Synthetic correction row count from B-Data file (report only). */
  correction_row_count: number;
  source?: FreezeWriteSource;
}): FreezeGuardDiagnosticsResult {
  const source = input.source ?? 'test';
  resetFreezeGuardEventsForTests();

  const base = assembleFrozenBenchmarkAttributionFromBData({
    releaseRows: input.releaseRows,
    entity: input.sampleEntity,
    subjectCanonicalBrandId: 'bdata:subject:key',
    lineageToken: 'diag-gtin',
  });
  if (!base) {
    return {
      register_initial_ok: false,
      in_place_blocked: false,
      supersede_ok: false,
      correction_rows_processed: input.correction_row_count,
      event_tail_count: 0,
    };
  }

  const store = new FrozenAttributionRowStore();
  const reg = store.registerInitial(base, source);
  const register_initial_ok = reg.ok === true;

  const inPlace = store.tryInPlaceUpdate(base, source);
  const in_place_blocked = inPlace.ok === false;

  const replacement = assembleFrozenBenchmarkAttributionFromBData({
    releaseRows: input.releaseRows.map((r) => {
      if (r.benchmark_name === input.sampleEntity.benchmark_name) {
        return { ...r, snapshot_version: `${r.snapshot_version}-superseding-test` };
      }
      return r;
    }),
    entity: input.sampleEntity,
    subjectCanonicalBrandId: 'bdata:subject:key-supersede',
    lineageToken: 'diag-gtin',
  });

  let supersede_ok = false;
  if (replacement && register_initial_ok) {
    const sup = store.applySupersedingCorrection(base, replacement, {
      rationale: 'workstream_b_scaffold_supersede_proof',
      approver_ref: 'ci',
      source,
    });
    supersede_ok = sup.ok === true;
  }

  const events = getFreezeGuardEvents();

  return {
    register_initial_ok,
    in_place_blocked,
    supersede_ok,
    correction_rows_processed: input.correction_row_count,
    event_tail_count: events.length,
  };
}

/** Deterministic pair for unit tests — independent of B-Data correction log content. */
export function buildDeterministicFrozenPair(input: {
  first: FrozenBenchmarkAttributionObject;
}): { second: FrozenBenchmarkAttributionObject } {
  const f = input.first;
  const second: FrozenBenchmarkAttributionObject = {
    ...f,
    snapshot_ref: {
      ...f.snapshot_ref,
      snapshot_version: `${f.snapshot_ref.snapshot_version}-next`,
    },
    subject_resolution: {
      ...f.subject_resolution,
      canonical_brand_id: `${f.subject_resolution.canonical_brand_id}-v2`,
    },
    freeze: { ...f.freeze, lineage_reference: `${f.freeze.lineage_reference}:v2` },
  };
  return { second: Object.freeze(second) as FrozenBenchmarkAttributionObject };
}
