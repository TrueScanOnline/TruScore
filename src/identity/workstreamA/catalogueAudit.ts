import { WORKSTREAM_A_MATCH_STATUSES } from './enums';
import type { CatalogueAuditObservationRow } from './schema';

const PARENT_LEGAL_SUFFIXES = [
  /\blimited\b/gi,
  /\bltd\b/gi,
  /\bincorporated\b/gi,
  /\binc\b/gi,
  /\bcorp(?:oration)?\b/gi,
  /\bplc\b/gi,
  /\bgroup\b/gi,
  /\bholdings?\b/gi,
  /\bco\b/gi,
] as const;

export interface CanonicalBrandLookupRow {
  brand_id: string;
  canonical_brand_name: string;
  display_brand_name: string;
  parent_id: string;
}

export interface BrandAliasLookupRow {
  alias_id: string;
  alias_normalized: string;
  brand_id: string;
}

export interface CatalogueMatchResult {
  match_status: (typeof WORKSTREAM_A_MATCH_STATUSES)[number];
  normalized_brand_candidate: string;
  matched_brand_id?: string;
  matched_alias_id?: string;
}

export function normalizeForBrandComparison(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[^\x00-\x7F]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeParentNameForComparison(input: string): string {
  let normalized = normalizeForBrandComparison(input);
  for (const suffix of PARENT_LEGAL_SUFFIXES) {
    normalized = normalized.replace(suffix, ' ');
  }
  return normalized.replace(/\s+/g, ' ').trim();
}

export function matchCatalogueBrandCandidate(
  candidateRaw: string,
  canonicalBrands: readonly CanonicalBrandLookupRow[],
  aliases: readonly BrandAliasLookupRow[]
): CatalogueMatchResult {
  const normalized = normalizeForBrandComparison(candidateRaw);
  if (!normalized) {
    return { match_status: 'insufficient_source', normalized_brand_candidate: '' };
  }

  for (const brand of canonicalBrands) {
    if (
      normalizeForBrandComparison(brand.canonical_brand_name) === normalized ||
      normalizeForBrandComparison(brand.display_brand_name) === normalized
    ) {
      return {
        match_status: 'matched_canonical_brand',
        normalized_brand_candidate: normalized,
        matched_brand_id: brand.brand_id,
      };
    }
  }

  for (const alias of aliases) {
    if (normalizeForBrandComparison(alias.alias_normalized) === normalized) {
      return {
        match_status: 'matched_alias',
        normalized_brand_candidate: normalized,
        matched_brand_id: alias.brand_id,
        matched_alias_id: alias.alias_id,
      };
    }
  }

  return {
    match_status: 'parent_unknown',
    normalized_brand_candidate: normalized,
  };
}

export interface CatalogueCoverageMetrics {
  total_rows: number;
  matched_canonical_brand: number;
  matched_alias: number;
  unmatched_rows: number;
}

export function buildCatalogueCoverageMetrics(rows: readonly CatalogueAuditObservationRow[]): CatalogueCoverageMetrics {
  let matchedCanonical = 0;
  let matchedAlias = 0;
  for (const row of rows) {
    if (row.match_status === 'matched_canonical_brand') {
      matchedCanonical += 1;
    } else if (row.match_status === 'matched_alias') {
      matchedAlias += 1;
    }
  }
  const total = rows.length;
  return {
    total_rows: total,
    matched_canonical_brand: matchedCanonical,
    matched_alias: matchedAlias,
    unmatched_rows: Math.max(total - matchedCanonical - matchedAlias, 0),
  };
}
