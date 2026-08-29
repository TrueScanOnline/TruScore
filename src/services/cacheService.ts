// Offline caching service for product data
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Product } from '../types/product';
import { logger } from '../utils/logger';
import {
  getOffRevalidationTimestamp,
  withOffRevalidationTimestamp,
} from './offRevalidationPolicy';

const CACHE_DIR = `${FileSystem.cacheDirectory}truescan/`;
const CACHE_STORAGE_KEY = '@truescan_product_cache';
const MAX_CACHE_SIZE = 100; // Maximum number of cached products for free users
const MAX_CACHE_SIZE_PREMIUM = 500; // Maximum number of cached products for premium users
const CACHE_EXPIRY_DAYS = 7; // Cache expires after 7 days
const CACHE_EXPIRY_DAYS_PREMIUM = 30; // Premium users get 30 days cache expiry
const WEB_SEARCH_CACHE_EXPIRY_HOURS = 24; // Web search results expire after 24 hours (retry more often)

interface CachedProduct {
  product: Product;
  timestamp: number;
  barcode: string;
}

// Cache locking mechanism to prevent race conditions
const cacheLocks = new Map<string, Promise<void>>();

/**
 * Initialize cache directory
 */
export async function initializeCache(): Promise<void> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    }
  } catch (error) {
    logger.error('Error initializing cache directory', error);
  }
}

/**
 * Get cached product by barcode
 */
export async function getCachedProduct(barcode: string, isPremium: boolean = false): Promise<Product | null> {
  try {
    const cacheData = await AsyncStorage.getItem(CACHE_STORAGE_KEY);
    if (!cacheData) {
      return null;
    }

    const cache: Record<string, CachedProduct> = JSON.parse(cacheData);
    const cached = cache[barcode];

    if (!cached) {
      return null;
    }

    // OPTIMIZED: Extended cache for high-quality sources
    const highQualitySources = ['openfoodfacts', 'openbeautyfacts', 'usda', 'healthcanada', 'fsanz', 'nzfcd', 'afcd', 'ukfsa', 'efsa'];
    const isHighQuality = cached.product.source && highQualitySources.some(source => 
      cached.product.source?.includes(source)
    );
    
    // Web search results have shorter expiry (retry more often)
    const isWebSearch = cached.product.source === 'web_search' || 
                        (cached.product.quality && cached.product.quality < 50) ||
                        (cached.product.completion && cached.product.completion < 50);
    
    // High-quality sources get extended cache (30 days for all users, 60 days for premium)
    // Web search: 24 hours
    // Regular sources: 7-30 days
    let expiryDays: number;
    if (isWebSearch) {
      expiryDays = WEB_SEARCH_CACHE_EXPIRY_HOURS / 24; // 24 hours
    } else if (isHighQuality) {
      expiryDays = isPremium ? 60 : 30; // Extended cache for high-quality sources
    } else {
      expiryDays = isPremium ? CACHE_EXPIRY_DAYS_PREMIUM : CACHE_EXPIRY_DAYS; // Regular: 7-30 days
    }
      
    const ageInDays = (Date.now() - cached.timestamp) / (1000 * 60 * 60 * 24);
    if (ageInDays > expiryDays) {
      // Remove expired cache
      logger.debug(`Cache expired for ${barcode} (${ageInDays.toFixed(1)} days old, expiry: ${expiryDays} days)`);
      await removeCachedProduct(barcode);
      return null;
    }

    const revalidationAt = getOffRevalidationTimestamp(cached.product) ?? cached.timestamp;
    return { ...cached.product, _cachedAt: revalidationAt };
  } catch (error) {
    logger.error('Error getting cached product', error);
    return null;
  }
}

/**
 * Cache a product
 * Premium users get larger cache size
 * Uses locking mechanism to prevent race conditions
 */
export async function cacheProduct(product: Product, isPremium: boolean = false): Promise<void> {
  const lockKey = product.barcode;
  
  // Wait for any existing operation on this barcode
  if (cacheLocks.has(lockKey)) {
    await cacheLocks.get(lockKey);
  }
  
  const cachePromise = (async () => {
  try {
    await initializeCache();

    const cacheData = await AsyncStorage.getItem(CACHE_STORAGE_KEY);
    const cache: Record<string, CachedProduct> = cacheData ? JSON.parse(cacheData) : {};

    const stampedProduct = withOffRevalidationTimestamp(product);
    const writeTimestamp = getOffRevalidationTimestamp(stampedProduct) ?? Date.now();

    // Add new product
    cache[stampedProduct.barcode] = {
      product: stampedProduct,
      timestamp: writeTimestamp,
      barcode: stampedProduct.barcode,
    };

    // Remove oldest entries if cache is too large (premium users get larger cache)
    const maxSize = isPremium ? MAX_CACHE_SIZE_PREMIUM : MAX_CACHE_SIZE;
    const entries = Object.entries(cache);
    if (entries.length > maxSize) {
      // Sort by timestamp and keep only the newest ones
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      const toKeep = entries.slice(0, maxSize);
      const newCache: Record<string, CachedProduct> = {};
      toKeep.forEach(([barcode, data]) => {
        newCache[barcode] = data;
      });
      await AsyncStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(newCache));
    } else {
      await AsyncStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cache));
    }

    // Cache image if available (with optimization)
    if (product.image_url || product.image_front_url) {
      const imageUrl = product.image_url || product.image_front_url || '';
      try {
        // Optimize image before caching
        const { optimizeImageForCache } = await import('./imageOptimizationService');
        const optimizedUrl = await optimizeImageForCache(imageUrl, {
          maxWidth: 800,
          maxHeight: 800,
          quality: 0.8,
          maxFileSizeMB: 2,
        });
        await cacheImage(product.barcode, optimizedUrl);
      } catch (error) {
        // Fallback to original image if optimization fails
        logger.debug('Image optimization failed, using original:', error);
        await cacheImage(product.barcode, imageUrl);
      }
    }
  } catch (error) {
    logger.error('Error caching product', error);
    } finally {
      cacheLocks.delete(lockKey);
  }
  })();
  
  cacheLocks.set(lockKey, cachePromise);
  await cachePromise;
}

