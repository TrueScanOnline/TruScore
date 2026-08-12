import type {
  ContributionDisputeReason,
  ContributionDomain,
  ContributionLifecycleState,
} from '../config/contributionPolicy';
import type { CertificationLane } from './certificationLane';
import type { OriginStructuredEvidence } from './originStructured';

export type ContributorResponse = {
  contributorId: string;
  timestamp: number;
};

export type DisputeResponse = ContributorResponse & {
  reason: ContributionDisputeReason;
  note?: string;
  replacementEvidenceId?: string;
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
  /** True only when domain policy + lane allow scoring after verification. */
  scoringEligible: boolean;
  canonicalPromoted: boolean;
};

export type FounderAdminAction = 'uphold' | 'supersede' | 'withdraw' | 'suppress';

export const RVEEL_PENDING_FIELD_MARK = '_rveelPendingContributionFields';

export type RveelPendingContributionFields = {
  nutrition?: boolean;
  ingredients?: boolean;
  origin?: boolean;
  labels?: boolean;
};
