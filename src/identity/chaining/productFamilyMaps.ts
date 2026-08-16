/**
 * Governed product_family chaining extension (v0.1).
 * Additive — does not mutate Workstream A brand/parent/gtin CSVs (current SoT: wave1-v0.15).
 */

import type { CsvRecord } from '../../identity/workstreamA/csv';

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

export type ProductFamilyMaps = {
  familiesById: Map<string, ProductFamilyRow>;
  /** gtin → reviewed family ids (market-filtered by caller) */
  familyIdsByGtin: Map<string, string[]>;
};

export function buildProductFamilyMapsFromCsvRecords(
  familyRows: CsvRecord[],
  membershipRows: CsvRecord[]
): ProductFamilyMaps {
  const familiesById = new Map<string, ProductFamilyRow>();
  for (const r of familyRows) {
    const id = (r.product_family_id ?? '').trim();
    if (!id) continue;
    familiesById.set(id, {
      product_family_id: id,
      display_name: r.display_name ?? '',
      market_key: r.market_key ?? '',
      anchor_brand_id: r.anchor_brand_id ?? '',
      anchor_parent_id: r.anchor_parent_id ?? '',
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
    // Both family and membership must be reviewed before matching.
    if (!fam || fam.review_state !== 'reviewed') continue;
    const prev = familyIdsByGtin.get(gtin) ?? [];
    if (!prev.includes(fid)) prev.push(fid);
    familyIdsByGtin.set(gtin, prev);
  }

  return { familiesById, familyIdsByGtin };
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
    if (!fam || fam.review_state !== 'reviewed') return false;
    const mk = fam.market_key;
    if (mk === 'AU+NZ') return scanMarketPublic === 'AU' || scanMarketPublic === 'NZ';
    if (scanMarketPublic === 'UNKNOWN') return false;
    return mk === scanMarketPublic;
  });
}
