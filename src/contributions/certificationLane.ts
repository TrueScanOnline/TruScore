/**
 * Lane A = currently Ethics-scoring-recognised certification schemes.
 * Lane B = other claims/standards that may be governed but do not score.
 *
 * Reuses the existing Ethics evaluator — no alternate scoring table.
 */

import type { Product } from '../types/product';
import {
  ETHICS_CERTIFICATION_WEIGHTS,
  evaluateEthicsCertifications,
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
  return tags.length > 0 ? tags : undefined;
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
