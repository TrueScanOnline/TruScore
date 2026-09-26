/**
 * Single promotion/eligibility boundary upstream of Ethics/Open/TruScore.
 * Pending Rveel contribution fields never enter the scoring-ready Product.
 * Verified + promoted evidence may enter the existing pillar input fields only.
 *
 * Wave 4A.0: production assessment consumption is gated by production epoch +
 * governed admission + receiver-specific eligibility. Domain-global scoringEligible
 * is not controlling.
 */

import type { Product } from '../types/product';
import { CONTRIBUTION_POLICY } from '../config/contributionPolicy';
import {
  canApplyToProductionReceiver,
  evidenceKeyOf,
  selectPrevailingAdmittedEvidence,
} from './admissionContract';
import type { ContributionEvidence, RveelPendingContributionFields } from './types';
import { RVEEL_PENDING_FIELD_MARK } from './types';
import { canPromoteToCanonicalProduct } from './lifecycle';
import { carriesCurrentProductionEpoch } from './productionEpoch';

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

/**
 * Legacy Wave 4 promotion path (pre-epoch / non-production-contract records).
 * Retained for inspection/compat only. Must not grant production authority
 * to pre-epoch records via toScoringProduct.
 */
export function isLegacyPromotable(evidence: ContributionEvidence): boolean {
  if (carriesCurrentProductionEpoch(evidence)) return false;
  return canPromoteToCanonicalProduct(evidence) && evidence.canonicalPromoted;
}

function applyPromotedCertifications(
  next: ProductWithContributionMark,
  promotedEvidence: ContributionEvidence[]
): void {
  // Only prevailing admitted production evidence per evidence key may contribute.
  // Superseded / older admitted versions must not regain precedence via union.
  const certCandidates = promotedEvidence.filter((e) => e.domain === 'certifications');
  const keysSeen = new Set<string>();
  const prevailingTags: string[] = [];

  for (const candidate of certCandidates) {
    const key = evidenceKeyOf(candidate);
    if (keysSeen.has(key)) continue;
    keysSeen.add(key);

    const prevailing = selectPrevailingAdmittedEvidence(promotedEvidence, {
      barcode: candidate.barcode,
      domain: 'certifications',
      claimKey: candidate.claimKey,
      variantKey: candidate.variantKey,
    });
    if (!prevailing) continue;
    if (!carriesCurrentProductionEpoch(prevailing)) continue;
    if (!canApplyToProductionReceiver(prevailing, 'ethics_certifications')) continue;
    prevailingTags.push(...(prevailing.labelsTags || [prevailing.claimValue || prevailing.claimKey]));
  }

  if (prevailingTags.length > 0) {
    next.labels_tags = [...new Set([...(next.labels_tags || []), ...prevailingTags])];
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
  // Prevailing-admitted-evidence contract: do not let later activity on an older
  // admitted version (or unadmitted drafts) displace the prevailing version via
  // updatedAt recency. Use selectPrevailingAdmittedEvidence per evidence key.
  const originCandidates = promotedEvidence.filter((e) => e.domain === 'origins');
  if (originCandidates.length === 0) return;

  const keysSeen = new Set<string>();
  let chosen: ContributionEvidence | null = null;

  for (const candidate of originCandidates) {
    const key = evidenceKeyOf(candidate);
    if (keysSeen.has(key)) continue;
    keysSeen.add(key);

    const prevailing = selectPrevailingAdmittedEvidence(promotedEvidence, {
      barcode: candidate.barcode,
      domain: 'origins',
      claimKey: candidate.claimKey,
      variantKey: candidate.variantKey,
    });
    if (!prevailing) continue;
    if (!carriesCurrentProductionEpoch(prevailing)) continue;
    if (!canApplyToProductionReceiver(prevailing, 'open_origins')) continue;

    // Among distinct claim keys, prefer highest evidenceVersion then admittedAt —
    // never updatedAt activity on superseded versions.
    if (!chosen) {
      chosen = prevailing;
      continue;
    }
    if (prevailing.evidenceVersion !== chosen.evidenceVersion) {
      chosen =
        prevailing.evidenceVersion > chosen.evidenceVersion ? prevailing : chosen;
      continue;
    }
    const prevAdmitted = prevailing.admission?.admittedAt ?? prevailing.updatedAt;
    const chosenAdmitted = chosen.admission?.admittedAt ?? chosen.updatedAt;
    if (prevAdmitted >= chosenAdmitted) chosen = prevailing;
  }

  if (!chosen) return;

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
 * Production-epoch admitted + receiver-eligible + promoted evidence may be applied.
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
