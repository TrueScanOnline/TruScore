/**
 * Product Origins Result presentation.
 * Prevailing governed facts come from the existing 4A.3 selector.
 * OFF stays visible until that selector's display rule displaces the same subject.
 */

import type { Product } from '../types/product';
import type { GovernedOriginFact, ProductOriginsClaimType } from './governedFacts';
import { offOriginCountryForDisplay } from './offUserPrecedence';

const ORIGIN_FACT_LABELS: Record<ProductOriginsClaimType | 'processed_in', string> = {
  grown_in: 'Grown in',
  produced_in: 'Produced in',
  made_in: 'Made in',
  packed_in: 'Packed in',
  ingredient_origin: 'Ingredient origin',
  processed_in: 'Processed in',
};

export function originFactLabel(claimType: GovernedOriginFact['claimType']): string {
  return ORIGIN_FACT_LABELS[claimType];
}

export function productOriginsCardPresentation(product: Product): {
  facts: GovernedOriginFact[];
  offCountry: string | null;
  limitedConfidence: boolean;
} {
  const facts = product.rveelGovernedOrigins || [];
  return {
    facts,
    offCountry: offOriginCountryForDisplay(product, facts),
    limitedConfidence: facts.some((fact) => fact.confidence === 'limited'),
  };
}
