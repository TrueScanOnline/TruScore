/**
 * Injected clock for recency / ordering tests (Doc 6 / Slice 5A). All time-sensitive **ingestion**
 * behavior must use the passed `IngestionClock` — do not call `Date.now()` in 5A ingest paths
 * (staleness for **publication** is Slice 5B, also clock-injected there).
 */
export interface IngestionClock {
  nowIso: () => string;
}

export function createSystemIngestionClock(): IngestionClock {
  return { nowIso: () => new Date().toISOString() };
}

export function createFixedIngestionClock(iso: string): IngestionClock {
  return { nowIso: () => iso };
}

/** Each call to `nowIso` returns the next string in order; last value repeats if exhausted. */
export function createSteppingIngestionClock(isoSequence: string[]): IngestionClock {
  let i = 0;
  return {
    nowIso: () => {
      if (isoSequence.length === 0) return new Date(0).toISOString();
      const idx = Math.min(i, isoSequence.length - 1);
      i += 1;
      return isoSequence[idx]!;
    },
  };
}
