/**
 * Cache Warmer Service
 * Pre-fetches popular products to improve perceived performance
 */

import { fetchProduct } from './productService';
import { logger } from '../utils/logger';
import { getCachedProduct } from './cacheService';
import { getUserCountryCode } from '../utils/countryDetection';

/**
 * Popular barcodes by country (can be updated from analytics)
 * These are frequently scanned products that should be pre-cached
 */
const POPULAR_BARCODES: Record<string, string[]> = {
  US: [
    // Popular US products
    '0012000161011', // Coca-Cola
    '00016000157707', // Pepsi
    '0001111000112', // Oreo
    '00016000157707', // Lay's
  ],
  CA: [
    // Popular Canadian products
    '062600000000', // Tim Hortons
  ],
  AU: [
    // Popular Australian products
    '9300675001113', // Example
  ],
  NZ: [
    // Popular New Zealand products
    '9400580012345', // Pams Milk
  ],
  DEFAULT: [
    // Global popular products
    '0012000161011', // Coca-Cola
    '00016000157707', // Pepsi
  ],
};

/**
 * Warm cache with popular products for user's country
 * Should be called on app start or when network is available
 */
export async function warmCacheForPopularProducts(): Promise<void> {
  try {
    const countryCode = getUserCountryCode() || 'DEFAULT';
    const popularBarcodes = POPULAR_BARCODES[countryCode] || POPULAR_BARCODES.DEFAULT;
    
    logger.info(`Warming cache with ${popularBarcodes.length} popular products for ${countryCode}`);
    
    // Fetch products in parallel (but limit concurrency)
    const batchSize = 3;
    for (let i = 0; i < popularBarcodes.length; i += batchSize) {
      const batch = popularBarcodes.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (barcode) => {
          try {
            // Check if already cached
            const cached = await getCachedProduct(barcode, false);
            if (cached) {
              logger.debug(`Product ${barcode} already cached, skipping`);
              return;
            }
            
            // Fetch and cache
            await fetchProduct(barcode, true, false, false);
            logger.debug(`Cached popular product: ${barcode}`);
          } catch (error) {
            logger.debug(`Failed to warm cache for ${barcode}:`, error);
            // Continue with other products
          }
        })
      );
      
      // Small delay between batches to avoid overwhelming the network
      if (i + batchSize < popularBarcodes.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    logger.info('Cache warming completed');
  } catch (error) {
    logger.error('Error warming cache:', error);
  }
}

/**
 * Predict and pre-fetch products user is likely to scan next
 * Based on scan history patterns
 */
export async function predictAndPreFetchProducts(
  recentScans: string[],
  maxPredictions: number = 5
): Promise<void> {
  try {
    // Simple prediction: products in same category or from same brand
    // In a real implementation, this would use ML or analytics data
    
    if (recentScans.length === 0) {
      return;
    }
    
    logger.debug(`Predicting next products to scan based on ${recentScans.length} recent scans`);
    
    // For now, just warm cache with popular products
    // TODO: Implement smarter prediction based on:
    // - Category patterns
    // - Brand patterns
    // - Time of day patterns
    // - Location patterns
    
    await warmCacheForPopularProducts();
  } catch (error) {
    logger.debug('Error in predictive caching:', error);
  }
}

/**
 * Get cache warming status
 */
export async function getCacheWarmingStatus(): Promise<{
  popularProductsCached: number;
  totalPopularProducts: number;
}> {
  try {
    const countryCode = getUserCountryCode() || 'DEFAULT';
    const popularBarcodes = POPULAR_BARCODES[countryCode] || POPULAR_BARCODES.DEFAULT;
    
    let cachedCount = 0;
    for (const barcode of popularBarcodes) {
      const cached = await getCachedProduct(barcode, false);
      if (cached) {
        cachedCount++;
      }
    }
    
    return {
      popularProductsCached: cachedCount,
      totalPopularProducts: popularBarcodes.length,
    };
  } catch (error) {
    logger.error('Error getting cache warming status:', error);
    return {
      popularProductsCached: 0,
      totalPopularProducts: 0,
    };
  }
}