/**
 * Cache product image
 */
async function cacheImage(barcode: string, imageUrl: string): Promise<void> {
  try {
    if (!imageUrl) return;

    // Handle local file:// URIs - copy to cache directory instead of downloading
    if (imageUrl.startsWith('file://')) {
      logger.debug(`Image is already local file: ${imageUrl} - copying to cache`);
      try {
        const imagePath = `${CACHE_DIR}${barcode}.jpg`;
        const fileInfo = await FileSystem.getInfoAsync(imagePath);
        
        if (!fileInfo.exists) {
          // Copy the local file to cache directory
          await FileSystem.copyAsync({
            from: imageUrl,
            to: imagePath,
          });
          logger.debug(`Copied local image to cache for ${barcode}`);
        } else {
          logger.debug(`Image already cached for ${barcode}`);
        }
      } catch (error) {
        logger.error('Error copying local image to cache', error);
      }
      return;
    }

    // Skip if it's not an http/https URL
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      logger.warn(`Invalid image URL format (not http/https/file): ${imageUrl}`);
      return;
    }

    const imagePath = `${CACHE_DIR}${barcode}.jpg`;
    const fileInfo = await FileSystem.getInfoAsync(imagePath);

    if (!fileInfo.exists) {
      // CRITICAL: Only use downloadAsync for http/https URLs
      // For file:// URLs, use copyAsync instead (but we already return early above)
      try {
        const downloadResult = await FileSystem.downloadAsync(imageUrl, imagePath);
        if (downloadResult.status === 200) {
          logger.debug(`Cached image for ${barcode}`);
        }
      } catch (downloadError: unknown) {
        // If download fails with file:// error, it means URL was incorrectly formatted
        const errorMessage = downloadError instanceof Error ? downloadError.message : String(downloadError);
        if (errorMessage?.includes('file://') || errorMessage?.includes('Expected URL scheme')) {
          logger.warn(`[cacheService] Image URL appears to be file:// but wasn't detected: ${imageUrl}`);
          return; // Skip caching for invalid URLs
        }
        throw downloadError; // Re-throw other errors
      }
    }
  } catch (error) {
    logger.error('Error caching image', error);
    // Don't throw - image caching failure shouldn't break the app
  }
}

/**
 * Get cached image path
 */
export async function getCachedImagePath(barcode: string): Promise<string | null> {
  try {
    await initializeCache();
    const imagePath = `${CACHE_DIR}${barcode}.jpg`;
    const fileInfo = await FileSystem.getInfoAsync(imagePath);
    return fileInfo.exists ? imagePath : null;
  } catch (error) {
    logger.error('Error getting cached image', error);
    return null;
  }
}

/**
 * Remove cached product
 */
async function removeCachedProduct(barcode: string): Promise<void> {
  try {
    const cacheData = await AsyncStorage.getItem(CACHE_STORAGE_KEY);
    if (!cacheData) return;

    const cache: Record<string, CachedProduct> = JSON.parse(cacheData);
    delete cache[barcode];
    await AsyncStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cache));

    // Remove image
    const imagePath = `${CACHE_DIR}${barcode}.jpg`;
    const fileInfo = await FileSystem.getInfoAsync(imagePath);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(imagePath);
    }
  } catch (error) {
    logger.error('Error removing cached product', error);
  }
}

/**
 * Clear all cached products
 */
export async function clearCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CACHE_STORAGE_KEY);
    await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
    await initializeCache();
  } catch (error) {
    logger.error('Error clearing cache', error);
  }
}

/**
 * Get cache size (number of cached products)
 */
export async function getCacheSize(): Promise<number> {
  try {
    const cacheData = await AsyncStorage.getItem(CACHE_STORAGE_KEY);
    if (!cacheData) return 0;

    const cache: Record<string, CachedProduct> = JSON.parse(cacheData);
    return Object.keys(cache).length;
  } catch (error) {
    logger.error('Error getting cache size', error);
    return 0;
  }
}

