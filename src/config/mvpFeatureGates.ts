/**
 * Rveel MVP feature gates — production-default OFF for optional surfaces.
 *
 * Founder 2026-11-17 / 2026-11-18 corrective: consumer product-evidence is
 * preselected-only. Free-form guided contribution (photos / free text) stays
 * OFF while that policy is active, even if an older UAT entitlement set
 * EXPO_PUBLIC_MVP_GUIDED_CONTRIBUTION=1.
 *
 * FM-03R photo-free Claims absence attestation is separately permitted.
 */

import { expectedAuthorityEnv } from '../evidenceAuthority/assessment';
import { isStoreReleaseRuntime } from './scoreDiagnostics';
import {
  isConsumerFreeFormGuidedContributionAllowed,
  isMvpConsumerInputClassPermitted,
  isMvpPreselectedOnlyConsumerPolicyActive,
} from './mvpContributionInputPolicy';

/**
 * Free-form guided packet / origins / nutrition / claims contribution submission
 * (photos, free text, typed nutrition). Requires explicit opt-in AND authority env,
 * and is blocked while the preselected-only MVP policy is active.
 */
export function isGuidedContributionSubmitEnabled(): boolean {
  if (!isConsumerFreeFormGuidedContributionAllowed()) return false;
  if (process.env.EXPO_PUBLIC_MVP_GUIDED_CONTRIBUTION !== '1') return false;
  if (!expectedAuthorityEnv()) return false;
  return true;
}

/**
 * FM-03R: photo-free Claims packet-absence user attestation.
 * Permitted under preselected-only when the Evidence Authority environment is set.
 * Does not broaden eligibility beyond Claims NR gates in highlightContributionLinks.
 */
export function isClaimsAbsenceAttestationContributionEnabled(): boolean {
  if (!isMvpConsumerInputClassPermitted('packet_absence_user_attestation')) return false;
  if (process.env.EXPO_PUBLIC_MVP_CLAIMS_ABSENCE_ATTESTATION === '0') return false;
  if (!expectedAuthorityEnv()) return false;
  return true;
}

/**
 * Structured Product Origins (claim type + governed country picker).
 * Photo-free, no free-text wording, no typed percentage under preselected-only.
 * Does not re-enable nutrition / packet / camera journeys.
 */
export function isStructuredOriginsContributionEnabled(): boolean {
  if (!expectedAuthorityEnv()) return false;
  if (!isMvpPreselectedOnlyConsumerPolicyActive()) {
    return isGuidedContributionSubmitEnabled();
  }
  if (process.env.EXPO_PUBLIC_MVP_STRUCTURED_ORIGINS === '0') return false;
  return (
    isMvpConsumerInputClassPermitted('governed_country_choice') &&
    isMvpConsumerInputClassPermitted('governed_origin_claim_type')
  );
}

/** True when any MVP-allowed contribution modal destination may open. */
export function isAnyMvpContributionModalEnabled(): boolean {
  return isGuidedContributionSubmitEnabled() || isStructuredOriginsContributionEnabled();
}

/**
 * Community Agreements (WP09). Default OFF for MVP — no migration applied.
 * When OFF: no fetch/submit and no fabricated counts in UI.
 * Agree responses remain the only WP09 write when enabled; Correct targets free-form Change.
 */
export function isCommunityAgreementsEnabled(): boolean {
  if (
    isMvpPreselectedOnlyConsumerPolicyActive() &&
    !isMvpConsumerInputClassPermitted('community_agreement_agree')
  ) {
    return false;
  }
  return process.env.EXPO_PUBLIC_MVP_COMMUNITY_AGREEMENTS === '1';
}

/**
 * Store/public builds must never ship optional Contribution / WP09 surfaces
 * entitled without founder opt-in review. Local Metro uses `.env.development`.
 */
export function assertMvpFeatureGatesReleaseSafe(): void {
  if (!isStoreReleaseRuntime()) return;
  if (process.env.EXPO_PUBLIC_MVP_GUIDED_CONTRIBUTION === '1') {
    throw new Error(
      '[MVP] Guided contribution must not be entitled in a store/public release until UAT admission is founder-approved for shipping'
    );
  }
  if (process.env.EXPO_PUBLIC_MVP_COMMUNITY_AGREEMENTS === '1') {
    throw new Error(
      '[MVP] Community Agreements must not be entitled in a store/public release until WP09 is operational and founder-approved'
    );
  }
}
