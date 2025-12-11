// Timeout helper for fetch requests
// Polyfill for AbortSignal.timeout() which is not available in React Native
// Enhanced with rate limiting to prevent API bans

export function createTimeoutSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);
  
  // Clean up timeout if signal is already aborted
  if (controller.signal.aborted) {
    clearTimeout(timeoutId);
  }
  
  return controller.signal;
}

/**
 * Rate limiter configuration per source
 */
interface RateLimitConfig {
  requestsPerSecond: number;
  maxConcurrent: number;
  backoffMultiplier: number;
  maxBackoffMs: number;
}

// OPTIMIZED Rate Limits - More aggressive for fast APIs
const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Open Facts - can handle more requests
  'openfoodfacts': { requestsPerSecond: 2, maxConcurrent: 3, backoffMultiplier: 2, maxBackoffMs: 10000 },
  'openbeautyfacts': { requestsPerSecond: 2, maxConcurrent: 3, backoffMultiplier: 2, maxBackoffMs: 10000 },
  'openproductsfacts': { requestsPerSecond: 2, maxConcurrent: 3, backoffMultiplier: 2, maxBackoffMs: 10000 },
  'openpetfoodfacts': { requestsPerSecond: 2, maxConcurrent: 3, backoffMultiplier: 2, maxBackoffMs: 10000 },
  
  // Store APIs - already optimized
  'woolworths_nz': { requestsPerSecond: 2, maxConcurrent: 3, backoffMultiplier: 1.5, maxBackoffMs: 5000 },
  'woolworths_au': { requestsPerSecond: 2, maxConcurrent: 3, backoffMultiplier: 1.5, maxBackoffMs: 5000 },
  'coles_au': { requestsPerSecond: 2, maxConcurrent: 3, backoffMultiplier: 1.5, maxBackoffMs: 5000 },
  'iga_au': { requestsPerSecond: 2, maxConcurrent: 3, backoffMultiplier: 1.5, maxBackoffMs: 5000 },
  'paknsave': { requestsPerSecond: 2, maxConcurrent: 3, backoffMultiplier: 1.5, maxBackoffMs: 5000 },
  'newworld': { requestsPerSecond: 2, maxConcurrent: 3, backoffMultiplier: 1.5, maxBackoffMs: 5000 },
  
  // Government databases - can handle more
  'usda_fooddata': { requestsPerSecond: 2, maxConcurrent: 3, backoffMultiplier: 2, maxBackoffMs: 10000 },
  'gs1_datasource': { requestsPerSecond: 2, maxConcurrent: 3, backoffMultiplier: 2, maxBackoffMs: 10000 },
  
  // Fallback APIs - still conservative
  'open_gtin': { requestsPerSecond: 1, maxConcurrent: 2, backoffMultiplier: 2, maxBackoffMs: 15000 },
  'barcode_monster': { requestsPerSecond: 1, maxConcurrent: 2, backoffMultiplier: 2, maxBackoffMs: 15000 },
  'upcitemdb': { requestsPerSecond: 1, maxConcurrent: 2, backoffMultiplier: 2, maxBackoffMs: 15000 },
  'barcode_spider': { requestsPerSecond: 1, maxConcurrent: 2, backoffMultiplier: 2, maxBackoffMs: 15000 },
  
  // New FREE databases
  'openean': { requestsPerSecond: 1, maxConcurrent: 2, backoffMultiplier: 2, maxBackoffMs: 10000 },
  'product_open_data': { requestsPerSecond: 1, maxConcurrent: 2, backoffMultiplier: 2, maxBackoffMs: 10000 },
  'world_food_database': { requestsPerSecond: 1, maxConcurrent: 2, backoffMultiplier: 2, maxBackoffMs: 10000 },
  'barcode_lookup_com': { requestsPerSecond: 0.5, maxConcurrent: 1, backoffMultiplier: 2, maxBackoffMs: 15000 }, // Free tier: 100/day
  
  // Cache - instant, no rate limit needed but set high
  'cache': { requestsPerSecond: 100, maxConcurrent: 10, backoffMultiplier: 1, maxBackoffMs: 0 },
  'sqlite': { requestsPerSecond: 100, maxConcurrent: 10, backoffMultiplier: 1, maxBackoffMs: 0 },
  
  'default': { requestsPerSecond: 1, maxConcurrent: 2, backoffMultiplier: 2, maxBackoffMs: 10000 },
};

/**
 * Rate limiter class with exponential backoff
 */
class RateLimiter {
  private queues: Map<string, Array<() => Promise<any>>> = new Map();
  private running: Map<string, number> = new Map();
  private lastRequest: Map<string, number> = new Map();
  private backoffUntil: Map<string, number> = new Map();
  private backoffDuration: Map<string, number> = new Map();

