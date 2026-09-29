/**
 * Result display projection. Scoring continues to use the eligibility clone.
 * These fields are not written back as source product data.
 */

import type { ContributionEvidence } from '../contributions/types';
import { evidenceKeyOf, selectPrevailingAdmittedEvidence } from '../contributions/admissionContract';
import type { OriginPercentageQualifier } from '../config/contributionPolicy';
import type { OriginQualification } from '../contributions/originStructured';
import { NUTRITION_FIELDS, type NutritionAttribute } from '../ingredientsNutrition/nutritionSchema';
import type { GovernedOriginFact, ProductOriginsClaimType } from '../origins/governedFacts';
import { PRODUCT_ORIGINS_CLAIM_TYPES } from '../origins/governedFacts';

export function projectAdmittedIngredientsDisplay(
  sourceText: string | undefined,
  admittedText: string | undefined
): { ingredients_text?: string; rveelGovernedIngredientsText?: string } {
  const source = sourceText?.trim();
  if (source) return { ingredients_text: sourceText };
  const admitted = admittedText?.trim();
  if (!admitted) return { ingredients_text: sourceText };
  return { rveelGovernedIngredientsText: admitted };
}

export function projectGovernedCertificationNames(records: ContributionEvidence[]): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const candidate of records) {
    if (candidate.domain !== 'certifications') continue;
    const key = evidenceKeyOf(candidate);
    if (seen.has(key)) continue;
    seen.add(key);
    const prevailing = selectPrevailingAdmittedEvidence(records, {
      barcode: candidate.barcode,
      domain: 'certifications',
      claimKey: candidate.claimKey,
      variantKey: candidate.variantKey,
    });
    const name = prevailing?.exactWording?.trim() || prevailing?.claimValue?.trim();
    if (name) names.push(name);
  }
  return names;
}

export function nutritionAmountsFromExisting(
  nutriments: Record<string, unknown> | undefined
): Partial<Record<NutritionAttribute, string>> {
  if (!nutriments) return {};
  const amounts: Partial<Record<NutritionAttribute, string>> = {};
  for (const field of NUTRITION_FIELDS) {
    const raw = nutriments[field.offNutrient] ?? nutriments[`${field.offNutrient}_100g`];
    if (typeof raw === 'number' && Number.isFinite(raw)) amounts[field.attribute] = String(raw);
  }
  return amounts;
}

export type OriginContributionDraft = {
  claimType: ProductOriginsClaimType;
  wording: string;
  place: string;
  ingredient: string;
  percentage: string;
  qualifier?: OriginPercentageQualifier;
  qualification?: OriginQualification;
};

const CONSUMER_ORIGIN_TYPES = new Set<string>(PRODUCT_ORIGINS_CLAIM_TYPES);

export function originDraftsFromGovernedFacts(
  facts: GovernedOriginFact[] | undefined
): OriginContributionDraft[] {
  return (facts || [])
    .filter((fact) => CONSUMER_ORIGIN_TYPES.has(fact.claimType))
    .map((fact) => ({
      claimType: fact.claimType as ProductOriginsClaimType,
      wording: fact.exactWording || '',
      place: fact.countries.join(', '),
      ingredient: fact.ingredientSubject || '',
      percentage: fact.percentage != null ? String(fact.percentage) : '',
      qualifier: fact.percentageQualifier,
      qualification: fact.originQualification,
    }));
}

/** Full success only when every reviewed unit in this submission was admitted. */
export function admissionCompletedEveryReviewedUnit(
  createdUnitIds: string[],
  admittedUnitIds: string[]
): boolean {
  return createdUnitIds.length > 0 && createdUnitIds.every((id) => admittedUnitIds.includes(id));
}
