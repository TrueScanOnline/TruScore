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

/**
 * Receiver ids for admitted evidence × approved receiving methodology.
 * `body_ingredients_nutrition` is a reserved Body-family slot. Wave 4A.0 does not
 * register any approved Body receiving methodology; 4A.2 may register specific
 * evidence-type × methodology predicates (e.g. Body6 Additives) without redesigning
 * this contract. Additive receiver ids remain allowed in later packages.
 */
export const ASSESSMENT_RECEIVER_IDS = [
  'open_origins',
  'ethics_certifications',
  'body_ingredients_nutrition',
] as const;
export type AssessmentReceiverId = (typeof ASSESSMENT_RECEIVER_IDS)[number];

export const ADMISSION_RULE_VERSION = 'wave4a.0-admission-v1' as const;

/**
 * 4A.0 fail-closed default for the Body receiver slot.
 * Not a permanent architectural prohibition — no approved Body receiving
 * methodology is registered in this package stage.
 */
export const BODY_RECEIVER_4A0_UNREGISTERED_REASON =
  'No approved Body receiving methodology is registered in Wave 4A.0.' as const;

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
