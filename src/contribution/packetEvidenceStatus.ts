/**
 * Shared Packet Claims / Claims-pillar evidence presentation.
 * Reads only the governed product projection — never invents absence from empty lists,
 * score 15, empty Highlights, OFF silence, unsent UI, or pending submissions.
 */

import type { Product } from '../types/product';
import { PACKET_ABSENCE_PRODUCT_STATE } from './resultContributionActions';

export type PacketEvidenceStatus =
  | { kind: 'absence_established'; consumerCopy: typeof PACKET_ABSENCE_PRODUCT_STATE }
  | { kind: 'positive_governed'; claimCount: number; certificationCount: number }
  | { kind: 'none' };

/** Concise attribution — admitted contribution, not independent physical verification. */
export const PACKET_ABSENCE_ATTRIBUTION =
  'Admitted contributor packet observation. Not independently verified by Rveel.';

export function packetEvidenceStatus(
  product: Pick<
    Product,
    'rveelPacketAbsenceEstablished' | 'rveelGovernedPacketClaims' | 'rveelGovernedCertifications'
  > | null | undefined
): PacketEvidenceStatus {
  if (!product) return { kind: 'none' };
  if (product.rveelPacketAbsenceEstablished === true) {
    return { kind: 'absence_established', consumerCopy: PACKET_ABSENCE_PRODUCT_STATE };
  }
  const claimCount = (product.rveelGovernedPacketClaims || []).length;
  const certificationCount = (product.rveelGovernedCertifications || []).length;
  if (claimCount > 0 || certificationCount > 0) {
    return { kind: 'positive_governed', claimCount, certificationCount };
  }
  return { kind: 'none' };
}

/** Principal consumer line for card + Claims pillar; null when nothing to show. */
export function packetEvidenceStatusConsumerLine(
  product: Parameters<typeof packetEvidenceStatus>[0]
): string | null {
  const status = packetEvidenceStatus(product);
  return status.kind === 'absence_established' ? status.consumerCopy : null;
}
