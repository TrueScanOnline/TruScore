import { buildCoverageScorecard, type WorkstreamACoverageScorecard } from './reports';
import type { CsvRecord } from './csv';

export interface CoverageTargetInput {
  target_products: number;
  covered_products: number;
}

/**
 * Compatibility wrapper for legacy callers: preserves threshold fields while sourcing
 * counts from the A5 file-oriented scorecard builder.
 */
export function buildWorkstreamACoverageScorecard(
  rowsByFile: Partial<Record<string, CsvRecord[]>>,
  input: CoverageTargetInput & { generatedAt?: string; knownGapNotes?: string[] }
): WorkstreamACoverageScorecard & {
  target_threshold: 0.8;
  target_products: number;
  covered_products: number;
  coverage_ratio: number;
  threshold_met: boolean;
  known_gap_notes: string[];
} {
  const ratio = input.target_products > 0 ? input.covered_products / input.target_products : 0;
  const scorecard = buildCoverageScorecard({
    rowsByFile,
    reportGeneratedAt: input.generatedAt,
    launchUsefulnessNote: (input.knownGapNotes ?? []).join(' | '),
  });
  return {
    ...scorecard,
    target_threshold: 0.8,
    target_products: input.target_products,
    covered_products: input.covered_products,
    coverage_ratio: Number(ratio.toFixed(4)),
    threshold_met: ratio >= 0.8,
    known_gap_notes: input.knownGapNotes ?? [],
  };
}

