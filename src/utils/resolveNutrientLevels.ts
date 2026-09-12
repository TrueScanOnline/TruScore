/**
 * @deprecated Legacy OFF traffic-light merge. Rveel consumer ratings must use
 * `assessGovernedNutrients` (UK FoP MTL). Raw `product.nutrient_levels` may remain
 * for provenance only and must not drive UI or scoring messaging.
 *
 * These exports are retained as no-ops / thin wrappers so call sites compile
 * until fully removed; they no longer mutate ratings onto the product.
 */

import { Product, ProductNutrientLevels, ProductNutriments } from '../types/product';

/**
 * @deprecated Does not derive ratings. Returns empty object.
 * Use assessGovernedNutrients instead.
 */
export function deriveNutrientLevelsFromNutriments(
  _nutriments: ProductNutriments | undefined,
  _categoriesTags?: string[]
): ProductNutrientLevels {
  return {};
}

/**
 * @deprecated Does not merge OFF nutrient_levels into ratings. Returns empty object.
 * Use assessGovernedNutrients instead.
 */
export function resolveNutrientLevels(
  _nutriments: ProductNutriments | undefined,
  _apiLevels: ProductNutrientLevels | undefined,
  _categoriesTags?: string[]
): ProductNutrientLevels {
  return {};
}

/**
 * No-op: preserves raw OFF `nutrient_levels` for provenance and does not overwrite
 * with client-derived OFF-legacy traffic lights.
 */
export function applyResolvedNutrientLevels(_product: Product): void {
  // Intentionally empty — governed assessment is computed via assessGovernedNutrients.
}
