// Product Data Merger Service
// Merges product data from multiple sources with weighted priority
// Ensures best-quality data is used when multiple sources return results

import { Product, ProductNutriments, Certification } from '../types/product';
import { logger } from '../utils/logger';

export interface MergeOptions {
  // Source weights (0-1, where 1 = highest priority)
  sourceWeights?: Record<NonNullable<Product['source']>, number>;
  // Whether to normalize nutrition to per-100g
  normalizeNutrition?: boolean;
  // Whether to merge certifications
  shouldMergeCertifications?: boolean;
}

/**
 * Default source weights
 * Higher weight = more trusted source
 */
const DEFAULT_SOURCE_WEIGHTS: Record<NonNullable<Product['source']>, number> = {
  // Government databases (highest priority)
  'fsanz_au': 0.40,
  'fsanz_nz': 0.40,
  'usda_fooddata': 0.40,
  'gs1_datasource': 0.40,
  
  // Open Facts databases (high priority)
  'openfoodfacts': 0.40,
  'openbeautyfacts': 0.35,
  'openpetfoodfacts': 0.35,
  'openproductsfacts': 0.35,
  
  // Store APIs (medium priority)
  'woolworths_au': 0.30,
  'coles_au': 0.30,
  'iga_au': 0.30,
  'woolworths_nz': 0.30,
  'paknsave': 0.30,
  'newworld': 0.30,
  
  // Verified APIs (medium-low priority)
  'go_upc': 0.20,
  'buycott': 0.20,
  
  // Free APIs (low priority)
  'open_gtin': 0.20,
  'barcode_monster': 0.20,
  'upcitemdb': 0.20,
  'barcode_spider': 0.20,
  
  // Fallback (lowest priority)
  'web_search': 0.10,
  
  // Unknown sources
  'off_api': 0.30,
  'spoonacular': 0.25,
  'nz_store_api': 0.30,
};

/**
 * Merge multiple products into one, using weighted source priority
 * 
 * @param products - Array of products from different sources
 * @param options - Merge options
 * @returns Merged product with best data from all sources
 */
export function mergeProducts(
  products: Product[],
  options: MergeOptions = {}
): Product {
  if (products.length === 0) {
    throw new Error('Cannot merge empty product array');
  }
  
  if (products.length === 1) {
    return products[0];
  }
  
  const sourceWeights = options.sourceWeights || DEFAULT_SOURCE_WEIGHTS;
  const normalizeNutrition = options.normalizeNutrition !== false; // Default true
  const shouldMergeCertifications = options.shouldMergeCertifications !== false; // Default true
  
  // Sort products by source weight (highest first)
  const sortedProducts = [...products].sort((a, b) => {
    const weightA = sourceWeights[a.source || 'web_search'] || 0.1;
    const weightB = sourceWeights[b.source || 'web_search'] || 0.1;
    return weightB - weightA;
  });
  
  // Use highest-weight product as base
  const baseProduct = sortedProducts[0];
  const mergedProduct: Product = { ...baseProduct };
  
  // Merge fields from other products (weighted)
  const weights = sortedProducts.map(p => 
    sourceWeights[p.source || 'web_search'] || 0.1
  );
  
  // Normalize weights to sum to 1
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const normalizedWeights = weights.map(w => w / totalWeight);
  
  // Merge product name (use best one)
  mergedProduct.product_name = baseProduct.product_name || 
    sortedProducts.find(p => p.product_name)?.product_name || 
    'Unknown Product';
  
  // Merge brand (use best one)
  mergedProduct.brands = baseProduct.brands || 
    sortedProducts.find(p => p.brands)?.brands;
  
  // Merge image (use best one - prefer non-null)
  mergedProduct.image_url = baseProduct.image_url || 
    sortedProducts.find(p => p.image_url)?.image_url;
  
  // Merge nutrition data (weighted average)
  const allNutriments = sortedProducts
    .map(p => p.nutriments)
    .filter((n): n is ProductNutriments => n !== undefined);
  
  if (allNutriments.length > 0) {
    mergedProduct.nutriments = mergeNutriments(allNutriments, normalizedWeights);
    
    // Normalize to per-100g if requested
    if (normalizeNutrition) {
      mergedProduct.nutriments = normalizeNutritionToPer100g(mergedProduct.nutriments);
    }
  }
  
  // Merge ingredients (use most complete)
  const ingredientsList = sortedProducts
    .map(p => p.ingredients_text)
    .filter((i): i is string => !!i && i.length > 0);
  
  if (ingredientsList.length > 0) {
    // Use longest ingredients list (most complete)
    mergedProduct.ingredients_text = ingredientsList.reduce((longest, current) => 
      current.length > longest.length ? current : longest
    );
  }
  
  // Merge certifications (union with priority)
  if (shouldMergeCertifications) {
    const allCertifications = sortedProducts
      .map(p => p.certifications)
      .filter((c): c is Certification[] => Array.isArray(c) && c.length > 0);
    
    if (allCertifications.length > 0) {
      mergedProduct.certifications = mergeCertificationsList(allCertifications, normalizedWeights);
    }
  }
  
  // Merge categories (union)
  const allCategories = sortedProducts
    .map(p => p.categories)
    .filter((c): c is string => !!c);
  
  if (allCategories.length > 0) {
    // Use most specific (longest) category string
    mergedProduct.categories = allCategories.reduce((longest, current) => 
      current.length > longest.length ? current : longest
    );
  }
  
  // Merge quality metrics (weighted average)
  const qualityValues = sortedProducts
    .map(p => p.quality)
    .filter((q): q is number => q !== undefined);
  
  if (qualityValues.length > 0) {
    mergedProduct.quality = Math.round(
      qualityValues.reduce((sum, q, i) => sum + q * normalizedWeights[i], 0)
    );
  }
  
  const completionValues = sortedProducts
    .map(p => p.completion)
    .filter((c): c is number => c !== undefined);
  
  if (completionValues.length > 0) {
    mergedProduct.completion = Math.round(
      completionValues.reduce((sum, c, i) => sum + c * normalizedWeights[i], 0)
    );
  }
  
  // Use source from highest-weight product
  mergedProduct.source = baseProduct.source;
  
  // Merge other fields (use best available)
  mergedProduct.packaging = baseProduct.packaging || 
    sortedProducts.find(p => p.packaging)?.packaging;
  
  mergedProduct.serving_size = baseProduct.serving_size || 
    sortedProducts.find(p => p.serving_size)?.serving_size;
  
  mergedProduct.quantity = baseProduct.quantity || 
    sortedProducts.find(p => p.quantity)?.quantity;
  
  logger.debug(`Merged ${products.length} products from sources: ${products.map(p => p.source).join(', ')}`);
  
  return mergedProduct;
}

