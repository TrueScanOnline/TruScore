/**
 * Wave 4A.0 — runtime evidence / admission contract.
 *
 * Separates: capture/record → submission → governed admission → governance state →
 * receiver-specific assessment eligibility → prevailing-version selection →
 * verification/dispute binding → downstream receiver consumption.
 *
 * Domain-global `scoringEligible` is retained only as a compatibility mirror and
 * is not the controlling production assessment authority.
 */

import { getCommunityVerificationPolicy } from '../config/contributionPolicy';
import { isLaneACertificationEvidence } from './certificationLane';
import {
  ADMISSION_RULE_VERSION,
  type AssessmentReceiverId,
  type ContributionAdmissionStatus,
} from './admissionTypes';
import {
  CURRENT_PRODUCTION_CONTRIBUTION_EPOCH,
  carriesCurrentProductionEpoch,
  describeEpochAuthority,
  type ContributionRecordClass,
} from './productionEpoch';
import type { ContributionEvidence } from './types';

export {
  ADMISSION_RULE_VERSION,
  ASSESSMENT_RECEIVER_IDS,
  CONTRIBUTION_ADMISSION_STATUSES,
  type AssessmentReceiverId,
  type ContributionAdmissionRecord,
  type ContributionAdmissionStatus,
  type ReceiverEligibility,
} from './admissionTypes';

export type EvidenceKeyParts = {
  barcode: string;
  domain: ContributionEvidence['domain'];
  claimKey: string;
  /** Optional variant discriminator when present on future records. */
  variantKey?: string;
};

export function buildEvidenceKey(parts: EvidenceKeyParts): string {
  const barcode = String(parts.barcode || '').trim();
  const claim = String(parts.claimKey || '')
    .trim()
    .toLowerCase();
  const variant = parts.variantKey ? `|var:${String(parts.variantKey).trim()}` : '';
  return `${barcode}|${parts.domain}|${claim}${variant}`;
}

export function evidenceKeyOf(evidence: Pick<ContributionEvidence, 'barcode' | 'domain' | 'claimKey'> & {
  variantKey?: string;
}): string {
  return buildEvidenceKey({
    barcode: evidence.barcode,
    domain: evidence.domain,
    claimKey: evidence.claimKey,
    variantKey: evidence.variantKey,
  });
}

export function getAdmissionStatus(
  evidence: Pick<ContributionEvidence, 'admissionStatus'>
): ContributionAdmissionStatus | 'legacy_unspecified' {
  if (
    evidence.admissionStatus === 'raw' ||
    evidence.admissionStatus === 'submitted' ||
    evidence.admissionStatus === 'admitted' ||
    evidence.admissionStatus === 'rejected'
  ) {
    return evidence.admissionStatus;
  }
  return 'legacy_unspecified';
}

export function isGovernedAdmitted(
  evidence: Pick<ContributionEvidence, 'admissionStatus'>
): boolean {
  return getAdmissionStatus(evidence) === 'admitted';
}

/**
 * Compat mirror only. Prefer `isAssessmentEligibleForReceiver`.
 * Returns true when any receiver eligibility entry is eligible.
 */
export function deriveCompatScoringEligibleMirror(
  receiverEligibility: ContributionEvidence['receiverEligibility'] | undefined
): boolean {
  if (!receiverEligibility) return false;
  return Object.values(receiverEligibility).some((entry) => entry?.eligible === true);
}

/**
 * Compute receiver-specific eligibility from admitted evidence type × approved
 * receiving methodology. Fail closed when methodology is not approved for the type.
 */
