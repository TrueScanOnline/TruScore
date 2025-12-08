// Network retry utility with exponential backoff and timeout
// Handles network errors gracefully with retry logic

import { logger } from './logger';

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  timeout?: number;
  backoffMultiplier?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 500, // 500ms
  maxDelay: 5000, // 5 seconds
  timeout: 10000, // 10 seconds
  backoffMultiplier: 2,
};

/**
 * Check if error is a network error (retryable)
 */
function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network request failed') ||
      message.includes('failed to fetch') ||
      message.includes('networkerror') ||
      message.includes('timeout')
    );
  }
  return false;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a timeout promise that rejects after specified time
 */
function createTimeout(timeoutMs: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Request timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });
}

/**
 * Execute a function with retry logic and timeout
 * 
 * @param fn - Function to execute (should return a Promise)
 * @param options - Retry options
 * @returns Result of the function
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | unknown;
  
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      // Create timeout promise
      const timeoutPromise = createTimeout(opts.timeout);
      
      // Race between function and timeout
      const result = await Promise.race([fn(), timeoutPromise]);
      
      // If we got here, function succeeded
      if (attempt > 0) {
        logger.debug(`Network request succeeded after ${attempt} retry(ies)`);
      }
      
      return result;
    } catch (error) {
      lastError = error;
      
      // Check if error is retryable
      const isRetryable = isNetworkError(error);
      
      // Don't retry if:
      // 1. Not a network error (e.g., 404, validation error)
      // 2. Last attempt
      // 3. Timeout (don't retry timeouts)
      if (!isRetryable || attempt === opts.maxRetries || error instanceof Error && error.message.includes('timeout')) {
        if (attempt === opts.maxRetries && isRetryable) {
          logger.warn(`Network request failed after ${opts.maxRetries} retries: ${error instanceof Error ? error.message : String(error)}`);
        }
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelay * Math.pow(opts.backoffMultiplier, attempt),
        opts.maxDelay
      );
      
      logger.debug(`Network request failed (attempt ${attempt + 1}/${opts.maxRetries + 1}), retrying in ${delay}ms...`);
      
      // Wait before retrying
      await sleep(delay);
    }
  }
  
  // Should never reach here, but TypeScript needs it
  throw lastError;
}

/**
 * Wrapper for fetch with retry and timeout
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  return withRetry(
    () => fetch(url, options),
    retryOptions
  );
}


