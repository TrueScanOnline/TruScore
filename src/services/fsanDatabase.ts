// FSANZ (Food Standards Australia New Zealand) Database Integration
// Provides access to official government food product databases
// Covers both Australian and New Zealand food products with comprehensive nutrition data

import { Product } from '../types/product';
import { logger } from '../utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizeBarcode } from '../utils/barcodeNormalization';
import { FSANZProduct, FSANZDatabase, isFSANZDatabaseAvailable } from './fsanDatabaseImporter';

const FSANZ_CACHE_KEY = '@truescan_fsanz_cache';

/**
 * Query FSANZ local database for a product by barcode
 * The database must be imported first using the import service
 * 
 * @param barcode - Product barcode (will try variants)
 * @param country - 'AU' or 'NZ' to specify which database to query
 * @returns Product if found, null otherwise
 */
export async function queryFSANZLocalDatabase(
  barcode: string,
  country: 'AU' | 'NZ'
): Promise<Product | null> {
  try {
    // Check if database is available
    const isAvailable = await isFSANZDatabaseAvailable(country);
    if (!isAvailable) {
      logger.debug(`FSANZ ${country} database not found in local storage`);
      return null;
    }

    // Get database from AsyncStorage
    const cacheKey = `${FSANZ_CACHE_KEY}_${country}`;
    const databaseString = await AsyncStorage.getItem(cacheKey);
    
    if (!databaseString) {
      logger.debug(`FSANZ ${country} database not found in local storage`);
      return null;
    }

    const database: FSANZDatabase = JSON.parse(databaseString);

    // Try barcode variants (EAN-8 -> EAN-13, etc.)
    const barcodeVariants = normalizeBarcode(barcode);
    
    // Try each variant
    for (const variant of barcodeVariants) {
      const fsanzProduct = database[variant];
      
      if (fsanzProduct) {
        logger.debug(`Found product in FSANZ ${country} database: ${variant}`);
        
        // Convert FSANZ product to our Product format
        const convertedProduct: Product = {
          barcode: variant,
          product_name: fsanzProduct.productName,
          brands: fsanzProduct.brand,
          source: country === 'AU' ? 'fsanz_au' : 'fsanz_nz',
          
          // Nutrition data (convert to per-100g format)
          nutriments: {
            'energy-kcal_100g': fsanzProduct.energyKcal,
            'energy-kcal': fsanzProduct.energyKcal,
            'fat_100g': fsanzProduct.fat,
            fat: fsanzProduct.fat,
            'saturated-fat_100g': fsanzProduct.saturatedFat,
            'saturated-fat': fsanzProduct.saturatedFat,
            'carbohydrates_100g': fsanzProduct.carbohydrates,
            carbohydrates: fsanzProduct.carbohydrates,
            'sugars_100g': fsanzProduct.sugars,
            sugars: fsanzProduct.sugars,
            'proteins_100g': fsanzProduct.protein,
            proteins: fsanzProduct.protein,
            'salt_100g': fsanzProduct.salt,
            salt: fsanzProduct.salt,
            'sodium_100g': fsanzProduct.sodium,
            sodium: fsanzProduct.sodium,
            'fiber_100g': fsanzProduct.dietaryFiber,
            fiber: fsanzProduct.dietaryFiber,
          },
          
          ingredients_text: fsanzProduct.ingredients,
          
          // Categories
          categories: Array.isArray(fsanzProduct.categories) 
            ? fsanzProduct.categories.join(', ')
            : fsanzProduct.categories,
          
          // Package and serving size
          packaging: fsanzProduct.packageSize,
          serving_size: fsanzProduct.servingSize,
          
          // Quality indicators (government data is high quality)
          quality: 90,
          completion: 85,
        };
        
        return convertedProduct;
      }
    }
    
    logger.debug(`FSANZ ${country}: No local database available for ${barcode}. Consider downloading ${country} food composition database.`);
    return null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error querying FSANZ ${country} database for ${barcode}:`, errorMessage);
    return null;
  }
}

/**
 * Fetch product from FSANZ database (AU or NZ)
 * Automatically detects country or tries both
 * 
 * @param barcode - Product barcode
 * @param country - Optional country code ('AU' or 'NZ'). If not provided, tries both
 * @returns Product if found, null otherwise
 */
export async function fetchProductFromFSANZ(
  barcode: string,
  country?: 'AU' | 'NZ'
): Promise<Product | null> {
  try {
    // If country specified, only try that one
    if (country) {
      return await queryFSANZLocalDatabase(barcode, country);
    }
    
    // Otherwise, try both AU and NZ databases
    // Try AU first (larger database typically)
    const auProduct = await queryFSANZLocalDatabase(barcode, 'AU');
    if (auProduct) {
      return auProduct;
    }
    
    // Try NZ if AU didn't find it
    const nzProduct = await queryFSANZLocalDatabase(barcode, 'NZ');
    if (nzProduct) {
      return nzProduct;
    }
    
    return null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error fetching from FSANZ for ${barcode}:`, errorMessage);
    return null;
  }
}

/**
 * Get FSANZ database status
 * 
 * @param country - 'AU' or 'NZ'
 * @returns Status object with exists flag and product count if available
 */
export async function getFSANZDatabaseStatus(
  country: 'AU' | 'NZ'
): Promise<{ exists: boolean; productCount?: number; importDate?: number; sizeInBytes?: number }> {
  try {
    const isAvailable = await isFSANZDatabaseAvailable(country);
    
    if (!isAvailable) {
      return { exists: false };
    }
    
    // Get metadata
    const cacheKey = `${FSANZ_CACHE_KEY}_${country}`;
    const metadataString = await AsyncStorage.getItem(`${cacheKey}_metadata`);
    
    if (metadataString) {
      const metadata = JSON.parse(metadataString);
      return {
        exists: true,
        productCount: metadata.productCount,
        importDate: metadata.importedAt,
        sizeInBytes: metadata.sizeInBytes,
      };
    }
    
    return { exists: true };
  } catch (error) {
    logger.error(`Error getting FSANZ ${country} database status:`, error);
    return { exists: false };
  }
}

