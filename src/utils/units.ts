/**
 * Display-only unit conversion for consumer nutrition surfaces.
 * Does not alter governed per-100 g/mL assessment inputs or scoring.
 *
 * Liquid conversions use US customary fluid ounces (1 US fl oz = 29.5735 mL).
 * Ambiguous "pint" labels are intentionally avoided.
 */
import { ProductNutriments } from '../types/product';

export type UnitSystem = 'metric' | 'imperial';

/** US customary fluid ounce in millilitres (not UK imperial). */
export const US_FL_OZ_ML = 29.5735;

export function gramsToOunces(grams: number): number {
  return grams * 0.035274;
}

export function ouncesToGrams(ounces: number): number {
  return ounces * 28.3495;
}

export function kilogramsToPounds(kg: number): number {
  return kg * 2.20462;
}

export function poundsToKilograms(lb: number): number {
  return lb * 0.453592;
}

export function millilitersToUsFluidOunces(ml: number): number {
  return ml / US_FL_OZ_ML;
}

export function usFluidOuncesToMilliliters(flOz: number): number {
  return flOz * US_FL_OZ_ML;
}

/** @deprecated Prefer millilitersToUsFluidOunces — name kept for call-site clarity. */
export function millilitersToFluidOunces(ml: number): number {
  return millilitersToUsFluidOunces(ml);
}

/** @deprecated Prefer usFluidOuncesToMilliliters */
export function fluidOuncesToMilliliters(flOz: number): number {
  return usFluidOuncesToMilliliters(flOz);
}

/**
 * Format a finite number for display without collapsing a nonzero quantity to "0".
 * Increases decimal places (up to `maxDecimals`) when fixed rounding would read as zero.
 */
export function formatNonZeroDisplayNumber(
  value: number,
  options?: { minDecimals?: number; maxDecimals?: number }
): string {
  if (!Number.isFinite(value)) return '—';
  if (value === 0) return '0';

  const minDecimals = options?.minDecimals ?? 0;
  const maxDecimals = options?.maxDecimals ?? 4;
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);

  for (let decimals = Math.max(minDecimals, 0); decimals <= maxDecimals; decimals++) {
    const fixed = abs.toFixed(decimals);
    if (Number(fixed) !== 0) {
      const trimmed = fixed
        .replace(/(\.\d*?[1-9])0+$/, '$1')
        .replace(/\.0+$/, '')
        .replace(/\.$/, '');
      return sign + trimmed;
    }
  }

  // Still rounds to zero at maxDecimals — show an explicit nonzero bound.
  const bound = Number((1 / Math.pow(10, maxDecimals)).toFixed(maxDecimals));
  return `${sign}<${bound}`;
}

function withUnit(amount: string, unitLabel: string): string {
  return `${amount} ${unitLabel}`;
}

/**
 * Format weight. Input `value` is always grams for nutrition cells.
 */
export function formatWeight(value: number, unit: UnitSystem): string {
  if (!Number.isFinite(value)) return '—';
  if (unit === 'imperial') {
    const ounces = gramsToOunces(value);
    if (Math.abs(ounces) >= 16) {
      const pounds = ounces / 16;
      return withUnit(formatNonZeroDisplayNumber(pounds, { minDecimals: 2, maxDecimals: 4 }), 'lb');
    }
    return withUnit(formatNonZeroDisplayNumber(ounces, { minDecimals: 2, maxDecimals: 4 }), 'oz');
  }
  if (Math.abs(value) >= 1000) {
    return withUnit(
      formatNonZeroDisplayNumber(value / 1000, { minDecimals: 2, maxDecimals: 4 }),
      'kg'
    );
  }
  return withUnit(formatNonZeroDisplayNumber(value, { minDecimals: 0, maxDecimals: 4 }), 'g');
}

/**
 * Format volume. Input `value` is always millilitres.
 * Imperial path uses US fl oz only (no pint).
 */
