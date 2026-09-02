/**
 * Wave 3 Score Highlights — shared score-neutrality assertion.
 *
 * Adding stable adjustment IDs must not change pillar arithmetic. Every fired ledger
 * (including cap / ceiling / floor normalisers) must reconcile exactly to the scored value:
 * `pillar.base + Σ adjustment.value === pillar.score`.
 */

export interface ReconcilablePillarResult {
  base: number;
  score: number;
  adjustments: { value: number }[];
}

export function expectPillarLedgerReconciles(result: ReconcilablePillarResult): void {
  const sum = result.adjustments.reduce((total, adj) => total + adj.value, 0);
  expect(result.base + sum).toBe(result.score);
}

/** Fired adjustment IDs in emission order (rows without an ID are reported as `null`). */
export function firedAdjustmentIds(result: { adjustments: { id?: string }[] }): (string | null)[] {
  return result.adjustments.map((adj) => adj.id ?? null);
}
