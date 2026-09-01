/**
 * Open v15 Score Highlights — bound to production fired adjustments (S12 / S28).
 * S12: no points on overall surface; at most one positive + one negative Open highlight.
 * S28: exhaustive via buildTruScoreAnalysis (all fired adjustments with provenance).
 */

import { calculateOpenPillar, type OpenPillarAdjustment } from '../lib/truscoreEngine/pillars/openPillar';
import {
  OPEN_V15_ADJUSTMENT_REGISTRY,
  openV15PositiveRank,
  type OpenV15AdjustmentId,
} from '../lib/truscoreEngine/pillars/openPillarV15Registry';
import type { ProductWithTrustScore } from '../types/product';
import type { ScoreHighlight } from './scoreHighlights';

function severityForPoints(absPoints: number): 'low' | 'medium' | 'high' {
  if (absPoints >= 6) return 'high';
  if (absPoints >= 3) return 'medium';
  return 'low';
}

export function openAdjustmentsForProduct(product: ProductWithTrustScore): OpenPillarAdjustment[] {
  return calculateOpenPillar(product).adjustments;
}

export function openHighlightFromAdjustment(adj: OpenPillarAdjustment): ScoreHighlight | null {
  if (!adj.highlightEligible || adj.value === 0) return null;
  const meta = OPEN_V15_ADJUSTMENT_REGISTRY[adj.id];
  if (!meta?.highlightTitle) return null;
  return {
    type: adj.value > 0 ? 'green' : 'red',
    category: 'nutrition',
    title: meta.highlightTitle,
    description: meta.highlightExplainer || meta.description,
    severity: severityForPoints(Math.abs(adj.value)),
    pillar: 'open',
    scoreValue: 0,
    externalResource: meta.externalResource,
    highlightId: adj.id,
  };
}

/**
 * Select at most one positive and one negative Open highlight for the overall TruScore surface.
 * Rank by absolute score effect; positive order +8 > +4 > +1; on equal absolute effect Origins
 * wins tie vs ingredient wording (positive and negative).
 */
export function selectOpenV15Highlights(adjustments: OpenPillarAdjustment[]): ScoreHighlight[] {
  const eligible = adjustments
    .map(openHighlightFromAdjustment)
    .filter((h): h is ScoreHighlight => h != null);

  const compareOriginsTie = (adjA: OpenPillarAdjustment | undefined, adjB: OpenPillarAdjustment | undefined) => {
    const famA = adjA?.family === 'origins' ? 1 : 0;
    const famB = adjB?.family === 'origins' ? 1 : 0;
    return famB - famA;
  };

  const positive = eligible
    .filter((h) => h.type === 'green')
    .sort((a, b) => {
      const adjA = adjustments.find((x) => x.id === a.highlightId);
      const adjB = adjustments.find((x) => x.id === b.highlightId);
      const rankA = openV15PositiveRank(adjA?.value ?? 0);
      const rankB = openV15PositiveRank(adjB?.value ?? 0);
      if (rankB !== rankA) return rankB - rankA;
      return compareOriginsTie(adjA, adjB);
    });

  const negative = eligible
    .filter((h) => h.type === 'red')
    .sort((a, b) => {
      const adjA = adjustments.find((x) => x.id === a.highlightId);
      const adjB = adjustments.find((x) => x.id === b.highlightId);
      const absA = Math.abs(adjA?.value ?? 0);
      const absB = Math.abs(adjB?.value ?? 0);
      if (absB !== absA) return absB - absA;
      return compareOriginsTie(adjA, adjB);
    });

  const selected: ScoreHighlight[] = [];
  if (positive[0]) selected.push(positive[0]);
  if (negative[0]) selected.push(negative[0]);
  return selected;
}

export function calculateOpenV15Highlights(product: ProductWithTrustScore): ScoreHighlight[] {
  const adjustments = openAdjustmentsForProduct(product);
  return selectOpenV15Highlights(adjustments);
}

/** All highlight-eligible fired Open adjustments (Open drill-down / audit). */
export function allOpenV15DrillDownHighlights(product: ProductWithTrustScore): ScoreHighlight[] {
  return openAdjustmentsForProduct(product)
    .map(openHighlightFromAdjustment)
    .filter((h): h is ScoreHighlight => h != null);
}
