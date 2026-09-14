/**
 * Derive admitted packet observations for Claims assessment from product + optional explicit admissions.
 *
 * Evidence model (founder clarification):
 * - Use governed evidence already available (OFF product name Set O; OFF labels/labels_en for A/B/C/O).
 * - Fail closed = do not invent/misapply facts — not "ignore OFF until user photographs the packet".
 * - Never record OFF evidence as user_confirmation.
 */

import type { Product } from '../../../types/product';
import { evaluateOrganicClaimOnlyCandidate } from '../../../services/ethicsCertificationsService';
import { toDisplaySafeClaimText } from './normalize';
import type { AdmittedPacketObservation, PacketCoverageState } from './types';

export interface ClaimsProductObservationBundle {
  observations: AdmittedPacketObservation[];
  packetCoverageState: PacketCoverageState;
}

function splitOffLabelStatements(raw: string | undefined | null): string[] {
  if (!raw || !String(raw).trim()) return [];
  return String(raw)
    .split(/[,;\n|]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Build observations for the Claims Machine Register.
 * @param explicitAdmissions — packet_image / ocr_crop / user_confirmation (optional)
 * @param packetCoverageState — orthogonal to assessment_state; incomplete may still be assessed_scored
 */
export function buildClaimsObservationsFromProduct(
  product: Product,
  options?: {
    explicitAdmissions?: AdmittedPacketObservation[];
    packetCoverageState?: PacketCoverageState;
  }
): ClaimsProductObservationBundle {
  const observations: AdmittedPacketObservation[] = [...(options?.explicitAdmissions ?? [])];
  const barcode = product.barcode || 'unknown';

  // OFF labels / labels_en — legitimate claim-bearing evidence (A/B/C/O within scope)
  const labelChunks = [
    ...splitOffLabelStatements(product.labels),
    ...splitOffLabelStatements(product.labels_en),
  ];
  const seenLabelNorm = new Set<string>();
  for (const chunk of labelChunks) {
    const key = chunk.toLowerCase();
    if (seenLabelNorm.has(key)) continue;
    seenLabelNorm.add(key);
    observations.push({
      evidence_id: `off-labels:${barcode}:${seenLabelNorm.size}`,
      observed_text: chunk,
      display_text: toDisplaySafeClaimText(chunk),
      admission_method: 'off_labels',
      source_locator: 'off_labels',
      is_product_name: false,
    });
  }

  // Governed product-name Organic (Set O only — never indiscriminate A/B catalogue scan)
  const claimOnly = evaluateOrganicClaimOnlyCandidate(product);
  if (claimOnly.matched && claimOnly.observedText && claimOnly.source === 'product_name') {
    const already = observations.some(
      (o) =>
        o.admission_method === 'governed_product_name' &&
        o.is_product_name === true &&
        o.observed_text.toLowerCase() === claimOnly.observedText!.toLowerCase()
    );
    if (!already) {
      observations.push({
        evidence_id: `organic-claim-only-name:${barcode}`,
        observed_text: claimOnly.observedText,
        display_text: toDisplaySafeClaimText(claimOnly.observedText),
        admission_method: 'governed_product_name',
        is_product_name: true,
        source_locator: 'product_name',
      });
    }
  }
  // Label-path organic is already covered by off_labels admissions above; do not mis-tag as user_confirmation.

  const packetCoverageState: PacketCoverageState = options?.packetCoverageState ?? 'incomplete';

  return { observations, packetCoverageState };
}
