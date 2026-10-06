import type {
  OriginClaimType,
  OriginPercentageQualifier,
} from '../config/contributionPolicy';
import { ORIGIN_CLAIM_TYPES, ORIGIN_PERCENTAGE_QUALIFIERS } from '../config/contributionPolicy';

export type OriginQualification = 'local' | 'imported' | 'multiple';
export type OriginLocalImported = 'local' | 'imported';

export type OriginStructuredEvidence = {
  claimType: OriginClaimType;
  /** First stated country. Empty when the packet names no country. */
  primaryCountry: string;
  /** Further countries explicitly stated. Not inferred from wording. */
  countries?: string[];
  /** Packet wording for ingredient_origin. No ontology. */
  ingredientSubject?: string;
  ingredientOriginPercentage?: number;
  percentageQualifier?: OriginPercentageQualifier;
  ingredientOriginCountry?: string;
  /** Optional second packet statement, stored as written. */
  additionalOriginStatement?: string;
  /** Set only when the packet explicitly says local, imported, or more than one origin. */
  originQualification?: OriginQualification;
  /** Local and imported may both be stated. Scoring still reads the single qualification when only one applies. */
  originQualifications?: OriginLocalImported[];
  /** The packet states no percentage. No percentage is inferred. */
  percentageNotStated?: boolean;
};

export function capturedOriginQualifications(input: {
  local: boolean;
  imported: boolean;
  multiple: boolean;
}): { originQualification?: OriginQualification; originQualifications?: OriginLocalImported[] } {
  const pair: OriginLocalImported[] = [
    ...(input.local ? (['local'] as const) : []),
    ...(input.imported ? (['imported'] as const) : []),
  ];
  if (pair.length > 0) {
    return {
      originQualifications: pair,
      ...(pair.length === 1 ? { originQualification: pair[0] } : {}),
    };
  }
  if (input.multiple) return { originQualification: 'multiple' };
  return {};
}

const CLAIM_TYPE_LABEL: Record<OriginClaimType, string> = {
  made_in: 'Made in',
  produced_in: 'Produced in',
  grown_in: 'Grown in',
  packed_in: 'Packed in',
  processed_in: 'Processed in',
  ingredient_origin: 'Ingredient origin',
  other: 'Origin',
};

const QUALIFIER_LABEL: Record<OriginPercentageQualifier, string> = {
  at_least: 'at least',
  exactly: '',
  more_than: 'more than',
  less_than: 'less than',
};

const SUPPORTED_PERCENTAGE_QUALIFIERS = new Set<string>(ORIGIN_PERCENTAGE_QUALIFIERS);

/** Supported qualifier, or unset. Does not classify an unclear percentage. */
export function supportedPercentageQualifier(
  value: string | undefined
): OriginPercentageQualifier | undefined {
  if (!value || !SUPPORTED_PERCENTAGE_QUALIFIERS.has(value)) return undefined;
  return value as OriginPercentageQualifier;
}

export function isOriginClaimType(value: string): value is OriginClaimType {
  return (ORIGIN_CLAIM_TYPES as readonly string[]).includes(value);
}

/** Build a faithful transcript from structured fields (user confirms/corrects; not forced to type full sentence). */
export function buildExactWordingFromStructured(structured: OriginStructuredEvidence): string {
  const head = `${CLAIM_TYPE_LABEL[structured.claimType]} ${structured.primaryCountry}`.trim();
  const pct = structured.ingredientOriginPercentage;
  const qualifier = supportedPercentageQualifier(structured.percentageQualifier);
  const ingredientCountry = structured.ingredientOriginCountry || structured.primaryCountry;
  if (pct != null && Number.isFinite(pct)) {
    const q = qualifier ? QUALIFIER_LABEL[qualifier] : '';
    const pctPhrase = q ? `${q} ${pct}%` : `${pct}%`;
    return `${head} from ${pctPhrase} ${ingredientCountry} ingredients`.replace(/\s+/g, ' ').trim();
  }
  if (structured.additionalOriginStatement?.trim()) {
    return `${head}. ${structured.additionalOriginStatement.trim()}`;
  }
  return head;
}

/** Trim and collapse whitespace. Case and wording stay as printed. */
export function normalizeIngredientSubject(value: string | undefined): string {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

/**
 * Comparison identity only. A trailing characterising percentage such as
 * "Strawberries (100%)" compares as "Strawberries". Stored wording is unchanged.
 */
export function characterisingIngredientIdentity(value: string | undefined): string {
  return normalizeIngredientSubject(value)
    .replace(/\s*\(\s*\d+(?:\.\d+)?\s*%\s*\)\s*$/u, '')
    .trim();
}

/** Authoritative subject identity. Percentage wording stays part of the subject. */
export function ingredientSubjectKey(value: string | undefined): string {
  return normalizeIngredientSubject(value).toLowerCase();
}

/** NOVA-1 and Origins matching only. Not a Shared Evidence Authority subject key. */
export function ingredientComparisonKey(value: string | undefined): string {
  return characterisingIngredientIdentity(value).toLowerCase();
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
