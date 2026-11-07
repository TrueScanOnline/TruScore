/**
 * WP09-R3 / final Nutrition provenance — mark the source of the value actually displayed.
 * Uses the same selection order as NutritionTable / resolveKcalPer100g. Does not change calculations.
 */

import type { ProductNutriments } from '../types/product';
import { getNutrientValue100g, resolveKcalPer100g } from '../utils/nutritionPer100g';
import { isDisplayableNutritionOffKey } from './targets';

/** Consumer-facing provenance caption — not a Confidence grade. */
export const COMMUNITY_ADDED_CAPTION = 'Community-added';

const NUTRITION_ROW_KEYS = [
  'energy-kcal',
  'fat',
  'saturated-fat',
  'carbohydrates',
  'sugars',
  'fiber',
  'proteins',
  'sodium',
] as const;

export type NutritionTableRowKey = (typeof NUTRITION_ROW_KEYS)[number];

export type NutritionDisplaySource =
  | { kind: 'absent' }
  | { kind: 'community'; offKey: string }
  | { kind: 'external'; offKey?: string };

function communityKeySet(
  communityNutrimentKeys: readonly string[] | null | undefined
): Set<string> {
  return new Set((communityNutrimentKeys || []).filter(isDisplayableNutritionOffKey));
}

/**
 * Mirrors NutritionTable per-100g energy selection:
 * `getNutrientValue100g(energy-kcal) ?? resolveKcalPer100g(nutriments)`.
 * Attribute community only when the branch that supplies the displayed value is community-keyed.
 */
export function nutritionEnergyDisplaySource(
  nutriments: ProductNutriments | undefined,
  communityNutrimentKeys: readonly string[] | null | undefined
): NutritionDisplaySource {
  const community = communityKeySet(communityNutrimentKeys);
  const kcalDirect = getNutrientValue100g(nutriments, 'energy-kcal');
  if (kcalDirect !== undefined) {
    if (community.has('energy-kcal_100g')) {
      return { kind: 'community', offKey: 'energy-kcal_100g' };
    }
    return { kind: 'external', offKey: 'energy-kcal_100g' };
  }

  const resolved = resolveKcalPer100g(nutriments);
  if (resolved === undefined) return { kind: 'absent' };

  const kj = getNutrientValue100g(nutriments, 'energy-kj');
  if (kj !== undefined && kj > 0) {
    if (community.has('energy-kj_100g')) {
      return { kind: 'community', offKey: 'energy-kj_100g' };
    }
    return { kind: 'external', offKey: 'energy-kj_100g' };
  }

  const energy = getNutrientValue100g(nutriments, 'energy');
  if (energy !== undefined && energy > 0) {
    if (community.has('energy_100g')) {
      return { kind: 'community', offKey: 'energy_100g' };
    }
    return { kind: 'external', offKey: 'energy_100g' };
  }

  return { kind: 'external' };
}

export function nutritionRowDisplaySource(
  rowKey: string,
  nutriments: ProductNutriments | undefined,
  communityNutrimentKeys: readonly string[] | null | undefined
): NutritionDisplaySource {
  if (rowKey === 'energy-kcal') {
    return nutritionEnergyDisplaySource(nutriments, communityNutrimentKeys);
  }
  const community = communityKeySet(communityNutrimentKeys);
  const value = getNutrientValue100g(nutriments, rowKey);
  if (value === undefined) return { kind: 'absent' };
  const offKey = `${rowKey}_100g`;
  if (community.has(offKey)) return { kind: 'community', offKey };
  return { kind: 'external', offKey };
}

export function nutritionRowIsCommunity(
  rowKey: string,
  nutriments: ProductNutriments | undefined,
  communityNutrimentKeys: readonly string[] | null | undefined
): boolean {
  return nutritionRowDisplaySource(rowKey, nutriments, communityNutrimentKeys).kind === 'community';
}

/**
 * Community OFF keys that actually determine a NutritionTable-displayed value.
 * Keys present only as non-selected contributions (e.g. community kJ while OFF kcal shows) are excluded.
 */
export function representedCommunityNutritionKeys(
  nutriments: ProductNutriments | undefined,
  communityNutrimentKeys: readonly string[] | null | undefined
): Set<string> {
  const represented = new Set<string>();
  for (const rowKey of NUTRITION_ROW_KEYS) {
    const source = nutritionRowDisplaySource(rowKey, nutriments, communityNutrimentKeys);
    if (source.kind === 'community' && source.offKey) {
      represented.add(source.offKey);
    }
  }
  return represented;
}

/** Consumer-facing names for agreement scope copy. */
export function nutritionOffKeyConsumerLabel(offKey: string): string {
  const base = offKey.replace(/_100g$/, '');
  switch (base) {
    case 'energy-kcal':
    case 'energy-kj':
    case 'energy':
      return 'Energy';
    case 'fat':
      return 'Fat';
    case 'saturated-fat':
      return 'Saturated fat';
    case 'carbohydrates':
      return 'Carbohydrate';
    case 'sugars':
      return 'Sugars';
    case 'fiber':
      return 'Fibre';
    case 'proteins':
    case 'protein':
      return 'Protein';
    case 'sodium':
    case 'salt':
      return 'Sodium';
    default:
      return base;
  }
}
