import type { BenchmarkName, BenchmarkSnapshot } from './types';

/**
 * Bounded MVP snapshot registry: sufficient for current Phase 6 slices in-repo; not the final
 * governance / persistence / approval pipeline for production benchmark cycles.
 */
const SNAPSHOT_REGISTRY: Record<BenchmarkName, BenchmarkSnapshot> = {
  BBFAW: {
    benchmark_name: 'BBFAW',
    benchmark_cycle: '2025',
    snapshot_version: 'bbfaw-2025-v1',
    ownership_cutoff_date: '2025-11-30',
    freeze_status: 'frozen',
    methodology_ref: 'bbfaw-2025-method',
    seed_ref: 'bbfaw2025Canonical',
  },
  KTC: {
    benchmark_name: 'KTC',
    benchmark_cycle: '2026',
    snapshot_version: 'ktc-2026-v2',
    ownership_cutoff_date: '2025-09-30',
    freeze_status: 'frozen',
    methodology_ref: 'ktc-2026-method',
    seed_ref: 'ktcParents',
  },
};

export function selectBenchmarkSnapshot(benchmarkName: BenchmarkName): BenchmarkSnapshot {
  return SNAPSHOT_REGISTRY[benchmarkName];
}

