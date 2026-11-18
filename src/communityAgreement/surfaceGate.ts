/**
 * WP09-R1 — Settlement gate for Community Agreement Agree visibility.
 *
 * Agree requires only Result latch + barcode match (publication settled Rated|NR).
 * Correct (thumbs-down) still requires an eligible Change journey — that is checked
 * separately via eligibleAgreementChangeJourney so MVP preselected-only (free-form
 * Change offline) cannot hide Agree. Founder register 2026-11-18: keep Agree;
 * Correct/free-form Change remains contained under preselected-only.
 */

import { getPrimaryBarcode } from '../utils/barcodeNormalization';
import type { Product } from '../types/product';
import {
  eligibleAgreementChangeJourney,
  type AgreementChangeDestination,
} from './changeJourney';
import type { CommunityAgreementGroup } from './types';

export type AgreementSurfaceGateOptions = {
  publicationSettled: boolean;
  /** Barcode for which publicationSettled was latched. */
  settledBarcode?: string | null;
  /** Barcode currently open on Result. */
  currentBarcode?: string | null;
};

export type AgreementSurfaceGateResult =
  | {
      ok: true;
      /** Change destination when Correct is eligible; null when Agree-only. */
      destination: AgreementChangeDestination | null;
    }
  | {
      ok: false;
      reason: 'latch_closed' | 'barcode_mismatch' | 'product_mismatch' | 'no_product';
    };

function publicationAllowsAgreement(product: Product): boolean {
  const publication = product._publication;
  if (!publication || publication.settled !== true) return false;
  const overall = publication.overall?.publicationStatus;
  if (overall !== 'rated' && overall !== 'nr') return false;
  const pillarStatuses = [
    publication.body?.publicationStatus,
    publication.planet?.publicationStatus,
    publication.claims?.publicationStatus,
    publication.transparency?.publicationStatus,
  ];
  if (!pillarStatuses.every((status) => status === 'rated' || status === 'nr')) return false;
  if (
    !publication.body?.assessmentLanes ||
    !publication.claims?.assessmentLanes ||
    !publication.transparency?.assessmentLanes
  ) {
    return false;
  }
  return true;
}

/**
 * Fail closed unless:
 * - Result latch is open (publicationSettled)
 * - Settled barcode matches the open Result barcode and product
 * - Overall + every pillar is Rated|NR with assessment lanes (WP09-R1)
 *
 * Change eligibility is optional: when present, destination is set for Correct.
 * Agree does not require free-form Change (founder register 2026-11-18).
 */
export function agreementSurfaceGate(
  group: CommunityAgreementGroup,
  product: Product | null | undefined,
  options: AgreementSurfaceGateOptions
): AgreementSurfaceGateResult {
  if (options.publicationSettled !== true) {
    return { ok: false, reason: 'latch_closed' };
  }
  if (!product?.barcode) {
    return { ok: false, reason: 'no_product' };
  }
  const current = options.currentBarcode ? getPrimaryBarcode(options.currentBarcode) : null;
  const settled = options.settledBarcode ? getPrimaryBarcode(options.settledBarcode) : null;
  const productCode = getPrimaryBarcode(product.barcode);
  if (!current || !settled || current !== settled) {
    return { ok: false, reason: 'barcode_mismatch' };
  }
  if (productCode !== current) {
    return { ok: false, reason: 'product_mismatch' };
  }
  if (!publicationAllowsAgreement(product)) {
    return { ok: false, reason: 'latch_closed' };
  }
  const change = eligibleAgreementChangeJourney(group, product, { publicationSettled: true });
  return { ok: true, destination: change.ok ? change.destination : null };
}
