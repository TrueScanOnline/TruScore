// TruScore caching utility
// Caches calculated TruScores to avoid recalculation

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from './logger';
import { TruScoreResult } from '../lib/truscoreEngine';

const CACHE_KEY_PREFIX = '@truescan_truscore_cache_';
const CACHE_VERSION = '1.4'; // Increment when TruScore algorithm changes
const CACHE_EXPIRY_DAYS = 30; // Cache expires after 30 days

interface CachedTruScore {
  result: TruScoreResult;
  version: string;
  timestamp: number;
  barcode: string;
}

/**
 * Get cached TruScore for a barcode
 */
export async function getCachedTruScore(barcode: string): Promise<TruScoreResult | null> {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${barcode}`;
    const cachedData = await AsyncStorage.getItem(cacheKey);
    
    if (!cachedData) {
      return null;
    }

    const cached: CachedTruScore = JSON.parse(cachedData);
    
    // Check version - if algorithm changed, invalidate cache
    if (cached.version !== CACHE_VERSION) {
      logger.debug(`TruScore cache invalidated for ${barcode} (version mismatch: ${cached.version} vs ${CACHE_VERSION})`);
      await removeCachedTruScore(barcode);
      return null;
    }

    // Check expiry
    const ageInDays = (Date.now() - cached.timestamp) / (1000 * 60 * 60 * 24);
    if (ageInDays > CACHE_EXPIRY_DAYS) {
      logger.debug(`TruScore cache expired for ${barcode} (${ageInDays.toFixed(1)} days old)`);
      await removeCachedTruScore(barcode);
      return null;
    }

    return cached.result;
  } catch (error) {
    logger.error('Error getting cached TruScore', error);
    return null;
  }
}

/**
 * Cache TruScore result
 */
export async function cacheTruScore(barcode: string, result: TruScoreResult): Promise<void> {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${barcode}`;
    const cached: CachedTruScore = {
      result,
      version: CACHE_VERSION,
      timestamp: Date.now(),
      barcode,
    };

    await AsyncStorage.setItem(cacheKey, JSON.stringify(cached));
  } catch (error) {
    logger.error('Error caching TruScore', error);
    // Don't throw - caching failure shouldn't break the app
  }
}

/**
 * Remove cached TruScore
 */
export async function removeCachedTruScore(barcode: string): Promise<void> {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${barcode}`;
    await AsyncStorage.removeItem(cacheKey);
  } catch (error) {
    logger.error('Error removing cached TruScore', error);
  }
}

/**
 * Clear all TruScore cache
 */
export async function clearTruScoreCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
    logger.info(`Cleared ${cacheKeys.length} TruScore cache entries`);
  } catch (error) {
    logger.error('Error clearing TruScore cache', error);
  }
}

/**
 * Get cache statistics
 */
export async function getTruScoreCacheStats(): Promise<{
  count: number;
  oldestTimestamp: number | null;
  newestTimestamp: number | null;
}> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
    
    if (cacheKeys.length === 0) {
      return {
        count: 0,
        oldestTimestamp: null,
        newestTimestamp: null,
      };
    }

    const cachedItems = await AsyncStorage.multiGet(cacheKeys);
    const timestamps = cachedItems
      .map(([_, value]) => {
        if (!value) return null;
        try {
          const cached: CachedTruScore = JSON.parse(value);
          return cached.timestamp;
        } catch {
          return null;
        }
      })
      .filter((t): t is number => t !== null);

    return {
      count: cacheKeys.length,
      oldestTimestamp: timestamps.length > 0 ? Math.min(...timestamps) : null,
      newestTimestamp: timestamps.length > 0 ? Math.max(...timestamps) : null,
    };
  } catch (error) {
    logger.error('Error getting TruScore cache stats', error);
    return {
      count: 0,
      oldestTimestamp: null,
      newestTimestamp: null,
    };
  }
}
