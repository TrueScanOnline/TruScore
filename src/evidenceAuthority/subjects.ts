import { GOVERNED_PACKET_ABSENCE_CLAIM } from '../contributions/admissionTypes';
import { normalizeClaimKey } from '../contributions/evidenceVersion';
import { originSubjectKey } from '../origins/governedFacts';
import { establishNutrition } from '../ingredientsNutrition/nutritionSchema';
import {
  getActivePatterns,
  matchAdmittedObservations,
} from '../lib/truscoreEngine/claims/matchRegister';
import { normalizePacketStatement } from '../lib/truscoreEngine/claims/normalize';
import type { ContributionEvidence } from '../contributions/types';
import type { DerivedFact, EvidenceFactInput } from './types';

/**
 * Frozen 4A.2–4A.4 fields that cannot deterministically express the requested
 * subject. These are reported. They do not create a product taxonomy.
 */
export const SCHEMA_IDENTITY_GAPS = [
  'Ingredients language is not a field on the frozen ingredients payload. Ingredients text is one subject. A supplied language does not create another subject.',
  'Nutrition preparation or scope is not on the frozen stated-amount schema. A nutrient subject is the governed attribute plus the declared basis only.',
  'Serving size and servings per pack are not frozen schema fields. They are not allocated a subject.',
  'Certification scope is not a frozen field. The subject is the certification scheme tag only.',
  'Packet-absence has no checked-scope field. The frozen affirmation is one whole-packet absence subject, separate from positive claim subjects.',
  'Frozen origin identity is originSubjectKey: ingredient_origin includes the ingredient subject; grown_in, produced_in, made_in, packed_in, and processed_in are claim-type subjects. Country stays version content. A per-ingredient subject is not invented for the claim-type rows.',
  'ContributionRecordClass has no uat member. UAT versus production class is stored on the authority row.',
] as const;

export type FactDerivation = {
  facts: DerivedFact[];
  gaps: string[];
};

function gapFor(input: EvidenceFactInput, gaps: string[]): void {
  if (input.ingredientsLanguage) gaps.push(SCHEMA_IDENTITY_GAPS[0]);
  if (input.preparation) gaps.push(SCHEMA_IDENTITY_GAPS[1]);
  if (input.servingSize || input.servingsPerPack) gaps.push(SCHEMA_IDENTITY_GAPS[2]);
  if (input.certificationScope) gaps.push(SCHEMA_IDENTITY_GAPS[3]);
  if (input.packetAbsence) gaps.push(SCHEMA_IDENTITY_GAPS[4]);
  if (input.domain === 'origins') gaps.push(SCHEMA_IDENTITY_GAPS[5]);
}

function packetSubject(wording: string): { subjectKey: string; claimKey: string } {
  const normalized = normalizePacketStatement(wording);
  const matched = matchAdmittedObservations([
    {
      evidence_id: 'subject-derivation',
      observed_text: wording,
      display_text: wording,
      admission_method: 'user_confirmation',
      source_locator: 'packet_contribution',
    },
  ]);
  const hit = matched.matched.length === 1 ? matched.matched[0] : null;
  if (!hit) {
    return {
      subjectKey: `packet_claims|statement:${normalized}`,
      claimKey: normalized || wording,
    };
  }
  const pattern = getActivePatterns().find((row) => row.pattern_id === hit.register_row_id);
  const scope = pattern?.required_scope || 'unspecified';
  return {
    subjectKey: `packet_claims|register:${hit.canonical_family}|scope:${scope}`,
    claimKey: `${hit.canonical_family}|${scope}`,
  };
}

function pushUnique(facts: DerivedFact[], next: DerivedFact): void {
  if (facts.some((fact) => fact.subjectKey === next.subjectKey)) return;
  facts.push(next);
}

export function deriveEvidenceFacts(inputs: EvidenceFactInput[]): FactDerivation {
  const facts: DerivedFact[] = [];
  const gaps: string[] = [];
  for (const input of inputs) {
    gapFor(input, gaps);
    if (input.domain === 'packet_claims' && input.packetAbsence === true) {
      pushUnique(facts, {
        domain: 'packet_claims',
        subjectKey: 'packet_claims|absence|scope:whole_packet',
        claimKey: GOVERNED_PACKET_ABSENCE_CLAIM,
        claimValue: GOVERNED_PACKET_ABSENCE_CLAIM,
        exactWording: '',
        variantKey: input.variantKey,
        machineRunId: input.machineRunId,
        region: input.region,
      });
      continue;
    }
    if (input.domain === 'packet_claims') {
      const wording = (input.exactWording || input.claimValue || '').trim();
      if (!wording) continue;
      const subject = packetSubject(wording);
      pushUnique(facts, {
        domain: 'packet_claims',
        subjectKey: subject.subjectKey,
        claimKey: subject.claimKey,
        claimValue: wording,
        exactWording: wording,
        variantKey: input.variantKey,
        machineRunId: input.machineRunId,
        region: input.region,
      });
      continue;
    }
    if (input.domain === 'origins' && input.originStructured) {
      const subject = originSubjectKey({
        domain: 'origins',
        originStructured: input.originStructured,
      } as ContributionEvidence);
      if (!subject) continue;
      const country = input.originStructured.primaryCountry?.trim() || input.claimValue || '';
      pushUnique(facts, {
        domain: 'origins',
        subjectKey: `origins|${subject}`,
        claimKey: subject,
        claimValue: country,
        exactWording: input.exactWording,
        variantKey: input.variantKey,
        originStructured: input.originStructured,
        machineRunId: input.machineRunId,
        region: input.region,
      });
      continue;
    }
    if (input.domain === 'certifications') {
      const tags = (input.labelsTags?.length ? input.labelsTags : [input.claimValue || input.exactWording || ''])
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
      for (const tag of tags) {
        const scheme = normalizeClaimKey(tag);
        pushUnique(facts, {
          domain: 'certifications',
          subjectKey: `certifications|scheme:${scheme}`,
          claimKey: scheme,
          claimValue: tag,
          exactWording: input.exactWording || tag,
          variantKey: input.variantKey,
          labelsTags: [tag],
          machineRunId: input.machineRunId,
          region: input.region,
        });
      }
      continue;
    }
    if (input.domain === 'ingredients_nutrition') {
      const text = input.ingredientsText?.trim();
      if (text) {
        pushUnique(facts, {
          domain: 'ingredients_nutrition',
          subjectKey: 'ingredients_nutrition|ingredients_text',
          claimKey: 'ingredients_text',
          claimValue: text,
          exactWording: text,
          variantKey: input.variantKey,
          ingredientsNutrition: { ingredientsText: text, nutritionComplete: false },
          machineRunId: input.machineRunId,
          region: input.region,
        });
      }
      const nutrition = establishNutrition({
        basis: input.nutritionBasis,
        amounts: input.nutriments,
      });
      if (nutrition) {
        for (const amount of nutrition.amounts) {
          pushUnique(facts, {
            domain: 'ingredients_nutrition',
            subjectKey: `ingredients_nutrition|nutrient:${amount.attribute}|basis:${nutrition.basis}`,
            claimKey: `${amount.attribute}|${nutrition.basis}`,
            claimValue: String(amount.value),
            variantKey: input.variantKey,
            ingredientsNutrition: {
              nutritionBasis: nutrition.basis,
              nutriments: [amount],
              nutritionComplete: nutrition.nutritionComplete,
            },
            machineRunId: input.machineRunId,
            region: input.region,
          });
        }
      }
    }
  }
  return { facts, gaps: [...new Set(gaps)] };
}
