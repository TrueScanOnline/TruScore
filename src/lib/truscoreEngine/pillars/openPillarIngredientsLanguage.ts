/**
 * Open v15 — English-only governed ingredient assessability (AU/NZ MVP).
 *
 * Display may show foreign-language OFF `ingredients_text` verbatim.
 * Scoring uses English-assessable wording only (no language detection / translation).
 *
 * Precedence:
 * A. usable `ingredients_text_en` → score that field
 * B. else usable generic `ingredients_text` only when OFF metadata affirmatively marks English
 * C. else unassessable → clarity unavailable (0), not +1 from matcher silence
 */

import type { Product } from '../../../types/product';

export type OpenV15IngredientsScoringSource =
  | 'ingredients_text_en'
  | 'ingredients_text'
  | 'none';

export interface OpenV15IngredientsResolution {
  scoringText: string;
  usable: boolean;
  source: OpenV15IngredientsScoringSource;
}

/** Normalize OFF language codes (`en`, `en-GB`, `en_US`) to a primary ISO 639-1 token. */
export function normalizeOffLanguageCode(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return null;
  const primary = trimmed.split(/[-_]/)[0]?.trim();
  return primary || null;
}

function isPlaceholderIngredients(text: string): boolean {
  return /^(product|item|n\/a|not available|unknown|missing|no ingredients|ingredients not listed)/i.test(
    text.trim()
  );
}

function isUsableIngredientsBody(text: string): boolean {
  if (!text || text.trim().length === 0) return false;
  if (isPlaceholderIngredients(text)) return false;
  return true;
}

/**
 * Affirmative English for generic `ingredients_text`.
 *
 * OFF Product-Ingredients schema: `ingredients_text` is “a copy of ingredients_text in the
 * main language of the product (see `lang` property)”. `lc` is the historical duplicate of `lang`.
 * `ingredients_lc` is the language used to parse the ingredient list (equals `lang` when
 * main-language ingredients_text is available).
 *
 * Prefer `ingredients_lc` when present; otherwise `lang`/`lc` (OFF-contract binding to the
 * generic field). No heuristic language detection.
 */
export function isAffirmativelyEnglishIngredientSource(product: Product): boolean {
  const ingredientsLc = normalizeOffLanguageCode(product.ingredients_lc);
  if (ingredientsLc) return ingredientsLc === 'en';

  const productLang =
    normalizeOffLanguageCode(product.lang) ?? normalizeOffLanguageCode(product.lc);
  if (productLang) return productLang === 'en';

  return false;
}

export function resolveOpenV15ScoringIngredients(product: Product): OpenV15IngredientsResolution {
  const en =
    typeof product.ingredients_text_en === 'string' ? product.ingredients_text_en.trim() : '';
  if (isUsableIngredientsBody(en)) {
    return { scoringText: en, usable: true, source: 'ingredients_text_en' };
  }

  const primary =
    typeof product.ingredients_text === 'string' ? product.ingredients_text.trim() : '';
  if (isUsableIngredientsBody(primary) && isAffirmativelyEnglishIngredientSource(product)) {
    return { scoringText: primary, usable: true, source: 'ingredients_text' };
  }

  return { scoringText: '', usable: false, source: 'none' };
}
