/**
 * Wave 4A.0 — runtime evidence / admission contract.
 *
 * Separates: capture/record → submission → governed admission → governance state →
 * receiver-specific assessment eligibility → prevailing-version selection →
 * verification/dispute binding → downstream receiver consumption.
 *
 * Domain-global `scoringEligible` is retained only as a compatibility mirror and
 * is not the controlling production assessment authority.
 * Stored `receiverEligibility` maps are never authoritative for production gates.
 */

import { getCommunityVerificationPolicy } from '../config/contributionPolicy';
import { isLaneACertificationEvidence } from './certificationLane';
import {
  ADMISSION_RULE_VERSION,
  BODY_RECEIVER_4A0_UNREGISTERED_REASON,
  GOVERNED_PACKET_ABSENCE_CLAIM,
  type AssessmentReceiverId,
  type ContributionAdmissionStatus,
} from './admissionTypes';
import { evaluateBodyReceiverEligibility } from './bodyReceiverRegistry';
import { canonicalizeVariantKey } from './evidenceVersion';
import {
  CURRENT_PRODUCTION_CONTRIBUTION_EPOCH,
  carriesCurrentProductionEpoch,
  describeEpochAuthority,
  isExplicitProductionRecordClass,
  type ContributionRecordClass,
} from './productionEpoch';
import type { ContributionEvidence } from './types';

export {
  ADMISSION_RULE_VERSION,
  ASSESSMENT_RECEIVER_IDS,
  BODY_RECEIVER_4A0_UNREGISTERED_REASON,
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
  const variantCanon = canonicalizeVariantKey(parts.variantKey);
  const variant = variantCanon ? `|var:${variantCanon}` : '';
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
 *
 * Initial assessment participation does not require independent confirmation,
 * `cross_user_eligible`, or `canonicalPromoted`. Those remain verification /
 * canonical-maturity facts (lifecycle.ts). Stored receiverEligibility maps,
 * scoringEligible, and asserted lifecycle state are never authoritative.
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
    // 4A.0: fail closed — no approved Body receiving methodology registered yet.
    // 4A.2 extensibility: register predicates via bodyReceiverRegistry (code/governance).
    // Does not authorise substituting contribution evidence for OFF Nutri-Score/NOVA.
    body_ingredients_nutrition: {
      eligible: false,
      methodologyId: 'body_pillar',
      methodologyVersion: 'as_built',
      basisRuleVersion,
      reason: BODY_RECEIVER_4A0_UNREGISTERED_REASON,
    },
    claims_packet: {
      eligible: false,
      methodologyId: 'claims_rescue_v0_2',
      methodologyVersion: 'v0.2',
      basisRuleVersion,
      reason: 'not_evaluated',
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
      claims_packet: {
        ...empty.claims_packet,
        reason: 'requires current production epoch and governed admission',
      },
    };
  }

  // review_required is governance-only: it does not withdraw evidence or close
  // an otherwise eligible receiver. Withdrawn/superseded close eligibility.
  // pending / cross_user_eligible are likewise not participation prerequisites.
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
      claims_packet: {
        ...empty.claims_packet,
        reason: `governance state ${evidence.state} closes eligibility`,
      },
    };
  }

  const bodyEval = evaluateBodyReceiverEligibility(evidence);
  const bodyEntry = {
    eligible: bodyEval.eligible,
    methodologyId: bodyEval.methodologyId,
    methodologyVersion: bodyEval.methodologyVersion,
    basisRuleVersion,
    reason: bodyEval.reason,
  };

  if (evidence.domain === 'origins') {
    const policy = getCommunityVerificationPolicy('origins');
    const eligible = policy.canonicalPromotionPermission === true;
    return {
      open_origins: {
        eligible,
        methodologyId: 'open_v15',
        methodologyVersion: 'v15',
        basisRuleVersion,
        reason: eligible
          ? evidence.state === 'review_required'
            ? 'review_required preserves open_origins eligibility via controlled recomputation'
            : 'admitted origins evidence × open_v15 receiving methodology'
          : 'origins not assessment-eligible for open_origins receiver',
      },
      ethics_certifications: empty.ethics_certifications,
      body_ingredients_nutrition: bodyEntry,
      claims_packet: empty.claims_packet,
    };
  }

  if (evidence.domain === 'certifications') {
    const policy = getCommunityVerificationPolicy('certifications');
    const laneA = isLaneACertificationEvidence({
      labelsTags: evidence.labelsTags,
      claimValue: evidence.claimValue,
      certificationLane: evidence.certificationLane,
    });
    // Lane B remains non-scoring; only Lane A may be ethics-receiver eligible.
    const eligible = policy.canonicalPromotionPermission === true && laneA === true;
    return {
      open_origins: empty.open_origins,
      ethics_certifications: {
        eligible,
        methodologyId: 'ethics_pillar',
        methodologyVersion: 'as_built',
        basisRuleVersion,
        reason: !laneA
          ? 'Lane B certification evidence is governed but not ethics-assessment-eligible'
          : eligible
            ? evidence.state === 'review_required'
              ? 'review_required preserves ethics_certifications eligibility via controlled recomputation'
              : 'admitted Lane A certification evidence × ethics receiving methodology'
            : 'certifications not assessment-eligible for ethics receiver',
      },
      body_ingredients_nutrition: bodyEntry,
      claims_packet: empty.claims_packet,
    };
  }

  if (evidence.domain === 'packet_claims') {
    const absence =
      evidence.claimValue === GOVERNED_PACKET_ABSENCE_CLAIM && !(evidence.exactWording || '').trim();
    const wording = (evidence.exactWording || (absence ? '' : evidence.claimValue) || '').trim();
    const eligible = absence || wording.length > 0;
    return {
      open_origins: empty.open_origins,
      ethics_certifications: empty.ethics_certifications,
      body_ingredients_nutrition: bodyEntry,
      claims_packet: {
        eligible,
        methodologyId: 'claims_rescue_v0_2',
        methodologyVersion: 'v0.2',
        basisRuleVersion,
        reason: eligible
          ? absence
            ? 'admitted packet-absence affirmation may resolve the Packet lane'
            : 'admitted packet wording may enter the existing Claims register'
          : 'packet claim evidence has no exact wording',
      },
    };
  }

  return {
    ...empty,
    body_ingredients_nutrition: bodyEntry,
  };
}

