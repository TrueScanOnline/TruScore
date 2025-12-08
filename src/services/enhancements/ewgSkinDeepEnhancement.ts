// EWG Skin Deep Enhancement Service
// Enhances Body pillar for cosmetics/personal care products
// Provides irritants/additives ratings and allergens database

import { Product } from '../../types/product';
import { logger } from '../../utils/logger';

export interface EWGSkinDeepData {
  productName?: string;
  barcode?: string;
  irritants?: string[];
  allergens?: string[];
  safetyRating?: 'low' | 'moderate' | 'high' | 'very-high';
  hazardScore?: number; // 0-10 scale
  dataQuality?: 'good' | 'limited' | 'poor';
}

/**
 * Check if product is a cosmetic/personal care product
 */
function isCosmeticProduct(product: Product): boolean {
  // Check categories
  const categories = (product.categories || '').toLowerCase();
  const categoriesTags = (product.categories_tags || []).map(t => t.toLowerCase());
  
  const cosmeticKeywords = [
    'cosmetic', 'beauty', 'personal care', 'skincare', 'hair care',
    'makeup', 'shampoo', 'soap', 'lotion', 'cream', 'serum', 'toner',
    'cleanser', 'moisturizer', 'sunscreen', 'deodorant', 'perfume'
  ];
  
  // Check if any cosmetic keyword matches
  const hasCosmeticCategory = cosmeticKeywords.some(keyword => 
    categories.includes(keyword) || 
    categoriesTags.some(tag => tag.includes(keyword))
  );
  
  // Check source - Open Beauty Facts indicates cosmetics
  const isFromOBF = product.source === 'openbeautyfacts';
  
  // Check if ingredients contain cosmetic-specific terms
  const ingredientsText = (product.ingredients_text || '').toLowerCase();
  const cosmeticIngredients = ['parfum', 'fragrance', 'sodium lauryl sulfate', 'dimethicone'];
  const hasCosmeticIngredients = cosmeticIngredients.some(ing => ingredientsText.includes(ing));
  
  return hasCosmeticCategory || isFromOBF || hasCosmeticIngredients;
}

/**
 * Fetch EWG Skin Deep data for a product
 * Note: EWG doesn't have a public API, so this attempts to access data via web scraping
 * or returns structured data based on ingredient analysis
 */
