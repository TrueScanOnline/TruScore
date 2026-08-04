/**
 * Batch + best-before month/year normalization for Stage 2 MVP.
 * Best-before is a product marking (month/year), not a UTC timestamp.
 */

export function normalizeBatchCode(raw: string | null | undefined): {
  ok: boolean;
  normalized?: string;
  reason?: string;
} {
  if (raw == null) return { ok: false, reason: 'missing' };
  const trimmed = raw.trim().replace(/\s+/g, '');
  if (!trimmed) return { ok: false, reason: 'missing' };
  // Reject obvious empty/placeholder; allow alphanumeric batch forms from notice
  if (!/^[A-Za-z0-9]+$/.test(trimmed)) {
    return { ok: false, reason: 'malformed' };
  }
  return { ok: true, normalized: trimmed.toUpperCase() };
}

export function normalizeBestBeforeMonthYear(
  month: number | null | undefined,
  year: number | null | undefined
): { ok: boolean; month?: number; year?: number; reason?: string } {
  if (month == null && year == null) return { ok: false, reason: 'missing' };
  if (month == null || year == null) return { ok: false, reason: 'partial' };
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return { ok: false, reason: 'malformed' };
  }
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return { ok: false, reason: 'malformed' };
  }
  return { ok: true, month, year };
}

/** True when user marking is August 2026 / end August 2026 for MILO MVP. */
export function isAugust2026BestBefore(month: number, year: number): boolean {
  return month === 8 && year === 2026;
}
