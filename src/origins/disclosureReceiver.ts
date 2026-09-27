/**
 * Transparency Origins Disclosure receiver.
 * Open scoring and origins_tags stay unchanged.
 * ingredient_origin, grown_in, and produced_in may enter the existing v15
 * completeness rules. made_in and packed_in do not. grown_in and produced_in
 * do not become a scored state unless the admitted evidence meets one.
 */

import type { Product } from '../types/product';
import type { OpenPillarResult } from '../lib/truscoreEngine/pillars/openPillar';
import {
  ingredientTokensForOriginsGate,
  isRecognizedOriginCountry,
  singleIngredientEvidentlyCompleteEligible,
} from '../lib/truscoreEngine/pillars/openPillarOriginsV15';
import { resolveOpenV15ScoringIngredients } from '../lib/truscoreEngine/pillars/openPillarIngredientsLanguage';
import { ingredientSubjectKey } from '../contributions/originStructured';
import type { GovernedOriginFact } from './governedFacts';

export type OriginsDisclosureRequirement =
  | 'evidently_complete'
  | 'stated_percentage_band'
  | 'qualified_partial';

export type OriginsDisclosureResolution =
  | { resolved: false }
  | { resolved: true; requirement: OriginsDisclosureRequirement };

function recognizedCountries(fact: GovernedOriginFact): string[] {
  return fact.countries.filter((country) => isRecognizedOriginCountry(country));
}

function exactPercentageInExistingBand(percentage: number): boolean {
  if (!Number.isInteger(percentage)) return false;
  return (
    (percentage >= 1 && percentage <= 24) ||
    (percentage >= 25 && percentage <= 49) ||
    (percentage >= 50 && percentage <= 75) ||
    (percentage >= 76 && percentage <= 94) ||
    (percentage >= 95 && percentage <= 99)
  );
}

const DISCLOSURE_CLAIM_TYPES = new Set(['ingredient_origin', 'grown_in', 'produced_in']);

function isQualifiedQualifier(fact: GovernedOriginFact): boolean {
  return (
    fact.percentageQualifier === 'at_least' ||
    fact.percentageQualifier === 'more_than' ||
    fact.percentageQualifier === 'less_than'
  );
}

function subjectMatchesSingleIngredient(
  facts: GovernedOriginFact[],
  tokens: string[],
  singleEligible: boolean
): boolean {
  return (
    singleEligible &&
    tokens.length === 1 &&
    facts.length === 1 &&
    ingredientSubjectKey(facts[0].ingredientSubject) === ingredientSubjectKey(tokens[0])
  );
}

/**
 * Existing v15 states only: single-ingredient complete, an exact completeness
 * percentage in a registered band, or a qualified/unquantified partial statement.
 * grown_in and produced_in use the same states and do not receive the
 * unquantified-partial path from a country alone.
 */
export function resolveGovernedOriginsDisclosure(
  product: Product,
  open: OpenPillarResult,
  facts: GovernedOriginFact[] | undefined
): OriginsDisclosureResolution {
  const scoringFacts = (facts || []).filter((fact) => DISCLOSURE_CLAIM_TYPES.has(fact.claimType));
  if (scoringFacts.length === 0) return { resolved: false };

  const countries = [...new Set(scoringFacts.flatMap(recognizedCountries))];
  if (countries.length !== 1) return { resolved: false };

  if (scoringFacts.some((fact) => fact.percentage != null && fact.percentageQualifier == null)) {
    return { resolved: false };
  }

  const ingredients = resolveOpenV15ScoringIngredients(product);
  const tokens = ingredients.usable ? ingredientTokensForOriginsGate(ingredients.scoringText) : [];
  const single = ingredients.usable
    ? singleIngredientEvidentlyCompleteEligible(ingredients.scoringText, open.details.governedFlagCount)
    : { eligible: false };

  const ingredientOrigins = scoringFacts.filter((fact) => fact.claimType === 'ingredient_origin');
  const placeOrigins = scoringFacts.filter(
    (fact) => fact.claimType === 'grown_in' || fact.claimType === 'produced_in'
  );

  const ingredientMatch = subjectMatchesSingleIngredient(ingredientOrigins, tokens, single.eligible);
  const placeMatch = subjectMatchesSingleIngredient(placeOrigins, tokens, single.eligible);
  const ingredientFact = ingredientOrigins.length === 1 ? ingredientOrigins[0] : undefined;
  const placeFact = placeOrigins.length === 1 ? placeOrigins[0] : undefined;

  if (
    ingredientMatch &&
    ingredientFact &&
    (ingredientFact.percentage == null ||
      (ingredientFact.percentageQualifier === 'exactly' && ingredientFact.percentage === 100))
  ) {
    return { resolved: true, requirement: 'evidently_complete' };
  }

  if (
    placeMatch &&
    placeFact &&
    placeOrigins.length === scoringFacts.length &&
    (placeFact.percentage == null ||
      (placeFact.percentageQualifier === 'exactly' && placeFact.percentage === 100))
  ) {
    return { resolved: true, requirement: 'evidently_complete' };
  }

  if (
    ingredientMatch &&
    ingredientFact &&
    ingredientFact.percentageQualifier === 'exactly' &&
    ingredientFact.percentage != null &&
    exactPercentageInExistingBand(ingredientFact.percentage)
  ) {
    return { resolved: true, requirement: 'stated_percentage_band' };
  }

  if (
    placeMatch &&
    placeFact &&
    placeOrigins.length === scoringFacts.length &&
    placeFact.percentageQualifier === 'exactly' &&
    placeFact.percentage != null &&
    exactPercentageInExistingBand(placeFact.percentage)
  ) {
    return { resolved: true, requirement: 'stated_percentage_band' };
  }

  const ingredientQualified = ingredientOrigins.some(isQualifiedQualifier);
  const ingredientUnquantified =
    ingredientOrigins.length > 0 && ingredientOrigins.every((row) => row.percentage == null);
  const ingredientStatement = ingredientOrigins.some((row) => !!row.exactWording?.trim());
  if (ingredientStatement && (ingredientQualified || (ingredientUnquantified && !single.eligible))) {
    return { resolved: true, requirement: 'qualified_partial' };
  }

  const placeQualified = placeOrigins.some(isQualifiedQualifier);
  const placeStatement = placeOrigins.some((row) => !!row.exactWording?.trim());
  if (placeStatement && placeQualified) {
    return { resolved: true, requirement: 'qualified_partial' };
  }

  return { resolved: false };
}
