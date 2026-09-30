/**
 * Transparency Origins Disclosure receiver.
 * ingredient_origin, grown_in, and produced_in may enter the existing v15
 * completeness rules. A quantified ingredient-origin proposition, including one
 * carried on a made_in fact, maps into the existing Open v15 completeness states.
 * A bare made_in or packed_in fact does not. A Grown in or Produced in
 * statement uses the existing completeness check. When that statement names no
 * ingredient and the product has one governed ingredient, that identity is used.
 * Ambiguous ingredient identity fails closed.
 */

import type { Product } from '../types/product';
import type { OpenPillarResult } from '../lib/truscoreEngine/pillars/openPillar';
import {
  ingredientTokensForOriginsGate,
  isRecognizedOriginCountry,
  singleIngredientEvidentlyCompleteEligible,
} from '../lib/truscoreEngine/pillars/openPillarOriginsV15';
import { resolveOpenV15ScoringIngredients } from '../lib/truscoreEngine/pillars/openPillarIngredientsLanguage';
import { ingredientComparisonKey } from '../contributions/originStructured';
import type { GovernedOriginFact } from './governedFacts';
import type { OpenV15AdjustmentId } from '../lib/truscoreEngine/pillars/openPillarV15Registry';

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

/**
 * A made_in fact is manufacturing origin only.
 * When the reviewed record already carries an explicit percentage and qualifier,
 * that pair is the ingredient-origin proposition. It is not parsed out of the sentence.
 */
/** Ingredient-origin proposition already carried on a quantified made_in fact. Bare made_in returns null. */
export function explicitIngredientOriginFromMadeIn(fact: GovernedOriginFact): GovernedOriginFact | null {
  if (fact.claimType !== 'made_in') return null;
  if (fact.percentage == null) return null;
  if (fact.percentageQualifier == null && fact.percentage !== 100) return null;
  if (fact.countries.length === 0) return null;
  return {
    ...fact,
    claimType: 'ingredient_origin',
    subjectKey: `ingredient_origin:${fact.subjectKey}`,
  };
}

function isQualifiedQualifier(fact: GovernedOriginFact): boolean {
  return (
    fact.percentageQualifier === 'at_least' ||
    fact.percentageQualifier === 'more_than' ||
    fact.percentageQualifier === 'less_than'
  );
}

function placeMatchesSoleIngredient(
  facts: GovernedOriginFact[],
  tokens: string[],
  singleEligible: boolean
): boolean {
  if (!singleEligible || tokens.length !== 1 || facts.length !== 1) return false;
  const named = ingredientComparisonKey(facts[0].ingredientSubject);
  if (!named) return true;
  return named === ingredientComparisonKey(tokens[0]);
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
    ingredientComparisonKey(facts[0].ingredientSubject) === ingredientComparisonKey(tokens[0])
  );
}

/**
 * Existing v15 states only: single-ingredient complete, an exact completeness
 * percentage in a registered band, or a qualified/unquantified partial statement.
 * grown_in and produced_in use the same states. A country alone does not take
 * the unquantified-partial path. An unambiguous single ingredient may satisfy
 * the existing completeness check.
 */
