/**
 * NA-019 — Asset Signal temporal public window.
 *
 * Governed CSV fields `publishable_from` and `expires_at` may be date-only (YYYY-MM-DD)
 * or full ISO-8601. Date-only bounds follow the same calendar-day conventions as
 * `validityPolicy` end-of-day semantics:
 *   - publishable_from YYYY-MM-DD → inclusive from 00:00:00.000Z that UTC day
 *   - expires_at YYYY-MM-DD → inclusive through 23:59:59.999Z that UTC day
 *
 * Comparison uses injected IngestionClock (no Date.now() in the policy helper itself
 * when a clock is supplied). Empty/missing bounds do not constrain that edge.
 */

import type { IngestionClock } from '../../ingest/ingestionClock';
import { isPastValidUntil } from '../../publish/validityPolicy';

const DATE_ONLY = /^(\d{4}-\d{2}-\d{2})$/;

/** Expand a governed bound for lexicographic/ISO comparison against clock.nowIso(). */
export function normalizeAssetTemporalBound(
  raw: string | null | undefined,
  edge: 'start' | 'end'
): string | null {
  const v = (raw ?? '').trim();
  if (!v) return null;
  const dateOnly = DATE_ONLY.exec(v);
  if (dateOnly) {
    return edge === 'start'
      ? `${dateOnly[1]}T00:00:00.000Z`
      : `${dateOnly[1]}T23:59:59.999Z`;
  }
  // Full ISO (or other governed timestamp string) — use as authored.
  return v;
}

export type AssetSignalTemporalFields = {
  publishable_from?: string | null;
  expires_at?: string | null;
};

/**
 * True only when the evaluation clock is inside the public temporal window.
 * Before publishable_from → false. After expires_at → false.
 */
export function isAssetSignalWithinPublicTemporalWindow(
  fields: AssetSignalTemporalFields,
  clock: IngestionClock
): boolean {
  const from = normalizeAssetTemporalBound(fields.publishable_from, 'start');
  if (from != null && clock.nowIso() < from) {
    return false;
  }
  const until = normalizeAssetTemporalBound(fields.expires_at, 'end');
  if (until != null && isPastValidUntil(until, clock)) {
    return false;
  }
  return true;
}

/** value written onto publication `staleness.valid_until` (end-normalized when date-only). */
export function assetExpiresAtAsValidUntil(expiresAt: string | null | undefined): string {
  return normalizeAssetTemporalBound(expiresAt, 'end') ?? '2099-12-31T23:59:59.999Z';
}
