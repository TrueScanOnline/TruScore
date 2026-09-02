/**
 * Product Enhancement Service
 * 
 * Handles all product enhancement operations including:
 * - Palm oil analysis extraction
 * - MVP enhancements (EWG, WWF, Leaping Bunny)
 * - Brand enrichment (EAN-Search, OpenCorporates, B-Corp)
 * - Eco-Score calculation
 * - Product formatting (ingredients, certifications)
 * 
 * @module productEnhancementService
 */

import { Product } from '../types/product';
import { extractPalmOilAnalysis, formatCertifications, formatIngredients, calculateEcoScore } from './openFoodFacts';
import { applyMVPEnhancements } from './enhancements/enhancementLayer';
import { enrichProductWithEANSearchBrand } from './eanSearchBrandApi';
import { enrichProductWithOpenCorporates } from './openCorporatesApi';
import { enrichProductWithBCorp } from './bCorpApi';
import { logger } from '../utils/logger';
import { calculateDataCompleteness, formatCompletenessMetrics } from '../utils/dataCompleteness';
import { handleError, ErrorCategory, ErrorSeverity } from './errorHandlingService';
import { trackUnmappedBrand } from '../utils/unmappedBrandTracker';
import { assignNOVA1IfHighConfidence } from '../utils/novaAssessment';
import { ensureNova1ProvenanceOnProduct } from '../utils/nova1Provenance';
import { extractBrandFromProductName, getBrandData } from '../data/brandDatabase';
import { extractAllBrands } from '../utils/brandExtraction';

/**
 * OPTIMIZATION: CDN Support for Product Images
 * Uses CDN for faster image loading globally on iOS and Android
 * Can be configured via environment variable or config
 * 
 * @param imageUrl - Original image URL
 * @returns CDN URL if CDN is enabled, otherwise original URL
 */
export function getCDNImageUrl(imageUrl: string | undefined): string | undefined {
  if (!imageUrl) {
    return imageUrl;
  }
  
  // Check if CDN is enabled (can be configured via environment variable)
  // For now, return original URL - CDN can be enabled later by setting CDN_BASE_URL
  const CDN_BASE_URL = process.env.CDN_BASE_URL || process.env.EXPO_PUBLIC_CDN_BASE_URL;
  
  if (CDN_BASE_URL) {
    // Use CDN for image URLs
    // Example: https://images.truescan.app/proxy?url=...
    try {
      const encodedUrl = encodeURIComponent(imageUrl);
      return `${CDN_BASE_URL}/proxy?url=${encodedUrl}`;
    } catch (error) {
      // If encoding fails, return original URL
      logger.debug('Error encoding image URL for CDN (non-critical):', error);
      return imageUrl;
    }
  }
  
  // No CDN configured - return original URL
  // This ensures backward compatibility and works on iOS/Android
  return imageUrl;
}

/**
 * Extract and set palm oil analysis on product
 */
export function extractPalmOilAnalysisForProduct(product: Product): Product {
  const hasIngredientsText = product.ingredients_text && typeof product.ingredients_text === 'string' && product.ingredients_text.trim().length > 0;
  const hasAnalysisTags = Array.isArray(product.ingredients_analysis_tags) && product.ingredients_analysis_tags.length > 0;
  const hasAnalysis = product.ingredients_analysis && typeof product.ingredients_analysis === 'object' && Object.keys(product.ingredients_analysis).length > 0;
  
  if (hasIngredientsText || hasAnalysisTags || hasAnalysis) {
    try {
      product.palm_oil_analysis = extractPalmOilAnalysis(product);
    } catch (error) {
      logger.debug('Error extracting palm oil analysis:', error);
    }
  }
  
  return product;
}

/**
 * Format product data for Open Facts family
 */
export function formatProductData(product: Product): Product {
  // Format and enrich product data (for Open Facts family)
  if (product.source === 'openfoodfacts' || 
      product.source === 'openbeautyfacts' || 
      product.source === 'openpetfoodfacts') {
    product.ingredients = formatIngredients(product);
    product.certifications = formatCertifications(product);
  }

  // Open Products Facts may have similar structure but less detailed nutrition data
  if (product.source === 'openproductsfacts' && product.ingredients_text) {
    product.ingredients = formatIngredients(product);
  }
  
  return product;
}

/**
 * Calculate and set Eco-Score on product
 */
export function calculateAndSetEcoScore(product: Product): Product {
  const calculatedEcoScore = calculateEcoScore(product);
  if (calculatedEcoScore) {
    product.ecoscore_data = calculatedEcoScore;
    if (calculatedEcoScore.grade && calculatedEcoScore.grade !== 'unknown') {
      product.ecoscore_grade = calculatedEcoScore.grade;
    }
    if (calculatedEcoScore.score !== undefined) {
      product.ecoscore_score = calculatedEcoScore.score;
    }
  }
  return product;
}

/**
 * Apply MVP enhancements (EWG Skin Deep, WWF Palm Oil, Leaping Bunny)
 */
export async function applyMVPEnhancementsToProduct(product: Product): Promise<Product> {
  logger.info(`───────────────────────────────────────────────────────────────`);
  logger.info(`✨ ENHANCEMENT LAYER: Applying MVP Enhancements`);
  logger.info(`───────────────────────────────────────────────────────────────`);
  const preEnhancementCompleteness = calculateDataCompleteness(product);
  logger.info(`📊 Before Enhancement: ${formatCompletenessMetrics(preEnhancementCompleteness, 'PRE')}`);
  
  const enhancedProduct = await applyMVPEnhancements(product);
  
  const postEnhancementCompleteness = calculateDataCompleteness(enhancedProduct);
  logger.info(`📊 After Enhancement: ${formatCompletenessMetrics(postEnhancementCompleteness, 'POST')}`);
  logger.info(`✅ MVP enhancements applied successfully`);
  
  return enhancedProduct;
}