export function computeReceiverEligibility(
  evidence: ContributionEvidence
): NonNullable<ContributionEvidence['receiverEligibility']> {
  const basisRuleVersion = ADMISSION_RULE_VERSION;
  const empty = {
    open_origins: {
      eligible: false,
      methodologyId: 'open_v15',
      methodologyVersion: 'v15',
      basisRuleVersion,
      reason: 'not_evaluated',
    },
    ethics_certifications: {
      eligible: false,
      methodologyId: 'ethics_pillar',
      methodologyVersion: 'as_built',
      basisRuleVersion,
      reason: 'not_evaluated',
    },
    body_ingredients_nutrition: {
      eligible: false,
      methodologyId: 'body_pillar',
      methodologyVersion: 'as_built',
      basisRuleVersion,
      reason:
        'local contribution evidence is never assessment-eligible for Body; authority is OFF public retrieval',
    },
  } satisfies NonNullable<ContributionEvidence['receiverEligibility']>;

  if (!carriesCurrentProductionEpoch(evidence) || !isGovernedAdmitted(evidence)) {
    return {
      open_origins: {
        ...empty.open_origins,
        reason: 'requires current production epoch and governed admission',
      },
      ethics_certifications: {
        ...empty.ethics_certifications,
        reason: 'requires current production epoch and governed admission',
      },
      body_ingredients_nutrition: empty.body_ingredients_nutrition,
    };
  }

  // Governance: review_required must not itself determine eligibility — preserve prior
  // eligibility computation inputs (policy + lane). Withdrawn/superseded close eligibility.
  if (evidence.state === 'superseded' || evidence.state === 'withdrawn') {
    return {
      open_origins: {
        ...empty.open_origins,
        reason: `governance state ${evidence.state} closes eligibility`,
      },
      ethics_certifications: {
        ...empty.ethics_certifications,
        reason: `governance state ${evidence.state} closes eligibility`,
      },
      body_ingredients_nutrition: empty.body_ingredients_nutrition,
    };
  }

  if (evidence.domain === 'origins') {
    const policy = getCommunityVerificationPolicy('origins');
    const priorEligible = evidence.receiverEligibility?.open_origins?.eligible === true;
    const eligible =
      policy.canonicalPromotionPermission === true &&
      (evidence.state === 'cross_user_eligible' ||
        (evidence.state === 'review_required' && (priorEligible || evidence.scoringEligible === true)));
    return {
      ...empty,
      open_origins: {
        eligible,
        methodologyId: 'open_v15',
        methodologyVersion: 'v15',
        basisRuleVersion,
        reason: eligible
          ? evidence.state === 'review_required'
            ? 'review_required preserves prior open_origins eligibility (governance-only)'
            : 'admitted origins evidence × open_v15 receiving methodology'
          : 'origins not assessment-eligible for open_origins receiver',
      },
    };
  }

  if (evidence.domain === 'certifications') {
    const policy = getCommunityVerificationPolicy('certifications');
    const laneA = isLaneACertificationEvidence({
      labelsTags: evidence.labelsTags,
      claimValue: evidence.claimValue,
      certificationLane: evidence.certificationLane,
    });
    const priorEligible = evidence.receiverEligibility?.ethics_certifications?.eligible === true;
    // Lane B remains non-scoring; only Lane A may be ethics-receiver eligible.
    const eligible =
      policy.canonicalPromotionPermission === true &&
      laneA === true &&
      (evidence.state === 'cross_user_eligible' ||
        (evidence.state === 'review_required' && (priorEligible || evidence.scoringEligible === true)));
    return {
      ...empty,
      ethics_certifications: {
        eligible,
        methodologyId: 'ethics_pillar',
        methodologyVersion: 'as_built',
        basisRuleVersion,
        reason: !laneA
          ? 'Lane B certification evidence is governed but not ethics-assessment-eligible'
          : eligible
            ? evidence.state === 'review_required'
              ? 'review_required preserves prior ethics_certifications eligibility (governance-only)'
              : 'admitted Lane A certification evidence × ethics receiving methodology'
            : 'certifications not assessment-eligible for ethics receiver',
      },
    };
  }

  return empty;
}

export function isAssessmentEligibleForReceiver(
  evidence: ContributionEvidence,
  receiverId: AssessmentReceiverId
): boolean {
  if (!carriesCurrentProductionEpoch(evidence)) return false;
  if (!isGovernedAdmitted(evidence)) return false;
  if (evidence.state === 'superseded' || evidence.state === 'withdrawn') return false;

  const entry = evidence.receiverEligibility?.[receiverId];
  if (entry) return entry.eligible === true;

  // Fail closed if receiver map missing — do not fall back to domain-global scoringEligible.
  return false;
}

/**
 * Production promotion into a scoring Product field is allowed only when the
 * receiver-specific contract passes. Domain-global scoringEligible is ignored.
 */
export function canApplyToProductionReceiver(
  evidence: ContributionEvidence,
  receiverId: AssessmentReceiverId
): boolean {
  if (!isAssessmentEligibleForReceiver(evidence, receiverId)) return false;
  if (!evidence.canonicalPromoted) return false;
  // review_required does not withdraw; eligibility already preserved in receiver map.
  return true;
}

