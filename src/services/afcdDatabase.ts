// Australian Food Composition Database (AFCD) Service
// Provides access to official AU nutrition data
// Database: AFCD (1,534 foods, up to 256 nutrients per food)
// Source: https://www.foodstandards.govt.nz/science-data/monitoringnutrients/afcd

import * as SQLite from 'expo-sqlite';
import { Product, ProductNutriments } from '../types/product';
import { logger } from '../utils/logger';
import { getUserCountryCode } from '../utils/countryDetection';

const DB_NAME = 'truescan_afcd.db';
const TABLE_NAME = 'afcd_foods';
let db: SQLite.SQLiteDatabase | null = null;

/**
 * Initialize AFCD SQLite database
 */
export async function initAFCDDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) {
    return db;
  }

  try {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    
    // Create table for AFCD foods
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        food_code TEXT UNIQUE,
        food_name TEXT NOT NULL,
        food_name_alt TEXT,
        food_group TEXT,
        food_subgroup TEXT,
        edible_portion REAL,
        -- Macronutrients (per 100g)
        energy_kcal REAL,
        energy_kj REAL,
        protein REAL,
        fat_total REAL,
        fat_saturated REAL,
        fat_monounsaturated REAL,
        fat_polyunsaturated REAL,
        carbohydrate_total REAL,
        carbohydrate_available REAL,
        carbohydrate_sugars REAL,
        dietary_fiber REAL,
        -- Micronutrients (per 100g)
        calcium REAL,
        iron REAL,
        magnesium REAL,
        phosphorus REAL,
        potassium REAL,
        sodium REAL,
        zinc REAL,
        copper REAL,
        manganese REAL,
        selenium REAL,
        -- Vitamins (per 100g)
        vitamin_a REAL,
        vitamin_c REAL,
        vitamin_d REAL,
        vitamin_e REAL,
        vitamin_k REAL,
        thiamin REAL,
        riboflavin REAL,
        niacin REAL,
        vitamin_b6 REAL,
        folate REAL,
        vitamin_b12 REAL,
        -- Additional data
        raw_data TEXT, -- JSON string for additional nutrients (up to 256 nutrients)
        last_updated INTEGER,
        source TEXT DEFAULT 'afcd'
      );
      
      CREATE INDEX IF NOT EXISTS idx_food_name ON ${TABLE_NAME}(food_name);
      CREATE INDEX IF NOT EXISTS idx_food_group ON ${TABLE_NAME}(food_group);
    `);
    
    logger.info('AFCD database initialized');
    return db;
  } catch (error) {
    logger.error('Error initializing AFCD database:', error);
    throw error;
  }
}

/**
 * Check if AFCD database is available and has data
 */
export async function isAFCDAvailable(): Promise<boolean> {
  try {
    const database = await initAFCDDatabase();
    const result = await database.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${TABLE_NAME}`
    );
    return (result?.count || 0) > 0;
  } catch (error) {
    logger.error('Error checking AFCD availability:', error);
    return false;
  }
}

/**
 * Lookup product in AFCD by name (fuzzy matching)
 * Used as supplementary nutrition data when barcode lookup finds product but lacks nutrition
 */
