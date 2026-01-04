// Product Name Discovery Service
// Discovers product names early in the query flow to enable name-based queries (FSANZ, FoodAtlas)
// This is critical for maximizing query success rates and TruScore quality

import { Product } from '../types/product';
import { logger } from '../utils/logger';
import { getCachedProduct } from './cacheService';
import { lookupProductInSQLite } from './sqliteProductDatabase';
import { fetchProductFromUPCitemdb } from './upcitemdb';
import { fetchProductFromBarcodeSpider } from './barcodeSpider';
import { fetchProductFromEANSearch } from './eanSearchApi';
import { fetchProductFromBarcodeLookup } from './barcodeLookupApi';

/**
 * Discover product name early from multiple sources
 * This enables name-based queries (FSANZ, FoodAtlas) even when barcode queries fail
 * 
 * ENHANCED Strategy:
 * 1. Check SQLite (fastest, offline-first)
 * 2. Check Cache (fast, might have name)
 * 3. Quick API calls (UPCitemdb, Barcode Spider, EAN-Search - name only, don't wait for full data)
 * 4. Try EAN-Search (additional source for better coverage)
 * 
 * Returns the first valid product name found, or null
 */
export async function discoverProductNameEarly(
  barcode: string,
  userCountry: string | null
): Promise<string | null> {
  const strategies = [
    // Strategy 1: SQLite (fastest, offline-first)
    async (): Promise<string | null> => {
      try {
        const sqliteProduct = await lookupProductInSQLite(barcode, userCountry ?? undefined);
        if (sqliteProduct?.product_name && 
            !sqliteProduct.product_name.startsWith('Product ') &&
            sqliteProduct.product_name.length > 3) {
          logger.debug(`[ProductNameDiscovery] Found name in SQLite: ${sqliteProduct.product_name}`);
          return sqliteProduct.product_name;
        }
      } catch (error) {
        logger.debug('[ProductNameDiscovery] SQLite check failed:', error);
      }
      return null;
    },
    
    // Strategy 2: Cache (fast, might have name from previous queries)
    async (): Promise<string | null> => {
      try {
        const cached = await getCachedProduct(barcode, false); // Check free cache first
        if (cached?.product_name && 
            !cached.product_name.startsWith('Product ') &&
            cached.product_name.length > 3) {
          logger.debug(`[ProductNameDiscovery] Found name in cache: ${cached.product_name}`);
          return cached.product_name;
        }
      } catch (error) {
        logger.debug('[ProductNameDiscovery] Cache check failed:', error);
      }
      return null;
    },
    
    // Strategy 3: Quick API calls (name only, timeout quickly)
    // ID 12: Enhanced with GS1 and Barcode Lookup API for better coverage
    async (): Promise<string | null> => {
      // Try all quick APIs in parallel (faster than sequential)
      const quickApiPromises: Promise<Product | null>[] = [
        // UPCitemdb (often has product names, free tier)
        Promise.race([
          fetchProductFromUPCitemdb(barcode),
          new Promise<Product | null>((resolve) => 
            setTimeout(() => resolve(null), 2000) // 2 second timeout
          ),
        ]).catch(() => null),
        
        // Barcode Spider (free, sometimes has names)
        Promise.race([
          fetchProductFromBarcodeSpider(barcode),
          new Promise<Product | null>((resolve) => 
            setTimeout(() => resolve(null), 2000) // 2 second timeout
          ),
        ]).catch(() => null),
        
        // EAN-Search (additional source for better coverage)
        Promise.race([
          fetchProductFromEANSearch(barcode),
          new Promise<Product | null>((resolve) => 
            setTimeout(() => resolve(null), 2000) // 2 second timeout
          ),
        ]).catch(() => null),
        
        // ID 12: Barcode Lookup API (free tier, if API key configured)
        Promise.race([
          fetchProductFromBarcodeLookup(barcode),
          new Promise<Product | null>((resolve) => 
            setTimeout(() => resolve(null), 2000) // 2 second timeout
          ),
        ]).catch(() => null),
      ];
      
      // ID 12: GS1 (if API key available) - add to quick APIs
      if (process.env.EXPO_PUBLIC_GS1_API_KEY) {
        const { fetchProductFromGS1 } = await import('./gs1DataSource');
        quickApiPromises.push(
          Promise.race([
            fetchProductFromGS1(barcode),
            new Promise<Product | null>((resolve) => 
              setTimeout(() => resolve(null), 2000) // 2 second timeout
            ),
          ]).catch(() => null)
        );
      }
      
      const results = await Promise.allSettled(quickApiPromises);
      
      // Return first valid product name found
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          const product = result.value;
          const productName = extractProductName(product);
          if (productName) {
            logger.debug(`[ProductNameDiscovery] Found name in quick API: ${productName}`);
            return productName;
          }
        }
      }
      
      return null;
    },
  ];
  
  // Try strategies in parallel, return first result
  const results = await Promise.allSettled(
    strategies.map(strategy => strategy())
  );
  
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      return result.value;
    }
  }
  
  return null;
}

/**
 * Extract product name from any product result
 * Handles various product name fields and normalizes them
 * ENHANCED: More aggressive extraction with better pattern matching
 */
export function extractProductName(product: Product | null | undefined): string | null {
  if (!product) return null;
  
  // Try different name fields (in priority order)
  const nameCandidates = [
    product.product_name,
    product.product_name_en,
    product.generic_name,
    // Also check raw fields that might have names
    (product as any).title, // UPCitemdb format
    (product as any).description, // Some APIs use this
    (product as any).name, // Generic name field
  ];
  
  for (const candidate of nameCandidates) {
    if (candidate && typeof candidate === 'string') {
      const name = candidate.trim();
      
      // Reject generic names
      if (name.startsWith('Product ') || 
          /^Product\s+\d+$/i.test(name) ||
          name.length < 3) {
        continue; // Try next candidate
      }
      
      // Reject if it's just the barcode
      if (name === product.barcode || name.replace(/\D/g, '') === product.barcode) {
        continue;
      }
      
      return name;
    }
  }
  
  return null;
}

/**
 * Normalize product name for better matching
 * Removes sizes, weights, brands to get core product name
 */
export function normalizeProductName(name: string): string {
  let normalized = name.trim();
  
  // Remove common size/weight patterns
  normalized = normalized.replace(/\b\d+\s*(ml|g|kg|l|oz|lb|fl\s*oz)\b/gi, '');
  
  // Remove common brand patterns (if at start)
  normalized = normalized.replace(/^[A-Z][a-z]+\s+/, '');
  
  // Remove extra whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
}

/**
 * Generate product name variations for better matching
 * Returns array of name variations to try
 */
export function generateProductNameVariations(name: string): string[] {
  const variations: string[] = [name]; // Original name first
  
  const normalized = normalizeProductName(name);
  if (normalized !== name) {
    variations.push(normalized);
  }
  
  // Extract keywords (words longer than 3 characters)
  const words = name.split(/\s+/).filter(w => w.length > 3);
  if (words.length > 1) {
    // Try first 2-3 words
    variations.push(words.slice(0, 2).join(' '));
    if (words.length > 2) {
      variations.push(words.slice(0, 3).join(' '));
    }
  }
  
  // Remove duplicates
  return Array.from(new Set(variations));
}
