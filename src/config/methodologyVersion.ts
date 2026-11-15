/**
 * Internal Rveel Score methodology version anchor (engineering control).
 * Doctrine INV-SC-9 / D-9: this constant is NOT authoritative for consumer display.
 * Do not surface `v${RVEEL_SCORE_METHODOLOGY_VERSION}` (or any invented public methodology
 * version) in consumer-reachable copy. Live registries remain Body/Planet/Claims/Open.
 * When scoring changes meaningfully under `src/lib/truscoreEngine/`, bump this constant
 * and re-review consumer methodology copy for accuracy (without reintroducing a public version).
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
