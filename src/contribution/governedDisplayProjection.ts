/**
 * Result display projection. Scoring continues to use the eligibility clone.
 * These fields are not written back as source product data.
 */

import type { Product } from '../types/product';
import { resultContributionActions } from './resultContributionActions';
import type { ContributionEvidence } from '../contributions/types';
import { evidenceKeyOf, selectPrevailingAdmittedEvidence, canApplyToProductionReceiver } from '../contributions/admissionContract';
import type { OriginPercentageQualifier } from '../config/contributionPolicy';
import type { OriginQualification } from '../contributions/originStructured';
import { NUTRITION_FIELDS, nutritionField, offNutrientValue, type NutritionAttribute, type NutritionBasis, type StatedNutritionAmount } from '../ingredientsNutrition/nutritionSchema';
import type { ProductNutriments } from '../types/product';
import type { GovernedOriginFact, ProductOriginsClaimType } from '../origins/governedFacts';
import { PRODUCT_ORIGINS_CLAIM_TYPES } from '../origins/governedFacts';

export const NUTRITION_CONTRIBUTION_BASES: { basis: NutritionBasis; label: string }[] = [
  { basis: 'per_100g', label: 'Per 100 g' },
];

const PROJECTION_FIELDS = [
  'rveelGovernedIngredientsText',
  'rveelGovernedNutrimentKeys',
  'rveelGovernedOrigins',
  'rveelGovernedCertifications',
  'rveelGovernedPacketClaims',
  'rveelPacketAbsenceEstablished',
  'rveelPacketNutritionStatus',
  'rveelSourceNutriments',
  'rveelSourceIngredientsText',
  'rveelSourceNutritionDataPer',
  'rveelProjectionBound',
] as const;

/**
 * Source product state. A previously calculated Result drops its governed overlay
 * and returns the nutriments and ingredients that came from the product source.
 */
export function sourceProductState<T extends Product>(product: T): T {
  const next = { ...product };
  if (product.rveelProjectionBound) {
    next.nutriments = product.rveelSourceNutriments;
    next.ingredients_text = product.rveelSourceIngredientsText;
    next.nutrition_data_per = product.rveelSourceNutritionDataPer;
  }
  for (const key of PROJECTION_FIELDS) {
    delete next[key];
  }
  return next;
}

export function projectAdmittedIngredientsDisplay(
  sourceText: string | undefined,
  admittedText: string | undefined
): { ingredients_text?: string; rveelGovernedIngredientsText?: string } {
  const source = sourceText?.trim();
  const admitted = admittedText?.trim();
  if (!admitted) return { ingredients_text: sourceText };
  return {
    ...(source ? { ingredients_text: sourceText } : {}),
    rveelGovernedIngredientsText: admitted,
  };
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

/**
 * Contribution prefill is Per 100 g. Source Per serving values are left on the product
 * and are not converted into this form.
 */
export function nutritionPrefillFromSource(
  nutriments: Record<string, unknown> | undefined,
  _nutritionDataPer?: string
): NutritionSourcePrefill {
  const amounts: Partial<Record<NutritionAttribute, string>> = {};
  if (nutriments) {
    for (const field of NUTRITION_FIELDS) {
      const raw = nutriments[`${field.offNutrient}_100g`];
      if (typeof raw !== 'number' || !Number.isFinite(raw)) continue;
      if (field.attribute === 'sodium') {
        amounts.sodium = formatGovernedNutrientInput(raw * 1000, 'mg');
        continue;
      }
      const unit = field.attribute === 'energy-kcal' || field.attribute === 'energy-kj' ? 'kcal' : 'g';
      amounts[field.attribute] = formatGovernedNutrientInput(raw, unit);
    }
  }
  return {
    basis: 'per_100g',
    amounts,
    sodiumUnit: 'mg',
  };
}

/** Consumer-readable nutrient text. Assessment continues to use the stored governed number. */
export function formatConsumerNutrient(value: number, unit: 'g' | 'mg' | 'kcal'): string {
  if (!Number.isFinite(value)) return '';
  if (unit === 'mg' || unit === 'kcal') {
    const nearest = Math.round(value);
    if (Math.abs(value - nearest) < 0.05) return String(nearest);
    return String(Math.round(value * 10) / 10);
  }
  return String(Math.round(value * 100) / 100);
}

/** Stable consumer text for a nutrient input and its unchanged-value baseline. */
export function formatGovernedNutrientInput(value: number, unit: 'g' | 'mg' | 'kcal' = 'g'): string {
  return formatConsumerNutrient(value, unit);
}

function sameStableNutrient(current: string | undefined, baseline: string | undefined): boolean {
  if ((current || '').trim() === (baseline || '').trim()) return true;
  const next = Number((current || '').trim());
  const previous = Number((baseline || '').trim());
  if (!Number.isFinite(next) || !Number.isFinite(previous)) return false;
  return stableNutrientNumber(next) === stableNutrientNumber(previous);
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
        if (next != null && previous != null && stableNutrientNumber(next) === stableNutrientNumber(previous)) continue;
      } else if (sameStableNutrient(raw, baseline.amounts[field.attribute])) {
        continue;
      }
    }
    stated.push({ attribute: field.attribute, value, unit });
  }
  return stated;
}

