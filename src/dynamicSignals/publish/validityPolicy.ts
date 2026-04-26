import type { IngestionClock } from '../ingest/ingestionClock';
import type { NormativeSignalClass } from '../../contracts/phase6/enums';

/**
 * Class policy windows (days from materialization) for publication staleness.
 * These are policy values, not convenience constants; tune only via deliberate, version-controlled changes.
 */
const VALIDITY_DAYS: Record<NormativeSignalClass, number> = {
  safety_regulatory: 365,
  in_the_news: 7,
  my_choices_chain: 90,
};

/**
 * `valid_until` in ISO, end-of-day policy using **injected** clock (no `Date.now()` in engine paths).
 */
export function computeValidUntilIso(
  signalClass: NormativeSignalClass,
  fromClock: IngestionClock
): string {
  const d = new Date(fromClock.nowIso());
  d.setUTCHours(23, 59, 59, 999);
  d.setUTCDate(d.getUTCDate() + VALIDITY_DAYS[signalClass]);
  return d.toISOString();
}

export function isPastValidUntil(validUntil: string, clock: IngestionClock): boolean {
  return clock.nowIso() > validUntil;
}
