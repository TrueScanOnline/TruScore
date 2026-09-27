import { submitGovernedEvidence } from '../contributions/submitGovernedEvidence';
import { submitIngredientsNutritionEvidence } from '../ingredientsNutrition/governed';
import { getSession, upsertSession } from './sessionStore';
import { supportIsBounded } from './review';
import type { PacketEvidenceUnit } from './types';

export type HandoffResult =
  | {
      unitId: string;
      outcome: 'submitted';
      evidenceId: string;
      admissionStatus: 'submitted';
      idempotent: boolean;
    }
  | {
      unitId: string;
      outcome: 'held_for_later_receiver';
      reason: string;
    }
  | {
      unitId: string;
      outcome: 'skipped';
      reason: string;
    };

type SubmitFn = typeof submitGovernedEvidence;

/**
 * Prepare reviewed units into the frozen 4A.0 submit contract.
 * Does not admit, promote, or write scoring fields.
 */
export async function handoffReviewedUnits(params: {
  sessionId: string;
  submit?: SubmitFn;
  now?: number;
}): Promise<HandoffResult[]> {
  const session = await getSession(params.sessionId);
  if (!session) throw new Error('packet_session_missing');
  const submit = params.submit || submitGovernedEvidence;
  const results: HandoffResult[] = [];
  const units = [...session.units];

  for (let index = 0; index < units.length; index += 1) {
    const unit = units[index];
    if (unit.status === 'set_aside') {
      results.push({ unitId: unit.unitId, outcome: 'skipped', reason: 'set_aside' });
      continue;
    }
    if (unit.status !== 'reviewed') {
      results.push({ unitId: unit.unitId, outcome: 'skipped', reason: 'not_reviewed' });
      continue;
    }
    if (unit.governedEvidenceId) {
      results.push({
        unitId: unit.unitId,
        outcome: 'submitted',
        evidenceId: unit.governedEvidenceId,
        admissionStatus: 'submitted',
        idempotent: true,
      });
      continue;
    }
    if (!supportIsBounded(session, unit.support)) {
      results.push({ unitId: unit.unitId, outcome: 'skipped', reason: 'unbounded_support' });
      continue;
    }
    const source = session.sourceAssets.find((asset) => asset.assetId === unit.support.sourceAssetId);
    if (unit.domain === 'ingredients_nutrition') {
      const ingredientsText = unit.section === 'nutrition' ? undefined : unit.statement;
      const amounts = unit.section === 'nutrition' ? unit.nutritionAmounts : undefined;
      const hasNutrition = !!amounts?.some((amount) => Number.isFinite(amount.value));
      if (!ingredientsText?.trim() && !hasNutrition) {
        results.push({ unitId: unit.unitId, outcome: 'skipped', reason: 'no_established_facts' });
        continue;
      }
      const submitted = await submitIngredientsNutritionEvidence({
        barcode: session.barcode,
        variantKey: session.variantKey,
        ingredientsText,
        amounts,
        nutritionBasis: unit.nutritionBasis,
        imageUrl: source ? `private://${source.privateKey}` : undefined,
      });
      if (submitted.admissionStatus === 'admitted') {
        throw new Error('packet_handoff_must_not_admit');
      }
      units[index] = {
        ...unit,
        governedEvidenceId: submitted.evidenceId,
        submittedAt: params.now ?? Date.now(),
      };
      results.push({
        unitId: unit.unitId,
        outcome: 'submitted',
        evidenceId: submitted.evidenceId,
        admissionStatus: 'submitted',
        idempotent: false,
      });
      continue;
    }
    if (unit.domain === 'packet_claims' && unit.packetAbsenceAffirmation === true) {
      const evidence = await submit({
        barcode: session.barcode,
        domain: 'packet_claims',
        claimValue: 'governed_packet_absence',
        packetAbsence: true,
        imageUrl: source ? `private://${source.privateKey}` : undefined,
        variantKey: session.variantKey,
        asProductionEpoch: true,
      });
      if (evidence.admissionStatus === 'admitted') {
        throw new Error('packet_handoff_must_not_admit');
      }
      units[index] = {
        ...unit,
        governedEvidenceId: evidence.evidenceId,
        submittedAt: params.now ?? Date.now(),
      };
      results.push({
        unitId: unit.unitId,
        outcome: 'submitted',
        evidenceId: evidence.evidenceId,
        admissionStatus: 'submitted',
        idempotent: false,
      });
      continue;
    }
    if (unit.domain === 'packet_claims') {
      const wording = unit.statement.trim();
      if (!wording) {
        results.push({ unitId: unit.unitId, outcome: 'skipped', reason: 'packet_claim_wording_absent' });
        continue;
      }
      const evidence = await submit({
        barcode: session.barcode,
        domain: 'packet_claims',
        claimValue: wording,
        exactWording: wording,
        imageUrl: source ? `private://${source.privateKey}` : undefined,
        variantKey: session.variantKey,
        asProductionEpoch: true,
      });
      if (evidence.admissionStatus === 'admitted') {
        throw new Error('packet_handoff_must_not_admit');
      }
      units[index] = {
        ...unit,
        governedEvidenceId: evidence.evidenceId,
        submittedAt: params.now ?? Date.now(),
      };
      results.push({
        unitId: unit.unitId,
        outcome: 'submitted',
        evidenceId: evidence.evidenceId,
        admissionStatus: 'submitted',
        idempotent: false,
      });
      continue;
    }
    if (unit.domain !== 'origins' && unit.domain !== 'certifications') {
      results.push({
        unitId: unit.unitId,
        outcome: 'held_for_later_receiver',
        reason: 'domain_receiver_not_in_4a0',
      });
      continue;
    }
    if (unit.domain === 'origins') {
      const claimType = unit.originClaimType;
      const primaryCountry = unit.originCountry?.trim() || '';
      const ingredientSubject = unit.ingredientSubject?.trim() || '';
      if (!claimType || claimType === 'other') {
        results.push({ unitId: unit.unitId, outcome: 'skipped', reason: 'origin_claim_not_explicit' });
        continue;
      }
      if (!primaryCountry && !ingredientSubject && !unit.statement.trim()) {
        results.push({ unitId: unit.unitId, outcome: 'skipped', reason: 'origin_statement_absent' });
        continue;
      }
      const evidence = await submit({
        barcode: session.barcode,
        domain: 'origins',
        claimValue: primaryCountry || ingredientSubject || unit.statement,
        exactWording: unit.statement,
        imageUrl: source ? `private://${source.privateKey}` : undefined,
        variantKey: session.variantKey,
        asProductionEpoch: true,
        originStructured: {
          claimType,
          primaryCountry,
          countries: unit.originCountries,
          ingredientSubject: ingredientSubject || undefined,
          ingredientOriginPercentage: unit.originPercentage,
          percentageQualifier: unit.originPercentageQualifier,
          originQualification: unit.originQualification,
        },
      });
      if (evidence.admissionStatus === 'admitted') {
        throw new Error('packet_handoff_must_not_admit');
      }
      units[index] = {
        ...unit,
        governedEvidenceId: evidence.evidenceId,
        submittedAt: params.now ?? Date.now(),
      };
      results.push({
        unitId: unit.unitId,
        outcome: 'submitted',
        evidenceId: evidence.evidenceId,
        admissionStatus: 'submitted',
        idempotent: false,
      });
      continue;
    }
    const evidence = await submit({
      barcode: session.barcode,
      domain: unit.domain,
      claimValue: unit.statement,
      exactWording: unit.statement,
      imageUrl: source ? `private://${source.privateKey}` : undefined,
      variantKey: session.variantKey,
      asProductionEpoch: true,
      labelsTags: [unit.statement],
    });
    if (evidence.admissionStatus === 'admitted') {
      throw new Error('packet_handoff_must_not_admit');
    }
    units[index] = {
      ...unit,
      governedEvidenceId: evidence.evidenceId,
      submittedAt: params.now ?? Date.now(),
    };
    results.push({
      unitId: unit.unitId,
      outcome: 'submitted',
      evidenceId: evidence.evidenceId,
      admissionStatus: 'submitted',
      idempotent: false,
    });
  }

  await upsertSession({ ...session, units });
  return results;
}
