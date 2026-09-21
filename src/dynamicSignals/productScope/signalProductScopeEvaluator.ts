/**
 * Workstream C — generic Signal product-scope evaluator (MVP recall doctrine, 22 Sep 2026).
 *
 * A target's reviewed criteria are alternative product_name descriptors for the same
 * product line: any one match is sufficient (OR). Market and brand/parent anchors are
 * mandatory on each descriptor.
 * Product-specific Signals fail closed when Chaining identity is unresolved.
 * Pack size, batch, date and retailer are card qualification content, never scope triggers.
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
  match_field: 'product_name';
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
  brandIsUnderAnchor?: (scanBrandId: string, anchorBrandId: string) => boolean;
};

export function buildSignalProductScopeMapsFromCsvRecords(
  rows: CsvRecord[]
): SignalProductScopeMaps {
  const criteriaByTargetId = new Map<string, SignalProductScopeCriterion[]>();
  for (const r of rows) {
    if ((r.review_state ?? '').trim() !== 'reviewed') continue;
    // MVP scope is product_name descriptors only — pack/batch/date/GTIN rows never gate display.
    const match_field = ((r.match_field ?? '').trim() || 'product_name').toLowerCase();
    if (match_field !== 'product_name') continue;
    const signal_target_id = (r.signal_target_id ?? '').trim();
    const criterion_id = (r.criterion_id ?? '').trim();
    const match_value = (r.match_value ?? '').trim();
    const required_brand_id = (r.required_brand_id ?? '').trim();
    const required_parent_id = (r.required_parent_id ?? '').trim();
    // Product-scope rows must be Chaining-anchored — skip unanchored reviewed rows (fail closed).
    if (!required_brand_id && !required_parent_id) continue;
    if (!signal_target_id || !criterion_id || !match_value) continue;
    const match_value_normalized =
      (r.match_value_normalized ?? '').trim() || normalizeForBrandComparison(match_value);
    if (!match_value_normalized) continue;
    const row: SignalProductScopeCriterion = {
      criterion_id,
      signal_target_id,
      market_key: (r.market_key ?? '').trim(),
      required_brand_id,
      required_parent_id,
      match_field: 'product_name',
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

function brandAnchorOk(requiredBrandId: string, ctx: ProductScopeScanContext): boolean {
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

function termMatches(criterion: SignalProductScopeCriterion, hayNormalized: string): boolean {
  if (!hayNormalized || !criterion.match_value_normalized) return false;
  if (criterion.match_mode === 'exact_normalized') {
    return hayNormalized === criterion.match_value_normalized;
  }
  return ` ${hayNormalized} `.includes(` ${criterion.match_value_normalized} `);
}

function criterionSatisfied(
  c: SignalProductScopeCriterion,
  ctx: ProductScopeScanContext
): boolean {
  if (!marketAllows(c.market_key, ctx.scanMarketPublic)) return false;
  if (!brandAnchorOk(c.required_brand_id, ctx)) return false;
  if (!parentAnchorOk(c.required_parent_id, ctx)) return false;
  return termMatches(c, normalizeForBrandComparison(ctx.productName ?? ''));
}

/**
 * True when any one reviewed descriptor matches the scanned product line.
 * Fail closed when Chaining brand/parent is unresolved or the target has no criteria.
 */
export function signalTargetProductScopeMatches(
  maps: SignalProductScopeMaps,
  signalTargetId: string,
  ctx: ProductScopeScanContext
): boolean {
  const tid = (signalTargetId ?? '').trim();
  if (!tid) return false;

  // Mandatory Shared Identity resolution for any product-specific Signal.
  if (!(ctx.brand_id ?? '').trim() && !(ctx.parent_id ?? '').trim()) {
    return false;
  }

  const criteria = maps.criteriaByTargetId.get(tid);
  if (!criteria || criteria.length === 0) return false;

  return criteria.some((c) => criterionSatisfied(c, ctx));
}
