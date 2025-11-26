// SQLite Product Database Service
// Provides offline-first product lookups using local SQLite database
// Supports bulk imports from Open Food Facts and other sources

import * as SQLite from 'expo-sqlite';
import { Product } from '../types/product';
import { logger } from '../utils/logger';
import { normalizeBarcode } from '../utils/barcodeNormalization';

const DB_NAME = 'truescan_products.db';
let db: SQLite.SQLiteDatabase | null = null;

/**
 * Initialize SQLite database
 */
export async function initSQLiteDatabase(): Promise<void> {
  try {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    
    // Create products table if it doesn't exist
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
      );
      
      CREATE INDEX IF NOT EXISTS idx_barcode ON products(barcode);
      CREATE INDEX IF NOT EXISTS idx_country_filter ON products(country_filter);
      CREATE INDEX IF NOT EXISTS idx_last_updated ON products(last_updated);
    `);
    
    logger.debug('SQLite database initialized successfully');
  } catch (error) {
    logger.error('Error initializing SQLite database:', error);
    throw error;
  }
}

/**
 * Get SQLite database instance (initializes if needed)
 */
async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    await initSQLiteDatabase();
  }
  if (!db) {
    throw new Error('Failed to initialize SQLite database');
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
    const barcodeVariants = normalizeBarcode(barcode);
    
    // Try each barcode variant
    for (const variant of barcodeVariants) {
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
    }
    
    return null;
  } catch (error) {
    logger.error('Error looking up product in SQLite:', error);
    return null;
  }
}

/**
 * Insert or update product in SQLite database
 */
export async function saveProductToSQLite(product: Product, countryCode?: string): Promise<boolean> {
  try {
    const database = await getDatabase();
    
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
        packaging_data, manufacturing_places, countries, ecoscore_grade, ecoscore_score,
        nutriscore_grade, nutriscore_score, labels_tags, allergens_tags, additives_tags,
        source, quality, completion, last_updated, country_filter
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.barcode, row.product_name, row.product_name_en, row.brands, row.generic_name,
        row.categories, row.categories_tags, row.ingredients_text, row.image_url,
        row.image_front_url, row.image_front_small_url, row.nutriments, row.packaging_data,
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

function convertRowToProduct(row: SQLiteProductRow): Product {
  return {
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
    source: (row.source && row.source !== 'sqlite') ? row.source as Product['source'] : undefined,
    quality: row.quality || undefined,
    completion: row.completion || undefined,
  };
}

