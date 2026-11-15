import { isStoreReleaseRuntime } from './scoreDiagnostics';

/**
 * DeveloperSettings (FSANZ import, onboarding wipe, etc.) must remain available to
 * founder/UAT/dev builds, but must not be an ordinary consumer deep-link target in
 * production-class store releases.
 *
 * Classification: GREEN containment of a presentation/navigation exposure using the
 * existing store-release runtime guard. Does not change scoring or Evidence Authority.
 */
export function isDeveloperSettingsRouteEnabled(): boolean {
  return !isStoreReleaseRuntime();
}
