// User Contribution Verification Service
// Automatically verifies user-contributed products (like Yuka)
// Checks for errors, validates data, and flags suspicious entries

import { ManualProductData } from '../types/manualProduct';
import { Product } from '../types/product';
import { logger } from '../utils/logger';

export interface VerificationResult {
  isValid: boolean;
  confidence: 'high' | 'medium' | 'low';
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

/**
 * Verify user-contributed product data
 * Checks for common errors and validates data quality
 * Similar to Yuka's automatic verification system
 */
export async function verifyUserContributedProduct(
  productData: ManualProductData
): Promise<VerificationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];
  
  // 1. Validate barcode format
  if (!productData.barcode || !/^\d{8,14}$/.test(productData.barcode)) {
    errors.push('Invalid barcode format');
  }
  
  // 2. Validate product name
  if (!productData.product_name || productData.product_name.trim().length < 3) {
    errors.push('Product name is too short or missing');
  } else if (productData.product_name.length > 200) {
    warnings.push('Product name is unusually long - may contain errors');
  } else if (productData.product_name.toLowerCase().includes('product ') && 
             /^\d+$/.test(productData.product_name.replace('product ', ''))) {
    warnings.push('Product name appears to be a placeholder');
  }
  
  // 3. Validate ingredients
  if (productData.ingredients_text) {
    if (productData.ingredients_text.length < 10) {
      warnings.push('Ingredients list seems incomplete');
    }
    if (productData.ingredients_text.length > 5000) {
      warnings.push('Ingredients list is unusually long - may contain errors');
    }
    
    // Check for common placeholder text
    const placeholderPatterns = [
      /^ingredients?\s*:?\s*(not\s+available|n\/a|unknown|missing|to\s+be\s+completed)/i,
      /^product\s+\d+/i,
    ];
    for (const pattern of placeholderPatterns) {
      if (pattern.test(productData.ingredients_text)) {
        warnings.push('Ingredients appear to be placeholder text');
        break;
      }
    }
  } else {
    suggestions.push('Add ingredients list for better product information');
  }
  
  // 4. Validate nutrition data
  if (productData.nutriments) {
    const n = productData.nutriments;
    
    // Check for unrealistic values
    if (n['energy-kcal'] && (n['energy-kcal'] < 0 || n['energy-kcal'] > 10000)) {
      warnings.push('Energy value seems incorrect');
    }
    if (n.proteins_100g && (n.proteins_100g < 0 || n.proteins_100g > 100)) {
      warnings.push('Protein value seems incorrect');
    }
    if (n.fat_100g && (n.fat_100g < 0 || n.fat_100g > 100)) {
      warnings.push('Fat value seems incorrect');
    }
    if (n.carbohydrates_100g && (n.carbohydrates_100g < 0 || n.carbohydrates_100g > 100)) {
      warnings.push('Carbohydrates value seems incorrect');
    }
    
    // Check for missing critical nutrition data
    if (!n['energy-kcal'] && !n['energy-kj']) {
      suggestions.push('Add energy/calorie information');
    }
    if (!n.proteins_100g && !n.fat_100g && !n.carbohydrates_100g) {
      suggestions.push('Add macronutrient information (protein, fat, carbohydrates)');
    }
  } else {
    suggestions.push('Add nutrition information for better product analysis');
  }
  
  // 5. Validate image
  if (!productData.image_url) {
    suggestions.push('Add product photo for better identification');
  }
  
  // 6. Check for brand information
  if (!productData.brands) {
    suggestions.push('Add brand name if available');
  }
  
  // 7. Cross-reference with existing databases (if available)
  // This would check if product already exists in Open Food Facts, etc.
  // For now, just log a suggestion
  suggestions.push('This product will be shared with all users once verified');
  
  // Calculate confidence level
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (errors.length === 0) {
    if (warnings.length === 0 && 
        productData.product_name && 
        productData.ingredients_text && 
        productData.nutriments && 
        productData.image_url) {
      confidence = 'high';
    } else if (warnings.length <= 2 && 
               productData.product_name && 
               (productData.ingredients_text || productData.nutriments)) {
      confidence = 'medium';
    }
  }
  
  return {
    isValid: errors.length === 0,
    confidence,
    errors,
    warnings,
    suggestions,
  };
}

/**
 * Auto-verify product by checking against known databases
 * Similar to Yuka's automatic verification
 */
export async function autoVerifyProduct(
  productData: ManualProductData
): Promise<{
  isVerified: boolean;
  verificationSource?: string;
  confidence: number;
}> {
  // Check if product already exists in Open Food Facts
  try {
    const { fetchProductFromOFFOrNull } = await import('./openFoodFacts');
    const existingProduct = await fetchProductFromOFFOrNull(productData.barcode);
    
    if (existingProduct) {
      // Product exists in OFF - compare data
      const nameMatch = existingProduct.product_name?.toLowerCase() === productData.product_name?.toLowerCase();
      const brandMatch = existingProduct.brands?.toLowerCase() === productData.brands?.toLowerCase();
      
      if (nameMatch && brandMatch) {
        return {
          isVerified: true,
          verificationSource: 'openfoodfacts',
          confidence: 95,
        };
      } else if (nameMatch || brandMatch) {
        return {
          isVerified: true,
          verificationSource: 'openfoodfacts_partial',
          confidence: 70,
        };
      }
    }
  } catch (error) {
    logger.debug('Auto-verification check failed:', error);
  }
  
  // Check against other databases
  try {
    const { fetchProductFromUPCitemdb } = await import('./upcitemdb');
    const existingProduct = await fetchProductFromUPCitemdb(productData.barcode);
    
    if (existingProduct && existingProduct.product_name) {
      const nameMatch = existingProduct.product_name.toLowerCase() === productData.product_name?.toLowerCase();
      if (nameMatch) {
        return {
          isVerified: true,
          verificationSource: 'upcitemdb',
          confidence: 80,
        };
      }
    }
  } catch (error) {
    logger.debug('UPCitemdb verification check failed:', error);
  }
  
  // No automatic verification possible
  return {
    isVerified: false,
    confidence: 0,
  };
}

/**
 * Flag suspicious product entries for manual review
 * Similar to Yuka's verification system
 */
export function flagSuspiciousEntry(productData: ManualProductData): {
  isSuspicious: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  
  // Check for suspicious patterns
  if (productData.product_name && 
      (productData.product_name.toLowerCase().includes('test') ||
       productData.product_name.toLowerCase().includes('fake') ||
       productData.product_name.toLowerCase().includes('spam'))) {
    reasons.push('Product name contains suspicious keywords');
  }
  
  if (productData.ingredients_text && productData.ingredients_text.length < 5) {
    reasons.push('Ingredients list is suspiciously short');
  }
  
  if (productData.nutriments) {
    const n = productData.nutriments;
    // Check for impossible nutrition values
    if (n.proteins_100g && n.fat_100g && n.carbohydrates_100g) {
      const total = (n.proteins_100g || 0) + (n.fat_100g || 0) + (n.carbohydrates_100g || 0);
      if (total > 150) {
        reasons.push('Nutrition values seem incorrect (total macros > 150g/100g)');
      }
    }
  }
  
  return {
    isSuspicious: reasons.length > 0,
    reasons,
  };
}

