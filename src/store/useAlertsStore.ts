// User alert preferences store — persisted to SecureStore (encrypted).
// These preferences drive optional scan insights (not TruScore, not spec-driven banner alerts).
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type GeopoliticalPreference = 'neutral' | 'avoid_israel' | 'avoid_palestine' | 'avoid_china' | 'avoid_india';

export interface AlertsPreferences {
  israelPalestine: 'neutral' | 'avoid_israel' | 'avoid_palestine';
  indiaChina: 'neutral' | 'avoid_china' | 'avoid_india';
  avoidAnimalTesting: boolean;
  avoidForcedLabour: boolean;
  avoidPalmOil: boolean;
  geopoliticalEnabled: boolean;
  ethicalEnabled: boolean;
  environmentalEnabled: boolean;
}

const STORAGE_KEY = '@truescan_alerts_preferences';
const LEGACY_STORAGE_KEY = '@truescan_values_preferences';

const defaultPreferences: AlertsPreferences = {
  israelPalestine: 'neutral',
  indiaChina: 'neutral',
  avoidAnimalTesting: false,
  avoidForcedLabour: false,
  avoidPalmOil: false,
  geopoliticalEnabled: false,
  ethicalEnabled: false,
  environmentalEnabled: false,
};

interface AlertsStore extends AlertsPreferences {
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

const savePreferences = async (prefs: AlertsPreferences) => {
  try {
    const serialized = JSON.stringify(prefs);
    await SecureStore.setItemAsync(STORAGE_KEY, serialized);
  } catch (error) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (fallbackError) {
      console.error('[AlertsStore] Error saving preferences:', error);
      throw error;
    }
  }
};

export const TOP_BOYCOUTS = [
  'Procter & Gamble',
  'Coca-Cola',
  "L'Oréal",
  'Nestlé',
  'Unilever',
];

async function readStoredPreferencesRaw(): Promise<string | null> {
  let stored: string | null = null;
  try {
    stored = await SecureStore.getItemAsync(STORAGE_KEY);
  } catch {
    stored = await AsyncStorage.getItem(STORAGE_KEY);
  }
  if (stored) return stored;
  try {
    stored = await SecureStore.getItemAsync(LEGACY_STORAGE_KEY);
  } catch {
    stored = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
  }
  return stored;
}

export const useAlertsStore = create<AlertsStore>((set, get) => ({
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
      const stored = await readStoredPreferencesRaw();
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed === 'object' && parsed !== null) {
          set({ ...defaultPreferences, ...parsed });
          await savePreferences(get());
        } else {
          await savePreferences(defaultPreferences);
        }
      }
    } catch (error) {
      console.error('[AlertsStore] Error loading preferences:', error);
      set(defaultPreferences);
    }
  },

  resetToDefaults: async () => {
    set(defaultPreferences);
    await savePreferences(defaultPreferences);
  },
}));
