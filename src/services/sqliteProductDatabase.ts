// SQLite Product Database Service
// Provides offline-first product lookups using local SQLite database
// Supports bulk imports from Open Food Facts and other sources

import * as SQLite from 'expo-sqlite';
import { Product } from '../types/product';
import { applyResolvedNutrientLevels } from '../utils/resolveNutrientLevels';
import { logger } from '../utils/logger';
import { normalizeBarcode } from '../utils/barcodeNormalization';
import { createDatabaseIndexes } from '../utils/databaseIndexes';
import { initializeDatabaseConnection, executeWithRetry } from './databaseConnectionManager';

const DB_NAME = 'truescan_products.db';
let db: SQLite.SQLiteDatabase | null = null;

/** Add columns introduced after v1 schema (OFF packaging + Eco-Score / carbon footprint). */
async function ensureProductTableColumns(database: SQLite.SQLiteDatabase): Promise<void> {
  try {
    const rows = await database.getAllAsync<{ name: string }>('PRAGMA table_info(products)');
    const existing = new Set(rows.map((r) => r.name));
    const additions: [string, string][] = [
      ['ecoscore_data', 'TEXT'],
      ['packagings', 'TEXT'],
      ['packaging', 'TEXT'],
      ['packaging_tags', 'TEXT'],
      ['url', 'TEXT'],
    ];
    for (const [col, sqlType] of additions) {
      if (!existing.has(col)) {
        await database.execAsync(`ALTER TABLE products ADD COLUMN ${col} ${sqlType}`);
        existing.add(col);
        logger.debug(`SQLite migration: added column products.${col}`);
      }
    }
  } catch (e) {
    logger.debug('SQLite column migration (non-critical):', e);
  }
}

/**
 * Initialize SQLite database
 * Uses proper connection management instead of setTimeout patches
 */
