// Alerts module color palette — user-selectable alert preferences (separate from banner alerts)
// Theme-specific colors for alert insights and UI

export const ALERTS_COLORS = {
  geopolitical: '#991b1b', // Deep crimson red - rage/urgency
  ethical: '#6b21a8', // Muted purple - compassion/dignity
  environmental: '#166534', // Forest green - planet care
  dietary: '#c2410c', // Warm orange - food/religion warmth
  economic: '#1e40af', // Steel blue - money/trust
} as const;

export type AlertsThemeColor = keyof typeof ALERTS_COLORS;

export function getAlertsColor(theme: AlertsThemeColor): string {
  return ALERTS_COLORS[theme];
}

export function getAlertsColorWithOpacity(theme: AlertsThemeColor, opacity: number = 0.1): string {
  const color = ALERTS_COLORS[theme];
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
