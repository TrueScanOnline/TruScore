import type { CsvRecord } from './bDataCsv';

/** Parsed row shapes — strings from CSV; validation coerces checks. */

export interface BenchmarkReleaseRow {
  benchmark_name: string;
  benchmark_cycle: string;
  snapshot_version: string;
  ownership_cutoff_date: string;
  freeze_status: string;
  methodology_ref: string;
  seed_ref: string;
}

export interface BenchmarkEntityRow {
  entity_id: string;
  benchmark_name: string;
  entity_kind: string;
  display_name: string;
  benchmark_owner_entity_id: string;
  benchmark_owner_legal_name: string;
  notes: string;
}

export interface BenchmarkScoreRow {
  entity_id: string;
  benchmark_name: string;
  snapshot_version: string;
  bbfaw_tier: string;
  bbfaw_impact_rating: string;
  ktc_total_benchmark_score: string;
  ktc_rank: string;
  reference_url: string;
  year: string;
  source_lineage: string;
}

export function releaseFromRecord(r: CsvRecord): BenchmarkReleaseRow {
  return {
    benchmark_name: r.benchmark_name ?? '',
    benchmark_cycle: r.benchmark_cycle ?? '',
    snapshot_version: r.snapshot_version ?? '',
    ownership_cutoff_date: r.ownership_cutoff_date ?? '',
    freeze_status: r.freeze_status ?? '',
    methodology_ref: r.methodology_ref ?? '',
    seed_ref: r.seed_ref ?? '',
  };
}

export function entityFromRecord(r: CsvRecord): BenchmarkEntityRow {
  return {
    entity_id: r.entity_id ?? '',
    benchmark_name: r.benchmark_name ?? '',
    entity_kind: r.entity_kind ?? '',
    display_name: r.display_name ?? '',
    benchmark_owner_entity_id: r.benchmark_owner_entity_id ?? '',
    benchmark_owner_legal_name: r.benchmark_owner_legal_name ?? '',
    notes: r.notes ?? '',
  };
}

export function scoreFromRecord(r: CsvRecord): BenchmarkScoreRow {
  return {
    entity_id: r.entity_id ?? '',
    benchmark_name: r.benchmark_name ?? '',
    snapshot_version: r.snapshot_version ?? '',
    bbfaw_tier: r.bbfaw_tier ?? '',
    bbfaw_impact_rating: r.bbfaw_impact_rating ?? '',
    ktc_total_benchmark_score: r.ktc_total_benchmark_score ?? '',
    ktc_rank: r.ktc_rank ?? '',
    reference_url: r.reference_url ?? '',
    year: r.year ?? '',
    source_lineage: r.source_lineage ?? '',
  };
}
