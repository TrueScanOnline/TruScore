/**
 * Vercel /api/manual-products — non-scoring proprietary slice only.
 * Origin and certification claims must not be written here as scoring-ready
 * Product fields; they go through governed contribution evidence.
 *
 * Ingredients/nutrition still go to Open Food Facts, not this payload.
 */

import type { ManualProductData } from '../types/manualProduct';

/** Keys that may still be stored on manual-products (never scoring-ready origin/certs). */
export const PROPRIETARY_MANUAL_PRODUCT_FIELD_KEYS = [
  'allergens_tags',
  'additives_tags',
] as const;

export type ProprietaryManualProductFieldKey = (typeof PROPRIETARY_MANUAL_PRODUCT_FIELD_KEYS)[number];

/** Scoring-ready keys that must not be returned/merged from manual-products. */
export const MANUAL_PRODUCT_SCORING_LEAK_KEYS = [
  'manufacturing_places',
  'manufacturing_places_tags',
  'countries',
  'countries_tags',
  'origins',
  'origins_tags',
  'labels_tags',
  'labels_hierarchy',
] as const;

export function buildVercelManualProductPayload(data: ManualProductData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (Array.isArray(data.allergens_tags) && data.allergens_tags.length > 0) {
    out.allergens_tags = data.allergens_tags;
  }
  if (Array.isArray(data.additives_tags) && data.additives_tags.length > 0) {
    out.additives_tags = data.additives_tags;
  }
  return out;
}
