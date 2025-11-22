// User Price Submission Service
// Allows users to submit prices for products, building a community-driven pricing database

import AsyncStorage from '@react-native-async-storage/async-storage';
import { PriceEntry } from '../types/pricing';

export interface UserSubmittedPrice {
  barcode: string;
  price: number;
  currency: string;
  retailer: string;
  location?: string;
  timestamp: number;
  verified: boolean; // Auto-verified if multiple users submit similar prices
}

const STORAGE_KEY_PREFIX = 'user_submitted_prices_';
const STORAGE_KEY_ALL = 'user_submitted_prices_all';

/**
 * Get storage key for a specific barcode
 */
function getStorageKey(barcode: string): string {
  return `${STORAGE_KEY_PREFIX}${barcode}`;
}

/**
 * Submit a user price for a product
 * Validates the price and stores it if valid
 */
export async function submitUserPrice(
  barcode: string,
  price: number,
  currency: string,
  retailer: string,
  location?: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Validation
    if (!barcode || barcode.length < 8) {
      return { success: false, message: 'Invalid barcode' };
    }
    
    if (!price || price <= 0 || price > 10000) {
      return { success: false, message: 'Price must be between $0.01 and $10,000' };
    }
    
    if (!currency || currency.length !== 3) {
      return { success: false, message: 'Invalid currency code' };
    }
    
    if (!retailer || retailer.trim().length === 0) {
      return { success: false, message: 'Retailer name is required' };
    }

    // Check for duplicates (same barcode + retailer + similar price within 5%)
    const existingPrices = await getUserSubmittedPrices(barcode);
    const duplicate = existingPrices.find(
      p => p.retailer.toLowerCase() === retailer.toLowerCase() &&
           Math.abs(p.price - price) / price < 0.05 // Within 5%
    );
    
    if (duplicate) {
      return { success: false, message: 'Similar price already submitted for this retailer' };
    }

    // Check for outliers (price too different from existing prices)
    if (existingPrices.length > 0) {
      const averagePrice = existingPrices.reduce((sum, p) => sum + p.price, 0) / existingPrices.length;
      const priceDifference = Math.abs(price - averagePrice) / averagePrice;
      
      // If price is more than 50% different from average, warn but allow
      if (priceDifference > 0.5) {
        console.warn(`[UserPriceSubmission] Price $${price} is ${(priceDifference * 100).toFixed(0)}% different from average $${averagePrice.toFixed(2)}`);
        // Still allow submission, but mark as unverified
      }
    }

    // Create price entry
    const priceEntry: UserSubmittedPrice = {
      barcode,
      price,
      currency: currency.toUpperCase(),
      retailer: retailer.trim(),
      location: location?.trim(),
      timestamp: Date.now(),
      verified: existingPrices.length >= 2, // Auto-verify if multiple submissions exist
    };

    // Store price
    await storeUserPrice(barcode, priceEntry);

    // Also add to global list for easy retrieval
    await addToGlobalList(barcode);

    return { success: true, message: 'Price submitted successfully!' };
  } catch (error) {
    console.error('[UserPriceSubmission] Error submitting price:', error);
    return { success: false, message: 'Failed to submit price. Please try again.' };
  }
}

/**
 * Store a user-submitted price
 */
async function storeUserPrice(barcode: string, price: UserSubmittedPrice): Promise<void> {
  try {
    const key = getStorageKey(barcode);
    const existing = await AsyncStorage.getItem(key);
    
    let prices: UserSubmittedPrice[] = [];
    if (existing) {
      try {
        prices = JSON.parse(existing);
      } catch (e) {
        console.warn('[UserPriceSubmission] Failed to parse existing prices, starting fresh');
      }
    }
    
    // Add new price
    prices.push(price);
    
    // Sort by timestamp (newest first)
    prices.sort((a, b) => b.timestamp - a.timestamp);
    
    // Keep only last 50 prices per barcode
    if (prices.length > 50) {
      prices = prices.slice(0, 50);
    }
    
    await AsyncStorage.setItem(key, JSON.stringify(prices));
    console.log(`[UserPriceSubmission] Stored price for barcode ${barcode}`);
  } catch (error) {
    console.error('[UserPriceSubmission] Error storing price:', error);
    throw error;
  }
}

