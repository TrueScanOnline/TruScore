/**
 * Core Truth product-cache authority (Review 1 Pass 2 corrective — NA-003).
 *
 * A locally stored product may be used for ordinary scoring only when stamped with
 * this version after the governed pipeline:
 *   exact GTIN → World OFF → approved governed transforms only.
 *
 * Legacy / missing / unprovable records lack this marker and must revalidate via OFF
 * before substantive scoring. `source === 'openfoodfacts'` alone is insufficient.
 */

export const CORE_TRUTH_PRODUCT_CACHE_AUTHORITY = 'rveel-core-truth-v1' as const;

export type CoreTruthProductCacheAuthority = typeof CORE_TRUTH_PRODUCT_CACHE_AUTHORITY;

/** Product field name persisted on AsyncStorage JSON and via SQLite scoring_runtime_json. */
export const CORE_TRUTH_AUTHORITY_FIELD = '_rveelCoreTruthAuthority' as const;

export type ProductWithCoreTruthAuthority = {
  [CORE_TRUTH_AUTHORITY_FIELD]?: string;
};

export function hasCoreTruthAuthority(
  product: ProductWithCoreTruthAuthority | null | undefined
): boolean {
  if (!product) return false;
  return product[CORE_TRUTH_AUTHORITY_FIELD] === CORE_TRUTH_PRODUCT_CACHE_AUTHORITY;
}

export function stampCoreTruthAuthority<T extends ProductWithCoreTruthAuthority>(product: T): T {
  product[CORE_TRUTH_AUTHORITY_FIELD] = CORE_TRUTH_PRODUCT_CACHE_AUTHORITY;
  return product;
}
