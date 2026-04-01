/**
 * Unified User Contribution Service
 * 
 * PROBLEM: Users can contribute data in multiple places:
 * - Photo upload (separate)
 * - Nutrition data (ManualProductEntryModal)
 * - Country of origin (ManufacturingCountryModal)
 * - Product name/ingredients (ManualProductEntryModal)
 * 
 * SOLUTION: Accumulate all contributions and submit them together
 * - Store pending contributions locally
 * - Merge all contributions when user clicks "Submit All"
 * - Submit merged data to backend in one request
 * - Ensure all data is available to other users
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../types/product';
import { saveManualProduct } from './manualProductService';
import { ManualProductData } from '../types/manualProduct';
import { submitManufacturingCountry } from './manufacturingCountryService';
import { uploadProductPhoto, PhotoUploadResult } from './photoUploadService';
import { logger } from '../utils/logger';
import { powershellLogger } from '../utils/powershellLogger';

const PENDING_CONTRIBUTIONS_KEY = '@truescan_pending_contributions_';

export interface PendingContribution {
  barcode: string;
  type: 'photo' | 'nutrition' | 'country' | 'product_info' | 'ingredients';
  data: any;
  timestamp: number;
  submitted: boolean;
}

export interface AccumulatedContributions {
  barcode: string;
  photos: Array<{ path: string; type: 'front' | 'ingredients' | 'nutrition' | 'packaging' | 'country_label' }>;
  productData: Partial<ManualProductData>;
  manufacturingCountry?: {
    country: string;
    photoUrl?: string;
    hasImportedIngredients?: boolean;
  };
  lastUpdated: number;
}

/**
 * Add a pending contribution (doesn't submit immediately)
 */
export async function addPendingContribution(
  barcode: string,
  type: PendingContribution['type'],
  data: any
): Promise<void> {
  try {
    const key = `${PENDING_CONTRIBUTIONS_KEY}${barcode}`;
    const existing = await AsyncStorage.getItem(key);
    const contributions: AccumulatedContributions = existing 
      ? JSON.parse(existing)
      : {
          barcode,
          photos: [],
          productData: { barcode, timestamp: Date.now() },
          lastUpdated: Date.now(),
        };
    
    // Add contribution based on type
    switch (type) {
      case 'photo':
        if (data.path && data.type) {
          contributions.photos.push({ path: data.path, type: data.type });
          logger.info(`[UnifiedContribution] Added photo contribution: ${barcode}`);
        }
        break;
        
      case 'nutrition':
        if (!contributions.productData.nutriments) {
          contributions.productData.nutriments = {};
        }
        contributions.productData.nutriments = {
          ...contributions.productData.nutriments,
          ...data,
        };
        logger.info(`[UnifiedContribution] Added nutrition contribution: ${barcode}`);
        break;
        
      case 'product_info':
        contributions.productData = {
          ...contributions.productData,
          ...data,
        };
        logger.info(`[UnifiedContribution] Added product info contribution: ${barcode}`);
        break;
        
      case 'ingredients':
        contributions.productData.ingredients_text = data.ingredients_text || data;
        logger.info(`[UnifiedContribution] Added ingredients contribution: ${barcode}`);
        break;
        
      case 'country':
        contributions.manufacturingCountry = data;
        logger.info(`[UnifiedContribution] Added country contribution: ${barcode}`);
        break;
    }
    
    contributions.lastUpdated = Date.now();
    await AsyncStorage.setItem(key, JSON.stringify(contributions));
    
    powershellLogger.log('INFO', 'USER_CONTRIBUTION', `Pending contribution added`, {
      barcode,
      type,
      hasPhotos: contributions.photos.length > 0,
      hasProductData: !!contributions.productData.product_name,
      hasCountry: !!contributions.manufacturingCountry,
    });
  } catch (error) {
    logger.error('[UnifiedContribution] Error adding pending contribution:', error);
  }
}

/**
 * Get all pending contributions for a barcode
 */
export async function getPendingContributions(barcode: string): Promise<AccumulatedContributions | null> {
  try {
    const key = `${PENDING_CONTRIBUTIONS_KEY}${barcode}`;
    const data = await AsyncStorage.getItem(key);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    logger.error('[UnifiedContribution] Error getting pending contributions:', error);
    return null;
  }
}

