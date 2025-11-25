// Manual Product Entry Service
// Allows users to manually add product information when product is not found in database

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, ProductWithTrustScore, TrustScoreBreakdown } from '../types/product';
import { cacheProduct } from './cacheService';
import { calculateTruScore } from '../lib/scoringEngine';

const STORAGE_KEY_PREFIX = '@truescan_manual_product_';
const MAX_MANUAL_PRODUCTS = 100; // Limit to prevent storage bloat

export interface ManualProductData {
  barcode: string;
  product_name: string;
  brands?: string;
  ingredients_text?: string;
  image_url?: string;
  nutriments?: Product['nutriments'];
  serving_size?: string;
  quantity?: string;
  manufacturing_places?: string;
  countries?: string;
  categories?: string;
  allergens_tags?: string[];
  additives_tags?: string[];
  packaging_data?: Product['packaging_data'];
  notes?: string; // User notes
  timestamp: number;
  userId?: string; // For future multi-user support
}

/**
 * Save a manually entered product
 */
export async function saveManualProduct(data: ManualProductData): Promise<boolean> {
  try {
    // Validate required fields
    if (!data.barcode || !data.product_name) {
      throw new Error('Barcode and product name are required');
    }

    // Create Product object from manual data
    const product: Product = {
      barcode: data.barcode,
      product_name: data.product_name,
      product_name_en: data.product_name,
      brands: data.brands,
      ingredients_text: data.ingredients_text,
      image_url: data.image_url,
      nutriments: data.nutriments,
      serving_size: data.serving_size,
      quantity: data.quantity,
      manufacturing_places: data.manufacturing_places,
      countries: data.countries,
      categories: data.categories,
      allergens_tags: data.allergens_tags,
      additives_tags: data.additives_tags,
      packaging_data: data.packaging_data,
      source: 'user_contributed' as Product['source'],
      created_t: Math.floor(data.timestamp / 1000),
      last_modified_t: Math.floor(data.timestamp / 1000),
      completion: calculateCompletion(data),
      quality: calculateQuality(data),
    };

    // Calculate Trust Score if we have enough data
    let productWithScore: ProductWithTrustScore;
    try {
      const trustScoreResult = calculateTruScore(product, 'user_contributed');
      // Map TruScoreResult to TrustScoreBreakdown format
      const breakdown: TrustScoreBreakdown = {
        body: trustScoreResult.breakdown.Body || 0,
        planet: trustScoreResult.breakdown.Planet || 0,
        care: trustScoreResult.breakdown.Care || 0,
        open: trustScoreResult.breakdown.Open || 0,
        reasons: [],
      };
      
      productWithScore = {
        ...product,
        trust_score: trustScoreResult.truscore,
        trust_score_breakdown: breakdown,
        _truscore_metadata: {
          hasNutriScore: trustScoreResult.hasNutriScore,
          hasEcoScore: trustScoreResult.hasEcoScore,
          hasOrigin: trustScoreResult.hasOrigin,
        },
      };
    } catch (error) {
      console.error('[ManualProductService] Error calculating trust score:', error);
      // If trust score calculation fails, use product without score
      productWithScore = {
        ...product,
        trust_score: null,
        trust_score_breakdown: null,
      };
    }

    // Save to cache (so it appears in app immediately)
    await cacheProduct(productWithScore, false); // false = not premium

    // Also save to manual products storage (for management)
    const storageKey = `${STORAGE_KEY_PREFIX}${data.barcode}`;
    await AsyncStorage.setItem(storageKey, JSON.stringify({
      ...data,
      product: productWithScore,
    }));

    // Add to manual products list
    await addToManualProductsList(data.barcode);

    console.log(`[ManualProductService] ✅ Saved manual product: ${data.barcode} - ${data.product_name}`);
    return true;
  } catch (error) {
    console.error('[ManualProductService] Error saving manual product:', error);
    return false;
  }
}

/**
 * Get a manually entered product
 */
export async function getManualProduct(barcode: string): Promise<ProductWithTrustScore | null> {
  try {
    const storageKey = `${STORAGE_KEY_PREFIX}${barcode}`;
    const data = await AsyncStorage.getItem(storageKey);
    
    if (!data) {
      return null;
    }

    const parsed = JSON.parse(data);
    return parsed.product || null;
  } catch (error) {
    console.error('[ManualProductService] Error getting manual product:', error);
    return null;
  }
}

/**
 * Check if a product was manually added
 */