  /**
   * Get rate limit config for a source
   */
  private getConfig(source: string): RateLimitConfig {
    return DEFAULT_RATE_LIMITS[source] || DEFAULT_RATE_LIMITS['default'];
  }

  /**
   * Check if we're in backoff period
   */
  private isInBackoff(source: string): boolean {
    const backoffUntil = this.backoffUntil.get(source) || 0;
    return Date.now() < backoffUntil;
  }

  /**
   * Enter backoff period (exponential backoff)
   */
  private enterBackoff(source: string) {
    const config = this.getConfig(source);
    const currentBackoff = this.backoffDuration.get(source) || config.maxBackoffMs / 4;
    const newBackoff = Math.min(currentBackoff * config.backoffMultiplier, config.maxBackoffMs);
    
    this.backoffDuration.set(source, newBackoff);
    this.backoffUntil.set(source, Date.now() + newBackoff);
  }

  /**
   * Reset backoff on successful request
   */
  private resetBackoff(source: string) {
    this.backoffDuration.delete(source);
    this.backoffUntil.delete(source);
  }

  /**
   * Wait for rate limit
   */
  private async waitForRateLimit(source: string): Promise<void> {
    const config = this.getConfig(source);
    const lastRequest = this.lastRequest.get(source) || 0;
    const minInterval = 1000 / config.requestsPerSecond;
    const timeSinceLastRequest = Date.now() - lastRequest;
    
    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  /**
   * Process queue for a source
   */
  private async processQueue(source: string) {
    const config = this.getConfig(source);
    const running = this.running.get(source) || 0;
    
    // Check if we can process more
    if (running >= config.maxConcurrent) {
      return;
    }
    
    // Check if we're in backoff
    if (this.isInBackoff(source)) {
      return;
    }
    
    const queue = this.queues.get(source) || [];
    if (queue.length === 0) {
      return;
    }
    
    // Wait for rate limit
    await this.waitForRateLimit(source);
    
    // Get next request
    const request = queue.shift();
    if (!request) {
      return;
    }
    
    // Update running count
    this.running.set(source, running + 1);
    this.lastRequest.set(source, Date.now());
    
    // Execute request
    try {
      await request();
      // Reset backoff on success
      this.resetBackoff(source);
    } catch (error) {
      // Enter backoff on error (likely rate limit)
      if (error instanceof Error && (
        error.message.includes('429') || 
        error.message.includes('rate limit') ||
        error.message.includes('too many requests')
      )) {
        this.enterBackoff(source);
      }
      throw error;
    } finally {
      // Update running count
      this.running.set(source, running);
      
      // Process next in queue
      this.processQueue(source);
    }
  }

  /**
   * Add request to queue
   */
  async addRequest<T>(
    source: string,
    request: () => Promise<T>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const queue = this.queues.get(source) || [];
      queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.queues.set(source, queue);
      
      // Start processing queue
      this.processQueue(source);
    });
  }
}

// Global rate limiter instance
let globalRateLimiter: RateLimiter | null = null;

/**
 * Get global rate limiter instance
 */
export function getGlobalRateLimiter(): RateLimiter {
  if (!globalRateLimiter) {
    globalRateLimiter = new RateLimiter();
  }
  return globalRateLimiter;
}

/**
 * Fetch with rate limiting and retry logic
 * 
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param source - Source identifier for rate limiting
 * @returns Fetch response
 */
export async function fetchWithRateLimit(
  url: string,
  options: RequestInit = {},
  source: string
): Promise<Response> {
  const rateLimiter = getGlobalRateLimiter();
  
  return rateLimiter.addRequest(source, async () => {
    // Use retry logic for network errors
    const { fetchWithRetry } = await import('./networkRetry');
    
    try {
      const response = await fetchWithRetry(
        url,
        options,
        {
          maxRetries: 3,
          initialDelay: 500,
          maxDelay: 5000,
          timeout: 10000, // 10 second timeout per request
        }
      );
      
      // Check for rate limit errors
      if (response.status === 429) {
        throw new Error(`Rate limit exceeded for ${source}`);
      }
      
      return response;
    } catch (error) {
      // Re-throw network errors for retry logic to handle
      if (error instanceof TypeError && (
        error.message.includes('Network request failed') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError')
      )) {
        throw error;
      }
      // For other errors, try once more with basic fetch
      const response = await fetch(url, options);
      if (response.status === 429) {
        throw new Error(`Rate limit exceeded for ${source}`);
      }
      return response;
    }
  });
}
