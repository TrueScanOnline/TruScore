/**
 * Product Origins Result presentation.
 * Prevailing governed facts come from the existing selector.
 * A later admitted contribution for a subject is the current line.
 * Earlier source evidence for that same subject stays in history and is not drawn as current.
 */

import type { Product } from '../types/product';
import { countryFlagEmoji } from '../utils/countryFlagEmoji';
import { COUNTRIES } from '../utils/countries';
import { isRecognizedOriginCountry, originCountryKey } from '../lib/truscoreEngine/pillars/openPillarOriginsV15';
import type { GovernedOriginFact, ProductOriginsClaimType } from './governedFacts';

const ORIGIN_FACT_LABELS: Record<ProductOriginsClaimType | 'processed_in', string> = {
  grown_in: 'Grown in',
  produced_in: 'Product of',
  made_in: 'Made in',
  packed_in: 'Packed in',
  ingredient_origin: 'Ingredient from',
  processed_in: 'Processed in',
};

export function originFactLabel(claimType: GovernedOriginFact['claimType']): string {
  return ORIGIN_FACT_LABELS[claimType];
}

export type OriginConsumerLine = {
  key: string;
  primary: string;
  supporting: string[];
  /** Country name for the flag lockup. The primary sentence stays unchanged. */
  country: string;
  statement: string;
  /** Free text the contributor typed from the pack. Empty when they left that box blank. */
  packWording: string;
};

function factIsLocal(fact: GovernedOriginFact): boolean {
  return fact.originQualification === 'local' || fact.originQualifications?.includes('local') === true;
}

function factIsImported(fact: GovernedOriginFact): boolean {
  return fact.originQualification === 'imported' || fact.originQualifications?.includes('imported') === true;
}

function percentagePhrase(fact: GovernedOriginFact): string | null {
  if (fact.percentage == null) return null;
  const qualifier =
    fact.percentageQualifier === 'at_least'
      ? 'at least '
      : fact.percentageQualifier === 'more_than'
        ? 'more than '
        : fact.percentageQualifier === 'less_than'
          ? 'less than '
          : '';
  return `${qualifier}${fact.percentage}%`;
}

function provenanceSupport(fact: GovernedOriginFact, ingredientCountryNamed: boolean): string[] {
  const local = factIsLocal(fact);
  const imported = factIsImported(fact);
  const lines: string[] = [];
  if (local && imported) lines.push('Local & Imported ingredients');
  else if (local) lines.push('Local ingredients');
  else if (imported) lines.push('Imported ingredients');
  if (imported && !ingredientCountryNamed) lines.push('Imported ingredient origins not specified');
  return lines;
}

/**
 * Consumer Result lines for governed origins.
 * Each country proposition stands on its own. Internal qualifiers stay off the card
 * unless they have a consumer sentence, and an unstated percentage is withheld.
 */
export function projectOriginConsumerLines(facts: GovernedOriginFact[]): OriginConsumerLine[] {
  const ingredientCountryNamed = facts.some(
    (fact) => fact.claimType === 'ingredient_origin' && fact.countries.length > 0
  );
  const lines: OriginConsumerLine[] = [];
  for (const fact of facts) {
    const percentage = percentagePhrase(fact);
    const provenance = provenanceSupport(fact, ingredientCountryNamed);
    const packWording = (fact.exactWording || '').trim();
    fact.countries.forEach((country) => {
      lines.push({
        key: `${fact.evidenceId}:${fact.claimType}:${country}`,
        primary: `${countryFlagEmoji(country)} ${originFactLabel(fact.claimType)} ${country}`,
        supporting: [...(percentage ? [percentage] : []), ...provenance],
        country,
        statement: originFactLabel(fact.claimType),
        packWording,
      });
    });
  }
  return lines;
}

/**
 * Presentation-only: split an existing continuation so a percentage phrase can be
 * emphasised typographically without changing wording.
 */
