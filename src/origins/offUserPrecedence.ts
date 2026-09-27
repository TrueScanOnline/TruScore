/**
 * Admitted 4A.3 facts prevail over OFF origin data for the same subject.
 * OFF fields stay on the product. Later admission for the same contribution subject is unchanged.
 */

import type { Product } from '../types/product';
import {
  getStructuredOffOriginTags,
  ingredientTokensForOriginsGate,
  isRecognizedOriginCountry,
  originCountryKey,
} from '../lib/truscoreEngine/pillars/openPillarOriginsV15';
import { resolveOpenV15ScoringIngredients } from '../lib/truscoreEngine/pillars/openPillarIngredientsLanguage';
import { ingredientSubjectKey } from '../contributions/originStructured';
import type { GovernedOriginFact } from './governedFacts';

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
  return ingredientSubjectKey(tokens[0]);
}

/** Ingredient-origin facts for the same ingredient OFF origin data describes. */
export function ingredientOriginsForOffSubject(
  product: Product,
  facts: GovernedOriginFact[] | undefined
): GovernedOriginFact[] {
  const subject = singleIngredientKey(product);
  if (!subject) return [];
  return (facts || []).filter(
    (fact) =>
      fact.claimType === 'ingredient_origin' &&
      ingredientSubjectKey(fact.ingredientSubject) === subject
  );
}

/**
 * True when an admitted ingredient-origin fact names a different country from OFF
 * origins_tags or free-text origins for that ingredient.
 */
export function admittedIngredientOriginConflictsWithOff(
  product: Product,
  facts: GovernedOriginFact[] | undefined
): boolean {
  const offKeys = offIngredientOriginKeys(product);
  if (offKeys.length === 0) return false;
  const admitted = ingredientOriginsForOffSubject(product, facts);
  if (admitted.length === 0) return false;
  const admittedKeys = [...new Set(admitted.flatMap((fact) => recognizedKeys(fact.countries)))];
  if (admittedKeys.length === 0) return false;
  return admittedKeys.length !== offKeys.length || admittedKeys.some((key) => !offKeys.includes(key));
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
