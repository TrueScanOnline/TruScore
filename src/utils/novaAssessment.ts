/**
 * NOVA Group Assessment
 * 
 * ID 9: Limited NOVA 1 Detection (High Confidence Only)
 * 
 * Assesses if a product is likely NOVA Group 1 (Unprocessed or Minimally Processed)
 * Only assigns NOVA 1 if confidence is high (≥85% accuracy)
 * 
 * Does NOT attempt to classify NOVA 2, 3, or 4 (too risky)
 * 
 * NOVA Group 1 Criteria (Unprocessed or Minimally Processed):
 * - Natural foods
 * - Cleaned, frozen, dried, pasteurized
 * - No additives (except salt, sugar, oil)
 * - Simple processing (cutting, grinding, freezing, drying)
 * 
 * @module novaAssessment
 */

import { Product } from '../types/product';
import { logger } from './logger';

export interface NOVA1Assessment {
  likelyNOVA1: boolean;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

/**
 * Check if ingredient text contains processed ingredients
 * Processed ingredients indicate the product is NOT NOVA 1
 */
function hasProcessedIngredients(ingredientsText: string): boolean {
  const processedPatterns = [
    // Modified starches and thickeners
    /\bmodified\s+(starch|cornstarch|potato\s+starch|tapioca)\b/i,
    /\b(corn\s+syrup|high\s+fructose\s+corn\s+syrup|hfcs)\b/i,
    /\b(hydrogenated|partially\s+hydrogenated)\s+(oil|fat)\b/i,
    /\binteresterified\s+(oil|fat)\b/i,
    
    // Artificial additives (excluding salt, sugar, oil which are allowed)
    /\b(artificial\s+flavor|artificial\s+flavoring|artificial\s+color|artificial\s+coloring)\b/i,
    /\b(preservative|sodium\s+benzoate|potassium\s+sorbate|calcium\s+propionate)\b/i,
    /\b(emulsifier|lecithin|polysorbate|mono\s+and\s+diglycerides)\b/i,
    /\b(stabilizer|xanthan\s+gum|guar\s+gum|carrageenan)\b/i,
    
    // Processed protein sources
    /\b(textured\s+vegetable\s+protein|tvp|soy\s+protein\s+isolate)\b/i,
    /\b(whey\s+protein|casein|protein\s+isolate)\b/i,
    
    // Processed fats
    /\b(margarine|vegetable\s+shortening|palm\s+kernel\s+oil)\b/i,
    
    // Processing indicators
    /\b(ultra\s+pasteurized|uht|homogenized)\b/i,
    /\b(dehydrated|powdered|freeze\s+dried)\s+(milk|egg|fruit)\b/i,
  ];
  
  return processedPatterns.some(pattern => pattern.test(ingredientsText));
}

/**
 * Check if ingredient text contains heavily processed ingredients
 * Heavily processed ingredients indicate medium confidence at best
 */
function hasHeavilyProcessedIngredients(ingredientsText: string): boolean {
  const heavilyProcessedPatterns = [
    // Multiple additives
    /\b(en:\d+|e\d+[a-z]?)\b/i, // E-numbers (more than 2-3 indicate processing)
    /\b(monosodium\s+glutamate|msg)\b/i,
    /\b(artificial\s+sweetener|aspartame|sucralose|acesulfame)\b/i,
    /\b(nitrite|nitrate)\b/i,
    /\b(sodium\s+nitrite|potassium\s+nitrate)\b/i,
  ];
  
  const matches = heavilyProcessedPatterns.filter(pattern => pattern.test(ingredientsText));
  return matches.length > 2; // More than 2 heavily processed ingredients
}

/**
 * Assess if product is likely NOVA Group 1 (Unprocessed or Minimally Processed)
 * ID 9: Only assigns NOVA 1 if confidence is high (≥85% accuracy)
 * 
 * High Confidence Indicators:
 * - No additives
 * - ≤5 ingredients
 * - Natural ingredients only (no processed ingredients)
 * 
 * Medium Confidence Indicators:
 * - ≤2 additives
 * - ≤8 ingredients
 * - Minimal processing
 * 
 * Low Confidence/Not NOVA 1:
 * - >2 additives
 * - >8 ingredients
 * - Processed ingredients detected
 * 
 * @param product - Product to assess
 * @returns Assessment result with confidence level
 */
export function assessNOVAGroup1(product: Product): NOVA1Assessment {
  // If NOVA group is already set, don't override it
  if (product.nova_group !== undefined && product.nova_group !== null) {
    return {
      likelyNOVA1: product.nova_group === 1,
      confidence: 'high', // Trust existing NOVA classification
      reason: 'NOVA group already set by data source',
    };
  }
  
  // Need ingredients text to assess
  if (!product.ingredients_text || product.ingredients_text.trim().length === 0) {
    return {
      likelyNOVA1: false,
      confidence: 'low',
      reason: 'No ingredients text available',
    };
  }
  
  const ingredientsText = product.ingredients_text.toLowerCase();
  const ingredientsCount = ingredientsText.split(',').map(i => i.trim()).filter(i => i.length > 0).length;
  const additivesCount = product.additives_tags ? product.additives_tags.length : 0;
  
  // HIGH CONFIDENCE: No additives + ≤5 ingredients + natural ingredients only
  if (
    additivesCount === 0 &&
    ingredientsCount <= 5 &&
    !hasProcessedIngredients(product.ingredients_text)
  ) {
    return {
      likelyNOVA1: true,
      confidence: 'high',
      reason: 'No additives, short ingredients list (≤5), natural ingredients only',
    };
  }
  
  // MEDIUM CONFIDENCE: ≤2 additives + ≤8 ingredients + minimal processing
  if (
    additivesCount <= 2 &&
    ingredientsCount <= 8 &&
    !hasHeavilyProcessedIngredients(product.ingredients_text) &&
    !hasProcessedIngredients(product.ingredients_text)
  ) {
    return {
      likelyNOVA1: true,
      confidence: 'medium',
      reason: 'Few additives (≤2), moderate ingredients (≤8), minimal processing',
    };
  }
  
  // LOW CONFIDENCE or NOT NOVA 1: Multiple additives or processed ingredients
  if (additivesCount > 2 || ingredientsCount > 8 || hasProcessedIngredients(product.ingredients_text)) {
    return {
      likelyNOVA1: false,
      confidence: 'low',
      reason: additivesCount > 2 
        ? `Multiple additives (${additivesCount}) indicate processing`
        : ingredientsCount > 8
        ? `Long ingredients list (${ingredientsCount}) indicates processing`
        : 'Processed ingredients detected',
    };
  }
  
  // Default: Low confidence
  return {
    likelyNOVA1: false,
    confidence: 'low',
    reason: 'Insufficient indicators for NOVA 1 classification',
  };
}

/**
 * Assign NOVA Group 1 to product if high confidence assessment
 * ID 9: Only assigns if confidence is 'high' (≥85% accuracy)
 * 
 * @param product - Product to potentially assign NOVA 1
 * @returns Product with NOVA 1 assigned (if high confidence), or unchanged
 */
export function assignNOVA1IfHighConfidence(product: Product): Product {
  const assessment = assessNOVAGroup1(product);
  
  // Only assign NOVA 1 if high confidence
  if (assessment.likelyNOVA1 && assessment.confidence === 'high') {
    product.nova_group = 1;
    // Add metadata for transparency
    (product as any)._nova_estimated = true;
    (product as any)._nova_confidence = 'high';
    logger.debug(`[NOVA Assessment] Assigned NOVA 1 (high confidence): ${assessment.reason}`);
  }
  
  return product;
}

