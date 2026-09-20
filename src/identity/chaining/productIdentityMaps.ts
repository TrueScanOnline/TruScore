/**
 * Governed product-identity maps — reusable product-level aliases (not a GTIN catalogue).
 * exact_only Signal targets may bind to product_identity_id when barcode≠GTIN.
 */

import type { CsvRecord } from '../../identity/workstreamA/csv';
import { normalizeForBrandComparison } from '../../identity/workstreamA/catalogueAudit';

export type ProductIdentityRow = {
  product_identity_id: string;
  display_name: string;
  market_key: string;
  anchor_brand_id: string;
  anchor_parent_id: string;
  review_state: string;
};

export type ProductIdentityAliasRow = {
  alias_id: string;
  product_identity_id: string;
  alias_text: string;
  alias_normalized: string;
  /** exact_normalized | phrase_contains */
  match_mode: string;
  review_state: string;
};

export type ProductIdentityMaps = {
  identitiesById: Map<string, ProductIdentityRow>;
  aliasesByIdentityId: Map<string, ProductIdentityAliasRow[]>;
};

export function buildProductIdentityMapsFromCsvRecords(
  identityRows: CsvRecord[],
  aliasRows: CsvRecord[]
): ProductIdentityMaps {
  const identitiesById = new Map<string, ProductIdentityRow>();
  for (const r of identityRows) {
    const id = (r.product_identity_id ?? '').trim();
    if (!id) continue;
    identitiesById.set(id, {
      product_identity_id: id,
      display_name: r.display_name ?? '',
      market_key: r.market_key ?? '',
      anchor_brand_id: (r.anchor_brand_id ?? '').trim(),
      anchor_parent_id: (r.anchor_parent_id ?? '').trim(),
      review_state: r.review_state ?? '',
    });
  }

  const aliasesByIdentityId = new Map<string, ProductIdentityAliasRow[]>();
  for (const r of aliasRows) {
    if ((r.review_state ?? '').trim() !== 'reviewed') continue;
    const pid = (r.product_identity_id ?? '').trim();
    const alias_id = (r.alias_id ?? '').trim();
    if (!pid || !alias_id) continue;
    const ident = identitiesById.get(pid);
    if (!ident || ident.review_state !== 'reviewed') continue;
    const alias_normalized =
      (r.alias_normalized ?? '').trim() || normalizeForBrandComparison(r.alias_text ?? '');
    if (!alias_normalized) continue;
    const row: ProductIdentityAliasRow = {
      alias_id,
      product_identity_id: pid,
      alias_text: (r.alias_text ?? '').trim(),
      alias_normalized,
      match_mode: ((r.match_mode ?? '').trim() || 'phrase_contains').toLowerCase(),
      review_state: 'reviewed',
    };
    const prev = aliasesByIdentityId.get(pid) ?? [];
    prev.push(row);
    aliasesByIdentityId.set(pid, prev);
  }

  return { identitiesById, aliasesByIdentityId };
}

function marketAllows(
  row: ProductIdentityRow,
  scanMarketPublic: 'AU' | 'NZ' | 'UNKNOWN'
): boolean {
  if (row.review_state !== 'reviewed') return false;
  const mk = row.market_key;
  if (mk === 'AU+NZ') return scanMarketPublic === 'AU' || scanMarketPublic === 'NZ';
  if (scanMarketPublic === 'UNKNOWN') return false;
  return mk === scanMarketPublic;
}

function aliasMatches(alias: ProductIdentityAliasRow, productNameNormalized: string): boolean {
  if (!productNameNormalized || !alias.alias_normalized) return false;
  if (alias.match_mode === 'exact_normalized') {
    return productNameNormalized === alias.alias_normalized;
  }
  const hay = ` ${productNameNormalized} `;
  const needle = ` ${alias.alias_normalized} `;
  return hay.includes(needle);
}

/**
 * Resolve product_identity_ids from governed aliases + optional brand/parent anchors.
 */
export function resolveReviewedProductIdentityIdsFromScan(input: {
  maps: ProductIdentityMaps;
  brand_id: string | null;
  parent_id: string | null;
  productName: string;
  scanMarketPublic: 'AU' | 'NZ' | 'UNKNOWN';
  brandIsUnderAnchor?: (scanBrandId: string, anchorBrandId: string) => boolean;
}): string[] {
  const productNameNormalized = normalizeForBrandComparison(input.productName ?? '');
  if (!productNameNormalized) return [];

  const out: string[] = [];
  for (const [pid, aliases] of input.maps.aliasesByIdentityId) {
    const ident = input.maps.identitiesById.get(pid);
    if (!ident || !marketAllows(ident, input.scanMarketPublic)) continue;

    if (ident.anchor_brand_id) {
      const bid = (input.brand_id ?? '').trim();
      if (!bid) continue;
      const under =
        bid === ident.anchor_brand_id ||
        (input.brandIsUnderAnchor?.(bid, ident.anchor_brand_id) ?? false);
      if (!under) continue;
    }
    if (ident.anchor_parent_id) {
      const parent = (input.parent_id ?? '').trim();
      if (!parent || parent !== ident.anchor_parent_id) continue;
    }

    if (aliases.some((a) => aliasMatches(a, productNameNormalized))) {
      out.push(pid);
    }
  }
  return out;
}
