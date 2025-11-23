// FileSystem Helper Utility
// Provides a consistent way to access FileSystem cache directory across different Expo versions

import * as FileSystem from 'expo-file-system/legacy';

/**
 * Get the cache directory path
 * Handles different expo-file-system API versions
 */
export function getCacheDirectory(): string {
  // Try different ways to access cacheDirectory based on Expo version
  const cacheDir = (FileSystem as any).cacheDirectory || 
                  (FileSystem as any).CacheDirectory ||
                  '';
  
  if (!cacheDir) {
    // Fallback: use documentDirectory if cacheDirectory not available
    const docDir = (FileSystem as any).documentDirectory || '';
    return docDir;
  }
  
  return cacheDir;
}

/**
 * Get a path in the cache directory for a specific file/folder
 */
export function getCachePath(relativePath: string): string {
  const cacheDir = getCacheDirectory();
  return `${cacheDir}${relativePath}`;
}

