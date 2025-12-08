// Performance monitoring utilities
// Tracks key performance metrics for optimization

import { logger } from './logger';

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000;
  private enabled = __DEV__ || process.env.NODE_ENV === 'development';

  /**
   * Start timing an operation
   */
  start(name: string): (metadata?: Record<string, unknown>) => void {
    if (!this.enabled) {
      return () => {}; // No-op if disabled
    }

    const startTime = performance.now();

    return (metadata?: Record<string, unknown>) => {
      const duration = performance.now() - startTime;
      this.record(name, duration, metadata);
    };
  }

  /**
   * Record a performance metric
   */
  record(name: string, duration: number, metadata?: Record<string, unknown>): void {
    if (!this.enabled) {
      return;
    }

    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log slow operations
    if (duration > 1000) {
      logger.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`, metadata);
    }
  }

  /**
   * Get metrics for a specific operation
   */
  getMetrics(name: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.name === name);
  }

  /**
   * Get average duration for an operation
   */
  getAverageDuration(name: string): number {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) {
      return 0;
    }

    const sum = metrics.reduce((acc, m) => acc + m.duration, 0);
    return sum / metrics.length;
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Get summary statistics
   */
  getSummary(): Record<string, {
    count: number;
    average: number;
    min: number;
    max: number;
  }> {
    const summary: Record<string, {
      count: number;
      average: number;
      min: number;
      max: number;
    }> = {};

    for (const metric of this.metrics) {
      if (!summary[metric.name]) {
        summary[metric.name] = {
          count: 0,
          average: 0,
          min: Infinity,
          max: -Infinity,
        };
      }

      const stats = summary[metric.name];
      stats.count++;
      stats.min = Math.min(stats.min, metric.duration);
      stats.max = Math.max(stats.max, metric.duration);
    }

    // Calculate averages
    for (const name in summary) {
      const metrics = this.getMetrics(name);
      const sum = metrics.reduce((acc, m) => acc + m.duration, 0);
      summary[name].average = sum / summary[name].count;
    }

    return summary;
  }

  /**
   * Log performance summary
   */
  logSummary(): void {
    if (!this.enabled) {
      return;
    }

    const summary = this.getSummary();
    logger.info('Performance Summary:', summary);
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Measure async function execution time
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  const end = performanceMonitor.start(name);
  try {
    const result = await fn();
    if (metadata) {
      end(metadata);
    } else {
      end();
    }
    return result;
  } catch (error) {
    end({ ...metadata, error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

/**
 * Measure sync function execution time
 */
export function measureSync<T>(
  name: string,
  fn: () => T,
  metadata?: Record<string, unknown>
): T {
  const end = performanceMonitor.start(name);
  try {
    const result = fn();
    if (metadata) {
      end(metadata);
    } else {
      end();
    }
    return result;
  } catch (error) {
    end({ ...metadata, error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}
