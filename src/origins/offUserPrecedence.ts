/**
 * Admitted 4A.3 facts prevail over OFF origin data for the same subject.
 * OFF fields stay on the product. Later admission for the same contribution subject is unchanged.
 */

import type { Product } from '../types/product';
import { COUNTRIES } from '../utils/countries';
import {
  getStructuredOffOriginTags,
  ingredientTokensForOriginsGate,
  isRecognizedOriginCountry,
  originCountryKey,
} from '../lib/truscoreEngine/pillars/openPillarOriginsV15';
import { resolveOpenV15ScoringIngredients } from '../lib/truscoreEngine/pillars/openPillarIngredientsLanguage';
import { ingredientComparisonKey } from '../contributions/originStructured';
import type { GovernedOriginFact } from './governedFacts';
import { explicitIngredientOriginFromMadeIn, governedOriginsOpenAssessment } from './disclosureReceiver';

function recognizedKeys(countries: string[]): string[] {
  return [...new Set(countries.filter((country) => isRecognizedOriginCountry(country)).map((country) => originCountryKey(country)))];
}

function sameCountry(left: string, right: string): boolean {
  return originCountryKey(left) === originCountryKey(right);
}

function offIngredientOriginKeys(product: Product): string[] {
  const tags = getStructuredOffOriginTags(product);
  if (tags.length > 0) return [...new Set(tags.map((tag) => originCountryKey(tag)))];
  if (typeof product.origins === 'string' && isRecognizedOriginCountry(product.origins)) {
    return [originCountryKey(product.origins)];
  }
  return [];
}

function singleIngredientKey(product: Product): string | null {
  const ingredients = resolveOpenV15ScoringIngredients(product);
  if (!ingredients.usable) return null;
  const tokens = ingredientTokensForOriginsGate(ingredients.scoringText);
  if (tokens.length !== 1) return null;
  return ingredientComparisonKey(tokens[0]);
}

/** Ingredient-origin facts for the same ingredient OFF origin data describes. */
export function ingredientOriginsForOffSubject(
  product: Product,
  facts: GovernedOriginFact[] | undefined
): GovernedOriginFact[] {
  const subject = singleIngredientKey(product);
  if (!subject) return [];
  const direct = (facts || []).filter(
    (fact) =>
      fact.claimType === 'ingredient_origin' &&
      ingredientComparisonKey(fact.ingredientSubject) === subject
  );
  const derived = (facts || [])
    .map(explicitIngredientOriginFromMadeIn)
    .filter((fact): fact is GovernedOriginFact => fact != null)
    .filter((fact) => {
      const named = ingredientComparisonKey(fact.ingredientSubject);
      return named.length === 0 || named === subject;
    });
  return [...direct, ...derived];
}

function placeFactsForOffSubject(
  product: Product,
  facts: GovernedOriginFact[] | undefined
): GovernedOriginFact[] {
  const subject = singleIngredientKey(product);
  if (!subject) return [];
  return (facts || []).filter((fact) => {
    if (fact.claimType !== 'grown_in' && fact.claimType !== 'produced_in') return false;
    const named = ingredientComparisonKey(fact.ingredientSubject);
    return named.length === 0 || named === subject;
  });
}

/**
 * True when a later admitted scoring proposition applies to the same sole-ingredient
 * subject as OFF origins. Country agreement is not required. A bare made_in,
 * packed_in, mismatched subject, or proposition the resolver does not score does not prevail.
 */
function admittedScoringPropositionSupersedesOff(
  product: Product,
  facts: GovernedOriginFact[] | undefined,
  governedFlagCount: number
): boolean {
  if (offIngredientOriginKeys(product).length === 0 || !singleIngredientKey(product)) return false;
  const owned = [
    ...ingredientOriginsForOffSubject(product, facts),
    ...placeFactsForOffSubject(product, facts),
  ];
  if (owned.length === 0) return false;
  return (
    governedOriginsOpenAssessment({ ...product, rveelGovernedOrigins: facts }, governedFlagCount) != null
  );
}

/**
 * Same-subject Origins precedence. An applicable admitted scoring proposition
 * supersedes OFF origins for that subject whether or not the country values differ.
 */
export function admittedScoringOriginConflictsWithOff(
  product: Product,
  facts: GovernedOriginFact[] | undefined,
  governedFlagCount = 0
): boolean {
  return admittedScoringPropositionSupersedesOff(product, facts, governedFlagCount);
}

/**
 * True when an admitted ingredient-origin proposition for the sole ingredient
 * is the prevailing scoring evidence. Country disagreement is not required.
 */
export function admittedIngredientOriginConflictsWithOff(
  product: Product,
  facts: GovernedOriginFact[] | undefined,
  governedFlagCount = 0
): boolean {
  if (offIngredientOriginKeys(product).length === 0) return false;
  if (ingredientOriginsForOffSubject(product, facts).length === 0) return false;
  return admittedScoringPropositionSupersedesOff(product, facts, governedFlagCount);
}

type DisplayedOffOrigin =
  | { kind: 'manufacturing'; country: string }
  | { kind: 'ingredient_origin'; country: string };

function displayedOffOrigin(product: Product): DisplayedOffOrigin | null {
  const manufacturingTag = product.manufacturing_places_tags?.find((tag) => typeof tag === 'string' && tag.trim());
  if (manufacturingTag && isRecognizedOriginCountry(manufacturingTag)) {
    return { kind: 'manufacturing', country: manufacturingTag };
  }
  if (typeof product.manufacturing_places === 'string' && isRecognizedOriginCountry(product.manufacturing_places)) {
    return { kind: 'manufacturing', country: product.manufacturing_places };
  }
  const originTag = product.origins_tags?.find((tag) => typeof tag === 'string' && isRecognizedOriginCountry(tag));
  if (originTag) return { kind: 'ingredient_origin', country: originTag };
  if (typeof product.origins === 'string' && isRecognizedOriginCountry(product.origins)) {
    return { kind: 'ingredient_origin', country: product.origins };
  }
  return null;
}

/** Recognised OFF tag or place, written as the existing country name. Unrecognised values stay out. */
function recognisedOffCountryDisplayName(value: string): string | null {
  if (!isRecognizedOriginCountry(value)) return null;
  const key = originCountryKey(value);
  return COUNTRIES.find((country) => originCountryKey(country.name) === key)?.name ?? null;
}

/** OFF country shown on Product Origins when prevailing governed evidence has not displaced it. */
export function offOriginCountryForDisplay(
  product: Product,
  facts: GovernedOriginFact[] | undefined
): string | null {
  if (admittedUserOriginPrevailsForDisplay(product, facts)) return null;
  const country = displayedOffOrigin(product)?.country;
  if (!country) return null;
  return recognisedOffCountryDisplayName(country);
}

/** Card should omit the conflicting OFF country. The product fields are left intact. */
export function admittedUserOriginPrevailsForDisplay(
  product: Product,
  facts: GovernedOriginFact[] | undefined
): boolean {
  const displayed = displayedOffOrigin(product);
  if (!displayed) return false;
  if (displayed.kind === 'manufacturing') {
    const made = (facts || []).filter((fact) => fact.claimType === 'made_in');
    const keys = [...new Set(made.flatMap((fact) => recognizedKeys(fact.countries)))];
    if (keys.length !== 1) return false;
    return !sameCountry(keys[0], displayed.country);
  }
  return admittedIngredientOriginConflictsWithOff(product, facts);
}
