/**
 * Rveel Score methodology version anchor.
 * When you change scoring meaningfully under `src/lib/truscoreEngine/`, bump this constant
 * and update `infoModal.trustScore.note` (en / fr / es) so the substring `v${…}` stays in sync.
 */
export const RVEEL_SCORE_METHODOLOGY_VERSION = '1.4' as const;

/** Primary paths reviewers must re-read after engine or methodology changes */
export const METHODOLOGY_REVIEW_TRIGGER_PATHS: readonly string[] = [
  'src/lib/truscoreEngine/',
  'src/i18n/locales/en.json (infoModal.trustScore)',
  'src/i18n/locales/fr.json (infoModal.trustScore)',
  'src/i18n/locales/es.json (infoModal.trustScore)',
  'src/components/TrustScoreInfoModal.tsx',
];
