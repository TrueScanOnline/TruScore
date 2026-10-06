/**
 * Lane A = currently Ethics-scoring-recognised certification schemes.
 * Lane B = other claims/standards that may be governed but do not score.
 *
 * Reuses the existing Ethics evaluator — no alternate scoring table.
 */

import type { Product } from '../types/product';
import {
  ETHICS_CERTIFICATION_WEIGHTS,
  ETHICS_ORGANIC_TAG_ALLOWLIST,
  evaluateEthicsCertifications,
  normalizeEthicsOrganicText,
  recognisedOrganicCertificationTag,
} from '../services/ethicsCertificationsService';

export type CertificationLane = 'A' | 'B';

export function resolveCertificationLane(params: {
  labelsTags?: string[];
  claimValue?: string;
}): CertificationLane {
  const product = {
    barcode: 'lane-check',
    labels_tags: params.labelsTags || [],
    product_name: params.claimValue || '',
  } as Product;
  const evaluation = evaluateEthicsCertifications(product);
  const hasScoringScheme = evaluation.eligibleSchemes.some(
    (scheme) => ETHICS_CERTIFICATION_WEIGHTS[scheme] > 0
  );
  return hasScoringScheme ? 'A' : 'B';
}

const GOVERNED_SCHEME_TAGS: Record<string, string> = {
  fairtrade: 'en:fair-trade',
  rainforest_alliance: 'en:rainforest-alliance',
  asc: 'en:asc',
  msc: 'en:marine-stewardship-council',
  organic: 'en:organic',
};

/**
 * Existing Ethics schemes only. Unmapped wording stays reviewed evidence without a scoring tag.
 */
export function governedCertificationLabels(statement: string): string[] | undefined {
  const trimmed = statement.trim();
  if (!trimmed) return undefined;
  const evaluation = evaluateEthicsCertifications({
    barcode: 'cert-map',
    product_name: trimmed,
    labels_tags: [],
  } as Product);
  const tags = evaluation.eligibleSchemes
    .map((scheme) => GOVERNED_SCHEME_TAGS[scheme])
    .filter((tag): tag is string => typeof tag === 'string' && tag.length > 0);
  const organicTag = recognisedOrganicCertificationTag(trimmed);
  if (organicTag && !tags.includes(organicTag)) tags.push(organicTag);
  return tags.length > 0 ? tags : undefined;
}

/** Whole-product Organic claim. Ingredient or partial organic wording stays visible. */
export function isWholeProductOrganicClaim(wording: string): boolean {
  const normalized = normalizeEthicsOrganicText(wording);
  return normalized === 'organic' || normalized === '100 organic';
}

type OrganicCertificationCarrier = {
  domain?: string;
  state?: string;
  exactWording?: string;
  claimValue?: string;
  labelsTags?: string[];
};

/** Current recognised Organic certification. Withdrawn rows do not qualify. */
export function qualifyingOrganicCertificationGoverns(evidence: OrganicCertificationCarrier[]): boolean {
  return evidence.some((row) => {
    if (row.domain !== 'certifications') return false;
    if (row.state === 'withdrawn' || row.state === 'superseded') return false;
    const wording = (row.exactWording || row.claimValue || '').trim();
    if (wording && recognisedOrganicCertificationTag(wording)) return true;
    return (row.labelsTags || []).some((tag) => ETHICS_ORGANIC_TAG_ALLOWLIST.has(String(tag).trim().toLowerCase()));
  });
}

export function organicCertificationTags(evidence: OrganicCertificationCarrier[]): string[] {
  const tags: string[] = [];
  for (const row of evidence) {
    if (row.domain !== 'certifications') continue;
    if (row.state === 'withdrawn' || row.state === 'superseded') continue;
    const wording = (row.exactWording || row.claimValue || '').trim();
    const recognised = wording ? recognisedOrganicCertificationTag(wording) : undefined;
    if (recognised) tags.push(recognised);
    for (const tag of row.labelsTags || []) {
      const normalized = String(tag).trim().toLowerCase();
      if (ETHICS_ORGANIC_TAG_ALLOWLIST.has(normalized)) tags.push(normalized);
    }
  }
  return [...new Set(tags)];
}

export function isLaneACertificationEvidence(params: {
  labelsTags?: string[];
  claimValue?: string;
  certificationLane?: CertificationLane;
}): boolean {
  if (params.certificationLane === 'A') return true;
  if (params.certificationLane === 'B') return false;
  return resolveCertificationLane(params) === 'A';
}
