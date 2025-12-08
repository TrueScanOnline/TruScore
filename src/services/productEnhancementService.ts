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
 * Apply all enhancements to product
 */
export async function enhanceProduct(product: Product): Promise<Product> {
  // Extract palm oil analysis
  extractPalmOilAnalysisForProduct(product);
  
  // Format product data
  formatProductData(product);
  
  // Apply MVP enhancements
  product = await applyMVPEnhancementsToProduct(product);
  
  // Apply brand enrichment
  product = await applyBrandEnrichment(product);
  
  // Calculate and set Eco-Score
  calculateAndSetEcoScore(product);
  
  return product;
}

