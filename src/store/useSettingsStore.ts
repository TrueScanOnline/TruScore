import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';

interface SettingsStore {
  hasCompletedOnboarding: boolean;
  darkMode: boolean;
  language: 'en' | 'es' | 'fr';
  units: 'metric' | 'imperial';
  analyticsEnabled: boolean;
  setHasCompletedOnboarding: (value: boolean) => Promise<void>;
  setDarkMode: (value: boolean) => Promise<void>;
  setLanguage: (value: 'en' | 'es' | 'fr') => Promise<void>;
  setUnits: (value: 'metric' | 'imperial') => Promise<void>;
  setAnalyticsEnabled: (value: boolean) => Promise<void>;
  initializeStore: () => Promise<void>;
}

const STORAGE_KEY = '@truescan_settings';
const FIRST_LAUNCH_KEY = '@truescan_first_launch';

const defaultSettings = {
  hasCompletedOnboarding: false,
  darkMode: false,
  language: 'en' as const,
  units: 'metric' as const,
  analyticsEnabled: false,
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  // Start with defaults - will be overridden by initializeStore if stored values exist
  hasCompletedOnboarding: false,
  darkMode: false,
  language: 'en' as const,
  units: 'metric' as const,
  analyticsEnabled: false,

  setHasCompletedOnboarding: async (value) => {
    console.log('[SettingsStore] Setting hasCompletedOnboarding to:', value);
    set({ hasCompletedOnboarding: value });
    await saveSettings();
    console.log('[SettingsStore] After save, state:', get().hasCompletedOnboarding);
  },

  setDarkMode: async (value) => {
    set({ darkMode: value });
    await saveSettings();
  },

  setLanguage: async (value) => {
    set({ language: value });
    i18n.changeLanguage(value); // Update i18n language
    await saveSettings();
  },

  setUnits: async (value) => {
    set({ units: value });
    await saveSettings();
  },

  setAnalyticsEnabled: async (value) => {
    set({ analyticsEnabled: value });
    await saveSettings();
  },

  initializeStore: async () => {
    try {
      console.log('[SettingsStore] Starting initialization...');
      
      // Check if this is the very first app launch ever
      const firstLaunch = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
      console.log('[SettingsStore] First launch check:', firstLaunch);
      
      // Also check if settings exist
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      console.log('[SettingsStore] Stored settings check:', stored ? 'exists' : 'null');
      
      // TRUE FIRST LAUNCH: No first launch flag AND no stored settings
      if (firstLaunch === null && !stored) {
        // This is the FIRST EVER app launch - mark it and ensure onboarding shows
        console.log('[SettingsStore] ⭐⭐ TRUE FIRST APP LAUNCH DETECTED (no flag, no settings) - Onboarding will show');
        await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'false'); // Mark that we've launched at least once
        // Use defaults (hasCompletedOnboarding = false) so onboarding shows
        set(defaultSettings);
        console.log('[SettingsStore] Set defaults for first launch. hasCompletedOnboarding:', defaultSettings.hasCompletedOnboarding);
        return; // Exit early - onboarding will show
      }
      
      // POTENTIAL FIRST LAUNCH: First launch flag exists but no settings stored
      // This can happen in development when data is cleared
      if (firstLaunch !== null && !stored) {
        console.log('[SettingsStore] ⚠️ First launch flag exists but no settings found - treating as first launch');
        // Reset first launch flag to allow fresh start
        await AsyncStorage.removeItem(FIRST_LAUNCH_KEY);
        console.log('[SettingsStore] Cleared first launch flag. Using defaults (onboarding will show).');
        set(defaultSettings);
        console.log('[SettingsStore] Set defaults. hasCompletedOnboarding:', defaultSettings.hasCompletedOnboarding);
        return; // Exit early - onboarding will show
      }
      
      // Not first launch - load stored settings
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('[SettingsStore] Parsed JSON:', parsed);
        
        // CRITICAL: Only trust hasCompletedOnboarding if it's explicitly stored
        // If it's missing from stored data, default to false (show onboarding)
        let hasCompletedOnboarding = defaultSettings.hasCompletedOnboarding;
        if ('hasCompletedOnboarding' in parsed && typeof parsed.hasCompletedOnboarding === 'boolean') {
          hasCompletedOnboarding = parsed.hasCompletedOnboarding;
        } else {
          console.log('[SettingsStore] hasCompletedOnboarding not found or invalid in stored data. Defaulting to false (show onboarding).');
        }
        
        // Merge with defaults, but ensure hasCompletedOnboarding is explicitly set
        const settings = { 
          ...defaultSettings, 
          ...parsed,
          hasCompletedOnboarding, // Explicitly use our checked value
        };
        
        console.log('[SettingsStore] Final merged settings:', {
          hasCompletedOnboarding: settings.hasCompletedOnboarding,
          type: typeof settings.hasCompletedOnboarding,
          rawValue: parsed.hasCompletedOnboarding,
          wasInStorage: 'hasCompletedOnboarding' in parsed,
          allSettings: settings,
        });
        
        set(settings);
        
        // Initialize i18n with saved language
        if (settings.language) {
          i18n.changeLanguage(settings.language);
        }
      } else {
        // No stored settings - use defaults (hasCompletedOnboarding = false, so onboarding will show)
        console.log('[SettingsStore] No stored settings found. Using defaults:', defaultSettings);
        console.log('[SettingsStore] Default hasCompletedOnboarding:', defaultSettings.hasCompletedOnboarding);
        set(defaultSettings);
      }
    } catch (error) {
      console.error('[SettingsStore] Failed to load settings:', error);
      // On error, use defaults (hasCompletedOnboarding = false, so onboarding will show)
      console.log('[SettingsStore] Error occurred, using defaults:', defaultSettings);
      set(defaultSettings);
    }
  },
}));

async function saveSettings() {
  const state = useSettingsStore.getState();
  try {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        darkMode: state.darkMode,
        language: state.language,
        units: state.units,
        analyticsEnabled: state.analyticsEnabled,
      })
    );
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

