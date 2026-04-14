import Constants from 'expo-constants';
import expoCopy from './productIdentity.expo.json';

function readSupportEmail(): string {
  const raw = Constants.expoConfig?.extra?.supportEmail;
  if (typeof raw !== 'string') return '';
  const t = raw.trim();
  if (t.length < 5 || !t.includes('@')) return '';
  return t;
}

/** Public-facing product identity. Technical IDs (bundle, scheme, hosts) stay in native/Expo config. */
export const productIdentity = {
  canonicalName: 'Rveel',
  displayName: expoCopy.appName,
  shortName: 'Rveel',
  /** User-visible name for the 0–100 composite score */
  publicScoreName: 'Rveel Score',
  /** Compact form for hashtags / single-token labels */
  publicScoreHashtag: 'RveelScore',
  /** Collective noun in legal copy, e.g. "Rveel and its affiliates …" */
  legalEntityCollective: 'Rveel',
  /** From `EXPO_PUBLIC_SUPPORT_EMAIL` via app.config.js `extra` — required before store-facing release if UI exposes it */
  supportEmail: readSupportEmail(),
  /** URLs: hosts unchanged (Layer B); use masked link text in UI where possible */
  websiteUrl: 'https://truescan.app',
  termsOfServiceUrl: 'https://truescan.app/terms',
  privacyPolicyUrl: 'https://truescan.app/privacy',
  /** Native permission strings (must match App Store / Play expectations) */
  native: {
    cameraPermission: expoCopy.cameraPermission,
    locationWhenInUse: expoCopy.locationWhenInUse,
    locationAlways: expoCopy.locationAlways,
  },
} as const;

export type ProductIdentity = typeof productIdentity;
