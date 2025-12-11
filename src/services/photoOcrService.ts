// Photo OCR Service
// Extracts product information from photos using OCR (Optical Character Recognition)
// Enables photo-based product addition (like Yuka)

import { logger } from '../utils/logger';
import { ManualProductData } from './manualProductService';
import { Product } from '../types/product';

// Note: For production, use a proper OCR library like:
// - expo-text-recognition (if available)
// - Google Cloud Vision API
// - AWS Textract
// - Tesseract.js (client-side, free)

export interface OCRResult {
  productName?: string;
  ingredients?: string;
  nutrition?: {
    energy?: number;
    protein?: number;
    fat?: number;
    carbohydrates?: number;
    sugars?: number;
    salt?: number;
    fiber?: number;
    saturatedFat?: number;
  };
  brand?: string;
  barcode?: string;
  confidence: number; // 0-100
}

/**
 * Extract text from product photo using OCR
 * This is a placeholder - implement with actual OCR library
 * 
 * For now, returns empty result (users must manually enter data)
 * Future: Integrate with OCR service (Google Vision, AWS Textract, etc.)
 */
export async function extractTextFromImage(imageUri: string): Promise<OCRResult> {
  try {
    // TODO: Implement actual OCR
    // Options:
    // 1. Google Cloud Vision API (requires API key, paid)
    // 2. AWS Textract (requires API key, paid)
    // 3. Tesseract.js (client-side, free but less accurate)
    // 4. expo-text-recognition (if available for React Native)
    
    logger.info('[PhotoOCR] OCR extraction requested (not yet implemented)');
    logger.info('[PhotoOCR] Users can manually enter product data for now');
    
    // Placeholder: Return empty result
    // In production, this would:
    // 1. Preprocess image (resize, enhance contrast, etc.)
    // 2. Send to OCR service
    // 3. Parse extracted text for product name, ingredients, nutrition
    // 4. Return structured data
    
    return {
      confidence: 0,
    };
  } catch (error) {
    logger.error('[PhotoOCR] Error extracting text from image:', error);
    return {
      confidence: 0,
    };
  }
}

/**
 * Extract product data from photo (with OCR)
 * Attempts to auto-fill product information from photo
 */
export async function extractProductDataFromPhoto(
  imageUri: string,
  barcode: string
): Promise<Partial<ManualProductData>> {
  try {
    // Note: Image preprocessing removed (expo-image-manipulator not available)
    // In production, preprocess image for better OCR results:
    // - Resize to optimal size (2000px width)
    // - Enhance contrast
    // - Crop to product area
    
    // Extract text using OCR (uses original image URI)
    const ocrResult = await extractTextFromImage(imageUri);
    
    // Convert OCR result to ManualProductData format
    const productData: Partial<ManualProductData> = {
      barcode,
      image_url: imageUri,
      timestamp: Date.now(),
    };
    
    if (ocrResult.productName) {
      productData.product_name = ocrResult.productName;
    }
    
    if (ocrResult.ingredients) {
      productData.ingredients_text = ocrResult.ingredients;
    }
    
    if (ocrResult.brand) {
      productData.brands = ocrResult.brand;
    }
    
    if (ocrResult.nutrition) {
      const nutriments: Product['nutriments'] = {};
      const n = ocrResult.nutrition;
      
      if (n.energy) {
        nutriments['energy-kcal'] = n.energy;
        nutriments['energy-kj'] = n.energy * 4.184;
      }
      if (n.protein) nutriments.proteins_100g = n.protein;
      if (n.fat) nutriments.fat_100g = n.fat;
      if (n.carbohydrates) nutriments.carbohydrates_100g = n.carbohydrates;
      if (n.sugars) nutriments.sugars_100g = n.sugars;
      if (n.salt) nutriments.salt_100g = n.salt;
      if (n.fiber) nutriments.fiber_100g = n.fiber;
      if (n.saturatedFat) nutriments['saturated-fat_100g'] = n.saturatedFat;
      
      if (Object.keys(nutriments).length > 0) {
        productData.nutriments = nutriments;
      }
    }
    
    return productData;
  } catch (error) {
    logger.error('[PhotoOCR] Error extracting product data from photo:', error);
    return {
      barcode,
      image_url: imageUri,
      timestamp: Date.now(),
    };
  }
}

/**
 * Verify OCR-extracted product data
 * Checks for common errors and validates data
 */
export function verifyOCRData(ocrResult: OCRResult): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check confidence
  if (ocrResult.confidence < 50) {
    warnings.push('Low OCR confidence - please verify extracted data');
  }
  
  // Validate product name
  if (ocrResult.productName) {
    if (ocrResult.productName.length < 3) {
      errors.push('Product name too short');
    }
    if (ocrResult.productName.length > 200) {
      warnings.push('Product name unusually long - may contain errors');
    }
  }
  
  // Validate ingredients
  if (ocrResult.ingredients) {
    if (ocrResult.ingredients.length < 10) {
      warnings.push('Ingredients list seems incomplete');
    }
  }
  
  // Validate nutrition values
  if (ocrResult.nutrition) {
    const n = ocrResult.nutrition;
    if (n.energy && (n.energy < 0 || n.energy > 10000)) {
      warnings.push('Energy value seems incorrect');
    }
    if (n.protein && (n.protein < 0 || n.protein > 100)) {
      warnings.push('Protein value seems incorrect');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

