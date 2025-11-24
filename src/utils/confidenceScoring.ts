// Confidence scoring system for product data sources
// Provides 0-1 confidence scores based on source reliability

import { Product } from '../types/product';

/**
 * Source reliability levels
 */
export type SourceReliability = 'high' | 'medium' | 'low';

/**
 * Source confidence mapping
 * Maps product sources to confidence scores (0-1) and reliability levels
 */
const SOURCE_CONFIDENCE_MAP: Partial<Record<NonNullable<Product['source']>, { confidence: number; reliability: SourceReliability }>> & Record<string, { confidence: number; reliability: SourceReliability }> = {
  // High confidence sources (0.8-1.0) - Government and official databases
  'fsanz_au': { confidence: 0.95, reliability: 'high' },
  'fsanz_nz': { confidence: 0.95, reliability: 'high' },
  'usda_fooddata': { confidence: 0.90, reliability: 'high' },
  'gs1_datasource': { confidence: 0.90, reliability: 'high' },
  'openfoodfacts': { confidence: 0.85, reliability: 'high' },
  
  // Medium confidence sources (0.5-0.7) - Store APIs and verified sources
  'woolworths_au': { confidence: 0.70, reliability: 'medium' },
  'coles_au': { confidence: 0.70, reliability: 'medium' },
  'iga_au': { confidence: 0.65, reliability: 'medium' },
  'woolworths_nz': { confidence: 0.70, reliability: 'medium' },
  'paknsave': { confidence: 0.65, reliability: 'medium' },
  'newworld': { confidence: 0.65, reliability: 'medium' },
  'openbeautyfacts': { confidence: 0.75, reliability: 'medium' },
  'openpetfoodfacts': { confidence: 0.75, reliability: 'medium' },
  'openproductsfacts': { confidence: 0.75, reliability: 'medium' },
  'go_upc': { confidence: 0.60, reliability: 'medium' },
  'buycott': { confidence: 0.60, reliability: 'medium' },
  'barcode_lookup': { confidence: 0.55, reliability: 'medium' },
  
  // Low confidence sources (0.3-0.5) - Free APIs and fallback sources
  'open_gtin': { confidence: 0.45, reliability: 'low' },
  'barcode_monster': { confidence: 0.40, reliability: 'low' },
  'upcitemdb': { confidence: 0.50, reliability: 'low' },
  'barcode_spider': { confidence: 0.45, reliability: 'low' },
  'web_search': { confidence: 0.30, reliability: 'low' },
  
  // Default for unknown sources
  'unknown': { confidence: 0.50, reliability: 'medium' },
};

/**
 * Get confidence score and reliability for a product source
 * 
 * @param source - Product source type
 * @returns Confidence score (0-1) and reliability level
 */
export function getSourceConfidence(
  source?: Product['source']
): { confidence: number; reliability: SourceReliability } {
  if (!source) {
    return SOURCE_CONFIDENCE_MAP['unknown'];
  }
  
  if (!source) {
    return SOURCE_CONFIDENCE_MAP['unknown'] || { confidence: 0.5, reliability: 'medium' };
  }
  
  return SOURCE_CONFIDENCE_MAP[source] || SOURCE_CONFIDENCE_MAP['unknown'] || { confidence: 0.5, reliability: 'medium' };
}

/**
 * Apply confidence score to a product
 * Adds confidence and sourceReliability fields to the product
 * 
 * @param product - Product to apply confidence score to
 * @returns Product with confidence score applied
 */
export function applyConfidenceScore(product: Product): Product {
  const { confidence, reliability } = getSourceConfidence(product.source);
  
  return {
    ...product,
    confidence,
    sourceReliability: reliability,
  };
}

/**
 * Get confidence label for display
 * 
 * @param reliability - Source reliability level
 * @returns User-friendly label
 */
export function getConfidenceLabel(reliability: SourceReliability): string {
  switch (reliability) {
    case 'high':
      return 'High confidence';
    case 'medium':
      return 'Medium confidence';
    case 'low':
      return 'Low confidence';
    default:
      return 'Unknown confidence';
  }
}

/**
 * Get confidence description for display
 * 
 * @param reliability - Source reliability level
 * @returns User-friendly description
 */
export function getConfidenceDescription(reliability: SourceReliability): string {
  switch (reliability) {
    case 'high':
      return 'Data from official government or verified sources';
    case 'medium':
      return 'Data from store APIs or community-verified sources';
    case 'low':
      return 'Data from free APIs or web search - may be incomplete';
    default:
      return 'Data source reliability unknown';
  }
}

