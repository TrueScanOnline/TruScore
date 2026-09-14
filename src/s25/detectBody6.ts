/**
 * Body-6 set from existing fired ledger IDs only.
 * Do NOT redetect Body-6 via the standard catalogue path.
 */

import { mapBodyLedgerIdToCanonical } from './normalize';
import type { S25DetectionHit } from './types';
import { S25_COLOUR_CANONICAL_IDS } from './types';

/**
 * Map fired Body additive ledger rows to canonical S25 IDs.
 * Ignores non-Body-6 ledger IDs (e.g. body-v12-additive-cap).
 */
export function detectBody6FromLedger(
  firedLedgerIds: readonly string[],
  ingredientsText?: string | null
): S25DetectionHit[] {
  const text = String(ingredientsText || '').toLowerCase();
  const hits: S25DetectionHit[] = [];
  const seen = new Set<string>();

  for (const ledgerId of firedLedgerIds) {
    const canon = mapBodyLedgerIdToCanonical(ledgerId);
    if (!canon || seen.has(canon)) continue;
    seen.add(canon);

    let position: number | null = null;
    if (text) {
      const num = canon.replace(/^e/i, '');
      const patterns = [
        new RegExp(`\\be\\s*-?\\s*${num}\\b`, 'i'),
        new RegExp(`\\bins\\s*-?\\s*${num}\\b`, 'i'),
        new RegExp(`\\ben:e${num}\\b`, 'i'),
      ];
      for (const re of patterns) {
        const m = re.exec(text);
        if (m) {
          position = m.index;
          break;
        }
      }
    }

    hits.push({
      additiveId: canon,
      position,
      source: 'body6_ledger',
    });
  }

  return hits;
}

export function isColourCanonicalId(id: string): boolean {
  return (S25_COLOUR_CANONICAL_IDS as readonly string[]).includes(id);
}