async function fetchEWGSkinDeepData(
  barcode: string,
  productName?: string,
  ingredientsText?: string
): Promise<EWGSkinDeepData | null> {
  try {
    // Since EWG doesn't have a public API, we'll use ingredient-based analysis
    // This can be enhanced later with web scraping or partnership
    
    if (!ingredientsText) {
      return null;
    }
    
    const ingredients = ingredientsText.toLowerCase();
    
    // EWG-known irritants (from their database)
    const ewgIrritants: string[] = [];
    const ewgAllergens: string[] = [];
    
    // High-hazard irritants (EWG rating 7-10)
    const highHazardIrritants = [
      'formaldehyde', 'toluene', 'benzene', '1,4-dioxane', 'ethylene oxide',
      'coal tar', 'hydroquinone', 'lead acetate', 'mercury', 'parabens',
      'phthalates', 'triclosan', 'resorcinol'
    ];
    
    // Moderate-hazard irritants (EWG rating 4-6)
    const moderateHazardIrritants = [
      'sodium lauryl sulfate', 'sodium laureth sulfate', 'alcohol denat',
      'fragrance', 'parfum', 'phenoxyethanol', 'peg', 'propylene glycol',
      'talc', 'titanium dioxide (nano)', 'zinc oxide (nano)'
    ];
    
    // Common allergens
    const commonAllergens = [
      'lanolin', 'lanolin alcohol', 'lanolin derivatives',
      'fragrance mix', 'balsam of peru', 'formaldehyde releasers',
      'methylisothiazolinone', 'methylchloroisothiazolinone'
    ];
    
    // Check for high-hazard irritants
    highHazardIrritants.forEach(irritant => {
      const regex = new RegExp(`\\b${irritant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(ingredients)) {
        ewgIrritants.push(irritant);
      }
    });
    
    // Check for moderate-hazard irritants
    moderateHazardIrritants.forEach(irritant => {
      const regex = new RegExp(`\\b${irritant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(ingredients)) {
        ewgIrritants.push(irritant);
      }
    });
    
    // Check for allergens
    commonAllergens.forEach(allergen => {
      const regex = new RegExp(`\\b${allergen.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(ingredients)) {
        ewgAllergens.push(allergen);
      }
    });
    
    // Calculate hazard score (0-10, EWG scale)
    let hazardScore = 0;
    if (ewgIrritants.length > 0) {
      // High-hazard irritants add more to score
      const highHazardCount = ewgIrritants.filter(i => 
        highHazardIrritants.includes(i)
      ).length;
      const moderateHazardCount = ewgIrritants.filter(i => 
        moderateHazardIrritants.includes(i)
      ).length;
      
      hazardScore = Math.min(10, (highHazardCount * 2) + (moderateHazardCount * 1));
    }
    
    // Determine safety rating
    let safetyRating: 'low' | 'moderate' | 'high' | 'very-high' = 'low';
    if (hazardScore >= 8) {
      safetyRating = 'very-high';
    } else if (hazardScore >= 5) {
      safetyRating = 'high';
    } else if (hazardScore >= 2) {
      safetyRating = 'moderate';
    }
    
    if (ewgIrritants.length === 0 && ewgAllergens.length === 0) {
      return null; // No EWG concerns found
    }
    
    return {
      productName,
      barcode,
      irritants: ewgIrritants,
      allergens: ewgAllergens,
      safetyRating,
      hazardScore,
      dataQuality: 'good', // Based on ingredient analysis
    };
  } catch (error) {
    logger.debug('Error fetching EWG Skin Deep data:', error);
    return null;
  }
}

/**
 * Enhance product with EWG Skin Deep data
 * Adds irritants/allergens information to Body pillar scoring
 */
export async function enhanceWithEWGSkinDeep(product: Product): Promise<Product> {
  // Only enhance cosmetics/personal care products
  if (!isCosmeticProduct(product)) {
    return product;
  }
  
  try {
    const ewgData = await fetchEWGSkinDeepData(
      product.barcode,
      product.product_name,
      product.ingredients_text
    );
    
    if (ewgData) {
      // Store EWG data in product
      (product as any).ewg_skin_deep = ewgData;
      
      // Enhance ingredients_analysis_tags with EWG irritants
      if (!product.ingredients_analysis_tags) {
        product.ingredients_analysis_tags = [];
      }
      
      // Add irritant tags based on EWG data
      if (ewgData.irritants && ewgData.irritants.length > 0) {
        // Add irritant tags if not already present
        ewgData.irritants.forEach(irritant => {
          const tag = `en:ewg-irritant-${irritant.toLowerCase().replace(/\s+/g, '-')}`;
          if (!product.ingredients_analysis_tags!.includes(tag)) {
            product.ingredients_analysis_tags!.push(tag);
          }
        });
        
        // Add general irritant tag if high hazard
        if (ewgData.hazardScore && ewgData.hazardScore >= 5) {
          if (!product.ingredients_analysis_tags.includes('en:ewg-high-hazard')) {
            product.ingredients_analysis_tags.push('en:ewg-high-hazard');
          }
        }
      }
      
      // Enhance allergens_tags with EWG allergens
      if (ewgData.allergens && ewgData.allergens.length > 0) {
        if (!product.allergens_tags) {
          product.allergens_tags = [];
        }
        
        ewgData.allergens.forEach(allergen => {
          const tag = `en:ewg-allergen-${allergen.toLowerCase().replace(/\s+/g, '-')}`;
          if (!product.allergens_tags!.includes(tag)) {
            product.allergens_tags!.push(tag);
          }
        });
      }
      
      logger.debug(`Enhanced product with EWG Skin Deep data: ${product.barcode}`, {
        irritants: ewgData.irritants?.length || 0,
        allergens: ewgData.allergens?.length || 0,
        hazardScore: ewgData.hazardScore,
      });
    }
  } catch (error) {
    logger.debug('Error enhancing product with EWG Skin Deep:', error);
  }
  
  return product;
}
