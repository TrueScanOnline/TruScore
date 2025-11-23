// FSANZ Database Import Service
// Handles importing pre-downloaded FSANZ database exports into the app

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';
import * as FileSystem from 'expo-file-system/legacy';

const FSANZ_CACHE_KEY_AU = '@truescan_fsanz_cache_AU';
const FSANZ_CACHE_KEY_NZ = '@truescan_fsanz_cache_NZ';
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB limit per database

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
  categories?: string[];
  healthStarRating?: number;
}

export interface FSANZDatabase {
  [barcode: string]: FSANZProduct;
}

/**
 * Import FSANZ database from JSON file
 * The JSON file should be created using the import script:
 * node scripts/importFSANZDatabase.js --input <export-file> --output <json-file> --country <AU|NZ>
 */
export async function importFSANZDatabaseFromFile(
  fileUri: string,
  country: 'AU' | 'NZ'
): Promise<{ success: boolean; productCount: number; error?: string }> {
  try {
    logger.info(`Importing FSANZ ${country} database from ${fileUri}...`);
    
    // Read JSON file
    const fileContent = await FileSystem.readAsStringAsync(fileUri);
    const database: FSANZDatabase = JSON.parse(fileContent);
    
    // Validate data structure
    if (typeof database !== 'object' || Array.isArray(database)) {
      throw new Error('Invalid database format. Expected object with barcode keys.');
    }
    
    const productCount = Object.keys(database).length;
    
    if (productCount === 0) {
      throw new Error('Database is empty. No products found.');
    }
    
    // Check size
    const dataSize = new Blob([fileContent]).size;
    if (dataSize > MAX_CACHE_SIZE) {
      logger.warn(`Database size (${(dataSize / 1024 / 1024).toFixed(2)}MB) exceeds limit (${MAX_CACHE_SIZE / 1024 / 1024}MB). Consider using SQLite instead.`);
      // Still try to import, but warn user
    }
    
    // Store in AsyncStorage
    const cacheKey = country === 'AU' ? FSANZ_CACHE_KEY_AU : FSANZ_CACHE_KEY_NZ;
    await AsyncStorage.setItem(cacheKey, fileContent);
    
    // Also store metadata
    await AsyncStorage.setItem(`${cacheKey}_metadata`, JSON.stringify({
      productCount,
      importDate: new Date().toISOString(),
      dataSize,
      version: '1.0',
    }));
    
    logger.info(`✅ Imported FSANZ ${country} database: ${productCount} products`);
    
    return {
      success: true,
      productCount,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to import FSANZ ${country} database:`, errorMessage);
    
    return {
      success: false,
      productCount: 0,
      error: errorMessage,
    };
  }
}

/**
 * Import FSANZ database from JSON string (for direct import)
 */
export async function importFSANZDatabaseFromJSON(
  jsonData: string,
  country: 'AU' | 'NZ'
): Promise<{ success: boolean; productCount: number; error?: string }> {
  try {
    const database: FSANZDatabase = JSON.parse(jsonData);
    const productCount = Object.keys(database).length;
    
    const cacheKey = country === 'AU' ? FSANZ_CACHE_KEY_AU : FSANZ_CACHE_KEY_NZ;
    await AsyncStorage.setItem(cacheKey, jsonData);
    
    await AsyncStorage.setItem(`${cacheKey}_metadata`, JSON.stringify({
      productCount,
      importDate: new Date().toISOString(),
      dataSize: new Blob([jsonData]).size,
      version: '1.0',
    }));
    
    logger.info(`✅ Imported FSANZ ${country} database: ${productCount} products`);
    
    return {
      success: true,
      productCount,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
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
export async function getFSANZDatabaseMetadata(
  country: 'AU' | 'NZ'
): Promise<{ productCount: number; importDate: string; dataSize: number } | null> {
  try {
    const cacheKey = country === 'AU' ? FSANZ_CACHE_KEY_AU : FSANZ_CACHE_KEY_NZ;
    const metadataStr = await AsyncStorage.getItem(`${cacheKey}_metadata`);
    
    if (!metadataStr) {
      return null;
    }
    
    return JSON.parse(metadataStr);
  } catch (error) {
    logger.debug(`Error getting FSANZ ${country} metadata:`, error);
    return null;
  }
}

/**
 * Check if FSANZ database is imported
 */
export async function isFSANZDatabaseImported(country: 'AU' | 'NZ'): Promise<boolean> {
  const cacheKey = country === 'AU' ? FSANZ_CACHE_KEY_AU : FSANZ_CACHE_KEY_NZ;
  const data = await AsyncStorage.getItem(cacheKey);
  return data !== null;
}

/**
 * Clear FSANZ database (for re-import or updates)
 */
export async function clearFSANZDatabase(country: 'AU' | 'NZ'): Promise<void> {
  const cacheKey = country === 'AU' ? FSANZ_CACHE_KEY_AU : FSANZ_CACHE_KEY_NZ;
  await AsyncStorage.removeItem(cacheKey);
  await AsyncStorage.removeItem(`${cacheKey}_metadata`);
  logger.info(`Cleared FSANZ ${country} database`);
}

