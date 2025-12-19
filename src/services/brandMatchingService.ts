/**
 * Brand Matching Service
 * 
 * Centralized service for brand/company matching using fuzzy logic.
 * Integrates fuzzy matching algorithms with the existing brand database
 * to provide accurate, confidence-scored brand matching across all pillars.
 * 
 * Features:
 * - Fuzzy matching with multiple algorithms
 * - Confidence scoring (0-100)
 * - Multi-brand support
 * - Parent company resolution
 * - Caching for performance
 */

import { Product } from '../types/product';
import { BrandData, getBrandData, BRAND_DATABASE, normalizeBrandNameForLookup } from '../data/brandDatabase';
import { extractAllBrands } from '../utils/brandExtraction';
import {
  fuzzyMatchBrand,
  findBestFuzzyMatch,
  fuzzyMatchMultipleBrands,
  normalizeForFuzzyMatching,
  FuzzyMatchResult,
} from '../utils/fuzzyMatching';
import { logger } from '../utils/logger';
import { logMatchQuality } from '../utils/matchQualityLogger';
import { shouldSkipFuzzyMatching, trackPerformance, getNormalizedBrand } from '../utils/performanceOptimizer';

export interface BrandMatchResult {
  brand: string; // Original brand name from product
  normalizedBrand: string; // Normalized version
  confidence: number; // 0-100
  matchedData: BrandData | null; // Brand data from database
  parentCompany?: string; // Parent company if found
  matchType: 'exact' | 'alias' | 'fuzzy' | 'none';
  algorithm?: string; // Algorithm used for fuzzy match
  details?: {
    levenshtein?: number;
    jaroWinkler?: number;
    tokenMatch?: number;
    hybridScore?: number;
  };
}

// Cache for brand matches (LRU-style, simple implementation)
const matchCache = new Map<string, BrandMatchResult[]>();
const CACHE_SIZE = 1000; // Max cache entries
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const cacheTimestamps = new Map<string, number>();

/**
 * Clear expired cache entries
 */
function clearExpiredCache(): void {
  const now = Date.now();
  for (const [key, timestamp] of cacheTimestamps.entries()) {
    if (now - timestamp > CACHE_TTL) {
      matchCache.delete(key);
      cacheTimestamps.delete(key);
    }
  }

  // If cache is too large, remove oldest entries
  if (matchCache.size > CACHE_SIZE) {
    const entries = Array.from(cacheTimestamps.entries())
      .sort((a, b) => a[1] - b[1])
      .slice(0, matchCache.size - CACHE_SIZE);
    
    for (const [key] of entries) {
      matchCache.delete(key);
      cacheTimestamps.delete(key);
    }
  }
}

/**
 * Get cache key for a product's brands
 */
function getCacheKey(brands: string[]): string {
  return brands
    .map(b => normalizeForFuzzyMatching(b))
    .sort()
    .join('|');
}

/**
 * Match a single brand against the brand database
 * Uses fuzzy matching with confidence scoring
 * PERFORMANCE: Optimized with lazy loading and pre-computation
 */
function matchSingleBrand(
  brand: string,
  threshold: number = 0.75
): BrandMatchResult {
  const startTime = Date.now();
  
  if (!brand || typeof brand !== 'string' || brand.trim().length === 0) {
    return {
      brand,
      normalizedBrand: '',
      confidence: 0,
      matchedData: null,
      matchType: 'none',
    };
  }

  const normalized = normalizeBrandNameForLookup(brand);

  // 1. Try exact match (fastest) - use pre-computed cache
  const cachedMatch = getNormalizedBrand(brand);
  if (cachedMatch) {
    const exactMatch = BRAND_DATABASE[cachedMatch];
    if (exactMatch) {
      const duration = Date.now() - startTime;
      trackPerformance('exact_match', duration, true);
      return {
        brand,
        normalizedBrand: normalized,
        confidence: 100,
        matchedData: exactMatch,
        parentCompany: exactMatch.parentCompany,
        matchType: 'exact',
      };
    }
  }

  // 2. Try alias match (fast)
  const brandData = getBrandData(brand);
  if (brandData) {
    const duration = Date.now() - startTime;
    trackPerformance('alias_match', duration, true);
    return {
      brand,
      normalizedBrand: normalized,
      confidence: 100,
      matchedData: brandData,
      parentCompany: brandData.parentCompany,
      matchType: 'alias',
    };
  }

  // 3. PERFORMANCE: Lazy loading - only run fuzzy matching if needed
  // Check if we should skip fuzzy matching (likely exact/alias match)
  if (shouldSkipFuzzyMatching(brand)) {
    // Already checked above, no match found
    const duration = Date.now() - startTime;
    trackPerformance('no_match', duration, false);
    return {
      brand,
      normalizedBrand: normalized,
      confidence: 0,
      matchedData: null,
      matchType: 'none',
    };
  }

  // 4. Try fuzzy matching against all database brands (slower, but more accurate)
  const databaseBrands = Object.keys(BRAND_DATABASE);
  const fuzzyResult = findBestFuzzyMatch(brand, databaseBrands, threshold);

  const duration = Date.now() - startTime;
  trackPerformance('fuzzy_match', duration, false);

  if (fuzzyResult && fuzzyResult.matched) {
    const matchedData = BRAND_DATABASE[normalizeBrandNameForLookup(fuzzyResult.matchedBrand)];
    return {
      brand,
      normalizedBrand: normalized,
      confidence: fuzzyResult.confidence,
      matchedData: matchedData || null,
      parentCompany: matchedData?.parentCompany,
      matchType: 'fuzzy',
      algorithm: fuzzyResult.algorithm,
      details: fuzzyResult.details,
    };
  }

  // 5. No match found
  return {
    brand,
    normalizedBrand: normalized,
    confidence: 0,
    matchedData: null,
    matchType: 'none',
  };
}

