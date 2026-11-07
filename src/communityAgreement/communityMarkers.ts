/**
 * WP09-R3 — Identify which displayed facts are community-contributed.
 * Presentation only. Does not change evidence precedence or Confidence.
 */

import { isDisplayableNutritionOffKey } from './targets';

/** Maps a NutritionTable row key to the OFF _100g keys that mark it as community. */
export function nutritionRowCommunityKeys(rowKey: string): string[] {
  if (rowKey === 'energy-kcal') return ['energy-kcal_100g', 'energy-kj_100g'];
  return [`${rowKey}_100g`];
}

export function nutritionRowIsCommunity(
  rowKey: string,
  communityNutrimentKeys: readonly string[] | null | undefined
): boolean {
  if (!communityNutrimentKeys?.length) return false;
  const wanted = new Set(communityNutrimentKeys.filter(isDisplayableNutritionOffKey));
  return nutritionRowCommunityKeys(rowKey).some((key) => wanted.has(key));
}

/** Consumer-facing provenance caption — not a Confidence grade. */
export const COMMUNITY_ADDED_CAPTION = 'Community-added';
