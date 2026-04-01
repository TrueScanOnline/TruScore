// Photo Upload Service
// Hero (front) and country_label images are proprietary: Vercel only (not OFF).
// Ingredients / nutrition / packaging may upload to Open Food Facts + Vercel.

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

/** When true, skip Open Food Facts (Vercel only). When false, attempt OFF when applicable. When omitted, front/country_label default to proprietary-only. */
export interface UploadProductPhotoOptions {
  proprietaryOnly?: boolean;
}

function shouldSkipOpenFoodFacts(
  imageType: 'front' | 'ingredients' | 'nutrition' | 'packaging' | 'country_label',
  options?: UploadProductPhotoOptions
): boolean {
  if (options?.proprietaryOnly === true) return true;
  if (options?.proprietaryOnly === false) return false;
  return imageType === 'front' || imageType === 'country_label';
}

/**
 * Upload product image: Vercel always for storage; Open Food Facts for non-proprietary types unless disabled.
 * @param imageType - front and country_label are proprietary (Vercel-only) by default.
 */
export async function uploadProductPhoto(
  barcode: string,
  imagePath: string,
  imageType: 'front' | 'ingredients' | 'nutrition' | 'packaging' | 'country_label' = 'front',
  uploadOptions?: UploadProductPhotoOptions
): Promise<PhotoUploadResult> {
  const proprietaryOnly = shouldSkipOpenFoodFacts(imageType, uploadOptions);
  const targetServers = proprietaryOnly ? ['Vercel Backend (proprietary)'] : ['Open Food Facts', 'Vercel Backend'];

  powershellLogger.log('INFO', 'USER_CONTRIBUTION', `Starting photo upload`, {
    barcode,
    imagePath,
    imageType,
    proprietaryOnly,
    targetServers,
  });
  
  const results: PhotoUploadResult = {
    success: false,
    message: '',
  };

  // Already a hosted URL (e.g. after a prior upload) — avoid FileSystem read / double upload
  const trimmed = (imagePath || '').trim();
  if (/^https?:\/\//i.test(trimmed)) {
    powershellLogger.log('INFO', 'USER_CONTRIBUTION', `Skipping upload — image is already hosted`, {
      barcode,
      preview: trimmed.slice(0, 96),
    });
    return {
      success: true,
      vercelUrl: trimmed,
      message: 'Image already hosted',
    };
  }
  if (trimmed.startsWith('data:image/')) {
    return {
      success: true,
      vercelUrl: trimmed,
      message: 'Inline image data',
    };
  }
  
  try {
    if (!proprietaryOnly) {
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
    } else {
      powershellLogger.log('INFO', 'USER_CONTRIBUTION', `Skipping Open Food Facts (proprietary image)`, {
        barcode,
        imageType,
      });
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
        let errorBody = '';
        try {
          errorBody = await response.text();
        } catch {
          errorBody = '(could not read body)';
        }
        powershellLogger.log('ERROR', 'USER_CONTRIBUTION', `Vercel POST /api/upload-photo failed`, {
          barcode,
          status: response.status,
          statusText: response.statusText,
          endpoint: photoUploadApi,
          responseBodyPreview: errorBody.slice(0, 800),
        });

        logger.warn(`[PhotoUpload] Vercel upload failed: ${response.status} ${errorBody.slice(0, 200)}`);
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
        results.message = 'Photo uploaded to Open Food Facts and TrueScan storage!';
      } else if (results.openFoodFactsUrl) {
        results.message = 'Photo uploaded to Open Food Facts!';
      } else if (results.vercelUrl) {
        results.message = proprietaryOnly
          ? 'Photo saved (TrueScan storage).'
          : 'Photo uploaded to TrueScan storage!';
      }
      
      powershellLogger.log('SUCCESS', 'USER_CONTRIBUTION', `✅ Photo upload COMPLETE`, {
        barcode,
        success: true,
        openFoodFactsUrl: results.openFoodFactsUrl || 'NONE',
        vercelUrl: results.vercelUrl || 'NONE',
        finalUrl: results.vercelUrl || results.openFoodFactsUrl,
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
