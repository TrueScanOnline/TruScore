/**
 * Stage 2 path control: exact matcher vs fail-closed (no legacy broad Safety publish).
 */

/**
 * When true, MILO uses the exact-GTIN matcher.
 * When false, MILO is unavailable for scan-triggered alerts — legacy brand-wide path is NEVER restored.
 *
 * UAT profiles (eas.json):
 * - uat-ios-flag-off (BN 29): EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH=0
 * - uat-ios-flag-on (BN 30): EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH=1
 */
export function isFoodRecallCorrectedPathEnabled(): boolean {
  return process.env.EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH === '1';
}

/**
 * All four legacy Safety recall subject-link IDs — always suppressed from scan publication
 * once Stage 2 controls are present (corrected path on or off).
 */
export function suppressedLegacySafetySignalIds(): string[] {
  return ['SIG_REG_AU_001', 'SIG_REG_AU_002', 'SIG_REG_NZ_001', 'SIG_REG_NZ_002'];
}

/** @deprecated Alias — same as suppressedLegacySafetySignalIds (always all four). */
export function alwaysSuppressedLegacySafetySignalIds(): string[] {
  return suppressedLegacySafetySignalIds();
}