/**
 * Check if there are pending contributions for a barcode
 */
export async function hasPendingContributions(barcode: string): Promise<boolean> {
  const pending = await getPendingContributions(barcode);
  if (!pending) return false;
  
  const hasPhotos = pending.photos.length > 0;
  const hasProductData = !!(pending.productData.product_name || 
                            pending.productData.ingredients_text || 
                            pending.productData.nutriments);
  const hasCountry = !!pending.manufacturingCountry;
  
  return hasPhotos || hasProductData || hasCountry;
}

/**
 * Submit ALL pending contributions for a barcode
 * This merges all contributions and submits them to the backend
 */
export async function submitAllContributions(barcode: string): Promise<{
  success: boolean;
  submitted: {
    photos: boolean;
    productData: boolean;
    country: boolean;
  };
  errors: string[];
}> {
  // ===== USER CONTRIBUTION FLOW: UNIFIED SUBMISSION =====
  powershellLogger.section(`UNIFIED CONTRIBUTION SUBMISSION - ${barcode}`);
  powershellLogger.log('INFO', 'USER_CONTRIBUTION', `Starting unified submission for all pending contributions`, {
    barcode,
    timestamp: new Date().toISOString(),
  });
  
  const result = {
    success: false,
    submitted: {
      photos: false,
      productData: false,
      country: false,
    },
    errors: [] as string[],
  };
  
  try {
    const pending = await getPendingContributions(barcode);
    if (!pending) {
      powershellLogger.log('WARN', 'USER_CONTRIBUTION', `No pending contributions found`, { barcode });
      return { ...result, success: true }; // No contributions to submit is not an error
    }
    
    logger.debug(`[UnifiedContribution] 🚀 Submitting all contributions for barcode: ${barcode}`);
    logger.debug(`[UnifiedContribution] Pending contributions:`, {
      photos: pending.photos.length,
      hasProductData: !!(pending.productData.product_name || pending.productData.ingredients_text),
      hasCountry: !!pending.manufacturingCountry,
    });
    
    // Step 1: Upload photos first (they might be needed for product data)
    if (pending.photos.length > 0) {
      try {
        powershellLogger.log('INFO', 'USER_CONTRIBUTION', `Uploading ${pending.photos.length} photo(s)`, {
          barcode,
          photoCount: pending.photos.length,
        });
        
        const photoResults: PhotoUploadResult[] = [];
        let uploadedPhotoUrl: string | undefined;
        
        for (const photo of pending.photos) {
          try {
            const photoResult = await uploadProductPhoto(barcode, photo.path, photo.type);
            photoResults.push(photoResult);
            
              if (photoResult.success) {
              // Prefer proprietary CDN URL when both exist (hero / label shots default to Vercel-only).
              if (!uploadedPhotoUrl && (photoResult.vercelUrl || photoResult.openFoodFactsUrl)) {
                uploadedPhotoUrl = photoResult.vercelUrl || photoResult.openFoodFactsUrl;
              }

              powershellLogger.log('SUCCESS', 'USER_CONTRIBUTION', `✅ Photo uploaded successfully`, {
                barcode,
                photoType: photo.type,
                url: photoResult.vercelUrl || photoResult.openFoodFactsUrl,
              });
            }
          } catch (photoError) {
            const errorMsg = photoError instanceof Error ? photoError.message : String(photoError);
            result.errors.push(`Photo upload failed: ${errorMsg}`);
            logger.warn(`[UnifiedContribution] Photo upload failed:`, photoError);
          }
        }
        
        // Update product data with uploaded photo URL
        if (uploadedPhotoUrl && !pending.productData.image_url) {
          pending.productData.image_url = uploadedPhotoUrl;
        }
        
        result.submitted.photos = photoResults.some(r => r.success);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        result.errors.push(`Photo upload error: ${errorMsg}`);
        logger.error('[UnifiedContribution] Error uploading photos:', error);
      }
    }
    
    // Step 2: Submit product data (includes photos, nutrition, ingredients, etc.)
    if (pending.productData.product_name || 
        pending.productData.ingredients_text || 
        pending.productData.nutriments ||
        pending.productData.image_url) {
      try {
        powershellLogger.log('INFO', 'USER_CONTRIBUTION', `Submitting product data`, {
          barcode,
          hasProductName: !!pending.productData.product_name,
          hasPhoto: !!pending.productData.image_url,
          hasIngredients: !!pending.productData.ingredients_text,
          hasNutrition: !!pending.productData.nutriments,
        });
        
        // Ensure required fields
        const productData: ManualProductData = {
          barcode,
          product_name: pending.productData.product_name || 'Unknown Product',
          brands: pending.productData.brands,
          ingredients_text: pending.productData.ingredients_text,
          image_url: pending.productData.image_url,
          nutriments: pending.productData.nutriments,
          serving_size: pending.productData.serving_size,
          quantity: pending.productData.quantity,
          manufacturing_places: pending.productData.manufacturing_places,
          countries: pending.productData.countries,
          categories: pending.productData.categories,
          allergens_tags: pending.productData.allergens_tags,
          additives_tags: pending.productData.additives_tags,
          packaging_data: pending.productData.packaging_data,
          notes: pending.productData.notes,
          timestamp: pending.productData.timestamp || Date.now(),
        };
        
        const success = await saveManualProduct(productData);
        result.submitted.productData = success;
        
        if (success) {
          powershellLogger.log('SUCCESS', 'USER_CONTRIBUTION', `✅ Product data submitted successfully`, {
            barcode,
          });
        } else {
          result.errors.push('Product data submission failed');
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        result.errors.push(`Product data error: ${errorMsg}`);
        logger.error('[UnifiedContribution] Error submitting product data:', error);
      }
    }
    
    // Step 3: Submit manufacturing country (if provided)
    if (pending.manufacturingCountry) {
      try {
        powershellLogger.log('INFO', 'USER_CONTRIBUTION', `Submitting manufacturing country`, {
          barcode,
          country: pending.manufacturingCountry.country,
          hasPhoto: !!pending.manufacturingCountry.photoUrl,
        });
        
        const countryResult = await submitManufacturingCountry(
          barcode,
          pending.manufacturingCountry.country,
          pending.manufacturingCountry.photoUrl,
          pending.manufacturingCountry.hasImportedIngredients
        );
        
        result.submitted.country = countryResult.success;
        
        if (countryResult.success) {
          powershellLogger.log('SUCCESS', 'USER_CONTRIBUTION', `✅ Manufacturing country submitted successfully`, {
            barcode,
            country: pending.manufacturingCountry.country,
          });
        } else {
          result.errors.push(`Country submission failed: ${countryResult.message}`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        result.errors.push(`Country submission error: ${errorMsg}`);
        logger.error('[UnifiedContribution] Error submitting country:', error);
      }
    }
    
    // Clear pending contributions after successful submission
    if (result.submitted.photos || result.submitted.productData || result.submitted.country) {
      try {
        const key = `${PENDING_CONTRIBUTIONS_KEY}${barcode}`;
        await AsyncStorage.removeItem(key);
        
        powershellLogger.log('SUCCESS', 'USER_CONTRIBUTION', `✅ All contributions submitted and cleared`, {
          barcode,
          submitted: result.submitted,
        });
        
        logger.debug(`[UnifiedContribution] ✅ All contributions submitted for barcode: ${barcode}`);
      } catch (error) {
        logger.warn('[UnifiedContribution] Error clearing pending contributions (non-critical):', error);
      }
    }
    
    result.success = result.submitted.photos || result.submitted.productData || result.submitted.country;
    
    return result;
  } catch (error) {
    logger.error('[UnifiedContribution] Error in submitAllContributions:', error);
    result.errors.push(`Submission error: ${error instanceof Error ? error.message : String(error)}`);
    return result;
  }
}

/**
 * Clear pending contributions (e.g., if user cancels)
 */
export async function clearPendingContributions(barcode: string): Promise<void> {
  try {
    const key = `${PENDING_CONTRIBUTIONS_KEY}${barcode}`;
    await AsyncStorage.removeItem(key);
    logger.info(`[UnifiedContribution] Cleared pending contributions: ${barcode}`);
  } catch (error) {
    logger.error('[UnifiedContribution] Error clearing pending contributions:', error);
  }
}

