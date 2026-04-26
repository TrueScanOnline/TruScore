import type {
  ConfidenceState,
  MarketKeyResolution,
  NormativeSignalClass,
  ResolutionStatus,
  ReviewState,
  SignalPublicationState,
} from '../../contracts/phase6/enums';

/**
 * **Slice 5B** — dynamic signal as persisted / governed (Doc 4/5). Distinct from 5A
 * `IngestedSignalCandidate`: `signal_id`, `dedupe_key`, and `signal_publication_state` exist **only**
 * on this object; 5A cannot set them (types + engine enforce).
 */
export interface DynamicSignalPublicationRecord {
  signal_id: string;
  /** Publication-level dedupe (may differ from 5A `idempotency_key`). */
  dedupe_key: string;
  signal_class: NormativeSignalClass;
  signal_publication_state: SignalPublicationState;
  resolution_key: { gtin: string; market_key: MarketKeyResolution };
  state: {
    confidence_state: ConfidenceState;
    review_state: ReviewState;
    resolution_status: ResolutionStatus;
  };
  /** Deterministic: `phase6:pub:signal:{signal_id}` — not free-form. */
  lineage_reference: string;
  /** Provenance: 5A `phase6:ingest:candidate:…` when materialized from candidate. */
  ingestion_candidate_lineage_ref?: string;
  source_system?: string;
  source_record_id?: string;
  /** Trace back to 5A identity for dedupe analysis (not a secret key). */
  source_idempotency_key: string;
  /** 5B staleness: relative to this class; evaluated with injected clock, not `Date.now()` in tests. */
  staleness: {
    valid_until: string;
  };
  editorial: {
    /** Optional queue / SLA hooks per Doc 5. */
    priority: number;
    due_at: string | null;
    last_reviewed_at: string | null;
  };
  /** Mislink / feedback: presence forces downgrade from `publishable` in engine policy. */
  mislink: {
    open_report_count: number;
    last_event_at: string | null;
  };
}

export type MyChoicesChainContext = {
  /** If false, `my_choices_chain` cannot become `publishable` (pack: chain-dependent). */
  is_chain_linked: boolean;
};