export async function initSQLiteDatabase(): Promise<void> {
  try {
    // Close existing database if it exists (in case of re-initialization)
    if (db) {
      try {
        await db.closeAsync();
      } catch (closeError) {
        logger.debug('Error closing existing database (non-critical):', closeError);
      }
      db = null;
    }
    
    // Use proper connection manager instead of setTimeout patches
    db = await initializeDatabaseConnection(DB_NAME);
    
    if (!db) {
      throw new Error('Failed to initialize database connection');
    }
    
    // Create products table if it doesn't exist (with retry logic)
    await executeWithRetry(async () => {
      if (!db) throw new Error('Database not initialized');
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS products (
          barcode TEXT PRIMARY KEY,
          product_name TEXT,
          product_name_en TEXT,
          brands TEXT,
          generic_name TEXT,
          categories TEXT,
          categories_tags TEXT,
          ingredients_text TEXT,
          image_url TEXT,
          image_front_url TEXT,
          image_front_small_url TEXT,
          nutriments TEXT,
          packaging_data TEXT,
          ecoscore_data TEXT,
          packagings TEXT,
          packaging TEXT,
          packaging_tags TEXT,
          url TEXT,
          manufacturing_places TEXT,
          countries TEXT,
          ecoscore_grade TEXT,
          ecoscore_score REAL,
          nutriscore_grade TEXT,
          nutriscore_score INTEGER,
          labels_tags TEXT,
          allergens_tags TEXT,
          additives_tags TEXT,
          source TEXT,
          quality INTEGER,
          completion INTEGER,
          last_updated INTEGER,
          country_filter TEXT
        )
      `);
    });

    await executeWithRetry(async () => {
      if (!db) throw new Error('Database not initialized');
      await ensureProductTableColumns(db);
    });
    
    // Create basic indexes separately (with retry logic)
    const indexOperations = [
      () => {
        if (!db) throw new Error('Database not initialized');
        return db.execAsync('CREATE INDEX IF NOT EXISTS idx_barcode ON products(barcode)');
      },
      () => {
        if (!db) throw new Error('Database not initialized');
        return db.execAsync('CREATE INDEX IF NOT EXISTS idx_country_filter ON products(country_filter)');
      },
      () => {
        if (!db) throw new Error('Database not initialized');
        return db.execAsync('CREATE INDEX IF NOT EXISTS idx_last_updated ON products(last_updated)');
      },
    ];
    
    for (const operation of indexOperations) {
      try {
        await executeWithRetry(operation, 2, 50); // 2 retries, 50ms delay
      } catch (idxError) {
        // Index might already exist - this is non-critical
        logger.debug('Error creating index (may already exist):', idxError);
      }
    }
    
    // Create additional performance indexes (with error handling)
    try {
      await executeWithRetry(async () => {
        if (!db) throw new Error('Database not initialized');
        await createDatabaseIndexes(db);
      }, 2, 50);
    } catch (indexError) {
      logger.debug('Error creating additional indexes (non-critical):', indexError);
      // Don't throw - indexes are optional for performance
    }
    
    logger.debug('SQLite database initialized successfully');
  } catch (error) {
    logger.error('Error initializing SQLite database:', error);
    db = null; // Reset db on error
    // Don't throw - allow app to continue without SQLite
    // The app can still function using cache and API calls
  }
}

// Track initialization to prevent concurrent initialization
let isInitializing = false;
let initPromise: Promise<void> | null = null;
let initFailed = false; // Track if initialization has permanently failed

/**
 * Get SQLite database instance (initializes if needed)
 * Returns null if database is unavailable (allows graceful fallback)
 */
async function getDatabase(): Promise<SQLite.SQLiteDatabase | null> {
  // If initialization has permanently failed, don't retry
  if (initFailed) {
    return null;
  }
  
  // If already initialized, return it
  if (db) {
    return db;
  }
  
  // If currently initializing, wait for that to complete
  if (isInitializing && initPromise) {
    await initPromise;
    if (db) {
      return db;
    }
    // If initialization completed but db is still null, mark as failed
    initFailed = true;
    return null;
  }
  
  // Start initialization
  isInitializing = true;
  initPromise = initSQLiteDatabase();
  
  try {
    await initPromise;
  } catch (error) {
    logger.debug('Database initialization failed:', error);
    initFailed = true;
    return null;
  } finally {
    isInitializing = false;
    initPromise = null;
  }
  
  if (!db) {
    initFailed = true;
    return null;
  }
  
  return db;
}

/**
 * Lookup product in SQLite database
 * Tries all barcode variants
 */
export async function lookupProductInSQLite(barcode: string, countryCode?: string): Promise<Product | null> {
  try {
    const database = await getDatabase();
    
    if (!database) {
      // Database not available - this is fine, app can use cache/API
      return null;
    }
    
    const barcodeVariants = normalizeBarcode(barcode);
    
    // Try each barcode variant
    for (const variant of barcodeVariants) {
      try {
        // First try with country filter if provided
        if (countryCode) {
          const result = await database.getFirstAsync<SQLiteProductRow>(
            `SELECT * FROM products WHERE barcode = ? AND (country_filter IS NULL OR country_filter = ?) ORDER BY last_updated DESC LIMIT 1`,
            [variant, countryCode]
          );
          
          if (result) {
            return convertRowToProduct(result);
          }
        }
        
        // Fallback: try without country filter
        const result = await database.getFirstAsync<SQLiteProductRow>(
          `SELECT * FROM products WHERE barcode = ? ORDER BY last_updated DESC LIMIT 1`,
          [variant]
        );
        
        if (result) {
          return convertRowToProduct(result);
        }
      } catch (queryError) {
        // Log but continue to next variant
        logger.debug(`Error querying barcode variant ${variant}:`, queryError);
        continue;
      }
    }
    
    return null;
  } catch (error) {
    // Don't log as error - database might not be initialized yet, which is fine
    logger.debug('SQLite lookup failed (non-critical):', error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Insert or update product in SQLite database
 */
export async function saveProductToSQLite(product: Product, countryCode?: string): Promise<boolean> {
  try {
    const database = await getDatabase();
    
    if (!database) {
      // Database not available - this is fine, app can continue without SQLite
      return false;
    }
    
    const row: SQLiteProductRow = {
      barcode: product.barcode,
      product_name: product.product_name || null,
      product_name_en: product.product_name_en || product.product_name || null,
      brands: product.brands || null,
      generic_name: product.generic_name || null,
      categories: product.categories || null,
      categories_tags: product.categories_tags ? JSON.stringify(product.categories_tags) : null,
      ingredients_text: product.ingredients_text || null,
      image_url: product.image_url || null,
      image_front_url: product.image_front_url || null,
      image_front_small_url: product.image_front_small_url || null,
      nutriments: product.nutriments ? JSON.stringify(product.nutriments) : null,
      packaging_data: product.packaging_data ? JSON.stringify(product.packaging_data) : null,
      ecoscore_data: product.ecoscore_data ? JSON.stringify(product.ecoscore_data) : null,
      packagings: product.packagings && product.packagings.length > 0 ? JSON.stringify(product.packagings) : null,
      packaging: product.packaging || null,
      packaging_tags: product.packaging_tags && product.packaging_tags.length > 0 ? JSON.stringify(product.packaging_tags) : null,
      url: product.url || null,
      manufacturing_places: product.manufacturing_places || null,
      countries: product.countries || null,
      ecoscore_grade: product.ecoscore_grade || null,
      ecoscore_score: product.ecoscore_score || null,
      nutriscore_grade: product.nutriscore_grade || null,
      nutriscore_score: product.nutriscore_score || null,
      labels_tags: product.labels_tags ? JSON.stringify(product.labels_tags) : null,
      allergens_tags: product.allergens_tags ? JSON.stringify(product.allergens_tags) : null,
      additives_tags: product.additives_tags ? JSON.stringify(product.additives_tags) : null,
      source: product.source || 'sqlite',
      quality: product.quality || null,
      completion: product.completion || null,
      last_updated: Date.now(),
      country_filter: countryCode || null,
    };
    
    await database.runAsync(
      `INSERT OR REPLACE INTO products (
        barcode, product_name, product_name_en, brands, generic_name, categories, categories_tags,
        ingredients_text, image_url, image_front_url, image_front_small_url, nutriments,
        packaging_data, ecoscore_data, packagings, packaging, packaging_tags, url,
        manufacturing_places, countries, ecoscore_grade, ecoscore_score,
        nutriscore_grade, nutriscore_score, labels_tags, allergens_tags, additives_tags,
        source, quality, completion, last_updated, country_filter
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.barcode, row.product_name, row.product_name_en, row.brands, row.generic_name,
        row.categories, row.categories_tags, row.ingredients_text, row.image_url,
        row.image_front_url, row.image_front_small_url, row.nutriments, row.packaging_data,
        row.ecoscore_data ?? null,
        row.packagings ?? null,
        row.packaging ?? null,
        row.packaging_tags ?? null,
        row.url ?? null,
        row.manufacturing_places, row.countries, row.ecoscore_grade, row.ecoscore_score,
        row.nutriscore_grade, row.nutriscore_score, row.labels_tags, row.allergens_tags,
        row.additives_tags, row.source, row.quality, row.completion, row.last_updated, row.country_filter
      ]
    );
    
    logger.debug(`Product saved to SQLite: ${product.barcode}`);
    return true;
  } catch (error) {
    logger.error('Error saving product to SQLite:', error);
    return false;
  }
}

/**
 * Bulk import products from JSON array
 * Useful for importing Open Food Facts exports
 */
export async function bulkImportProducts(products: Product[], countryCode?: string): Promise<number> {
  try {
    const database = await getDatabase();
    if (!database) {
      return 0;
    }
    let imported = 0;
    
    await database.withTransactionAsync(async () => {
      for (const product of products) {
        const success = await saveProductToSQLite(product, countryCode);
        if (success) {
          imported++;
        }
      }
    });
    
    logger.debug(`Bulk imported ${imported} products to SQLite`);
    return imported;
  } catch (error) {
    logger.error('Error bulk importing products to SQLite:', error);
    return 0;
  }
}

/**
 * Get database statistics
 */
export async function getSQLiteStats(): Promise<{ totalProducts: number; countryProducts: Record<string, number> }> {
  try {
    const database = await getDatabase();
    if (!database) {
      return { totalProducts: 0, countryProducts: {} };
    }
    
    const totalResult = await database.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM products`
    );
    
    const countryResults = await database.getAllAsync<{ country_filter: string | null; count: number }>(
      `SELECT country_filter, COUNT(*) as count FROM products GROUP BY country_filter`
    );
    
    const countryProducts: Record<string, number> = {};
    countryResults.forEach(row => {
      const country = row.country_filter || 'global';
      countryProducts[country] = row.count;
    });
    
    return {
      totalProducts: totalResult?.count || 0,
      countryProducts,
    };
  } catch (error) {
    logger.error('Error getting SQLite stats:', error);
    return { totalProducts: 0, countryProducts: {} };
  }
}

/**
 * Clear old products (older than specified days)
 */
export async function clearOldProducts(daysOld: number = 90): Promise<number> {
  try {
    const database = await getDatabase();
    if (!database) {
      return 0;
    }
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    
    const result = await database.runAsync(
      `DELETE FROM products WHERE last_updated < ?`,
      [cutoffTime]
    );
    
    const deleted = result.changes || 0;
    logger.debug(`Cleared ${deleted} old products from SQLite (older than ${daysOld} days)`);
    return deleted;
  } catch (error) {
    logger.error('Error clearing old products from SQLite:', error);
    return 0;
  }
}

// Helper types and functions

interface SQLiteProductRow {
  barcode: string;
  product_name: string | null;
  product_name_en: string | null;
  brands: string | null;
  generic_name: string | null;
  categories: string | null;
  categories_tags: string | null;
  ingredients_text: string | null;
  image_url: string | null;
  image_front_url: string | null;
  image_front_small_url: string | null;
  nutriments: string | null;
  packaging_data: string | null;
  /** JSON — added in migration (Eco-Score / carbon from OFF) */
  ecoscore_data?: string | null;
  /** JSON array — OFF packagings */
  packagings?: string | null;
  packaging?: string | null;
  packaging_tags?: string | null;
  url?: string | null;
  manufacturing_places: string | null;
  countries: string | null;
  ecoscore_grade: string | null;
  ecoscore_score: number | null;
  nutriscore_grade: string | null;
  nutriscore_score: number | null;
  labels_tags: string | null;
  allergens_tags: string | null;
  additives_tags: string | null;
  source: string;
  quality: number | null;
  completion: number | null;
  last_updated: number;
  country_filter: string | null;
}

function parseJsonField<T>(raw: string | null | undefined, field: string): T | undefined {
  if (raw == null || raw === '') return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    logger.debug(`SQLite: invalid JSON for ${field}, skipping`);
    return undefined;
  }
}

function convertRowToProduct(row: SQLiteProductRow): Product {
  const product: Product = {
    barcode: row.barcode,
    product_name: row.product_name || undefined,
    product_name_en: row.product_name_en || row.product_name || undefined,
    brands: row.brands || undefined,
    generic_name: row.generic_name || undefined,
    categories: row.categories || undefined,
    categories_tags: row.categories_tags ? JSON.parse(row.categories_tags) : undefined,
    ingredients_text: row.ingredients_text || undefined,
    image_url: row.image_url || undefined,
    image_front_url: row.image_front_url || undefined,
    image_front_small_url: row.image_front_small_url || undefined,
    nutriments: row.nutriments ? JSON.parse(row.nutriments) : undefined,
    packaging_data: row.packaging_data ? JSON.parse(row.packaging_data) : undefined,
    ecoscore_data: parseJsonField(row.ecoscore_data, 'ecoscore_data'),
    packagings: parseJsonField(row.packagings, 'packagings'),
    packaging: row.packaging || undefined,
    packaging_tags: parseJsonField(row.packaging_tags, 'packaging_tags'),
    url: row.url || undefined,
    manufacturing_places: row.manufacturing_places || undefined,
    countries: row.countries || undefined,
    ecoscore_grade: (row.ecoscore_grade && ['a', 'b', 'c', 'd', 'e', 'unknown'].includes(row.ecoscore_grade.toLowerCase())) 
      ? row.ecoscore_grade.toLowerCase() as 'a' | 'b' | 'c' | 'd' | 'e' | 'unknown'
      : undefined,
    ecoscore_score: row.ecoscore_score || undefined,
    nutriscore_grade: (row.nutriscore_grade && ['a', 'b', 'c', 'd', 'e', 'unknown'].includes(row.nutriscore_grade.toLowerCase())) 
      ? row.nutriscore_grade.toLowerCase() as 'a' | 'b' | 'c' | 'd' | 'e' | 'unknown'
      : undefined,
    nutriscore_score: row.nutriscore_score || undefined,
    labels_tags: row.labels_tags ? JSON.parse(row.labels_tags) : undefined,
    allergens_tags: row.allergens_tags ? JSON.parse(row.allergens_tags) : undefined,
    additives_tags: row.additives_tags ? JSON.parse(row.additives_tags) : undefined,
    source: row.source ? (row.source as Product['source']) : 'sqlite', // Preserve source, default to 'sqlite' if missing
    quality: row.quality || undefined,
    completion: row.completion || undefined,
  };
  if (row.last_updated) {
    (product as Product & { _cachedAt?: number })._cachedAt = row.last_updated;
  }
  applyResolvedNutrientLevels(product);
  return product;
}

