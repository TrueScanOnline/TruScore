/**
 * Derive admitted packet observations for Claims assessment from product + optional explicit admissions.
 *
 * Evidence model (founder clarification):
 * - Use governed evidence already available (OFF product name Set O; OFF labels/labels_en for A/B/C/O).
 * - Fail closed = do not invent/misapply facts — not "ignore OFF until user photographs the packet".
 * - Never record OFF evidence as user_confirmation.
 * - display_text is not escaped here — single-pass escape happens in matchRegister from observed_text.
 */

import type { Product } from '../../../types/product';
import { evaluateOrganicClaimOnlyCandidate } from '../../../services/ethicsCertificationsService';
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

function admitOffLabelField(
  observations: AdmittedPacketObservation[],
  seenLabelNorm: Set<string>,
  raw: string | undefined | null,
  field: 'labels' | 'labels_en',
  barcode: string
): void {
  for (const chunk of splitOffLabelStatements(raw)) {
    const key = `${field}:${chunk.toLowerCase()}`;
    if (seenLabelNorm.has(key)) continue;
    seenLabelNorm.add(key);
    observations.push({
      evidence_id: `off-${field}:${barcode}:${seenLabelNorm.size}`,
      observed_text: chunk,
      // Immutable observed wording mirrored until matchRegister escapes once.
      display_text: chunk,
      admission_method: 'off_labels',
      source_locator: field === 'labels' ? 'off:labels' : 'off:labels_en',
      is_product_name: false,
    });
  }
}

/**
 * Build observations for the Claims Machine Register.
 * @param explicitAdmissions — packet_image / ocr_crop / user_confirmation / NIP-marked (optional)
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

  // OFF labels / labels_en — legitimate claim-bearing evidence; preserve field in source_locator
  const seenLabelNorm = new Set<string>();
  admitOffLabelField(observations, seenLabelNorm, product.labels, 'labels', barcode);
  admitOffLabelField(observations, seenLabelNorm, product.labels_en, 'labels_en', barcode);

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
        display_text: claimOnly.observedText,
        admission_method: 'governed_product_name',
        is_product_name: true,
        source_locator: 'off:product_name',
      });
    }
  }

  const packetCoverageState: PacketCoverageState = options?.packetCoverageState ?? 'incomplete';

  return { observations, packetCoverageState };
}
