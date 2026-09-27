import type { ContributionDomain } from '../config/contributionPolicy';
import type { OriginStructuredEvidence } from '../contributions/originStructured';
import type { ContributionEvidence } from '../contributions/types';
import type { NutritionBasis, StatedNutritionAmount } from '../ingredientsNutrition/nutritionSchema';

export type AuthorityEnv = 'uat' | 'production';

export type AuthorityRecordClass = 'uat' | 'production';

export type GovernanceState = 'active' | 'review_required' | 'withdrawn' | 'suppressed';

export type AdmissionState = 'admitted' | 'rejected';

/**
 * Client fact before server subject allocation.
 * Authority fields on the surrounding submission are ignored.
 */
export type EvidenceFactInput = {
  domain: ContributionDomain;
  claimValue?: string;
  exactWording?: string;
  variantKey?: string;
  labelsTags?: string[];
  originStructured?: OriginStructuredEvidence;
  ingredientsText?: string;
  /** Not a frozen schema field. Recorded as a gap; does not create a subject. */
  ingredientsLanguage?: string;
  nutritionBasis?: NutritionBasis;
  nutriments?: StatedNutritionAmount[];
  packetAbsence?: boolean;
  servingSize?: string;
  servingsPerPack?: string;
  preparation?: string;
  certificationScope?: string;
  machineRunId?: string;
  region?: { x: number; y: number; width: number; height: number };
};

export type EvidenceSubmissionInput = {
  idempotencyKey: string;
  barcode: string;
  sourceBytes: Uint8Array;
  declaredSha256: string;
  contentType?: string;
  facts: EvidenceFactInput[];
  /**
   * Present only so tests can prove the server ignores it.
   * admission state, eligibility, epoch, and record class here do nothing.
   */
  clientAuthority?: Record<string, unknown>;
};

export type SharedEvidenceSnapshot = {
  barcode: string;
  authorityEnv: AuthorityEnv;
  epoch: string;
  recordClass: AuthorityRecordClass;
  generatedAt: number;
  prevailing: Array<{
    subjectKey: string;
    versionId: string;
    versionNo: number;
    admissionSeq: number;
    governance: 'active' | 'review_required';
    evidence: ContributionEvidence;
  }>;
  offDispatch: Array<{
    dispatchId: string;
    versionId: string;
    status: string;
    target: string | null;
    readBackStatus: string;
    fields: Record<string, string>;
  }>;
};

export type SubmissionOutcome = {
  idempotencyKey: string;
  status: 'admitted' | 'rejected' | 'pending_source' | 'source_hash_mismatch' | 'no_facts';
  versionIds: string[];
  admissionSeqs: number[];
  gaps: string[];
  snapshot: SharedEvidenceSnapshot | null;
};

export type DerivedFact = {
  domain: ContributionDomain;
  subjectKey: string;
  claimKey: string;
  claimValue: string;
  exactWording?: string;
  variantKey?: string;
  labelsTags?: string[];
  originStructured?: OriginStructuredEvidence;
  ingredientsNutrition?: ContributionEvidence['ingredientsNutrition'];
  machineRunId?: string;
  region?: { x: number; y: number; width: number; height: number };
};

export type VersionRecord = {
  versionId: string;
  subjectId: string;
  subjectKey: string;
  barcode: string;
  domain: ContributionDomain;
  versionNo: number;
  submissionKey: string;
  contributorId: string;
  content: ContributionEvidence;
  sourceAssetId: string;
  regionId: string | null;
  admissionStatus: AdmissionState;
  admissionSeq: number | null;
  governance: GovernanceState;
  authorityEpoch: string;
  authorityRecordClass: AuthorityRecordClass;
  createdAt: number;
};

export type EventRecord = {
  eventId: string;
  versionId: string;
  kind: string;
  actorId: string;
  detail: Record<string, unknown>;
  createdAt: number;
};

export type ResponseRecord = {
  responseId: string;
  versionId: string;
  contributorId: string;
  kind: 'confirm' | 'dispute';
  active: boolean;
  createdAt: number;
};

export type DispatchRecord = {
  dispatchId: string;
  submissionKey: string;
  versionId: string;
  barcode: string;
  status: 'pending_unconfigured' | 'pending' | 'sent' | 'failed_retryable';
  target: string | null;
  fields: Record<string, string>;
  readBackStatus: 'not_run' | 'read';
  createdAt: number;
};

export type ContributorRecord = {
  contributorId: string;
  tokenHash: string;
  accountId: string | null;
  createdAt: number;
};
