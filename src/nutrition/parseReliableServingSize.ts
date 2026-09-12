/**
 * Reliable declared serving-size parsing for governed Nutrition assessment.
 * Ambiguous / count-only servings are unavailable — never guess.
 */

export type ParsedServingUnit = 'g' | 'ml';

export type ParseServingResult =
  | { usable: true; quantity: number; unit: ParsedServingUnit; sourceText: string }
  | { usable: false; reason: 'serving_unavailable' | 'serving_ambiguous' | 'serving_count_only'; sourceText?: string };

const METRIC_TOKEN =
  /(\d+(?:[.,]\d+)?)\s*(kg|g|grams?|grammes?|l|lt|ltr|litre|litres|liter|liters|ml|millilitres?|milliliters?)\b/gi;

const COUNT_ONLY =
  /^\s*\d*\s*(can|cans|piece|pieces|bar|bars|packet|packets|pack|packs|sachet|sachets|bottle|bottles|serving|servings|slice|slices)\b/i;

function toCanonicalUnit(raw: string): ParsedServingUnit | 'kg' | 'l' | null {
  const u = raw.toLowerCase();
  if (u === 'g' || u.startsWith('gram')) return 'g';
  if (u === 'kg') return 'kg';
  if (u === 'ml' || u.startsWith('millil')) return 'ml';
  if (u === 'l' || u === 'lt' || u === 'ltr' || u.startsWith('litre') || u.startsWith('liter')) return 'l';
  return null;
}

function toQuantityAndUnit(amount: number, unitRaw: string): { quantity: number; unit: ParsedServingUnit } | null {
  const unit = toCanonicalUnit(unitRaw);
  if (!unit || !Number.isFinite(amount) || amount <= 0) return null;
  if (unit === 'kg') return { quantity: amount * 1000, unit: 'g' };
  if (unit === 'l') return { quantity: amount * 1000, unit: 'ml' };
  return { quantity: amount, unit };
}

/**
 * Parse a single unambiguous metric serving from free text (e.g. "30 g", "1 can (330 mL)").
 */
export function parseReliableServingSize(servingSize?: string | null): ParseServingResult {
  const sourceText = (servingSize ?? '').trim();
  if (!sourceText) {
    return { usable: false, reason: 'serving_unavailable' };
  }

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

  if (matches.length === 0) {
    if (COUNT_ONLY.test(sourceText) || /^\s*\d+\s*$/.test(sourceText)) {
      return { usable: false, reason: 'serving_count_only', sourceText };
    }
    return { usable: false, reason: 'serving_unavailable', sourceText };
  }

  // Prefer parenthetical / trailing metric when multiple (e.g. "1 can (330 mL)")
  const unique = new Map<string, { quantity: number; unit: ParsedServingUnit }>();
  for (const hit of matches) {
    unique.set(`${hit.unit}:${hit.quantity}`, { quantity: hit.quantity, unit: hit.unit });
  }
  if (unique.size > 1) {
    // Same physical quantity expressed twice is OK; incompatible metrics are not.
    const units = new Set([...unique.values()].map((v) => v.unit));
    const quantities = [...unique.values()];
    if (units.size > 1) {
      return { usable: false, reason: 'serving_ambiguous', sourceText };
    }
    const q0 = quantities[0].quantity;
    if (quantities.some((q) => Math.abs(q.quantity - q0) > 1e-6)) {
      return { usable: false, reason: 'serving_ambiguous', sourceText };
    }
  }

  // If multiple identical, or one unique — take the last metric token (often the parenthetical).
  const chosen = matches[matches.length - 1];
  return {
    usable: true,
    quantity: chosen.quantity,
    unit: chosen.unit,
    sourceText,
  };
}
