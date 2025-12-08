// Database Connection Manager
// Provides robust, platform-agnostic database connection with proper retry logic
// Replaces setTimeout patches with systematic connection verification

import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { logger } from '../utils/logger';

interface ConnectionConfig {
  maxRetries: number;
  initialRetryDelay: number;
  maxRetryDelay: number;
  backoffMultiplier: number;
  connectionTestQuery: string;
}

const DEFAULT_CONFIG: ConnectionConfig = {
  maxRetries: 3,
  initialRetryDelay: Platform.OS === 'android' ? 100 : 50, // Android needs slightly more time
  maxRetryDelay: 500,
  backoffMultiplier: 2,
  connectionTestQuery: 'SELECT 1 as test',
};

/**
 * Verify database connection is ready by executing a test query
 */
async function verifyConnection(db: SQLite.SQLiteDatabase, testQuery: string): Promise<boolean> {
  try {
    await db.getFirstAsync(testQuery);
    return true;
  } catch (error) {
    logger.debug('Database connection verification failed:', error);
    return false;
  }
}

/**
 * Wait for a specified duration (proper async delay)
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Initialize database connection with proper retry logic
 * Replaces setTimeout patches with systematic connection verification
 */
export async function initializeDatabaseConnection(
  dbName: string,
  config: Partial<ConnectionConfig> = {}
): Promise<SQLite.SQLiteDatabase> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  let lastError: Error | null = null;

  // Close existing connection if any
  // This is handled by the caller, but we ensure clean state

  // Attempt to open database
  let db: SQLite.SQLiteDatabase | null = null;
  
  try {
    db = await SQLite.openDatabaseAsync(dbName);
    
    if (!db) {
      throw new Error('Failed to open SQLite database - database object is null');
    }

    // Verify connection with retry logic (replaces setTimeout patches)
    let retryCount = 0;
    let retryDelay = finalConfig.initialRetryDelay;
    
    while (retryCount < finalConfig.maxRetries) {
      const isReady = await verifyConnection(db, finalConfig.connectionTestQuery);
      
      if (isReady) {
        logger.debug(`Database connection verified successfully (attempt ${retryCount + 1})`);
        return db;
      }

      retryCount++;
      
      if (retryCount < finalConfig.maxRetries) {
        logger.debug(`Database connection not ready, retrying in ${retryDelay}ms (attempt ${retryCount}/${finalConfig.maxRetries})`);
        await delay(retryDelay);
        
        // Exponential backoff
        retryDelay = Math.min(
          retryDelay * finalConfig.backoffMultiplier,
          finalConfig.maxRetryDelay
        );
      }
    }

    // If we get here, all retries failed
    throw new Error(`Database connection verification failed after ${finalConfig.maxRetries} attempts`);
  } catch (error) {
    lastError = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to initialize database connection:', lastError);
    
    // Clean up on failure
    if (db) {
      try {
        await db.closeAsync();
      } catch (closeError) {
        logger.debug('Error closing database on failure:', closeError);
      }
    }
    
    throw lastError;
  }
}

/**
 * Execute database operation with automatic retry on connection errors
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  retryDelay: number = 100
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if error is connection-related
      const isConnectionError = 
        lastError.message.includes('NullPointerException') ||
        lastError.message.includes('database') ||
        lastError.message.includes('connection');

      if (!isConnectionError || attempt === maxRetries - 1) {
        throw lastError;
      }

      logger.debug(`Database operation failed, retrying (attempt ${attempt + 1}/${maxRetries}):`, lastError.message);
      await delay(retryDelay * (attempt + 1)); // Progressive delay
    }
  }

  throw lastError || new Error('Operation failed after retries');
}
