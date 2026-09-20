/**
 * Governed product-family maps: GTIN membership + normalized product-name aliases.
 * Aliases are generic reusable Chaining facts — not Signal-specific application rules.
 */

import type { CsvRecord } from '../../identity/workstreamA/csv';
import { normalizeForBrandComparison } from '../../identity/workstreamA/catalogueAudit';

export type ProductFamilyRow = {
  product_family_id: string;
  display_name: string;
  market_key: string;
  anchor_brand_id: string;
  anchor_parent_id: string;
  review_state: string;
};

export type ProductFamilyMembershipRow = {
  membership_id: string;
  product_family_id: string;
  gtin: string;
  market_key: string;
  review_state: string;
};

export type ProductFamilyAliasRow = {
  alias_id: string;
  product_family_id: string;
  alias_text: string;
  alias_normalized: string;
  /** exact_normalized | phrase_contains */
  match_mode: string;
  review_state: string;
};

export type ProductFamilyMaps = {
  familiesById: Map<string, ProductFamilyRow>;
  /** gtin → reviewed family ids (market-filtered by caller) */
  familyIdsByGtin: Map<string, string[]>;
  /** reviewed aliases keyed by family id */
  aliasesByFamilyId: Map<string, ProductFamilyAliasRow[]>;
};

export function buildProductFamilyMapsFromCsvRecords(
  familyRows: CsvRecord[],
  membershipRows: CsvRecord[],
  aliasRows: CsvRecord[] = []
): ProductFamilyMaps {
  const familiesById = new Map<string, ProductFamilyRow>();
  for (const r of familyRows) {
    const id = (r.product_family_id ?? '').trim();
    if (!id) continue;
    familiesById.set(id, {
      product_family_id: id,
      display_name: r.display_name ?? '',
      market_key: r.market_key ?? '',
      anchor_brand_id: (r.anchor_brand_id ?? '').trim(),
      anchor_parent_id: (r.anchor_parent_id ?? '').trim(),
      review_state: r.review_state ?? '',
    });
  }

  const familyIdsByGtin = new Map<string, string[]>();
  for (const r of membershipRows) {
    if ((r.review_state ?? '').trim() !== 'reviewed') continue;
    const gtin = (r.gtin ?? '').trim();
    const fid = (r.product_family_id ?? '').trim();
    if (!gtin || !fid) continue;
    const fam = familiesById.get(fid);
    if (!fam || fam.review_state !== 'reviewed') continue;
    const prev = familyIdsByGtin.get(gtin) ?? [];
    if (!prev.includes(fid)) prev.push(fid);
    familyIdsByGtin.set(gtin, prev);
  }

  const aliasesByFamilyId = new Map<string, ProductFamilyAliasRow[]>();
  for (const r of aliasRows) {
    if ((r.review_state ?? '').trim() !== 'reviewed') continue;
    const fid = (r.product_family_id ?? '').trim();
    const alias_id = (r.alias_id ?? '').trim();
    if (!fid || !alias_id) continue;
    const fam = familiesById.get(fid);
    if (!fam || fam.review_state !== 'reviewed') continue;
    const alias_normalized = (r.alias_normalized ?? '').trim() || normalizeForBrandComparison(r.alias_text ?? '');
    if (!alias_normalized) continue;
    const row: ProductFamilyAliasRow = {
      alias_id,
      product_family_id: fid,
      alias_text: (r.alias_text ?? '').trim(),
      alias_normalized,
      match_mode: ((r.match_mode ?? '').trim() || 'phrase_contains').toLowerCase(),
      review_state: 'reviewed',
    };
    const prev = aliasesByFamilyId.get(fid) ?? [];
    prev.push(row);
    aliasesByFamilyId.set(fid, prev);
  }

  return { familiesById, familyIdsByGtin, aliasesByFamilyId };
}

function marketAllowsFamily(
  fam: ProductFamilyRow,
  scanMarketPublic: 'AU' | 'NZ' | 'UNKNOWN'
): boolean {
  if (fam.review_state !== 'reviewed') return false;
  const mk = fam.market_key;
  if (mk === 'AU+NZ') return scanMarketPublic === 'AU' || scanMarketPublic === 'NZ';
  if (scanMarketPublic === 'UNKNOWN') return false;
  return mk === scanMarketPublic;
}

/** Reviewed family IDs for a GTIN, optionally filtered by public scan market. */
export function reviewedFamilyIdsForGtin(
  maps: ProductFamilyMaps,
  gtin: string,
  scanMarketPublic: 'AU' | 'NZ' | 'UNKNOWN'
): string[] {
  const ids = maps.familyIdsByGtin.get(gtin) ?? [];
  return ids.filter((id) => {
    const fam = maps.familiesById.get(id);
    return fam ? marketAllowsFamily(fam, scanMarketPublic) : false;
  });
}

function aliasMatchesProductName(alias: ProductFamilyAliasRow, productNameNormalized: string): boolean {
  if (!productNameNormalized || !alias.alias_normalized) return false;
  if (alias.match_mode === 'exact_normalized') {
    return productNameNormalized === alias.alias_normalized;
  }
  // phrase_contains — require alias as contiguous token phrase inside product name
  const hay = ` ${productNameNormalized} `;
  const needle = ` ${alias.alias_normalized} `;
  return hay.includes(needle);
}

/**
 * Resolve product-family membership from GTIN membership and/or governed family aliases
 * against the already-resolved brand/parent chain + product name.
 * Does not invent identity; fails closed when brand/parent anchors cannot be satisfied.
 */
export function resolveReviewedProductFamilyIdsFromScan(input: {
  maps: ProductFamilyMaps;
  barcode: string;
  brand_id: string | null;
  parent_id: string | null;
  productName: string;
  scanMarketPublic: 'AU' | 'NZ' | 'UNKNOWN';
  /** Optional: brandIsDescendantOf(hierarchy, scanBrand, anchorBrand) */
  brandIsUnderAnchor?: (scanBrandId: string, anchorBrandId: string) => boolean;
}): string[] {
  const out = new Set<string>(
    reviewedFamilyIdsForGtin(input.maps, input.barcode, input.scanMarketPublic)
  );

  const productNameNormalized = normalizeForBrandComparison(input.productName ?? '');
  if (!productNameNormalized) return [...out];

  for (const [fid, aliases] of input.maps.aliasesByFamilyId) {
    const fam = input.maps.familiesById.get(fid);
    if (!fam || !marketAllowsFamily(fam, input.scanMarketPublic)) continue;

    // Anchor brand/parent gates — empty anchor means alias alone may bind (still reviewed).
    if (fam.anchor_brand_id) {
      const bid = (input.brand_id ?? '').trim();
      if (!bid) continue;
      const under =
        bid === fam.anchor_brand_id ||
        (input.brandIsUnderAnchor?.(bid, fam.anchor_brand_id) ?? false);
      if (!under) continue;
    }
    if (fam.anchor_parent_id) {
      const pid = (input.parent_id ?? '').trim();
      if (!pid || pid !== fam.anchor_parent_id) continue;
    }

    const hit = aliases.some((a) => aliasMatchesProductName(a, productNameNormalized));
    if (hit) out.add(fid);
  }

  return [...out];
}