export function admitEvidence(
  evidence: ContributionEvidence,
  params: {
    admissionReason: string;
    admittedBy?: string;
    timestamp?: number;
    ruleVersion?: string;
  }
): { ok: true; evidence: ContributionEvidence } | { ok: false; evidence: ContributionEvidence; reason: string } {
  const epochInfo = describeEpochAuthority(evidence);
  if (!epochInfo.productionAuthoritativeCandidate) {
    return { ok: false, evidence, reason: epochInfo.reason };
  }
  const status = getAdmissionStatus(evidence);
  if (status === 'admitted') {
    return { ok: true, evidence };
  }
  if (status === 'rejected') {
    return { ok: false, evidence, reason: 'rejected_evidence_cannot_be_admitted' };
  }
  if (status === 'raw') {
    return { ok: false, evidence, reason: 'raw_capture_is_not_admissible_until_submitted' };
  }
  // submitted or legacy_unspecified with production epoch: allow controlled admission
  if (status === 'legacy_unspecified') {
    return {
      ok: false,
      evidence,
      reason: 'legacy_unspecified_admission_status_cannot_be_promoted_to_production_without_explicit_migration',
    };
  }

  const timestamp = params.timestamp ?? Date.now();
  const admitted: ContributionEvidence = {
    ...evidence,
    admissionStatus: 'admitted',
    admission: {
      admittedAt: timestamp,
      admissionReason: params.admissionReason,
      ruleVersion: params.ruleVersion || ADMISSION_RULE_VERSION,
      admittedBy: params.admittedBy,
    },
    updatedAt: timestamp,
    recordClass: (evidence.recordClass || 'production') as ContributionRecordClass,
    productionEpoch: CURRENT_PRODUCTION_CONTRIBUTION_EPOCH,
  };
  const receiverEligibility = computeReceiverEligibility(admitted);
  return {
    ok: true,
    evidence: {
      ...admitted,
      receiverEligibility,
      // Compat mirror only — not controlling for production assessment.
      scoringEligible: deriveCompatScoringEligibleMirror(receiverEligibility),
    },
  };
}

/**
 * Latest successfully admitted primary-user evidence for the same evidence key
 * prevails. Draft/raw/submitted never displaces an admitted record. Partial
 * key sets do not erase unrelated keys (caller applies per-key).
 */
export function selectPrevailingAdmittedEvidence(
  records: ContributionEvidence[],
  key: EvidenceKeyParts
): ContributionEvidence | null {
  const target = buildEvidenceKey(key);
  const admitted = records.filter(
    (r) =>
      evidenceKeyOf(r) === target &&
      isGovernedAdmitted(r) &&
      carriesCurrentProductionEpoch(r) &&
      r.state !== 'superseded' &&
      r.state !== 'withdrawn'
  );
  if (admitted.length === 0) return null;
  return admitted.reduce((best, cur) => {
    if (cur.evidenceVersion !== best.evidenceVersion) {
      return cur.evidenceVersion > best.evidenceVersion ? cur : best;
    }
    const curAdmittedAt = cur.admission?.admittedAt ?? cur.updatedAt;
    const bestAdmittedAt = best.admission?.admittedAt ?? best.updatedAt;
    return curAdmittedAt >= bestAdmittedAt ? cur : best;
  });
}

/**
 * Confirm/dispute events bind to evidenceId / evidenceVersion. A later version
 * must not inherit prior verification/dispute state.
 */
export function verificationBindsToEvidenceVersion(
  event: { evidenceId: string; evidenceVersion?: number },
  evidence: Pick<ContributionEvidence, 'evidenceId' | 'evidenceVersion'>
): boolean {
  if (event.evidenceId !== evidence.evidenceId) return false;
  if (typeof event.evidenceVersion === 'number' && event.evidenceVersion !== evidence.evidenceVersion) {
    return false;
  }
  return true;
}

export function refreshReceiverEligibility(evidence: ContributionEvidence): ContributionEvidence {
  if (!carriesCurrentProductionEpoch(evidence) || !isGovernedAdmitted(evidence)) {
    return {
      ...evidence,
      receiverEligibility: computeReceiverEligibility(evidence),
      scoringEligible: false,
    };
  }
  const receiverEligibility = computeReceiverEligibility(evidence);
  return {
    ...evidence,
    receiverEligibility,
    scoringEligible: deriveCompatScoringEligibleMirror(receiverEligibility),
  };
}
