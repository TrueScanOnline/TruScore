import type { IngestedSignalCandidate } from '../ingest/types';
import { fnv1a32Hex } from './stringHash';

/**
 * **Publication `dedupe_key`** identity: collision/prevalence key used for publication-level
 * dedupe/precedence. Product + market + class + **source** identity. Broader in intent than 5A
 * `idempotency_key` (source-record scoped only) — 5B may use this in `dynamic_signal_record` index.
 * Related to `signal_id`, but **not interchangeable**.
 */
export function buildPublicationDedupeKey(candidate: IngestedSignalCandidate): string {
  const { resolution_key, signal_class, source_system, source_record_id } = candidate;
  return `p6|${signal_class}|${resolution_key.gtin}|${resolution_key.market_key}|${source_system}|${source_record_id}`;
}

/**
 * **Record identity** (`signal_id`) for the dynamic publication record (Doc 5: unique key).
 * Derived from `dedupe_key` for determinism, but represents the record identity, not the dedupe
 * collision bucket itself. **Not** `raw_fingerprint` from 5A.
 */
export function buildSignalId(dedupeKey: string): string {
  return `p6s-${fnv1a32Hex(dedupeKey)}`;
}
