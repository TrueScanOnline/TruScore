/**
 * Performance Monitoring Utility
 * Tracks and logs performance metrics for product scanning
 * Works globally on iOS and Android platforms
 * 
 * @module performanceMonitor
 */

import { logger } from './logger';
import { Platform } from 'react-native';

export interface PerformanceMetrics {
  barcode: string;
  ttf: number; // Time to First Content (ms)
  tlt: number; // Total Load Time (ms)
  apiCalls: number;
  cacheHit: boolean;
  sources: string[];
  platform: 'ios' | 'android' | 'web';
  userCountry?: string | null;
  networkType?: string;
}

// Store metrics for batch reporting (optional)
const metricsBuffer: PerformanceMetrics[] = [];
const MAX_BUFFER_SIZE = 100;

/**
 * Log performance metrics for a product scan
 * Works on both iOS and Android, globally
 * 
 * @param metrics - Performance metrics to log
 */
export function logPerformanceMetrics(metrics: PerformanceMetrics): void {
  try {
    const platform = Platform.OS as 'ios' | 'android' | 'web';
    
    // Add platform info if not provided
    const metricsWithPlatform = {
      ...metrics,
      platform: metrics.platform || platform,
    };
    
    // Log to console (always available on iOS/Android)
    logger.info('📊 Performance Metrics:', {
      barcode: metricsWithPlatform.barcode,
      timeToFirstContent: `${metricsWithPlatform.ttf}ms`,
      totalLoadTime: `${metricsWithPlatform.tlt}ms`,
      apiCalls: metricsWithPlatform.apiCalls,
      cacheHit: metricsWithPlatform.cacheHit ? 'yes' : 'no',
      sources: metricsWithPlatform.sources.join(', '),
      platform: metricsWithPlatform.platform,
      userCountry: metricsWithPlatform.userCountry || 'unknown',
    });
    
    // Store in buffer for batch reporting (optional)
    metricsBuffer.push(metricsWithPlatform);
    if (metricsBuffer.length > MAX_BUFFER_SIZE) {
      metricsBuffer.shift(); // Remove oldest
    }
    
    // TODO: Send to analytics service (Firebase Analytics, Mixpanel, etc.)
    // This can be implemented later without affecting performance
    // Example:
    // if (__DEV__ === false) {
    //   Analytics.logEvent('product_scan_performance', {
    //     ttf: metricsWithPlatform.ttf,
    //     tlt: metricsWithPlatform.tlt,
    //     apiCalls: metricsWithPlatform.apiCalls,
    //     cacheHit: metricsWithPlatform.cacheHit,
    //     platform: metricsWithPlatform.platform,
    //   });
    // }
  } catch (error) {
    // Non-critical - don't break the app if logging fails
    logger.debug('Error logging performance metrics (non-critical):', error);
  }
}

/**
 * Get buffered metrics (for batch reporting)
 * Useful for sending metrics in batches to reduce network calls
 */
export function getBufferedMetrics(): PerformanceMetrics[] {
  return [...metricsBuffer];
}

/**
 * Clear buffered metrics
 */
export function clearBufferedMetrics(): void {
  metricsBuffer.length = 0;
}

/**
 * Calculate performance score (0-100)
 * Higher score = better performance
 */
export function calculatePerformanceScore(metrics: PerformanceMetrics): number {
  let score = 100;
  
  // Penalize slow Time to First Content
  if (metrics.ttf > 2000) {
    score -= 30; // > 2s is slow
  } else if (metrics.ttf > 1000) {
    score -= 15; // > 1s is moderate
  }
  
  // Penalize slow Total Load Time
  if (metrics.tlt > 5000) {
    score -= 30; // > 5s is slow
  } else if (metrics.tlt > 3000) {
    score -= 15; // > 3s is moderate
  }
  
  // Penalize too many API calls
  if (metrics.apiCalls > 20) {
    score -= 20; // Too many API calls
  } else if (metrics.apiCalls > 15) {
    score -= 10; // Moderate API calls
  }
  
  // Bonus for cache hit
  if (metrics.cacheHit) {
    score += 10; // Cache hit is good
  }
  
  return Math.max(0, Math.min(100, score));
}
