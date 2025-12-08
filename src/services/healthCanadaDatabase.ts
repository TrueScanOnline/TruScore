// Health Canada Canadian Nutrient File (CNF) Database Integration
// Provides access to official government food product databases for Canada
// Note: CNF is available as downloadable files, not a public API
// Database files must be imported first using an import service (similar to FSANZ)

import { Product } from '../types/product';
import { logger } from '../utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizeBarcode } from '../utils/barcodeNormalization';

const HEALTH_CANADA_CACHE_KEY = '@truescan_healthcanada_cnf_cache';

/**
 * Check if Health Canada CNF database is available in local storage
 */
export async function isHealthCanadaDatabaseAvailable(): Promise<boolean> {
  try {
    const databaseString = await AsyncStorage.getItem(HEALTH_CANADA_CACHE_KEY);
    return !!databaseString;
  } catch (error) {
    logger.error('Error checking Health Canada CNF database availability:', error);
    return false;
  }
}

/**
 * Query Health Canada CNF local database for a product by barcode
 * The database must be imported first using the import service
 * 
 * @param barcode - Product barcode (will try variants)
 * @returns Product if found, null otherwise
 */
export async function fetchProductFromHealthCanada(barcode: string): Promise<Product | null> {
  try {
    // Check if database is available
    const isAvailable = await isHealthCanadaDatabaseAvailable();
    if (!isAvailable) {
      logger.debug(`Health Canada CNF database not found in local storage`);
      return null;
    }

    // Get database from AsyncStorage
    const databaseString = await AsyncStorage.getItem(HEALTH_CANADA_CACHE_KEY);
    
    if (!databaseString) {
      logger.debug(`Health Canada CNF database not found in local storage`);
      return null;
    }

    // Parse database (structure similar to FSANZ)
    // Expected format: { [barcode]: { productName, brand, nutrients, ... } }
    const database: Record<string, any> = JSON.parse(databaseString);

    // Try barcode variants (EAN-8 -> EAN-13, etc.)
    const barcodeVariants = normalizeBarcode(barcode);
    
    // Try each variant
    for (const variant of barcodeVariants) {
      const cnfProduct = database[variant];
      
      if (cnfProduct) {
        logger.debug(`Found product in Health Canada CNF database: ${variant}`);
        
        // Convert CNF product to our Product format
        const convertedProduct: Product = {
          barcode: variant,
          product_name: cnfProduct.productName || cnfProduct.description || `Product ${variant}`,
          brands: cnfProduct.brand || cnfProduct.brandName,
          source: 'health_canada_cnf',
          
          // Nutrition data (convert to per-100g format)
          nutriments: {
            'energy-kcal_100g': cnfProduct.energyKcal,
            'energy-kcal': cnfProduct.energyKcal,
            'fat_100g': cnfProduct.fat,
            fat: cnfProduct.fat,
            'saturated-fat_100g': cnfProduct.saturatedFat,
            'saturated-fat': cnfProduct.saturatedFat,
            'carbohydrates_100g': cnfProduct.carbohydrates,
            carbohydrates: cnfProduct.carbohydrates,
            'sugars_100g': cnfProduct.sugars,
            sugars: cnfProduct.sugars,
            'proteins_100g': cnfProduct.protein,
            proteins: cnfProduct.protein,
            'salt_100g': cnfProduct.salt,
            salt: cnfProduct.salt,
            'sodium_100g': cnfProduct.sodium,
            sodium: cnfProduct.sodium,
            'fiber_100g': cnfProduct.dietaryFiber || cnfProduct.fiber,
            fiber: cnfProduct.dietaryFiber || cnfProduct.fiber,
          },
          
          ingredients_text: cnfProduct.ingredients,
          
          // Categories
          categories: Array.isArray(cnfProduct.categories) 
            ? cnfProduct.categories.join(', ')
            : cnfProduct.categories,
          
          // Package and serving size
          packaging: cnfProduct.packageSize,
          serving_size: cnfProduct.servingSize,
          
          // Quality indicators (government data is high quality)
          quality: 90,
          completion: 85,
        };
        
        return convertedProduct;
      }
    }
    
    logger.debug(`Health Canada CNF: No local database available for ${barcode}. Consider downloading Canadian Nutrient File database.`);
    return null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error querying Health Canada CNF database for ${barcode}:`, errorMessage);
    return null;
  }
}

/**
 * Get Health Canada CNF database status
 * 
 * @returns Status object with exists flag and product count if available
 */
export async function getHealthCanadaDatabaseStatus(): Promise<{ 
  exists: boolean; 
  productCount?: number; 
  importDate?: number; 
  sizeInBytes?: number 
}> {
  try {
    const isAvailable = await isHealthCanadaDatabaseAvailable();
    
    if (!isAvailable) {
      return { exists: false };
    }
    
    // Get metadata
    const metadataString = await AsyncStorage.getItem(`${HEALTH_CANADA_CACHE_KEY}_metadata`);
    
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
    logger.error(`Error getting Health Canada CNF database status:`, error);
    return { exists: false };
  }
}
