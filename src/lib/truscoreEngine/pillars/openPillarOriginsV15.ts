/**
 * Open Pillar v15 — OFF ingredient-origin evidence gate.
 * OFF is the only approved Open product source for Wave 3 MVP.
 *
 * Raw disclosure inputs: `origins`, `origins_tags` (ingredient origin).
 * Separate manufacturing fields (`manufacturing_places*`) are NOT ingredient-origin completeness.
 * Eco-Score `origins_of_ingredients` aggregated percentages are derived — never used for scoring.
 */

import { Product } from '../../../types/product';
import { tokenizeIngredientsText } from './openPillarHiddenTerms';
import type { OpenV15AdjustmentId } from './openPillarV15Registry';

const PLACEHOLDER_ORIGIN_VALUES = new Set([
  'unknown',
  'n/a',
  'not available',
  'missing',
  'not disclosed',
  'not specified',
  'undetermined',
  'unspecified',
]);

export interface OpenOriginsV15Assessment {
  id: OpenV15AdjustmentId;
  value: number;
  provenance: 'off_raw_origins' | 'off_insufficient' | 'off_conflict' | 'none';
  detail: string;
}

function normalizeOriginTag(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/^en:/, '')
    .replace(/-/g, ' ')
    .trim();
}

function isPlaceholderOriginValue(value: string): boolean {
  const v = value.toLowerCase().trim();
  if (!v) return true;
  if (PLACEHOLDER_ORIGIN_VALUES.has(v)) return true;
  return PLACEHOLDER_ORIGIN_VALUES.has(v.replace(/\s+/g, ' '));
}

/** Nested subingredient/composition list inside parentheses (comma-separated). */
export function hasNestedCompositionList(ingredientsText: string): boolean {
  return /\([^)]*,[^)]*\)/.test(ingredientsText);
}

/** Raw OFF ingredient-origin tags/strings — excludes manufacturing-only and Eco-Score derived data. */
export function getRawOffIngredientOriginTags(product: Product): string[] {
  const tags: string[] = [];
  if (Array.isArray(product.origins_tags)) {
    for (const t of product.origins_tags) {
      if (typeof t !== 'string') continue;
      const n = normalizeOriginTag(t);
      if (n && !isPlaceholderOriginValue(n)) tags.push(n);
    }
  }
  if (typeof product.origins === 'string' && product.origins.trim()) {
    const parts = product.origins.split(/[,;]/).map((p) => p.trim()).filter(Boolean);
    for (const p of parts) {
      const n = normalizeOriginTag(p);
      if (n && !isPlaceholderOriginValue(n)) tags.push(n);
    }
  }
  return [...new Set(tags)];
}

/** Distinct resolved countries from flat OFF origin fields (lexical variants deduped). */
export function resolveDistinctOffOriginCountries(product: Product): string[] {
  return getRawOffIngredientOriginTags(product);
}

function hasManufacturingOnlySignal(product: Product): boolean {
  const hasMfgTags =
    Array.isArray(product.manufacturing_places_tags) && product.manufacturing_places_tags.length > 0;
  const hasMfgString =
    typeof product.manufacturing_places === 'string' && product.manufacturing_places.trim().length > 0;
  return hasMfgTags || hasMfgString;
}

function ingredientTokensForOriginsGate(ingredientsText: string): string[] {
  const tokens = tokenizeIngredientsText(ingredientsText);
  if (tokens.length > 0) return tokens;
  const trimmed = ingredientsText.trim();
  return trimmed ? [trimmed] : [];
}

function singleIngredientEvidentlyCompleteEligible(
  ingredientsText: string,
  governedFlagCount: number
): { eligible: boolean; reason?: string } {
  const tokens = ingredientTokensForOriginsGate(ingredientsText);
  if (tokens.length !== 1) {
    return { eligible: false, reason: 'Requires exactly one substantive ingredient' };
  }
  if (governedFlagCount > 0) {
    return { eligible: false, reason: 'Governed vague or code-dependent ingredient wording present' };
  }
  if (hasNestedCompositionList(ingredientsText)) {
    return { eligible: false, reason: 'Nested subingredient/composition list not permitted for +8' };
  }
  return { eligible: true };
}

/**
 * Assess Open v15 Origins adjustment from OFF fields only.
 * Percentage / qualified / packet-gap bands remain unreachable under OFF-only MVP.
 */
export function assessOpenOriginsV15(
  product: Product,
  ingredientsText: string,
  ingredientsUsable: boolean,
  governedFlagCount: number
): OpenOriginsV15Assessment {
  if (!ingredientsUsable) {
    return {
      id: 'open-v15-origins-insufficient',
      value: 0,
      provenance: 'off_insufficient',
      detail: 'Usable ingredient declaration required before origins assessment',
    };
  }

  const distinctCountries = resolveDistinctOffOriginCountries(product);
  const tokens = ingredientTokensForOriginsGate(ingredientsText);
  const multiIngredient = tokens.length !== 1;

  if (distinctCountries.length > 1) {
    return {
      id: 'open-v15-origins-insufficient',
      value: 0,
      provenance: 'off_insufficient',
      detail: 'Multiple distinct OFF ingredient-origin countries — flat record non-scoring',
    };
  }

  const singleEligible = singleIngredientEvidentlyCompleteEligible(ingredientsText, governedFlagCount);

  if (!multiIngredient && distinctCountries.length === 1 && singleEligible.eligible) {
    return {
      id: 'open-v15-origins-evidently-complete',
      value: 8,
      provenance: 'off_raw_origins',
      detail: `Single-ingredient product with raw OFF origin: ${distinctCountries[0]}`,
    };
  }

  if (!multiIngredient && distinctCountries.length === 1 && !singleEligible.eligible) {
    return {
      id: 'open-v15-origins-insufficient',
      value: 0,
      provenance: 'off_insufficient',
      detail: singleEligible.reason || 'Single-ingredient +8 exception not met',
    };
  }

  // Multi-ingredient: do not infer completeness or percentages from partial OFF data.
  if (multiIngredient) {
    if (distinctCountries.length > 0) {
      return {
        id: 'open-v15-origins-insufficient',
        value: 0,
        provenance: 'off_insufficient',
        detail: 'Multi-ingredient product — no percentage inference from OFF MVP fields',
      };
    }
    if (hasManufacturingOnlySignal(product)) {
      return {
        id: 'open-v15-origins-insufficient',
        value: 0,
        provenance: 'off_insufficient',
        detail: 'Manufacturing place alone does not establish ingredient-origin disclosure',
      };
    }
    return {
      id: 'open-v15-origins-insufficient',
      value: 0,
      provenance: 'off_insufficient',
      detail: 'No governed OFF ingredient-origin disclosure',
    };
  }

  // Single ingredient but no raw origin country.
  if (hasManufacturingOnlySignal(product) && distinctCountries.length === 0) {
    return {
      id: 'open-v15-origins-insufficient',
      value: 0,
      provenance: 'off_insufficient',
      detail: 'Manufacturing place without ingredient-origin disclosure',
    };
  }

  return {
    id: 'open-v15-origins-insufficient',
    value: 0,
    provenance: 'off_insufficient',
    detail: 'Insufficient OFF ingredient-origin evidence',
  };
}
