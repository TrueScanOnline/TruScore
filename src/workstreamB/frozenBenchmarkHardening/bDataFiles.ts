/**
 * Workstream B — B-Data filenames (CSV pack contract).
 */

export const WORKSTREAM_B_FILES = {
  BENCHMARK_RELEASES: 'benchmark_releases.csv',
  BENCHMARK_ENTITIES: 'benchmark_entities.csv',
  BENCHMARK_SCORES: 'benchmark_scores.csv',
  BENCHMARK_BRAND_MAPS: 'benchmark_brand_maps.csv',
  BENCHMARK_ALIAS_MAPS: 'benchmark_alias_maps.csv',
  BENCHMARK_TO_A_IDENTITY_CROSSWALK: 'benchmark_to_a_identity_crosswalk.csv',
  BENCHMARK_EXCEPTIONS: 'benchmark_exceptions.csv',
  BENCHMARK_CORRECTION_LOG: 'benchmark_correction_log.csv',
} as const;

export type WorkstreamBInputFileName = (typeof WORKSTREAM_B_FILES)[keyof typeof WORKSTREAM_B_FILES];

export const WORKSTREAM_B_REQUIRED_FILES: readonly WorkstreamBInputFileName[] = [
  WORKSTREAM_B_FILES.BENCHMARK_RELEASES,
  WORKSTREAM_B_FILES.BENCHMARK_ENTITIES,
  WORKSTREAM_B_FILES.BENCHMARK_SCORES,
  WORKSTREAM_B_FILES.BENCHMARK_BRAND_MAPS,
  WORKSTREAM_B_FILES.BENCHMARK_ALIAS_MAPS,
] as const;

export const WORKSTREAM_B_OPTIONAL_FILES: readonly WorkstreamBInputFileName[] = [
  WORKSTREAM_B_FILES.BENCHMARK_CORRECTION_LOG,
  WORKSTREAM_B_FILES.BENCHMARK_TO_A_IDENTITY_CROSSWALK,
  WORKSTREAM_B_FILES.BENCHMARK_EXCEPTIONS,
] as const;

export const WORKSTREAM_B_OUTPUT_FILES = {
  LOAD_FAILURE_REPORT: 'load_failure_report.json',
  VALIDATION_REPORT: 'validation_report.json',
  FROZEN_BENCHMARK_DIAGNOSTICS: 'frozen_benchmark_diagnostics.json',
  VALIDATION_SUMMARY: 'validation_summary.json',
} as const;
