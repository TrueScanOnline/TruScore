// Database index definitions for SQLite
// Improves query performance for common lookups

import * as SQLite from 'expo-sqlite';
import { logger } from './logger';

/**
 * Create indexes for product database
 * Should be called after database initialization
 */
export async function createDatabaseIndexes(db: SQLite.SQLiteDatabase): Promise<void> {
  if (!db) {
    logger.debug('Database not available for index creation');
    return;
  }

  logger.info('Creating database indexes for performance optimization...');

  const indexes = [
    {
      name: 'idx_products_barcode',
      sql: 'CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)',
      description: 'barcode lookup',
    },
    {
      name: 'idx_products_country_filter',
      sql: 'CREATE INDEX IF NOT EXISTS idx_products_country_filter ON products(country_filter)',
      description: 'country filter',
    },
    {
      name: 'idx_products_barcode_country',
      sql: 'CREATE INDEX IF NOT EXISTS idx_products_barcode_country ON products(barcode, country_filter)',
      description: 'barcode + country filter',
    },
    {
      name: 'idx_products_source',
      sql: 'CREATE INDEX IF NOT EXISTS idx_products_source ON products(source)',
      description: 'source filter',
    },
    {
      name: 'idx_products_name',
      sql: 'CREATE INDEX IF NOT EXISTS idx_products_name ON products(product_name)',
      description: 'product name search',
    },
  ];

  let successCount = 0;
  for (const index of indexes) {
    try {
      await db.execAsync(index.sql);
      successCount++;
    } catch (error) {
      // Log but continue - index might already exist or table might not be ready
      logger.debug(`Error creating index ${index.name} (${index.description}):`, error);
    }
  }

  if (successCount > 0) {
    logger.info(`Database indexes created: ${successCount}/${indexes.length} successful`);
  } else {
    logger.debug('No database indexes created (may already exist or table not ready)');
  }

  // Note: scan_history is stored in AsyncStorage, not SQLite, so no indexes needed
}

/**
 * Analyze database to update query planner statistics
 * Should be called periodically or after bulk inserts
 */
export async function analyzeDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  try {
    await db.execAsync('ANALYZE;');
    logger.debug('Database analyzed for query optimization');
  } catch (error) {
    logger.debug('Error analyzing database (non-critical)', error);
  }
}
