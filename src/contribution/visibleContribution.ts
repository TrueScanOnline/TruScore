/**
 * One Submit contract for every Wave 4A contribution form.
 * The visible field values are the contribution. A separate committed-row tap is not required.
 * An identical prevailing contribution is not sent again.
 */

import type { StatedNutritionAmount, NutritionBasis } from '../ingredientsNutrition/nutritionSchema';
import { NUTRITION_FIELDS } from '../ingredientsNutrition/nutritionSchema';
import { ceasedPrevailingSubjectKeys, correctionClosureFacts } from './correctionClosure';
import {
  nutritionAmountsToSubmit,
  originRowsToSubmit,
  packetListsForSubmit,
  type NutritionSourcePrefill,
  type OriginContributionDraft,
} from './governedDisplayProjection';
import type { ContributionEntryContext } from './resultContributionActions';
import { CONTRIBUTION_NOTICE_SAVED } from './resultContributionActions';

export const CONTRIBUTION_UNCHANGED_NOTICE = 'This is already the current contribution.';

export type VisibleContributionInput = {
  contexts: ContributionEntryContext[];
  ingredientsText: string;
  initialIngredients?: string;
  nutrition: NutritionSourcePrefill;
  nutritionBaseline: NutritionSourcePrefill;
  origins: OriginContributionDraft[];
  claims: string[];
  initialClaims?: string[];
  certifications: string[];
  initialCertifications?: string[];
  pendingPacketWording?: string;
  catalogueName?: string;
  absence?: boolean;
  hasPhotoForAbsence?: boolean;
};

export type ReadyVisibleContribution = {
  status: 'ready';
  ingredientsText?: string;
  nutritionBasis: NutritionBasis | null;
  nutritionAmounts: StatedNutritionAmount[];
  origins: Array<OriginContributionDraft & { claimType: NonNullable<OriginContributionDraft['claimType']> }>;
  claims: string[];
  certifications: string[];
  absence: boolean;
  ceasedSubjectKeys: string[];
};

export type VisibleContributionDecision =
  | ReadyVisibleContribution
  | { status: 'incomplete'; messages: string[] }
  | { status: 'unchanged'; message: string };

function freshWordings(current: string[], initial: string[] | undefined): string[] {
  const remaining = new Map<string, number>();
  for (const row of initial || []) {
    const text = row.trim();
    if (!text) continue;
    remaining.set(text, (remaining.get(text) || 0) + 1);
  }
  const fresh: string[] = [];
  for (const row of current) {
    const text = row.trim();
    if (!text) continue;
    const count = remaining.get(text) || 0;
    if (count > 0) remaining.set(text, count - 1);
    else fresh.push(text);
  }
  return fresh;
}

function invalidNutrientEntry(current: NutritionSourcePrefill, baseline: NutritionSourcePrefill): boolean {
  for (const field of NUTRITION_FIELDS) {
    const raw = (current.amounts[field.attribute] || '').trim();
    if (!raw) continue;
    const baselineRaw = (baseline.amounts[field.attribute] || '').trim();
    if (raw === baselineRaw) continue;
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) return true;
  }
  return false;
}

function originGap(rows: OriginContributionDraft[]): string | null {
  const started = rows.filter(
    (row) => row.claimType || row.place.trim() || row.wording.trim() || row.ingredient.trim()
  );
  if (started.length === 0) return 'Choose the type of origin statement and the country.';
  const partial = started.find((row) => {
    if (!row.claimType) return true;
    if (row.claimType === 'ingredient_origin' && !row.ingredient.trim()) return true;
    if (!row.place.trim()) return true;
    return false;
  });
  if (!partial) return null;
  if (!partial.claimType) return 'Choose the type of origin statement.';
  if (partial.claimType === 'ingredient_origin' && !partial.ingredient.trim()) return 'Name the ingredient on the pack.';
  return 'Choose the country.';
}

/** Authority or transport failure. The form keeps the entry so the consumer can submit again. */
export function contributionTransportFailureNotice(): string {
  return CONTRIBUTION_NOTICE_SAVED;
}

