/**
 * Admitted packet wording enters the existing Claims register.
 * The register classifies. This module does not.
 */

import { canApplyToProductionReceiver, evidenceKeyOf, selectPrevailingAdmittedEvidence } from '../contributions/admissionContract';
import { GOVERNED_PACKET_ABSENCE_CLAIM } from '../contributions/admissionTypes';
import { canonicalizeVariantKey } from '../contributions/evidenceVersion';
import type { ContributionEvidence } from '../contributions/types';
import type { AdmittedPacketObservation } from '../lib/truscoreEngine/claims/types';

export { GOVERNED_PACKET_ABSENCE_CLAIM };

export const PACKET_CLAIMS_CARD_TITLE = 'Packet Claims';

/** Same L1/L2/L3 provision as Product Origins. Editorial copy is not authored here. */
export const PACKET_CLAIMS_EXPLAINER_HOOK = {
  surface: 'packet_claims' as const,
  levels: ['L1', 'L2', 'L3'] as const,
  editorial: 'deferred' as const,
  content: '(Awaiting founder input)' as const,
};

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

function packetSubjectKey(evidence: ContributionEvidence): string {
  return `${evidence.barcode}|${canonicalizeVariantKey(evidence.variantKey) ?? ''}`;
}

function admittedAtOf(evidence: ContributionEvidence): number {
  return evidence.admission?.admittedAt ?? evidence.updatedAt ?? 0;
}

type CurrentPacketControl = {
  facts: GovernedPacketClaimFact[];
  absence: boolean;
};

/**
 * Same barcode and variant are one packet subject.
 * Compatible wordings stay together.
 * An absence affirmation and a positive claim cannot both control that subject:
 * the later admitted row prevails. Earlier rows stay in the store.
 */
function selectCurrentPacketControl(evidence: ContributionEvidence[]): CurrentPacketControl {
  const seen = new Set<string>();
  const positives: Array<GovernedPacketClaimFact & { subject: string; admittedAt: number }> = [];
  const absenceBySubject = new Map<string, ContributionEvidence>();

  for (const candidate of evidence) {
    if (candidate.domain !== 'packet_claims') continue;
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
    const subject = packetSubjectKey(prevailing);
    if (isGovernedPacketAbsence(prevailing)) {
      const current = absenceBySubject.get(subject);
      if (!current || admittedAtOf(prevailing) >= admittedAtOf(current)) {
        absenceBySubject.set(subject, prevailing);
      }
      continue;
    }
    const exactWording = wordingOf(prevailing);
    if (!exactWording) continue;
    positives.push({
      evidenceId: prevailing.evidenceId,
      exactWording,
      subject,
      admittedAt: admittedAtOf(prevailing),
    });
  }

  const facts: GovernedPacketClaimFact[] = [];
  let absence = false;
  const subjects = new Set<string>([
    ...positives.map((row) => row.subject),
    ...absenceBySubject.keys(),
  ]);
  for (const subject of subjects) {
    const subjectPositives = positives.filter((row) => row.subject === subject);
    const absenceRow = absenceBySubject.get(subject);
    if (!absenceRow) {
      facts.push(...subjectPositives.map(({ evidenceId, exactWording }) => ({ evidenceId, exactWording })));
      continue;
    }
    const absenceAt = admittedAtOf(absenceRow);
    const laterPositives = subjectPositives.filter((row) => row.admittedAt > absenceAt);
    if (laterPositives.length > 0) {
      facts.push(...laterPositives.map(({ evidenceId, exactWording }) => ({ evidenceId, exactWording })));
      continue;
    }
    absence = true;
  }
  return { facts, absence };
}

/** Later admitted row for the same wording prevails. A later absence on the same packet does not. */
export function selectPrevailingPacketClaims(evidence: ContributionEvidence[]): GovernedPacketClaimFact[] {
  return selectCurrentPacketControl(evidence).facts;
}

/** True when the later admitted row for a packet subject is an absence affirmation. */
export function selectAdmittedPacketAbsence(evidence: ContributionEvidence[]): boolean {
  return selectCurrentPacketControl(evidence).absence;
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