export type OriginContributionDraft = {
  evidenceId?: string;
  /** Null until the consumer chooses a governed type. A new row does not preselect one. */
  claimType: ProductOriginsClaimType | null;
  wording: string;
  place: string;
  ingredient: string;
  percentage: string;
  qualifier?: OriginPercentageQualifier;
  qualification?: OriginQualification;
  local?: boolean;
  imported?: boolean;
  multiple?: boolean;
  percentageNotStated?: boolean;
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
    local: row.local === true,
    imported: row.imported === true,
    multiple: row.multiple === true,
    percentageNotStated: row.percentageNotStated === true,
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
        local: fact.originQualification === 'local' || fact.originQualifications?.includes('local') === true,
        imported: fact.originQualification === 'imported' || fact.originQualifications?.includes('imported') === true,
        multiple: fact.originQualification === 'multiple',
        percentageNotStated: fact.percentage == null,
      };
      return { ...row, baseline: originDraftSignature(row) };
    });
}

/** New rows, and existing rows only after the consumer changes them. An unselected claim type cannot submit. */
export function originRowsToSubmit(
  rows: OriginContributionDraft[]
): Array<OriginContributionDraft & { claimType: ProductOriginsClaimType }> {
  return rows.filter((row): row is OriginContributionDraft & { claimType: ProductOriginsClaimType } => {
    if (!row.claimType || !CONSUMER_ORIGIN_TYPES.has(row.claimType)) return false;
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

/**
 * True when Ingredient Clarity still needs its own Data Limitations action
 * beside another Transparency route, such as unresolved Origins.
 * A Transparency route that is already the ingredients journey does not need a second row.
 */
export function transparencyShowsSeparateAddIngredients(product: Product): boolean {
  if (!resultContributionActions(product).addIngredients) return false;
  const opportunity = product._publication?.transparency.s26?.contributionOpportunity;
  const alreadyTheIngredientsRoute =
    opportunity?.material === true &&
    opportunity.routeStatus === 'live' &&
    opportunity.routeKey === 'ingredients_nutrition';
  return !alreadyTheIngredientsRoute;
}

/** Body Data Limitations buttons. Reads the Result contribution actions and adds no assessment rule. */
export function bodyDataLimitationActions(product: Product): Array<{
  label: 'Add nutrition' | 'Add ingredients';
  destination: 'nutrition' | 'ingredients';
}> {
  const actions = resultContributionActions(product);
  const rows: Array<{
    label: 'Add nutrition' | 'Add ingredients';
    destination: 'nutrition' | 'ingredients';
  }> = [];
  if (actions.addNutrition) rows.push({ label: 'Add nutrition', destination: 'nutrition' });
  if (actions.addIngredients) rows.push({ label: 'Add ingredients', destination: 'ingredients' });
  return rows;
}

/** Removes binary float noise such as 5.69999980926514 without a new conversion rule. */
export function stableNutrientNumber(value: number): number {
  if (!Number.isFinite(value)) return value;
  return Math.round(value * 1e6) / 1e6;
}

function nutritionKeySuffix(basis: NutritionBasis): '100g' | '100ml' | 'serving' {
  if (basis === 'per_serving') return 'serving';
  if (basis === 'per_100ml') return '100ml';
  return '100g';
}

export function selectPrevailingGovernedIngredientsText(
  evidence: ContributionEvidence[]
): string | undefined {
  let chosen: ContributionEvidence | null = null;
  const seen = new Set<string>();
  for (const candidate of evidence) {
    if (candidate.domain !== 'ingredients_nutrition') continue;
    const key = evidenceKeyOf(candidate);
    if (seen.has(key)) continue;
    seen.add(key);
    const prevailing = selectPrevailingAdmittedEvidence(evidence, {
      barcode: candidate.barcode,
      domain: 'ingredients_nutrition',
      claimKey: candidate.claimKey,
      variantKey: candidate.variantKey,
    });
    if (!prevailing || !canApplyToProductionReceiver(prevailing, 'body_ingredients_nutrition')) continue;
    const text = prevailing.ingredientsNutrition?.ingredientsText?.trim();
    if (!text) continue;
    if (!chosen || prevailing.evidenceVersion > chosen.evidenceVersion) chosen = prevailing;
  }
  return chosen?.ingredientsNutrition?.ingredientsText?.trim() || undefined;
}

/**
 * Overlay prevailing admitted nutrients onto a copy of the source panel.
 * Source nutriments are not mutated. Keys listed in governedKeys are Rveel values.
 */
export function projectGovernedNutriments(
  source: ProductNutriments | undefined,
  evidence: ContributionEvidence[]
): { nutriments: ProductNutriments | undefined; nutritionDataPer?: string; governedKeys: string[] } {
  const seen = new Set<string>();
  const amounts: Array<StatedNutritionAmount & { basis: NutritionBasis }> = [];
  for (const candidate of evidence) {
    if (candidate.domain !== 'ingredients_nutrition') continue;
    const key = evidenceKeyOf(candidate);
    if (seen.has(key)) continue;
    seen.add(key);
    const prevailing = selectPrevailingAdmittedEvidence(evidence, {
      barcode: candidate.barcode,
      domain: 'ingredients_nutrition',
      claimKey: candidate.claimKey,
      variantKey: candidate.variantKey,
    });
    if (!prevailing || !canApplyToProductionReceiver(prevailing, 'body_ingredients_nutrition')) continue;
    const basis = prevailing.ingredientsNutrition?.nutritionBasis;
    if (basis !== 'per_100g' && basis !== 'per_100ml' && basis !== 'per_serving') continue;
    for (const amount of prevailing.ingredientsNutrition?.nutriments || []) {
      amounts.push({ ...amount, basis });
    }
  }
  if (amounts.length === 0) {
    return { nutriments: source, nutritionDataPer: undefined, governedKeys: [] };
  }
  const nutriments: ProductNutriments = { ...(source || {}) };
  const governedKeys: string[] = [];
  const bases = new Set<NutritionBasis>();
  for (const amount of amounts) {
    const written = offNutrientValue(amount);
    if (written === undefined) continue;
    const numeric = stableNutrientNumber(Number(written));
    if (!Number.isFinite(numeric)) continue;
    const suffix = nutritionKeySuffix(amount.basis);
    const field = nutritionField(amount.attribute);
    const key = `${field.offNutrient}_${suffix}`;
    nutriments[key] = numeric;
    governedKeys.push(key);
    bases.add(amount.basis);
  }
  const nutritionDataPer =
    bases.size === 1 && bases.has('per_100g')
      ? '100g'
      : bases.size === 1 && bases.has('per_100ml')
        ? '100ml'
        : bases.size === 1 && bases.has('per_serving')
          ? 'serving'
          : undefined;
  return { nutriments, nutritionDataPer, governedKeys };
}
