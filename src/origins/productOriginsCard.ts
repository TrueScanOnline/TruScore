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

function provenanceSupport(facts: GovernedOriginFact[]): string[] {
  const local = facts.some(factIsLocal);
  const imported = facts.some(factIsImported);
  const lines: string[] = [];
  if (local && imported) lines.push('Local & Imported ingredients');
  else if (local) lines.push('Local ingredients');
  else if (imported) lines.push('Imported ingredients');
  const ingredientCountryNamed = facts.some(
    (fact) => fact.claimType === 'ingredient_origin' && fact.countries.length > 0
  );
  if (imported && !ingredientCountryNamed) lines.push('Imported ingredient origins not specified');
  return lines;
}

/**
 * Consumer Result lines for governed origins.
 * Each country proposition stands on its own. Internal qualifiers stay off the card
 * unless they have a consumer sentence, and an unstated percentage is withheld.
 */
export function projectOriginConsumerLines(facts: GovernedOriginFact[]): OriginConsumerLine[] {
  const shared = provenanceSupport(facts);
  let sharedPlaced = false;
  const lines: OriginConsumerLine[] = [];
  for (const fact of facts) {
    const percentage = percentagePhrase(fact);
    fact.countries.forEach((country, countryIndex) => {
      const supporting: string[] = [];
      if (countryIndex === 0 && percentage) supporting.push(percentage);
      if (!sharedPlaced) {
        supporting.push(...shared);
        sharedPlaced = true;
      }
      lines.push({
        key: `${fact.evidenceId}:${fact.claimType}:${country}`,
        primary: `${countryFlagEmoji(country)} ${originFactLabel(fact.claimType)} ${country}`,
        supporting,
      });
    });
  }
  return lines;
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
