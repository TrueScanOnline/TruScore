/**
 * Rveel MVP feature gates — production-default OFF for optional surfaces.
 *
 * Guided contribution requires EXPO_PUBLIC_MVP_GUIDED_CONTRIBUTION=1 and authority env.
 * Preselected-only containment (when explicitly EXPO_PUBLIC_MVP_PRESELECTED_ONLY=1)
 * blocks free-form guided even if entitled. Founder 2026-11-18 restore: policy inactive
 * by default so UAT/dev guided journeys resume when entitled.
 *
 * FM-03R photo-free Claims absence attestation remains separately permitted.
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
