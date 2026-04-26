import type { FrozenBenchmarkAttributionObject } from './types';

/**
 * Deterministic per-row key for a frozen **benchmark** attribution. Document 5 ties uniqueness to
 * a benchmark snapshot and the subject (canonical brand) — not GTIN, not market, not live owner; those
 * live in other fields so the benchmark table cannot be under-keyed into ambiguous collisions.
 *
 * Composition (fixed order, `|` delimiters, stable for logs and in-memory store):
 * 1) `snapshot_ref.benchmark_name` — e.g. BBFAW / KTC
 * 2) `snapshot_ref.benchmark_cycle` — e.g. 2024
 * 3) `snapshot_ref.snapshot_version` — e.g. bbfaw-2024-v1 (distinguishing supersessions)
 * 4) `subject_resolution.canonical_brand_id` — subject resolution scope
 *
 * Do not add fields here without pack approval; if later the locked model requires another stable
 * discriminator (e.g. explicit `market_key` in benchmark scope), that must be a deliberate
 * spec change, not a silent suffix.
 */
export function frozenAttributionRowKey(a: FrozenBenchmarkAttributionObject): string {
  const s = a.snapshot_ref;
  const b = a.subject_resolution;
  return `${s.benchmark_name}|${s.benchmark_cycle}|${s.snapshot_version}|${b.canonical_brand_id}`;
}
