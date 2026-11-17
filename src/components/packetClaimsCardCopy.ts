/**
 * Consumer copy for the Packet Claims card.
 * This does not select, admit, or score claims.
 */

import { displayCertificationName } from '../certifications/resolveCertification';
import { deriveEvidenceFacts } from '../evidenceAuthority/subjects';
import {
  ETHICS_ORGANIC_TAG_ALLOWLIST,
  recognisedOrganicCertificationTag,
} from '../services/ethicsCertificationsService';

export const PACKET_CLAIMS_EMPTY_STATE =
  'This product does not currently have any claims that we can find. If there are any stated on the packet, you can add them now.';

export const PACKET_CLAIMS_MORE_INFORMATION =
  'Packet claims are claims made by the manufacturer that are usually printed on the packaging to help promote their product. If there are claims stated on the packaging then please enter them for everyone to see.';

function organicFamilyTag(tag: string | undefined): boolean {
  return ETHICS_ORGANIC_TAG_ALLOWLIST.has((tag || '').trim().toLowerCase());
}

/** Same subject a Change-packet removal sends to the evidence authority. */
export function displayedPacketSubjectKey(kind: 'claim' | 'certification', text: string): string | null {
  const wording = text.trim();
  if (!wording) return null;
  const derived = deriveEvidenceFacts([
    kind === 'claim'
      ? { domain: 'packet_claims', exactWording: wording, claimValue: wording }
      : { domain: 'certifications', exactWording: wording, claimValue: wording },
  ]);
  return derived.facts[0]?.subjectKey ?? null;
}

export function packetLineWithdrawn(
  kind: 'claim' | 'certification',
  text: string,
  withdrawnSubjectKeys: readonly string[] | undefined
): boolean {
  if (!withdrawnSubjectKeys || withdrawnSubjectKeys.length === 0) return false;
  const key = displayedPacketSubjectKey(kind, text);
  return key != null && withdrawnSubjectKeys.includes(key);
}

/**
 * A badge copied on from a packet certification stays only while that certification
 * is still current, or while the product source already lists the same label.
 * A withdrawn subject stays hidden even when the source label is still present.
 */
export function packetClaimsRecognisedMarks<T extends { tag?: string; name?: string }>(input: {
  marks: T[];
  labelHierarchy: string[] | undefined;
  governedCertificationNames: string[];
  withdrawnSubjectKeys?: readonly string[];
}): T[] {
  const hierarchy = new Set((input.labelHierarchy || []).map((tag) => tag.trim().toLowerCase()));
  const currentTags = new Set(
    input.governedCertificationNames
      .map((name) => recognisedOrganicCertificationTag(name))
      .filter((tag): tag is string => !!tag)
  );
  return input.marks.filter((mark) => {
    if (packetLineWithdrawn('certification', displayCertificationName(mark), input.withdrawnSubjectKeys)) return false;
    const tag = (mark.tag || '').trim().toLowerCase();
    if (!organicFamilyTag(tag)) return true;
    if (hierarchy.has(tag)) return true;
    return currentTags.has(tag);
  });
}

/** True only when the card would otherwise show no claim, certification, or admitted absence. */
export function packetClaimsCardShowsEmptyState(input: {
  recognisedMarkCount: number;
  certificationLineCount: number;
  claimLineCount: number;
  absenceEstablished: boolean;
}): boolean {
  if (input.absenceEstablished) return false;
  return input.recognisedMarkCount === 0 && input.certificationLineCount === 0 && input.claimLineCount === 0;
}

/**
 * Empty Packet Claims card CTA — same invitation shape as empty Product Origins.
 * Menu eligibility still decides whether an Add row exists; this only gates card presentation.
 */
export function packetClaimsCardShowsAddAction(input: {
  showEmptyState: boolean;
  hasAddPacketMenuRow: boolean;
}): boolean {
  return input.showEmptyState === true && input.hasAddPacketMenuRow === true;
}

/**
 * Card-only Limited confidence chrome.
 * An admitted packet-absence observation may still carry claims_primary_contribution_limited
 * in publication — hide only this badge for that verified absence presentation.
 * Does not change Claims confidence, reason codes, or scores.
 */
export function packetClaimsCardShowsLimitedConfidenceBadge(input: {
  absenceEstablished: boolean;
  confidenceReasonCode: string | undefined | null;
}): boolean {
  if (input.absenceEstablished === true) return false;
  return input.confidenceReasonCode === 'claims_primary_contribution_limited';
}
