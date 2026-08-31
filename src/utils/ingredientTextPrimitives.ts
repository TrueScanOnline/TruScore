/**
 * Shared ingredient-text helpers for NOVA 1 rescue and Whole Produce eligibility.
 * NOVA rescue uses narrow split; Whole Produce uses broad multi-ingredient detection.
 */

/** NOVA 1 rescue — comma/semicolon split only (Implementation Guidance v1.3). */
export function splitIngredientPartsNova(text: string): string[] {
  return text
    .split(/[,;]/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter((p) => p.length > 0);
}

/** Whole Produce — broad ingredient-part split (H3 / N1). */
export function splitIngredientPartsBroad(text: string): string[] {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return [];
  return normalized
    .split(/[,;/&+|·]|\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter((p) => p.length > 0);
}

/** Whole Produce — conservative multi-ingredient separator detection (H3). */
export function hasMultipleIngredientParts(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return false;
  if (/\band\b|\bwith\b|\bcontaining\b/.test(normalized)) {
    return true;
  }
  return splitIngredientPartsBroad(text).length > 1;
}

/** Whole Produce N1 — exactly one surviving normalized part required (not merely ≤1). */
export function hasExactlyOneSurvivingIngredientPart(text: string): boolean {
  return splitIngredientPartsBroad(text).length === 1;
}

/** NOVA composite / processed patterns — reused by Whole Produce processed-form gate (H1). */
export const INGREDIENT_COMPOSITE_BLOCK =
  /\b(bread|cracker|biscuit|pasta\s+sauce|soup|seasoned|salted\s+nuts|roasted\s+salted)\b/i;

export const INGREDIENT_PROCESSED_MARKERS =
  /\b(modified\s+starch|corn\s+syrup|high\s+fructose|hfcs|hydrogenated|nitrite|nitrate|preservative|colour|color|flavour|flavor|sweetener|emulsifier|stabiliser|stabilizer|isolate|carrageenan|xanthan|msg|maltodextrin)\b/i;

export const INGREDIENT_GROUP2_CULINARY =
  /\b(salt|sugar|sucrose|glucose|fructose|olive oil|vegetable oil|sunflower oil|canola oil|coconut oil|sesame oil|butter|margarine|lard|cream|honey|maple syrup|molasses|vinegar)\b/i;

/**
 * Whole Produce processed-form blockers — evaluated on raw ingredient text before
 * qualifier stripping (e.g. "dried" must not be erased before this check).
 * Does not block blanched / frozen / peeled / cut.
 */
export const WHOLE_PRODUCE_PROCESSED_FORM =
  /\b(jam|marmalade|compote|preserve|fruit spread|syrup|sauce|dried|dehydrated|freeze-dried|juice|smoothie|puree|purée|pulp|concentrate|powder|flour|cooked|roasted|fried|baked|seasoned|salted|smoked|sweetened|canned|pickled|fermented)\b/i;

export function rawIngredientTextHasProcessedForm(text: string): boolean {
  const raw = text.trim().toLowerCase();
  if (!raw) return false;
  return (
    WHOLE_PRODUCE_PROCESSED_FORM.test(raw) ||
    INGREDIENT_COMPOSITE_BLOCK.test(raw) ||
    INGREDIENT_PROCESSED_MARKERS.test(raw) ||
    INGREDIENT_GROUP2_CULINARY.test(raw)
  );
}
