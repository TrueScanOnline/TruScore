/**
 * One pending list for typed packet wording and a deliberately selected certification.
 * Machine proposals can be added to the same list. Nothing here admits evidence.
 */

import { displayNameForCertification, resolvePacketObservation } from './resolveCertification';
import { normalizeDiscoveryQuery, type DiscoverySuggestion } from './discoveryCatalogue';

export const PACKET_INPUT_INSTRUCTION = 'Add claims or certification marks shown on the pack.';
export const PACKET_WORDING_FIELD = 'Type what you see on the pack';
export const PACKET_ADD_WORDING = 'Add wording from pack';
export const PACKET_ADD_ANOTHER = 'Add another';

export type PendingObservationSource = 'manual' | 'machine_proposal';

export type PendingPacketObservation = {
  localId: string;
  literalWording: string;
  source: PendingObservationSource;
  /** Set only after a deliberate selection of a selectable_existing production identity. */
  productionCertificationId?: string;
  canonicalName?: string;
};

export function samePendingObservation(left: PendingPacketObservation, right: Pick<PendingPacketObservation, 'literalWording' | 'productionCertificationId'>): boolean {
  return (
    normalizeDiscoveryQuery(left.literalWording) === normalizeDiscoveryQuery(right.literalWording) &&
    (left.productionCertificationId || '') === (right.productionCertificationId || '')
  );
}

export function addPendingObservation(
  rows: PendingPacketObservation[],
  next: Omit<PendingPacketObservation, 'localId'> & { localId?: string }
): { rows: PendingPacketObservation[]; added: boolean } {
  const literal = next.literalWording.trim();
  if (!literal && !next.productionCertificationId) return { rows, added: false };
  const observation: PendingPacketObservation = {
    localId: next.localId || `pending_${rows.length + 1}_${normalizeDiscoveryQuery(literal || next.canonicalName || 'mark').replace(/\s+/g, '_')}`,
    literalWording: literal || next.canonicalName || '',
    source: next.source,
    ...(next.productionCertificationId ? { productionCertificationId: next.productionCertificationId } : {}),
    ...(next.canonicalName ? { canonicalName: next.canonicalName } : {}),
  };
  if (rows.some((row) => samePendingObservation(row, observation))) return { rows, added: false };
  return { rows: [...rows, observation], added: true };
}

export function replacePendingLiteral(rows: PendingPacketObservation[], localId: string, literalWording: string): PendingPacketObservation[] {
  return rows.map((row) => {
    if (row.localId !== localId) return row;
    if (!row.productionCertificationId) return { ...row, literalWording };
    const resolved = resolvePacketObservation({ observedWording: literalWording });
    const stillSelected =
      (resolved.kind === 'certification' && resolved.certificationId === row.productionCertificationId) ||
      normalizeDiscoveryQuery(literalWording) === normalizeDiscoveryQuery(row.canonicalName || '');
    if (stillSelected) return { ...row, literalWording };
    return {
      localId: row.localId,
      literalWording,
      source: row.source,
    };
  });
}

export function removePendingObservation(rows: PendingPacketObservation[], localId: string): PendingPacketObservation[] {
  return rows.filter((row) => row.localId !== localId);
}

/** Wording the existing certification receiver already knows how to identify. */
export function certificationStatementForSelection(productionId: string, literal: string, canonicalName?: string): string {
  const display = displayNameForCertification(productionId) || (canonicalName || '').trim();
  const fromLiteral = resolvePacketObservation({ observedWording: literal });
  if (fromLiteral.kind === 'certification' && fromLiteral.certificationId === productionId) return literal.trim();
  return display || literal.trim();
}

function wordingAlreadyPending(rows: PendingPacketObservation[], wording: string): boolean {
  const key = normalizeDiscoveryQuery(wording);
  if (!key) return false;
  return rows.some(
    (row) =>
      normalizeDiscoveryQuery(row.literalWording) === key ||
      normalizeDiscoveryQuery(row.canonicalName || '') === key
  );
}

/**
 * A tapped selectable certification is one governed observation.
 * The typed search is not packet wording and the field is cleared for the next entry.
 */
export function choosePacketSuggestion(
  rows: PendingPacketObservation[],
  hit: Pick<DiscoverySuggestion, 'consumerName' | 'selectable' | 'productionId'>,
  _typed: string
): { rows: PendingPacketObservation[]; added: boolean; fieldText: string } {
  const name = hit.consumerName.trim();
  if (!name || hit.selectable !== true || !hit.productionId) return { rows, added: false, fieldText: '' };
  const next = addPendingObservation(rows, {
    literalWording: name,
    source: 'manual',
    productionCertificationId: hit.productionId,
    canonicalName: name,
  });
  return { rows: next.rows, added: next.added, fieldText: '' };
}

export function pendingContributionLists(
  rows: PendingPacketObservation[],
  uncommittedWording = ''
): { claims: string[]; certifications: string[]; literalsByStatement: Record<string, string>; productionByStatement: Record<string, string> } {
  const claims: string[] = [];
  const certifications: string[] = [];
  const literalsByStatement: Record<string, string> = {};
  const productionByStatement: Record<string, string> = {};
  const extra = uncommittedWording.trim();
  const pending =
    extra && !wordingAlreadyPending(rows, extra)
      ? addPendingObservation(rows, { literalWording: extra, source: 'manual' }).rows
      : rows;
  for (const row of pending) {
    if (row.productionCertificationId) {
      const statement = certificationStatementForSelection(row.productionCertificationId, row.literalWording, row.canonicalName);
      if (!statement || certifications.some((item) => item.toLowerCase() === statement.toLowerCase())) continue;
      certifications.push(statement);
      const observed = row.literalWording.trim();
      const resolved = resolvePacketObservation({ observedWording: observed });
      const observedIsThisCertification =
        resolved.kind === 'certification' && resolved.certificationId === row.productionCertificationId;
      literalsByStatement[statement] =
        observed && (observed.toLowerCase() === statement.toLowerCase() || observedIsThisCertification)
          ? observed
          : statement;
      productionByStatement[statement] = row.productionCertificationId;
      continue;
    }
    const wording = row.literalWording.trim();
    if (!wording || claims.some((item) => item.toLowerCase() === wording.toLowerCase())) continue;
    claims.push(wording);
  }
  return {
    claims: claims.length > 0 ? claims : [''],
    certifications: certifications.length > 0 ? certifications : [''],
    literalsByStatement,
    productionByStatement,
  };
}