/**
 * Match all brands from a product against the brand database
 * Returns all matches above threshold, sorted by confidence
 * 
 * @param product - Product to match brands for
 * @param threshold - Minimum confidence threshold (0-1, default 0.75)
 * @param useCache - Whether to use cache (default: true)
 * @returns Array of brand match results, sorted by confidence (highest first)
 */
export function matchBrands(
  product: Product,
  threshold: number = 0.75,
  useCache: boolean = true
): BrandMatchResult[] {
  // Clear expired cache entries periodically
  if (Math.random() < 0.01) { // 1% chance on each call
    clearExpiredCache();
  }

  // Extract all brands from product
  const brands = extractAllBrands(product);
  
  if (brands.length === 0) {
    return [];
  }

  // Check cache
  if (useCache) {
    const cacheKey = getCacheKey(brands);
    const cached = matchCache.get(cacheKey);
    if (cached) {
      logger.debug('[BrandMatching] Using cached brand matches:', {
        barcode: product.barcode,
        brandsCount: brands.length,
        matchesCount: cached.length,
      });
      return cached;
    }
  }

  // Match all brands
  const matches: BrandMatchResult[] = [];
  
  for (const brand of brands) {
    const match = matchSingleBrand(brand, threshold);
    if (match.confidence >= (threshold * 100)) {
      matches.push(match);
    }
  }

  // Sort by confidence (highest first)
  matches.sort((a, b) => b.confidence - a.confidence);

  // Cache results
  if (useCache && matches.length > 0) {
    const cacheKey = getCacheKey(brands);
    matchCache.set(cacheKey, matches);
    cacheTimestamps.set(cacheKey, Date.now());
  }

  // Log match quality for monitoring
  logMatchQuality(
    product.barcode || '',
    product.product_name || '',
    matches,
    'brand_matching'
  );

  logger.debug('[BrandMatching] Brand matches:', {
    barcode: product.barcode,
    brandsCount: brands.length,
    matchesCount: matches.length,
    matches: matches.map(m => ({
      brand: m.brand,
      confidence: m.confidence,
      matchType: m.matchType,
    })),
  });

  return matches;
}

/**
 * Get the best brand match for a product
 * Returns the highest confidence match, or null if none above threshold
 * 
 * @param product - Product to match
 * @param threshold - Minimum confidence threshold (0-1, default 0.75)
 * @returns Best brand match, or null
 */
export function getBestBrandMatch(
  product: Product,
  threshold: number = 0.75
): BrandMatchResult | null {
  const matches = matchBrands(product, threshold);
  return matches.length > 0 ? matches[0] : null;
}

/**
 * Check if a product has a brand match above threshold
 * 
 * @param product - Product to check
 * @param threshold - Minimum confidence threshold (0-1, default 0.75)
 * @returns True if at least one brand matches above threshold
 */
export function hasBrandMatch(
  product: Product,
  threshold: number = 0.75
): boolean {
  const matches = matchBrands(product, threshold);
  return matches.length > 0;
}

/**
 * Get all parent companies for matched brands
 * 
 * @param product - Product to check
 * @param threshold - Minimum confidence threshold (0-1, default 0.75)
 * @returns Array of unique parent company names
 */
export function getParentCompanies(
  product: Product,
  threshold: number = 0.75
): string[] {
  const matches = matchBrands(product, threshold);
  const parents = new Set<string>();
  
  for (const match of matches) {
    if (match.parentCompany) {
      parents.add(match.parentCompany);
    }
  }
  
  return Array.from(parents);
}

/**
 * Check if any matched brand has a specific property
 * Useful for checking violations, certifications, etc.
 * 
 * @param product - Product to check
 * @param checkFn - Function to check brand data
 * @param threshold - Minimum confidence threshold (0-1, default 0.75)
 * @returns True if any matched brand passes the check
 */
export function checkBrandProperty(
  product: Product,
  checkFn: (brandData: BrandData) => boolean,
  threshold: number = 0.75
): boolean {
  const matches = matchBrands(product, threshold);
  
  for (const match of matches) {
    if (match.matchedData && checkFn(match.matchedData)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Clear the brand match cache
 * Useful for testing or when brand database is updated
 */
export function clearBrandMatchCache(): void {
  matchCache.clear();
  cacheTimestamps.clear();
  logger.debug('[BrandMatching] Cache cleared');
}
