/**
 * Memory-Aware Cache Service
 * Monitors and limits cache memory usage to prevent memory issues
 */

import { logger } from '../utils/logger';
import * as FileSystem from 'expo-file-system';

interface CacheEntry {
  key: string;
  size: number; // Size in bytes
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

export class MemoryAwareCache {
  private entries = new Map<string, CacheEntry>();
  private maxMemoryMB: number;
  private currentMemoryBytes: number = 0;
  private readonly CACHE_DIR: string;

  constructor(maxMemoryMB: number = 50, cacheDir?: string) {
    this.maxMemoryMB = maxMemoryMB;
    this.CACHE_DIR = cacheDir || `${FileSystem.cacheDirectory}truescan/`;
  }

  /**
   * Get current memory usage in MB
   */
  getCurrentMemoryUsageMB(): number {
    return this.currentMemoryBytes / (1024 * 1024);
  }

  /**
   * Get maximum memory limit in MB
   */
  getMaxMemoryMB(): number {
    return this.maxMemoryMB;
  }

  /**
   * Estimate size of data in bytes
   */
  private estimateSize(data: any): number {
    try {
      return JSON.stringify(data).length;
    } catch {
      // Fallback estimate
      return 1024; // 1KB default
    }
  }

  /**
   * Add entry to cache
   * Automatically evicts old entries if memory limit is exceeded
   */
  async addToCache(key: string, data: any): Promise<boolean> {
    const size = this.estimateSize(data);
    const maxMemoryBytes = this.maxMemoryMB * 1024 * 1024;

    // Check if we need to evict entries
    if (this.currentMemoryBytes + size > maxMemoryBytes) {
      const evicted = await this.evictOldest(size);
      if (!evicted) {
        logger.warn(`Cannot add ${key} to cache: memory limit reached and eviction failed`);
        return false;
      }
    }

    // Add entry
    const existing = this.entries.get(key);
    if (existing) {
      // Update existing entry
      this.currentMemoryBytes -= existing.size;
    }

    this.entries.set(key, {
      key,
      size,
      timestamp: Date.now(),
      accessCount: existing ? existing.accessCount + 1 : 1,
      lastAccessed: Date.now(),
    });

    this.currentMemoryBytes += size;

    logger.debug(
      `Cache entry added: ${key} (${(size / 1024).toFixed(2)}KB, total: ${this.getCurrentMemoryUsageMB().toFixed(2)}MB/${this.maxMemoryMB}MB)`
    );

    return true;
  }

  /**
   * Get entry from cache
   */
  getFromCache(key: string): CacheEntry | null {
    const entry = this.entries.get(key);
    if (entry) {
      // Update access stats
      entry.accessCount++;
      entry.lastAccessed = Date.now();
      return entry;
    }
    return null;
  }

  /**
   * Remove entry from cache
   */
  removeFromCache(key: string): void {
    const entry = this.entries.get(key);
    if (entry) {
      this.currentMemoryBytes -= entry.size;
      this.entries.delete(key);
      logger.debug(`Cache entry removed: ${key}`);
    }
  }

  /**
   * Evict oldest/least recently used entries
   */
  private async evictOldest(requiredSpace: number): Promise<boolean> {
    if (this.entries.size === 0) {
      return false;
    }

    // Sort by last accessed (oldest first), then by access count (least used first)
    const sortedEntries = Array.from(this.entries.values()).sort((a, b) => {
      if (a.lastAccessed !== b.lastAccessed) {
        return a.lastAccessed - b.lastAccessed;
      }
      return a.accessCount - b.accessCount;
    });

    let freedSpace = 0;
    const toEvict: string[] = [];

    for (const entry of sortedEntries) {
      toEvict.push(entry.key);
      freedSpace += entry.size;
      if (freedSpace >= requiredSpace) {
        break;
      }
    }

    // Evict entries
    for (const key of toEvict) {
      this.removeFromCache(key);
    }

    logger.info(
      `Evicted ${toEvict.length} cache entries, freed ${(freedSpace / 1024 / 1024).toFixed(2)}MB`
    );

    return freedSpace >= requiredSpace;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.entries.clear();
    this.currentMemoryBytes = 0;
    logger.info('Memory-aware cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    entryCount: number;
    memoryUsageMB: number;
    maxMemoryMB: number;
    memoryUsagePercent: number;
  } {
    return {
      entryCount: this.entries.size,
      memoryUsageMB: this.getCurrentMemoryUsageMB(),
      maxMemoryMB: this.maxMemoryMB,
      memoryUsagePercent: (this.getCurrentMemoryUsageMB() / this.maxMemoryMB) * 100,
    };
  }

  /**
   * Clean up old cache files from disk
   */
  async cleanupDiskCache(maxAgeHours: number = 24): Promise<number> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.CACHE_DIR);
      if (!dirInfo.exists) {
        return 0;
      }

      const files = await FileSystem.readDirectoryAsync(this.CACHE_DIR);
      const now = Date.now();
      const maxAge = maxAgeHours * 60 * 60 * 1000;
      let deletedCount = 0;

      for (const file of files) {
        const filePath = `${this.CACHE_DIR}${file}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        
        if (fileInfo.exists && 'modificationTime' in fileInfo) {
          const age = now - (fileInfo.modificationTime || 0) * 1000;
          if (age > maxAge) {
            await FileSystem.deleteAsync(filePath, { idempotent: true });
            deletedCount++;
          }
        }
      }

      if (deletedCount > 0) {
        logger.info(`Cleaned up ${deletedCount} old cache files from disk`);
      }

      return deletedCount;
    } catch (error) {
      logger.error('Error cleaning up disk cache:', error);
      return 0;
    }
  }
}

// Singleton instance
let memoryCacheInstance: MemoryAwareCache | null = null;

/**
 * Get the global memory-aware cache instance
 */
export function getMemoryAwareCache(): MemoryAwareCache {
  if (!memoryCacheInstance) {
    memoryCacheInstance = new MemoryAwareCache();
  }
  return memoryCacheInstance;
}