/**
 * Production assessment eligibility — always recomputes from controlled methodology
 * predicates. Stored receiverEligibility maps and scoringEligible are never trusted.
 */
export function isAssessmentEligibleForReceiver(
  evidence: ContributionEvidence,
  receiverId: AssessmentReceiverId
): boolean {
  if (!carriesCurrentProductionEpoch(evidence)) return false;
  if (!isGovernedAdmitted(evidence)) return false;
  if (evidence.state === 'superseded' || evidence.state === 'withdrawn') return false;

  const computed = computeReceiverEligibility(evidence);
  return computed[receiverId]?.eligible === true;
}

/**
 * Production projection into a scoring Product field.
 * Requires recomputed receiver eligibility only.
 * `canonicalPromoted` is verification/canonical maturity and is not an
 * assessment-participation predicate (a forged true flag grants nothing;
 * a false flag does not block admitted primary evidence).
 */
export function canApplyToProductionReceiver(
  evidence: ContributionEvidence,
  receiverId: AssessmentReceiverId
): boolean {
  return isAssessmentEligibleForReceiver(evidence, receiverId);
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

  // Never upgrade non-production / absent recordClass to production on admission.
  if (!isExplicitProductionRecordClass(evidence.recordClass ?? null)) {
    return {
      ok: false,
      evidence,
      reason: 'admission_requires_explicit_recordClass_production',
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
    recordClass: 'production' as ContributionRecordClass,
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
 * A withdrawn latest version does not make an older version current.
 */
export function selectPrevailingAdmittedEvidence(
  records: ContributionEvidence[],
  key: EvidenceKeyParts
): ContributionEvidence | null {
  const target = buildEvidenceKey(key);
  const admitted = records.filter(
    (r) => evidenceKeyOf(r) === target && isGovernedAdmitted(r) && carriesCurrentProductionEpoch(r)
  );
  if (admitted.length === 0) return null;
  const later = (best: ContributionEvidence, cur: ContributionEvidence) => {
    if (cur.evidenceVersion !== best.evidenceVersion) {
      return cur.evidenceVersion > best.evidenceVersion ? cur : best;
    }
    const curAdmittedAt = cur.admission?.admittedAt ?? cur.updatedAt;
    const bestAdmittedAt = best.admission?.admittedAt ?? best.updatedAt;
    return curAdmittedAt >= bestAdmittedAt ? cur : best;
  };
  const latest = admitted.reduce(later);
  if (latest.state === 'withdrawn') return null;
  const open = admitted.filter((r) => r.state !== 'superseded' && r.state !== 'withdrawn');
  if (open.length === 0) return null;
  return open.reduce(later);
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
