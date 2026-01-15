/**
 * Enhanced Error Handling Service
 * Provides graceful degradation and better error recovery
 */

import { Product, ProductWithTrustScore } from '../types/product';
import { logger } from '../utils/logger';
import { getCachedProduct } from './cacheService';
// CRITICAL FIX: Remove direct import to break require cycle
// Use dynamic import instead

export enum ErrorCategory {
  NETWORK = 'network',
  DATABASE = 'database',
  API = 'api',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown',
}

export enum ErrorSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export interface ErrorContext {
  barcode?: string;
  source?: string;
  [key: string]: unknown;
}

/**
 * Handle error with graceful degradation
 */
export function handleError(
  error: unknown,
  category: ErrorCategory,
  severity: ErrorSeverity,
  context?: ErrorContext
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  // Log error with context
  logger.error(`[${category.toUpperCase()}] ${severity.toUpperCase()}: ${errorMessage}`, {
    ...context,
    stack: errorStack,
  });
  
  // For critical errors, also log to crash reporting service
  if (severity === ErrorSeverity.CRITICAL) {
    // TODO: Integrate with crash reporting service (e.g., Sentry, Crashlytics)
    logger.error('[CRITICAL ERROR]', { errorMessage, context });
  }
}

/**
 * Fetch product with graceful fallback
 * Tries multiple strategies before giving up
 */
export async function fetchProductWithFallback(
  barcode: string,
  primaryFetch: () => Promise<ProductWithTrustScore | null>,
  isPremium: boolean = false
): Promise<ProductWithTrustScore | null> {
  try {
    // Try primary fetch first
    return await primaryFetch();
  } catch (error) {
    handleError(error, ErrorCategory.API, ErrorSeverity.HIGH, { barcode });
    
    // Fallback 1: Try cache
    try {
      logger.info(`[ErrorHandling] Trying cache as fallback for ${barcode}`);
      const cached = await getCachedProduct(barcode, isPremium);
      if (cached) {
        logger.info(`[ErrorHandling] ✅ Found in cache as fallback`);
        // Process cached product
        const { processCachedProduct } = await import('./productCacheService');
        return await processCachedProduct(cached, barcode);
      }
    } catch (cacheError) {
      handleError(cacheError, ErrorCategory.DATABASE, ErrorSeverity.LOW, { barcode });
    }
    
    // Fallback 2: Try SQLite
    try {
      logger.info(`[ErrorHandling] Trying SQLite as fallback for ${barcode}`);
      // Use dynamic import to break require cycle
      const { lookupFromSQLite, processSQLiteProduct } = await import('./productCacheService');
      const sqliteProduct = await lookupFromSQLite(barcode);
      if (sqliteProduct) {
        logger.info(`[ErrorHandling] ✅ Found in SQLite as fallback`);
        return await processSQLiteProduct(sqliteProduct, barcode);
      }
    } catch (sqliteError) {
      handleError(sqliteError, ErrorCategory.DATABASE, ErrorSeverity.LOW, { barcode });
    }
    
    // Last resort: Return null (caller should handle)
    logger.warn(`[ErrorHandling] All fallbacks failed for ${barcode}`);
    return null;
  }
}

/**
 * Create minimal product as last resort
 */
export function createMinimalProduct(barcode: string): ProductWithTrustScore {
  return {
    barcode,
    product_name: `Product ${barcode}`,
    source: 'fallback',
    quality: 10,
    completion: 10,
    trust_score: null,
    trust_score_breakdown: null,
  };
}
