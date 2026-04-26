import type { MarketKeyResolution, NormativeSignalClass } from '../../contracts/phase6/enums';
import type { IngestionCandidateLifecycle } from './ingestionCandidateLifecycle';

/**
 * Typed **candidate** after normalizing a source record. Maps toward Document 4/5
 * `DynamicSignalAttributionObject` in 5B — this shape deliberately **omits** `signal_id`,
 * `dedupe_key` (5B may derive), and **`signal_publication_state`** (5B only).
 */
export interface IngestedSignalCandidate {
  /** Same as `idempotency_key` in this slice — stable handle for the candidate row. */
  candidate_id: string;
  /** Deterministic key for idempotent upsert: source + upstream id + class. */
  idempotency_key: string;
  source_system: string;
  source_record_id: string;
  lineage: {
    /** Stable handle for this logical candidate across re-ingests. */
    lineage_reference: string;
    /** Monotonic trace refs (e.g. per ingestion run) — not raw payload dumps. */
    source_refs: string[];
  };
  signal_class: NormativeSignalClass;
  resolution_key: { gtin: string; market_key: MarketKeyResolution };
  ingestion: {
    candidate_lifecycle: IngestionCandidateLifecycle;
    first_ingested_at: string;
    last_ingested_at: string;
    ingestion_run_id: string;
  };
  /**
   * Ingestion-level change detection only. **Not** final signal identity, not `dedupe_key`, not
   * publication identity — 5B must not treat this as authoritative for public dedupe.
   */
  content_summary: { title: string; href?: string; raw_fingerprint: string };
}

export interface SourceRecordIngestionInput {
  source_system: string;
  source_record_id: string;
  signal_class: NormativeSignalClass;
  resolution_key: { gtin: string; market_key: MarketKeyResolution };
  title: string;
  href?: string;
  /** Optional body for fingerprinting when title alone is not enough. */
  content_text?: string;
}
