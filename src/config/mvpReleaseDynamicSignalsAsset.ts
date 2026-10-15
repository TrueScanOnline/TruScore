/**
 * R-01 / S-01 — MVP release protection for Dynamic Signals Asset.
 *
 * Intended MVP / RC EAS profiles must ship with EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET=1
 * so release builds cannot silently resolve producer=none.
 *
 * Expo Go / Metro is configured separately (.env.development + app.config.js defaults)
 * and is not assumed to inherit EAS profile env.
 */

export const DYNAMIC_SIGNALS_ASSET_ENV_KEY = 'EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET';

/** Profiles that deliver MVP / store / TestFlight-equivalent / RC paths. */
export const MVP_RELEASE_EAS_PROFILES = [
  'production',
  'preview',
  'preview-apk',
  'production-apk',
  'development',
  'uat-dynamic-signals-ios',
  'uat-dynamic-signals-android',
] as const;

export type MvpReleaseEasProfile = (typeof MVP_RELEASE_EAS_PROFILES)[number];

/**
 * Intended phone-testing builds for Wave 5 UAT.
 * Backend URL and evidence-authority environment must both resolve to UAT.
 * Do not repurpose production / preview / production-apk profiles for this role.
 */
export const WAVE5_PHONE_UAT_EAS_PROFILES = [
  'uat-dynamic-signals-ios',
  'uat-dynamic-signals-android',
] as const;

export type Wave5PhoneUatEasProfile = (typeof WAVE5_PHONE_UAT_EAS_PROFILES)[number];

/** Legacy flag-comparison profiles. Not phone-testing targets for Wave 5. */
export const WAVE5_LEGACY_EAS_PROFILES = ['uat-ios-flag-off', 'uat-ios-flag-on'] as const;

export const WAVE5_UAT_BACKEND_HOST = 'https://truscoreapi-uat.vercel.app';
export const WAVE5_UAT_AUTHORITY_ENV = 'uat';

type EasProfile = {
  extends?: string;
  env?: Record<string, string>;
};

export type EasBuildConfig = {
  build?: Record<string, EasProfile>;
};

export type ProfileAssetAssertFailure = {
  profile: string;
  reason: string;
  resolvedValue: string | undefined;
};

export type ProfileAssetAssertResult = {
  ok: boolean;
  failures: ProfileAssetAssertFailure[];
  checkedProfiles: string[];
};

/**
 * Resolve env for a profile after walking `extends` (child overrides parent).
 */
export function resolveEasProfileEnv(
  eas: EasBuildConfig,
  profileName: string,
  seen: Set<string> = new Set()
): Record<string, string> {
  if (seen.has(profileName)) {
    throw new Error(`Circular EAS profile extends involving "${profileName}"`);
  }
  seen.add(profileName);

  const profile = eas.build?.[profileName];
  if (!profile) {
    throw new Error(`EAS profile "${profileName}" not found in eas.json build`);
  }

  const parentEnv = profile.extends
    ? resolveEasProfileEnv(eas, profile.extends, seen)
    : {};

  return { ...parentEnv, ...(profile.env ?? {}) };
}

export function assertMvpReleaseProfilesHaveDynamicSignalsAsset(
  eas: EasBuildConfig,
  profiles: readonly string[] = MVP_RELEASE_EAS_PROFILES
): ProfileAssetAssertResult {
  const failures: ProfileAssetAssertFailure[] = [];
  const checkedProfiles: string[] = [];

  for (const profile of profiles) {
    checkedProfiles.push(profile);
    try {
      const env = resolveEasProfileEnv(eas, profile);
      const value = env[DYNAMIC_SIGNALS_ASSET_ENV_KEY];
      if (value !== '1') {
        failures.push({
          profile,
          reason:
            value === undefined || value === ''
              ? `${DYNAMIC_SIGNALS_ASSET_ENV_KEY} absent after extends merge`
              : `${DYNAMIC_SIGNALS_ASSET_ENV_KEY} is "${value}" (required "1")`,
          resolvedValue: value,
        });
      }
    } catch (e) {
      failures.push({
        profile,
        reason: e instanceof Error ? e.message : String(e),
        resolvedValue: undefined,
      });
    }
  }

  return { ok: failures.length === 0, failures, checkedProfiles };
}

/**
 * Runtime release fail-closed: non-dev builds must have Asset=1.
 * Dev / Expo Go may omit or override for UAT (Metro uses .env.development / app.config defaults).
 */
export function assertDynamicSignalsAssetForReleaseRuntime(
  assetFlag: string | undefined,
  options: { isDev: boolean }
): void {
  if (options.isDev) return;
  if (assetFlag !== '1') {
    throw new Error(
      `MVP release requires ${DYNAMIC_SIGNALS_ASSET_ENV_KEY}=1 ` +
        `(got ${assetFlag === undefined ? 'unset' : JSON.stringify(assetFlag)}). ` +
        'Refusing to start with Signals producer=none.'
    );
  }
}

export type PhoneUatProfileAssertFailure = {
  profile: string;
  reason: string;
};

/**
 * Phone-testing UAT profiles must point the backend and the authority env at UAT together.
 * Production hosts and production authorityEnv fail this check.
 */
export function assertWave5PhoneUatProfilesAgree(
  eas: EasBuildConfig,
  profiles: readonly string[] = WAVE5_PHONE_UAT_EAS_PROFILES
): { ok: boolean; failures: PhoneUatProfileAssertFailure[]; checkedProfiles: string[] } {
  const failures: PhoneUatProfileAssertFailure[] = [];
  const checkedProfiles: string[] = [];

  for (const profile of profiles) {
    checkedProfiles.push(profile);
    try {
      const env = resolveEasProfileEnv(eas, profile);
      const backend = env.EXPO_PUBLIC_BACKEND_URL;
      const authority = env.EXPO_PUBLIC_EVIDENCE_AUTHORITY_ENV;
      if (backend !== WAVE5_UAT_BACKEND_HOST) {
        failures.push({
          profile,
          reason: `EXPO_PUBLIC_BACKEND_URL must be ${WAVE5_UAT_BACKEND_HOST} (got ${backend ?? 'unset'})`,
        });
      }
      if (authority !== WAVE5_UAT_AUTHORITY_ENV) {
        failures.push({
          profile,
          reason: `EXPO_PUBLIC_EVIDENCE_AUTHORITY_ENV must be ${WAVE5_UAT_AUTHORITY_ENV} (got ${authority ?? 'unset'})`,
        });
      }
    } catch (e) {
      failures.push({
        profile,
        reason: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return { ok: failures.length === 0, failures, checkedProfiles };
}
