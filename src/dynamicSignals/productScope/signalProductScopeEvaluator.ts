/**
 * Workstream C — Signal product-scope evaluator (workbook 20260926 / FINAL v1.1).
 *
 * For product / exact_only targets (after market gate at publication layer):
 *   product relevance = GTIN exact match against verified_gtins
 *                    OR (Chaining identity to required brand/parent
 *                        AND positive product-name phrase
 *                        AND no product-name exclusion match)
 *
 * Positive phrase criteria are OR'd. Exclusion criteria block only the
 * identity+name route; a verified GTIN hit is never vetoed by an exclusion.
 * Pack size, batch, date and retailer remain qualification content, never scope gates.
 * product_name_exclude is not a product_scope_guard.
 */

import type { CsvRecord } from '../../identity/workstreamA/csv';
import { normalizeForBrandComparison } from '../../identity/workstreamA/catalogueAudit';

export type SignalProductScopeMatchField = 'product_name' | 'gtin' | 'product_name_exclude';

export type SignalProductScopeCriterion = {
  criterion_id: string;
  signal_target_id: string;
  market_key: string;
  required_brand_id: string;
  required_parent_id: string;
  match_field: SignalProductScopeMatchField;
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

function normalizeGtin(value: string): string {
  return String(value || '').replace(/\D/g, '');
}

export function buildSignalProductScopeMapsFromCsvRecords(
  rows: CsvRecord[]
): SignalProductScopeMaps {
  const criteriaByTargetId = new Map<string, SignalProductScopeCriterion[]>();
  for (const r of rows) {
    if ((r.review_state ?? '').trim() !== 'reviewed') continue;
    const match_field_raw = ((r.match_field ?? '').trim() || 'product_name').toLowerCase();
    if (
      match_field_raw !== 'product_name' &&
      match_field_raw !== 'gtin' &&
      match_field_raw !== 'product_name_exclude'
    ) {
      continue;
    }

    const signal_target_id = (r.signal_target_id ?? '').trim();
    const criterion_id = (r.criterion_id ?? '').trim();
    const match_value = (r.match_value ?? '').trim();
    const required_brand_id = (r.required_brand_id ?? '').trim();
    const required_parent_id = (r.required_parent_id ?? '').trim();
    if (!signal_target_id || !criterion_id || !match_value) continue;

    // Phrase / exclusion criteria must be Chaining-anchored.
    // GTIN criteria may carry anchors for provenance but do not require them to load.
    if (
      (match_field_raw === 'product_name' || match_field_raw === 'product_name_exclude') &&
      !required_brand_id &&
      !required_parent_id
    ) {
      continue;
    }

    let match_value_normalized =
      (r.match_value_normalized ?? '').trim() ||
      (match_field_raw === 'gtin' ? normalizeGtin(match_value) : normalizeForBrandComparison(match_value));
    if (match_field_raw === 'gtin') match_value_normalized = normalizeGtin(match_value_normalized);
    if (!match_value_normalized) continue;

    const row: SignalProductScopeCriterion = {
      criterion_id,
      signal_target_id,
      market_key: (r.market_key ?? '').trim(),
      required_brand_id,
      required_parent_id,
      match_field: match_field_raw,
      match_mode:
        match_field_raw === 'gtin'
          ? 'exact'
          : ((r.match_mode ?? '').trim() || 'phrase_contains').toLowerCase(),
      match_value: match_field_raw === 'gtin' ? match_value_normalized : match_value,
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

function gtinMatches(criterion: SignalProductScopeCriterion, barcode: string): boolean {
  const scan = normalizeGtin(barcode);
  if (!scan || !criterion.match_value_normalized) return false;
  return scan === criterion.match_value_normalized;
}

function identityAnchorsOk(c: SignalProductScopeCriterion, ctx: ProductScopeScanContext): boolean {
  if (!brandAnchorOk(c.required_brand_id, ctx)) return false;
  if (!parentAnchorOk(c.required_parent_id, ctx)) return false;
  return true;
}

function criterionSatisfied(
  c: SignalProductScopeCriterion,
  ctx: ProductScopeScanContext
): boolean {
  if (!marketAllows(c.market_key, ctx.scanMarketPublic)) return false;

  if (c.match_field === 'gtin') {
    // GTIN path: market + exact barcode. Identity not required.
    return gtinMatches(c, ctx.barcode ?? '');
  }

  // Phrase / exclusion path: market + Chaining identity anchors + product_name phrase.
  if (!identityAnchorsOk(c, ctx)) return false;
  return termMatches(c, normalizeForBrandComparison(ctx.productName ?? ''));
}

/**
 * True when any one reviewed positive criterion matches and no exclusion blocks
 * the name route (exclusions never veto a GTIN hit).
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

  const hasGtinHit = criteria.some(
    (c) => c.match_field === 'gtin' && criterionSatisfied(c, ctx)
  );
  if (hasGtinHit) return true;

  const phraseCriteria = criteria.filter((c) => c.match_field === 'product_name');
  if (phraseCriteria.length === 0) return false;

  // Phrase path requires Shared Identity.
  if (!(ctx.brand_id ?? '').trim() && !(ctx.parent_id ?? '').trim()) {
    return false;
  }

  const hasPositivePhrase = phraseCriteria.some((c) => criterionSatisfied(c, ctx));
  if (!hasPositivePhrase) return false;

  // Exclusion layer: any matching governed exclusion blocks the name route only.
  const exclusionCriteria = criteria.filter((c) => c.match_field === 'product_name_exclude');
  if (exclusionCriteria.length === 0) return true;

  const hay = normalizeForBrandComparison(ctx.productName ?? '');
  const blocked = exclusionCriteria.some((c) => {
    if (!marketAllows(c.market_key, ctx.scanMarketPublic)) return false;
    // Exclusions use the same whole-word/phrase normalisation as positives.
    // Identity already validated by the positive hit; still require market match.
    return termMatches(c, hay);
  });
  return !blocked;
}
