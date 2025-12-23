/**
 * Performance Optimizer for Fuzzy Matching
 * 
 * Provides performance optimizations for fuzzy matching:
 * - Pre-computation of common brand variations
 * - Lazy loading for fuzzy matching
 * - Performance monitoring
 */

import { logger } from './logger';
import { normalizeForFuzzyMatching } from './fuzzyMatching';
import { BRAND_DATABASE } from '../data/brandDatabase';

// Pre-computed normalized brand names (for fast exact matching)
let normalizedBrandCache: Map<string, string> | null = null;
let normalizedBrandCacheTimestamp: number = 0;
const NORMALIZED_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Pre-compute normalized brand names for all brands in database
 * This speeds up exact/alias matching significantly
 */
export function precomputeNormalizedBrands(): void {
  if (normalizedBrandCache && (Date.now() - normalizedBrandCacheTimestamp) < NORMALIZED_CACHE_TTL) {
    return; // Cache still valid
  }

  const startTime = Date.now();
  normalizedBrandCache = new Map();

  // Normalize all brand names in database
  for (const [key, data] of Object.entries(BRAND_DATABASE)) {
    const normalized = normalizeForFuzzyMatching(key);
    normalizedBrandCache.set(normalized, key);
    
    // Also normalize aliases
    if (data.aliases) {
      for (const alias of data.aliases) {
        const normalizedAlias = normalizeForFuzzyMatching(alias);
        normalizedBrandCache.set(normalizedAlias, key);
      }
    }
  }

  const duration = Date.now() - startTime;
  logger.info('[PerformanceOptimizer] Pre-computed normalized brands:', {
    brandsCount: Object.keys(BRAND_DATABASE).length,
    normalizedCount: normalizedBrandCache.size,
    durationMs: duration,
  });

  normalizedBrandCacheTimestamp = Date.now();
}

/**
 * Get normalized brand from cache (fast lookup)
 */
export function getNormalizedBrand(brandName: string): string | null {
  if (!normalizedBrandCache) {
    precomputeNormalizedBrands();
  }

  const normalized = normalizeForFuzzyMatching(brandName);
  return normalizedBrandCache?.get(normalized) || null;
}

/**
 * Check if fuzzy matching should be skipped (lazy loading)
 * Returns true if exact/alias match is likely, false if fuzzy matching needed
 */
export function shouldSkipFuzzyMatching(brandName: string): boolean {
  if (!brandName || brandName.length < 3) {
    return true; // Too short, skip
  }

  // If we have a pre-computed match, skip fuzzy matching
  const cachedMatch = getNormalizedBrand(brandName);
  if (cachedMatch) {
    return true; // Exact/alias match found, skip fuzzy
  }

  return false; // Need fuzzy matching
}

/**
 * Performance monitoring for fuzzy matching operations
 */
interface PerformanceMetrics {
  totalOperations: number;
  averageTime: number;
  cacheHitRate: number;
  cacheHits: number;
  cacheMisses: number;
}

let performanceMetrics: PerformanceMetrics = {
  totalOperations: 0,
  averageTime: 0,
  cacheHitRate: 0,
  cacheHits: 0,
  cacheMisses: 0,
};

/**
 * Track performance of a fuzzy matching operation
 */
export function trackPerformance(
  operation: string,
  duration: number,
  fromCache: boolean
): void {
  performanceMetrics.totalOperations++;
  
  if (fromCache) {
    performanceMetrics.cacheHits++;
  } else {
    performanceMetrics.cacheMisses++;
  }

  // Update average time
  const totalTime = performanceMetrics.averageTime * (performanceMetrics.totalOperations - 1) + duration;
  performanceMetrics.averageTime = totalTime / performanceMetrics.totalOperations;

  // Update cache hit rate
  performanceMetrics.cacheHitRate = 
    (performanceMetrics.cacheHits / performanceMetrics.totalOperations) * 100;

  // Log slow operations (increased threshold from 10ms to 100ms to reduce log noise)
  // Operations under 100ms are considered acceptable performance
  if (duration > 100) {
    logger.warn('[PerformanceOptimizer] Slow operation detected:', {
      operation,
      durationMs: duration,
      fromCache,
    });
  }
}

/**
 * Get current performance metrics
 */
export function getPerformanceMetrics(): PerformanceMetrics {
  return { ...performanceMetrics };
}

/**
 * Reset performance metrics (useful for testing)
 */
export function resetPerformanceMetrics(): void {
  performanceMetrics = {
    totalOperations: 0,
    averageTime: 0,
    cacheHitRate: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };
}

/**
 * Log performance summary (call periodically for monitoring)
 */
export function logPerformanceSummary(): void {
  const metrics = getPerformanceMetrics();
  
  if (metrics.totalOperations === 0) {
    return;
  }

  logger.info('[PerformanceOptimizer] Performance summary:', {
    totalOperations: metrics.totalOperations,
    averageTimeMs: `${metrics.averageTime.toFixed(2)}ms`,
    cacheHitRate: `${metrics.cacheHitRate.toFixed(1)}%`,
    cacheHits: metrics.cacheHits,
    cacheMisses: metrics.cacheMisses,
  });
}

/**
 * Initialize performance optimizer
 * Call this on app startup
 */
export function initializePerformanceOptimizer(): void {
  precomputeNormalizedBrands();
  logger.info('[PerformanceOptimizer] Performance optimizer initialized');
}
