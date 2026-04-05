/**
 * Open Food Facts–sourced carbon / CO₂ footprint fields for product display.
 */

import type { Product } from '../types/product';
import { openFoodFactsProductUrl } from './packagingRecyclingSources';
import {
  getOffCarbonFootprintKgPerKg,
  getOffCarbonFootprintGPer100g,
} from './packagingOffDisplay';

const NUTRIENT_CARBON_CO2 = /carbon|co2/i;

export type CarbonFootprintDisplayRow = {
  /** i18n key under `result.*` */
  labelKey: string;
  labelParams?: Record<string, string | number>;
  hintKey?: string;
};

function formatCo2Kg(value: number): string {
  const abs = Math.abs(value);
  const decimals = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
  return value.toFixed(decimals);
}

function formatG100(value: number): string {
  const abs = Math.abs(value);
  const decimals = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
  return value.toFixed(decimals);
}

function formatNutrimentNumber(key: string, value: number): string {
  const abs = Math.abs(value);
  const decimals = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
  return value.toFixed(decimals);
}

function humanizeOffKey(key: string): string {
  return key
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ''))
    .join(' ');
}

/** Prefer OFF product `url` when it already targets Open Food Facts. */
/**
 * Same formula as OFF `carbon_footprint_food.tt.json`: per 100 g of product,
 * km in a petrol car ≈ (agribalyse co₂ per kg / 10) × (100 / 19.3).
 */
export function getOffPetrolCarDrivingKmPer100g(product: Product): number | null {
  const ag = product.ecoscore_data?.agribalyse;
  const co2PerKg =
    ag && typeof ag === 'object' && typeof (ag as { co2_total?: unknown }).co2_total === 'number'
      ? (ag as { co2_total: number }).co2_total
      : undefined;
  if (co2PerKg == null || Number.isNaN(co2PerKg) || co2PerKg <= 0) return null;
  const km = (co2PerKg / 10) * (100 / 19.3);
  if (km < 0.05) return null;
  return Math.round(km * 10) / 10;
}

export function resolveOpenFoodFactsProductPageUrl(product: Product): string {
  const u = product.url?.trim();
  if (u && /openfoodfacts\.org/i.test(u)) {
    return u;
  }
  return openFoodFactsProductUrl(product.barcode);
}

export type GetOffCarbonFootprintRowsOptions = {
  /** When false, omit hintKey on rows (for compact card; hints go in the detail modal). Default true. */
  includeHints?: boolean;
};

/**
 * Rows to show in the Carbon Footprint card: lifecycle CO₂ from Eco-Score / Agribalyse,
 * nutriments (including any extra carbon/CO₂ keys OFF adds), and top-level OFF carbon fields.
 */
export function getOffCarbonFootprintRows(
  product: Product,
  options?: GetOffCarbonFootprintRowsOptions
): CarbonFootprintDisplayRow[] {
  const includeHints = options?.includeHints !== false;
  const rows: CarbonFootprintDisplayRow[] = [];
  const usedNutrimentKeys = new Set<string>();

  const co2Kg = getOffCarbonFootprintKgPerKg(product);
  const ed = product.ecoscore_data;
  const co2Fr = ed && typeof ed.co2_total_fr === 'number' && !Number.isNaN(ed.co2_total_fr) ? ed.co2_total_fr : undefined;
  const ag = ed?.agribalyse;
  const agCo2 =
    ag && typeof ag === 'object' && typeof (ag as { co2_total?: unknown }).co2_total === 'number'
      ? ((ag as { co2_total: number }).co2_total as number)
      : undefined;

  if (co2Kg != null) {
    rows.push({
      labelKey: 'result.carbonOffLifecycleValue',
      labelParams: { value: formatCo2Kg(co2Kg) },
      ...(includeHints ? { hintKey: 'result.carbonOffLifecycleHint' as const } : {}),
    });
  }

  if (co2Fr != null && co2Fr !== co2Kg) {
    rows.push({
      labelKey: 'result.carbonOffCo2Fr',
      labelParams: { value: formatCo2Kg(co2Fr) },
    });
  }

  if (agCo2 != null && agCo2 !== co2Kg) {
    rows.push({
      labelKey: 'result.carbonOffAgribalyseCo2',
      labelParams: { value: formatCo2Kg(agCo2) },
      ...(includeHints ? { hintKey: 'result.carbonOffAgribalyseHint' as const } : {}),
    });
  }

  const n = product.nutriments as Record<string, number | undefined> | undefined;
  if (n) {
    const ing = n['carbon-footprint-from-known-ingredients_100g'];
    const prod = n['carbon-footprint-from-known-ingredients-product_100g'];

    if (typeof ing === 'number' && !Number.isNaN(ing)) {
      usedNutrimentKeys.add('carbon-footprint-from-known-ingredients_100g');
      rows.push({
        labelKey: 'result.carbonOffIngredients100g',
        labelParams: { value: formatG100(ing) },
        ...(includeHints ? { hintKey: 'result.carbonOffIngredients100gHint' as const } : {}),
      });
    }
    if (typeof prod === 'number' && !Number.isNaN(prod) && prod !== ing) {
      usedNutrimentKeys.add('carbon-footprint-from-known-ingredients-product_100g');
      rows.push({
        labelKey: 'result.carbonOffProduct100g',
        labelParams: { value: formatG100(prod) },
        ...(includeHints ? { hintKey: 'result.carbonOffProduct100gHint' as const } : {}),
      });
    }

    const sortedKeys = Object.keys(n).sort();
    for (const key of sortedKeys) {
      if (!NUTRIENT_CARBON_CO2.test(key) || usedNutrimentKeys.has(key)) continue;
      const val = n[key];
      if (typeof val !== 'number' || Number.isNaN(val)) continue;
      rows.push({
        labelKey: 'result.carbonOffNutrimentField',
        labelParams: { field: humanizeOffKey(key), value: formatNutrimentNumber(key, val) },
      });
      usedNutrimentKeys.add(key);
    }
  }

  // Top-level OFF fields (e.g. carbon_footprint_percent_of_known_ingredients)
  const p = product as unknown as Record<string, unknown>;
  const skipTopLevel = new Set([
    'nutriments',
    'ecoscore_data',
    'images',
    'packaging_data',
    'packagings',
    'ingredients',
    'additives',
    'certifications',
    'recalls',
  ]);
  for (const key of Object.keys(p).sort()) {
    if (key.startsWith('_') || skipTopLevel.has(key)) continue;
    if (!NUTRIENT_CARBON_CO2.test(key)) continue;
    const val = p[key];
    if (val !== null && typeof val === 'object') continue;
    if (typeof val === 'number' && !Number.isNaN(val)) {
      rows.push({
        labelKey: 'result.carbonOffNutrimentField',
        labelParams: { field: humanizeOffKey(key), value: String(val) },
      });
    } else if (typeof val === 'string' && val.trim()) {
      rows.push({
        labelKey: 'result.carbonOffNutrimentField',
        labelParams: { field: humanizeOffKey(key), value: val.trim() },
      });
    }
  }

  return rows;
}

export function hasOffCarbonFootprintDisplay(product: Product | undefined | null): boolean {
  if (!product) return false;
  return getOffCarbonFootprintRows(product).length > 0;
}
