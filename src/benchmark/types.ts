import type {
  ConfidenceState,
  FreezeStatus,
  ResolutionStatus,
  ReviewState,
} from '../contracts/phase6/enums';

export type BenchmarkName = 'BBFAW' | 'KTC';

export interface BenchmarkSnapshot {
  benchmark_name: BenchmarkName;
  benchmark_cycle: string;
  snapshot_version: string;
  ownership_cutoff_date: string; // ISO date
  freeze_status: FreezeStatus;
  methodology_ref: string;
  seed_ref: string;
}

export interface FrozenBenchmarkAttributionObject {
  snapshot_ref: {
    benchmark_name: BenchmarkName;
    benchmark_cycle: string;
    snapshot_version: string;
    ownership_cutoff_date: string;
  };
  subject_resolution: {
    canonical_brand_id: string;
    benchmark_owner_entity_id: string;
    benchmark_owner_legal_name: string;
  };
  comparison_context: {
    current_owner_entity_id?: string;
    ownership_divergence_flag: boolean;
  };
  state: {
    confidence_state: ConfidenceState;
    review_state: ReviewState;
    resolution_status: ResolutionStatus;
  };
  eligibility: {
    ethics_scoring_eligible: boolean;
    blocker_flags: string[];
  };
  freeze: {
    freeze_status: FreezeStatus;
    lineage_reference: string;
  };
}

