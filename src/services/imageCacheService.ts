/**
 * Image Cache Service
 * 
 * Handles image caching and optimization for product images.
 * Provides efficient image loading with caching, lazy loading, and optimization.
 * 
 * @module imageCacheService
 */

import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { logger } from '../utils/logger';
import { handleError, ErrorCategory, ErrorSeverity } from './errorHandlingService';

const IMAGE_CACHE_DIR = `${FileSystem.cacheDirectory}truescan/images/`;
const MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB max cache size
const IMAGE_CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CachedImageInfo {
  uri: string;
  localPath: string;
  timestamp: number;
  size: number;
}

/**
 * Initialize image cache directory
 */
export async function initializeImageCache(): Promise<void> {
  try {
    await FileSystem.makeDirectoryAsync(IMAGE_CACHE_DIR, { intermediates: true });
    logger.debug('[ImageCache] Cache directory initialized');
  } catch (error) {
    handleError(error, ErrorCategory.DATABASE, ErrorSeverity.LOW);
  }
}

/**
 * Get cached image path if available
 */
export async function getCachedImagePath(imageUrl: string): Promise<string | null> {
  try {
    if (!imageUrl) return null;
    
    const imageKey = getImageKey(imageUrl);
    const cachedPath = `${IMAGE_CACHE_DIR}${imageKey}`;
    
    const fileInfo = await FileSystem.getInfoAsync(cachedPath);
    if (fileInfo.exists) {
      // Check if cache is expired
      const stat = await FileSystem.getInfoAsync(cachedPath);
      if (stat.exists && 'modificationTime' in stat) {
        const age = Date.now() - (stat.modificationTime || 0) * 1000;
        if (age < IMAGE_CACHE_EXPIRY) {
          logger.debug(`[ImageCache] Cache hit: ${imageKey}`);
          return cachedPath;
        } else {
          // Cache expired, delete it
          await FileSystem.deleteAsync(cachedPath, { idempotent: true });
          logger.debug(`[ImageCache] Cache expired, deleted: ${imageKey}`);
        }
      }
    }
    
    return null;
  } catch (error) {
    handleError(error, ErrorCategory.DATABASE, ErrorSeverity.LOW, { imageUrl });
    return null;
  }
}

/**
 * Cache image from URL
 */
export async function cacheImage(imageUrl: string): Promise<string | null> {
  try {
    if (!imageUrl) return null;
    
    // Check if already cached
    const cachedPath = await getCachedImagePath(imageUrl);
    if (cachedPath) {
      return cachedPath;
    }
    
    const imageKey = getImageKey(imageUrl);
    const localPath = `${IMAGE_CACHE_DIR}${imageKey}`;
    
    // Download and cache image
    const downloadResult = await FileSystem.downloadAsync(imageUrl, localPath);
    
    if (downloadResult.status === 200) {
      logger.debug(`[ImageCache] Image cached: ${imageKey}`);
      
      // Check cache size and clean if needed
      await cleanImageCacheIfNeeded();
      
      return downloadResult.uri;
    }
    
    return null;
  } catch (error) {
    handleError(error, ErrorCategory.NETWORK, ErrorSeverity.LOW, { imageUrl });
    return null;
  }
}

/**
 * Get image key from URL (for cache filename)
 */
function getImageKey(imageUrl: string): string {
  // Create a safe filename from URL
  const urlHash = imageUrl.split('').reduce((acc, char) => {
    const hash = ((acc << 5) - acc) + char.charCodeAt(0);
    return hash & hash;
  }, 0);
  
  const extension = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
  return `${Math.abs(urlHash)}.${extension}`;
}

/**
 * Clean image cache if it exceeds max size
 */
async function cleanImageCacheIfNeeded(): Promise<void> {
  try {
    const files = await FileSystem.readDirectoryAsync(IMAGE_CACHE_DIR);
    const imageInfos: CachedImageInfo[] = [];
    
    for (const file of files) {
      const filePath = `${IMAGE_CACHE_DIR}${file}`;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      if (fileInfo.exists && 'size' in fileInfo && 'modificationTime' in fileInfo) {
        imageInfos.push({
          uri: filePath,
          localPath: filePath,
          timestamp: (fileInfo.modificationTime || 0) * 1000,
          size: fileInfo.size || 0,
        });
      }
    }
    
    // Calculate total cache size
    const totalSize = imageInfos.reduce((sum, info) => sum + info.size, 0);
    
    if (totalSize > MAX_CACHE_SIZE) {
      // Sort by timestamp (oldest first)
      imageInfos.sort((a, b) => a.timestamp - b.timestamp);
      
      // Delete oldest files until under limit
      let currentSize = totalSize;
      for (const info of imageInfos) {
        if (currentSize <= MAX_CACHE_SIZE * 0.8) break; // Keep 80% of max size
        
        await FileSystem.deleteAsync(info.localPath, { idempotent: true });
        currentSize -= info.size;
        logger.debug(`[ImageCache] Deleted old cached image: ${info.localPath}`);
      }
    }
  } catch (error) {
    handleError(error, ErrorCategory.DATABASE, ErrorSeverity.LOW);
  }
}

/**
 * Clear all cached images
 */
export async function clearImageCache(): Promise<void> {
  try {
    await FileSystem.deleteAsync(IMAGE_CACHE_DIR, { idempotent: true });
    await initializeImageCache();
    logger.debug('[ImageCache] Cache cleared');
  } catch (error) {
    handleError(error, ErrorCategory.DATABASE, ErrorSeverity.LOW);
  }
}

/**
 * Get cache size in MB
 */
export async function getImageCacheSize(): Promise<number> {
  try {
    const files = await FileSystem.readDirectoryAsync(IMAGE_CACHE_DIR);
    let totalSize = 0;
    
    for (const file of files) {
      const filePath = `${IMAGE_CACHE_DIR}${file}`;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      if (fileInfo.exists && 'size' in fileInfo) {
        totalSize += fileInfo.size || 0;
      }
    }
    
    return totalSize / (1024 * 1024); // Return in MB
  } catch (error) {
    handleError(error, ErrorCategory.DATABASE, ErrorSeverity.LOW);
    return 0;
  }
}

