// Theme configuration
import { useSettingsStore } from '../store/useSettingsStore';
import { lightColors, darkColors, Colors } from './colors';

export function useTheme() {
  const { darkMode } = useSettingsStore();
  const colors: Colors = darkMode ? darkColors : lightColors;

  return {
    colors,
    darkMode,
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      xxl: 40,
    },
    borderRadius: {
      sm: 8,
      md: 12,
      lg: 16,
      xl: 24,
      full: 9999,
    },
    shadows: {
      sm: {
        shadowColor: darkMode ? '#000' : '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: darkMode ? 0.5 : 0.1,
        shadowRadius: 2,
        elevation: 2,
      },
      md: {
        shadowColor: darkMode ? '#000' : '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: darkMode ? 0.5 : 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
      lg: {
        shadowColor: darkMode ? '#000' : '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: darkMode ? 0.6 : 0.15,
        shadowRadius: 8,
        elevation: 5,
      },
    },
  };
}

export { lightColors, darkColors };
export type { Colors };

