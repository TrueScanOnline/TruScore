// Values module color palette - v1.3 spec
// Theme-specific colors for Values insights and UI

export const VALUES_COLORS = {
  geopolitical: '#991b1b', // Deep crimson red - rage/urgency
  ethical: '#6b21a8', // Muted purple - compassion/dignity
  environmental: '#166534', // Forest green - planet care
  dietary: '#c2410c', // Warm orange - food/religion warmth
  economic: '#1e40af', // Steel blue - money/trust
} as const;

export type ValuesThemeColor = keyof typeof VALUES_COLORS;

/**
 * Get color for a specific values theme
 */
export function getValuesColor(theme: ValuesThemeColor): string {
  return VALUES_COLORS[theme];
}

/**
 * Get color with opacity for backgrounds
 */
export function getValuesColorWithOpacity(theme: ValuesThemeColor, opacity: number = 0.1): string {
  const color = VALUES_COLORS[theme];
  // Convert hex to rgba
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

