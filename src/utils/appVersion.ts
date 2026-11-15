import Constants from 'expo-constants';

/**
 * Installed app marketing version for consumer Account footer.
 * Prefer Expo config (same source as app.config.js `version`); fall back to native
 * reported version when present. Never invent a version string.
 */
export function getInstalledAppVersion(): string {
  const fromExpo =
    typeof Constants.expoConfig?.version === 'string' ? Constants.expoConfig.version.trim() : '';
  if (fromExpo) return fromExpo;

  const fromNative =
    typeof Constants.nativeAppVersion === 'string' ? Constants.nativeAppVersion.trim() : '';
  if (fromNative) return fromNative;

  return '—';
}