export function resolveGovernedOriginsDisclosure(
  product: Product,
  open: OpenPillarResult,
  facts: GovernedOriginFact[] | undefined
): OriginsDisclosureResolution {
  const scoringFacts = scoringOriginFacts(facts);
  if (scoringFacts.length === 0) return { resolved: false };

  const countries = [...new Set(scoringFacts.flatMap(recognizedCountries))];
  if (countries.length !== 1) return { resolved: false };

  if (
    scoringFacts.some(
      (fact) => fact.percentage != null && fact.percentageQualifier == null && fact.percentage !== 100
    )
  ) {
    return { resolved: false };
  }

  const ingredients = resolveOpenV15ScoringIngredients(product);
  const tokens = ingredients.usable ? ingredientTokensForOriginsGate(ingredients.scoringText) : [];
  const single = ingredients.usable
    ? singleIngredientEvidentlyCompleteEligible(ingredients.scoringText, open.details.governedFlagCount)
    : { eligible: false };

  const pinned = scoringFacts.filter(
    (fact) =>
      fact.percentage != null &&
      (fact.percentageQualifier === 'exactly' ||
        fact.percentageQualifier === 'at_least' ||
        (fact.percentage === 100 && fact.percentageQualifier == null))
  );
  if (pinned.length === 1 && pinned[0].percentage != null) {
    if (pinned[0].percentage === 100) return { resolved: true, requirement: 'evidently_complete' };
    if (exactPercentageInExistingBand(pinned[0].percentage)) {
      return { resolved: true, requirement: 'stated_percentage_band' };
    }
  }

  const ingredientOrigins = scoringFacts.filter((fact) => fact.claimType === 'ingredient_origin');
  const placeOrigins = scoringFacts.filter(
    (fact) => fact.claimType === 'grown_in' || fact.claimType === 'produced_in'
  );

  const ingredientMatch = subjectMatchesSingleIngredient(ingredientOrigins, tokens, single.eligible);
  const placeMatch = placeMatchesSoleIngredient(placeOrigins, tokens, single.eligible);
  const ingredientFact = ingredientOrigins.length === 1 ? ingredientOrigins[0] : undefined;
  const placeFact = placeOrigins.length === 1 ? placeOrigins[0] : undefined;

  if (
    ingredientMatch &&
    ingredientFact &&
    (ingredientFact.percentage == null ||
      (ingredientFact.percentage === 100 &&
        (ingredientFact.percentageQualifier == null ||
          ingredientFact.percentageQualifier === 'exactly' ||
          ingredientFact.percentageQualifier === 'at_least')))
  ) {
    return { resolved: true, requirement: 'evidently_complete' };
  }

  if (
    placeMatch &&
    placeFact &&
    placeOrigins.length === scoringFacts.length &&
    (placeFact.percentage == null ||
      (placeFact.percentage === 100 &&
        (placeFact.percentageQualifier == null ||
          placeFact.percentageQualifier === 'exactly' ||
          placeFact.percentageQualifier === 'at_least')))
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
  if (
    ingredientStatement &&
    (ingredientQualified || (ingredientUnquantified && !single.eligible))
  ) {
    return { resolved: true, requirement: 'qualified_partial' };
  }

  const placeQualified = placeOrigins.some(isQualifiedQualifier);
  const placeStatement = placeOrigins.some((row) => !!row.exactWording?.trim());
  if (placeStatement && placeQualified) {
    return { resolved: true, requirement: 'qualified_partial' };
  }

  return { resolved: false };
}

/**
 * Maps prevailing governed packet origins into an existing Open v15 adjustment.
 * Bare manufacturing and packing statements are not inputs. Points stay on the registry.
 */
export function governedOriginsOpenAssessment(
  product: Product,
  governedFlagCount: number
): { id: OpenV15AdjustmentId; detail: string } | null {
  const resolution = resolveGovernedOriginsDisclosure(
    product,
    { details: { governedFlagCount } } as OpenPillarResult,
    product.rveelGovernedOrigins
  );
  if (!resolution.resolved) return null;
  if (resolution.requirement === 'evidently_complete') {
    return {
      id: 'open-v15-origins-evidently-complete',
      detail: 'Prevailing origins disclosure is evidently complete',
    };
  }
  if (resolution.requirement === 'qualified_partial') {
    return {
      id: 'open-v15-origins-qualified-partial',
      detail: 'Governed packet disclosure has provenance without a quantitative percentage',
    };
  }
  const percentage = scoringOriginFacts(product.rveelGovernedOrigins).find(
    (fact) =>
      fact.percentage != null &&
      (fact.percentageQualifier === 'exactly' || fact.percentageQualifier === 'at_least')
  )?.percentage;
  if (percentage == null) return null;
  if (percentage >= 95 && percentage <= 99) {
    return { id: 'open-v15-origins-pct-95-99', detail: `Governed packet disclosure accounts for ${percentage}%` };
  }
  if (percentage >= 76 && percentage <= 94) {
    return { id: 'open-v15-origins-pct-76-94', detail: `Governed packet disclosure accounts for ${percentage}%` };
  }
  if (percentage >= 50 && percentage <= 75) {
    return { id: 'open-v15-origins-pct-50-75', detail: `Governed packet disclosure accounts for ${percentage}%` };
  }
  if (percentage >= 25 && percentage <= 49) {
    return { id: 'open-v15-origins-pct-25-49', detail: `Governed packet disclosure accounts for ${percentage}%` };
  }
  if (percentage >= 1 && percentage <= 24) {
    return { id: 'open-v15-origins-pct-1-24', detail: `Governed packet disclosure accounts for ${percentage}%` };
  }
  return null;
}

function scoringOriginFacts(facts: GovernedOriginFact[] | undefined): GovernedOriginFact[] {
  return [
    ...(facts || []).filter((fact) => DISCLOSURE_CLAIM_TYPES.has(fact.claimType)),
    ...(facts || []).map(explicitIngredientOriginFromMadeIn).filter((fact): fact is GovernedOriginFact => !!fact),
  ];
}
