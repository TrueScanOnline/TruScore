/**
 * Optional outbound share-event telemetry / local share analytics.
 * Default OFF for public MVP — sharing still works without them.
 */

import Constants from 'expo-constants';

export function isShareEventTelemetryEnabled(): boolean {
  const raw = Constants.expoConfig?.extra?.shareEventTelemetry;
  return raw === '1' || raw === 1 || raw === true;
}

export function isLocalShareAnalyticsEnabled(): boolean {
  const raw = Constants.expoConfig?.extra?.localShareAnalytics;
  return raw === '1' || raw === 1 || raw === true;
}
