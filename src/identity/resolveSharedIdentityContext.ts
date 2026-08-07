import type { Product } from '../types/product';
import {
  SHARED_IDENTITY_AMBIGUITY_FLAGS,
  type SharedIdentityAmbiguityFlag,
  type SharedIdentityContext,
  type SharedIdentityResolutionResult,
} from './types';
import type { ConfidenceState, MarketKeyResolution, ReviewState } from '../contracts/phase6/enums';

const NORMALIZER_VERSION = 'phase6-slice1-v1';

function normalizeToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[^a-z0-9 ]/g, '');
}

function toEntityId(prefix: string, raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const n = normalizeToken(raw);
  if (!n) return undefined;
  return `${prefix}:${n.replace(/\s+/g, '_')}`;
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

function resolveInternalMarketKey(rawMarket?: string | null, product?: Product): MarketKeyResolution {
  const hint = (rawMarket ?? '').trim().toUpperCase();
  if (hint === 'AU' || hint === 'NZ' || hint === 'AU+NZ') return hint;
  if (product?.true_scan_market === 'AU' || product?.true_scan_market === 'NZ') return product.true_scan_market;
  return 'AU+NZ';
}

function toPublicMarket(marketKey: MarketKeyResolution): 'AU' | 'NZ' | 'UNKNOWN' {
  if (marketKey === 'AU' || marketKey === 'NZ') return marketKey;
  // Never leak AU+NZ into public ProductScanResult.market.
  return 'UNKNOWN';
}

function resolveConfidence(ambiguityFlags: string[], brandCandidates: string[]): ConfidenceState {
  if (ambiguityFlags.length > 0) return 'low';
  if (brandCandidates.length > 0) return 'strong';
  return 'probable';
}

function resolveReviewState(ambiguityFlags: string[]): ReviewState {
  return ambiguityFlags.length > 0 ? 'provisional' : 'seeded';
}

export function resolveSharedIdentityContext(input: {
  gtin: string;
  product: Product;
  marketHint?: string | null;
  /** Reviewed Chaining product_family IDs for this GTIN (optional additive DSA v0.2). */
  productFamilyIds?: string[];
}): SharedIdentityResolutionResult {
  const { gtin, product, marketHint } = input;
  const brandCandidates = splitBrandCandidates(product);
  const ambiguityFlags: SharedIdentityAmbiguityFlag[] = [];

  if (brandCandidates.length === 0) ambiguityFlags.push(SHARED_IDENTITY_AMBIGUITY_FLAGS[0]);
  if (brandCandidates.length > 1) ambiguityFlags.push(SHARED_IDENTITY_AMBIGUITY_FLAGS[1]);

  const brandBase = brandCandidates[0] ?? 'unknown_brand';
  const brandId = toEntityId('brand', brandBase) ?? 'brand:unknown';
  const currentOwnerId = toEntityId('owner', product.brand_owner ?? brandCandidates[0]);
  const marketKey = resolveInternalMarketKey(marketHint, product);

  const context: SharedIdentityContext = {
    resolution_key: { gtin, market_key: marketKey },
    canonical: {
      product_id: `gtin:${gtin}`,
      brand_id: brandId,
      current_owner_entity_id: currentOwnerId,
      product_family_ids: input.productFamilyIds?.length ? [...input.productFamilyIds] : [],
    },
    operational_entities: {
      // Kept intentionally narrow in Slice 1/2; broader operational expansion is deferred.
      manufacturer_id: toEntityId('manufacturer', product.manufacturing_places),
    },
    quality: {
      confidence_state: resolveConfidence(ambiguityFlags, brandCandidates),
      review_state: resolveReviewState(ambiguityFlags),
      resolution_status: ambiguityFlags.length > 0 ? 'ambiguous' : 'resolved',
      ambiguity_flags: ambiguityFlags,
    },
    lineage: {
      source_refs: [product.source ?? 'unknown_source'],
      alias_hits: [],
      normalizer_version: NORMALIZER_VERSION,
    },
  };

  return {
    context,
    public_market: toPublicMarket(marketKey),
  };
}

