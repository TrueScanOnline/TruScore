// src/store/useNZPricesStore.ts

import { create } from 'zustand';
import { ProductPrice } from '../types/pricing';

type State = {
  prices: ProductPrice[];
  loading: boolean;
  error: string | null;
  fetchPrices: (barcode: string) => Promise<void>;
};

// TODO: Replace with your actual Vercel deployment URL after deploying
// After deploying with `vercel --prod`, update this URL
// Example: https://truescan-backend.vercel.app
const BACKEND_URL = 'https://YOUR-NEW-VERCEL-URL.vercel.app';

export const useNZPricesStore = create<State>((set) => ({
  prices: [],
  loading: false,
  error: null,
  fetchPrices: async (barcode) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${BACKEND_URL}/api/nz-prices?barcode=${barcode}`);
      const data = await res.json();
      set({ prices: data.prices || [], loading: false });
    } catch (e) {
      set({ error: 'Failed to load NZ prices', loading: false });
    }
  },
}));

