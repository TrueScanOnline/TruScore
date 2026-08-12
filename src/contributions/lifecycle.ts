import {
  getCommunityVerificationPolicy,
  type ContributionDisputeReason,
} from '../config/contributionPolicy';
import { isLaneACertificationEvidence } from './certificationLane';
import type { ContributionEvidence, DisputeResponse, FounderAdminAction } from './types';

function otherActiveConfirmations(evidence: ContributionEvidence): number {
  return evidence.confirmations.filter((c) => c.contributorId !== evidence.submitterId).length;
}

function uniqueActiveDisputes(evidence: ContributionEvidence): number {
  return new Set(evidence.disputes.map((d) => d.contributorId)).size;
}

function hasActiveResponse(evidence: ContributionEvidence, contributorId: string): boolean {
  return (
    evidence.confirmations.some((c) => c.contributorId === contributorId) ||
    evidence.disputes.some((d) => d.contributorId === contributorId)
  );
}

function computeScoringEligible(evidence: ContributionEvidence): boolean {
  const policy = getCommunityVerificationPolicy(evidence.domain);
  if (!policy.canonicalPromotionPermission) return false;
  if (evidence.domain === 'origins') return true;
  if (evidence.domain === 'certifications') {
    if (policy.laneBScoring === false) {
      return isLaneACertificationEvidence({
        labelsTags: evidence.labelsTags,
        claimValue: evidence.claimValue,
        certificationLane: evidence.certificationLane,
      });
    }
    return true;
  }
  return false;
}

function recomputeState(evidence: ContributionEvidence): ContributionEvidence {
  if (evidence.state === 'superseded' || evidence.state === 'withdrawn') {
    return { ...evidence, scoringEligible: false, canonicalPromoted: false };
  }

  const policy = getCommunityVerificationPolicy(evidence.domain);
  const disputes = uniqueActiveDisputes(evidence);
  if (disputes >= policy.independentDisputesTriggeringReviewRequired) {
    // MVP: review_required does not auto-withdraw or alter prior scoring eligibility.
    return {
      ...evidence,
      state: 'review_required',
      scoringEligible: evidence.scoringEligible,
      canonicalPromoted: evidence.canonicalPromoted,
    };
  }

  const confirmations = otherActiveConfirmations(evidence);
  if (confirmations >= policy.independentConfirmationsRequired) {
    const scoringEligible = computeScoringEligible(evidence);
    return {
      ...evidence,
      state: 'cross_user_eligible',
      scoringEligible,
      certificationLane:
        evidence.domain === 'certifications'
          ? isLaneACertificationEvidence({
              labelsTags: evidence.labelsTags,
              claimValue: evidence.claimValue,
              certificationLane: evidence.certificationLane,
            })
            ? 'A'
            : 'B'
          : evidence.certificationLane,
    };
  }

  return {
    ...evidence,
    state: 'pending',
    scoringEligible: false,
    canonicalPromoted: false,
  };
}

export function createPendingEvidence(
  base: Omit<
    ContributionEvidence,
    'state' | 'confirmations' | 'disputes' | 'scoringEligible' | 'canonicalPromoted' | 'updatedAt'
  > & { createdAt: number }
): ContributionEvidence {
  const certificationLane =
    base.domain === 'certifications'
      ? base.certificationLane ||
        (isLaneACertificationEvidence({
          labelsTags: base.labelsTags,
          claimValue: base.claimValue,
        })
          ? 'A'
          : 'B')
      : undefined;
  return {
    ...base,
    certificationLane,
    updatedAt: base.createdAt,
    state: 'pending',
    confirmations: [],
    disputes: [],
    scoringEligible: false,
    canonicalPromoted: false,
  };
}

