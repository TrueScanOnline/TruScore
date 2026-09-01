/**
 * Open Pillar v15 — OFF ingredient-origin evidence gate.
 * OFF is the only approved Open product source for Wave 3 MVP.
 *
 * +8 Evidently Complete requires exactly one valid structured `origins_tags` value
 * representing a recognised country, with a clean complete evidence set (no malformed,
 * placeholder or unrecognised entries). Free-text `origins` alone cannot establish +8.
 * Separate manufacturing fields (`manufacturing_places*`) are NOT ingredient-origin completeness.
 * Eco-Score `origins_of_ingredients` aggregated percentages are derived — never used for scoring.
 */

import { Product } from '../../../types/product';
import { COUNTRIES } from '../../../utils/countries';
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

export interface OriginsTagsEvidenceAudit {
  /** Complete set contained malformed, placeholder or unrecognised entries. */
  dirty: boolean;
  /** Distinct recognised countries from clean string entries only (pre-dedup source list). */
  distinctRecognizedCountries: string[];
}

function normalizeOriginTag(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/^en:/, '')
    .replace(/-/g, ' ')
    .trim();
}

function mechanicalCountryKey(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/^en:/, '')
    .replace(/-/g, ' ')
    .replace(/['().]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const RECOGNIZED_OFF_COUNTRY_KEYS = new Set(
  COUNTRIES.map((c) => mechanicalCountryKey(c.name)).filter(Boolean)
);

function isPlaceholderOriginValue(value: string): boolean {
  const v = value.toLowerCase().trim();
  if (!v) return true;
  if (PLACEHOLDER_ORIGIN_VALUES.has(v)) return true;
  return PLACEHOLDER_ORIGIN_VALUES.has(v.replace(/\s+/g, ' '));
}

function isRecognizedOffCountry(normalizedTag: string): boolean {
  return RECOGNIZED_OFF_COUNTRY_KEYS.has(mechanicalCountryKey(normalizedTag));
}

/**
 * Inspect the complete supplied `origins_tags` evidence set before deduplication.
 * Malformed, empty, placeholder and unrecognised entries mark the set dirty (+8 ineligible).
 */
export function auditOriginsTagsEvidence(product: Product): OriginsTagsEvidenceAudit {
  if (!Array.isArray(product.origins_tags) || product.origins_tags.length === 0) {
    return { dirty: false, distinctRecognizedCountries: [] };
  }

  let dirty = false;
  const recognized: string[] = [];

  for (const entry of product.origins_tags) {
    if (typeof entry !== 'string') {
      dirty = true;
      continue;
    }
    const trimmed = entry.trim();
    if (!trimmed || trimmed === 'en:') {
      dirty = true;
      continue;
    }
    const normalized = normalizeOriginTag(trimmed);
    if (!normalized || isPlaceholderOriginValue(normalized)) {
      dirty = true;
      continue;
    }
    if (!isRecognizedOffCountry(normalized)) {
      dirty = true;
      continue;
    }
    recognized.push(normalized);
  }

  return {
    dirty,
    distinctRecognizedCountries: [...new Set(recognized)],
  };
}

/**
 * MVP conservative parenthetical guard: comma-separated content inside parentheses
 * disqualifies +8 eligibility (accepts false negatives rather than semantic parsing).
 */
export function hasNestedCompositionList(ingredientsText: string): boolean {
  return /\([^)]*,[^)]*\)/.test(ingredientsText);
}

/** Recognised countries from structured `origins_tags` when the evidence set is clean. */
export function getStructuredOffOriginTags(product: Product): string[] {
  const audit = auditOriginsTagsEvidence(product);
  if (audit.dirty) return [];
  return audit.distinctRecognizedCountries;
}

/** @deprecated Scoring uses structured tags only; retained for test/diagnostic imports. */
export function getRawOffIngredientOriginTags(product: Product): string[] {
  return getStructuredOffOriginTags(product);
}

/** Distinct recognised countries from clean structured `origins_tags` only. */
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

  const originsAudit = auditOriginsTagsEvidence(product);
  const structuredCountries = originsAudit.dirty ? [] : originsAudit.distinctRecognizedCountries;
  const tokens = ingredientTokensForOriginsGate(ingredientsText);
  const multiIngredient = tokens.length !== 1;

  if (originsAudit.dirty) {
    return {
      id: 'open-v15-origins-insufficient',
      value: 0,
      provenance: 'off_insufficient',
      detail: 'Dirty structured origins_tags evidence — fail closed',
    };
  }

  if (structuredCountries.length > 1) {
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
    structuredCountries.length === 1 &&
    singleEligible.eligible &&
    freeTextOriginsConsistentWithStructuredTag(product, structuredCountries[0])
  ) {
    return {
      id: 'open-v15-origins-evidently-complete',
      value: 8,
      provenance: 'off_raw_origins',
      detail: `Single-ingredient product with structured OFF origin tag: ${structuredCountries[0]}`,
    };
  }

  if (!multiIngredient && structuredCountries.length === 1 && !singleEligible.eligible) {
    return {
      id: 'open-v15-origins-insufficient',
      value: 0,
      provenance: 'off_insufficient',
      detail: singleEligible.reason || 'Single-ingredient +8 exception not met',
    };
  }

  if (
    !multiIngredient &&
    structuredCountries.length === 1 &&
    singleEligible.eligible &&
    !freeTextOriginsConsistentWithStructuredTag(product, structuredCountries[0])
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
    if (structuredCountries.length > 0) {
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
  if (hasManufacturingOnlySignal(product) && structuredCountries.length === 0) {
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
