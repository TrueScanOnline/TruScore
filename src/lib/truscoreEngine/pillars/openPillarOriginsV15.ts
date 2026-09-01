/**
 * Open Pillar v15 — OFF ingredient-origin evidence gate.
 * OFF is the only approved Open product source for Wave 3 MVP.
 *
 * +8 Evidently Complete requires exactly one valid structured `origins_tags` value.
 * Free-text `origins` alone cannot establish +8; when both fields exist, free-text is
 * contextual only and must mechanically normalize to the same single tag or fail closed.
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

/**
 * MVP conservative parenthetical guard: comma-separated content inside parentheses
 * disqualifies +8 eligibility (accepts false negatives rather than semantic parsing).
 */
export function hasNestedCompositionList(ingredientsText: string): boolean {
  return /\([^)]*,[^)]*\)/.test(ingredientsText);
}

/** Valid structured OFF ingredient-origin tags from `origins_tags` only (strings). */
export function getStructuredOffOriginTags(product: Product): string[] {
  const tags: string[] = [];
  if (Array.isArray(product.origins_tags)) {
    for (const t of product.origins_tags) {
      if (typeof t !== 'string') continue;
      const n = normalizeOriginTag(t);
      if (n && !isPlaceholderOriginValue(n)) tags.push(n);
    }
  }
  return [...new Set(tags)];
}

/** @deprecated Scoring uses structured tags only; retained for test/diagnostic imports. */
export function getRawOffIngredientOriginTags(product: Product): string[] {
  return getStructuredOffOriginTags(product);
}

/** Distinct resolved countries from structured `origins_tags` only. */
export function resolveDistinctOffOriginCountries(product: Product): string[] {
  return getStructuredOffOriginTags(product);
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

/**
 * When free-text `origins` is present alongside a single structured tag, require narrow
 * whole-string mechanical normalization match — no conjunction parsing or splitting.
 */
function freeTextOriginsConsistentWithStructuredTag(
  product: Product,
  normalizedStructuredTag: string
): boolean {
  if (typeof product.origins !== 'string' || !product.origins.trim()) return true;
  const normalizedOrigins = normalizeOriginTag(product.origins);
  return normalizedOrigins === normalizedStructuredTag;
}

function singleIngredientEvidentlyCompleteEligible(
  ingredientsText: string,
  governedFlagCount: number
): { eligible: boolean; reason?: string } {
  const tokens = ingredientTokensForOriginsGate(ingredientsText);
  if (tokens.length !== 1) {
    return { eligible: false, reason: 'Requires exactly one actual declared ingredient' };
  }
  if (governedFlagCount > 0) {
    return { eligible: false, reason: 'Governed vague or code-dependent ingredient wording present' };
  }
  if (hasNestedCompositionList(ingredientsText)) {
    return {
      eligible: false,
      reason: 'Comma-separated parenthetical content disqualifies +8 at MVP',
    };
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

  const structuredTags = getStructuredOffOriginTags(product);
  const tokens = ingredientTokensForOriginsGate(ingredientsText);
  const multiIngredient = tokens.length !== 1;

  if (structuredTags.length > 1) {
    return {
      id: 'open-v15-origins-insufficient',
      value: 0,
      provenance: 'off_insufficient',
      detail: 'Multiple distinct structured OFF origin tags — flat record non-scoring',
    };
  }

  const singleEligible = singleIngredientEvidentlyCompleteEligible(ingredientsText, governedFlagCount);

  if (
    !multiIngredient &&
    structuredTags.length === 1 &&
    singleEligible.eligible &&
    freeTextOriginsConsistentWithStructuredTag(product, structuredTags[0])
  ) {
    return {
      id: 'open-v15-origins-evidently-complete',
      value: 8,
      provenance: 'off_raw_origins',
      detail: `Single-ingredient product with structured OFF origin tag: ${structuredTags[0]}`,
    };
  }

  if (!multiIngredient && structuredTags.length === 1 && !singleEligible.eligible) {
    return {
      id: 'open-v15-origins-insufficient',
      value: 0,
      provenance: 'off_insufficient',
      detail: singleEligible.reason || 'Single-ingredient +8 exception not met',
    };
  }

  if (
    !multiIngredient &&
    structuredTags.length === 1 &&
    singleEligible.eligible &&
    !freeTextOriginsConsistentWithStructuredTag(product, structuredTags[0])
  ) {
    return {
      id: 'open-v15-origins-insufficient',
      value: 0,
      provenance: 'off_insufficient',
      detail: 'Free-text origins not mechanically consistent with structured origin tag',
    };
  }

  // Multi-ingredient: do not infer completeness or percentages from partial OFF data.
  if (multiIngredient) {
    if (structuredTags.length > 0) {
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

  // Single ingredient but no qualifying structured origin tag (+8 requires origins_tags).
  if (hasManufacturingOnlySignal(product) && structuredTags.length === 0) {
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
    detail: 'Insufficient structured OFF ingredient-origin evidence',
  };
}