export function splitOriginContinuationForEmphasis(sentence: string): {
  prefix: string;
  emphasis: string | null;
  suffix: string;
} {
  const match = sentence.match(
    /^(With\s+)((?:at least |exactly |more than |less than )?\d+(?:\.\d+)?)(%)(\s.*)?$/i
  );
  if (!match) {
    return { prefix: sentence, emphasis: null, suffix: '' };
  }
  return {
    prefix: match[1],
    emphasis: `${match[2]}${match[3]}`,
    suffix: match[4] ?? '',
  };
}

/**
 * Presentation-only: turns existing consumer supporting phrases into one readable
 * continuation under the flag+country lockup. Does not invent percentages or sources.
 */
export function originConsumerContinuationSentence(supporting: string[]): string | null {
  const items = supporting.map((item) => item.trim()).filter((item) => item.length > 0);
  if (items.length === 0) return null;

  const SOURCE_MAP: Record<string, string> = {
    'Local & Imported ingredients': 'local and imported ingredients',
    'Local ingredients': 'local ingredients',
    'Imported ingredients': 'imported ingredients',
  };
  const UNSPECIFIED = 'Imported ingredient origins not specified';

  let percentage: string | null = null;
  let source: string | null = null;
  const trailing: string[] = [];

  for (const item of items) {
    if (SOURCE_MAP[item]) {
      source = SOURCE_MAP[item];
      continue;
    }
    if (item === UNSPECIFIED) {
      trailing.push(`${UNSPECIFIED}.`);
      continue;
    }
    // Existing percentage phrases from percentagePhrase() — e.g. "at least 98%", "more than 79%".
    if (percentage == null && /\d/.test(item) && item.includes('%')) {
      percentage = item;
      continue;
    }
    trailing.push(item.endsWith('.') ? item : `${item}.`);
  }

  const parts: string[] = [];
  if (percentage && source) parts.push(`With ${percentage} ${source}.`);
  else if (percentage) parts.push(`With ${percentage}.`);
  else if (source) parts.push(`With ${source}.`);
  parts.push(...trailing);
  return parts.length > 0 ? parts.join(' ') : null;
}

type SourceOrigin = { subjectKey: string; country: string };

function recognisedCountryName(value: string): string | null {
  if (!isRecognizedOriginCountry(value)) return null;
  const key = originCountryKey(value);
  return COUNTRIES.find((country) => originCountryKey(country.name) === key)?.name ?? null;
}

/** Source origin still current only when no prevailing contribution owns that subject. */
function currentSourceOrigin(product: Product, facts: GovernedOriginFact[]): SourceOrigin | null {
  const manufacturingTag = product.manufacturing_places_tags?.find((tag) => typeof tag === 'string' && tag.trim());
  const manufacturing =
    (manufacturingTag && recognisedCountryName(manufacturingTag)) ||
    (typeof product.manufacturing_places === 'string' ? recognisedCountryName(product.manufacturing_places) : null);
  if (manufacturing) {
    return facts.some((fact) => fact.subjectKey === 'made_in' || fact.claimType === 'made_in')
      ? null
      : { subjectKey: 'made_in', country: manufacturing };
  }
  const originTag = product.origins_tags?.find((tag) => typeof tag === 'string' && recognisedCountryName(tag));
  const origin =
    (originTag && recognisedCountryName(originTag)) ||
    (typeof product.origins === 'string' ? recognisedCountryName(product.origins) : null);
  if (!origin) return null;
  const superseded = facts.some(
    (fact) => fact.claimType === 'ingredient_origin' || fact.subjectKey.startsWith('ingredient_origin:')
  );
  return superseded ? null : { subjectKey: 'ingredient_origin', country: origin };
}

export function productOriginsCardPresentation(product: Product): {
  facts: GovernedOriginFact[];
  offCountry: string | null;
  limitedConfidence: boolean;
} {
  const facts = product.rveelGovernedOrigins || [];
  return {
    facts,
    offCountry: currentSourceOrigin(product, facts)?.country ?? null,
    limitedConfidence: facts.some((fact) => fact.confidence === 'limited'),
  };
}