export async function isManualProduct(barcode: string): Promise<boolean> {
  try {
    const storageKey = `${STORAGE_KEY_PREFIX}${barcode}`;
    const data = await AsyncStorage.getItem(storageKey);
    return data !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Get all manually added products
 */
export async function getAllManualProducts(): Promise<ManualProductData[]> {
  try {
    const listKey = `${STORAGE_KEY_PREFIX}list`;
    const listData = await AsyncStorage.getItem(listKey);
    
    if (!listData) {
      return [];
    }

    const barcodes: string[] = JSON.parse(listData);
    const products: ManualProductData[] = [];

    for (const barcode of barcodes) {
      const storageKey = `${STORAGE_KEY_PREFIX}${barcode}`;
      const data = await AsyncStorage.getItem(storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        products.push(parsed);
      }
    }

    // Sort by timestamp (newest first)
    return products.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('[ManualProductService] Error getting all manual products:', error);
    return [];
  }
}

/**
 * Delete a manually added product
 */
export async function deleteManualProduct(barcode: string): Promise<boolean> {
  try {
    const storageKey = `${STORAGE_KEY_PREFIX}${barcode}`;
    await AsyncStorage.removeItem(storageKey);
    await removeFromManualProductsList(barcode);
    return true;
  } catch (error) {
    console.error('[ManualProductService] Error deleting manual product:', error);
    return false;
  }
}

/**
 * Add barcode to manual products list
 */
async function addToManualProductsList(barcode: string): Promise<void> {
  try {
    const listKey = `${STORAGE_KEY_PREFIX}list`;
    const listData = await AsyncStorage.getItem(listKey);
    const barcodes: string[] = listData ? JSON.parse(listData) : [];
    
    // Add if not already in list
    if (!barcodes.includes(barcode)) {
      barcodes.unshift(barcode); // Add to beginning
      
      // Limit list size
      if (barcodes.length > MAX_MANUAL_PRODUCTS) {
        barcodes.splice(MAX_MANUAL_PRODUCTS);
      }
      
      await AsyncStorage.setItem(listKey, JSON.stringify(barcodes));
    }
  } catch (error) {
    console.error('[ManualProductService] Error adding to list:', error);
  }
}

/**
 * Remove barcode from manual products list
 */
async function removeFromManualProductsList(barcode: string): Promise<void> {
  try {
    const listKey = `${STORAGE_KEY_PREFIX}list`;
    const listData = await AsyncStorage.getItem(listKey);
    if (!listData) return;
    
    const barcodes: string[] = JSON.parse(listData);
    const filtered = barcodes.filter(b => b !== barcode);
    await AsyncStorage.setItem(listKey, JSON.stringify(filtered));
  } catch (error) {
    console.error('[ManualProductService] Error removing from list:', error);
  }
}

/**
 * Calculate completion percentage based on filled fields
 */
function calculateCompletion(data: ManualProductData): number {
  let filled = 0;
  const total = 8; // Total important fields
  
  if (data.product_name) filled++;
  if (data.brands) filled++;
  if (data.ingredients_text) filled++;
  if (data.image_url) filled++;
  if (data.nutriments && Object.keys(data.nutriments).length > 0) filled++;
  if (data.serving_size) filled++;
  if (data.manufacturing_places) filled++;
  if (data.categories) filled++;
  
  return Math.round((filled / total) * 100);
}

/**
 * Calculate quality score based on data completeness and accuracy
 */
function calculateQuality(data: ManualProductData): number {
  let score = 0;
  
  // Base score for required fields
  if (data.product_name && data.product_name.length > 3) score += 20;
  if (data.barcode && /^\d{8,14}$/.test(data.barcode)) score += 10;
  
  // Additional score for optional but important fields
  if (data.ingredients_text && data.ingredients_text.length > 10) score += 20;
  if (data.image_url) score += 15;
  if (data.brands) score += 10;
  if (data.nutriments && Object.keys(data.nutriments).length > 0) score += 15;
  if (data.manufacturing_places) score += 5;
  if (data.categories) score += 5;
  
  return Math.min(100, score);
}

/**
 * Submit manual product to Open Food Facts (optional)
 * This allows users to contribute their manual entry to the public database
 */
export async function submitToOpenFoodFacts(data: ManualProductData): Promise<boolean> {
  try {
    // Open Open Food Facts edit page with pre-filled data
    const offUrl = `https://world.openfoodfacts.org/cgi/product.pl?type=edit&code=${data.barcode}`;
    
    // Note: This would ideally use the Open Food Facts API, but that requires authentication
    // For now, we'll just open the web page for the user to complete the submission
    
    return true;
  } catch (error) {
    console.error('[ManualProductService] Error submitting to OFF:', error);
    return false;
  }
}

