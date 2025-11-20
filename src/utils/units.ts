// Unit conversion utilities for metric/imperial
import { ProductNutriments } from '../types/product';

export type UnitSystem = 'metric' | 'imperial';

/**
 * Convert grams to ounces
 */
export function gramsToOunces(grams: number): number {
  return grams * 0.035274;
}

/**
 * Convert ounces to grams
 */
export function ouncesToGrams(ounces: number): number {
  return ounces * 28.3495;
}

/**
 * Convert kilograms to pounds
 */
export function kilogramsToPounds(kg: number): number {
  return kg * 2.20462;
}

/**
 * Convert pounds to kilograms
 */
export function poundsToKilograms(lb: number): number {
  return lb * 0.453592;
}

/**
 * Convert milliliters to fluid ounces
 */
export function millilitersToFluidOunces(ml: number): number {
  return ml * 0.033814;
}

/**
 * Convert fluid ounces to milliliters
 */
export function fluidOuncesToMilliliters(flOz: number): number {
  return flOz * 29.5735;
}

/**
 * Format weight value with unit
 */
export function formatWeight(value: number, unit: UnitSystem): string {
  if (unit === 'imperial') {
    const ounces = gramsToOunces(value);
    if (ounces >= 16) {
      const pounds = ounces / 16;
      return `${pounds.toFixed(2)} lb`;
    }
    return `${ounces.toFixed(2)} oz`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)} kg`;
  }
  return `${value.toFixed(2)} g`;
}

/**
 * Format volume value with unit
 */
export function formatVolume(value: number, unit: UnitSystem): string {
  if (unit === 'imperial') {
    const flOz = millilitersToFluidOunces(value);
    if (flOz >= 16) {
      const pints = flOz / 16;
      return `${pints.toFixed(2)} pt`;
    }
    return `${flOz.toFixed(2)} fl oz`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)} L`;
  }
  return `${value.toFixed(2)} mL`;
}

/**
 * Convert nutrition values based on unit system
 */
export function convertNutriments(
  nutriments: ProductNutriments | undefined,
  targetUnit: UnitSystem
): ProductNutriments | undefined {
  if (!nutriments || targetUnit === 'metric') {
    return nutriments;
  }

  // For imperial, we'll convert values on display, not modify the original data
  // This is a placeholder - actual implementation would convert specific fields
  return nutriments;
}

/**
 * Format serving size with unit
 */
export function formatServingSize(size: string | undefined, unit: UnitSystem): string {
  if (!size) return '';

  // Try to extract numeric value and unit
  const match = size.match(/(\d+(?:\.\d+)?)\s*(g|kg|ml|l|oz|lb|fl oz)/i);
  if (!match) return size;

  const value = parseFloat(match[1]);
  const originalUnit = match[2].toLowerCase();

  if (unit === 'metric') {
    // Convert to metric if needed
    if (['oz', 'lb'].includes(originalUnit)) {
      const grams = originalUnit === 'oz' ? ouncesToGrams(value) : poundsToKilograms(value) * 1000;
      if (grams >= 1000) {
        return `${(grams / 1000).toFixed(2)} kg`;
      }
      return `${grams.toFixed(2)} g`;
    }
    if (['fl oz'].includes(originalUnit)) {
      const ml = fluidOuncesToMilliliters(value);
      if (ml >= 1000) {
        return `${(ml / 1000).toFixed(2)} L`;
      }
      return `${ml.toFixed(2)} mL`;
    }
    return size; // Already metric
  } else {
    // Convert to imperial if needed
    if (['g', 'kg'].includes(originalUnit)) {
      const grams = originalUnit === 'kg' ? value * 1000 : value;
      const ounces = gramsToOunces(grams);
      if (ounces >= 16) {
        return `${(ounces / 16).toFixed(2)} lb`;
      }
      return `${ounces.toFixed(2)} oz`;
    }
    if (['ml', 'l'].includes(originalUnit)) {
      const ml = originalUnit === 'l' ? value * 1000 : value;
      const flOz = millilitersToFluidOunces(ml);
      if (flOz >= 16) {
        return `${(flOz / 16).toFixed(2)} pt`;
      }
      return `${flOz.toFixed(2)} fl oz`;
    }
    return size; // Already imperial
  }
}

