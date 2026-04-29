/**
 * Assembles `FrozenBenchmarkAttributionObject` instances **only** from validated B-Data rows plus
 * fixed Phase 6 eligibility rules. Does not resolve owners from Workstream A, catalogue strings,
 * or dynamic identity facts.
 */

import type { BenchmarkSnapshot } from '../../benchmark/types';
import type { FrozenBenchmarkAttributionObject } from '../../benchmark/types';
import type { ConfidenceState, FreezeStatus, ResolutionStatus, ReviewState } from '../../contracts/phase6/enums';
import { isEthicsScoringEligibleState } from '../../benchmark/ethicsScoringEligibility';
import type { BenchmarkEntityRow } from './bDataTypes';
import { releaseFromRecord } from './bDataTypes';
import type { CsvRecord } from './bDataCsv';

export interface AssembleFrozenAttributionInput {
  /** Rows from benchmark_releases.csv */
  releaseRows: CsvRecord[];
  /** Frozen benchmark owner facts from B-Data entity row — never inferred from A.*/
  entity: BenchmarkEntityRow;
  /** canonical_brand_id for Doc 5 row key — supplied by caller from B-Data/crosswalk only */
  subjectCanonicalBrandId: string;
  /** GTIN or other stable lineage token for freeze.lineage_reference */
  lineageToken: string;
  /** Optional eligibility-driving state overrides (still bounded enums). */
  overrides?: Partial<{
    confidence_state: ConfidenceState;
    review_state: ReviewState;
    resolution_status: ResolutionStatus;
    blocker_flags: string[];
  }>;
}

function pickReleaseForBenchmark(releaseRows: CsvRecord[], benchmarkName: string): BenchmarkSnapshot | null {
  const parsed = releaseRows.map(releaseFromRecord).filter((r) => r.benchmark_name === benchmarkName);
  const r = parsed[0];
  if (!r) return null;
  return {
    benchmark_name: benchmarkName as 'BBFAW' | 'KTC',
    benchmark_cycle: r.benchmark_cycle,
    snapshot_version: r.snapshot_version,
    ownership_cutoff_date: r.ownership_cutoff_date,
    freeze_status: r.freeze_status as FreezeStatus,
    methodology_ref: r.methodology_ref,
    seed_ref: r.seed_ref,
  };
}

export function assembleFrozenBenchmarkAttributionFromBData(input: AssembleFrozenAttributionInput): FrozenBenchmarkAttributionObject | null {
  const bm = input.entity.benchmark_name as 'BBFAW' | 'KTC';
  const snapshot = pickReleaseForBenchmark(input.releaseRows, bm);
  if (!snapshot) return null;

  const confidence_state = input.overrides?.confidence_state ?? 'strong';
  const review_state = input.overrides?.review_state ?? 'reviewed';
  const resolution_status = input.overrides?.resolution_status ?? 'resolved';
  const blocker_flags = input.overrides?.blocker_flags ?? [];

  const ethics_scoring_eligible = isEthicsScoringEligibleState({
    freezeStatus: snapshot.freeze_status,
    reviewState: review_state,
    resolutionStatus: resolution_status,
    blockerFlags: blocker_flags,
  });

  const out: FrozenBenchmarkAttributionObject = {
    snapshot_ref: {
      benchmark_name: bm,
      benchmark_cycle: snapshot.benchmark_cycle,
      snapshot_version: snapshot.snapshot_version,
      ownership_cutoff_date: snapshot.ownership_cutoff_date,
    },
    subject_resolution: {
      canonical_brand_id: input.subjectCanonicalBrandId,
      benchmark_owner_entity_id: input.entity.benchmark_owner_entity_id,
      benchmark_owner_legal_name: input.entity.benchmark_owner_legal_name,
    },
    comparison_context: {
      ownership_divergence_flag: false,
    },
    state: {
      confidence_state,
      review_state,
      resolution_status,
    },
    eligibility: {
      ethics_scoring_eligible,
      blocker_flags,
    },
    freeze: {
      freeze_status: snapshot.freeze_status,
      lineage_reference: `${bm}:${snapshot.snapshot_version}:${input.lineageToken}`,
    },
  };

  return Object.freeze({
    ...out,
    snapshot_ref: Object.freeze({ ...out.snapshot_ref }),
    subject_resolution: Object.freeze({ ...out.subject_resolution }),
    comparison_context: Object.freeze({ ...out.comparison_context }),
    state: Object.freeze({ ...out.state }),
    eligibility: Object.freeze({ ...out.eligibility }),
    freeze: Object.freeze({ ...out.freeze }),
  }) as FrozenBenchmarkAttributionObject;
}
