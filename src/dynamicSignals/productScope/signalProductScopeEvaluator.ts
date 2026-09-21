/**
 * Workstream C — generic Signal product-scope evaluator.
 *
 * Consumes governed criteria linked to signal_target_id + resolved brand/parent
 * from Shared Identity + ordinary scan product fields.
 * No brand/product/Signal-id hardcoding.
 */

import type { CsvRecord } from '../../identity/workstreamA/csv';
import { normalizeForBrandComparison } from '../../identity/workstreamA/catalogueAudit';

export type SignalProductScopeCriterion = {
  criterion_id: string;
  signal_target_id: string;
  market_key: string;
  required_brand_id: string;
  required_parent_id: string;
  match_field: string;
  match_mode: string;
  match_value: string;
  match_value_normalized: string;
  review_state: string;
};

export type SignalProductScopeMaps = {
  criteriaByTargetId: Map<string, SignalProductScopeCriterion[]>;
};

export type ProductScopeScanContext = {
  barcode: string;
  productName: string;
  brand_id: string | null;
  parent_id: string | null;
  scanMarketPublic: 'AU' | 'NZ' | 'UNKNOWN';
  /** Optional: brandIsDescendantOf for required_brand_id under child brands */
  brandIsUnderAnchor?: (scanBrandId: string, anchorBrandId: string) => boolean;
};

export function buildSignalProductScopeMapsFromCsvRecords(
  rows: CsvRecord[]
): SignalProductScopeMaps {
  const criteriaByTargetId = new Map<string, SignalProductScopeCriterion[]>();
  for (const r of rows) {
    if ((r.review_state ?? '').trim() !== 'reviewed') continue;
    const signal_target_id = (r.signal_target_id ?? '').trim();
    const criterion_id = (r.criterion_id ?? '').trim();
    const match_value = (r.match_value ?? '').trim();
    if (!signal_target_id || !criterion_id || !match_value) continue;
    const match_value_normalized =
      (r.match_value_normalized ?? '').trim() || normalizeForBrandComparison(match_value);
    if (!match_value_normalized) continue;
    const row: SignalProductScopeCriterion = {
      criterion_id,
      signal_target_id,
      market_key: (r.market_key ?? '').trim(),
      required_brand_id: (r.required_brand_id ?? '').trim(),
      required_parent_id: (r.required_parent_id ?? '').trim(),
      match_field: ((r.match_field ?? '').trim() || 'product_name').toLowerCase(),
      match_mode: ((r.match_mode ?? '').trim() || 'phrase_contains').toLowerCase(),
      match_value,
      match_value_normalized,
      review_state: 'reviewed',
    };
    const prev = criteriaByTargetId.get(signal_target_id) ?? [];
    prev.push(row);
    criteriaByTargetId.set(signal_target_id, prev);
  }
  return { criteriaByTargetId };
}

function marketAllows(marketKey: string, scanMarketPublic: 'AU' | 'NZ' | 'UNKNOWN'): boolean {
  if (!marketKey) return scanMarketPublic !== 'UNKNOWN';
  if (marketKey === 'AU+NZ') return scanMarketPublic === 'AU' || scanMarketPublic === 'NZ';
  if (scanMarketPublic === 'UNKNOWN') return false;
  return marketKey === scanMarketPublic;
}

function brandAnchorOk(
  requiredBrandId: string,
  ctx: ProductScopeScanContext
): boolean {
  if (!requiredBrandId) return true;
  const bid = (ctx.brand_id ?? '').trim();
  if (!bid) return false;
  if (bid === requiredBrandId) return true;
  return ctx.brandIsUnderAnchor?.(bid, requiredBrandId) ?? false;
}

function parentAnchorOk(requiredParentId: string, ctx: ProductScopeScanContext): boolean {
  if (!requiredParentId) return true;
  const parent = (ctx.parent_id ?? '').trim();
  return !!parent && parent === requiredParentId;
}

function fieldValue(field: string, ctx: ProductScopeScanContext): string {
  switch (field) {
    case 'product_name':
      return normalizeForBrandComparison(ctx.productName ?? '');
    case 'gtin':
    case 'barcode':
      return normalizeForBrandComparison(ctx.barcode ?? '');
    default:
      return '';
  }
}

function termMatches(criterion: SignalProductScopeCriterion, hayNormalized: string): boolean {
  if (!hayNormalized || !criterion.match_value_normalized) return false;
  if (criterion.match_mode === 'exact_normalized') {
    return hayNormalized === criterion.match_value_normalized;
  }
  // phrase_contains (default): whole-phrase token boundary via padded spaces
  const hay = ` ${hayNormalized} `;
  const needle = ` ${criterion.match_value_normalized} `;
  return hay.includes(needle);
}

/**
 * True when at least one reviewed criterion for the target matches the scan.
 * Fail closed when no criteria exist or none match.
 */
export function signalTargetProductScopeMatches(
  maps: SignalProductScopeMaps,
  signalTargetId: string,
  ctx: ProductScopeScanContext
): boolean {
  const tid = (signalTargetId ?? '').trim();
  if (!tid) return false;
  const criteria = maps.criteriaByTargetId.get(tid);
  if (!criteria || criteria.length === 0) return false;

  for (const c of criteria) {
    if (!marketAllows(c.market_key, ctx.scanMarketPublic)) continue;
    if (!brandAnchorOk(c.required_brand_id, ctx)) continue;
    if (!parentAnchorOk(c.required_parent_id, ctx)) continue;
    const hay = fieldValue(c.match_field, ctx);
    if (!hay) continue;
    if (termMatches(c, hay)) return true;
  }
  return false;
}
