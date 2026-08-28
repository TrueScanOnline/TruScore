/**
 * Maps a real scanned product + frozen Workstream A v0.15 CSV snapshots (read-only) to a reviewed
 * retail chain for Workstream C subject-link matching. Does not mutate A-data on disk.
 *
 * MVP identity contract (Wave 1 clarification 2026-08-07):
 * Product → Brand/Sub-brand → Parent/Responsible Entity — levels coexist, they do not compete.
 * Resolved chain exposes brand_id (specific) + parent_id (entity). Signal eligibility is evaluated
 * only at each Signal’s approved subject scope (brand vs parent vs product_family vs product).
 *
 * Product title may refine a broad same-entity brand (e.g. Nestlé → KitKat) via reviewed aliases.
 * generic_name must not independently establish or override the primary brand.
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

function hasExplicitBrandEvidence(product: Product): boolean {
  return splitBrandCandidates(product).length > 0;
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
  const blob = `${product.product_name ?? ''} ${product.brands ?? ''}`.toLowerCase();
  if (/\b(chocolate|cocoa)\b/.test(blob)) return true;
  if (/\bconfectionery\b/.test(blob)) return true;
  if (/\bdairy\s*milk\b/.test(blob) || blob.includes('dairymilk')) return true;
  return false;
}

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

function reviewedAliasForms(row: CsvRecord): string[] {
  return [normalizeCompact(row.alias_normalized ?? ''), normalizeCompact(row.alias_text ?? '')].filter(Boolean);
}

type GovernedLeadingPhrase = {
  brand_id: string;
  parent_id: string;
  phrase: string;
};

function buildGovernedLeadingPhrases(
  canonicalRows: CsvRecord[],
  aliasRows: CsvRecord[],
  aData: ADataMaps
): GovernedLeadingPhrase[] {
  const out: GovernedLeadingPhrase[] = [];
  const seen = new Set<string>();

  const pushPhrase = (brand_id: string, phrase: string) => {
    const trimmed = phrase.trim();
    if (!trimmed) return;
    const parent_id = aData.brandsById.get(brand_id)?.parent_id ?? '';
    if (!parent_id) return;
    const key = `${brand_id}|${trimmed.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ brand_id, parent_id, phrase: trimmed });
  };

  for (const row of canonicalRows) {
    if ((row.review_state ?? '').trim() !== 'reviewed') continue;
    const bid = row.brand_id ?? '';
    if (!bid) continue;
    pushPhrase(bid, row.canonical_brand_name ?? '');
    const display = (row.display_brand_name ?? '').trim();
    if (display && display !== (row.canonical_brand_name ?? '').trim()) {
      pushPhrase(bid, display);
    }
  }

  for (const row of aliasRows) {
    if ((row.review_state ?? '').trim() !== 'reviewed') continue;
    const bid = row.brand_id ?? '';
    if (!bid) continue;
    const aliasText = (row.alias_text ?? '').trim();
    if (aliasText) pushPhrase(bid, aliasText);
  }

  return out;
}

/** Leading governed phrase at product_name start with a proper token boundary (not compact prefix). */
function productNameLeadingPhraseMatches(productName: string, phrase: string): boolean {
  const name = productName.trim();
  const p = phrase.trim();
  if (!name || !p) return false;
  if (name.length < p.length) return false;
  if (name.slice(0, p.length).toLowerCase() !== p.toLowerCase()) return false;
  const next = name.charAt(p.length);
  return next === '' || /[^a-zA-Z0-9]/.test(next);
}

function leadingWhitelistHits(productName: string, phrases: GovernedLeadingPhrase[]): GovernedLeadingPhrase[] {
  return phrases.filter((p) => productNameLeadingPhraseMatches(productName, p.phrase));
}

function pickLongestLeadingHits(
  hits: GovernedLeadingPhrase[],
  push?: (s: string) => void
): GovernedLeadingPhrase[] | null {
  if (hits.length === 0) return [];
  const maxLen = Math.max(...hits.map((h) => h.phrase.length));
  const longest = hits.filter((h) => h.phrase.length === maxLen);
  const parentIds = new Set(longest.map((h) => h.parent_id));
  const brandIds = new Set(longest.map((h) => h.brand_id));
  if (parentIds.size > 1 || brandIds.size > 1) {
    push?.(
      'chain_resolve: fail_closed — ambiguous leading product_name whitelist match across canonical families'
    );
    return null;
  }
  return longest;
}

function buildChildOfMap(brandChildRows: CsvRecord[]): Map<string, string> {
  const childOf = new Map<string, string>();
  for (const row of brandChildRows) {
    if ((row.review_state ?? '').trim() !== 'reviewed') continue;
    const bid = row.brand_id ?? '';
    const parent = row.parent_brand_id ?? '';
    if (bid && parent) childOf.set(bid, parent);
  }
  return childOf;
}

