/**
 * MVP User-Attested Packet Absence (FM-03R).
 * Photo-free declaration that no relevant claims/certifications assessed by RVEEL
 * appear on the packet. Not photograph-verified. Not independently corroborated.
 */

import { sha256Hex } from '../packetContribution/sha256';

export const PACKET_ABSENCE_USER_ATTESTATION_CONTENT_TYPE = 'packet_absence_user_attestation_v1';

export const PACKET_ABSENCE_ATTESTATION_DECLARATION =
  'no_relevant_claims_or_certifications_on_packet' as const;

export type PacketAbsenceAttestationDraft = {
  barcode: string;
  variantKey?: string;
};

export type PacketAbsenceAttestationDocument = {
  sourceKind: typeof PACKET_ABSENCE_USER_ATTESTATION_CONTENT_TYPE;
  barcode: string;
  variantKey: string;
  declaration: typeof PACKET_ABSENCE_ATTESTATION_DECLARATION;
  attestationScope: 'whole_packet';
};

function encodeDocument(document: PacketAbsenceAttestationDocument): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(document));
}

/** Deterministic attestation document. Null when the barcode is empty. */
export function buildPacketAbsenceAttestationDocument(
  draft: PacketAbsenceAttestationDraft
): PacketAbsenceAttestationDocument | null {
  const barcode = draft.barcode.trim();
  if (!barcode) return null;
  return {
    sourceKind: PACKET_ABSENCE_USER_ATTESTATION_CONTENT_TYPE,
    barcode,
    variantKey: (draft.variantKey || '').trim(),
    declaration: PACKET_ABSENCE_ATTESTATION_DECLARATION,
    attestationScope: 'whole_packet',
  };
}

export function packetAbsenceAttestationSha256(
  draft: PacketAbsenceAttestationDraft
): { document: PacketAbsenceAttestationDocument; bytes: Uint8Array; sha256: string } | null {
  const document = buildPacketAbsenceAttestationDocument(draft);
  if (!document) return null;
  const bytes = encodeDocument(document);
  return { document, bytes, sha256: sha256Hex(bytes) };
}

export function parsePacketAbsenceAttestationDocument(
  bytes: Uint8Array | null | undefined
): PacketAbsenceAttestationDocument | null {
  if (!bytes || bytes.length === 0) return null;
  try {
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as Partial<PacketAbsenceAttestationDocument>;
    if (parsed.sourceKind !== PACKET_ABSENCE_USER_ATTESTATION_CONTENT_TYPE) return null;
    if (typeof parsed.barcode !== 'string' || !parsed.barcode.trim()) return null;
    if (parsed.declaration !== PACKET_ABSENCE_ATTESTATION_DECLARATION) return null;
    if (parsed.attestationScope !== 'whole_packet') return null;
    if (typeof parsed.variantKey !== 'string') return null;
    return {
      sourceKind: PACKET_ABSENCE_USER_ATTESTATION_CONTENT_TYPE,
      barcode: parsed.barcode.trim(),
      variantKey: parsed.variantKey.trim(),
      declaration: PACKET_ABSENCE_ATTESTATION_DECLARATION,
      attestationScope: 'whole_packet',
    };
  } catch {
    return null;
  }
}

/** True when the finalized attestation asset may back this absence-only fact group. */
export function packetAbsenceAttestationSubmissionMatches(input: {
  document: PacketAbsenceAttestationDocument;
  barcode: string;
  variantKey?: string;
  inputs: Array<{ packetAbsence?: boolean; domain?: string }>;
}): boolean {
  if (input.document.barcode !== input.barcode.trim()) return false;
  const expectedVariant = (input.variantKey || '').trim();
  if (input.document.variantKey !== expectedVariant) return false;
  if (input.inputs.length === 0) return false;
  return input.inputs.every(
    (fact) => fact.domain === 'packet_claims' && fact.packetAbsence === true
  );
}

/** Stable client idempotency key for one contributor attestation intent on a barcode. */
export function claimsAbsenceAttestationIdempotencyKey(barcode: string, contributorId: string): string {
  return `claims_absence_attestation_v1:${barcode.trim()}:${contributorId.trim()}`;
}
