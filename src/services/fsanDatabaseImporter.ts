// FSANZ Database Importer
// Imports pre-converted FSANZ database JSON files into app storage

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

const FSANZ_CACHE_KEY = '@truescan_fsanz_cache';
const MAX_STORAGE_SIZE = 10 * 1024 * 1024; // 10MB limit for AsyncStorage

export interface FSANZProduct {
  productName: string;
  brand?: string;
  energyKcal?: number;
  fat?: number;
  saturatedFat?: number;
  carbohydrates?: number;
  sugars?: number;
  protein?: number;
  salt?: number;
  sodium?: number;
  dietaryFiber?: number;
  ingredients?: string;
  packageSize?: string;
  servingSize?: string;
  categories?: string | string[];
  healthStarRating?: number;
  country: 'AU' | 'NZ';
}

export interface FSANZDatabase {
  [barcode: string]: FSANZProduct;
}

/**
 * Import FSANZ database from JSON file
 * The JSON file should be created using the importFSANZDatabase.js script
 * 
 * @param databaseData - Parsed JSON data from FSANZ export
 * @param country - 'AU' or 'NZ'
 * @returns Success status and product count
 */
export async function importFSANZDatabase(
  databaseData: FSANZDatabase,
  country: 'AU' | 'NZ'
): Promise<{ success: boolean; productCount: number; error?: string }> {
  try {
    if (!databaseData || typeof databaseData !== 'object') {
      return {
        success: false,
        productCount: 0,
        error: 'Invalid database data format',
      };
    }

    const productCount = Object.keys(databaseData).length;
    
    if (productCount === 0) {
      return {
        success: false,
        productCount: 0,
        error: 'Database is empty',
      };
    }

    // Check storage size
    const jsonString = JSON.stringify(databaseData);
    const sizeInBytes = new Blob([jsonString]).size;
    
    if (sizeInBytes > MAX_STORAGE_SIZE) {
      logger.warn(`FSANZ ${country} database is ${(sizeInBytes / 1024 / 1024).toFixed(2)}MB, exceeds 10MB limit`);
      logger.warn('Consider using SQLite for larger databases');
      
      // Still try to import, but warn user
      // In production, you might want to reject or use SQLite
    }

    // Store in AsyncStorage
    const cacheKey = `${FSANZ_CACHE_KEY}_${country}`;
    await AsyncStorage.setItem(cacheKey, jsonString);

    // Also store metadata
    const metadata = {
      country,
      productCount,
      importedAt: Date.now(),
      sizeInBytes,
      version: '1.0',
    };
    await AsyncStorage.setItem(`${cacheKey}_metadata`, JSON.stringify(metadata));

    logger.info(`✅ Imported FSANZ ${country} database: ${productCount} products, ${(sizeInBytes / 1024 / 1024).toFixed(2)}MB`);
    
    return {
      success: true,
      productCount,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error importing FSANZ ${country} database:`, errorMessage);
    
    return {
      success: false,
      productCount: 0,
      error: errorMessage,
    };
  }
}

/**
 * Get FSANZ database metadata
 */
export async function getFSANZDatabaseMetadata(country: 'AU' | 'NZ'): Promise<{
  exists: boolean;
  productCount?: number;
  importedAt?: number;
  sizeInBytes?: number;
} | null> {
  try {
    const cacheKey = `${FSANZ_CACHE_KEY}_${country}`;
    const metadataString = await AsyncStorage.getItem(`${cacheKey}_metadata`);
    
    if (!metadataString) {
      return { exists: false };
    }

    const metadata = JSON.parse(metadataString);
    return {
      exists: true,
      productCount: metadata.productCount,
      importedAt: metadata.importedAt,
      sizeInBytes: metadata.sizeInBytes,
    };
  } catch (error) {
    logger.error(`Error reading FSANZ ${country} metadata:`, error);
    return { exists: false };
  }
}

/**
 * Check if FSANZ database is available
 */
export async function isFSANZDatabaseAvailable(country: 'AU' | 'NZ'): Promise<boolean> {
  try {
    const cacheKey = `${FSANZ_CACHE_KEY}_${country}`;
    const data = await AsyncStorage.getItem(cacheKey);
    return data !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Clear FSANZ database (for re-import or updates)
 */
export async function clearFSANZDatabase(country: 'AU' | 'NZ'): Promise<void> {
  try {
    const cacheKey = `${FSANZ_CACHE_KEY}_${country}`;
    await AsyncStorage.removeItem(cacheKey);
    await AsyncStorage.removeItem(`${cacheKey}_metadata`);
    logger.info(`Cleared FSANZ ${country} database`);
  } catch (error) {
    logger.error(`Error clearing FSANZ ${country} database:`, error);
  }
}

