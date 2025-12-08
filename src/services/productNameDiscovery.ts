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

/**
 * Discover product name early from multiple sources
 * This enables name-based queries (FSANZ, FoodAtlas) even when barcode queries fail
 * 
 * Strategy:
 * 1. Check SQLite (fastest, offline-first)
 * 2. Check Cache (fast, might have name)
 * 3. Quick API calls (UPCitemdb, Barcode Spider - name only, don't wait for full data)
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
    async (): Promise<string | null> => {
      // Try UPCitemdb first (often has product names, free tier)
      try {
        const upcProduct = await Promise.race([
          fetchProductFromUPCitemdb(barcode),
          new Promise<Product | null>((resolve) => 
            setTimeout(() => resolve(null), 2000) // 2 second timeout
          ),
        ]);
        
        if (upcProduct?.product_name && 
            !upcProduct.product_name.startsWith('Product ') &&
            upcProduct.product_name.length > 3) {
          logger.debug(`[ProductNameDiscovery] Found name in UPCitemdb: ${upcProduct.product_name}`);
          return upcProduct.product_name;
        }
      } catch (error) {
        logger.debug('[ProductNameDiscovery] UPCitemdb check failed:', error);
      }
      
      // Try Barcode Spider (free, sometimes has names)
      try {
        const spiderProduct = await Promise.race([
          fetchProductFromBarcodeSpider(barcode),
          new Promise<Product | null>((resolve) => 
            setTimeout(() => resolve(null), 2000) // 2 second timeout
          ),
        ]);
        
        if (spiderProduct?.product_name && 
            !spiderProduct.product_name.startsWith('Product ') &&
            spiderProduct.product_name.length > 3) {
          logger.debug(`[ProductNameDiscovery] Found name in Barcode Spider: ${spiderProduct.product_name}`);
          return spiderProduct.product_name;
        }
      } catch (error) {
        logger.debug('[ProductNameDiscovery] Barcode Spider check failed:', error);
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
 */
export function extractProductName(product: Product | null | undefined): string | null {
  if (!product) return null;
  
  // Try different name fields
  const name = product.product_name || 
               product.product_name_en || 
               product.generic_name ||
               null;
  
  if (!name) return null;
  
  // Reject generic names
  if (name.startsWith('Product ') || 
      /^Product\s+\d+$/i.test(name) ||
      name.length < 3) {
    return null;
  }
  
  return name.trim();
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
