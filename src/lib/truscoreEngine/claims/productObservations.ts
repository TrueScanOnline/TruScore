/**
 * Derive admitted packet observations for Claims assessment from product + optional explicit admissions.
 *
 * REG-03 / Evidence admission minimum (controlling spec §4.1):
 * A recognised expression is not scoreable until its packet observation is admitted through an
 * approved evidence path retaining: evidence ID, product/GTIN binding, observed text, display text,
 * admission state, register-row binding (after match), and source locator.
 *
 * Upstream dependency (fail-closed until connected):
 * No approved live producer currently emits Set A/B `AdmittedPacketObservation` records into the
 * production TruScore path. `photoOcrService` is a stub; contribution domains are origins/certifications
 * only; typed admission methods `packet_image` / `ocr_crop` / `user_confirmation` exist on the Claims
 * contract but have no production feeder. Callers must supply `explicitAdmissions` (and typically
 * `packetCoverageState: 'complete'`) via `CalculateEthicsPillarOptions` once an approved producer exists.
 *
 * Set O may use governed product name / claim-only organic wording without Set A/B admissions.
 * Without explicit complete packet coverage, Packet Claim Context and assessed_neutral fail closed.
 */

import type { Product } from '../../../types/product';
import { evaluateOrganicClaimOnlyCandidate } from '../../../services/ethicsCertificationsService';
import type { AdmittedPacketObservation, PacketCoverageState } from './types';

export interface ClaimsProductObservationBundle {
  observations: AdmittedPacketObservation[];
  packetCoverageState: PacketCoverageState;
}

/**
 * Build observations for the Claims Machine Register.
 * @param explicitAdmissions — OCR/user-confirmed packet statements (required for Set A/B scoring)
 * @param packetCoverageState — must be `complete` for assessed_neutral
 */
export function buildClaimsObservationsFromProduct(
  product: Product,
  options?: {
    explicitAdmissions?: AdmittedPacketObservation[];
    packetCoverageState?: PacketCoverageState;
  }
): ClaimsProductObservationBundle {
  const observations: AdmittedPacketObservation[] = [...(options?.explicitAdmissions ?? [])];

  // Governed product-name Organic (O-ORG-002) / claim-only path
  const claimOnly = evaluateOrganicClaimOnlyCandidate(product);
  if (claimOnly.matched && claimOnly.observedText) {
    const already = observations.some(
      (o) => o.observed_text.toLowerCase().includes('organic') && o.is_product_name
    );
    if (!already) {
      observations.push({
        evidence_id: `organic-claim-only:${product.barcode || 'unknown'}`,
        observed_text: claimOnly.source === 'product_name' ? claimOnly.observedText : 'organic',
        display_text: claimOnly.source === 'product_name' ? claimOnly.observedText : 'organic',
        admission_method:
          claimOnly.source === 'product_name' ? 'governed_product_name' : 'user_confirmation',
        is_product_name: claimOnly.source === 'product_name',
        source_locator: claimOnly.source,
      });
    }
  }

  // Without an explicit complete packet gate, coverage remains incomplete (fail closed for assessed_neutral).
  const packetCoverageState: PacketCoverageState =
    options?.packetCoverageState ??
    (options?.explicitAdmissions && options.explicitAdmissions.length > 0
      ? 'incomplete'
      : 'incomplete');

  return { observations, packetCoverageState };
}
