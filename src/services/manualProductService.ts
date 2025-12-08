// Manual Product Entry Service
// Allows users to manually add product information when product is not found in database

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, ProductWithTrustScore, TrustScoreBreakdown } from '../types/product';
import { cacheProduct } from './cacheService';
import { calculateTruScore } from '../lib/truscoreEngine';
import { logger } from '../utils/logger';
import { submitProductToOpenFoodFacts, hasOFFCredentials } from './openFoodFactsSubmission';
import { uploadProductPhoto } from './photoUploadService';
import { saveProductToSQLite } from './sqliteProductDatabase';
import { getUserCountryCode } from '../utils/countryDetection';

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
    // Validate required fields (barcode always required, product_name can be optional for partial updates)
    if (!data.barcode) {
      throw new Error('Barcode is required');
    }
    // Use 'Unknown Product' as fallback if product_name not provided
    const productName = data.product_name || 'Unknown Product';

    // Create Product object from manual data
    const product: Product = {
      barcode: data.barcode,
      product_name: productName,
      product_name_en: productName,
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
      const trustScoreResult = calculateTruScore(product);
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
      logger.error('[ManualProductService] Error calculating trust score', error);
      // If trust score calculation fails, use product without score
      productWithScore = {
        ...product,
        trust_score: null,
        trust_score_breakdown: null,
      };
    }

    // Save to cache (so it appears in app immediately)
    await cacheProduct(productWithScore, false); // false = not premium

    // CRITICAL: Save to SQLite database for persistent storage across app restarts
    // This ensures user-contributed data is available for all future scans
    try {
      const countryCode = await getUserCountryCode();
      await saveProductToSQLite(productWithScore, countryCode ?? undefined);
      logger.info(`[ManualProductService] ✅ Saved user-contributed product to SQLite: ${data.barcode}`);
    } catch (sqliteError) {
      logger.warn('[ManualProductService] Failed to save to SQLite (non-critical):', sqliteError);
      // Continue - cache and AsyncStorage still work
    }

    // Also save to manual products storage (for management)
    const storageKey = `${STORAGE_KEY_PREFIX}${data.barcode}`;
    await AsyncStorage.setItem(storageKey, JSON.stringify({
      ...data,
      product: productWithScore,
    }));

    // Add to manual products list
    await addToManualProductsList(data.barcode);

    logger.info(`[ManualProductService] ✅ Saved manual product: ${data.barcode} - ${productName}`);
    
    // CRITICAL: Submit to Open Food Facts and Vercel backend for global sharing
    // This ensures user data becomes available to all users worldwide
    try {
      // Upload photo first if available
      if (data.image_url) {
        try {
          const photoResult = await uploadProductPhoto(data.barcode, data.image_url, 'front');
          if (photoResult.success) {
            logger.info(`[ManualProductService] Photo uploaded: ${photoResult.openFoodFactsUrl || photoResult.vercelUrl}`);
            // Update product with uploaded photo URL
            if (photoResult.openFoodFactsUrl) {
              productWithScore.image_url = photoResult.openFoodFactsUrl;
            } else if (photoResult.vercelUrl) {
              productWithScore.image_url = photoResult.vercelUrl;
            }
          }
        } catch (photoError) {
          logger.warn('[ManualProductService] Photo upload failed (non-critical):', photoError);
        }
      }
      
      // Submit to Open Food Facts
      const offResult = await submitProductToOpenFoodFacts(data);
      if (offResult.success) {
        logger.info(`[ManualProductService] ✅ Submitted to Open Food Facts: ${offResult.productUrl}`);
      } else {
        logger.warn(`[ManualProductService] Open Food Facts submission failed: ${offResult.message}`);
        // Continue - local save was successful
      }
      
      // Submit to Vercel backend for global sharing
      // CRITICAL: This ensures user edits are available to all users worldwide
      let backendSubmissionSuccess = false;
      const maxRetries = 3;
      let retryCount = 0;
      
      while (!backendSubmissionSuccess && retryCount < maxRetries) {
        try {
          const { getBackendUrl, BackendEndpoints } = await import('../config/backendConfig');
          const backendUrl = getBackendUrl();
          const endpoint = BackendEndpoints.manualProducts(backendUrl);
          
          logger.info(`[ManualProductService] Submitting to backend (attempt ${retryCount + 1}/${maxRetries}): ${endpoint}`);
          
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              barcode: data.barcode,
              productData: {
                product_name: data.product_name,
                brands: data.brands,
                ingredients_text: data.ingredients_text,
                image_url: productWithScore.image_url,
                nutriments: data.nutriments,
                manufacturing_places: data.manufacturing_places,
                countries: data.countries,
                categories: data.categories,
                allergens_tags: data.allergens_tags,
                additives_tags: data.additives_tags,
                packaging_data: data.packaging_data,
                serving_size: data.serving_size,
                quantity: data.quantity,
              },
            }),
          });
          
          const responseText = await response.text();
          let responseData: any = null;
          try {
            responseData = JSON.parse(responseText);
          } catch {
            // Response is not JSON
          }
          
          if (response.ok) {
            logger.info(`[ManualProductService] ✅ Successfully submitted to Vercel backend: ${data.barcode}`);
            logger.info(`[ManualProductService] Backend response: ${responseText.substring(0, 200)}`);
            backendSubmissionSuccess = true;
          } else if (response.status === 401) {
            // 401 indicates authentication required - this should NOT happen with production URLs
            logger.error(`[ManualProductService] ❌ Backend returned 401 - Authentication Required`);
            logger.error(`[ManualProductService] This usually means a preview deployment URL is being used`);
            logger.error(`[ManualProductService] Backend URL: ${backendUrl}`);
            logger.error(`[ManualProductService] Response: ${responseText.substring(0, 500)}`);
            
            // Check if this is a preview deployment URL
            if (backendUrl.includes('-') && backendUrl.match(/https:\/\/[^-]+-[a-z0-9]+\.vercel\.app/)) {
              logger.error(`[ManualProductService] ❌ CRITICAL: Preview deployment URL detected!`);
              logger.error(`[ManualProductService] ❌ Preview deployments require authentication and cannot be used for public API access`);
              logger.error(`[ManualProductService] ❌ Please use production deployment URL or configure EXPO_PUBLIC_BACKEND_URL`);
              logger.error(`[ManualProductService] ❌ Data saved locally only - will NOT be available to other users`);
            }
            
            // Don't retry 401 errors - they won't succeed
            logger.warn(`[ManualProductService] ⚠️  Backend submission failed due to authentication. Data saved locally only.`);
            logger.warn(`[ManualProductService] ⚠️  Other users will NOT see this update until backend is accessible.`);
            break; // Don't retry - authentication won't change
          } else {
            logger.error(`[ManualProductService] ❌ Backend submission failed: ${response.status} ${response.statusText}`);
            logger.error(`[ManualProductService] Response: ${responseText.substring(0, 500)}`);
            
            // Retry on server errors (5xx) or rate limits (429)
            if ((response.status >= 500 && response.status < 600) || response.status === 429) {
              retryCount++;
              if (retryCount < maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff, max 5s
                logger.info(`[ManualProductService] Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
              }
            }
            
            // For other errors, don't retry
            break;
          }
        } catch (backendError: any) {
          logger.error('[ManualProductService] ❌ Backend submission error:', {
            error: backendError?.message || String(backendError),
            stack: backendError?.stack,
            barcode: data.barcode,
            attempt: retryCount + 1,
          });
          
          // Retry on network errors
          if (retryCount < maxRetries - 1 && (
            backendError?.message?.includes('Network') ||
            backendError?.message?.includes('fetch') ||
            backendError?.code === 'ERR_NETWORK'
          )) {
            retryCount++;
            const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
            logger.info(`[ManualProductService] Network error, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          // Don't retry on other errors
          break;
        }
      }
      
      if (!backendSubmissionSuccess) {
        logger.warn(`[ManualProductService] ⚠️  Backend submission failed after ${retryCount + 1} attempts. Data saved locally only.`);
        logger.warn(`[ManualProductService] ⚠️  Other users may not see this update until backend is accessible.`);
      }
    } catch (submissionError) {
      logger.warn('[ManualProductService] Error during global submission (non-critical):', submissionError);
      // Continue - local save was successful, submission is best-effort
    }
    
    return true;
  } catch (error) {
    logger.error('[ManualProductService] Error saving manual product', error);
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
    logger.error('[ManualProductService] Error getting manual product', error);
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
    logger.error('[ManualProductService] Error getting all manual products', error);
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
    logger.error('[ManualProductService] Error deleting manual product', error);
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
    logger.error('[ManualProductService] Error adding to list', error);
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
    logger.error('[ManualProductService] Error removing from list', error);
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
 * Submit manual product to Open Food Facts (optional - now handled automatically)
 * This function is kept for backward compatibility but auto-submission happens in saveManualProduct()
 * 
 * @deprecated Use saveManualProduct() which automatically submits to OFF and Vercel
 */
export async function submitToOpenFoodFacts(data: ManualProductData): Promise<boolean> {
  try {
    // Auto-submission now happens in saveManualProduct()
    // This function is kept for backward compatibility
    const result = await submitProductToOpenFoodFacts(data);
    return result.success;
  } catch (error) {
    logger.error('[ManualProductService] Error submitting to OFF', error);
    return false;
  }
}

