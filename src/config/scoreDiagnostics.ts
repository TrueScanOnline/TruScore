/**
 * Wave 3 P1-C — Score Diagnostics (S28) fail-closed entitlement.
 *
 * Build entitlement: EXPO_PUBLIC_SCORE_DIAGNOSTICS === '1' only.
 * Missing/unset/any other value → OFF.
 * Local Settings toggle applies only when build-entitled.
 * Public/store builds must set EXPO_PUBLIC_SCORE_DIAGNOSTICS=0 and
 * EXPO_PUBLIC_STORE_RELEASE=1 so a misconfigured entitled store build fails validation.
 */

export function isScoreDiagnosticsBuildEntitled(): boolean {
  return process.env.EXPO_PUBLIC_SCORE_DIAGNOSTICS === '1';
}

export function isStoreReleaseRuntime(): boolean {
  return process.env.EXPO_PUBLIC_STORE_RELEASE === '1';
}

/**
 * Fail closed: a store/public release must never ship with diagnostics entitled.
 * Call once at app startup (and from automated tests).
 */
export function assertScoreDiagnosticsReleaseSafe(): void {
  if (isStoreReleaseRuntime() && isScoreDiagnosticsBuildEntitled()) {
    throw new Error(
      '[P1-C] Score Diagnostics entitlement must not be enabled in a production/store release runtime'
    );
  }
}

/** Result entry + modal reachability. */
export function shouldShowScoreDiagnosticsEntry(localToggleEnabled: boolean): boolean {
  return isScoreDiagnosticsBuildEntitled() && localToggleEnabled === true;
}
