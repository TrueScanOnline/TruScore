/**
 * WP09-R1 — Settlement gate for the whole Community Agreement surface.
 * Agree and Correct are unavailable unless the Result latch and Change journey allow it.
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
  | { ok: true; destination: AgreementChangeDestination }
  | {
      ok: false;
      reason:
        | 'latch_closed'
        | 'barcode_mismatch'
        | 'product_mismatch'
        | 'change_ineligible'
        | 'no_product';
    };

/**
 * Fail closed unless:
 * - Result latch is open (publicationSettled)
 * - Settled barcode matches the open Result barcode and product
 * - voluntaryContributionOffer Change journey is eligible
 *   (Overall Rated|NR, every pillar Rated|NR, settled publication)
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
  const change = eligibleAgreementChangeJourney(group, product, { publicationSettled: true });
  if (!change.ok) {
    return { ok: false, reason: 'change_ineligible' };
  }
  return { ok: true, destination: change.destination };
}
