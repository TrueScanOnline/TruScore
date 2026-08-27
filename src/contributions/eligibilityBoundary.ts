/**
 * Single promotion/eligibility boundary upstream of Ethics/Open/TruScore.
 * Pending Rveel contribution fields never enter the scoring-ready Product.
 * Verified + promoted evidence may enter the existing pillar input fields only.
 */

import type { Product } from '../types/product';
import { CONTRIBUTION_POLICY } from '../config/contributionPolicy';
import type { ContributionEvidence, RveelPendingContributionFields } from './types';
import { RVEEL_PENDING_FIELD_MARK } from './types';
import { canPromoteToCanonicalProduct } from './lifecycle';

export type ProductWithContributionMark = Product & {
  [RVEEL_PENDING_FIELD_MARK]?: RveelPendingContributionFields;
  _source?: string;
  _database?: string;
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
  const database = String(product._database || '').toLowerCase();
  if (src.includes('openfoodfacts') || src.includes('sqlite') || src.includes('+')) {
    // Storage medium alone is not trust — LOCAL/BACKEND overlays still strip.
    if (overlay === 'LOCAL' || overlay === 'BACKEND') return true;
    if (database.includes('asyncstorage') || database.includes('user contrib')) return true;
    return false;
  }
  return (
    src === 'user_contributed' ||
    overlay === 'LOCAL' ||
    overlay === 'BACKEND' ||
    database.includes('asyncstorage')
  );
}

function applyPromotedCertifications(
  next: ProductWithContributionMark,
  promotedEvidence: ContributionEvidence[]
): void {
  const promotedTags = promotedEvidence
    .filter((e) => e.domain === 'certifications' && canPromoteToCanonicalProduct(e) && e.canonicalPromoted)
    .flatMap((e) => e.labelsTags || [e.claimValue || e.claimKey]);

  if (promotedTags.length > 0) {
    next.labels_tags = [...new Set([...(next.labels_tags || []), ...promotedTags])];
  }
}

function isQualifiedOrPartialOrigin(evidence: ContributionEvidence): boolean {
  const s = evidence.originStructured;
  if (!s) return false;
  if (s.ingredientOriginPercentage != null && Number.isFinite(s.ingredientOriginPercentage)) return true;
  if (s.percentageQualifier) return true;
  if (s.additionalOriginStatement?.trim()) return true;
  return false;
}

function applyPromotedOrigins(
  next: ProductWithContributionMark,
  promotedEvidence: ContributionEvidence[]
): void {
  const promotedOrigins = promotedEvidence.filter(
    (e) => e.domain === 'origins' && canPromoteToCanonicalProduct(e) && e.canonicalPromoted
  );
  if (promotedOrigins.length === 0) return;

  // Use the latest promoted evidence version for the barcode claim set.
  const chosen = promotedOrigins.reduce((a, b) => (a.updatedAt >= b.updatedAt ? a : b));
  const country =
    chosen.originStructured?.primaryCountry?.trim() ||
    chosen.claimValue.trim() ||
    chosen.claimKey;
  if (!country) return;

  // Faithful canonical Product inputs only — do not invent manufacturing_places_tags
  // (or otherwise manufacture “complete” origin) solely to obtain Open +4.
  // Qualifications remain on the evidence record (originStructured / exactWording).
  // Existing Open methodology then assigns whatever it currently assigns to that shape
  // (string-only / partial disclosure → 0 today). Source-consistent with OFF string-only origin.
  next.manufacturing_places = country;
  if (chosen.exactWording?.trim()) {
    next.origins = chosen.exactWording.trim();
  }
  if (isQualifiedOrPartialOrigin(chosen)) {
    // Explicitly avoid tag synthesis for qualified/partial claims.
    delete next.manufacturing_places_tags;
  }
}

/**
 * Product representation that pillar scoring may consume.
 * Trusted external fields stay. Standalone local contribution records cannot
 * supply nutrition, ingredients, origin, or certification tags to scoring.
 * Promoted (cross_user_eligible + policy + lane) evidence may be applied.
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
      delete (next as unknown as Record<string, unknown>)[key];
    }
  }
  if (pending?.labels || standaloneLocal) {
    next.labels_tags = undefined;
    next.labels_hierarchy = undefined;
    next.certifications = undefined;
  }

  // Wave 2 P1: unverified community evidence must not alter Body/Planet/Open via these fields
  if (standaloneLocal) {
    next.additives_tags = undefined;
    next.packagings = undefined;
    next.packaging_data = undefined;
    next.serving_size = undefined;
  }

  applyPromotedCertifications(next, promotedEvidence);
  applyPromotedOrigins(next, promotedEvidence);

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
  delete next.additives_tags;
  delete next.packagings;
  delete next.packaging_data;
  delete next.serving_size;
  return next;
}
