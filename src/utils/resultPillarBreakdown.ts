/**
 * Result-path pillar breakdown mapping — the single place the Result screen turns a persisted
 * `trust_score_breakdown` into the `TruScoreResult.breakdown` the consumer surfaces read.
 *
 * Null-score integrity (Wave 3): a pillar with no usable score stays `null` end to end. It must
 * never be coerced to `0`, because `0` is a genuine substantive pillar score ("this product really
 * did score zero") and the consumer surfaces render it as `0/25` with a red band. Persisted and
 * cached products can legitimately carry a null pillar even though `TrustScoreBreakdown` declares
 * the field as `number`, which is why the input type here is deliberately permissive.
 *
 * Score-neutral: no arithmetic, no thresholds, no eligibility. Genuine `0` passes through as `0`.
 */

import type { TruScoreResult } from '../lib/truscoreEngine';

/** Persisted pillar breakdown as it can actually arrive from cache, SQLite or the backend. */
export interface PersistedPillarBreakdown {
  body?: number | null;
  planet?: number | null;
  ethics?: number | null;
  open?: number | null;
}

/** A pillar value that is a real number (including a genuine 0), or null when unavailable. */
function preservePillar(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  return value;
}

/**
 * Map a persisted breakdown onto the internal pillar keys, preserving null.
 * Internal keys (Body/Planet/Ethics/Open) are unchanged; consumer labels are applied at render.
 */
export function resultPillarBreakdown(
  breakdown: PersistedPillarBreakdown | null | undefined
): TruScoreResult['breakdown'] {
  return {
    Body: preservePillar(breakdown?.body),
    Planet: preservePillar(breakdown?.planet),
    Ethics: preservePillar(breakdown?.ethics),
    Open: preservePillar(breakdown?.open),
  };
}
