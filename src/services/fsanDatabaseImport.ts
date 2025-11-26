// FSANZ Database Import Service
// Handles importing pre-converted FSANZ database JSON files into the app
// Enhanced version with metadata tracking, status checking, and clear functionality

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';
import * as FileSystem from 'expo-file-system';
import { FSANZProduct, FSANZDatabase } from './fsanDatabaseImporter';

const FSANZ_CACHE_KEY = '@truescan_fsanz_cache';
const MAX_STORAGE_SIZE = 10 * 1024 * 1024; // 10MB limit for AsyncStorage

export interface FSANZImportMetadata {
  country: 'AU' | 'NZ';
  productCount: number;
  importedAt: number;
  sizeInBytes: number;
  version: string;
}

/**
 * Import FSANZ database from JSON file
 * The JSON file should be created using the importFSANZDatabase.js script
 * 
 * @param fileUri - URI of the JSON file to import
 * @param country - 'AU' or 'NZ'
 * @returns Success status and product count
 */
export async function importFSANZDatabaseFromFile(
  fileUri: string,
  country: 'AU' | 'NZ'
): Promise<{ success: boolean; productCount: number; error?: string }> {
  try {
    logger.info(`Starting FSANZ ${country} database import from file: ${fileUri}`);
    
    // Read file
    const fileContent = await FileSystem.readAsStringAsync(fileUri);
    const databaseData: FSANZDatabase = JSON.parse(fileContent);
    
    // Import using the data
    return await importFSANZDatabaseFromJSON(databaseData, country);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error importing FSANZ ${country} database from file:`, errorMessage);
    
    return {
      success: false,
      productCount: 0,
      error: errorMessage,
    };
  }
}

/**
 * Import FSANZ database from JSON data
 * 
 * @param databaseData - Parsed JSON data from FSANZ export
 * @param country - 'AU' or 'NZ'
 * @returns Success status and product count
 */
export async function importFSANZDatabaseFromJSON(
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

    // Store metadata
    const metadata: FSANZImportMetadata = {
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
 * Get FSANZ database import status
 * 
 * @param country - 'AU' or 'NZ'
 * @returns Status object with import information
 */
export async function getFSANZImportStatus(
  country: 'AU' | 'NZ'
): Promise<{ imported: boolean; productCount?: number; importDate?: number; sizeInBytes?: number }> {
  try {
    const cacheKey = `${FSANZ_CACHE_KEY}_${country}`;
    const metadataString = await AsyncStorage.getItem(`${cacheKey}_metadata`);
    
    if (!metadataString) {
      return { imported: false };
    }
    
    const metadata: FSANZImportMetadata = JSON.parse(metadataString);
    return {
      imported: true,
      productCount: metadata.productCount,
      importDate: metadata.importedAt,
      sizeInBytes: metadata.sizeInBytes,
    };
  } catch (error) {
    logger.error(`Error getting FSANZ ${country} import status:`, error);
    return { imported: false };
  }
}

/**
 * Clear FSANZ database (for re-import or updates)
 * 
 * @param country - 'AU' or 'NZ'
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

/**
 * Check if FSANZ database is imported
 * 
 * @param country - 'AU' or 'NZ'
 * @returns True if database is imported
 */
export async function isFSANZDatabaseImported(country: 'AU' | 'NZ'): Promise<boolean> {
  try {
    const cacheKey = `${FSANZ_CACHE_KEY}_${country}`;
    const data = await AsyncStorage.getItem(cacheKey);
    return data !== null;
  } catch (error) {
    return false;
  }
}



