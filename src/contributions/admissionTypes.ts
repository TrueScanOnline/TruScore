/**
 * Wave 4A.0 admission / receiver-eligibility type surface.
 * Kept separate from admissionContract.ts to avoid circular imports with types.ts.
 */

export const CONTRIBUTION_ADMISSION_STATUSES = [
  'raw',
  'submitted',
  'admitted',
  'rejected',
] as const;
export type ContributionAdmissionStatus = (typeof CONTRIBUTION_ADMISSION_STATUSES)[number];

export const ASSESSMENT_RECEIVER_IDS = [
  'open_origins',
  'ethics_certifications',
  'body_ingredients_nutrition',
] as const;
export type AssessmentReceiverId = (typeof ASSESSMENT_RECEIVER_IDS)[number];

export const ADMISSION_RULE_VERSION = 'wave4a.0-admission-v1' as const;

export type ReceiverEligibility = {
  eligible: boolean;
  methodologyId: string;
  methodologyVersion: string;
  basisRuleVersion: string;
  reason: string;
};

export type ContributionAdmissionRecord = {
  admittedAt: number;
  admissionReason: string;
  ruleVersion: string;
  admittedBy?: string;
};
