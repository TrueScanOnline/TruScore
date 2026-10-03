/**
 * Product Origins Result presentation.
 * Prevailing governed facts come from the existing selector.
 * A later admitted contribution for a subject is the current line.
 * Earlier source evidence for that same subject stays in history and is not drawn as current.
 */

import type { Product } from '../types/product';
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

/** Structured consumer line. Exact packet wording stays on the fact and is not repeated here. */
export function formatGovernedOriginFactLine(fact: GovernedOriginFact): string {
  return [
    originFactLabel(fact.claimType),
    fact.ingredientSubject || '',
    fact.countries.length > 0 ? fact.countries.join(', ') : '',
    fact.percentage != null
      ? `${fact.percentageQualifier ? `${fact.percentageQualifier.replace(/_/g, ' ')} ` : ''}${fact.percentage}%`
      : '',
    fact.originQualification || '',
  ]
    .filter((part) => part.length > 0)
    .join(' · ');
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
