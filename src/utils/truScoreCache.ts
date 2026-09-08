// TruScore calculated-score cache — RETIRED from ordinary runtime (Review 1 Pass 2 / NA-001).
//
// Production assessment must always recalculate. Historical @truescan_truscore_cache_* keys
// may remain physically present but have zero runtime authority (reads always miss; writes no-op).
// No migration wipe is performed.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from './logger';
import { TruScoreResult } from '../lib/truscoreEngine';

const CACHE_KEY_PREFIX = '@truescan_truscore_cache_';

/**
 * @deprecated Calculated TruScore cache retired — always returns null.
 */
export async function getCachedTruScore(_barcode: string): Promise<TruScoreResult | null> {
  return null;
}

/**
 * @deprecated Calculated TruScore cache retired — no-op (does not persist).
 */
export async function cacheTruScore(_barcode: string, _result: TruScoreResult): Promise<void> {
  // Intentionally empty — NA-001 / NA-015: never persist calculated conclusions.
}

/**
 * Optional cleanup of a single orphaned key (e.g. contribution merge). Not required for correctness.
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
 * Optional bulk cleanup of orphaned keys. Not called by ordinary runtime.
 */
export async function clearTruScoreCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((key) => key.startsWith(CACHE_KEY_PREFIX));
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
    logger.info(`Cleared ${cacheKeys.length} orphaned TruScore cache entries (optional)`);
  } catch (error) {
    logger.error('Error clearing TruScore cache', error);
  }
}

/**
 * Diagnostics only — counts orphaned keys that no longer have runtime authority.
 */
export async function getTruScoreCacheStats(): Promise<{
  count: number;
  oldestTimestamp: number | null;
  newestTimestamp: number | null;
}> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((key) => key.startsWith(CACHE_KEY_PREFIX));
    return {
      count: cacheKeys.length,
      oldestTimestamp: null,
      newestTimestamp: null,
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
