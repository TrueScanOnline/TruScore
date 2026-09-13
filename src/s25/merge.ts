/**
 * Merge Body-6 ledger set ∪ standard catalogue set into renderedAdditiveIds.
 * Order: first reliable ingredients occurrence, else stable detection order.
 */

import { detectBody6FromLedger, isColourCanonicalId } from './detectBody6';
import { detectStandardAdditives } from './detectStandard';
import { getCatalogueEntry } from './loadAsset';
import { resolveClassForAdditiveHit } from './resolveClass';
import type {
  S25DetectionHit,
  S25MergedDetection,
  S25RenderListItem,
} from './types';
import { S25_COLOUR_CANONICAL_IDS } from './types';

export interface MergeInput {
  firedBodyLedgerIds: readonly string[];
  ingredientsText?: string | null;
  additivesTags?: string[] | null;
}

function stableAppendOrder(hits: S25DetectionHit[]): string[] {
  // Preserve first-seen order from the combined hit list as stable fallback.
  const out: string[] = [];
  const seen = new Set<string>();
  for (const h of hits) {
    if (seen.has(h.additiveId)) continue;
    seen.add(h.additiveId);
    out.push(h.additiveId);
  }
  return out;
}

function orderByPosition(
  ids: string[],
  positionById: Map<string, number | null>,
  stableOrder: string[]
): string[] {
  const positioned = ids
    .filter((id) => positionById.get(id) != null)
    .sort((a, b) => (positionById.get(a)! as number) - (positionById.get(b)! as number));
  const unpositioned = stableOrder.filter(
    (id) => ids.includes(id) && positionById.get(id) == null
  );
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of [...positioned, ...unpositioned]) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

/**
 * Build the merged S25 detection set for a scan.
 */
export function mergeRenderedAdditives(input: MergeInput): S25MergedDetection {
  const bodyHits = detectBody6FromLedger(input.firedBodyLedgerIds, input.ingredientsText);
  const standardHits = detectStandardAdditives({
    ingredientsText: input.ingredientsText,
    additivesTags: input.additivesTags,
  });

  // Standard path must never contribute Body-6 IDs even if aliases overlap.
  const filteredStandard = standardHits.filter((h) => {
    const entry = getCatalogueEntry(h.additiveId);
    return entry != null && !entry.body6_existing;
  });

  const body6Ids = bodyHits.map((h) => h.additiveId);
  const standardIds = filteredStandard.map((h) => h.additiveId);

  const allHits: S25DetectionHit[] = [...bodyHits, ...filteredStandard];
  const positionById = new Map<string, number | null>();
  for (const h of allHits) {
    const prev = positionById.get(h.additiveId);
    if (prev == null || (h.position != null && (prev == null || h.position < prev))) {
      positionById.set(h.additiveId, h.position);
    } else if (!positionById.has(h.additiveId)) {
      positionById.set(h.additiveId, h.position);
    }
  }

  const uniqueIds = [...new Set([...body6Ids, ...standardIds])];
  const stable = stableAppendOrder(allHits);
  const renderedAdditiveIds = orderByPosition(uniqueIds, positionById, stable);

  // Colour group list anchors: place group at earliest colour position; keep all IDs in count.
  const colourPresent = renderedAdditiveIds.filter(isColourCanonicalId);
  let orderedListAnchors = renderedAdditiveIds.slice();
  if (colourPresent.length > 0) {
    const earliestColour = colourPresent.reduce((best, id) => {
      const bp = positionById.get(best);
      const ip = positionById.get(id);
      if (bp == null && ip != null) return id;
      if (ip == null) return best;
      return (ip as number) < (bp as number) ? id : best;
    }, colourPresent[0]);
    orderedListAnchors = renderedAdditiveIds.filter((id) => !isColourCanonicalId(id));
    const insertAt = (() => {
      // Insert before first item that is after earliest colour position in original order
      const idx = renderedAdditiveIds.indexOf(earliestColour);
      // Count how many non-colour ids appear before earliest colour in ordered list
      let nonColourBefore = 0;
      for (let i = 0; i < idx; i++) {
        if (!isColourCanonicalId(renderedAdditiveIds[i])) nonColourBefore++;
      }
      return nonColourBefore;
    })();
    orderedListAnchors.splice(insertAt, 0, earliestColour);
  }

  return {
    body6Ids: [...new Set(body6Ids)],
    standardIds: [...new Set(standardIds)],
    renderedAdditiveIds,
    orderedListAnchors,
    hits: allHits,
  };
}

/**
 * Build UI list items for the canonical destination.
 * Colour additives that fired are represented as one colour-group item at the earliest colour anchor.
 */
export function buildRenderList(
  merged: S25MergedDetection,
  ingredientsText?: string | null
): S25RenderListItem[] {
  const text = ingredientsText ?? '';
  const fired = new Set(merged.renderedAdditiveIds);
  const positionById = new Map(
    merged.hits.map((h) => [h.additiveId, h.position] as const)
  );

  const items: S25RenderListItem[] = [];
  const colourFired = S25_COLOUR_CANONICAL_IDS.filter((id) => fired.has(id));
  let colourEmitted = false;

  for (const anchorId of merged.orderedListAnchors) {
    if (isColourCanonicalId(anchorId)) {
      if (colourEmitted || colourFired.length === 0) continue;
      colourEmitted = true;
      const entry = getCatalogueEntry(anchorId);
      if (!entry) continue;
      items.push({
        additiveId: anchorId,
        entry,
        declaredClass: resolveClassForAdditiveHit(text, positionById.get(anchorId) ?? null),
        isBody6: true,
        colourGroupIds: [...colourFired],
      });
      continue;
    }

    if (!fired.has(anchorId)) continue;
    const entry = getCatalogueEntry(anchorId);
    if (!entry) continue;
    items.push({
      additiveId: anchorId,
      entry,
      declaredClass: resolveClassForAdditiveHit(text, positionById.get(anchorId) ?? null),
      isBody6: entry.body6_existing,
    });
  }

  return items;
}