function isCompatibleProductNameRefinement(
  fromBrands: Set<string>,
  candidateId: string,
  aData: ADataMaps,
  childOf: Map<string, string>
): boolean {
  const candidateParent = aData.brandsById.get(candidateId)?.parent_id;
  for (const baseId of fromBrands) {
    if (candidateId === baseId) return true;
    if (childOf.get(candidateId) === baseId) return true;
    const baseParent = aData.brandsById.get(baseId)?.parent_id;
    if (baseParent && candidateParent === baseParent) return true;
  }
  return false;
}

function collectFromBrandsField(
  product: Product,
  aliasRows: CsvRecord[],
  canonicalRows: CsvRecord[]
): Set<string> {
  const fromBrands = new Set<string>();
  const brandTokens = splitBrandCandidates(product).map((s) => normalizeCompact(s));

  for (const row of aliasRows) {
    if ((row.review_state ?? '').trim() !== 'reviewed') continue;
    const bid = row.brand_id ?? '';
    if (!bid) continue;
    const forms = reviewedAliasForms(row);
    for (const tok of brandTokens) {
      if (tok && forms.includes(tok)) {
        fromBrands.add(bid);
        break;
      }
    }
  }

  for (const row of canonicalRows) {
    if ((row.review_state ?? '').trim() !== 'reviewed') continue;
    const bid = row.brand_id ?? '';
    if (!bid) continue;
    const forms = [
      normalizeCompact(row.canonical_brand_name ?? ''),
      normalizeCompact(row.display_brand_name ?? ''),
    ].filter(Boolean);
    for (const tok of brandTokens) {
      if (tok && forms.includes(tok)) {
        fromBrands.add(bid);
        break;
      }
    }
  }

  return fromBrands;
}

function collectFromProductNameLeadingWhitelist(
  product: Product,
  fromBrands: Set<string>,
  phrases: GovernedLeadingPhrase[],
  aData: ADataMaps,
  childOf: Map<string, string>,
  push?: (s: string) => void
): Set<string> | null {
  const productName = product.product_name ?? '';
  if (!productName.trim()) return new Set();

  if (hasExplicitBrandEvidence(product) && fromBrands.size === 0) {
    return new Set();
  }

  const hits = leadingWhitelistHits(productName, phrases);
  const longest = pickLongestLeadingHits(hits, push);
  if (longest === null) return null;

  const fromProductName = new Set<string>();
  for (const hit of longest) {
    if (fromBrands.size === 0) {
      fromProductName.add(hit.brand_id);
      continue;
    }
    if (isCompatibleProductNameRefinement(fromBrands, hit.brand_id, aData, childOf)) {
      fromProductName.add(hit.brand_id);
    }
  }

  return fromProductName;
}

function collectCandidateBrandIds(
  product: Product,
  aliasRows: CsvRecord[],
  canonicalRows: CsvRecord[],
  aData: ADataMaps,
  brandChildRows: CsvRecord[],
  push?: (s: string) => void
): { fromBrands: Set<string>; fromProductName: Set<string> } | null {
  const fromBrands = collectFromBrandsField(product, aliasRows, canonicalRows);
  const phrases = buildGovernedLeadingPhrases(canonicalRows, aliasRows, aData);
  const childOf = buildChildOfMap(brandChildRows);
  const fromProductName = collectFromProductNameLeadingWhitelist(
    product,
    fromBrands,
    phrases,
    aData,
    childOf,
    push
  );
  if (fromProductName === null) return null;
  return { fromBrands, fromProductName };
}

/**
 * Select primary brand_id for the chain. Same-entity product_name refinement (Nestlé brands +
 * KitKat title → B0060) keeps parent_id from that brand’s governed parent (Nestlé S.A.).
 * Cross-parent conflict between brands-field and product_name refinements → fail closed (null).
 */
