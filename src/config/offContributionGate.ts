/**
 * Public Open Food Facts contribution kill-switch.
 * Default OFF until founders approve explicit contributor rights/consent controls.
 *
 * Private Evidence Authority evidence processing is unaffected.
 */

import Constants from 'expo-constants';

/**
 * When true, client may attempt OFF public product/image contribution paths.
 * Missing / unset / any other value → OFF (fail closed).
 */
export function isOffPublicContributionEnabled(): boolean {
  const raw = Constants.expoConfig?.extra?.offPublicContribution;
  return raw === '1' || raw === 1 || raw === true;
}
