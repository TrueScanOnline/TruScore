/**
 * Enhanced Brand Extraction Utility
 * 
 * This module provides comprehensive brand extraction and matching functionality
 * to improve CARE pillar brand matching rates.
 * 
 * Key improvements:
 * - Splits comma-separated brands
 * - Checks multiple brand fields
 * - Extracts from product names even when brands field exists
 * - Handles brand variants and aliases
 */

import { Product } from '../types/product';
import { extractBrandFromProductName, normalizeBrandNameForLookup } from '../data/brandDatabase';
import { logger } from './logger';

/**
 * Extract all possible brand names from a product
 * Checks multiple fields and handles various formats
 */
export function extractAllBrands(product: Product): string[] {
  const brands: Set<string> = new Set();
  
  // 1. Primary brands field (split comma-separated values)
  if (product.brands && typeof product.brands === 'string') {
    const primaryBrands = product.brands
      .split(',')
      .map(b => b.trim())
      .filter(b => b && b.length > 0 && b !== 'Unknown');
    primaryBrands.forEach(b => brands.add(b));
  }
  
  // 2. Brand owner field
  if (product.brand_owner && typeof product.brand_owner === 'string') {
    const brandOwner = product.brand_owner.trim();
    if (brandOwner && brandOwner.length > 0) {
      brands.add(brandOwner);
    }
  }
  
  // 3. Brands tags (if array) - check if property exists (OFF-specific field)
  const brandsTags = (product as any).brands_tags;
  if (Array.isArray(brandsTags) && brandsTags.length > 0) {
    brandsTags.forEach((tag: string) => {
      if (typeof tag === 'string') {
        // Remove 'en:' prefix if present
        const brand = tag.replace(/^en:/, '').trim();
        if (brand && brand.length > 0) {
          brands.add(brand);
        }
      }
    });
  }
  
  // 4. Brand owner tags (if array) - check if property exists (OFF-specific field)
  const brandOwnerTags = (product as any).brand_owner_tags;
  if (Array.isArray(brandOwnerTags) && brandOwnerTags.length > 0) {
    brandOwnerTags.forEach((tag: string) => {
      if (typeof tag === 'string') {
        const brand = tag.replace(/^en:/, '').trim();
        if (brand && brand.length > 0) {
          brands.add(brand);
        }
      }
    });
  }
  
  // 5. Extract from product name (as fallback/additional check)
  // ENHANCED: More aggressive extraction with multiple patterns
  // This helps when brand fields are missing or incomplete
  const productName = product.product_name || product.product_name_en || '';
  
  if (productName) {
    // Try standard extraction
    const extractedBrand = extractBrandFromProductName(productName, product.brand_owner);
    if (extractedBrand) {
      brands.add(extractedBrand);
    }
    
    // ENHANCED: Try additional extraction patterns if standard extraction failed
    // or if we want to check for multiple brands in the name
    if (!extractedBrand || brands.size === 0) {
      // Pattern 1: "Brand Name - Product" or "Brand Name: Product"
      const pattern1 = /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+[-:]/i;
      const match1 = productName.match(pattern1);
      if (match1 && match1[1]) {
        const candidate = match1[1].trim();
        if (candidate.length >= 2 && candidate.length <= 30) {
          brands.add(candidate);
        }
      }
      
      // Pattern 2: "Product by Brand Name"
      const pattern2 = /\bby\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/i;
      const match2 = productName.match(pattern2);
      if (match2 && match2[1]) {
        const candidate = match2[1].trim();
        if (candidate.length >= 2 && candidate.length <= 30) {
          brands.add(candidate);
        }
      }
      
      // Pattern 3: First 1-2 capitalized words (if they look like a brand)
      const words = productName.split(/\s+/);
      if (words.length >= 2 && /^[A-Z]/.test(words[0])) {
        // Check first 1-2 words
        for (let i = 1; i <= Math.min(2, words.length); i++) {
          const candidate = words.slice(0, i).join(' ');
          // Exclude common product words
          const excludeWords = ['organic', 'natural', 'fresh', 'pure', 'healthy', 'whole', 'free', 'premium', 'product'];
          const firstWord = words[0].toLowerCase();
          if (!excludeWords.includes(firstWord) && candidate.length >= 2 && candidate.length <= 30) {
            brands.add(candidate);
          }
        }
      }
    }
  }
  
  // 6. Try extracting from generic_name if available
  if (product.generic_name && typeof product.generic_name === 'string') {
    const extractedFromGeneric = extractBrandFromProductName(product.generic_name, product.brand_owner);
    if (extractedFromGeneric) {
      brands.add(extractedFromGeneric);
    }
  }
  
  // Convert Set to Array and filter out obviously invalid brands
  const brandArray = Array.from(brands).filter(brand => {
    // Filter out generic terms that aren't brands
    const genericTerms = [
      'unknown', 'n/a', 'not available', 'missing', 'not disclosed',
      'product', 'food', 'item', 'goods', 'merchandise'
    ];
    const brandLower = brand.toLowerCase();
    return !genericTerms.some(term => brandLower.includes(term)) && brand.length >= 2;
  });
  
  // Track if any brand was extracted from product name
  const extractedFromName = brandArray.some(b => {
    // Check if this brand came from extraction (not from existing fields)
    const wasInFields = (product.brands && product.brands.includes(b)) ||
                       (product.brand_owner === b) ||
                       (Array.isArray((product as any).brands_tags) && 
                        (product as any).brands_tags.some((tag: string) => tag.includes(b)));
    return !wasInFields;
  });
  
  logger.debug('[BrandExtraction] Extracted brands:', {
    barcode: product.barcode,
    productName: productName.substring(0, 50),
    brandsFound: brandArray.length,
    brands: brandArray,
    sources: {
      brandsField: product.brands || null,
      brandOwner: product.brand_owner || null,
      brandsTags: Array.isArray((product as any).brands_tags) ? (product as any).brands_tags.length : 0,
      extractedFromName: extractedFromName,
    },
  });
  
  return brandArray;
}

/**
 * Get the primary brand name for matching
 * Returns the first brand that matches the database, or the first brand if none match
 */
export function getPrimaryBrand(product: Product): string | null {
  const allBrands = extractAllBrands(product);
  if (allBrands.length === 0) {
    return null;
  }
  
  // Try to find a brand that matches the database
  // We'll check this in the calling code, so just return the first one for now
  return allBrands[0];
}

/**
 * Normalize brand name for matching
 * Wrapper around brandDatabase normalization for consistency
 */
export function normalizeBrand(brand: string): string {
  return normalizeBrandNameForLookup(brand);
}
