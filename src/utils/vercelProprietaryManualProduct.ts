/**
 * Vercel /api/manual-products stores only proprietary fields (country + certifications).
 * Product core data (name, brand, ingredients, nutrition, allergens/additives) is submitted to
 * Open Food Facts only; the app reads those from OFF.
 */

import type { ManualProductData } from '../types/manualProduct';

/** Keys persisted in our backend for manual edit (not OFF). */
export const PROPRIETARY_MANUAL_PRODUCT_FIELD_KEYS = [
  'manufacturing_places',
  'manufacturing_places_tags',
  'countries',
  'countries_tags',
  'origins',
  'origins_tags',
  'labels_tags',
  'labels_hierarchy',
] as const;

export type ProprietaryManualProductFieldKey = (typeof PROPRIETARY_MANUAL_PRODUCT_FIELD_KEYS)[number];

/** Payload for POST /api/manual-products (proprietary slice only). */
export function buildVercelManualProductPayload(data: ManualProductData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const mfg = data.manufacturing_places?.trim();
  if (mfg) out.manufacturing_places = mfg;
  const cty = data.countries?.trim();
  if (cty) out.countries = cty;
  if (data.countries_tags?.length) out.countries_tags = data.countries_tags;
  if (data.manufacturing_places_tags?.length) out.manufacturing_places_tags = data.manufacturing_places_tags;
  const ori = data.origins?.trim();
  if (ori) out.origins = ori;
  if (data.origins_tags?.length) out.origins_tags = data.origins_tags;
  if (data.labels_tags !== undefined) out.labels_tags = data.labels_tags;
  if (data.labels_hierarchy !== undefined) out.labels_hierarchy = data.labels_hierarchy;
  return out;
}