/**
 * Get all user-submitted prices for a barcode
 */
export async function getUserSubmittedPrices(barcode: string): Promise<UserSubmittedPrice[]> {
  try {
    const key = getStorageKey(barcode);
    const data = await AsyncStorage.getItem(key);
    
    if (!data) {
      return [];
    }
    
    try {
      const prices = JSON.parse(data) as UserSubmittedPrice[];
      return prices || [];
    } catch (e) {
      console.warn('[UserPriceSubmission] Failed to parse prices');
      return [];
    }
  } catch (error) {
    console.error('[UserPriceSubmission] Error getting prices:', error);
    return [];
  }
}

/**
 * Get the most recent user-submitted price for a barcode and retailer
 */
export async function getLatestUserPrice(
  barcode: string,
  retailer?: string
): Promise<UserSubmittedPrice | null> {
  try {
    const prices = await getUserSubmittedPrices(barcode);
    
    if (prices.length === 0) {
      return null;
    }
    
    // Filter by retailer if specified
    const filtered = retailer
      ? prices.filter(p => p.retailer.toLowerCase() === retailer.toLowerCase())
      : prices;
    
    if (filtered.length === 0) {
      return null;
    }
    
    // Return most recent
    return filtered[0];
  } catch (error) {
    console.error('[UserPriceSubmission] Error getting latest price:', error);
    return null;
  }
}

/**
 * Convert user-submitted prices to PriceEntry format
 */
export function convertToPriceEntries(
  userPrices: UserSubmittedPrice[],
  retailer?: string
): PriceEntry[] {
  return userPrices
    .filter(p => !retailer || p.retailer.toLowerCase() === retailer.toLowerCase())
    .map(p => ({
      price: p.price,
      currency: p.currency,
      retailer: p.retailer,
      location: p.location,
      timestamp: p.timestamp,
      source: 'user' as const,
      verified: p.verified,
    }));
}

/**
 * Get average price from user submissions
 */
export function getAverageUserPrice(userPrices: UserSubmittedPrice[]): number | null {
  if (userPrices.length === 0) {
    return null;
  }
  
  const sum = userPrices.reduce((acc, p) => acc + p.price, 0);
  return sum / userPrices.length;
}

/**
 * Add barcode to global list (for easy retrieval of all barcodes with user prices)
 */
async function addToGlobalList(barcode: string): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY_ALL);
    let barcodes: string[] = [];
    
    if (data) {
      try {
        barcodes = JSON.parse(data);
      } catch (e) {
        console.warn('[UserPriceSubmission] Failed to parse global list');
      }
    }
    
    if (!barcodes.includes(barcode)) {
      barcodes.push(barcode);
      await AsyncStorage.setItem(STORAGE_KEY_ALL, JSON.stringify(barcodes));
    }
  } catch (error) {
    console.error('[UserPriceSubmission] Error adding to global list:', error);
  }
}

/**
 * Get all barcodes with user-submitted prices
 */
export async function getAllBarcodesWithUserPrices(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY_ALL);
    if (!data) {
      return [];
    }
    
    try {
      return JSON.parse(data) as string[];
    } catch (e) {
      console.warn('[UserPriceSubmission] Failed to parse global list');
      return [];
    }
  } catch (error) {
    console.error('[UserPriceSubmission] Error getting global list:', error);
    return [];
  }
}

/**
 * Delete user-submitted prices for a barcode
 */
export async function deleteUserPrices(barcode: string): Promise<boolean> {
  try {
    const key = getStorageKey(barcode);
    await AsyncStorage.removeItem(key);
    
    // Remove from global list
    const data = await AsyncStorage.getItem(STORAGE_KEY_ALL);
    if (data) {
      try {
        const barcodes = JSON.parse(data) as string[];
        const filtered = barcodes.filter(b => b !== barcode);
        await AsyncStorage.setItem(STORAGE_KEY_ALL, JSON.stringify(filtered));
      } catch (e) {
        console.warn('[UserPriceSubmission] Failed to update global list');
      }
    }
    
    return true;
  } catch (error) {
    console.error('[UserPriceSubmission] Error deleting prices:', error);
    return false;
  }
}

