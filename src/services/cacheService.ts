// Offline caching service for product data
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { Product } from '../types/product';
import { getCachePath } from '../utils/fileSystemHelper';

const CACHE_DIR = getCachePath('truescan/');
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

/**
 * Initialize cache directory
 */
export async function initializeCache(): Promise<void> {
  try {
    // Use legacy API (getInfoAsync is deprecated but still works)
    // New API requires different import structure, so we'll use legacy for now
    const dirInfo = await (FileSystem as any).getInfoAsync?.(CACHE_DIR) || { exists: false };
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    }
  } catch (error) {
    // If getInfoAsync fails, just try to create the directory
    try {
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    } catch (createError) {
      console.error('Error initializing cache directory:', createError);
    }
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

    // Check if cache is expired
    // Web search results have shorter expiry (retry more often)
    const isWebSearch = cached.product.source === 'web_search' || 
                        (cached.product.quality && cached.product.quality < 50) ||
                        (cached.product.completion && cached.product.completion < 50);
    
    const expiryDays = isWebSearch 
      ? WEB_SEARCH_CACHE_EXPIRY_HOURS / 24  // Web search: 24 hours
      : (isPremium ? CACHE_EXPIRY_DAYS_PREMIUM : CACHE_EXPIRY_DAYS); // Regular: 7-30 days
      
    const ageInDays = (Date.now() - cached.timestamp) / (1000 * 60 * 60 * 24);
    if (ageInDays > expiryDays) {
      // Remove expired cache
      console.log(`Cache expired for ${barcode} (${ageInDays.toFixed(1)} days old, expiry: ${expiryDays} days)`);
      await removeCachedProduct(barcode);
      return null;
    }

    return cached.product;
  } catch (error) {
    console.error('Error getting cached product:', error);
    return null;
  }
}

/**
 * Cache a product
 * Premium users get larger cache size
 */
export async function cacheProduct(product: Product, isPremium: boolean = false): Promise<void> {
  try {
    await initializeCache();

    const cacheData = await AsyncStorage.getItem(CACHE_STORAGE_KEY);
    const cache: Record<string, CachedProduct> = cacheData ? JSON.parse(cacheData) : {};

    // Add new product
    cache[product.barcode] = {
      product,
      timestamp: Date.now(),
      barcode: product.barcode,
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

    // Cache image if available
    if (product.image_url || product.image_front_url) {
      await cacheImage(product.barcode, product.image_url || product.image_front_url || '');
    }
  } catch (error) {
    console.error('Error caching product:', error);
  }
}

/**
 * Cache product image
 */
async function cacheImage(barcode: string, imageUrl: string): Promise<void> {
  try {
    if (!imageUrl) return;

    // Handle local file:// URIs - copy to cache directory instead of downloading
    if (imageUrl.startsWith('file://')) {
      console.log(`Image is already local file: ${imageUrl} - copying to cache`);
      try {
        const imagePath = `${CACHE_DIR}${barcode}.jpg`;
        // Use legacy API (getInfoAsync is deprecated but still works)
        const fileInfo = await (FileSystem as any).getInfoAsync?.(imagePath) || { exists: false };
        
        if (!fileInfo.exists) {
          // Copy the local file to cache directory
          await FileSystem.copyAsync({
            from: imageUrl,
            to: imagePath,
          });
          console.log(`Copied local image to cache for ${barcode}`);
        } else {
          console.log(`Image already cached for ${barcode}`);
        }
      } catch (error) {
        console.error('Error copying local image to cache:', error);
      }
      return;
    }

    // Skip if it's not an http/https URL
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      console.warn(`Invalid image URL format (not http/https/file): ${imageUrl}`);
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
          console.log(`Cached image for ${barcode}`);
        }
      } catch (downloadError: unknown) {
        // If download fails with file:// error, it means URL was incorrectly formatted
        const errorMessage = downloadError instanceof Error ? downloadError.message : String(downloadError);
        if (errorMessage?.includes('file://') || errorMessage?.includes('Expected URL scheme')) {
          console.warn(`[cacheService] Image URL appears to be file:// but wasn't detected: ${imageUrl}`);
          return; // Skip caching for invalid URLs
        }
        throw downloadError; // Re-throw other errors
      }
    }
  } catch (error) {
    console.error('Error caching image:', error);
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
    console.error('Error getting cached image:', error);
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
    console.error('Error removing cached product:', error);
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
    console.error('Error clearing cache:', error);
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
    console.error('Error getting cache size:', error);
    return 0;
  }
}

