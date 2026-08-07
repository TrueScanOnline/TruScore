/**
 * Reviewed brand_child_of_brand and entity_child_of_entity maps for DSA propagation.
 * Additive chaining extension — no free-text inference at publication time.
 */

import type { CsvRecord } from '../../identity/workstreamA/csv';

export type BrandHierarchyMaps = {
  /** parent_brand_id → set of descendant brand_ids (includes parent itself) */
  descendantsIncludingSelf: Map<string, Set<string>>;
};

export type EntityHierarchyMaps = {
  /** parent_entity_id → set of descendant entity_ids (includes parent itself) */
  descendantsIncludingSelf: Map<string, Set<string>>;
};

function buildTransitiveDescendants(edges: Array<{ child: string; parent: string }>): Map<string, Set<string>> {
  const childrenOf = new Map<string, Set<string>>();
  const allIds = new Set<string>();
  for (const e of edges) {
    allIds.add(e.child);
    allIds.add(e.parent);
    const set = childrenOf.get(e.parent) ?? new Set<string>();
    set.add(e.child);
    childrenOf.set(e.parent, set);
  }
  const out = new Map<string, Set<string>>();
  const visit = (root: string, node: string, acc: Set<string>) => {
    if (acc.has(node) && node !== root) return;
    acc.add(node);
    for (const c of childrenOf.get(node) ?? []) visit(root, c, acc);
  };
  for (const id of allIds) {
    const acc = new Set<string>();
    visit(id, id, acc);
    out.set(id, acc);
  }
  // Ensure every parent key exists even if only as self
  for (const e of edges) {
    if (!out.has(e.parent)) out.set(e.parent, new Set([e.parent]));
  }
  return out;
}

export function buildBrandHierarchyMapsFromCsvRecords(rows: CsvRecord[]): BrandHierarchyMaps {
  const edges: Array<{ child: string; parent: string }> = [];
  for (const r of rows) {
    if ((r.review_state ?? '').trim() !== 'reviewed') continue;
    const child = (r.brand_id ?? '').trim();
    const parent = (r.parent_brand_id ?? '').trim();
    if (!child || !parent || child === parent) continue;
    edges.push({ child, parent });
  }
  return { descendantsIncludingSelf: buildTransitiveDescendants(edges) };
}

export function buildEntityHierarchyMapsFromCsvRecords(rows: CsvRecord[]): EntityHierarchyMaps {
  const edges: Array<{ child: string; parent: string }> = [];
  for (const r of rows) {
    if ((r.review_state ?? '').trim() !== 'reviewed') continue;
    const child = (r.entity_id ?? '').trim();
    const parent = (r.parent_entity_id ?? '').trim();
    if (!child || !parent || child === parent) continue;
    edges.push({ child, parent });
  }
  return { descendantsIncludingSelf: buildTransitiveDescendants(edges) };
}

export function brandIsDescendantOf(
  maps: BrandHierarchyMaps,
  brandId: string | null,
  ancestorBrandId: string
): boolean {
  if (!brandId) return false;
  if (brandId === ancestorBrandId) return true;
  return maps.descendantsIncludingSelf.get(ancestorBrandId)?.has(brandId) === true;
}

/**
 * Entity match: scanned product's reviewed parent_id equals target entity, or is a reviewed
 * subsidiary/descendant of that entity. Retailer stocking is never inferred.
 */
export function entityOwnsOrIsAncestorOf(
  maps: EntityHierarchyMaps,
  productParentId: string | null,
  targetEntityId: string
): boolean {
  if (!productParentId) return false;
  if (productParentId === targetEntityId) return true;
  return maps.descendantsIncludingSelf.get(targetEntityId)?.has(productParentId) === true;
}
