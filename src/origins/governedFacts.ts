/**
 * Product Origins read model.
 * Open scoring still consumes one manufacturing place. This selector does not change that.
 * Same subject: the later admitted row prevails. Other subjects stay. History stays in the store.
 */

import { canApplyToProductionReceiver } from '../contributions/admissionContract';
import {
  ingredientSubjectKey,
  normalizeIngredientSubject,
  supportedPercentageQualifier,
  type OriginStructuredEvidence,
} from '../contributions/originStructured';
import type { ContributionEvidence } from '../contributions/types';

export const PRODUCT_ORIGINS_CLAIM_TYPES = [
  'grown_in',
  'produced_in',
  'made_in',
  'packed_in',
  'ingredient_origin',
] as const;

export type ProductOriginsClaimType = (typeof PRODUCT_ORIGINS_CLAIM_TYPES)[number];

export type GovernedOriginFact = {
  evidenceId: string;
  subjectKey: string;
  claimType: ProductOriginsClaimType | 'processed_in';
  countries: string[];
  exactWording?: string;
  ingredientSubject?: string;
  percentage?: number;
  percentageQualifier?: OriginStructuredEvidence['percentageQualifier'];
  originQualification?: OriginStructuredEvidence['originQualification'];
  additionalOriginStatement?: string;
  /** Admitted primary-user facts publish at Limited confidence. */
  confidence: 'limited';
};

export type ProductOriginsExplainerHook = {
  surface: 'product_origins';
  levels: ['L1', 'L2', 'L3'];
  editorial: 'deferred';
};

export const PRODUCT_ORIGINS_EXPLAINER_HOOK: ProductOriginsExplainerHook = {
  surface: 'product_origins',
  levels: ['L1', 'L2', 'L3'],
  editorial: 'deferred',
};

function isProductClaim(value: string): value is ProductOriginsClaimType | 'processed_in' {
  return (
    (PRODUCT_ORIGINS_CLAIM_TYPES as readonly string[]).includes(value) || value === 'processed_in'
  );
}

export function originSubjectKey(evidence: ContributionEvidence): string | null {
  const structured = evidence.originStructured;
  if (!structured || !isProductClaim(structured.claimType)) return null;
  if (structured.claimType === 'ingredient_origin') {
    const subject = ingredientSubjectKey(structured.ingredientSubject);
    if (!subject) return null;
    return `ingredient_origin:${subject}`;
  }
  return structured.claimType;
}

function statedCountries(structured: OriginStructuredEvidence): string[] {
  const countries = [
    structured.primaryCountry,
    ...(structured.countries || []),
    structured.ingredientOriginCountry || '',
  ]
    .map((country) => country.trim())
    .filter((country, index, all) => country.length > 0 && all.indexOf(country) === index);
  return countries;
}

function hasEstablishedOrigin(evidence: ContributionEvidence, structured: OriginStructuredEvidence): boolean {
  if (statedCountries(structured).length > 0) return true;
  if (evidence.exactWording?.trim()) return true;
  if (structured.claimType === 'ingredient_origin' && normalizeIngredientSubject(structured.ingredientSubject)) {
    return true;
  }
  return false;
}

function toFact(evidence: ContributionEvidence): GovernedOriginFact | null {
  const structured = evidence.originStructured;
  const subjectKey = originSubjectKey(evidence);
  if (!structured || !subjectKey || !isProductClaim(structured.claimType)) return null;
  if (!hasEstablishedOrigin(evidence, structured)) return null;
  const percentage =
    structured.ingredientOriginPercentage != null &&
    Number.isFinite(structured.ingredientOriginPercentage) &&
    structured.ingredientOriginPercentage >= 0 &&
    structured.ingredientOriginPercentage <= 100
      ? structured.ingredientOriginPercentage
      : undefined;
  return {
    evidenceId: evidence.evidenceId,
    subjectKey,
    claimType: structured.claimType,
    countries: statedCountries(structured),
    exactWording: evidence.exactWording?.trim() || undefined,
    ingredientSubject:
      structured.claimType === 'ingredient_origin'
        ? normalizeIngredientSubject(structured.ingredientSubject) || undefined
        : undefined,
    percentage,
    percentageQualifier:
      percentage != null ? supportedPercentageQualifier(structured.percentageQualifier) : undefined,
    originQualification: structured.originQualification,
    additionalOriginStatement: structured.additionalOriginStatement?.trim() || undefined,
    confidence: 'limited',
  };
}

function admittedAt(evidence: ContributionEvidence): number {
  return evidence.admission?.admittedAt ?? 0;
}

/** Later admitted row for the same subject wins. Unrelated subjects remain. Unadmitted rows are ignored. */
export function selectPrevailingOriginFacts(evidence: ContributionEvidence[]): GovernedOriginFact[] {
  const best = new Map<string, ContributionEvidence>();
  for (const row of evidence) {
    if (row.domain !== 'origins') continue;
    if (!canApplyToProductionReceiver(row, 'open_origins')) continue;
    const subject = originSubjectKey(row);
    if (!subject) continue;
    const current = best.get(subject);
    if (!current) {
      best.set(subject, row);
      continue;
    }
    const rowAt = admittedAt(row);
    const currentAt = admittedAt(current);
    if (rowAt > currentAt || (rowAt === currentAt && row.evidenceVersion > current.evidenceVersion)) {
      best.set(subject, row);
    }
  }
  return [...best.values()]
    .map((row) => toFact(row))
    .filter((fact): fact is GovernedOriginFact => fact != null);
}
