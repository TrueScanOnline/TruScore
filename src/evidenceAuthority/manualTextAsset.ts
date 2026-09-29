/**
 * Server-owned canonical form for a non-image manual_text source asset.
 * The client supplies the reviewed fields. The server trims, orders, and hashes them.
 */

import { GOVERNED_PACKET_ABSENCE_CLAIM } from '../contributions/admissionTypes';
import { governedCertificationLabels } from '../contributions/certificationLane';
import { isOriginClaimType, supportedPercentageQualifier, type OriginQualification, type OriginStructuredEvidence } from '../contributions/originStructured';
import { establishNutrition, type NutritionBasis, type StatedNutritionAmount } from '../ingredientsNutrition/nutritionSchema';
import { sha256Hex } from '../packetContribution/sha256';
import { deriveEvidenceFacts } from './subjects';
import type { DerivedFact, EvidenceFactInput } from './types';

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
  originCountries?: string[];
  originPercentage?: number;
  originPercentageQualifier?: string;
  originQualification?: string;
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
  const originCountries = (draft.originCountries || [])
    .map((country) => country.trim())
    .filter((country) => country.length > 0);
  const ingredientSubject = draft.ingredientSubject?.trim() || '';
  const originPercentage =
    draft.originPercentage != null && Number.isFinite(draft.originPercentage) ? String(draft.originPercentage) : '';
  const originPercentageQualifier = supportedPercentageQualifier(draft.originPercentageQualifier) || '';
  const originQualification =
    draft.originQualification === 'local' ||
    draft.originQualification === 'imported' ||
    draft.originQualification === 'multiple'
      ? draft.originQualification
      : '';
  let statement = draft.statement?.trim() || '';
  if (ingredientsText) statement = ingredientsText;
  else if (nutrition) statement = nutrition.amounts;
  if (!statement) return null;
  if (draft.domain === 'packet_claims' && statement === GOVERNED_PACKET_ABSENCE_CLAIM) return null;
  if (draft.domain === 'ingredients_nutrition' && !ingredientsText && !nutrition) return null;
  if (draft.domain === 'origins' && !originClaimType) return null;
  const labels =
    draft.domain === 'certifications'
      ? [...(governedCertificationLabels(statement) || [])].sort()
      : (draft.labelsTags || [])
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0)
          .sort();

  const structured = sortedRecord({
    ...(ingredientsText ? { ingredientsText } : {}),
    ...(nutrition ? { nutritionBasis: nutrition.basis, nutritionAmounts: nutrition.amounts } : {}),
    ...(originClaimType ? { originClaimType } : {}),
    ...(originCountry ? { originCountry } : {}),
    ...(originCountries.length > 1 ? { originCountries: originCountries.join('|') } : {}),
    ...(originPercentage ? { originPercentage } : {}),
    ...(originPercentage && originPercentageQualifier ? { originPercentageQualifier } : {}),
    ...(originQualification ? { originQualification } : {}),
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

function labelsKey(tags: string[] | undefined): string {
  return (tags || [])
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
    .sort()
    .join('|');
}

function parseCanonicalAmounts(rendered: string): StatedNutritionAmount[] {
  return rendered.split(';').flatMap((part) => {
    const eq = part.indexOf('=');
    const space = part.lastIndexOf(' ');
    if (eq < 1 || space <= eq) return [];
    const value = Number(part.slice(eq + 1, space));
    if (!Number.isFinite(value)) return [];
    return [
      {
        attribute: part.slice(0, eq) as StatedNutritionAmount['attribute'],
        value,
        unit: part.slice(space + 1),
      },
    ];
  });
}

/**
 * Origins structured content the manual document represents.
 * Exact wording stays the statement. Countries, percentage, qualifier, and
 * qualification are included only when the reviewed document contains them.
 */
export function canonicalManualOriginContent(document: ManualTextDocument): {
  exactWording: string;
  claimValue: string;
  originStructured: OriginStructuredEvidence;
} | null {
  if (document.domain !== 'origins') return null;
  const claimType = document.structured.originClaimType || '';
  if (!isOriginClaimType(claimType) || claimType === 'other') return null;
  const primaryCountry = document.structured.originCountry?.trim() || '';
  const ingredientSubject = document.structured.ingredientSubject?.trim() || '';
  const countries = (document.structured.originCountries || '')
    .split('|')
    .map((country) => country.trim())
    .filter((country) => country.length > 0);
  const uniqueCountries = [...new Set([primaryCountry, ...countries].filter((country) => country.length > 0))];
  const percentage = Number(document.structured.originPercentage);
  const qualifier = supportedPercentageQualifier(document.structured.originPercentageQualifier);
  const qualification = document.structured.originQualification;
  const originQualification: OriginQualification | undefined =
    qualification === 'local' || qualification === 'imported' || qualification === 'multiple'
      ? qualification
      : undefined;
  return {
    exactWording: document.statement,
    claimValue: primaryCountry || ingredientSubject || document.statement,
    originStructured: {
      claimType,
      primaryCountry,
      ...(uniqueCountries.length > 1 ? { countries: uniqueCountries } : {}),
      ...(ingredientSubject ? { ingredientSubject } : {}),
      ...(Number.isFinite(percentage) && percentage >= 0 && percentage <= 100
        ? { ingredientOriginPercentage: percentage }
        : {}),
      ...(Number.isFinite(percentage) && qualifier ? { percentageQualifier: qualifier } : {}),
      ...(originQualification ? { originQualification } : {}),
    },
  };
}

function inputFromDocument(document: ManualTextDocument): EvidenceFactInput {
  const shared = {
    unitId: document.unitId,
    variantKey: document.variantKey || undefined,
    finalizedAssetId: 'manual-document',
  };
  if (document.domain === 'ingredients_nutrition') {
    return {
      ...shared,
      domain: 'ingredients_nutrition',
      ingredientsText: document.structured.ingredientsText,
      nutritionBasis: document.structured.nutritionBasis as NutritionBasis | undefined,
      nutriments: document.structured.nutritionAmounts
        ? parseCanonicalAmounts(document.structured.nutritionAmounts)
        : undefined,
    };
  }
  if (document.domain === 'origins') {
    const canonical = canonicalManualOriginContent(document);
    if (!canonical) {
      return { ...shared, domain: 'origins' };
    }
    return {
      ...shared,
      domain: 'origins',
      exactWording: canonical.exactWording,
      claimValue: canonical.claimValue,
      originStructured: canonical.originStructured,
    };
  }
  if (document.domain === 'packet_claims') {
    return {
      ...shared,
      domain: 'packet_claims',
      exactWording: document.statement,
      claimValue: document.statement,
    };
  }
  return {
    ...shared,
    domain: 'certifications',
    exactWording: document.statement,
    claimValue: document.statement,
  };
}

function projectFact(fact: DerivedFact): string {
  const nutriments = (fact.ingredientsNutrition?.nutriments || [])
    .map((amount) => `${amount.attribute}=${amount.value} ${amount.unit}`)
    .sort()
    .join(';');
  return JSON.stringify({
    unitId: fact.unitId || '',
    domain: fact.domain,
    subjectKey: fact.subjectKey,
    claimKey: fact.claimKey,
    claimValue: fact.claimValue,
    exactWording: fact.exactWording || '',
    variantKey: fact.variantKey || '',
    labelsTags: labelsKey(fact.labelsTags),
    originClaimType: fact.originStructured?.claimType || '',
    originCountry: fact.originStructured?.primaryCountry || '',
    ingredientSubject: fact.originStructured?.ingredientSubject || '',
    ingredientsText: fact.ingredientsNutrition?.ingredientsText || '',
    nutritionBasis: fact.ingredientsNutrition?.nutritionBasis || '',
    nutriments,
  });
}

function sameFactSet(left: DerivedFact[], right: DerivedFact[]): boolean {
  const a = left.map(projectFact).sort();
  const b = right.map(projectFact).sort();
  return a.length === b.length && a.every((item, index) => item === b[index]);
}

function isSubset(part: DerivedFact[], whole: DerivedFact[]): boolean {
  const allowed = new Set(whole.map(projectFact));
  return part.every((fact) => allowed.has(projectFact(fact)));
}

/**
 * Every fact that cites the manual_text asset must be that reviewed unit and
 * must reconstruct the canonical document. One matching fact does not admit the others.
 */
export function manualTextSubmissionMatches(params: {
  document: ManualTextDocument;
  inputs: EvidenceFactInput[];
  derived: DerivedFact[];
  barcode: string;
}): boolean {
  const { document, inputs, derived, barcode } = params;
  if (document.barcode !== barcode) return false;
  if (inputs.length === 0 || derived.length === 0) return false;
  if (inputs.some((fact) => fact.packetAbsence === true)) return false;
  if (inputs.some((fact) => (fact.unitId || '') !== document.unitId)) return false;
  if (derived.some((fact) => (fact.unitId || '') !== document.unitId)) return false;
  if (derived.some((fact) => fact.domain !== document.domain)) return false;
  if (derived.some((fact) => fact.subjectKey === 'packet_claims|absence|scope:whole_packet')) return false;

  const expected = deriveEvidenceFacts([inputFromDocument(document)]).facts;
  if (expected.length === 0 || !sameFactSet(derived, expected)) return false;
  return inputs.every((input) => {
    const alone = deriveEvidenceFacts([{ ...input, unitId: document.unitId, variantKey: document.variantKey || undefined }]).facts;
    return alone.length > 0 && isSubset(alone, expected);
  });
}
