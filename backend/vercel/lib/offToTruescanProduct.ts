/**
 * Map Open Food Facts API `product` object → TrueScan `Product` for shared pillar calculators.
 * Used by Vercel preview API so scores match the app (single source of truth).
 */

import type { Product } from '../truescan-src/types/product';

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string');
}

function asNutriments(off: Record<string, unknown>): Product['nutriments'] {
  const n = off.nutriments;
  if (n && typeof n === 'object' && !Array.isArray(n)) {
    return n as Product['nutriments'];
  }
  return {};
}

function normalizeNova(v: unknown): Product['nova_group'] | undefined {
  if (v === 1 || v === 2 || v === 3 || v === 4) return v;
  const n = typeof v === 'string' ? parseInt(v, 10) : typeof v === 'number' ? Math.round(v) : NaN;
  if (n === 1 || n === 2 || n === 3 || n === 4) return n as Product['nova_group'];
  return undefined;
}

function normalizeEcoGrade(v: unknown): Product['ecoscore_grade'] {
  if (typeof v !== 'string' || !v) return undefined;
  const g = v.toLowerCase();
  if (g === 'a' || g === 'b' || g === 'c' || g === 'd' || g === 'e' || g === 'unknown') {
    return g as Product['ecoscore_grade'];
  }
  return undefined;
}

function normalizeNutriscoreGrade(v: unknown): Product['nutriscore_grade'] {
  if (typeof v !== 'string' || !v) return undefined;
  const g = v.toLowerCase();
  if (g === 'a' || g === 'b' || g === 'c' || g === 'd' || g === 'e' || g === 'unknown') {
    return g as Product['nutriscore_grade'];
  }
  return undefined;
}

/**
 * @param barcodeFromQuery - barcode from request (fallback if OFF `code` missing)
 */
export function offJsonProductToTruescan(
  barcodeFromQuery: string,
  off: Record<string, unknown>
): Product {
  const code = typeof off.code === 'string' ? off.code : barcodeFromQuery;

  return {
    barcode: code,
    product_name: typeof off.product_name === 'string' ? off.product_name : undefined,
    product_name_en: typeof off.product_name_en === 'string' ? off.product_name_en : undefined,
    generic_name: typeof off.generic_name === 'string' ? off.generic_name : undefined,
    brands: typeof off.brands === 'string' ? off.brands : undefined,
    brand_owner: typeof off.brand_owner === 'string' ? off.brand_owner : undefined,
    categories: typeof off.categories === 'string' ? off.categories : undefined,
    categories_tags: asStringArray(off.categories_tags),

    image_url:
      typeof off.image_url === 'string'
        ? off.image_url
        : typeof off.image_front_url === 'string'
          ? off.image_front_url
          : undefined,
    image_front_url:
      typeof off.image_front_url === 'string'
        ? off.image_front_url
        : typeof off.image_url === 'string'
          ? off.image_url
          : undefined,
    image_front_small_url:
      typeof off.image_front_small_url === 'string'
        ? off.image_front_small_url
        : typeof off.image_front_thumb_url === 'string'
          ? off.image_front_thumb_url
          : undefined,

    nutriments: asNutriments(off),
    nova_group: normalizeNova(off.nova_group),
    nova_groups: typeof off.nova_groups === 'string' ? off.nova_groups : undefined,

    ingredients_text: typeof off.ingredients_text === 'string' ? off.ingredients_text : undefined,
    ingredients_text_en:
      typeof off.ingredients_text_en === 'string' ? off.ingredients_text_en : undefined,
    ingredients_analysis_tags: asStringArray(off.ingredients_analysis_tags),
    additives_tags: asStringArray(off.additives_tags),

    allergens: typeof off.allergens === 'string' ? off.allergens : undefined,
    allergens_tags: asStringArray(off.allergens_tags),
    traces_tags: asStringArray(off.traces_tags),

    origins: typeof off.origins === 'string' ? off.origins : undefined,
    origins_tags: asStringArray(off.origins_tags),
    countries: typeof off.countries === 'string' ? off.countries : undefined,
    countries_tags: asStringArray(off.countries_tags),
    countries_en: typeof off.countries_en === 'string' ? off.countries_en : undefined,
    manufacturing_places:
      typeof off.manufacturing_places === 'string' ? off.manufacturing_places : undefined,
    manufacturing_places_tags: asStringArray(off.manufacturing_places_tags),

    labels: typeof off.labels === 'string' ? off.labels : undefined,
    labels_tags: asStringArray(off.labels_tags),
    labels_en: typeof off.labels_en === 'string' ? off.labels_en : undefined,

    packagings: Array.isArray(off.packagings) ? (off.packagings as Product['packagings']) : undefined,
    packaging_tags: asStringArray(off.packaging_tags),

    ecoscore_grade: (() => {
      const fromField = normalizeEcoGrade(off.ecoscore_grade);
      if (fromField) return fromField;
      if (off.ecoscore_data && typeof off.ecoscore_data === 'object' && off.ecoscore_data !== null) {
        return normalizeEcoGrade((off.ecoscore_data as { grade?: unknown }).grade);
      }
      return undefined;
    })(),
    ecoscore_data:
      off.ecoscore_data && typeof off.ecoscore_data === 'object'
        ? (off.ecoscore_data as Product['ecoscore_data'])
        : undefined,
    ecoscore_score:
      typeof off.ecoscore_score === 'number'
        ? off.ecoscore_score
        : typeof off.ecoscore_score === 'string'
          ? parseFloat(off.ecoscore_score)
          : undefined,

    nutriscore_grade:
      normalizeNutriscoreGrade(off.nutriscore_grade) ??
      normalizeNutriscoreGrade(off.nutrition_grade),

    serving_size: typeof off.serving_size === 'string' ? off.serving_size : undefined,
    quantity: typeof off.quantity === 'string' ? off.quantity : undefined,

    ethics_msc_api_validated: undefined,

    source: 'off_api',
  };
}