export async function lookupProductInAFCD(
  productName: string,
  brand?: string
): Promise<Product | null> {
  const userCountry = getUserCountryCode();
  
  // Only use AFCD for AU users
  if (userCountry !== 'AU') {
    return null;
  }

  try {
    const isAvailable = await isAFCDAvailable();
    if (!isAvailable) {
      logger.debug('AFCD database not available');
      return null;
    }

    const database = await initAFCDDatabase();
    
    // Try exact match first
    let result = await database.getFirstAsync<{
      food_name: string;
      food_name_alt: string;
      food_group: string;
      energy_kcal: number;
      protein: number;
      fat_total: number;
      carbohydrate_total: number;
      carbohydrate_sugars: number;
      dietary_fiber: number;
      calcium: number;
      iron: number;
      sodium: number;
      vitamin_c: number;
      raw_data: string;
    }>(
      `SELECT * FROM ${TABLE_NAME} 
       WHERE food_name LIKE ? OR food_name_alt LIKE ?
       LIMIT 1`,
      [`%${productName}%`, `%${productName}%`]
    );

    // If no exact match, try fuzzy search
    if (!result) {
      // Remove common words and search
      const searchTerms = productName
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3)
        .slice(0, 3); // Use first 3 meaningful words
      
      if (searchTerms.length > 0) {
        const searchPattern = `%${searchTerms.join('%')}%`;
        result = await database.getFirstAsync<{
          food_name: string;
          food_name_alt: string;
          food_group: string;
          energy_kcal: number;
          protein: number;
          fat_total: number;
          carbohydrate_total: number;
          carbohydrate_sugars: number;
          dietary_fiber: number;
          calcium: number;
          iron: number;
          sodium: number;
          vitamin_c: number;
          raw_data: string;
        }>(
          `SELECT * FROM ${TABLE_NAME} 
           WHERE food_name LIKE ? OR food_name_alt LIKE ?
           LIMIT 1`,
          [searchPattern, searchPattern]
        );
      }
    }

    if (!result) {
      return null;
    }

    // Convert to Product format with nutrition data
    const nutriments: ProductNutriments = {
      'energy-kcal_100g': result.energy_kcal ? Math.round(result.energy_kcal) : undefined,
      'energy-kj_100g': result.energy_kcal ? Math.round(result.energy_kcal * 4.184) : undefined,
      'proteins_100g': result.protein ? Math.round(result.protein * 10) / 10 : undefined,
      'fat_100g': result.fat_total ? Math.round(result.fat_total * 10) / 10 : undefined,
      'saturated-fat_100g': result.fat_total ? Math.round(result.fat_total * 10) / 10 : undefined, // Approximate
      'carbohydrates_100g': result.carbohydrate_total ? Math.round(result.carbohydrate_total * 10) / 10 : undefined,
      'sugars_100g': result.carbohydrate_sugars ? Math.round(result.carbohydrate_sugars * 10) / 10 : undefined,
      'fiber_100g': result.dietary_fiber ? Math.round(result.dietary_fiber * 10) / 10 : undefined,
      'calcium_100g': result.calcium ? Math.round(result.calcium / 10) / 100 : undefined, // Convert mg to g
      'iron_100g': result.iron ? Math.round(result.iron / 10) / 100 : undefined, // Convert mg to g
      'sodium_100g': result.sodium ? Math.round(result.sodium / 10) / 100 : undefined, // Convert mg to g
      'vitamin-c_100g': result.vitamin_c ? Math.round(result.vitamin_c / 10) / 100 : undefined, // Convert mg to g
    };

    // Parse additional nutrients from raw_data if available (AFCD has up to 256 nutrients)
    if (result.raw_data) {
      try {
        const additionalNutrients = JSON.parse(result.raw_data);
        // Merge additional nutrients into nutriments object
        Object.assign(nutriments, additionalNutrients);
      } catch (e) {
        // Ignore parse errors
      }
    }

    const product: Product = {
      barcode: '', // AFCD doesn't have barcodes - will be set by caller if needed
      product_name: result.food_name,
      product_name_en: result.food_name,
      categories: result.food_group,
      categories_tags: result.food_group ? [result.food_group.toLowerCase().replace(/\s+/g, '_')] : [],
      nutriments,
      source: 'afcd',
      quality: 85, // High quality government data
      completion: 70, // Good nutrition data, but may lack other fields
    };

    logger.debug(`Found product in AFCD: ${result.food_name}`);
    return product;

  } catch (error) {
    logger.error('Error looking up product in AFCD:', error);
    return null;
  }
}

/**
 * Merge AFCD nutrition data into existing product
 * Used to enhance products found via barcode but lacking nutrition data
 */
export async function enhanceProductWithAFCD(
  product: Product
): Promise<Product> {
  // Only enhance if product lacks nutrition data
  if (product.nutriments && Object.keys(product.nutriments).length > 5) {
    return product; // Already has good nutrition data
  }

  const afcdProduct = await lookupProductInAFCD(
    product.product_name || '',
    product.brands
  );

  if (afcdProduct && afcdProduct.nutriments) {
    // Merge nutrition data (prefer existing, fill gaps with AFCD)
    const mergedNutriments: ProductNutriments = {
      ...product.nutriments,
      ...afcdProduct.nutriments,
    };

    // Prefer existing values over AFCD values
    Object.keys(product.nutriments || {}).forEach(key => {
      if (product.nutriments?.[key as keyof ProductNutriments] !== undefined) {
        mergedNutriments[key as keyof ProductNutriments] = product.nutriments[key as keyof ProductNutriments];
      }
    });

    return {
      ...product,
      nutriments: mergedNutriments,
      source: product.source ? `${product.source}+afcd` : 'afcd',
    };
  }

  return product;
}


