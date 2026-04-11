import type { UnitSystem } from './units';
import { gramsToOunces, ouncesToGrams } from './units';
import type { Product } from '../types/product';
import { getNutrientValue100g, resolveKcalPer100g } from './nutritionPer100g';

/** Matches NutritionTable kcal formatting (integer or one decimal). */
export function formatKcalForManualPrefill(kcal: number): string {
  return Number.isInteger(kcal) ? String(Math.round(kcal)) : kcal.toFixed(1);
}

/** Per-100g mass nutrients: match product card display (metric g or imperial oz). */
export function formatWeightNutrientForManualPrefill(gramsPer100g: number, units: UnitSystem): string {
  if (units === 'imperial') {
    return gramsToOunces(gramsPer100g).toFixed(2);
  }
  return gramsPer100g.toFixed(2);
}

export function parseWeightNutrientInputToGramsPer100g(raw: string, units: UnitSystem): number | undefined {
  const trimmed = raw.trim().replace(',', '.');
  if (!trimmed) return undefined;
  const v = parseFloat(trimmed);
  if (Number.isNaN(v)) return undefined;
  if (units === 'imperial') {
    return ouncesToGrams(v);
  }
  return v;
}

export function prefillManualNutritionFromProduct(
  product: Product,
  units: UnitSystem
): {
  energy: string;
  fat: string;
  saturatedFat: string;
  carbs: string;
  sugars: string;
  fiber: string;
  protein: string;
  salt: string;
} {
  const n = product.nutriments;
  const kcal = n ? (getNutrientValue100g(n, 'energy-kcal') ?? resolveKcalPer100g(n)) : undefined;
  const w = (key: string) => {
    const v = n ? getNutrientValue100g(n, key) : undefined;
    return v !== undefined ? formatWeightNutrientForManualPrefill(v, units) : '';
  };
  return {
    energy: kcal !== undefined ? formatKcalForManualPrefill(kcal) : '',
    fat: w('fat'),
    saturatedFat: w('saturated-fat'),
    carbs: w('carbohydrates'),
    sugars: w('sugars'),
    fiber: w('fiber'),
    protein: w('proteins'),
    salt: w('salt'),
  };
}
