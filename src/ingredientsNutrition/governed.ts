import { admitEvidence } from '../contributions/admissionContract';
import { createPendingEvidence } from '../contributions/lifecycle';
import { buildEvidenceId, canonicalizeVariantKey, normalizeClaimKey } from '../contributions/evidenceVersion';
import {
  getLocalEvidenceById,
  getLocalEvidenceForBarcode,
  persistEvidenceRemote,
  upsertLocalEvidence,
} from '../contributions/evidenceStore';
import { evidenceKeyOf } from '../contributions/admissionContract';
import {
  checkpointMaterialCompletion,
  markRecoveryRemoteSynced,
} from '../contributions/contributionRecovery';
import { getContributorId } from '../contributions/contributorIdentity';
import {
  CURRENT_PRODUCTION_CONTRIBUTION_EPOCH,
  resolveContributionCreationRecordClass,
} from '../contributions/productionEpoch';
import type { ContributionEvidence } from '../contributions/types';
import { registerIngredientsNutritionBodyReceiver } from './bodyReceiver';
import { establishNutrition, type StatedNutritionAmount } from './nutritionSchema';

export type IngredientsNutritionDraft = {
  barcode: string;
  variantKey?: string;
  ingredientsText?: string;
  nutritionBasis?: string;
  amounts?: Array<{ attribute?: string; value?: unknown; unit?: string }>;
  imageUrl?: string;
  /** When false, keep the local submitted row and do not post the retired contribution route. */
  persistRemote?: boolean;
};

export async function submitIngredientsNutritionEvidence(
  draft: IngredientsNutritionDraft
): Promise<ContributionEvidence> {
  registerIngredientsNutritionBodyReceiver();
  const ingredientsText = draft.ingredientsText?.trim() || undefined;
  const nutrition = establishNutrition({ basis: draft.nutritionBasis, amounts: draft.amounts });
  if (!ingredientsText && !nutrition) {
    throw new Error('ingredients_nutrition_requires_a_fact');
  }
  const claimValue =
    ingredientsText ||
    `nutrition:${(nutrition?.amounts || [])
      .map((amount: StatedNutritionAmount) => amount.attribute)
      .sort()
      .join(',')}`;
  const claimKey = normalizeClaimKey(ingredientsText ? `ingredients:${ingredientsText}` : claimValue);
  const variantKey = canonicalizeVariantKey(draft.variantKey);
  const existing = await getLocalEvidenceForBarcode(draft.barcode);
  const sameClaim = existing.filter(
    (row) =>
      row.domain === 'ingredients_nutrition' &&
      normalizeClaimKey(row.claimKey) === claimKey &&
      canonicalizeVariantKey(row.variantKey) === variantKey
  );
  const evidenceVersion = sameClaim.length === 0 ? 1 : Math.max(...sameClaim.map((row) => row.evidenceVersion)) + 1;
  const runtimeClass = resolveContributionCreationRecordClass();
  const evidence = createPendingEvidence({
    evidenceId: buildEvidenceId({
      barcode: draft.barcode,
      domain: 'ingredients_nutrition',
      claimKey,
      evidenceVersion,
      variantKey,
    }),
    barcode: draft.barcode,
    domain: 'ingredients_nutrition',
    evidenceVersion,
    claimKey,
    claimValue,
    variantKey,
    submitterId: await getContributorId(),
    createdAt: Date.now(),
    imageUrl: draft.imageUrl,
    exactWording: ingredientsText,
    ingredientsNutrition: {
      ingredientsText,
      nutriments: nutrition?.amounts,
      nutritionBasis: nutrition?.basis,
      nutritionComplete: nutrition?.nutritionComplete === true,
    },
    productionEpoch: CURRENT_PRODUCTION_CONTRIBUTION_EPOCH,
    recordClass: runtimeClass,
    admissionStatus: 'submitted',
    sourceProvenance: 'primary_user_submission',
  });
  await upsertLocalEvidence(evidence);
  if (draft.persistRemote === false) return evidence;
  const checkpoint =
    runtimeClass === 'production' ? await checkpointMaterialCompletion(evidence, evidenceKeyOf(evidence)) : null;
  const remoteOk = await persistEvidenceRemote(evidence).catch(() => false);
  if (checkpoint && remoteOk) await markRecoveryRemoteSynced(checkpoint.recoveryId);
  return evidence;
}

export async function admitIngredientsNutritionEvidence(evidenceId: string): Promise<ContributionEvidence> {
  registerIngredientsNutritionBodyReceiver();
  const existing = await getLocalEvidenceById(evidenceId);
  if (!existing || existing.domain !== 'ingredients_nutrition') {
    throw new Error('ingredients_nutrition_evidence_missing');
  }
  const admitted = admitEvidence(existing, { admissionReason: 'primary_user_ingredients_nutrition' });
  if (!admitted.ok) throw new Error(admitted.reason);
  await upsertLocalEvidence(admitted.evidence);
  return admitted.evidence;
}
