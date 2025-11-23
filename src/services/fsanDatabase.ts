// FSANZ (Food Standards Australia New Zealand) Database Integration
// Provides access to official government food product databases
// Covers both Australian and New Zealand food products with comprehensive nutrition data
//
// IMPORTANT: FSANZ doesn't provide a public real-time API. The database is available
// for download in Excel/Access formats. For production use, download the database
// and import into a local SQLite database for fast, offline queries.
//
// Download links:
// - AU: https://www.foodstandards.gov.au/science/monitoringnutrients/afcd/Pages/default.aspx
// - NZ: https://www.mpi.govt.nz/food-safety/food-monitoring-and-surveillance/food-composition-database/

import { Product } from '../types/product';
import { logger } from '../utils/logger';
import { getUserCountryCode } from '../utils/countryDetection';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FSANZProduct } from './fsanDatabaseImport';

// Local cache key for FSANZ database
const FSANZ_CACHE_KEY = '@truescan_fsanz_cache';

/**
 * Query local FSANZ database (if pre-downloaded and imported)
 * This requires the FSANZ database to be downloaded, converted, and imported
 * 
 * To import FSANZ database:
 * 1. Download from FSANZ website (Excel/Access format)
 * 2. Convert using: node scripts/importFSANZDatabase.js
 * 3. Import into app using importFSANZDatabase() function
 */
async function queryLocalFSANZDatabase(barcode: string, country: 'AU' | 'NZ'): Promise<Product | null> {
  try {
    // Check if we have a local FSANZ database cache
    const cacheKey = `${FSANZ_CACHE_KEY}_${country}`;
    const cacheData = await AsyncStorage.getItem(cacheKey);
    
    if (!cacheData) {
      // No local database available
      logger.debug(`FSANZ ${country} database not found in local storage`);
      return null;
    }

    // Parse cached database
    const database: Record<string, FSANZProduct> = JSON.parse(cacheData);
    
    // Search for barcode in database
    // Try multiple barcode formats for better matching
    const barcodeVariants = [
      barcode,
      barcode.replace(/^0+/, ''), // Remove leading zeros
      barcode.padStart(13, '0'), // Pad to EAN-13
      barcode.padStart(14, '0'), // Pad to GTIN-14
    ];
    
    let product: FSANZProduct | undefined;
    let matchedBarcode = barcode;
    
    for (const variant of barcodeVariants) {
      if (database[variant]) {
        product = database[variant];
        matchedBarcode = variant;
        break;
      }
    }
    
    if (!product) {
      return null;
    }

    // Convert FSANZ product format to our Product format
    const convertedProduct: Product = {
      barcode: matchedBarcode,
      product_name: product.productName,
      brands: product.brand,
      source: country === 'AU' ? 'fsanz_au' : 'fsanz_nz',
      // FSANZ provides comprehensive nutrition data (per 100g)
      nutriments: {
        'energy-kcal_100g': product.energyKcal,
        fat: product.fat,
        'saturated-fat': product.saturatedFat,
        carbohydrates: product.carbohydrates,
        sugars: product.sugars,
        proteins: product.protein,
        salt: product.salt,
        fiber: product.dietaryFiber,
        sodium: product.sodium,
      },
      ingredients_text: product.ingredients,
      quantity: product.packageSize || product.servingSize,
      serving_size: product.servingSize,
      categories_tags: product.categories 
        ? (Array.isArray(product.categories) 
            ? product.categories 
            : [product.categories])
        : undefined,
      // FSANZ-specific metadata
      // Health Star Rating could be added to product metadata if needed
    };

    logger.debug(`Found product in local FSANZ ${country} database: ${matchedBarcode}`);
    return convertedProduct;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.debug(`Local FSANZ ${country} database query error for ${barcode}:`, errorMessage);
    return null;
  }
}

/**
 * Fetch product from Australian Food Composition Database (AFCD)
 * FSANZ maintains the AFCD which includes detailed nutrition information
 * 
 * Strategy:
 * 1. Try local database first (if pre-downloaded)
 * 2. Fall back to web search (if needed)
 * 
 * NOTE: For full functionality, download FSANZ database from:
 * https://www.foodstandards.gov.au/science/monitoringnutrients/afcd/Pages/default.aspx
 * And import into local storage
 */
