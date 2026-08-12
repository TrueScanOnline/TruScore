/**
 * Single promotion/eligibility boundary upstream of Ethics/Open/TruScore.
 * Pending Rveel contribution fields never enter the scoring-ready Product.
 */

import type { Product } from '../types/product';
import { CONTRIBUTION_POLICY } from '../config/contributionPolicy';
import type { ContributionEvidence, RveelPendingContributionFields } from './types';
import { RVEEL_PENDING_FIELD_MARK } from './types';
import { canPromoteToCanonicalProduct } from './lifecycle';

export type ProductWithContributionMark = Product & {
  [RVEEL_PENDING_FIELD_MARK]?: RveelPendingContributionFields;
  _source?: string;
};

const USER_ORIGIN_KEYS = [
  'manufacturing_places',
  'manufacturing_places_tags',
  'countries',
  'countries_tags',
  'origins',
  'origins_tags',
] as const;

function isStandaloneLocalContribution(product: ProductWithContributionMark): boolean {
  const src = String(product.source || '');
  const overlay = String(product._source || '');
  if (src.includes('openfoodfacts') || src.includes('sqlite') || src.includes('+')) return false;
  return src === 'user_contributed' || overlay === 'LOCAL';
}

/**
 * Product representation that pillar scoring may consume.
 * Trusted external fields stay. Standalone local contribution records cannot
 * supply nutrition, ingredients, origin, or certification tags to scoring.
 * Promoted (cross_user_eligible + policy) certification tags may be unioned.
 */
export function toScoringProduct(
  product: Product | null | undefined,
  promotedEvidence: ContributionEvidence[] = []
): Product | null | undefined {
  if (!product || typeof product !== 'object') return product;

  const marked = product as ProductWithContributionMark;
  const pending = marked[RVEEL_PENDING_FIELD_MARK];
  const standaloneLocal = isStandaloneLocalContribution(marked);
  const next: ProductWithContributionMark = { ...marked };

  if (pending?.nutrition || standaloneLocal) {
    if (!CONTRIBUTION_POLICY.ingredientsNutrition.canonicalScoringFromLocalContribution) {
      next.nutriments = standaloneLocal ? undefined : next.nutriments;
    }
  }
  if (pending?.ingredients || standaloneLocal) {
    if (!CONTRIBUTION_POLICY.ingredientsNutrition.canonicalScoringFromLocalContribution) {
      if (standaloneLocal) {
        next.ingredients_text = undefined;
        next.ingredients = undefined;
      }
    }
  }
  if (pending?.origin || standaloneLocal) {
    for (const key of USER_ORIGIN_KEYS) {
      delete (next as Record<string, unknown>)[key];
    }
  }
  if (pending?.labels || standaloneLocal) {
    next.labels_tags = undefined;
    next.labels_hierarchy = undefined;
    next.certifications = undefined;
  }

  const promotedTags = promotedEvidence
    .filter((e) => canPromoteToCanonicalProduct(e) && e.canonicalPromoted)
    .flatMap((e) => e.labelsTags || (e.domain === 'certifications' ? [e.claimKey] : []));

  if (promotedTags.length > 0) {
    next.labels_tags = [...new Set([...(next.labels_tags || []), ...promotedTags])];
  }

  delete next[RVEEL_PENDING_FIELD_MARK];
  return next;
}

export function markPendingContributionFields(
  product: Product,
  fields: RveelPendingContributionFields
): ProductWithContributionMark {
  return {
    ...product,
    [RVEEL_PENDING_FIELD_MARK]: {
      ...((product as ProductWithContributionMark)[RVEEL_PENDING_FIELD_MARK] || {}),
      ...fields,
    },
  };
}

/** Remove scoring-ready origin/cert/nutrition keys from a contribution overlay. */
export function stripUnauthoredScoringFieldsFromContribution(product: Product): Product {
  const next = { ...product } as Product;
  delete next.manufacturing_places;
  delete next.manufacturing_places_tags;
  delete next.countries;
  delete next.countries_tags;
  delete next.origins;
  delete next.origins_tags;
  delete next.labels_tags;
  delete next.labels_hierarchy;
  delete next.certifications;
  if (!CONTRIBUTION_POLICY.ingredientsNutrition.localSubmittedEvidenceCrossUserScoring) {
    delete next.nutriments;
    delete next.ingredients_text;
    delete next.ingredients;
  }
  return next;
}
