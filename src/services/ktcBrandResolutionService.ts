/**
 * KTC Brand Resolution Service
 *
 * Maps product brand strings to KTC benchmark parent companies using
 * KTC_2026_Parent_Brand_Alias_Mapping.xlsx (exported to ktcBrandAliasMap.json).
 *
 * Pipeline:
 *   1. Extract brand from product (brand_owner or brands)
 *   2. Normalize brand (lowercase, &→and, remove punctuation, collapse whitespace)
 *   3. Match against canonical_brand or aliases_csv
 *   4. Return benchmark_year_parent_company if a match is found
 */

import { normalizeBrand } from '../utils/brandNormalizer';

// Load mapping data at module init (from extractKTCMappingExcel.ts)
import ktcBrandAliasMapData from '../data/ethics/ktcBrandAliasMap.json';

export interface KTCBrandAliasRow {
  benchmark_year_parent_company: string;
  canonical_brand: string;
  aliases_csv: string;
  current_parent_company?: string;
  ownership_alignment_status?: string;
  notes?: string;
}

export interface ResolvedKTCParent {
  parentName: string;
  canonicalBrand: string;
}

let aliasToParent: Map<string, ResolvedKTCParent> = new Map();
let isLoaded = false;

export function loadKTCBrandAliasMap(rows: KTCBrandAliasRow[]): void {
  aliasToParent.clear();

  for (const row of rows) {
    const parentName = row.benchmark_year_parent_company;
    const canonicalBrand = row.canonical_brand;
    if (!parentName || !canonicalBrand) continue;

    const parent: ResolvedKTCParent = {
      parentName,
      canonicalBrand,
    };

    // Canonical brand
    const canonicalNorm = normalizeBrand(canonicalBrand);
    if (canonicalNorm && !aliasToParent.has(canonicalNorm)) {
      aliasToParent.set(canonicalNorm, parent);
    }

    // Aliases
    const aliases = (row.aliases_csv || '')
      .split(',')
      .map((a) => normalizeBrand(a.trim()))
      .filter(Boolean);
    for (const a of aliases) {
      if (!aliasToParent.has(a)) {
        aliasToParent.set(a, parent);
      }
    }

    // Current parent company as alias, if different
    if (row.current_parent_company && row.current_parent_company !== parentName) {
      const currentParentNorm = normalizeBrand(row.current_parent_company);
      if (currentParentNorm && !aliasToParent.has(currentParentNorm)) {
        aliasToParent.set(currentParentNorm, parent);
      }
    }
  }

  isLoaded = true;
}

export function resolveBrandToKTCParent(rawBrand: string): ResolvedKTCParent | null {
  if (!rawBrand || typeof rawBrand !== 'string') return null;
  const normalized = normalizeBrand(rawBrand);
  if (!normalized) return null;

  const match = aliasToParent.get(normalized);
  return match ?? null;
}

export function isKTCBrandResolutionLoaded(): boolean {
  return isLoaded;
}

// Auto-load
loadKTCBrandAliasMap((ktcBrandAliasMapData as unknown) as KTCBrandAliasRow[]);

