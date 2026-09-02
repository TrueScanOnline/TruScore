/**
 * Normalises the production fired-adjustment ledger into the shape the selection engine reads.
 *
 * Two supported carriers, both produced by the same scoring run:
 *   - `TruScoreResult.pillarDetails` — live in-process scoring result
 *   - `TruScoreAnalysis` (`product._truscore_analysis`) — the ledger persisted onto the scored product
 *
 * Neither path re-scores or re-reads raw product fields.
 */

import type { TruScoreResult } from '../truscoreEngine';
import type { PillarAnalysis, TruScoreAnalysis } from '../../types/truscoreAnalysis';
import type { FiredAdjustment, ScoreHighlightPillar } from './types';

type LedgerRow = {
  id?: string;
  value: number;
  highlightEligible?: boolean;
  metadata?: Record<string, string | number | boolean>;
};

function fromPillarRows(pillar: ScoreHighlightPillar, rows: readonly LedgerRow[]): FiredAdjustment[] {
  return rows.map((row) => ({
    pillar,
    id: row.id,
    value: row.value,
    highlightEligible: row.highlightEligible,
    metadata: row.metadata,
  }));
}

/** Fired ledger from the live scoring result. */
export function firedLedgerFromPillarDetails(
  pillarDetails: NonNullable<TruScoreResult['pillarDetails']>
): FiredAdjustment[] {
  return [
    ...fromPillarRows('Body', pillarDetails.body.adjustments),
    ...fromPillarRows('Planet', pillarDetails.planet.adjustments),
    ...fromPillarRows('Ethics', pillarDetails.ethics.adjustments),
    ...fromPillarRows('Open', pillarDetails.open.adjustments),
  ];
}

function fromAnalysisPillar(pillar: ScoreHighlightPillar, analysis: PillarAnalysis): FiredAdjustment[] {
  return analysis.adjustments.map((adj) => ({
    pillar,
    id: adj.adjustmentId,
    value: adj.value,
    highlightEligible: adj.highlightEligible,
    metadata: adj.adjustmentMetadata,
  }));
}

/** Fired ledger from the analysis already attached to the scored product. */
export function firedLedgerFromAnalysis(analysis: TruScoreAnalysis): FiredAdjustment[] {
  return [
    ...fromAnalysisPillar('Body', analysis.pillars.Body),
    ...fromAnalysisPillar('Planet', analysis.pillars.Planet),
    ...fromAnalysisPillar('Ethics', analysis.pillars.Ethics),
    ...fromAnalysisPillar('Open', analysis.pillars.Open),
  ];
}

/**
 * Fired ledger for a TruScore result, preferring live pillar details and falling back to the
 * analysis carried alongside it. Returns null when no governed ledger is available, in which
 * case consumer surfaces must render nothing rather than improvise.
 */
export function firedLedgerFromTruScoreResult(
  result: Pick<TruScoreResult, 'pillarDetails' | 'analysis'> | null | undefined
): FiredAdjustment[] | null {
  if (!result) return null;
  if (result.pillarDetails) return firedLedgerFromPillarDetails(result.pillarDetails);
  if (result.analysis) return firedLedgerFromAnalysis(result.analysis);
  return null;
}
