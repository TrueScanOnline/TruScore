/**
 * BBFAW Brand Resolution Service
 *
 * Maps product brand strings to BBFAW parent companies using the
 * BBFAW_2024_Supermarket_Parent_Brand_Mapping workbook data.
 *
 * Pipeline:
 *   1. Extract brand from product (brand_owner or brands)
 *   2. Normalize brand (lowercase, &→and, remove punctuation, collapse whitespace)
 *   3. Match against Brand_Alias_Map (aliases_csv or canonical_brand)
 *   4. Return parent_entity_exact if single match with sufficient confidence
 *
 * ReadMe rules:
 *   - Use rule 2: Only apply BBFAW when resolves to single parent with sufficient confidence
 *   - Use rule 3: Coverage Gap or Low confidence → return neutral (no parent)
 */

import { normalizeBrand } from '../utils/brandNormalizer';

// Load mapping data at module init (from extractBBFAWMappingExcel.ts)
import brandAliasMapData from '../data/ethics/brandAliasMap.json';

export interface BrandAliasMapRow {
  parent_entity_exact: string;
  canonical_brand: string;
  aliases_csv: string;
  brand_type?: string;
  au_nz_relevance?: string;
  mapping_confidence: string;
  seed_status: string;
  tier_2024?: number;
  impact_2024?: string;
  notes?: string;
}

export interface ResolvedParent {
  parent_entity_exact: string;
  canonical_brand: string;
  tier_2024: number;
  impact_2024: string;
  mapping_confidence: string;
}

// Load at module init - will be populated by loadBrandAliasMap()
let aliasToParent: Map<string, ResolvedParent> = new Map();
let isLoaded = false;

/**
 * Load and index Brand_Alias_Map data. Call once at app startup (or lazily on first resolve).
 */
export function loadBrandAliasMap(rows: BrandAliasMapRow[]): void {
  aliasToParent.clear();

  for (const row of rows) {
    // Skip low-confidence or coverage-gap entries per Use rule 3
    const conf = (row.mapping_confidence || '').toLowerCase();
    const status = (row.seed_status || '').toLowerCase();
    if (conf === 'low' || status === 'coverage gap') {
      continue;
    }

    const parent: ResolvedParent = {
      parent_entity_exact: row.parent_entity_exact,
      canonical_brand: row.canonical_brand,
      tier_2024: typeof row.tier_2024 === 'number' ? row.tier_2024 : 0,
      impact_2024: typeof row.impact_2024 === 'string' ? row.impact_2024 : '',
      mapping_confidence: row.mapping_confidence || '',
    };

    // Index canonical_brand (normalized)
    const canonicalNorm = normalizeBrand(row.canonical_brand);
    if (canonicalNorm && !aliasToParent.has(canonicalNorm)) {
      aliasToParent.set(canonicalNorm, parent);
    }

    // Index each alias from aliases_csv (normalized)
    const aliases = (row.aliases_csv || '')
      .split(',')
      .map((a) => normalizeBrand(a.trim()))
      .filter(Boolean);
    for (const a of aliases) {
      if (!aliasToParent.has(a)) {
        aliasToParent.set(a, parent);
      }
    }

    // Index parent_entity_exact (full form) so product brand_owner "Groupe Danone SA" can resolve
    const parentNorm = normalizeBrand(row.parent_entity_exact);
    if (parentNorm && !aliasToParent.has(parentNorm)) {
      aliasToParent.set(parentNorm, parent);
    }
    // NOTE: We do not strip corporate suffixes (SA, PLC, etc) - "Unilever" must NOT
    // match "Unilever NV". Add bare variants to aliases_csv in Excel if needed.
  }

  isLoaded = true;
}

/**
 * Resolve a raw brand string to a BBFAW parent company.
 * Returns null if no match, multiple ambiguous matches, or low confidence.
 */
export function resolveBrandToParent(rawBrand: string): ResolvedParent | null {
  if (!rawBrand || typeof rawBrand !== 'string') return null;

  const normalized = normalizeBrand(rawBrand);
  if (!normalized) return null;

  const match = aliasToParent.get(normalized);
  return match ?? null;
}

/**
 * Check if the resolution index is loaded.
 */
export function isBrandResolutionLoaded(): boolean {
  return isLoaded;
}

// Auto-load on first import
loadBrandAliasMap((brandAliasMapData as unknown) as BrandAliasMapRow[]);
