import { Product, ProductNutrientLevels, ProductNutriments } from '../types/product';
import { getNutrientValue100g } from './nutritionPer100g';

/**
 * Traffic-light thresholds per 100 g / 100 ml, aligned with Open Food Facts server
 * (`lib/ProductOpener/Food.pm` → @nutrient_levels): fat, saturated fat, sugars, salt.
 * For beverages, OFF halves both low and high cutoffs (same file, compute_nutrient_levels).
 */
const OFF_THRESHOLDS = {
  fat: { low: 3, high: 20 },
  saturatedFat: { low: 1.5, high: 5 },
  sugars: { low: 5, high: 12.5 },
  salt: { low: 0.3, high: 1.5 },
} as const;

function isBeverageForNutrientLevels(categoriesTags?: string[]): boolean {
  if (!categoriesTags?.length) return false;
  return categoriesTags.some((t) => t === 'en:beverages' || t.endsWith(':beverages'));
}

function levelFromValue(value: number, low: number, high: number): 'low' | 'moderate' | 'high' {
  if (value < low) return 'low';
  if (value > high) return 'high';
  return 'moderate';
}

/** Salt g/100g from salt or sodium (salt ≈ sodium × 2.5 when sodium is in grams). */
function saltGramsPer100g(nutriments: ProductNutriments): number | undefined {
  const salt = getNutrientValue100g(nutriments, 'salt');
  if (salt !== undefined) return salt;
  const sodium = getNutrientValue100g(nutriments, 'sodium');
  if (sodium !== undefined) return sodium * 2.5;
  return undefined;
}

/**
 * Derive nutrient_levels from per-100g nutriments only (no API object).
 */
export function deriveNutrientLevelsFromNutriments(
  nutriments: ProductNutriments | undefined,
  categoriesTags?: string[]
): ProductNutrientLevels {
  if (!nutriments) return {};

  const beverage = isBeverageForNutrientLevels(categoriesTags);
  const mult = beverage ? 0.5 : 1;

  const out: ProductNutrientLevels = {};

  const fat = getNutrientValue100g(nutriments, 'fat');
  if (fat !== undefined) {
    const { low, high } = OFF_THRESHOLDS.fat;
    out.fat = levelFromValue(fat, low * mult, high * mult);
  }

  const sat = getNutrientValue100g(nutriments, 'saturated-fat');
  if (sat !== undefined) {
    const { low, high } = OFF_THRESHOLDS.saturatedFat;
    out.saturated_fat = levelFromValue(sat, low * mult, high * mult);
  }

  const sugars = getNutrientValue100g(nutriments, 'sugars');
  if (sugars !== undefined) {
    const { low, high } = OFF_THRESHOLDS.sugars;
    out.sugars = levelFromValue(sugars, low * mult, high * mult);
  }

  const salt = saltGramsPer100g(nutriments);
  if (salt !== undefined) {
    const { low, high } = OFF_THRESHOLDS.salt;
    out.salt = levelFromValue(salt, low * mult, high * mult);
  }

  return out;
}

/**
 * Merge OFF `nutrient_levels` with client derivation: keep any value the API already
 * provides; fill missing keys from per-100g nutriments so UI stays consistent when
 * the server omits levels (e.g. no aggregated_set / categories on OFF side).
 */
export function resolveNutrientLevels(
  nutriments: ProductNutriments | undefined,
  apiLevels: ProductNutrientLevels | undefined,
  categoriesTags?: string[]
): ProductNutrientLevels {
  const derived = deriveNutrientLevelsFromNutriments(nutriments, categoriesTags);
  const api = apiLevels ?? {};

  return {
    fat: api.fat ?? derived.fat,
    saturated_fat: api.saturated_fat ?? derived.saturated_fat,
    sugars: api.sugars ?? derived.sugars,
    salt: api.salt ?? derived.salt,
  };
}

/**
 * Mutates `product.nutrient_levels` in place using OFF traffic-light rules + optional API merge.
 *
 * - **Primary hook:** `calculateTrustScore()` runs this for scored products.
 * - **Second hook:** Call this when building or hydrating products that may **not** go through TruScore,
 *   or when nutriments come from **non–Open Food Facts** sources (USDA, retailer APIs, manual entry, cache).
 */
export function applyResolvedNutrientLevels(product: Product): void {
  if (!product.nutriments) return;
  const merged = resolveNutrientLevels(product.nutriments, product.nutrient_levels, product.categories_tags);
  const hasAny = merged.fat ?? merged.saturated_fat ?? merged.sugars ?? merged.salt;
  if (hasAny !== undefined) {
    product.nutrient_levels = merged;
  }
}