export function prepareVisibleContribution(input: VisibleContributionInput): VisibleContributionDecision {
  const contexts = input.contexts;
  const ingredientsContext = contexts.includes('ingredients');
  const nutritionContext = contexts.includes('nutrition');
  const originsContext = contexts.includes('origins');
  const packetContext = contexts.includes('packetClaims') || contexts.includes('certifications');
  const ingredientsText = input.ingredientsText.trim();
  const initialIngredients = (input.initialIngredients || '').trim();
  const ingredientsChanged = ingredientsContext && ingredientsText.length > 0 && ingredientsText !== initialIngredients;
  const nutritionAmounts = nutritionContext ? nutritionAmountsToSubmit(input.nutrition, input.nutritionBaseline) : [];
  const originRows = originsContext ? originRowsToSubmit(input.origins) : [];
  const packet = packetContext
    ? packetListsForSubmit({
        claims: input.claims,
        certifications: input.certifications,
        pendingWording: input.pendingPacketWording || '',
        catalogueName: input.catalogueName,
      })
    : { claims: [''], certifications: [''] };
  const claims = packetContext ? freshWordings(packet.claims, input.initialClaims) : [];
  const certifications = packetContext ? freshWordings(packet.certifications, input.initialCertifications) : [];
  const positiveClaims = packet.claims.map((row) => row.trim()).filter((row) => row.length > 0);
  const positiveCerts = packet.certifications.map((row) => row.trim()).filter((row) => row.length > 0);
  const absence =
    packetContext &&
    input.absence === true &&
    input.hasPhotoForAbsence === true &&
    positiveClaims.length === 0 &&
    positiveCerts.length === 0;
  const closure = correctionClosureFacts({
    ...(ingredientsContext ? { initialIngredients: input.initialIngredients, ingredientsText: input.ingredientsText } : {}),
    ...(nutritionContext
      ? { initialNutrition: input.nutritionBaseline, nutrition: input.nutrition }
      : {}),
    ...(originsContext ? { initialOrigins: input.origins, origins: input.origins } : {}),
    ...(packetContext
      ? {
          initialClaims: input.initialClaims,
          claims: packet.claims,
          initialCertifications: input.initialCertifications,
          certifications: packet.certifications,
        }
      : {}),
  });
  const ceasedSubjectKeys = ceasedPrevailingSubjectKeys(closure.baseline, closure.represented);
  const hasNewEvidence =
    ingredientsChanged || nutritionAmounts.length > 0 || originRows.length > 0 || claims.length > 0 || certifications.length > 0 || absence;
  if (hasNewEvidence || ceasedSubjectKeys.length > 0) {
    return {
      status: 'ready',
      ...(ingredientsChanged ? { ingredientsText } : {}),
      nutritionBasis: nutritionAmounts.length > 0 ? input.nutrition.basis : null,
      nutritionAmounts,
      origins: originRows,
      claims,
      certifications,
      absence,
      ceasedSubjectKeys,
    };
  }
  const messages: string[] = [];
  if (ingredientsContext && !ingredientsText) messages.push('Add the ingredients, then submit again.');
  if (nutritionContext && nutritionAmounts.length === 0) {
    if (invalidNutrientEntry(input.nutrition, input.nutritionBaseline)) messages.push('Enter the nutrient as a number.');
    else if (!NUTRITION_FIELDS.some((field) => (input.nutrition.amounts[field.attribute] || '').trim())) {
      messages.push('Enter a nutrient value, then submit again.');
    }
  }
  if (originsContext && originRows.length === 0) {
    const gap = originGap(input.origins);
    if (gap) messages.push(gap);
  }
  if (packetContext && positiveClaims.length === 0 && positiveCerts.length === 0 && !absence) {
    messages.push(
      input.absence === true
        ? 'Photograph the pack to record that no claim or certification is shown.'
        : 'Add what the pack says, then submit again.'
    );
  }
  if (messages.length > 0) return { status: 'incomplete', messages };
  return { status: 'unchanged', message: CONTRIBUTION_UNCHANGED_NOTICE };
}
