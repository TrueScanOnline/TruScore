/**
 * Maps a real scanned product + frozen Workstream A v0.14 CSV snapshots (read-only) to a reviewed
 * retail chain for Workstream C subject-link matching. Does not mutate A-data on disk.
 *
 * Identity path: OFF/product brand strings → alias + canonical brand rows → validated brand_id/parent_id.
 * Optional app-layer bridge: generic Cadbury (B0067) + chocolate/cocoa context → B0241 for NGO links
 * that target Cadbury Dairy Milk (SL008/SL011), without editing closed A-data.
 *
 * GTIN→chain remains a non-runtime fallback when `product` is absent (scripts only).
 */

import type { Product } from '../../types/product';
import type { CsvRecord } from '../../identity/workstreamA/csv';
import type { ADataMaps, InjectedUatChain, ResolvedRetailChain } from './workstreamCPublicationCore';

export type ResolvedRetailChainSource = ResolvedRetailChain['source'];

function normalizeCompact(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function splitBrandCandidates(product: Product): string[] {
  const out: string[] = [];
  if (typeof product.brand_owner === 'string' && product.brand_owner.trim()) {
    out.push(product.brand_owner.trim());
  }
  if (typeof product.brands === 'string' && product.brands.trim()) {
    for (const part of product.brands.split(',')) {
      const t = part.trim();
      if (t) out.push(t);
    }
  }
  return [...new Set(out)];
}

/**
 * Tight heuristic for the B0067→B0241 NGO subject bridge only.
 * Fails closed: ambiguous snack/cracker categories without chocolate/cocoa/confectionery cues → false.
 * Does not treat all Mondelez products as chocolate (Ritz/Philadelphia resolve to other brand_ids).
 */
export function isChocolateOrCocoaContext(product: Product): boolean {
  const tags = product.categories_tags ?? [];
  for (const t of tags) {
    const low = t.toLowerCase();
    if (
      low.includes('chocolate') ||
      low.includes('cocoa') ||
      low.includes('confection') ||
      low.includes('candy')
    ) {
      return true;
    }
  }
  const blob = `${product.product_name ?? ''} ${product.brands ?? ''} ${product.generic_name ?? ''}`.toLowerCase();
  if (/\b(chocolate|cocoa)\b/.test(blob)) return true;
  if (/\bconfectionery\b/.test(blob)) return true;
  if (/\bdairy\s*milk\b/.test(blob) || blob.includes('dairymilk')) return true;
  return false;
}

/**
 * NGO subject links SL008/SL011 target B0241. Plain OFF "Cadbury" often resolves to B0067; bridge only when
 * Mondelez parent P0009 + reviewed Cadbury B0067 + chocolate/cocoa/confectionery context (app layer only).
 */
function applyCadburyNgoSubjectBridge(
  chain: ResolvedRetailChain,
  product: Product,
  push?: (s: string) => void
): ResolvedRetailChain {
  if (chain.brand_id === 'B0067' && chain.parent_id === 'P0009' && isChocolateOrCocoaContext(product)) {
    push?.(
      'cadbury_ngo_subject_bridge: applied B0067+P0009 -> B0241+P0009 (Cadbury Dairy Milk row) for SL008/SL011; chocolate/cocoa/confectionery context OK'
    );
    return { brand_id: 'B0241', parent_id: 'P0009', source: chain.source };
  }
  return chain;
}

function collectCandidateBrandIds(
  product: Product,
  aliasRows: CsvRecord[],
  canonicalRows: CsvRecord[]
): Set<string> {
  const ids = new Set<string>();
  const tokens = splitBrandCandidates(product).map((s) => normalizeCompact(s));
  const blob = normalizeCompact(
    [...splitBrandCandidates(product), product.product_name ?? '', product.generic_name ?? ''].join(' ')
  );

  for (const row of aliasRows) {
    if ((row.review_state ?? '').trim() !== 'reviewed') continue;
    const bid = row.brand_id ?? '';
    if (!bid) continue;
    const an = normalizeCompact(row.alias_normalized ?? '');
    const at = normalizeCompact(row.alias_text ?? '');
    if (!an && !at) continue;
    let hit = false;
    for (const tok of tokens) {
      if (tok && (tok === an || tok === at)) {
        hit = true;
        break;
      }
    }
    if (!hit && an.length >= 8 && blob.includes(an)) hit = true;
    if (hit) ids.add(bid);
  }

  for (const row of canonicalRows) {
    if ((row.review_state ?? '').trim() !== 'reviewed') continue;
    const bid = row.brand_id ?? '';
    if (!bid) continue;
    const c1 = normalizeCompact(row.canonical_brand_name ?? '');
    const c2 = normalizeCompact(row.display_brand_name ?? '');
    for (const tok of tokens) {
      if (tok && ((c1 && tok === c1) || (c2 && tok === c2))) {
        ids.add(bid);
        break;
      }
    }
  }

  return ids;
}

function pickLongestCanonicalBrand(candidateIds: Set<string>, canonicalRows: CsvRecord[]): string | null {
  let bestId: string | null = null;
  let bestLen = -1;
  for (const id of candidateIds) {
    const row = canonicalRows.find((r) => r.brand_id === id);
    if (!row) continue;
    const len = Math.max((row.canonical_brand_name ?? '').length, (row.display_brand_name ?? '').length);
    if (len > bestLen) {
      bestLen = len;
      bestId = id;
    }
  }
  return bestId;
}

function validateReviewedChain(brand_id: string, aData: ADataMaps): ResolvedRetailChain | null {
  const b = aData.brandsById.get(brand_id);
  if (!b || b.review_state !== 'reviewed') return null;
  const p = aData.parentsById.get(b.parent_id);
  if (!p || p.review_state !== 'reviewed') return null;
  return { brand_id, parent_id: b.parent_id, source: 'identity_resolution' };
}

export function resolveReviewedRetailChainUnified(input: {
  barcode: string;
  /** Real product — supermarket runtime always passes this; omit for script/injected-only harnesses. */
  product?: Product | null;
  productName: string;
  aData: ADataMaps;
  canonicalBrandRows: CsvRecord[];
  brandAliasRows: CsvRecord[];
  injected?: InjectedUatChain | null;
  logLines?: string[];
}): ResolvedRetailChain | null {
  const push = (s: string) => input.logLines?.push(s);

  if (input.injected) {
    const b = input.aData.brandsById.get(input.injected.brand_id);
    const p = input.aData.parentsById.get(input.injected.parent_id);
    if (!b || b.review_state !== 'reviewed') return null;
    if (!p || p.review_state !== 'reviewed') return null;
    if (b.parent_id !== input.injected.parent_id) return null;
    push?.(
      `chain_resolve: brand_id=${input.injected.brand_id} parent_id=${input.injected.parent_id} source=injected_uat_fixture`
    );
    return {
      brand_id: input.injected.brand_id,
      parent_id: input.injected.parent_id,
      source: 'injected_uat_fixture',
    };
  }

  if (input.product) {
    const candidates = collectCandidateBrandIds(input.product, input.brandAliasRows, input.canonicalBrandRows);
    const best = pickLongestCanonicalBrand(candidates, input.canonicalBrandRows);
    if (best) {
      const validated = validateReviewedChain(best, input.aData);
      if (validated) {
        if (
          validated.brand_id === 'B0067' &&
          validated.parent_id === 'P0009' &&
          !isChocolateOrCocoaContext(input.product)
        ) {
          push?.(
            'cadbury_ngo_subject_bridge: not applied — B0067 Cadbury + P0009 Mondelez but no chocolate/cocoa/confectionery signals (fail closed for B0241 NGO links)'
          );
        }
        const bridged = applyCadburyNgoSubjectBridge(validated, input.product, push);
        push?.(
          `chain_resolve: brand_id=${bridged.brand_id} parent_id=${bridged.parent_id} source=identity_resolution`
        );
        return bridged;
      }
    }
    push?.('chain_resolve: identity_resolution found no reviewed brand/parent chain from product fields');
    return null;
  }

  const g = input.aData.gtinRows.get(input.barcode);
  if (g && g.link_review_state === 'reviewed') {
    const b = input.aData.brandsById.get(g.brand_id);
    const p = input.aData.parentsById.get(g.parent_id);
    if (b?.review_state === 'reviewed' && p?.review_state === 'reviewed') {
      push?.(`chain_resolve: brand_id=${g.brand_id} parent_id=${g.parent_id} source=gtin_link`);
      return { brand_id: g.brand_id, parent_id: g.parent_id, source: 'gtin_link' };
    }
  }

  return null;
}
