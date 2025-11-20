import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProductWithTrustScore } from '../types/product';

export interface FavoriteItem {
  barcode: string;
  product: ProductWithTrustScore;
  addedAt: number;
}

interface FavoritesStore {
  favorites: FavoriteItem[];
  addFavorite: (barcode: string, product: ProductWithTrustScore) => Promise<void>;
  removeFavorite: (barcode: string) => Promise<void>;
  isFavorite: (barcode: string) => boolean;
  clearFavorites: () => Promise<void>;
  initializeStore: () => Promise<void>;
}

const STORAGE_KEY = '@truescan_favorites';

export const useFavoritesStore = create<FavoritesStore>((set, get) => ({
  favorites: [],

  addFavorite: async (barcode: string, product: ProductWithTrustScore) => {
    const current = get().favorites;
    // Remove if already exists
    const filtered = current.filter((f) => f.barcode !== barcode);
    // Add new favorite
    const updated = [{ barcode, product, addedAt: Date.now() }, ...filtered];
    
    set({ favorites: updated });
    
    try {
      // Store only essential data to save space
      const toStore = updated.map((fav) => ({
        barcode: fav.barcode,
        productName: fav.product.product_name || '',
        trustScore: fav.product.trust_score,
        addedAt: fav.addedAt,
      }));
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch (error) {
      console.error('Failed to save favorites:', error);
    }
  },

  removeFavorite: async (barcode: string) => {
    const current = get().favorites;
    const updated = current.filter((f) => f.barcode !== barcode);
    
    set({ favorites: updated });
    
    try {
      const toStore = updated.map((fav) => ({
        barcode: fav.barcode,
        productName: fav.product.product_name || '',
        trustScore: fav.product.trust_score,
        addedAt: fav.addedAt,
      }));
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch (error) {
      console.error('Failed to save favorites:', error);
    }
  },

  isFavorite: (barcode: string) => {
    return get().favorites.some((f) => f.barcode === barcode);
  },

  clearFavorites: async () => {
    set({ favorites: [] });
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear favorites:', error);
    }
  },

  initializeStore: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Array<{
          barcode: string;
          productName: string;
          trustScore: number;
          addedAt: number;
        }>;
        // Convert stored data back to FavoriteItem format
        // Note: We don't have full product data, so we'll fetch it when needed
        const favorites: FavoriteItem[] = parsed.map((item) => ({
          barcode: item.barcode,
          product: {
            barcode: item.barcode,
            product_name: item.productName,
            trust_score: item.trustScore,
          } as ProductWithTrustScore,
          addedAt: item.addedAt,
        }));
        set({ favorites });
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  },
}));

