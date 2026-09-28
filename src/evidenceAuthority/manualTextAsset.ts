/**
 * Server-owned canonical form for a non-image manual_text source asset.
 * The client supplies the reviewed fields. The server trims, orders, and hashes them.
 */

import { GOVERNED_PACKET_ABSENCE_CLAIM } from '../contributions/admissionTypes';
import { establishNutrition, type StatedNutritionAmount } from '../ingredientsNutrition/nutritionSchema';
import { sha256Hex } from '../packetContribution/sha256';
import type { DerivedFact } from './types';

export const MANUAL_TEXT_CONTENT_TYPE = 'manual_text';

export type ManualTextDomain = 'ingredients_nutrition' | 'origins' | 'packet_claims' | 'certifications';

export type ManualTextDraft = {
  barcode: string;
  variantKey?: string;
  sessionId: string;
  unitId: string;
  domain: ManualTextDomain;
  statement?: string;
  ingredientsText?: string;
  nutritionBasis?: string;
  nutritionAmounts?: StatedNutritionAmount[];
  originClaimType?: string;
  originCountry?: string;
  ingredientSubject?: string;
  labelsTags?: string[];
  packetAbsence?: boolean;
};

export type ManualTextDocument = {
  sourceKind: 'manual_text';
  barcode: string;
  variantKey: string;
  sessionId: string;
  unitId: string;
  domain: ManualTextDomain;
  statement: string;
  structured: Record<string, string>;
};

function sortedRecord(values: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of Object.keys(values).sort()) {
    const value = values[key]?.trim();
    if (value) out[key] = value;
  }
  return out;
}

export function canonicalNutritionAmounts(amounts: StatedNutritionAmount[] | undefined, basis: string | undefined): {
  basis: string;
  amounts: string;
} | null {
  const established = establishNutrition({ basis, amounts });
  if (!established || established.amounts.length === 0) return null;
  const rendered = [...established.amounts]
    .map((amount) => `${amount.attribute}=${amount.value} ${amount.unit}`)
    .sort()
    .join(';');
  return { basis: established.basis, amounts: rendered };
}

/** Deterministic document. Null when the draft is empty or is a packet-absence affirmation. */
export function buildManualTextDocument(draft: ManualTextDraft): ManualTextDocument | null {
  if (draft.packetAbsence === true) return null;
  const barcode = draft.barcode.trim();
  const sessionId = draft.sessionId.trim();
  const unitId = draft.unitId.trim();
  if (!barcode || !sessionId || !unitId) return null;
  if (
    draft.domain !== 'ingredients_nutrition' &&
    draft.domain !== 'origins' &&
    draft.domain !== 'packet_claims' &&
    draft.domain !== 'certifications'
  ) {
    return null;
  }

  const ingredientsText = draft.ingredientsText?.trim() || '';
  const nutrition = canonicalNutritionAmounts(draft.nutritionAmounts, draft.nutritionBasis);
  const originClaimType = draft.originClaimType?.trim() || '';
  const originCountry = draft.originCountry?.trim() || '';
  const ingredientSubject = draft.ingredientSubject?.trim() || '';
  const labels = (draft.labelsTags || [])
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
    .sort();
  let statement = draft.statement?.trim() || '';
  if (ingredientsText) statement = ingredientsText;
  else if (nutrition) statement = nutrition.amounts;
  if (!statement) return null;
  if (draft.domain === 'packet_claims' && statement === GOVERNED_PACKET_ABSENCE_CLAIM) return null;
  if (draft.domain === 'ingredients_nutrition' && !ingredientsText && !nutrition) return null;
  if (draft.domain === 'origins' && !originClaimType) return null;

  const structured = sortedRecord({
    ...(ingredientsText ? { ingredientsText } : {}),
    ...(nutrition ? { nutritionBasis: nutrition.basis, nutritionAmounts: nutrition.amounts } : {}),
    ...(originClaimType ? { originClaimType } : {}),
    ...(originCountry ? { originCountry } : {}),
    ...(ingredientSubject ? { ingredientSubject } : {}),
    ...(labels.length > 0 ? { labelsTags: labels.join('|') } : {}),
  });

  return {
    sourceKind: 'manual_text',
    barcode,
    variantKey: draft.variantKey?.trim() || '',
    sessionId,
    unitId,
    domain: draft.domain,
    statement,
    structured,
  };
}