export function formatVolume(value: number, unit: UnitSystem): string {
  if (!Number.isFinite(value)) return '—';
  if (unit === 'imperial') {
    const flOz = millilitersToUsFluidOunces(value);
    return withUnit(
      formatNonZeroDisplayNumber(flOz, { minDecimals: 2, maxDecimals: 4 }),
      'US fl oz'
    );
  }
  if (Math.abs(value) >= 1000) {
    return withUnit(
      formatNonZeroDisplayNumber(value / 1000, { minDecimals: 2, maxDecimals: 4 }),
      'L'
    );
  }
  return withUnit(formatNonZeroDisplayNumber(value, { minDecimals: 0, maxDecimals: 4 }), 'mL');
}

/**
 * Convert nutrition values based on unit system.
 * Intentionally returns the original object — display conversion is formatting-only.
 */
export function convertNutriments(
  nutriments: ProductNutriments | undefined,
  _targetUnit: UnitSystem
): ProductNutriments | undefined {
  return nutriments;
}

const QTY_UNIT =
  /(\d+(?:\.\d+)?)\s*(g|kg|ml|mL|l|L|oz|lb|fl\s*oz)\b/gi;

function convertMatchedQuantity(value: number, originalUnit: string, target: UnitSystem): string {
  const u = originalUnit.toLowerCase().replace(/\s+/g, ' ');

  if (target === 'metric') {
    if (u === 'oz') return formatWeight(ouncesToGrams(value), 'metric');
    if (u === 'lb') return formatWeight(poundsToKilograms(value) * 1000, 'metric');
    if (u === 'fl oz') return formatVolume(usFluidOuncesToMilliliters(value), 'metric');
    // Already metric — normalise spelling only.
    if (u === 'g' || u === 'kg') {
      const grams = u === 'kg' ? value * 1000 : value;
      return formatWeight(grams, 'metric');
    }
    if (u === 'ml' || u === 'l') {
      const ml = u === 'l' ? value * 1000 : value;
      return formatVolume(ml, 'metric');
    }
    return `${formatNonZeroDisplayNumber(value)} ${originalUnit}`;
  }

  // target imperial / US customary
  if (u === 'g' || u === 'kg') {
    const grams = u === 'kg' ? value * 1000 : value;
    return formatWeight(grams, 'imperial');
  }
  if (u === 'ml' || u === 'l') {
    const ml = u === 'l' ? value * 1000 : value;
    return formatVolume(ml, 'imperial');
  }
  if (u === 'oz' || u === 'lb') {
    const grams = u === 'oz' ? ouncesToGrams(value) : poundsToKilograms(value) * 1000;
    return formatWeight(grams, 'imperial');
  }
  if (u === 'fl oz') {
    return formatVolume(usFluidOuncesToMilliliters(value), 'imperial');
  }
  return `${formatNonZeroDisplayNumber(value)} ${originalUnit}`;
}

/**
 * Format serving-size text for display.
 * Preserves multipliers and separators (e.g. "2 × 30 g" → "2 × 1.06 oz").
 */
export function formatServingSize(size: string | undefined, unit: UnitSystem): string {
  if (!size) return '';
  const trimmed = size.trim();
  if (!trimmed) return '';

  let replaced = false;
  const out = trimmed.replace(QTY_UNIT, (full, rawValue: string, rawUnit: string) => {
    const value = parseFloat(rawValue);
    if (!Number.isFinite(value)) return full;
    replaced = true;
    return convertMatchedQuantity(value, rawUnit, unit);
  });

  return replaced ? out : trimmed;
}

/**
 * Round-trip helper for tests: metric grams → imperial label → approximate grams.
 * Display-only; not used by scoring.
 */
export function approximateGramsFromImperialWeightLabel(label: string): number | null {
  const lb = label.match(/^(-?\d+(?:\.\d+)?)\s*lb$/i);
  if (lb) return poundsToKilograms(parseFloat(lb[1])) * 1000;
  const oz = label.match(/^(-?\d+(?:\.\d+)?|<[\d.]+)\s*oz$/i);
  if (oz && oz[1].startsWith('<')) return null;
  if (oz) return ouncesToGrams(parseFloat(oz[1]));
  return null;
}
