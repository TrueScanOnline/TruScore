// Photo Upload Service
// Handles uploading photos to both Open Food Facts and Vercel backend
// Ensures photos are available to all users worldwide

import { logger } from '../utils/logger';
import * as FileSystem from 'expo-file-system';
import { uploadPhotoToOpenFoodFacts } from './openFoodFactsSubmission';

// Vercel backend URL for photo uploads
import { getBackendUrl, BackendEndpoints } from '../config/backendConfig';
const PHOTO_UPLOAD_API = BackendEndpoints.uploadPhoto(getBackendUrl());

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
  const results: PhotoUploadResult = {
    success: false,
    message: '',
  };
  
  try {
    // Upload to Open Food Facts (if credentials available)
    try {
      const offUrl = await uploadPhotoToOpenFoodFacts(barcode, imagePath, imageType === 'country_label' ? 'other' : imageType);
      if (offUrl) {
        results.openFoodFactsUrl = offUrl;
        logger.info(`[PhotoUpload] Uploaded to Open Food Facts: ${offUrl}`);
      }
    } catch (offError) {
      logger.warn('[PhotoUpload] Open Food Facts upload failed (non-critical):', offError);
    }
    
    // Upload to Vercel backend (for CDN/storage)
    try {
      const imageBase64 = await FileSystem.readAsStringAsync(imagePath, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      const response = await fetch(PHOTO_UPLOAD_API, {
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
      
      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          results.vercelUrl = data.url;
          logger.info(`[PhotoUpload] Uploaded to Vercel: ${data.url}`);
        }
      } else {
        logger.warn(`[PhotoUpload] Vercel upload failed: ${response.status}`);
      }
    } catch (vercelError) {
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
    } else {
      results.message = 'Photo upload failed. Please try again.';
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
