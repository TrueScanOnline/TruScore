import type {
  OriginClaimType,
  OriginPercentageQualifier,
} from '../config/contributionPolicy';
import { ORIGIN_CLAIM_TYPES } from '../config/contributionPolicy';

export type OriginStructuredEvidence = {
  claimType: OriginClaimType;
  primaryCountry: string;
  ingredientOriginPercentage?: number;
  percentageQualifier?: OriginPercentageQualifier;
  ingredientOriginCountry?: string;
  /** Optional second packet statement (packed in / imported ingredients, etc.). */
  additionalOriginStatement?: string;
};

const CLAIM_TYPE_LABEL: Record<OriginClaimType, string> = {
  made_in: 'Made in',
  produced_in: 'Produced in',
  grown_in: 'Grown in',
  packed_in: 'Packed in',
  processed_in: 'Processed in',
  other: 'Origin',
};

const QUALIFIER_LABEL: Record<OriginPercentageQualifier, string> = {
  at_least: 'at least',
  exactly: '',
  more_than: 'more than',
  less_than: 'less than',
  other_unclear: '',
};

export function isOriginClaimType(value: string): value is OriginClaimType {
  return (ORIGIN_CLAIM_TYPES as readonly string[]).includes(value);
}

/** Build a faithful transcript from structured fields (user confirms/corrects; not forced to type full sentence). */
export function buildExactWordingFromStructured(structured: OriginStructuredEvidence): string {
  const head = `${CLAIM_TYPE_LABEL[structured.claimType]} ${structured.primaryCountry}`.trim();
  const pct = structured.ingredientOriginPercentage;
  const qualifier = structured.percentageQualifier;
  const ingredientCountry = structured.ingredientOriginCountry || structured.primaryCountry;
  if (pct != null && Number.isFinite(pct) && qualifier) {
    const q = QUALIFIER_LABEL[qualifier];
    const pctPhrase = q ? `${q} ${pct}%` : `${pct}%`;
    return `${head} from ${pctPhrase} ${ingredientCountry} ingredients`.replace(/\s+/g, ' ').trim();
  }
  if (structured.additionalOriginStatement?.trim()) {
    return `${head}. ${structured.additionalOriginStatement.trim()}`;
  }
  return head;
}

/** OFF-style manufacturing place tag for the existing Open complete-origin path. */
export function countryToManufacturingTag(country: string): string {
  const slug = String(country || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug ? `en:${slug}` : 'en:unknown';
}
