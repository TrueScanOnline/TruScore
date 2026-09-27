/**
 * Admitted packet wording enters the existing Claims register.
 * The register classifies. This module does not.
 */

import { canApplyToProductionReceiver, evidenceKeyOf, selectPrevailingAdmittedEvidence } from '../contributions/admissionContract';
import { GOVERNED_PACKET_ABSENCE_CLAIM } from '../contributions/admissionTypes';
import type { ContributionEvidence } from '../contributions/types';
import type { AdmittedPacketObservation } from '../lib/truscoreEngine/claims/types';

export { GOVERNED_PACKET_ABSENCE_CLAIM };

export type GovernedPacketClaimFact = {
  evidenceId: string;
  exactWording: string;
};

export function isGovernedPacketAbsence(evidence: ContributionEvidence): boolean {
  return (
    evidence.domain === 'packet_claims' &&
    evidence.claimValue === GOVERNED_PACKET_ABSENCE_CLAIM &&
    !(evidence.exactWording || '').trim()
  );
}

function wordingOf(evidence: ContributionEvidence): string {
  return (evidence.exactWording || evidence.claimValue || '').trim();
}

/** Later admitted row for the same wording prevails. Other wordings stay. */
export function selectPrevailingPacketClaims(evidence: ContributionEvidence[]): GovernedPacketClaimFact[] {
  const seen = new Set<string>();
  const facts: GovernedPacketClaimFact[] = [];
  for (const candidate of evidence) {
    if (candidate.domain !== 'packet_claims' || isGovernedPacketAbsence(candidate)) continue;
    const key = evidenceKeyOf(candidate);
    if (seen.has(key)) continue;
    seen.add(key);
    const prevailing = selectPrevailingAdmittedEvidence(evidence, {
      barcode: candidate.barcode,
      domain: 'packet_claims',
      claimKey: candidate.claimKey,
      variantKey: candidate.variantKey,
    });
    if (!prevailing || !canApplyToProductionReceiver(prevailing, 'claims_packet')) continue;
    const exactWording = wordingOf(prevailing);
    if (!exactWording) continue;
    facts.push({ evidenceId: prevailing.evidenceId, exactWording });
  }
  return facts;
}

/** Later admitted absence affirmation for this barcode prevails. Wording rows are a different subject. */
export function selectAdmittedPacketAbsence(evidence: ContributionEvidence[]): boolean {
  const absenceRows = evidence.filter(isGovernedPacketAbsence);
  const first = absenceRows[0];
  if (!first) return false;
  const prevailing = selectPrevailingAdmittedEvidence(evidence, {
    barcode: first.barcode,
    domain: 'packet_claims',
    claimKey: first.claimKey,
    variantKey: first.variantKey,
  });
  return !!prevailing && canApplyToProductionReceiver(prevailing, 'claims_packet');
}

export function packetClaimsToObservations(facts: GovernedPacketClaimFact[]): AdmittedPacketObservation[] {
  return facts.map((fact) => ({
    evidence_id: fact.evidenceId,
    observed_text: fact.exactWording,
    display_text: fact.exactWording,
    admission_method: 'user_confirmation',
    source_locator: 'packet_contribution',
  }));
}
