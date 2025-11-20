// Price storage service for local caching
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProductPricing, PriceHistoryEntry } from '../types/pricing';

const PRICING_CACHE_PREFIX = 'pricing_';
const PRICING_HISTORY_PREFIX = 'pricing_history_';
const PRICING_CACHE_TTL = 60 * 60 * 1000; // 1 hour for pricing data
const PRICING_HISTORY_MAX_DAYS = 30; // Keep 30 days of history

class PriceStorageService {
  /**
   * Get cached pricing data for a product
   */
  async getCachedPricing(barcode: string, currency?: string): Promise<ProductPricing | null> {
    try {
      const key = `${PRICING_CACHE_PREFIX}${barcode}${currency ? `_${currency}` : ''}`;
      const stored = await AsyncStorage.getItem(key);
      
      if (!stored) {
        return null;
      }

      const cached: { pricing: ProductPricing; timestamp: number } = JSON.parse(stored);
      
      // Check if cache is still valid
      if (Date.now() - cached.timestamp > PRICING_CACHE_TTL) {
        // Cache expired, return null but don't delete (might still be useful)
        return null;
      }

      return cached.pricing;
    } catch (error) {
      console.error('Error reading cached pricing:', error);
      return null;
    }
  }

  /**
   * Cache pricing data for a product
   */
  async cachePricing(barcode: string, pricing: ProductPricing): Promise<void> {
    try {
      const key = `${PRICING_CACHE_PREFIX}${barcode}${pricing.currency ? `_${pricing.currency}` : ''}`;
      const data = {
        pricing,
        timestamp: Date.now(),
      };
      
      await AsyncStorage.setItem(key, JSON.stringify(data));
      
      // Also save to price history
      await this.addPriceHistory(barcode, pricing);
    } catch (error) {
      console.error('Error caching pricing:', error);
    }
  }

  /**
   * Add price entry to history
   */
  async addPriceHistory(barcode: string, pricing: ProductPricing): Promise<void> {
    try {
      const key = `${PRICING_HISTORY_PREFIX}${barcode}`;
      const stored = await AsyncStorage.getItem(key);
      
      let history: PriceHistoryEntry[] = stored ? JSON.parse(stored) : [];
      
      // Add current average price to history
      const entry: PriceHistoryEntry = {
        timestamp: pricing.lastUpdated,
        price: pricing.priceRange.average,
        currency: pricing.currency,
        source: pricing.prices[0]?.source || 'api',
      };
      
      history.push(entry);
      
      // Keep only last 30 days
      const cutoffDate = Date.now() - (PRICING_HISTORY_MAX_DAYS * 24 * 60 * 60 * 1000);
      history = history.filter(entry => entry.timestamp > cutoffDate);
      
      // Sort by timestamp
      history.sort((a, b) => a.timestamp - b.timestamp);
      
      await AsyncStorage.setItem(key, JSON.stringify(history));
    } catch (error) {
      console.error('Error adding price history:', error);
    }
  }

  /**
   * Get price history for a product
   */
  async getPriceHistory(barcode: string, days: number = 30): Promise<PriceHistoryEntry[]> {
    try {
      const key = `${PRICING_HISTORY_PREFIX}${barcode}`;
      const stored = await AsyncStorage.getItem(key);
      
      if (!stored) {
        return [];
      }

      const history: PriceHistoryEntry[] = JSON.parse(stored);
      const cutoffDate = Date.now() - (days * 24 * 60 * 60 * 1000);
      
      return history.filter(entry => entry.timestamp > cutoffDate);
    } catch (error) {
      console.error('Error reading price history:', error);
      return [];
    }
  }

  /**
   * Clear cached pricing for a product
   */
  async clearCachedPricing(barcode: string): Promise<void> {
    try {
      // Clear all currency variants
      const keys = await AsyncStorage.getAllKeys();
      const pricingKeys = keys.filter(key => 
        key.startsWith(`${PRICING_CACHE_PREFIX}${barcode}`)
      );
      
      await AsyncStorage.multiRemove(pricingKeys);
    } catch (error) {
      console.error('Error clearing cached pricing:', error);
    }
  }

  /**
   * Clear all pricing cache
   */
  async clearAllCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const pricingKeys = keys.filter(key => 
        key.startsWith(PRICING_CACHE_PREFIX) || key.startsWith(PRICING_HISTORY_PREFIX)
      );
      
      await AsyncStorage.multiRemove(pricingKeys);
    } catch (error) {
      console.error('Error clearing all pricing cache:', error);
    }
  }

  /**
   * Get user-submitted prices (stored locally)
   */
  async getUserSubmittedPrices(barcode: string): Promise<Array<{ price: number; currency: string; timestamp: number; retailer?: string }>> {
    try {
      const key = `user_price_${barcode}`;
      const stored = await AsyncStorage.getItem(key);
      
      if (!stored) {
        return [];
      }

      return JSON.parse(stored);
    } catch (error) {
      console.error('Error reading user submitted prices:', error);
      return [];
    }
  }

  /**
   * Save user-submitted price
   */
  async saveUserSubmittedPrice(
    barcode: string,
    price: number,
    currency: string,
    retailer?: string
  ): Promise<void> {
    try {
      const key = `user_price_${barcode}`;
      const existing = await this.getUserSubmittedPrices(barcode);
      
      const entry = {
        price,
        currency,
        timestamp: Date.now(),
        retailer,
      };
      
      // Add to existing (limit to last 10 submissions per product)
      const updated = [entry, ...existing].slice(0, 10);
      
      await AsyncStorage.setItem(key, JSON.stringify(updated));
      
      // Also trigger a cache refresh for this product
      await this.clearCachedPricing(barcode);
    } catch (error) {
      console.error('Error saving user submitted price:', error);
    }
  }
}

export const priceStorageService = new PriceStorageService();

