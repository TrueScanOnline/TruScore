/**
 * Result display projection. Scoring continues to use the eligibility clone.
 * These fields are not written back as source product data.
 */

import type { ContributionEvidence } from '../contributions/types';
import { evidenceKeyOf, selectPrevailingAdmittedEvidence } from '../contributions/admissionContract';
import type { OriginPercentageQualifier } from '../config/contributionPolicy';
import type { OriginQualification } from '../contributions/originStructured';
import { NUTRITION_FIELDS, type NutritionAttribute, type NutritionBasis, type StatedNutritionAmount } from '../ingredientsNutrition/nutritionSchema';
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

export type NutritionSourcePrefill = {
  basis: NutritionBasis;
  amounts: Partial<Record<NutritionAttribute, string>>;
  sodiumUnit: 'mg' | 'g';
};

function nutritionBasisFromPer(nutritionDataPer: string | undefined): NutritionBasis {
  const per = (nutritionDataPer || '100g').toLowerCase();
  if (per.includes('serving')) return 'per_serving';
  if (per.includes('ml')) return 'per_100ml';
  return 'per_100g';
}

function nutritionSuffix(basis: NutritionBasis): '100g' | '100ml' | 'serving' {
  if (basis === 'per_serving') return 'serving';
  if (basis === 'per_100ml') return '100ml';
  return '100g';
}

/**
 * Prefill from the source basis. Per 100 g reads `_100g` values.
 * OFF sodium is grams, so the prefilled unit is g.
 */
export function nutritionPrefillFromSource(
  nutriments: Record<string, unknown> | undefined,
  nutritionDataPer?: string
): NutritionSourcePrefill {
  const basis = nutritionBasisFromPer(nutritionDataPer);
  const suffix = nutritionSuffix(basis);
  const amounts: Partial<Record<NutritionAttribute, string>> = {};
  if (nutriments) {
    for (const field of NUTRITION_FIELDS) {
      const raw = nutriments[`${field.offNutrient}_${suffix}`];
      if (typeof raw !== 'number' || !Number.isFinite(raw)) continue;
      amounts[field.attribute] = String(raw);
    }
  }
  return {
    basis,
    amounts,
    sodiumUnit: amounts.sodium != null ? 'g' : 'mg',
  };
}

function sodiumGrams(value: string | undefined, unit: 'mg' | 'g'): number | null {
  const parsed = Number((value || '').trim());
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return unit === 'mg' ? parsed / 1000 : parsed;
}

/** Changed nutrients only. Unedited source prefill does not become contribution evidence. */
export function nutritionAmountsToSubmit(
  current: NutritionSourcePrefill,
  baseline: NutritionSourcePrefill,
  edited: NutritionAttribute[]
): StatedNutritionAmount[] {
  if (!current.basis) return [];
  const editedSet = new Set(edited);
  const stated: StatedNutritionAmount[] = [];
  for (const field of NUTRITION_FIELDS) {
    if (!editedSet.has(field.attribute)) continue;
    const raw = (current.amounts[field.attribute] || '').trim();
    if (!raw) continue;
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) continue;
    const unit = field.attribute === 'sodium' ? current.sodiumUnit : field.acceptedUnits[0];
    if (current.basis === baseline.basis) {
      if (field.attribute === 'sodium') {
        const next = sodiumGrams(raw, current.sodiumUnit);
        const previous = sodiumGrams(baseline.amounts.sodium, baseline.sodiumUnit);
        if (next != null && previous != null && next === previous) continue;
      } else if (raw === (baseline.amounts[field.attribute] || '').trim()) {
        continue;
      }
    }
    stated.push({ attribute: field.attribute, value, unit });
  }
  return stated;
}

export type OriginContributionDraft = {
  evidenceId?: string;
  claimType: ProductOriginsClaimType;
  wording: string;
  place: string;
  ingredient: string;
  percentage: string;
  qualifier?: OriginPercentageQualifier;
  qualification?: OriginQualification;
  intent?: 'new' | 'edited';
  baseline?: string;
};

const CONSUMER_ORIGIN_TYPES = new Set<string>(PRODUCT_ORIGINS_CLAIM_TYPES);

export function originDraftSignature(row: OriginContributionDraft): string {
  return JSON.stringify({
    claimType: row.claimType,
    wording: row.wording.trim(),
    place: row.place.trim(),
    ingredient: row.ingredient.trim(),
    percentage: row.percentage.trim(),
    qualifier: row.qualifier || '',
    qualification: row.qualification || '',
  });
}

export function originDraftsFromGovernedFacts(
  facts: GovernedOriginFact[] | undefined
): OriginContributionDraft[] {
  return (facts || [])
    .filter((fact) => CONSUMER_ORIGIN_TYPES.has(fact.claimType))
    .map((fact) => {
      const row: OriginContributionDraft = {
        evidenceId: fact.evidenceId,
        claimType: fact.claimType as ProductOriginsClaimType,
        wording: fact.exactWording || '',
        place: fact.countries.join(', '),
        ingredient: fact.ingredientSubject || '',
        percentage: fact.percentage != null ? String(fact.percentage) : '',
        qualifier: fact.percentageQualifier,
        qualification: fact.originQualification,
      };
      return { ...row, baseline: originDraftSignature(row) };
    });
}

/** New rows, and existing rows only after the consumer changes them. */
export function originRowsToSubmit(rows: OriginContributionDraft[]): OriginContributionDraft[] {
  return rows.filter((row) => {
    const wording = row.wording.trim();
    const place = row.place.trim();
    if (!wording || !place) return false;
    if (row.claimType === 'ingredient_origin' && !row.ingredient.trim()) return false;
    if (row.intent === 'edited') return originDraftSignature(row) !== row.baseline;
    return row.intent !== undefined ? row.intent === 'new' : !row.evidenceId;
  });
}

export type SubmittedObservation = { unitId: string; label: string };

/** Admitted units stay acknowledged. Refused observations stay available for a later submission. */
export function retainedAfterPartialAdmission<T extends SubmittedObservation>(
  created: T[],
  admittedUnitIds: string[]
): { complete: boolean; admitted: T[]; refused: T[] } {
  const admittedIds = new Set(admittedUnitIds);
  const admitted = created.filter((row) => admittedIds.has(row.unitId));
  const refused = created.filter((row) => !admittedIds.has(row.unitId));
  return {
    complete: created.length > 0 && refused.length === 0,
    admitted,
    refused,
  };
}