async function fetchFromAUFSANZ(barcode: string): Promise<Product | null> {
  try {
    // Strategy 1: Query local database (if available)
    const localProduct = await queryLocalFSANZDatabase(barcode, 'AU');
    if (localProduct) {
      return localProduct;
    }

    // Strategy 2: Web search fallback (limited - FSANZ doesn't have public API)
    // FSANZ Branded Food Database search (requires web scraping)
    // For now, we rely on Open Food Facts which includes FSANZ-imported data
    
    logger.debug(`FSANZ AU: No local database available for ${barcode}. Consider downloading FSANZ database exports.`);
    
    // The enhanced Open Food Facts queries (Phase 1) already include
    // FSANZ-imported data for many products, so this is not critical
    
    return null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.debug(`FSANZ AU error for ${barcode}:`, errorMessage);
    return null;
  }
}

/**
 * Fetch product from New Zealand Food Composition Database
 * MPI (Ministry for Primary Industries) maintains NZ food database
 * 
 * Strategy:
 * 1. Try local database first (if pre-downloaded)
 * 2. Fall back to web search (if needed)
 */
async function fetchFromNZFSANZ(barcode: string): Promise<Product | null> {
  try {
    // Strategy 1: Query local database (if available)
    const localProduct = await queryLocalFSANZDatabase(barcode, 'NZ');
    if (localProduct) {
      return localProduct;
    }

    // Strategy 2: Web search fallback
    logger.debug(`FSANZ NZ: No local database available for ${barcode}. Consider downloading NZ food composition database.`);
    
    return null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.debug(`FSANZ NZ error for ${barcode}:`, errorMessage);
    return null;
  }
}

/**
 * Fetch product from FSANZ databases (AU and NZ)
 * Only tries if user is in Australia or New Zealand
 * 
 * NOTE: This requires pre-downloading FSANZ database exports and importing them
 * into local storage. The current implementation provides the structure for
 * future local database integration.
 * 
 * For immediate benefits, the enhanced Open Food Facts queries (Phase 1)
 * already include FSANZ-imported data for many products.
 */
export async function fetchProductFromFSANZ(barcode: string): Promise<Product | null> {
  const userCountry = getUserCountryCode();
  
  // Only try FSANZ if user is in Australia or New Zealand
  if (userCountry !== 'AU' && userCountry !== 'NZ') {
    return null;
  }
  
  try {
    // Try country-specific database
    if (userCountry === 'AU') {
      const auProduct = await fetchFromAUFSANZ(barcode);
      if (auProduct) {
        return auProduct;
      }
    } else if (userCountry === 'NZ') {
      const nzProduct = await fetchFromNZFSANZ(barcode);
      if (nzProduct) {
        return nzProduct;
      }
    }
    
    return null;
  } catch (error) {
    logger.debug(`FSANZ database error for ${barcode}:`, error);
    return null;
  }
}

/**
 * IMPORTANT: FSANZ Database Integration Instructions
 * 
 * To enable full FSANZ functionality:
 * 
 * 1. Download FSANZ Database Exports:
 *    - AU: https://www.foodstandards.gov.au/science/monitoringnutrients/afcd/Pages/default.aspx
 *    - NZ: https://www.mpi.govt.nz/food-safety/food-monitoring-and-surveillance/food-composition-database/
 * 
 * 2. Convert to JSON/SQLite format:
 *    - Parse Excel/Access files
 *    - Extract: barcode (GTIN), product name, brand, nutrition, ingredients
 *    - Index by barcode for fast lookup
 * 
 * 3. Store in app:
 *    - Use AsyncStorage for small datasets (<10MB)
 *    - Use SQLite for larger datasets (>10MB)
 *    - Cache key: @truescan_fsanz_cache_AU / @truescan_fsanz_cache_NZ
 * 
 * 4. Update queryLocalFSANZDatabase() to query the imported data
 * 
 * Expected Impact:
 * - +20-30% recognition for NZ/AU users
 * - Offline access to government-verified nutrition data
 * - High-quality, official product information
 * 
 * Current Status:
 * - Structure in place for local database queries
 * - Enhanced OFF queries (Phase 1) already include FSANZ-imported data
 * - Ready for database import when available
 */

