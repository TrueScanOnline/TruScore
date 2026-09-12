/**
 * Reliable declared serving-size parsing for governed Nutrition assessment.
 * Ambiguous / count-only / multipack servings are unavailable — never guess.
 *
 * Explicit multi-serving totals (e.g. "250 g (2 servings)") resolve to a single
 * serve by division. Multipack notation without an explicit serving count
 * (e.g. "2 x 30 g") remains unusable.
 */

export type ParsedServingUnit = 'g' | 'ml';

export type ParseServingResult =
  | { usable: true; quantity: number; unit: ParsedServingUnit; sourceText: string }
  | {
      usable: false;
      reason: 'serving_unavailable' | 'serving_ambiguous' | 'serving_count_only';
      sourceText?: string;
    };

const METRIC_TOKEN =
  /(\d+(?:[.,]\d+)?)\s*(kg|g|grams?|grammes?|l|lt|ltr|litre|litres|liter|liters|ml|millilitres?|milliliters?)\b/gi;

/** Multipack / unit packs without an explicit "N servings" declaration. */
const MULTIPACK_METRIC =
  /(\d+)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*(kg|g|grams?|grammes?|l|lt|ltr|litre|litres|liter|liters|ml|millilitres?|milliliters?)\b/i;

const COUNT_ONLY =
  /^\s*\d*\s*(can|cans|piece|pieces|bar|bars|packet|packets|pack|packs|sachet|sachets|bottle|bottles|serving|servings|slice|slices)\b/i;

/** Explicit declared serving count: "(2 servings)", "/ 2 serves", "4 servings". */
const SERVING_COUNT = /(\d+)\s*(servings?|serves?)\b/i;

function toCanonicalUnit(raw: string): ParsedServingUnit | 'kg' | 'l' | null {
  const u = raw.toLowerCase();
  if (u === 'g' || u.startsWith('gram')) return 'g';
  if (u === 'kg') return 'kg';
  if (u === 'ml' || u.startsWith('millil')) return 'ml';
  if (u === 'l' || u === 'lt' || u === 'ltr' || u.startsWith('litre') || u.startsWith('liter')) return 'l';
  return null;
}

function toQuantityAndUnit(
  amount: number,
  unitRaw: string
): { quantity: number; unit: ParsedServingUnit } | null {
  const unit = toCanonicalUnit(unitRaw);
  if (!unit || !Number.isFinite(amount) || amount <= 0) return null;
  if (unit === 'kg') return { quantity: amount * 1000, unit: 'g' };
  if (unit === 'l') return { quantity: amount * 1000, unit: 'ml' };
  return { quantity: amount, unit };
}

function collectMetricMatches(
  sourceText: string
): Array<{ quantity: number; unit: ParsedServingUnit; index: number }> {
  const matches: Array<{ quantity: number; unit: ParsedServingUnit; index: number }> = [];
  METRIC_TOKEN.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = METRIC_TOKEN.exec(sourceText)) !== null) {
    const amount = Number(String(m[1]).replace(',', '.'));
    const converted = toQuantityAndUnit(amount, m[2]);
    if (converted) {
      matches.push({ ...converted, index: m.index });
    }
  }
  return matches;
}

function uniqueMetricValues(
  matches: Array<{ quantity: number; unit: ParsedServingUnit }>
): Array<{ quantity: number; unit: ParsedServingUnit }> {
  const unique = new Map<string, { quantity: number; unit: ParsedServingUnit }>();
  for (const hit of matches) {
    unique.set(`${hit.unit}:${hit.quantity}`, { quantity: hit.quantity, unit: hit.unit });
  }
  return [...unique.values()];
}

/**
 * Parse a single unambiguous metric serving from free text
 * (e.g. "30 g", "1 can (330 mL)", "250 g (2 servings)").
 */
export function parseReliableServingSize(servingSize?: string | null): ParseServingResult {
  const sourceText = (servingSize ?? '').trim();
  if (!sourceText) {
    return { usable: false, reason: 'serving_unavailable' };
  }

  // Multipack without explicit serving-count language is never usable evidence.
  if (MULTIPACK_METRIC.test(sourceText)) {
    return { usable: false, reason: 'serving_ambiguous', sourceText };
  }

  const matches = collectMetricMatches(sourceText);

  if (matches.length === 0) {
    if (COUNT_ONLY.test(sourceText) || /^\s*\d+\s*$/.test(sourceText)) {
      return { usable: false, reason: 'serving_count_only', sourceText };
    }
    return { usable: false, reason: 'serving_unavailable', sourceText };
  }

  const servingCountMatch = SERVING_COUNT.exec(sourceText);
  if (servingCountMatch) {
    const serveCount = Number(servingCountMatch[1]);
    if (!Number.isFinite(serveCount) || serveCount < 1) {
      return { usable: false, reason: 'serving_ambiguous', sourceText };
    }

    const unique = uniqueMetricValues(matches);
    if (unique.length !== 1) {
      // More than one incompatible metric with an explicit serve count — do not guess.
      return { usable: false, reason: 'serving_ambiguous', sourceText };
    }

    const total = unique[0];
    const perServe = total.quantity / serveCount;
    if (!(perServe > 0) || !Number.isFinite(perServe)) {
      return { usable: false, reason: 'serving_ambiguous', sourceText };
    }

    return {
      usable: true,
      quantity: perServe,
      unit: total.unit,
      sourceText,
    };
  }

  // Single-serving forms: prefer parenthetical / trailing metric when repeated identically.
  const unique = uniqueMetricValues(matches);
  if (unique.length > 1) {
    const units = new Set(unique.map((v) => v.unit));
    if (units.size > 1) {
      return { usable: false, reason: 'serving_ambiguous', sourceText };
    }
    const q0 = unique[0].quantity;
    if (unique.some((q) => Math.abs(q.quantity - q0) > 1e-6)) {
      return { usable: false, reason: 'serving_ambiguous', sourceText };
    }
  }

  const chosen = matches[matches.length - 1];
  return {
    usable: true,
    quantity: chosen.quantity,
    unit: chosen.unit,
    sourceText,
  };
}
