/**
 * A correction submission is the new current state of the subjects on the form.
 * Subjects that were prevailing and are no longer represented cease.
 * Unchanged subjects stay. Added subjects do not remove the others.
 */

import type { OriginStructuredEvidence } from '../contributions/originStructured';
import { capturedOriginQualifications } from '../contributions/originStructured';
import { deriveEvidenceFacts } from '../evidenceAuthority/subjects';
import type { EvidenceFactInput } from '../evidenceAuthority/types';
import {
  NUTRITION_FIELDS,
  type StatedNutritionAmount,
} from '../ingredientsNutrition/nutritionSchema';
import type { NutritionSourcePrefill, OriginContributionDraft } from './governedDisplayProjection';

function keysOf(facts: EvidenceFactInput[]): string[] {
  return [...new Set(deriveEvidenceFacts(facts).facts.map((fact) => fact.subjectKey))];
}

function originFact(row: OriginContributionDraft): EvidenceFactInput | null {
  if (!row.claimType) return null;
  const wording = row.wording.trim();
  const place = row.place.trim();
  if (!place) return null;
  if (row.claimType === 'ingredient_origin' && !row.ingredient.trim()) return null;
  const places = place
    .split(',')
    .map((country) => country.trim())
    .filter((country) => country.length > 0);
  if (places.length === 0) return null;
  const percentage = Number(row.percentage);
  const statedPercentage = row.percentageNotStated !== true && Number.isFinite(percentage) && row.percentage.trim().length > 0;
  const qualifications = capturedOriginQualifications({
    local: row.local === true,
    imported: row.imported === true,
    multiple: false,
  });
  const originStructured: OriginStructuredEvidence = {
    claimType: row.claimType,
    primaryCountry: places[0],
    ...(places.length > 1 ? { countries: places.slice(1) } : {}),
    ...(row.claimType === 'ingredient_origin' ? { ingredientSubject: row.ingredient.trim() } : {}),
    ...(statedPercentage
      ? {
          ingredientOriginPercentage: percentage,
          ...(row.qualifier ? { percentageQualifier: row.qualifier } : {}),
        }
      : {}),
    ...(row.percentageNotStated === true && !statedPercentage ? { percentageNotStated: true } : {}),
    ...qualifications,
  };
  return {
    domain: 'origins',
    ...(wording ? { exactWording: wording } : {}),
    claimValue: places[0],
    originStructured,
  };
}

function nutritionFact(prefill: NutritionSourcePrefill | undefined): EvidenceFactInput | null {
  if (!prefill?.basis) return null;
  const nutriments: StatedNutritionAmount[] = [];
  for (const field of NUTRITION_FIELDS) {
    const raw = (prefill.amounts[field.attribute] || '').trim();
    if (!raw) continue;
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) continue;
    const unit = field.attribute === 'sodium' ? prefill.sodiumUnit : field.acceptedUnits[0];
    nutriments.push({ attribute: field.attribute, value, unit });
  }
  if (nutriments.length === 0) return null;
  return {
    domain: 'ingredients_nutrition',
    nutritionBasis: prefill.basis,
    nutriments,
  };
}

export function ceasedPrevailingSubjectKeys(baseline: EvidenceFactInput[], represented: EvidenceFactInput[]): string[] {
  const kept = new Set(keysOf(represented));
  return keysOf(baseline).filter((key) => !kept.has(key));
}

export function correctionClosureFacts(input: {
  initialIngredients?: string;
  ingredientsText?: string;
  initialNutrition?: NutritionSourcePrefill;
  nutrition?: NutritionSourcePrefill;
  initialOrigins?: OriginContributionDraft[];
  origins?: OriginContributionDraft[];
  initialClaims?: string[];
  claims?: string[];
  initialCertifications?: string[];
  certifications?: string[];
}): { baseline: EvidenceFactInput[]; represented: EvidenceFactInput[] } {
  const baseline: EvidenceFactInput[] = [];
  const represented: EvidenceFactInput[] = [];
  const initialIngredients = input.initialIngredients?.trim();
  const ingredientsText = input.ingredientsText?.trim();
  if (initialIngredients) {
    baseline.push({ domain: 'ingredients_nutrition', ingredientsText: initialIngredients });
  }
  if (ingredientsText) {
    represented.push({ domain: 'ingredients_nutrition', ingredientsText });
  }
  const initialNutrition = nutritionFact(input.initialNutrition);
  const nutrition = nutritionFact(input.nutrition);
  if (initialNutrition) baseline.push(initialNutrition);
  if (nutrition) represented.push(nutrition);
  for (const row of input.initialOrigins || []) {
    const fact = originFact(row);
    if (fact) baseline.push(fact);
  }
  for (const row of input.origins || []) {
    const fact = originFact(row);
    if (fact) represented.push(fact);
  }
  for (const claim of input.initialClaims || []) {
    const wording = claim.trim();
    if (wording) baseline.push({ domain: 'packet_claims', exactWording: wording, claimValue: wording });
  }
  for (const claim of input.claims || []) {
    const wording = claim.trim();
    if (wording) represented.push({ domain: 'packet_claims', exactWording: wording, claimValue: wording });
  }
  for (const cert of input.initialCertifications || []) {
    const wording = cert.trim();
    if (wording) baseline.push({ domain: 'certifications', exactWording: wording, claimValue: wording });
  }
  for (const cert of input.certifications || []) {
    const wording = cert.trim();
    if (wording) represented.push({ domain: 'certifications', exactWording: wording, claimValue: wording });
  }
  return { baseline, represented };
}
