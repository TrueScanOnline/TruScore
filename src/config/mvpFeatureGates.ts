/**
 * Rveel MVP feature gates — production-default OFF.
 *
 * Guided contribution submit and Community Agreements stay in source for later
 * releases, but must not promise unavailable workflows or write to backend
 * surfaces that are not operational for the shipping build.
 *
 * Enable only with an explicit EXPO_PUBLIC_* = '1' entitlement.
 * Missing / unset / any other value → OFF (fail closed).
 */

import { expectedAuthorityEnv } from '../evidenceAuthority/assessment';
import { isStoreReleaseRuntime } from './scoreDiagnostics';

/**
 * Guided packet / origins / nutrition contribution submission.
 * Requires explicit opt-in AND a configured Evidence Authority environment.
 * Store/public runtimes stay OFF unless founders deliberately set the flag on
 * that profile (default eas store profiles leave it unset).
 */
export function isGuidedContributionSubmitEnabled(): boolean {
  if (process.env.EXPO_PUBLIC_MVP_GUIDED_CONTRIBUTION !== '1') return false;
  if (!expectedAuthorityEnv()) return false;
  return true;
}

/**
 * Community Agreements (WP09). Default OFF for MVP — no migration applied.
 * When OFF: no fetch/submit and no fabricated counts in UI.
 */
export function isCommunityAgreementsEnabled(): boolean {
  return process.env.EXPO_PUBLIC_MVP_COMMUNITY_AGREEMENTS === '1';
}

/** Store/public builds must never ship Community Agreements entitled without founder opt-in review. */
export function assertMvpFeatureGatesReleaseSafe(): void {
  if (!isStoreReleaseRuntime()) return;
  if (process.env.EXPO_PUBLIC_MVP_COMMUNITY_AGREEMENTS === '1') {
    throw new Error(
      '[MVP] Community Agreements must not be entitled in a store/public release until WP09 is operational and founder-approved'
    );
  }
}
