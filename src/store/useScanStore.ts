import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ScanHistoryItem {
  barcode: string;
  timestamp: number;
  productName: string | null;
}

interface ScanStore {
  recentScans: ScanHistoryItem[];
  currentBarcode: string | null;
  addScan: (scan: ScanHistoryItem) => void;
  removeLegacyProvisionalScan: (barcode: string) => void;
  /** Persists deletion; restores prior memory state and throws if durable clear fails. */
  clearHistory: () => Promise<void>;
  initializeStore: () => Promise<void>;
}

const STORAGE_KEY = '@truescan_history';
const MAX_HISTORY_ITEMS = 100;

export const useScanStore = create<ScanStore>((set, get) => ({
  recentScans: [],
  currentBarcode: null,

  addScan: async (scan) => {
    const current = get().recentScans;
    // Remove duplicate if exists
    const filtered = current.filter((s) => s.barcode !== scan.barcode);
    // Add new scan at the beginning
    const updated = [scan, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    
    set({ recentScans: updated });
    
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save scan history:', error);
    }
  },

  removeLegacyProvisionalScan: async (barcode) => {
    const current = get().recentScans;
    const updated = current.filter(
      (s) => !(s.barcode === barcode && s.productName === null)
    );
    if (updated.length === current.length) {
      return;
    }
    set({ recentScans: updated });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to remove legacy provisional scan from history:', error);
    }
  },

  clearHistory: async () => {
    const previous = get().recentScans;
    set({ recentScans: [] });
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      const remaining = await AsyncStorage.getItem(STORAGE_KEY);
      if (remaining != null && remaining !== '' && remaining !== '[]') {
        throw new Error('Scan history clear did not persist');
      }
    } catch (error) {
      set({ recentScans: previous });
      console.error('Failed to clear scan history:', error);
      throw error instanceof Error ? error : new Error('Failed to clear scan history');
    }
  },

  initializeStore: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ScanHistoryItem[];
        set({ recentScans: parsed });
      }
    } catch (error) {
      console.error('Failed to load scan history:', error);
    }
  },
}));

