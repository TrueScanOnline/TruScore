/**
 * Crash Reporter for iOS Diagnostics
 * Helps identify and log crashes for remote debugging
 */

import { Platform } from 'react-native';
import { logger } from './logger';

export interface CrashContext {
  screen?: string;
  action?: string;
  barcode?: string;
  error?: string;
  stack?: string;
  timestamp?: number;
  platform?: string;
  [key: string]: any;
}

class CrashReporter {
  private crashLogs: CrashContext[] = [];
  private maxLogs = 50;

  /**
   * Log a crash or error with context
   */
  logCrash(context: CrashContext) {
    const crashLog: CrashContext = {
      ...context,
      timestamp: Date.now(),
      platform: Platform.OS,
    };

    this.crashLogs.push(crashLog);
    
    // Keep only recent logs
    if (this.crashLogs.length > this.maxLogs) {
      this.crashLogs.shift();
    }

    // Use logger for structured logging
    logger.error('[CrashReporter] Crash logged', crashLog);

    // On iOS, also log to native console (visible in Xcode)
    if (Platform.OS === 'ios') {
      logger.error('[iOS Crash]', crashLog);
    }
  }

  /**
   * Get all crash logs
   */
  getCrashLogs(): CrashContext[] {
    return [...this.crashLogs];
  }

  /**
   * Get recent crash logs (last N)
   */
  getRecentCrashLogs(count: number = 10): CrashContext[] {
    return this.crashLogs.slice(-count);
  }

  /**
   * Clear crash logs
   */
  clearLogs() {
    this.crashLogs = [];
  }

  /**
   * Export crash logs as JSON string
   */
  exportLogs(): string {
    return JSON.stringify(this.crashLogs, null, 2);
  }
}

export const crashReporter = new CrashReporter();

/**
 * Wrap a function with crash reporting
 */
export function withCrashReporting<T extends (...args: any[]) => any>(
  fn: T,
  context: Omit<CrashContext, 'error' | 'stack' | 'timestamp' | 'platform'>
): T {
  return ((...args: Parameters<T>) => {
    try {
      const result = fn(...args);
      
      // Handle async functions
      if (result instanceof Promise) {
        return result.catch((error: Error) => {
          crashReporter.logCrash({
            ...context,
            error: error.message,
            stack: error.stack,
          });
          throw error;
        });
      }
      
      return result;
    } catch (error) {
      crashReporter.logCrash({
        ...context,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }) as T;
}
