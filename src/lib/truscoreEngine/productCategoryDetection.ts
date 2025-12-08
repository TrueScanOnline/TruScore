/**
 * Product Category Detection
 * Used to adjust scoring logic for non-food products
 */

import { Product } from '../../types/product';

export type ProductCategory = 'food' | 'cosmetics' | 'pet_food' | 'household' | 'unknown';

/**
 * Detect product category from source and categories
 * Used to adjust scoring logic for non-food products
 */
export function detectProductCategory(product: Product): ProductCategory {
  const source = product.source?.toLowerCase() || '';
  const categoriesTags = (product.categories_tags || []).map((c: unknown) => String(c).toLowerCase());
  const categories = (product.categories || '').toLowerCase();
  
  // Check source first (most reliable)
  if (source.includes('beauty') || source.includes('openbeautyfacts')) {
    return 'cosmetics';
  }
  if (source.includes('pet') || source.includes('openpetfoodfacts')) {
    return 'pet_food';
  }
  if (source.includes('openproductsfacts') || source.includes('productsfacts')) {
    // Could be household, electronics, etc. - check categories
    if (categoriesTags.some((c: string) => c.includes('household') || c.includes('cleaning') || c.includes('detergent'))) {
      return 'household';
    }
    return 'unknown'; // General products
  }
  
  // Check categories_tags for cosmetics indicators
  const cosmeticsKeywords = ['cosmetics', 'beauty', 'personal care', 'skincare', 'makeup', 'shampoo', 'soap'];
  if (categoriesTags.some((c: string) => cosmeticsKeywords.some(kw => c.includes(kw))) ||
      categories.includes('cosmetics') || categories.includes('beauty')) {
    return 'cosmetics';
  }
  
  // Check categories_tags for pet food indicators
  const petFoodKeywords = ['pet food', 'petfood', 'dog food', 'cat food', 'pet'];
  if (categoriesTags.some((c: string) => petFoodKeywords.some(kw => c.includes(kw))) ||
      categories.includes('pet')) {
    return 'pet_food';
  }
  
  // Check categories_tags for household indicators
  const householdKeywords = ['household', 'cleaning', 'detergent', 'laundry'];
  if (categoriesTags.some((c: string) => householdKeywords.some(kw => c.includes(kw))) ||
      categories.includes('household') || categories.includes('cleaning')) {
    return 'household';
  }
  
  // Default to food if from Open Food Facts or unknown
  return source.includes('openfoodfacts') || source.includes('foodfacts') || !source ? 'food' : 'unknown';
}

