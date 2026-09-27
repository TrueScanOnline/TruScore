/**
 * Transparency Origins Disclosure receiver.
 * Open scoring and origins_tags stay unchanged. An admitted ingredient-origin fact
 * can resolve the existing lane only when it meets that lane's current requirements.
 */

import type { Product } from '../types/product';
import type { OpenPillarResult } from '../lib/truscoreEngine/pillars/openPillar';
import {
  freeTextOriginsConsistentWithStructuredTag,
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

/**
 * Fail closed unless the admitted facts establish ingredient-origin disclosure
 * the existing lane already accepts: single-ingredient complete, an exact
 * completeness percentage in a registered band, or a qualified/unquantified
 * partial statement. Manufacture, pack, grow, and produce claims do not.
 */
export function resolveGovernedOriginsDisclosure(
  product: Product,
  open: OpenPillarResult,
  facts: GovernedOriginFact[] | undefined
): OriginsDisclosureResolution {
  const ingredientOrigins = (facts || []).filter((fact) => fact.claimType === 'ingredient_origin');
  if (ingredientOrigins.length === 0) return { resolved: false };

  const countries = [...new Set(ingredientOrigins.flatMap(recognizedCountries))];
  if (countries.length !== 1) return { resolved: false };

  if (
    ingredientOrigins.some(
      (fact) => fact.percentage != null && fact.percentageQualifier == null
    )
  ) {
    return { resolved: false };
  }

  const ingredients = resolveOpenV15ScoringIngredients(product);
  const tokens = ingredients.usable ? ingredientTokensForOriginsGate(ingredients.scoringText) : [];
  const single = ingredients.usable
    ? singleIngredientEvidentlyCompleteEligible(ingredients.scoringText, open.details.governedFlagCount)
    : { eligible: false };
  const country = countries[0];
  const freeTextAgrees = freeTextOriginsConsistentWithStructuredTag(product, country);
  const subjectMatchesSingle =
    single.eligible &&
    tokens.length === 1 &&
    ingredientOrigins.length === 1 &&
    ingredientSubjectKey(ingredientOrigins[0].ingredientSubject) === ingredientSubjectKey(tokens[0]);

  if (!freeTextAgrees) return { resolved: false };

  const fact = ingredientOrigins.length === 1 ? ingredientOrigins[0] : undefined;
  if (subjectMatchesSingle && fact && (fact.percentage == null || (fact.percentageQualifier === 'exactly' && fact.percentage === 100))) {
    return { resolved: true, requirement: 'evidently_complete' };
  }

  if (
    subjectMatchesSingle &&
    fact &&
    fact.percentageQualifier === 'exactly' &&
    fact.percentage != null &&
    exactPercentageInExistingBand(fact.percentage)
  ) {
    return { resolved: true, requirement: 'stated_percentage_band' };
  }

  const qualified = ingredientOrigins.some(
    (row) =>
      row.percentageQualifier === 'at_least' ||
      row.percentageQualifier === 'more_than' ||
      row.percentageQualifier === 'less_than'
  );
  const unquantifiedPartial = ingredientOrigins.every((row) => row.percentage == null);
  const hasStatement = ingredientOrigins.some((row) => !!row.exactWording?.trim());
  if (hasStatement && (qualified || (unquantifiedPartial && !single.eligible))) {
    return { resolved: true, requirement: 'qualified_partial' };
  }

  return { resolved: false };
}
