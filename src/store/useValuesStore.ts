// Values preferences store - persisted to SecureStore (encrypted)
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export type GeopoliticalPreference = 'neutral' | 'avoid_israel' | 'avoid_palestine' | 'avoid_china' | 'avoid_india';

export interface ValuesPreferences {
  // Geopolitical
  israelPalestine: 'neutral' | 'avoid_israel' | 'avoid_palestine';
  indiaChina: 'neutral' | 'avoid_china' | 'avoid_india';
  
  // Ethical
  avoidAnimalTesting: boolean;
  avoidForcedLabour: boolean;
  
  // Environmental
  avoidPalmOil: boolean;
  
  // Master switches
  geopoliticalEnabled: boolean;
  ethicalEnabled: boolean;
  environmentalEnabled: boolean;
}

const STORAGE_KEY = '@truescan_values_preferences';

const defaultPreferences: ValuesPreferences = {
  israelPalestine: 'neutral',
  indiaChina: 'neutral',
  avoidAnimalTesting: false,
  avoidForcedLabour: false,
  avoidPalmOil: false,
  geopoliticalEnabled: false,
  ethicalEnabled: false,
  environmentalEnabled: false,
};

interface ValuesStore extends ValuesPreferences {
  setIsraelPalestine: (value: 'neutral' | 'avoid_israel' | 'avoid_palestine') => Promise<void>;
  setIndiaChina: (value: 'neutral' | 'avoid_china' | 'avoid_india') => Promise<void>;
  setAvoidAnimalTesting: (value: boolean) => Promise<void>;
  setAvoidForcedLabour: (value: boolean) => Promise<void>;
  setAvoidPalmOil: (value: boolean) => Promise<void>;
  setGeopoliticalEnabled: (value: boolean) => Promise<void>;
  setEthicalEnabled: (value: boolean) => Promise<void>;
  setEnvironmentalEnabled: (value: boolean) => Promise<void>;
  initializeStore: () => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

const savePreferences = async (prefs: ValuesPreferences) => {
  try {
    // Use SecureStore for encrypted storage
    const serialized = JSON.stringify(prefs);
    await SecureStore.setItemAsync(STORAGE_KEY, serialized);
  } catch (error) {
    // Fallback to AsyncStorage if SecureStore fails (e.g., on web)
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (fallbackError) {
      console.error('[ValuesStore] Error saving preferences:', error);
      throw error; // Don't silently fail
    }
  }
};

// Top 5 boycotts by market cap
export const TOP_BOYCOUTS = [
  'Procter & Gamble',
  'Coca-Cola',
  "L'Oréal",
  'Nestlé',
  'Unilever',
];

export const useValuesStore = create<ValuesStore>((set, get) => ({
  ...defaultPreferences,

  setIsraelPalestine: async (value) => {
    set({ israelPalestine: value });
    await savePreferences(get());
  },

  setIndiaChina: async (value) => {
    set({ indiaChina: value });
    await savePreferences(get());
  },

  setAvoidAnimalTesting: async (value) => {
    set({ avoidAnimalTesting: value });
    await savePreferences(get());
  },

  setAvoidForcedLabour: async (value) => {
    set({ avoidForcedLabour: value });
    await savePreferences(get());
  },

  setAvoidPalmOil: async (value) => {
    set({ avoidPalmOil: value });
    await savePreferences(get());
  },

  setGeopoliticalEnabled: async (value) => {
    set({ geopoliticalEnabled: value });
    await savePreferences(get());
  },

  setEthicalEnabled: async (value) => {
    set({ ethicalEnabled: value });
    await savePreferences(get());
  },

  setEnvironmentalEnabled: async (value) => {
    set({ environmentalEnabled: value });
    await savePreferences(get());
  },

  initializeStore: async () => {
    try {
      // Try SecureStore first
      let stored: string | null = null;
      try {
        stored = await SecureStore.getItemAsync(STORAGE_KEY);
      } catch (secureError) {
        // Fallback to AsyncStorage if SecureStore fails
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        stored = await AsyncStorage.getItem(STORAGE_KEY);
      }
      
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate parsed data structure
        if (typeof parsed === 'object' && parsed !== null) {
          set({ ...defaultPreferences, ...parsed });
        } else {
          // Invalid data, reset to defaults
          await savePreferences(defaultPreferences);
        }
      }
    } catch (error) {
      console.error('[ValuesStore] Error loading preferences:', error);
      // Reset to defaults on error
      set(defaultPreferences);
    }
  },

  resetToDefaults: async () => {
    set(defaultPreferences);
    await savePreferences(defaultPreferences);
  },
}));

