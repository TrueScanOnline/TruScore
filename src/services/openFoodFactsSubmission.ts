// Open Food Facts Submission Service
// Handles submitting user-contributed data to Open Food Facts database
// This ensures all user data becomes available to the global community

import { logger } from '../utils/logger';
import { ManualProductData } from './manualProductService';
import * as FileSystem from 'expo-file-system';

const OFF_API_BASE = 'https://world.openfoodfacts.org';
const OFF_EDIT_API = `${OFF_API_BASE}/cgi/product_jqm2.pl`;
const OFF_IMAGE_UPLOAD_API = `${OFF_API_BASE}/cgi/product_image_upload.pl`;
const USER_AGENT = 'TrueScan-FoodScanner/1.0.0 (truescan@example.com)'; // TODO: Update with actual contact email

// Get Open Food Facts credentials from environment variables
// Users can optionally provide their OFF credentials to enable auto-submission
// To get credentials:
// 1. Create account at https://world.openfoodfacts.org
// 2. Use your username (not email) as user_id
// 3. Add to .env: EXPO_PUBLIC_OFF_USER_ID and EXPO_PUBLIC_OFF_PASSWORD
function getOFFCredentials(): { userId?: string; password?: string } {
  // Try to get from app.config.js extra (for Expo)
  const userId = process.env.EXPO_PUBLIC_OFF_USER_ID;
  const password = process.env.EXPO_PUBLIC_OFF_PASSWORD;
  
  // If no credentials, we'll use anonymous submission (limited functionality)
  // Anonymous mode may have rate limits and reduced functionality
  if (!userId || !password) {
    console.warn('[OFF Submission] ⚠️  Open Food Facts credentials not configured. Using anonymous mode (may have limitations).');
    console.warn('[OFF Submission] To enable full functionality, add EXPO_PUBLIC_OFF_USER_ID and EXPO_PUBLIC_OFF_PASSWORD to .env');
  }
  
  return {
    userId: userId || undefined,
    password: password || undefined,
  };
}

/**
 * Upload a photo to Open Food Facts
 * @param barcode - Product barcode
 * @param imagePath - Local file path to image
 * @param imageField - Type of image (front, ingredients, nutrition, packaging, etc.)
 * @returns Public URL of uploaded image, or null if upload failed
 */
