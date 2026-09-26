import type {
  ContributionDisputeReason,
  ContributionDomain,
  ContributionLifecycleState,
} from '../config/contributionPolicy';
import type {
  AssessmentReceiverId,
  ContributionAdmissionRecord,
  ContributionAdmissionStatus,
  ReceiverEligibility,
} from './admissionTypes';
import type { CertificationLane } from './certificationLane';
import type { OriginStructuredEvidence } from './originStructured';
import type { ContributionRecordClass } from './productionEpoch';

export type ContributorResponse = {
  contributorId: string;
  /** Must bind to the evidence version confirmed — never float to later corrections. */
  evidenceVersion?: number;
  timestamp: number;
};

export type DisputeResponse = ContributorResponse & {
  reason: ContributionDisputeReason;
  note?: string;
  replacementEvidenceId?: string;
  /** Must bind to the evidence version disputed. */
  evidenceVersion?: number;
};

export type ContributionEvidence = {
  evidenceId: string;
  barcode: string;
  domain: Extract<ContributionDomain, 'origins' | 'certifications'>;
  /** Increments when the same GTIN+domain claim wording/value changes. */
  evidenceVersion: number;
  /** Normalized claim key (country name or OFF label tag). */
  claimKey: string;
  claimValue: string;
  /** Optional product-variant discriminator for evidence-key identity. */
  variantKey?: string;
  /** Certifications only — OFF-style tags for later promotion. */
  labelsTags?: string[];
  /** Lane A scores via Ethics; Lane B may be governed but not scoring-eligible. */
  certificationLane?: CertificationLane;
  /** Structured Origins interpretation (packet image remains source evidence). */
  originStructured?: OriginStructuredEvidence;
  submitterId: string;
  createdAt: number;
  updatedAt: number;
  /** Packet image URL — source evidence. */
  imageUrl?: string;
  /** Exact extracted/confirmed packet wording/transcript. */
  exactWording?: string;
  state: ContributionLifecycleState;
  confirmations: ContributorResponse[];
  disputes: DisputeResponse[];
  /**
   * Compat mirror only (Wave 4A.0+). Not the controlling production assessment
   * authority — use receiverEligibility / isAssessmentEligibleForReceiver.
   */
  scoringEligible: boolean;
  canonicalPromoted: boolean;
  /**
   * Wave 4A.0 production epoch. Absent/null ⇒ pre-epoch / legacy — fail closed
   * for production assessment, Confidence, maturity, and prevailing selection.
   */
  productionEpoch?: string | null;
  /** Structural record class; fixture/test/developer never acquire production authority. */
  recordClass?: ContributionRecordClass;
  /**
   * Governed admission lifecycle. raw/submitted ≠ admitted.
   * Absent ⇒ legacy_unspecified (not production-admissible without migration).
   */
  admissionStatus?: ContributionAdmissionStatus;
  /** Auditable admission basis when admissionStatus === 'admitted'. */
  admission?: ContributionAdmissionRecord;
  /**
   * Receiver-specific assessment eligibility (admitted evidence type × methodology).
   * Controlling authority for production assessment consumption.
   */
  receiverEligibility?: Partial<Record<AssessmentReceiverId, ReceiverEligibility>>;
  /** Provenance / source reference for the evidence record. */
  sourceProvenance?: string;
};

export type FounderAdminAction = 'uphold' | 'supersede' | 'withdraw' | 'suppress';

export const RVEEL_PENDING_FIELD_MARK = '_rveelPendingContributionFields';

export type RveelPendingContributionFields = {
  nutrition?: boolean;
  ingredients?: boolean;
  origin?: boolean;
  labels?: boolean;
};

