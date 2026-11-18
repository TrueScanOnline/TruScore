/**
 * Rveel MVP consumer contribution input policy — preselected-only (dormant / opt-in).
 *
 * History: 2026-11-17 introduced default-deny containment. Founder directive
 * 2026-11-18 restores previously approved guided contribution journeys; this
 * policy is therefore **inactive unless explicitly set to '1'**.
 *
 * When active (EXPO_PUBLIC_MVP_PRESELECTED_ONLY=1): photos, gallery, uploads,
 * free text, unrestricted manual product wording, and VLM/OCR are prohibited.
 * When inactive (default): founder-approved guided / photo / manual journeys
 * resume under existing entitlement gates and Evidence Authority architecture.
 *
 * This module does not change scoring or Evidence Authority admission meaning.
 */

export const MVP_CONTRIBUTION_INPUT_POLICY_ID = 'mvp_preselected_only_v1';
export const MVP_CONTRIBUTION_INPUT_POLICY_DATE = '20261118';
export const MVP_CONTRIBUTION_INPUT_POLICY_VERSION = `${MVP_CONTRIBUTION_INPUT_POLICY_ID}_${MVP_CONTRIBUTION_INPUT_POLICY_DATE}`;

/** Consumer input classes considered under this policy. */
export type MvpConsumerContributionInputClass =
  | 'photo_camera'
  | 'photo_gallery'
  | 'photo_upload'
  | 'free_text_packet'
  | 'free_text_ingredients'
  | 'free_text_origins'
  | 'free_text_nutrition'
  | 'free_text_product'
  | 'arbitrary_percentage'
  | 'manual_product'
  | 'vlm_ocr_extraction'
  | 'packet_absence_user_attestation'
  | 'community_agreement_agree'
  | 'governed_country_choice'
  | 'governed_origin_claim_type'
  | 'governed_certification_id'
  | 'governed_packet_claim_option';

/**
 * Classes the founder has authorised for MVP consumer submission when their
 * existing eligibility / gates are satisfied. Not every class is wired yet.
 */
export const MVP_PERMITTED_CONSUMER_INPUT_CLASSES: readonly MvpConsumerContributionInputClass[] = [
  'packet_absence_user_attestation',
  'community_agreement_agree',
] as const;

export const MVP_PROHIBITED_CONSUMER_INPUT_CLASSES: readonly MvpConsumerContributionInputClass[] = [
  'photo_camera',
  'photo_gallery',
  'photo_upload',
  'free_text_packet',
  'free_text_ingredients',
  'free_text_origins',
  'free_text_nutrition',
  'free_text_product',
  'arbitrary_percentage',
  'manual_product',
  'vlm_ocr_extraction',
] as const;

/**
 * Deferred: governed catalogue selections that exist as concepts but have no
 * founder-approved consumer-only submission path under preselected-only (no free text,
 * no photo). Leave those contribution categories unavailable until approved.
 */
export const MVP_DEFERRED_GOVERNED_CHOICE_CLASSES: readonly MvpConsumerContributionInputClass[] = [
  'governed_country_choice',
  'governed_origin_claim_type',
  'governed_certification_id',
  'governed_packet_claim_option',
] as const;

/**
 * Opt-in containment. Inactive by default after founder 2026-11-18 restore.
 * Set EXPO_PUBLIC_MVP_PRESELECTED_ONLY=1 only with explicit founder direction.
 */
export function isMvpPreselectedOnlyConsumerPolicyActive(): boolean {
  return process.env.EXPO_PUBLIC_MVP_PRESELECTED_ONLY === '1';
}

export function isMvpConsumerInputClassPermitted(
  inputClass: MvpConsumerContributionInputClass
): boolean {
  if (!isMvpPreselectedOnlyConsumerPolicyActive()) return true;
  return (MVP_PERMITTED_CONSUMER_INPUT_CLASSES as readonly string[]).includes(inputClass);
}

export function isConsumerPhotoEvidenceContributionAllowed(): boolean {
  return !isMvpPreselectedOnlyConsumerPolicyActive();
}

export function isConsumerFreeTextEvidenceContributionAllowed(): boolean {
  return !isMvpPreselectedOnlyConsumerPolicyActive();
}

export function isConsumerManualProductContributionAllowed(): boolean {
  return !isMvpPreselectedOnlyConsumerPolicyActive();
}

export function isConsumerVlmOcrContributionAllowed(): boolean {
  return !isMvpPreselectedOnlyConsumerPolicyActive();
}

/** Free-form guided PacketContributionModal journeys (photos + typed evidence). */
export function isConsumerFreeFormGuidedContributionAllowed(): boolean {
  return !isMvpPreselectedOnlyConsumerPolicyActive();
}

/**
 * Superseding discovery/runtime input contract for MVP.
 * Does not mutate immutable discovery asset JSON; consumers must read this overlay.
 */
export const MVP_PACKET_CERTIFICATION_INPUT_RESTRICTION = {
  policyVersion: MVP_CONTRIBUTION_INPUT_POLICY_VERSION,
  supersedesDiscoveryAssetVersion: '1.0.1',
  free_text_is_always_available: false,
  free_text_never_requires_catalogue_membership: false,
  /** Catalogue select-only consumer submission not yet founder-approved as a standalone path. */
  catalogue_only_consumer_submission_enabled: false,
  unmatched_action: 'unavailable_under_mvp_preselected_only',
} as const;
