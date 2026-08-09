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
