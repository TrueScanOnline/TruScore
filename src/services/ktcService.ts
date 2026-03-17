/**
 * KTC (KnowTheChain) Service
 *
 * SOURCE OF TRUTH: Database files/ETHICS Pillar/KTC folder/ktcParents.json
 * Synced to: src/data/ethics/ktcParents.json (run yarn sync-ethics-data)
 *
 * This service provides KTC benchmark scores for ETHICS Pillar scoring.
 * Each match represents a parent company assessed in the 2026 KTC food & beverage benchmark.
 */

import { logger } from '../utils/logger';

const KTC_PARENTS = require('../data/ethics/ktcParents.json') as Array<{
  company_id: number;
  benchmark_year_parent_company: string;
  country?: string;
  region?: string;
  subindustry?: string;
  total_benchmark_score: number;
  rank_2025?: number;
}>;

export interface KTCParentData {
  companyId: number;
  parentName: string;
  country?: string;
  region?: string;
  subindustry?: string;
  /** KTC 2026 total benchmark score (0–100 in source; used for scaling ETHICS adjustment) */
  totalBenchmarkScore: number;
  rank2025?: number;
}

// Pre-normalised list for matching
const KTC_PARENTS_NORMALISED: KTCParentData[] = KTC_PARENTS.map((row) => ({
  companyId: row.company_id,
  parentName: row.benchmark_year_parent_company,
  country: row.country,
  region: row.region,
  subindustry: row.subindustry,
  totalBenchmarkScore: row.total_benchmark_score,
  rank2025: row.rank_2025,
}));

function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

/**
 * Lookup a KTC parent by name (case/diacritic-insensitive exact match).
 */
export function checkKTCParent(companyName: string): KTCParentData | null {
  if (!companyName || typeof companyName !== 'string') return null;
  const target = normalizeForMatch(companyName);
  if (!target) return null;

  const match = KTC_PARENTS_NORMALISED.find(
    (p) => normalizeForMatch(p.parentName) === target
  );
  return match ?? null;
}

/**
 * Map KTC Total Benchmark Score (0–100) to ETHICS pillar adjustment.
 *
 * Source: KTC scoring spec sheet (Ours).xlsx – Ethics_Scoring_Spec_33 tab.
 * "Scoring Conversion (to 0-25)": Total Benchmark Score bands → adjustment.
 */
export function getKTCScoreAdjustment(totalBenchmarkScore: number | null | undefined): number {
  if (totalBenchmarkScore == null || isNaN(totalBenchmarkScore)) return 0;
  const s = totalBenchmarkScore;

  if (s <= 10) return -10;
  if (s <= 20) return -8;
  if (s <= 30) return -6;
  if (s <= 50) return -3;
  if (s <= 70) return 3;
  if (s <= 80) return 6;
  if (s <= 90) return 8;
  return 10; // 91-100
}

export function isKTCHighPerformer(totalBenchmarkScore: number | null | undefined): boolean {
  return (totalBenchmarkScore ?? 0) >= 51;
}

export function isKTCLowPerformer(totalBenchmarkScore: number | null | undefined): boolean {
  return (totalBenchmarkScore ?? 0) <= 30;
}

export function logKTCLoadSummary(): void {
  try {
    logger.debug('[KTC] Loaded KTC parents:', {
      count: KTC_PARENTS_NORMALISED.length,
    });
  } catch {
    // best-effort logging only
  }
}

logKTCLoadSummary();

