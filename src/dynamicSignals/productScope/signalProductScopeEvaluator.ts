/**
 * Workstream C — generic Signal product-scope evaluator.
 *
 * Scope groups: conditions within one scope_group_id are AND;
 * alternative complete groups for a target are OR.
 * Brand/parent and market anchors are mandatory.
 * Product-specific Signals fail closed when Chaining identity is unresolved.
 * No brand/product/Signal-id hardcoding.
 */

import type { CsvRecord } from '../../identity/workstreamA/csv';
import { normalizeForBrandComparison } from '../../identity/workstreamA/catalogueAudit';

export type SignalProductScopeCriterion = {
  criterion_id: string;
  signal_target_id: string;
  scope_group_id: string;
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
  /** OFF / scan pack quantity string when present */
  quantity?: string | null;
  product_quantity?: number | null;
  product_quantity_unit?: string | null;
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
    const required_brand_id = (r.required_brand_id ?? '').trim();
    const required_parent_id = (r.required_parent_id ?? '').trim();
    // Product-scope rows must be Chaining-anchored — skip unanchored reviewed rows (fail closed).
    if (!required_brand_id && !required_parent_id) continue;
    if (!signal_target_id || !criterion_id || !match_value) continue;
    const scope_group_id =
      (r.scope_group_id ?? '').trim() || `${signal_target_id}__${criterion_id}`;
    const match_value_normalized =
      (r.match_value_normalized ?? '').trim() || normalizeForBrandComparison(match_value);
    if (!match_value_normalized) continue;
    const row: SignalProductScopeCriterion = {
      criterion_id,
      signal_target_id,
      scope_group_id,
      market_key: (r.market_key ?? '').trim(),
      required_brand_id,
      required_parent_id,
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

function normalizePackQuantityToken(input: string): string {
  // Collapse "190 g" / "1.3 kg" style forms after base normalisation.
  return normalizeForBrandComparison(input)
    .replace(/(\d)\s+(g|kg|mg|ml|l|cl)\b/g, '$1$2')
    .replace(/\s+/g, ' ')
    .trim();
}

function packQuantityHaystack(ctx: ProductScopeScanContext): string {
  const parts: string[] = [];
  if (ctx.product_quantity != null && Number.isFinite(ctx.product_quantity)) {
    const unit = (ctx.product_quantity_unit ?? '').trim();
    parts.push(unit ? `${ctx.product_quantity} ${unit}` : String(ctx.product_quantity));
  }
  if (typeof ctx.quantity === 'string' && ctx.quantity.trim()) {
    parts.push(ctx.quantity.trim());
  }
  if (ctx.productName) {
    parts.push(ctx.productName);
  }
  return normalizePackQuantityToken(parts.join(' '));
}

function fieldValue(field: string, ctx: ProductScopeScanContext): string {
  switch (field) {
    case 'product_name':
      return normalizeForBrandComparison(ctx.productName ?? '');
    case 'pack_quantity':
      return packQuantityHaystack(ctx);
    case 'gtin':
    case 'barcode':
      return normalizeForBrandComparison(ctx.barcode ?? '');
    default:
      return '';
  }
}

function termMatches(criterion: SignalProductScopeCriterion, hayNormalized: string): boolean {
  if (!hayNormalized || !criterion.match_value_normalized) return false;
  const needleRaw =
    criterion.match_field === 'pack_quantity'
      ? normalizePackQuantityToken(criterion.match_value_normalized)
      : criterion.match_value_normalized;
  if (criterion.match_mode === 'exact_normalized') {
    return hayNormalized === needleRaw;
  }
  const hay = ` ${hayNormalized} `;
  const needle = ` ${needleRaw} `;
  return hay.includes(needle);
}

function criterionSatisfied(
  c: SignalProductScopeCriterion,
  ctx: ProductScopeScanContext
): boolean {
  if (!marketAllows(c.market_key, ctx.scanMarketPublic)) return false;
  if (!brandAnchorOk(c.required_brand_id, ctx)) return false;
  if (!parentAnchorOk(c.required_parent_id, ctx)) return false;
  const hay = fieldValue(c.match_field, ctx);
  if (!hay) return false;
  return termMatches(c, hay);
}

/**
 * True when one complete reviewed scope group matches (AND within group, OR across groups).
 * Fail closed when Chaining brand/parent is unresolved, or no criteria / incomplete group.
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

  const byGroup = new Map<string, SignalProductScopeCriterion[]>();
  for (const c of criteria) {
    const prev = byGroup.get(c.scope_group_id) ?? [];
    prev.push(c);
    byGroup.set(c.scope_group_id, prev);
  }

  for (const group of byGroup.values()) {
    if (group.length === 0) continue;
    if (group.every((c) => criterionSatisfied(c, ctx))) return true;
  }
  return false;
}
