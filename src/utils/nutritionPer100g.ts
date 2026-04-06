import { ProductNutriments } from '../types/product';

export function toFiniteNumber(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value === 'string') {
    const normalized = value.replace(',', '.').trim();
    if (!normalized) return undefined;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

/**
 * Resolve a per-100g nutrient value. Matches Open Food Facts-style keys and common variants.
 */
export function getNutrientValue100g(nutriments: ProductNutriments | undefined, key: string): number | undefined {
  if (!nutriments) return undefined;

  const canonical100g = `${key}_100g`;
  const underscoreKey = key.replace(/-/g, '_');
  const underscore100g = `${underscoreKey}_100g`;
  const singularProteinKey = key === 'proteins' ? 'protein' : key;
  const singularProtein100g = `${singularProteinKey}_100g`;

  const candidates = [
    canonical100g,
    key,
    underscore100g,
    underscoreKey,
    singularProtein100g,
    singularProteinKey,
  ];

  for (const candidate of candidates) {
    const rawValue = nutriments[candidate as keyof ProductNutriments] as unknown;
    const numericValue = toFiniteNumber(rawValue);
    if (numericValue !== undefined) {
      return numericValue;
    }
  }

  return undefined;
}

/**
 * Kilocalories per 100 g for energy-context features. Uses explicit kcal fields first, then kJ conversion.
 * Generic `energy` is treated as kJ when very high (typical OFF energy_100g), else as kcal.
 */
export function resolveKcalPer100g(nutriments: ProductNutriments | undefined): number | undefined {
  if (!nutriments) return undefined;

  const kcal = getNutrientValue100g(nutriments, 'energy-kcal');
  if (kcal !== undefined && kcal > 0) return kcal;

  const kj = getNutrientValue100g(nutriments, 'energy-kj');
  if (kj !== undefined && kj > 0) return kj / 4.184;

  const energy = getNutrientValue100g(nutriments, 'energy');
  if (energy !== undefined && energy > 0) {
    if (energy >= 500) return energy / 4.184;
    return energy;
  }

  return undefined;
}