export function confirmEvidence(
  evidence: ContributionEvidence,
  contributorId: string,
  timestamp = Date.now()
): { ok: boolean; evidence: ContributionEvidence; reason?: string } {
  if (evidence.state === 'superseded' || evidence.state === 'withdrawn') {
    return { ok: false, evidence, reason: 'closed' };
  }
  if (contributorId === evidence.submitterId) {
    return { ok: false, evidence, reason: 'submitter_cannot_confirm' };
  }

  const policy = getCommunityVerificationPolicy(evidence.domain);
  if (policy.activeResponsesPerContributorPerEvidenceVersion === 1 && hasActiveResponse(evidence, contributorId)) {
    const next = {
      ...evidence,
      disputes: evidence.disputes.filter((d) => d.contributorId !== contributorId),
      confirmations: [
        ...evidence.confirmations.filter((c) => c.contributorId !== contributorId),
        { contributorId, timestamp },
      ],
      updatedAt: timestamp,
    };
    return { ok: true, evidence: recomputeState(next) };
  }

  const next = {
    ...evidence,
    confirmations: [...evidence.confirmations, { contributorId, timestamp }],
    updatedAt: timestamp,
  };
  return { ok: true, evidence: recomputeState(next) };
}

export function disputeEvidence(
  evidence: ContributionEvidence,
  contributorId: string,
  reason: ContributionDisputeReason,
  timestamp = Date.now(),
  note?: string
): { ok: boolean; evidence: ContributionEvidence; reason?: string } {
  if (evidence.state === 'superseded' || evidence.state === 'withdrawn') {
    return { ok: false, evidence, reason: 'closed' };
  }
  if (contributorId === evidence.submitterId) {
    return { ok: false, evidence, reason: 'submitter_cannot_dispute' };
  }
  if (evidence.disputes.some((d) => d.contributorId === contributorId)) {
    return { ok: false, evidence, reason: 'duplicate_dispute' };
  }

  const policy = getCommunityVerificationPolicy(evidence.domain);
  let confirmations = evidence.confirmations;
  if (
    policy.activeResponsesPerContributorPerEvidenceVersion === 1 &&
    evidence.confirmations.some((c) => c.contributorId === contributorId)
  ) {
    confirmations = evidence.confirmations.filter((c) => c.contributorId !== contributorId);
  }

  const dispute: DisputeResponse = { contributorId, timestamp, reason, note };
  const next = {
    ...evidence,
    confirmations,
    disputes: [...evidence.disputes, dispute],
    updatedAt: timestamp,
  };
  return { ok: true, evidence: recomputeState(next) };
}

export function applyFounderAdminAction(
  evidence: ContributionEvidence,
  action: FounderAdminAction,
  timestamp = Date.now()
): ContributionEvidence {
  if (action === 'withdraw' || action === 'suppress') {
    return {
      ...evidence,
      state: 'withdrawn',
      scoringEligible: false,
      canonicalPromoted: false,
      updatedAt: timestamp,
    };
  }
  if (action === 'supersede') {
    return {
      ...evidence,
      state: 'superseded',
      scoringEligible: false,
      canonicalPromoted: false,
      updatedAt: timestamp,
    };
  }
  return recomputeState({ ...evidence, state: 'pending', updatedAt: timestamp });
}

export function automaticWithdrawalEnabled(domain: 'origins' | 'certifications'): boolean {
  return getCommunityVerificationPolicy(domain).automaticWithdrawal;
}

export function canPromoteToCanonicalProduct(evidence: ContributionEvidence): boolean {
  const policy = getCommunityVerificationPolicy(evidence.domain);
  if (!policy.canonicalPromotionPermission) return false;
  if (evidence.state !== 'cross_user_eligible') return false;
  if (!evidence.scoringEligible) return false;
  return evidence.domain === 'certifications' || evidence.domain === 'origins';
}

export function markCanonicalPromoted(
  evidence: ContributionEvidence,
  timestamp = Date.now()
): ContributionEvidence {
  if (!canPromoteToCanonicalProduct(evidence)) return evidence;
  return {
    ...evidence,
    canonicalPromoted: true,
    scoringEligible: true,
    updatedAt: timestamp,
  };
}

/** Confirm then promote when policy + lane allow — single governed path into scorers. */
export function confirmAndPromoteIfEligible(
  evidence: ContributionEvidence,
  contributorId: string,
  timestamp = Date.now()
): { ok: boolean; evidence: ContributionEvidence; reason?: string } {
  const confirmed = confirmEvidence(evidence, contributorId, timestamp);
  if (!confirmed.ok) return confirmed;
  if (!canPromoteToCanonicalProduct(confirmed.evidence)) {
    return confirmed;
  }
  return { ok: true, evidence: markCanonicalPromoted(confirmed.evidence, timestamp) };
}

export { recomputeState };