export async function uploadPhotoToOpenFoodFacts(
  barcode: string,
  imagePath: string,
  imageField: 'front' | 'ingredients' | 'nutrition' | 'packaging' | 'other' = 'front'
): Promise<string | null> {
  try {
    const credentials = getOFFCredentials();
    
    // Map imageField to OFF field names
    const offFieldMap: Record<string, string> = {
      front: 'front',
      ingredients: 'ingredients',
      nutrition: 'nutrition',
      packaging: 'packaging',
      other: 'other',
    };
    const offField = offFieldMap[imageField] || 'front';
    
    // For React Native FormData, we need to append the file with proper format
    // React Native FormData expects: { uri, type, name } for file uploads
    const formData = new FormData();
    formData.append('code', barcode);
    formData.append('imagefield', offField);
    
    // Add credentials if available
    if (credentials.userId && credentials.password) {
      formData.append('user_id', credentials.userId);
      formData.append('password', credentials.password);
    }
    
    // Append image file - React Native FormData format
    // The imagePath should be a local file URI (file://)
    formData.append(`imgupload_${offField}`, {
      uri: imagePath,
      type: 'image/jpeg',
      name: `${barcode}_${offField}.jpg`,
    } as any);
    
    // Open Food Facts expects multipart/form-data
    const response = await fetch(OFF_IMAGE_UPLOAD_API, {
      method: 'POST',
      headers: {
        'User-Agent': USER_AGENT,
        // Don't set Content-Type - let fetch set it with boundary for FormData
      },
      body: formData,
    });
    
    if (!response.ok) {
      logger.warn(`[OFF Submission] Photo upload failed: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const responseText = await response.text();
    
    // Parse response to get image URL
    // OFF returns HTML or JSON depending on success
    if (responseText.includes('status="ok"') || responseText.includes('"status":1')) {
      // Construct public image URL
      const imageUrl = `https://images.openfoodfacts.org/images/products/${barcode.substring(0, 3)}/${barcode.substring(3, 6)}/${barcode.substring(6, 9)}/${barcode}/${offField}.jpg`;
      logger.info(`[OFF Submission] Photo uploaded successfully: ${imageUrl}`);
      return imageUrl;
    }
    
    logger.warn(`[OFF Submission] Photo upload response indicates failure: ${responseText.substring(0, 200)}`);
    return null;
  } catch (error) {
    logger.error('[OFF Submission] Error uploading photo:', error);
    return null;
  }
}

/**
 * Submit a manual product to Open Food Facts
 * @param data - Manual product data from user
 * @returns Success status and message
 */
export async function submitProductToOpenFoodFacts(
  data: ManualProductData
): Promise<{ success: boolean; message: string; productUrl?: string }> {
  try {
    const credentials = getOFFCredentials();
    
    // Build product data in OFF format
    const productData: Record<string, string> = {
      code: data.barcode,
      'product_name': data.product_name || '',
    };
    
    // Add optional fields
    if (data.brands) productData['brands'] = data.brands;
    if (data.ingredients_text) productData['ingredients_text'] = data.ingredients_text;
    if (data.manufacturing_places) productData['manufacturing_places'] = data.manufacturing_places;
    if (data.countries) productData['countries'] = data.countries;
    if (data.categories) productData['categories'] = data.categories;
    if (data.serving_size) productData['serving_size'] = data.serving_size;
    if (data.quantity) productData['quantity'] = data.quantity;
    
    // Add nutrition data
    if (data.nutriments) {
      Object.entries(data.nutriments).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          productData[`nutriments_${key}`] = String(value);
        }
      });
    }
    
    // Add allergens and additives
    if (data.allergens_tags && data.allergens_tags.length > 0) {
      productData['allergens'] = data.allergens_tags.join(',');
    }
    if (data.additives_tags && data.additives_tags.length > 0) {
      productData['additives'] = data.additives_tags.join(',');
    }
    
    // Add credentials if available
    if (credentials.userId && credentials.password) {
      productData['user_id'] = credentials.userId;
      productData['password'] = credentials.password;
    }
    
    // Submit via POST
    const formData = new FormData();
    Object.entries(productData).forEach(([key, value]) => {
      formData.append(key, value);
    });
    
    const response = await fetch(OFF_EDIT_API, {
      method: 'POST',
      headers: {
        'User-Agent': USER_AGENT,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      logger.warn(`[OFF Submission] Product submission failed: ${response.status} ${response.statusText}`);
      logger.debug(`[OFF Submission] Error response: ${errorText.substring(0, 500)}`);
      
      return {
        success: false,
        message: `Failed to submit to Open Food Facts: ${response.statusText}`,
      };
    }
    
    const responseText = await response.text();
    
    // Check if submission was successful
    // OFF returns different formats, check for success indicators
    const isSuccess = responseText.includes('status="ok"') || 
                     responseText.includes('"status":1') ||
                     responseText.includes('Product saved') ||
                     response.status === 200;
    
    if (isSuccess) {
      const productUrl = `https://world.openfoodfacts.org/product/${data.barcode}`;
      logger.info(`[OFF Submission] Product submitted successfully: ${productUrl}`);
      
      // Upload photo if available
      if (data.image_url) {
        try {
          const photoUrl = await uploadPhotoToOpenFoodFacts(data.barcode, data.image_url, 'front');
          if (photoUrl) {
            logger.info(`[OFF Submission] Product photo uploaded: ${photoUrl}`);
          }
        } catch (photoError) {
          logger.warn('[OFF Submission] Photo upload failed (non-critical):', photoError);
        }
      }
      
      return {
        success: true,
        message: 'Product submitted to Open Food Facts successfully!',
        productUrl,
      };
    }
    
    return {
      success: false,
      message: 'Submission may have failed. Please check Open Food Facts website.',
    };
  } catch (error) {
    logger.error('[OFF Submission] Error submitting product:', error);
    return {
      success: false,
      message: `Error submitting to Open Food Facts: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Submit manufacturing country to Open Food Facts
 * Updates the origins_tags field for a product
 */
export async function submitManufacturingCountryToOpenFoodFacts(
  barcode: string,
  country: string
): Promise<{ success: boolean; message: string }> {
  try {
    const credentials = getOFFCredentials();
    
    // Build update data
    const updateData: Record<string, string> = {
      code: barcode,
      'origins': country, // OFF uses 'origins' field
    };
    
    // Add credentials if available
    if (credentials.userId && credentials.password) {
      updateData['user_id'] = credentials.userId;
      updateData['password'] = credentials.password;
    }
    
    // Submit via POST
    const formData = new FormData();
    Object.entries(updateData).forEach(([key, value]) => {
      formData.append(key, value);
    });
    
    const response = await fetch(OFF_EDIT_API, {
      method: 'POST',
      headers: {
        'User-Agent': USER_AGENT,
      },
      body: formData,
    });
    
    if (!response.ok) {
      logger.warn(`[OFF Submission] Country submission failed: ${response.status}`);
      return {
        success: false,
        message: `Failed to submit country to Open Food Facts: ${response.statusText}`,
      };
    }
    
    const responseText = await response.text();
    const isSuccess = responseText.includes('status="ok"') || 
                     responseText.includes('"status":1') ||
                     response.status === 200;
    
    if (isSuccess) {
      logger.info(`[OFF Submission] Manufacturing country submitted: ${country} for ${barcode}`);
      return {
        success: true,
        message: 'Country information submitted to Open Food Facts!',
      };
    }
    
    return {
      success: false,
      message: 'Country submission may have failed.',
    };
  } catch (error) {
    logger.error('[OFF Submission] Error submitting country:', error);
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Check if Open Food Facts credentials are configured
 */
export function hasOFFCredentials(): boolean {
  const credentials = getOFFCredentials();
  return !!(credentials.userId && credentials.password);
}
