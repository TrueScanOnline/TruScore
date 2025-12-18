/**
 * Request Deduplication Pool
 * Prevents duplicate API requests by pooling active requests
 */

import { logger } from '../utils/logger';

interface PooledRequest<T> {
  promise: Promise<T>;
  timestamp: number;
  key: string;
}

export class RequestDeduplicationPool {
  private activeRequests = new Map<string, PooledRequest<any>>();
  private readonly defaultTTL: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(defaultTTL: number = 5000) {
    this.defaultTTL = defaultTTL;
    this.startCleanup();
  }

  /**
   * Deduplicate a request
   * If a request with the same key is already in progress, returns the existing promise
   * Otherwise, executes the request and stores it
   * 
   * @param key - Unique key for the request
   * @param requestFn - Function that returns a promise
   * @param ttl - Time to live in milliseconds (how long to keep after completion)
   * @returns Promise that resolves to the request result
   */
  async deduplicate<T>(
    key: string,
    requestFn: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    // Check if request is already in progress
    const existing = this.activeRequests.get(key);
    if (existing) {
      logger.debug(`Request deduplication: reusing existing request for key: ${key}`);
      return existing.promise as Promise<T>;
    }

    // Create new request
    const promise = requestFn().finally(() => {
      // Clean up after TTL expires
      setTimeout(() => {
        this.activeRequests.delete(key);
      }, ttl);
    });

    // Store request
    this.activeRequests.set(key, {
      promise,
      timestamp: Date.now(),
      key,
    });

    return promise;
  }

  /**
   * Check if a request is currently in progress
   */
  hasActiveRequest(key: string): boolean {
    return this.activeRequests.has(key);
  }

  /**
   * Get number of active requests
   */
  getActiveRequestCount(): number {
    return this.activeRequests.size;
  }

  /**
   * Cancel/remove a specific request from the pool
   */
  cancelRequest(key: string): void {
    this.activeRequests.delete(key);
    logger.debug(`Cancelled request: ${key}`);
  }

  /**
   * Clear all requests
   */
  clear(): void {
    this.activeRequests.clear();
    logger.debug('Request deduplication pool cleared');
  }

  /**
   * Start periodic cleanup of stale requests
   */
  private startCleanup(): void {
    // Clean up every 30 seconds
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const staleThreshold = 60000; // 1 minute

      for (const [key, request] of this.activeRequests.entries()) {
        if (now - request.timestamp > staleThreshold) {
          logger.debug(`Removing stale request: ${key}`);
          this.activeRequests.delete(key);
        }
      }
    }, 30000);
  }

  /**
   * Stop cleanup interval
   */
  cleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Singleton instance
let requestPoolInstance: RequestDeduplicationPool | null = null;

/**
 * Get the global request deduplication pool
 */
export function getRequestDeduplicationPool(): RequestDeduplicationPool {
  if (!requestPoolInstance) {
    requestPoolInstance = new RequestDeduplicationPool();
  }
  return requestPoolInstance;
}
