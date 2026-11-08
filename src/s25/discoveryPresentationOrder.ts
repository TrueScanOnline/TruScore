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
 * Favourites UAT hypothesis — Tier 1 / Tier 2 promotion only.
 * Lower number = earlier in the modal. Unlisted ids stay unranked.
 */
export const DISCOVERY_DISPLAY_SEQUENCE: Readonly<Record<string, number>> = {
  e120: 1,
  e471: 2,
  e476: 3,
  e150c: 4,
  e330: 5,
  e322: 6,
  e422: 7,
  e575: 8,
  e223: 9,
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