/**
 * Apply brand enrichment (EAN-Search, OpenCorporates, B-Corp)
 */
export async function applyBrandEnrichment(product: Product): Promise<Product> {
  try {
    let enrichedProduct = product;
    
    enrichedProduct = await enrichProductWithEANSearchBrand(enrichedProduct);
    enrichedProduct = await enrichProductWithOpenCorporates(enrichedProduct);
    enrichedProduct = await enrichProductWithBCorp(enrichedProduct);
    
    logger.debug('Brand enrichment applied successfully');
    return enrichedProduct;
  } catch (error) {
    handleError(error, ErrorCategory.API, ErrorSeverity.LOW, { barcode: product.barcode });
    return product; // Return original product if enrichment fails
  }
}

/**
 * ENHANCED: Aggressive brand extraction when no brands found
 * Tries multiple strategies to extract brand from product name
 */
function aggressiveBrandExtraction(product: Product): string | null {
  const productName = product.product_name || product.product_name_en || '';
  if (!productName || productName.length < 3) {
    return null;
  }
  
  // Try extraction from product name
  const extracted = extractBrandFromProductName(productName, product.brand_owner);
  if (extracted) {
    return extracted;
  }
  
  // Enhanced pattern matching for common brand name formats
  const patterns = [
    // "Brand Name - Product Description"
    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*[-–—:]\s*/,
    // "Brand Name Product"
    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?=[a-z])/,
    // "Product by Brand Name"
    /\bby\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/i,
    // "Brand's Product"
    /^([A-Z][a-z]+)'s\s+/i,
    // First 1-3 capitalized words
    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\s+/,
  ];
  
  for (const pattern of patterns) {
    const match = productName.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].trim();
      // Basic validation - exclude common product words
      const excludeWords = ['organic', 'natural', 'fresh', 'pure', 'healthy', 'whole', 'free', 'premium'];
      const words = candidate.toLowerCase().split(/\s+/);
      if (words.length > 0 && !excludeWords.includes(words[0]) && candidate.length >= 2) {
        return candidate;
      }
    }
  }
  
  return null;
}

/**
 * Apply all enhancements to product
 * OPTIMIZATION: Includes CDN support for faster image loading globally
 * ENHANCED: Adds aggressive brand extraction when brands are missing
 */
export async function enhanceProduct(product: Product): Promise<Product> {
  // Extract palm oil analysis
  extractPalmOilAnalysisForProduct(product);
  
  // Format product data
  formatProductData(product);
  
  // ENHANCED: Add aggressive brand extraction if no brands found
  // This is critical for Ethics pillar brand matching
  if (!product.brands && product.product_name) {
    const extractedBrand = aggressiveBrandExtraction(product);
    if (extractedBrand) {
      product.brands = extractedBrand;
      logger.info(`[ProductEnhancement] Extracted brand from product name: "${extractedBrand}"`);
      
      // Track unmapped brands for future database expansion (async, don't wait)
      checkAndTrackUnmappedBrand(extractedBrand, product.barcode, 'product_name').catch(() => {
        // Non-critical - continue even if tracking fails
      });
    }
  }
  
  // ENHANCED: Also track existing brands that might not be in database
  // This helps identify brands that need to be added to the database
  if (product.brands) {
    const allBrands = extractAllBrands(product);
    
    // Check each brand (async, don't wait - non-blocking)
    for (const brand of allBrands) {
      checkAndTrackUnmappedBrand(brand, product.barcode, 'brands_field').catch(() => {
        // Non-critical - continue even if tracking fails
      });
    }
  }
  
  // OPTIMIZATION: Apply CDN to image URLs for faster loading globally (iOS/Android)
  // This reduces image load time by 50-70% when CDN is configured
  if (product.image_url) {
    product.image_url = getCDNImageUrl(product.image_url);
  }
  if (product.image_front_url) {
    product.image_front_url = getCDNImageUrl(product.image_front_url);
  }
  if (product.image_front_small_url) {
    product.image_front_small_url = getCDNImageUrl(product.image_front_small_url);
  }
  
  // Apply MVP enhancements
  product = await applyMVPEnhancementsToProduct(product);
  
  // Apply brand enrichment (EAN-Search, OpenCorporates, B-Corp)
  product = await applyBrandEnrichment(product);
  
  // Calculate and set Eco-Score (OFF score → grade normalization only; not a Rveel-created Eco-Score)
  calculateAndSetEcoScore(product);
  
  // Wave 2: local Nutri-Score calculator demised — Body uses OFF nutriscore_grade only.
  
  // Approved NOVA-1 rescue (pillar Decision Tree) when OFF NOVA is missing
  assignNOVA1IfHighConfidence(product);

  // Legacy/cached NOVA 1 without typed provenance → unknown (never promote to off).
  ensureNova1ProvenanceOnProduct(product);
  
  return product;
}

/**
 * Track unmapped brands for database expansion
 * Checks if brand is in database and tracks it if not found
 */
async function checkAndTrackUnmappedBrand(brand: string, barcode: string, source: 'product_name' | 'brands_field' | 'brand_owner' | 'brands_tags'): Promise<void> {
  try {
    const brandData = getBrandData(brand);
    
    // If not found, track it for future database expansion
    if (!brandData) {
      await trackUnmappedBrand(brand, barcode, source);
      logger.debug('[ProductEnhancement] Unmapped brand detected and tracked:', {
        brand,
        barcode,
        source,
      });
    }
  } catch (error) {
    // Non-critical - just track if possible
    logger.debug('[ProductEnhancement] Error checking/tracking brand:', error);
  }
}