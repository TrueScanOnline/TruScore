/**
 * Product Information (scan result) screen — visibility for data-driven cards only.
 *
 * Eco-Score, Values preference, Packaging (OFF), and Carbon Footprint are hidden when
 * there is nothing meaningful to show. Other cards stay on screen so users can open
 * manual edit / contribute flows.
 */

import type { Product } from '../types/product';
import type { Insight, TruScoreResult } from '../lib/truscoreEngine';
import { calculateEcoScore } from '../services/openFoodFacts';
import { hasOffPackagingDisplay } from './packagingOffDisplay';
import { hasOffCarbonFootprintDisplay } from './carbonOffDisplay';

/** Non-empty insights list when the Values preference card should appear; otherwise null. */
export function getProductPageValuesInsights(
  valuesCategoriesEnabled: boolean,
  truScore: TruScoreResult | null | undefined
): Insight[] | null {
  const insights = truScore?.insights;
  if (!valuesCategoriesEnabled || !insights?.length) return null;
  return insights;
}

export function shouldShowEcoScoreCard(product: Product | undefined | null): boolean {
  if (!product) return false;
  const eco = calculateEcoScore(product);
  return eco != null && eco.score !== undefined && eco.score > 0;
}

/** User has any Values category on and TruScore produced at least one insight. */
export function shouldShowValuesPreferenceCard(
  valuesCategoriesEnabled: boolean,
  truScore: TruScoreResult | null | undefined
): boolean {
  return getProductPageValuesInsights(valuesCategoriesEnabled, truScore) !== null;
}

export function shouldShowPackagingCard(product: Product | undefined | null): boolean {
  if (!product) return false;
  return hasOffPackagingDisplay(product);
}

export function shouldShowCarbonFootprintCard(product: Product | undefined | null): boolean {
  if (!product) return false;
  return hasOffCarbonFootprintDisplay(product);
}
