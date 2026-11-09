/**
 * W5-AD-02 — experimental modal-only discovery presentation order.
 *
 * Editorial discovery promotion for About these Additives cards.
 * NOT a health, toxicity, safety, compliance, or scoring ranking.
 * Does not mutate merge / detection / catalogue assets.
 *
 * Pilot: Tier 1 + Tier 2 receive explicit displaySequence values.
 * Tier 3 and unranked keep original relative occurrence / stable order.
 */

import type { S25RenderListItem } from './types';

/** Modal-local intro append — does not edit governed surface_copy.json. */
export const DISCOVERY_ORDER_INTRO_NOTE =
  'Some notable discoveries appear first. This order is not a safety ranking.';

/**
 * Approved CORE-22 discovery promotion map (W5-AD-02).
 * Lower number = earlier in the modal. Unlisted ids stay unranked.
 * Presentation-only — not a health, toxicity, or safety ranking.
 */
export const DISCOVERY_DISPLAY_SEQUENCE: Readonly<Record<string, number>> = {
  e120: 1,
  e905b: 2,
  e904: 3,
  e901: 4,
  e542: 5,
  e1105: 6,
  e1101: 7,
  e957: 8,
  e476: 9,
  e445: 10,
  e1522: 11,
  e355: 12,
  e943a: 13,
  e944: 14,
  e955: 15,
  e123: 16,
  e141: 17,
  e415: 18,
  e150c: 19,
  e330: 20,
  e334: 21,
  e300: 22,
};

function sequenceForItem(item: S25RenderListItem): number | null {
  if (item.colourGroupIds && item.colourGroupIds.length > 0) {
    let best: number | null = null;
    for (const id of item.colourGroupIds) {
      const seq = DISCOVERY_DISPLAY_SEQUENCE[id];
      if (seq == null) continue;
      if (best == null || seq < best) best = seq;
    }
    return best;
  }
  const seq = DISCOVERY_DISPLAY_SEQUENCE[item.additiveId];
  return seq == null ? null : seq;
}

/**
 * Show the modal-local discovery intro only when promotion actually moved
 * something forward among multiple cards. Reuses the sorter's sequence rules
 * (including colour-group min-member promotion).
 */
export function shouldShowDiscoveryOrderIntro(
  items: readonly S25RenderListItem[]
): boolean {
  if (items.length < 2) return false;
  return items.some((item) => sequenceForItem(item) != null);
}

/**
 * Returns a new array: ranked (Tier 1/2 sequenced) first, then the remaining
 * cards in their original relative order. Input is not mutated.
 */
export function applyDiscoveryPresentationOrder(
  items: readonly S25RenderListItem[]
): S25RenderListItem[] {
  const decorated = items.map((item, originalIndex) => ({
    item,
    originalIndex,
    sequence: sequenceForItem(item),
  }));

  decorated.sort((a, b) => {
    const aRanked = a.sequence != null;
    const bRanked = b.sequence != null;
    if (aRanked && bRanked) {
      if (a.sequence !== b.sequence) return a.sequence! - b.sequence!;
      return a.originalIndex - b.originalIndex;
    }
    if (aRanked && !bRanked) return -1;
    if (!aRanked && bRanked) return 1;
    return a.originalIndex - b.originalIndex;
  });

  return decorated.map((d) => d.item);
}
