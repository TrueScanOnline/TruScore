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
  clearHistory: () => void;
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

  clearHistory: async () => {
    set({ recentScans: [] });
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear scan history:', error);
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

