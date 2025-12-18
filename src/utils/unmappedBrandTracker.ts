/**
 * Unmapped Brand Tracker
 * 
 * Tracks brands that are extracted from products but not found in the brand database.
 * This data can be used to prioritize brand database expansion.
 * 
 * Features:
 * - Tracks brand extraction frequency
 * - Logs brands for manual review
 * - Can be extended to send to analytics backend
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from './logger';

interface UnmappedBrandEntry {
  brand: string;
  firstSeen: number;
  lastSeen: number;
  count: number;
  sources: string[]; // Where the brand was extracted from
  sampleBarcodes: string[]; // Sample barcodes where this brand was seen
}

const STORAGE_KEY = '@truescan_unmapped_brands';
const MAX_SAMPLE_BARCODES = 5; // Keep max 5 sample barcodes per brand
const MAX_BRANDS_TO_TRACK = 1000; // Limit storage size

/**
 * Track an unmapped brand (brand extracted but not in database)
 */
export async function trackUnmappedBrand(
  brand: string,
  barcode: string,
  source: 'product_name' | 'brands_field' | 'brand_owner' | 'brands_tags' = 'product_name'
): Promise<void> {
  try {
    if (!brand || brand.trim().length < 2) {
      return;
    }
    
    const normalizedBrand = brand.trim();
    
    // Get existing tracked brands
    const trackedBrands = await getTrackedBrands();
    
    // Find or create entry for this brand
    let entry = trackedBrands.find(e => e.brand.toLowerCase() === normalizedBrand.toLowerCase());
    
    if (entry) {
      // Update existing entry
      entry.lastSeen = Date.now();
      entry.count += 1;
      
      // Add source if not already present
      if (!entry.sources.includes(source)) {
        entry.sources.push(source);
      }
      
      // Add barcode to samples (keep unique, limit count)
      if (!entry.sampleBarcodes.includes(barcode) && entry.sampleBarcodes.length < MAX_SAMPLE_BARCODES) {
        entry.sampleBarcodes.push(barcode);
      }
    } else {
      // Create new entry
      entry = {
        brand: normalizedBrand,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        count: 1,
        sources: [source],
        sampleBarcodes: [barcode],
      };
      
      trackedBrands.push(entry);
      
      // Limit total brands tracked (remove oldest if over limit)
      if (trackedBrands.length > MAX_BRANDS_TO_TRACK) {
        trackedBrands.sort((a, b) => a.lastSeen - b.lastSeen); // Sort by last seen
        trackedBrands.shift(); // Remove oldest
      }
    }
    
    // Save updated list
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trackedBrands));
    
    logger.debug('[UnmappedBrandTracker] Tracked unmapped brand:', {
      brand: normalizedBrand,
      count: entry.count,
      sources: entry.sources,
    });
  } catch (error) {
    logger.debug('[UnmappedBrandTracker] Error tracking brand (non-critical):', error);
  }
}

/**
 * Get all tracked unmapped brands, sorted by frequency (most common first)
 */
export async function getTrackedBrands(): Promise<UnmappedBrandEntry[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) {
      return [];
    }
    
    const brands: UnmappedBrandEntry[] = JSON.parse(data);
    
    // Sort by count (most frequent first), then by last seen
    return brands.sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count; // Higher count first
      }
      return b.lastSeen - a.lastSeen; // More recent first
    });
  } catch (error) {
    logger.debug('[UnmappedBrandTracker] Error getting tracked brands:', error);
    return [];
  }
}

/**
 * Get top N most frequently seen unmapped brands
 * Useful for prioritizing brand database expansion
 */
export async function getTopUnmappedBrands(limit: number = 50): Promise<UnmappedBrandEntry[]> {
  const allBrands = await getTrackedBrands();
  return allBrands.slice(0, limit);
}

/**
 * Clear tracked brands (useful for testing or cleanup)
 */
export async function clearTrackedBrands(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    logger.info('[UnmappedBrandTracker] Cleared all tracked brands');
  } catch (error) {
    logger.debug('[UnmappedBrandTracker] Error clearing tracked brands:', error);
  }
}

/**
 * Mark a brand as mapped (when it's added to the database)
 * Removes it from tracking
 */
export async function markBrandAsMapped(brand: string): Promise<void> {
  try {
    const trackedBrands = await getTrackedBrands();
    const normalizedBrand = brand.trim().toLowerCase();
    
    const filtered = trackedBrands.filter(e => e.brand.toLowerCase() !== normalizedBrand);
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    logger.info('[UnmappedBrandTracker] Marked brand as mapped:', brand);
  } catch (error) {
    logger.debug('[UnmappedBrandTracker] Error marking brand as mapped:', error);
  }
}