/**
 * Merge nutrition data with weighted average
 */
function mergeNutriments(
  nutriments: ProductNutriments[],
  weights: number[]
): ProductNutriments {
  const merged: ProductNutriments = {};
  
  // Get all unique keys
  const allKeys = new Set<string>();
  nutriments.forEach(n => {
    Object.keys(n).forEach(key => allKeys.add(key));
  });
  
  // Merge each nutrient with weighted average
  allKeys.forEach(key => {
    let totalValue = 0;
    let totalWeight = 0;
    
    nutriments.forEach((n, index) => {
      const value = (n as any)[key];
      if (value !== undefined && value !== null && !isNaN(Number(value))) {
        const numValue = Number(value);
        const weight = weights[index] || 0;
        totalValue += numValue * weight;
        totalWeight += weight;
      }
    });
    
    if (totalWeight > 0) {
      (merged as any)[key] = totalValue / totalWeight;
    }
  });
  
  return merged;
}

/**
 * Normalize nutrition values to per-100g format
 */
function normalizeNutritionToPer100g(nutriments: ProductNutriments): ProductNutriments {
  const normalized: ProductNutriments = { ...nutriments };
  
  // List of nutrients that should have per-100g values
  const nutrients = [
    'energy', 'energy-kcal', 'energy-kj',
    'fat', 'saturated-fat',
    'carbohydrates', 'sugars', 'fiber',
    'proteins', 'salt', 'sodium',
  ];
  
  nutrients.forEach(nutrient => {
    // If we have the base value but not per-100g, use base value
    const baseValue = (normalized as any)[nutrient];
    const per100gValue = (normalized as any)[`${nutrient}_100g`];
    
    if (baseValue !== undefined && per100gValue === undefined) {
      (normalized as any)[`${nutrient}_100g`] = baseValue;
    }
    
    // If we have per-100g but not base, use per-100g
    if (per100gValue !== undefined && baseValue === undefined) {
      (normalized as any)[nutrient] = per100gValue;
    }
  });
  
  return normalized;
}

/**
 * Merge certifications (union with priority)
 * Higher-weight sources' certifications take priority
 */
function mergeCertificationsList(
  certifications: Certification[][],
  weights: number[]
): Certification[] {
  const certificationMap = new Map<string, Certification>();
  
  // Process certifications in order of weight (highest first)
  certifications.forEach((certs, index) => {
    const weight = weights[index] || 0;
    
    certs.forEach(cert => {
      const key = cert.tag || cert.id || cert.name || '';
      
      // Only add if not already present (higher weight sources processed first)
      if (key && !certificationMap.has(key)) {
        certificationMap.set(key, cert);
      }
    });
  });
  
  return Array.from(certificationMap.values());
}

