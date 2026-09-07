/**
 * MVP consumer-path gates — park deferred/legacy surfaces without deleting code.
 * Flip individual flags post-MVP after product authorisation.
 *
 * These are compile-time constants (not env flags) so ordinary MVP journeys
 * cannot re-enable parked UI via persisted preferences or deep links alone.
 */

export const MVP_RUNTIME = {
  /** Legacy Alerts/MyChoices → TruScoreResult.insights cards on Result. */
  legacyAlertsInsights: false,
  /** Consumer Alerts / MyChoices tab + deep-link route. */
  alertsTab: false,
  /** Allergens & Dietary Needs Result surfaces / modal entry. */
  allergensUi: false,
  /** UniversalPricingCard / pricing CTAs on Result. */
  pricingUi: false,
  /** Subscription / Upgrade / paywall + Qonversion initialisation. */
  subscriptionAndPaywall: false,
  /** Eager CSVDatabaseService (EWG/RSPO/Idemat/FAO/USDA/Agribalyse) at app start. */
  legacyPlanetCsvDatabases: false,
} as const;

/**
 * AU/NZ MVP consumer UI locales that may be activated.
 * `es` / `fr` locale JSON may remain as dormant scaffolding — not selectable here.
 */
export const MVP_ENABLED_UI_LOCALES = ['en'] as const;
export type MvpEnabledUiLocale = (typeof MVP_ENABLED_UI_LOCALES)[number];

export function isMvpEnabledUiLocale(code: string | null | undefined): code is MvpEnabledUiLocale {
  if (!code) return false;
  const primary = code.trim().toLowerCase().split(/[-_]/)[0];
  return (MVP_ENABLED_UI_LOCALES as readonly string[]).includes(primary);
}

/** Resolve any requested/device/persisted locale to the MVP-active UI locale (English only). */
export function resolveMvpUiLocale(_requested?: string | null): MvpEnabledUiLocale {
  return 'en';
}

export function isMvpLegacyAlertsInsightsEnabled(): boolean {
  return MVP_RUNTIME.legacyAlertsInsights;
}

export function isMvpAlertsTabEnabled(): boolean {
  return MVP_RUNTIME.alertsTab;
}

export function isMvpAllergensUiEnabled(): boolean {
  return MVP_RUNTIME.allergensUi;
}

export function isMvpPricingUiEnabled(): boolean {
  return MVP_RUNTIME.pricingUi;
}

export function isMvpSubscriptionAndPaywallEnabled(): boolean {
  return MVP_RUNTIME.subscriptionAndPaywall;
}

export function isMvpLegacyPlanetCsvDatabasesEnabled(): boolean {
  return MVP_RUNTIME.legacyPlanetCsvDatabases;
}
