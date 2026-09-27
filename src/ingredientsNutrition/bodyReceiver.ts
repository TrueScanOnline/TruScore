import { registerBodyReceiverPredicate } from '../contributions/bodyReceiverRegistry';
import { isGovernedAdmitted } from '../contributions/admissionContract';
import { carriesCurrentProductionEpoch } from '../contributions/productionEpoch';
import type { ContributionEvidence } from '../contributions/types';

const ingredientsNutritionBodyPredicate: Parameters<typeof registerBodyReceiverPredicate>[0] = (evidence) => {
    if (evidence.domain !== 'ingredients_nutrition') return null;
    if (!carriesCurrentProductionEpoch(evidence) || !isGovernedAdmitted(evidence)) return null;
    const payload = evidence.ingredientsNutrition;
    const ingredients = payload?.ingredientsText?.trim();
    const nutritionKeys = payload?.nutriments?.length ? payload.nutriments : [];
    if (!ingredients && nutritionKeys.length === 0) return null;
    return {
      eligible: true,
      methodologyId: 'body_pillar',
      methodologyVersion: 'as_built',
      reason: 'admitted ingredients and nutrition evidence × existing Body methodologies',
    };
};

/** Existing Body methodologies may receive admitted Ingredients & Nutrition evidence. */
export function registerIngredientsNutritionBodyReceiver(): void {
  registerBodyReceiverPredicate(ingredientsNutritionBodyPredicate);
}

export function __resetIngredientsNutritionBodyReceiverForTests(): void {
  registerIngredientsNutritionBodyReceiver();
}

export function ingredientsNutritionHasEstablishedFacts(evidence: ContributionEvidence): boolean {
  const payload = evidence.ingredientsNutrition;
  if (!payload) return false;
  if (payload.ingredientsText?.trim()) return true;
  return !!payload.nutriments && payload.nutriments.some((amount) => Number.isFinite(amount.value));
}
