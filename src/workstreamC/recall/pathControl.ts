/**
 * Stage 2 path control: corrected matcher vs legacy subject-link Safety publish.
 */

/**
 * When true (default), MILO uses exact matcher and SIG_REG_AU_001 legacy link is suppressed.
 * Set EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH=0 to simulate rollback (legacy MILO only).
 */
export function isFoodRecallCorrectedPathEnabled(): boolean {
  return process.env.EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH !== '0';
}

/** Legacy Safety signal_ids always suppressed in Stage 2 corrected consumer pathway (unavailable / held). */
export function alwaysSuppressedLegacySafetySignalIds(): string[] {
  return ['SIG_REG_AU_002', 'SIG_REG_NZ_001', 'SIG_REG_NZ_002'];
}

/** When corrected path on, also suppress MILO broad brand link. */
export function suppressedLegacySafetySignalIds(): string[] {
  const base = alwaysSuppressedLegacySafetySignalIds();
  if (isFoodRecallCorrectedPathEnabled()) {
    return ['SIG_REG_AU_001', ...base];
  }
  return base;
}
