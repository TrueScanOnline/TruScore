import type {
  ContributionDisputeReason,
  ContributionDomain,
  ContributionLifecycleState,
} from '../config/contributionPolicy';

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
  submitterId: string;
  createdAt: number;
  updatedAt: number;
  imageUrl?: string;
  exactWording?: string;
  state: ContributionLifecycleState;
  confirmations: ContributorResponse[];
  disputes: DisputeResponse[];
  /** Reserved scoring-eligibility flag; false until promotion + domain policy allow. */
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
