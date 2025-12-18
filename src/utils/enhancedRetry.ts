/**
 * Enhanced Retry Utility with Exponential Backoff
 * Provides comprehensive retry logic for network requests and other async operations
 */

import { logger } from './logger';

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryable?: (error: unknown) => boolean;
  onRetry?: (attempt: number, error: unknown) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'retryable' | 'onRetry'>> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

/**
 * Retry a function with exponential backoff
 * 
 * @param fn - Function to retry
 * @param options - Retry configuration options
 * @returns Result of the function
 * @throws Last error if all retries fail
 * 
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   () => fetchProduct(barcode),
 *   { maxRetries: 3, initialDelay: 1000 }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = DEFAULT_OPTIONS.maxRetries,
    initialDelay = DEFAULT_OPTIONS.initialDelay,
    maxDelay = DEFAULT_OPTIONS.maxDelay,
    backoffMultiplier = DEFAULT_OPTIONS.backoffMultiplier,
    retryable,
    onRetry,
  } = options;
  
  let lastError: Error;
  let delay = initialDelay;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Check if error is retryable
      if (retryable && !retryable(error)) {
        logger.debug(`Error is not retryable, aborting: ${lastError.message}`);
        throw lastError;
      }
      
      // Don't retry on last attempt
      if (attempt < maxRetries) {
        // Call onRetry callback if provided
        if (onRetry) {
          onRetry(attempt + 1, error);
        }
        
        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 0.3 * delay; // 0-30% jitter
        const delayWithJitter = delay + jitter;
        
        logger.debug(
          `Retry attempt ${attempt + 1}/${maxRetries} after ${Math.round(delayWithJitter)}ms: ${lastError.message}`
        );
        
        await new Promise(resolve => setTimeout(resolve, delayWithJitter));
        
        // Exponential backoff
        delay = Math.min(delay * backoffMultiplier, maxDelay);
      }
    }
  }
  
  logger.warn(`All ${maxRetries + 1} retry attempts failed: ${lastError!.message}`);
  throw lastError!;
}

/**
 * Check if an error is retryable (network errors, timeouts, 5xx status codes)
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Network errors
    if (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('econnrefused') ||
      message.includes('enotfound') ||
      message.includes('fetch failed')
    ) {
      return true;
    }
  }
  
  // Check if it's a response with 5xx status
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status;
    if (status >= 500 && status < 600) {
      return true;
    }
  }
  
  return false;
}

/**
 * Retry with exponential backoff, only retrying on retryable errors
 */
export async function retryWithBackoffIfRetryable<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  return retryWithBackoff(fn, {
    ...options,
    retryable: options.retryable || isRetryableError,
  });
}