function pickPrimaryBrandId(
  fromBrands: Set<string>,
  fromProductName: Set<string>,
  aData: ADataMaps,
  canonicalRows: CsvRecord[],
  aliasRows: CsvRecord[],
  product: Product,
  push?: (s: string) => void
): string | null {
  const parentOf = (id: string) => aData.brandsById.get(id)?.parent_id;

  if (hasExplicitBrandEvidence(product) && fromBrands.size === 0) {
    push?.(
      'chain_resolve: fail_closed — explicit brand evidence present but unresolved; product_name-only inference blocked'
    );
    return null;
  }

  if (fromBrands.size > 0 && fromProductName.size > 0) {
    const brandParents = new Set([...fromBrands].map(parentOf).filter(Boolean) as string[]);
    const nameParents = new Set([...fromProductName].map(parentOf).filter(Boolean) as string[]);
    const overlap = [...nameParents].some((p) => brandParents.has(p));
    if (!overlap) {
      push?.(
        'chain_resolve: fail_closed — product_name brand refinement conflicts with brands-field parent entity'
      );
      return null;
    }
  }

  const candidates = new Set<string>([...fromBrands, ...fromProductName]);
  if (candidates.size === 0) return null;

  const brandTokens = new Set(splitBrandCandidates(product).map((s) => normalizeCompact(s)));

  const aliasByBrand = new Map<string, string[]>();
  for (const row of aliasRows) {
    if ((row.review_state ?? '').trim() !== 'reviewed') continue;
    const bid = row.brand_id ?? '';
    if (!bid || !candidates.has(bid)) continue;
    aliasByBrand.set(bid, [...(aliasByBrand.get(bid) ?? []), ...reviewedAliasForms(row)]);
  }

  let bestId: string | null = null;
  let bestScore = -1;
  for (const id of candidates) {
    const row = canonicalRows.find((r) => r.brand_id === id);
    if (!row) continue;
    const forms = [
      normalizeCompact(row.canonical_brand_name ?? ''),
      normalizeCompact(row.display_brand_name ?? ''),
      ...(aliasByBrand.get(id) ?? []),
    ].filter(Boolean);
    let brandHitLen = 0;
    for (const f of forms) {
      if (brandTokens.has(f)) brandHitLen = Math.max(brandHitLen, f.length);
    }
    const fromName = fromProductName.has(id);
    const score = fromName && !fromBrands.has(id) ? 1000 : brandHitLen > 0 ? 100 + brandHitLen : fromName ? 50 : 0;
    const nameLen = Math.max((row.canonical_brand_name ?? '').length, (row.display_brand_name ?? '').length);
    const tieBreak = score * 1000 + nameLen;
    if (tieBreak > bestScore) {
      bestScore = tieBreak;
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
  product?: Product | null;
  productName: string;
  aData: ADataMaps;
  canonicalBrandRows: CsvRecord[];
  brandAliasRows: CsvRecord[];
  brandChildRows?: CsvRecord[];
  injected?: InjectedUatChain | null;
  logLines?: string[];
  /**
   * Historical Skeleton UAT Cadbury→B0241 bridge. Default **false** (production).
   * Pass true only in explicit historical regression tests.
   */
  applyCadburyUatBridge?: boolean;
}): ResolvedRetailChain | null {
  const push = (s: string) => input.logLines?.push(s);
  const useCadburyBridge = input.applyCadburyUatBridge === true;
  const brandChildRows = input.brandChildRows ?? [];

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
    const collected = collectCandidateBrandIds(
      input.product,
      input.brandAliasRows,
      input.canonicalBrandRows,
      input.aData,
      brandChildRows,
      push
    );
    if (!collected) return null;

    const { fromBrands, fromProductName } = collected;
    const best = pickPrimaryBrandId(
      fromBrands,
      fromProductName,
      input.aData,
      input.canonicalBrandRows,
      input.brandAliasRows,
      input.product,
      push
    );
    if (best) {
      const validated = validateReviewedChain(best, input.aData);
      if (validated) {
        if (
          useCadburyBridge &&
          validated.brand_id === 'B0067' &&
          validated.parent_id === 'P0009' &&
          !isChocolateOrCocoaContext(input.product)
        ) {
          push?.(
            'cadbury_ngo_subject_bridge: not applied — B0067 Cadbury + P0009 Mondelez but no chocolate/cocoa/confectionery signals (fail closed for B0241 NGO links)'
          );
        }
        const bridged = useCadburyBridge
          ? applyCadburyNgoSubjectBridge(validated, input.product, push)
          : validated;
        if (!useCadburyBridge) {
          push?.('cadbury_ngo_subject_bridge: skipped (production Dynamic Signals Asset path)');
        }
        push?.(
          `chain_resolve: brand_id=${bridged.brand_id} parent_id=${bridged.parent_id} source=identity_resolution (specific_brand+parent_entity; product_name_refine=${fromProductName.has(bridged.brand_id) ? '1' : '0'})`
        );
        return bridged;
      }
    }
    push?.('chain_resolve: identity_resolution found no reviewed brand/parent chain from product fields');
    const gtinFallback = tryReviewedGtinChain(input.barcode, input.aData, push);
    if (gtinFallback) return gtinFallback;
    return null;
  }

  return tryReviewedGtinChain(input.barcode, input.aData, push);
}

function tryReviewedGtinChain(
  barcode: string,
  aData: ADataMaps,
  push?: (s: string) => void
): ResolvedRetailChain | null {
  const g = aData.gtinRows.get(barcode);
  if (g && g.link_review_state === 'reviewed') {
    const b = aData.brandsById.get(g.brand_id);
    const p = aData.parentsById.get(g.parent_id);
    if (b?.review_state === 'reviewed' && p?.review_state === 'reviewed' && b.parent_id === g.parent_id) {
      push?.(
        `chain_resolve: brand_id=${g.brand_id} parent_id=${g.parent_id} source=gtin_link_supplementary`
      );
      return { brand_id: g.brand_id, parent_id: g.parent_id, source: 'gtin_link' };
    }
  }
  return null;
}

export {
  productNameLeadingPhraseMatches,
  buildGovernedLeadingPhrases,
  leadingWhitelistHits,
};
