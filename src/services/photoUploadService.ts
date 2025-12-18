// Photo Upload Service
// Handles uploading photos to both Open Food Facts and Vercel backend
// Ensures photos are available to all users worldwide

import { logger } from '../utils/logger';
import * as FileSystem from 'expo-file-system';
import { uploadPhotoToOpenFoodFacts } from './openFoodFactsSubmission';
import { powershellLogger } from '../utils/powershellLogger';

// Vercel backend URL for photo uploads
import { getBackendUrl, BackendEndpoints } from '../config/backendConfig';
// Don't call getBackendUrl() at module load time - call it when needed
function getPhotoUploadApi(): string {
  return BackendEndpoints.uploadPhoto(getBackendUrl());
}

export interface PhotoUploadResult {
  success: boolean;
  openFoodFactsUrl?: string;
  vercelUrl?: string;
  message: string;
}

/**
 * Upload photo to both Open Food Facts and Vercel backend
 * @param barcode - Product barcode
 * @param imagePath - Local file path to image
 * @param imageType - Type of image (front, ingredients, nutrition, packaging, country_label)
 * @returns Upload result with URLs
 */
export async function uploadProductPhoto(
  barcode: string,
  imagePath: string,
  imageType: 'front' | 'ingredients' | 'nutrition' | 'packaging' | 'country_label' = 'front'
): Promise<PhotoUploadResult> {
  powershellLogger.log('INFO', 'USER_CONTRIBUTION', `Starting photo upload`, {
    barcode,
    imagePath,
    imageType,
    targetServers: ['Open Food Facts', 'Vercel Backend'],
  });
  
  const results: PhotoUploadResult = {
    success: false,
    message: '',
  };
  
  try {
    // Upload to Open Food Facts (if credentials available)
    try {
      powershellLogger.log('INFO', 'USER_CONTRIBUTION', `Uploading to Open Food Facts`, {
        barcode,
        imageType,
      });
      
      const offUrl = await uploadPhotoToOpenFoodFacts(barcode, imagePath, imageType === 'country_label' ? 'other' : imageType);
      if (offUrl) {
        results.openFoodFactsUrl = offUrl;
        
        powershellLogger.log('SUCCESS', 'USER_CONTRIBUTION', `✅ Photo uploaded to Open Food Facts`, {
          barcode,
          url: offUrl,
        });
        
        logger.info(`[PhotoUpload] Uploaded to Open Food Facts: ${offUrl}`);
      } else {
        powershellLogger.log('WARN', 'USER_CONTRIBUTION', `Open Food Facts upload returned no URL`, {
          barcode,
        });
      }
    } catch (offError) {
      powershellLogger.log('ERROR', 'USER_CONTRIBUTION', `Open Food Facts upload failed`, {
        barcode,
        error: offError instanceof Error ? offError.message : String(offError),
      });
      
      logger.warn('[PhotoUpload] Open Food Facts upload failed (non-critical):', offError);
    }
    
    // Upload to Vercel backend (for CDN/storage)
    try {
      const photoUploadApi = getPhotoUploadApi();
      powershellLogger.log('INFO', 'USER_CONTRIBUTION', `Uploading to Vercel backend`, {
        barcode,
        endpoint: photoUploadApi,
        imageType,
      });
      
      const imageBase64 = await FileSystem.readAsStringAsync(imagePath, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      const uploadStartTime = Date.now();
      const response = await fetch(photoUploadApi, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          barcode,
          imageType,
          imageBase64,
          mimeType: 'image/jpeg', // Assuming JPEG, could be detected
        }),
      });
      
      const uploadTime = Date.now() - uploadStartTime;
      
      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          results.vercelUrl = data.url;
          
          powershellLogger.log('SUCCESS', 'USER_CONTRIBUTION', `✅ Photo uploaded to Vercel backend`, {
            barcode,
            url: data.url,
            uploadTime: `${uploadTime}ms`,
          });
          
          logger.info(`[PhotoUpload] Uploaded to Vercel: ${data.url}`);
        } else {
          powershellLogger.log('WARN', 'USER_CONTRIBUTION', `Vercel upload succeeded but no URL returned`, {
            barcode,
            response: data,
          });
        }
      } else {
        powershellLogger.log('ERROR', 'USER_CONTRIBUTION', `Vercel upload failed`, {
          barcode,
          status: response.status,
          statusText: response.statusText,
        });
        
        logger.warn(`[PhotoUpload] Vercel upload failed: ${response.status}`);
      }
    } catch (vercelError) {
      powershellLogger.log('ERROR', 'USER_CONTRIBUTION', `Vercel upload error`, {
        barcode,
        error: vercelError instanceof Error ? vercelError.message : String(vercelError),
      });
      
      logger.warn('[PhotoUpload] Vercel upload failed (non-critical):', vercelError);
    }
    
    // Determine success status
    if (results.openFoodFactsUrl || results.vercelUrl) {
      results.success = true;
      results.message = 'Photo uploaded successfully!';
      if (results.openFoodFactsUrl && results.vercelUrl) {
        results.message = 'Photo uploaded to Open Food Facts and community database!';
      } else if (results.openFoodFactsUrl) {
        results.message = 'Photo uploaded to Open Food Facts!';
      } else if (results.vercelUrl) {
        results.message = 'Photo uploaded to community database!';
      }
      
      powershellLogger.log('SUCCESS', 'USER_CONTRIBUTION', `✅ Photo upload COMPLETE`, {
        barcode,
        success: true,
        openFoodFactsUrl: results.openFoodFactsUrl || 'NONE',
        vercelUrl: results.vercelUrl || 'NONE',
        finalUrl: results.openFoodFactsUrl || results.vercelUrl,
      });
    } else {
      results.message = 'Photo upload failed. Please try again.';
      
      powershellLogger.log('ERROR', 'USER_CONTRIBUTION', `❌ Photo upload FAILED`, {
        barcode,
        success: false,
        message: results.message,
      });
    }
    
    return results;
  } catch (error) {
    logger.error('[PhotoUpload] Error uploading photo:', error);
    return {
      success: false,
      message: `Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Upload multiple photos for a product
 */
export async function uploadProductPhotos(
  barcode: string,
  photos: Array<{ path: string; type: 'front' | 'ingredients' | 'nutrition' | 'packaging' | 'country_label' }>
): Promise<PhotoUploadResult[]> {
  const results: PhotoUploadResult[] = [];
  
  for (const photo of photos) {
    const result = await uploadProductPhoto(barcode, photo.path, photo.type);
    results.push(result);
  }
  
  return results;
}
