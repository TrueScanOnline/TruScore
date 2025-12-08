// Rate limiter utility for API calls
// Prevents hitting API rate limits and manages request throttling

import { logger } from './logger';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  name: string;
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitConfig> = new Map();
  private requests: Map<string, RequestRecord> = new Map();

  /**
   * Register a rate limit configuration
   */
  registerLimit(name: string, config: RateLimitConfig): void {
    this.limits.set(name, config);
  }

  /**
   * Check if a request is allowed
   * Returns true if request can proceed, false if rate limited
   */
  canMakeRequest(name: string): boolean {
    const config = this.limits.get(name);
    if (!config) {
      // No limit configured, allow request
      return true;
    }

    const now = Date.now();
    const record = this.requests.get(name);

    // Initialize or reset if window expired
    if (!record || now >= record.resetTime) {
      this.requests.set(name, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return true;
    }

    // Check if limit exceeded
    if (record.count >= config.maxRequests) {
      logger.warn(
        `Rate limit exceeded for ${config.name}: ${record.count}/${config.maxRequests} requests in ${config.windowMs}ms`
      );
      return false;
    }

    // Increment count
    record.count++;
    return true;
  }

  /**
   * Wait until rate limit allows request
   * Returns delay in milliseconds
   */
  getDelay(name: string): number {
    const config = this.limits.get(name);
    if (!config) {
      return 0;
    }

    const record = this.requests.get(name);
    if (!record) {
      return 0;
    }

    const now = Date.now();
    if (now >= record.resetTime) {
      return 0;
    }

    if (record.count >= config.maxRequests) {
      return record.resetTime - now;
    }

    return 0;
  }

  /**
   * Reset rate limit for a service
   */
  reset(name: string): void {
    this.requests.delete(name);
  }

  /**
   * Reset all rate limits
   */
  resetAll(): void {
    this.requests.clear();
  }

  /**
   * Get current request count for a service
   */
  getRequestCount(name: string): number {
    const record = this.requests.get(name);
    return record?.count || 0;
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter();

// Pre-configured rate limits for common APIs
// These are conservative limits to stay within free tiers
export function initializeRateLimits(): void {
  // Open Food Facts - 100 requests/minute (conservative)
  rateLimiter.registerLimit('openfoodfacts', {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    name: 'Open Food Facts',
  });

  // USDA FoodData Central - 1000 requests/day (free tier)
  rateLimiter.registerLimit('usda', {
    maxRequests: 1000,
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    name: 'USDA FoodData Central',
  });

  // EAN-Search - Light use (free tier)
  rateLimiter.registerLimit('ean_search', {
    maxRequests: 100,
    windowMs: 60 * 60 * 1000, // 1 hour
    name: 'EAN-Search',
  });

  // UPC Database - 100 lookups/day (free tier)
  rateLimiter.registerLimit('upc_database', {
    maxRequests: 100,
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    name: 'UPC Database',
  });

  // Barcode Lookup - 100 lookups/day (free tier)
  rateLimiter.registerLimit('barcode_lookup', {
    maxRequests: 100,
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    name: 'Barcode Lookup',
  });

  // Nutritionix - 100 requests/day (free tier)
  rateLimiter.registerLimit('nutritionix', {
    maxRequests: 100,
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    name: 'Nutritionix',
  });

  // Spoonacular - 150 points/day (free tier)
  // Each request costs points, so we limit requests
  rateLimiter.registerLimit('spoonacular', {
    maxRequests: 50, // Conservative estimate
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    name: 'Spoonacular',
  });

  // Edamam - 10,000 requests/month (free tier)
  rateLimiter.registerLimit('edamam', {
    maxRequests: 300, // ~10 per day
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    name: 'Edamam',
  });

  // Web search fallback - be conservative
  rateLimiter.registerLimit('web_search', {
    maxRequests: 50,
    windowMs: 60 * 1000, // 1 minute
    name: 'Web Search',
  });
}

/**
 * Wait for rate limit with exponential backoff
 */
export async function waitForRateLimit(
  serviceName: string,
  maxWaitMs: number = 5000
): Promise<boolean> {
  let waitTime = rateLimiter.getDelay(serviceName);
  let attempts = 0;
  const maxAttempts = 10;

  while (waitTime > 0 && attempts < maxAttempts && waitTime < maxWaitMs) {
    await new Promise(resolve => setTimeout(resolve, waitTime));
    waitTime = rateLimiter.getDelay(serviceName);
    attempts++;
  }

  if (waitTime > 0) {
    logger.warn(`Rate limit wait timeout for ${serviceName}`);
    return false;
  }

  return rateLimiter.canMakeRequest(serviceName);
}
