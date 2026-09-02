/**
 * Local store preference for scoring-input parity (Wave 3 P1-A).
 * Prefer a materially more complete or fresher record over a thinner SQLite hit.
 */

import type { Product } from '../types/product';

/** Fields that materially affect Body/Planet/Ethics/Open scoring or eligibility. */
const SCORING_INPUT_KEYS: (keyof Product | string)[] = [
  'nova_group',
  'nova1Provenance',
  'nutriscore_grade',
  'ecoscore_grade',
  'additives_tags',
  'ingredients_text',
  'ingredients_text_en',
  'categories_tags',
  'categories',
  'origins',
  'origins_tags',
  'manufacturing_places',
  'manufacturing_places_tags',
  'brand_owner',
  'brands',
  'labels_tags',
  'labels_hierarchy',
  'labels',
  'labels_en',
  'certifications',
  'ethics_msc_api_validated',
  'packagings',
  'packagings_complete',
  'packaging_text_in_languages',
  'true_scan_market',
  'product_name',
  'product_name_en',
];

function hasValue(v: unknown): boolean {
  if (v === undefined || v === null) return false;
  if (typeof v === 'string') return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'object') return Object.keys(v as object).length > 0;
  return true;
}

/** Count of scoring-relevant fields present on a product. */
export function scoringInputCompleteness(product: Product): number {
  let n = 0;
  for (const key of SCORING_INPUT_KEYS) {
    if (hasValue((product as Record<string, unknown>)[key])) n += 1;
  }
  return n;
}

function cachedAtMs(product: Product): number {
  const t = (product as Product & { _cachedAt?: number })._cachedAt;
  return typeof t === 'number' && Number.isFinite(t) ? t : 0;
}

/**
 * Choose between SQLite and AsyncStorage hits without knowingly preferring a
 * materially less complete or staler representation.
 */
export function selectPreferredLocalProduct(
  sqliteProduct: Product | null,
  cachedProduct: Product | null
): Product | null {
  if (!sqliteProduct) return cachedProduct;
  if (!cachedProduct) return sqliteProduct;

  const sqliteScore = scoringInputCompleteness(sqliteProduct);
  const cacheScore = scoringInputCompleteness(cachedProduct);

  if (cacheScore > sqliteScore) return cachedProduct;
  if (sqliteScore > cacheScore) return sqliteProduct;

  // Equal completeness → fresher OFF/cache timestamp wins
  return cachedAtMs(cachedProduct) >= cachedAtMs(sqliteProduct) ? cachedProduct : sqliteProduct;
}
