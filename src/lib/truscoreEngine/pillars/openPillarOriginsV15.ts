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

/** Raw OFF ingredient-origin tags/strings — excludes manufacturing-only and Eco-Score derived data. */
export function getRawOffIngredientOriginTags(product: Product): string[] {
  const tags: string[] = [];
  if (Array.isArray(product.origins_tags)) {
    for (const t of product.origins_tags) {
      const n = normalizeOriginTag(String(t));
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

function hasManufacturingOnlySignal(product: Product): boolean {
  const hasMfgTags =
    Array.isArray(product.manufacturing_places_tags) && product.manufacturing_places_tags.length > 0;
  const hasMfgString =
    typeof product.manufacturing_places === 'string' && product.manufacturing_places.trim().length > 0;
  return hasMfgTags || hasMfgString;
}

function hasEcoScoreAggregatedOrigins(product: Product): boolean {
  const ooi = product.ecoscore_data?.origins_of_ingredients;
  if (!ooi || typeof ooi !== 'object') return false;
  const agg = (ooi as { aggregated_origins?: unknown }).aggregated_origins;
  return Array.isArray(agg) && agg.length > 0;
}

function ingredientTokensForOriginsGate(ingredientsText: string): string[] {
  const tokens = tokenizeIngredientsText(ingredientsText);
  if (tokens.length > 0) return tokens;
  const trimmed = ingredientsText.trim();
  return trimmed ? [trimmed] : [];
}

function hasOriginConflict(rawTags: string[]): boolean {
  if (rawTags.length <= 1) return false;
  const normalized = rawTags.map((t) => t.toLowerCase());
  const unique = new Set(normalized);
  return unique.size > 1;
}

/**
 * Assess Open v15 Origins adjustment from OFF fields only.
 * Percentage / qualified / packet-gap bands remain unreachable under OFF-only MVP.
 */
export function assessOpenOriginsV15(
  product: Product,
  ingredientsText: string,
  ingredientsUsable: boolean
): OpenOriginsV15Assessment {
  if (!ingredientsUsable) {
    return {
      id: 'open-v15-origins-insufficient',
      value: 0,
      provenance: 'off_insufficient',
      detail: 'Usable ingredient declaration required before origins assessment',
    };
  }

  const rawTags = getRawOffIngredientOriginTags(product);
  const tokens = ingredientTokensForOriginsGate(ingredientsText);
  const multiIngredient = tokens.length !== 1;

  if (hasOriginConflict(rawTags)) {
    return {
      id: 'open-v15-origins-conflict',
      value: 0,
      provenance: 'off_conflict',
      detail: 'Conflicting raw OFF ingredient-origin tags',
    };
  }

  // Tightly bound single-ingredient exception: +8 when raw OFF origin identifies specific origin.
  if (!multiIngredient && rawTags.length === 1) {
    if (hasEcoScoreAggregatedOrigins(product) && rawTags.length === 0) {
      return {
        id: 'open-v15-origins-insufficient',
        value: 0,
        provenance: 'off_insufficient',
        detail: 'Eco-Score aggregated origins cannot establish disclosure completeness',
      };
    }
    return {
      id: 'open-v15-origins-evidently-complete',
      value: 8,
      provenance: 'off_raw_origins',
      detail: `Single-ingredient product with raw OFF origin: ${rawTags[0]}`,
    };
  }

  // Multi-ingredient: do not infer completeness or percentages from partial OFF data.
  if (multiIngredient) {
    if (rawTags.length > 0) {
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

  // Single ingredient but no raw origin tag.
  if (hasManufacturingOnlySignal(product) && rawTags.length === 0) {
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
