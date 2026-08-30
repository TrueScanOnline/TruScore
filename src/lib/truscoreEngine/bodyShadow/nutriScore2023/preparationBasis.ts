/**
 * Nutri-Score nutrition preparation basis (shadow only).
 * Aligns with OFF ProductOpener/Food.pm — dehydrated/rehydratable categories
 * require prepared nutrition data; ambiguous _100g values must not be used.
 */

import type { Product } from '../../../../types/product';

/** OFF categories that require prepared (rehydrated) nutrition for Nutri-Score. */
export const PREPARED_NUTRITION_REQUIRED_CATEGORY_TAGS = [
  'en:dried-products-to-be-rehydrated',
  'en:cocoa-and-chocolate-powders',
  'en:dessert-mixes',
  'en:flavoured-syrups',
  'en:instant-beverages',
  'en:beverage-preparations',
] as const;

export type NutritionPreparationBasis = 'as_sold' | 'prepared';

export type PreparationBasisResolution = {
  basis: NutritionPreparationBasis;
  requiredPrepared: boolean;
  source: 'default_as_sold' | 'prepared_nutriments' | 'off_prepared_confirmed';
};

export function requiresPreparedNutritionBasis(categoriesTags: string[] | undefined): boolean {
  if (!categoriesTags?.length) return false;
  return PREPARED_NUTRITION_REQUIRED_CATEGORY_TAGS.some((tag) => categoriesTags.includes(tag));
}

function miscTags(product: Product): string[] {
  return (product as Product & { misc_tags?: string[] }).misc_tags ?? [];
}

function hasPreparedNutrimentKeys(product: Product): boolean {
  const n = product.nutriments as Record<string, unknown> | undefined;
  if (!n) return false;
  return Object.keys(n).some(
    (k) => k.endsWith('_prepared_100g') || k.endsWith('_prepared') || k.includes('_prepared_')
  );
}

function offNutriscore2023Preparation(product: Product): string | null {
  const prep = (
    product as Product & {
      nutriscore?: { '2023'?: { preparation?: string } };
    }
  ).nutriscore?.['2023']?.preparation;
  return typeof prep === 'string' ? prep : null;
}

/**
 * Resolve whether mapped nutriments are as-sold or prepared.
 * Returns null when prepared basis is required but cannot be established (fail-closed).
 */
export function resolveNutritionPreparationBasis(
  product: Product
): PreparationBasisResolution | { basis: null; reason: 'unresolved_preparation_basis' } {
  const categories = product.categories_tags;
  const requiredPrepared = requiresPreparedNutritionBasis(categories);
  const tags = miscTags(product);

  if (!requiredPrepared) {
    return { basis: 'as_sold', requiredPrepared: false, source: 'default_as_sold' };
  }

  if (tags.includes('en:nutriscore-missing-prepared-nutrition-data')) {
    return { basis: null, reason: 'unresolved_preparation_basis' };
  }

  if (hasPreparedNutrimentKeys(product)) {
    return { basis: 'prepared', requiredPrepared: true, source: 'prepared_nutriments' };
  }

  if (
    tags.includes('en:nutrition-grade-computed-for-prepared-product') &&
    offNutriscore2023Preparation(product) === 'prepared'
  ) {
    return { basis: 'prepared', requiredPrepared: true, source: 'off_prepared_confirmed' };
  }

  return { basis: null, reason: 'unresolved_preparation_basis' };
}

/** Build nutriment key candidates for a nutrient id given resolved preparation basis. */
export function nutrimentKeysForBasis(
  nutrientId: string,
  basis: NutritionPreparationBasis
): string[] {
  if (basis === 'prepared') {
    return [`${nutrientId}_prepared_100g`, `${nutrientId}_prepared`];
  }
  return [`${nutrientId}_100g`, nutrientId];
}