export function canonicalManualTextBytes(draft: ManualTextDraft): Uint8Array | null {
  const document = buildManualTextDocument(draft);
  if (!document) return null;
  return new TextEncoder().encode(JSON.stringify(document));
}

export function manualTextSha256(draft: ManualTextDraft): { bytes: Uint8Array; sha256: string } | null {
  const bytes = canonicalManualTextBytes(draft);
  if (!bytes) return null;
  return { bytes, sha256: sha256Hex(bytes) };
}

export function parseManualTextDocument(bytes: Uint8Array): ManualTextDocument | null {
  try {
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as Partial<ManualTextDocument>;
    if (parsed.sourceKind !== 'manual_text') return null;
    if (!parsed.barcode || !parsed.sessionId || !parsed.unitId || !parsed.domain || !parsed.statement) return null;
    if (!parsed.structured || typeof parsed.structured !== 'object') return null;
    return {
      sourceKind: 'manual_text',
      barcode: parsed.barcode,
      variantKey: parsed.variantKey || '',
      sessionId: parsed.sessionId,
      unitId: parsed.unitId,
      domain: parsed.domain,
      statement: parsed.statement,
      structured: parsed.structured,
    };
  } catch {
    return null;
  }
}

function isPacketAbsenceFact(fact: DerivedFact): boolean {
  return (
    fact.domain === 'packet_claims' &&
    (fact.subjectKey === 'packet_claims|absence|scope:whole_packet' ||
      (fact.claimValue === GOVERNED_PACKET_ABSENCE_CLAIM && !(fact.exactWording || '').trim()))
  );
}

function labelsKey(tags: string[] | undefined): string {
  return (tags || [])
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
    .sort()
    .join('|');
}

/**
 * The admitted facts for one manual_text asset must reconstruct that asset.
 * Packet absence never matches.
 */
export function manualTextFactsMatch(
  document: ManualTextDocument,
  facts: DerivedFact[],
  barcode: string
): boolean {
  if (document.barcode !== barcode) return false;
  const mine = facts.filter((fact) => fact.unitId === document.unitId);
  if (mine.length === 0) return false;
  if (mine.some((fact) => isPacketAbsenceFact(fact))) return false;
  if (mine.some((fact) => fact.domain !== document.domain)) return false;
  if (mine.some((fact) => (fact.variantKey ?? '') !== document.variantKey)) return false;

  if (document.domain === 'ingredients_nutrition') {
    const wantsIngredients = !!document.structured.ingredientsText;
    const wantsNutrition = !!document.structured.nutritionAmounts;
    if (!wantsIngredients && !wantsNutrition) return false;
    const ingredientsOk =
      !wantsIngredients ||
      mine.some(
        (fact) =>
          fact.exactWording === document.statement && fact.ingredientsNutrition?.ingredientsText === document.statement
      );
    const rendered = mine
      .flatMap((fact) => fact.ingredientsNutrition?.nutriments || [])
      .map((amount) => `${amount.attribute}=${amount.value} ${amount.unit}`)
      .sort()
      .join(';');
    const basis = mine.find((fact) => fact.ingredientsNutrition?.nutritionBasis)?.ingredientsNutrition?.nutritionBasis;
    const nutritionOk =
      !wantsNutrition ||
      (rendered === document.structured.nutritionAmounts &&
        basis === document.structured.nutritionBasis &&
        document.statement === rendered);
    return ingredientsOk && nutritionOk;
  }
  if (document.domain === 'origins') {
    return mine.some((fact) => {
      const structured = fact.originStructured;
      return (
        fact.exactWording === document.statement &&
        (structured?.claimType || '') === (document.structured.originClaimType || '') &&
        (structured?.primaryCountry || '') === (document.structured.originCountry || '') &&
        (structured?.ingredientSubject || '') === (document.structured.ingredientSubject || '')
      );
    });
  }
  if (document.domain === 'packet_claims') {
    return mine.some((fact) => fact.exactWording === document.statement);
  }
  if (document.domain === 'certifications') {
    return mine.some(
      (fact) => fact.exactWording === document.statement && labelsKey(fact.labelsTags) === (document.structured.labelsTags || '')
    );
  }
  return false;
}
