// FDA Food Recall Service
// Checks for food recalls and safety alerts from FDA Enforcement API
// FREE API - No key required

import AsyncStorage from '@react-native-async-storage/async-storage';

const FDA_API_BASE = 'https://api.fda.gov/food/enforcement.json';
const CACHE_KEY_PREFIX = 'fda_recall_';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days (recalls don't change often)

export interface FoodRecall {
  recallId: string;
  productName: string;
  brand?: string;
  reason: string;
  recallDate: string;
  distribution?: string[];
  isActive: boolean;
  url?: string;
}

interface FDAResponse {
  meta?: {
    disclaimer?: string;
    terms?: string;
    license?: string;
    last_updated?: string;
  };
  results?: Array<{
    recall_number?: string;
    product_description?: string;
    product_quantity?: string;
    reason_for_recall?: string;
    recall_initiation_date?: string;
    status?: string;
    distribution_pattern?: string;
    product_type?: string;
    event_id?: string;
    recalling_firm?: string;
    [key: string]: unknown;
  }>;
}

/**
 * Check for FDA food recalls by product name or brand
 * ENHANCED: Generates multiple query variations for better matching
 * Uses fuzzy matching to find relevant recalls, with improved filtering for product-specific matches
 * CRITICAL: Now uses barcode for more precise matching when available
 */
export async function checkFDARecalls(
  productName?: string,
  brand?: string,
  barcode?: string
): Promise<FoodRecall[]> {
  if (!productName && !brand && !barcode) {
    return [];
  }

  try {
    // Try to get from cache first
    const cacheKey = `${CACHE_KEY_PREFIX}${barcode || productName || brand || 'unknown'}`;
    const cached = await getCachedRecall(cacheKey);
    if (cached) {
      // Filter cached results to be more product-specific (now includes barcode)
      return filterProductSpecificRecalls(cached, productName, brand, barcode);
    }

    const recalls: FoodRecall[] = [];

    // ENHANCED: Generate multiple query variations for better matching
    const searchTerms = generateRecallSearchTerms(productName, brand, barcode);

    // Search with all terms (in parallel for speed)
    const searchResults = await Promise.all(
      searchTerms.map(term => searchFDARecalls(term))
    );

    // Flatten and collect all recalls
    for (const result of searchResults) {
      recalls.push(...result);
    }

    // Remove duplicates
    const uniqueRecalls = Array.from(
      new Map(recalls.map(r => [r.recallId, r])).values()
    );

    // Filter to be more product-specific (now includes barcode matching)
    const filteredRecalls = filterProductSpecificRecalls(uniqueRecalls, productName, brand, barcode);

    // Cache the results
    if (filteredRecalls.length > 0) {
      await cacheRecall(cacheKey, filteredRecalls);
    }

    return filteredRecalls;
  } catch (error) {
    console.error('Error checking FDA recalls:', error);
    return [];
  }
}

/**
 * Generate multiple search term variations for better recall matching
 * Handles: brand+product combinations, keyword extraction, US/UK spelling variations
 */
function generateRecallSearchTerms(
  productName?: string,
  brand?: string,
  barcode?: string
): string[] {
  const searchTerms: string[] = [];

  // 1. Original product name (normalized for US/UK spelling)
  if (productName) {
    searchTerms.push(productName);
    // Also add normalized version (yoghurt -> yogurt, etc.)
    const normalized = normalizeProductNameForSearch(productName);
    if (normalized !== productName.toLowerCase()) {
      searchTerms.push(normalized);
    }
  }

  // 2. Brand + product name combinations
  if (brand && productName) {
    searchTerms.push(`${brand} ${productName}`);
    searchTerms.push(`${productName} ${brand}`);
    // Normalized versions
    const normalizedProduct = normalizeProductNameForSearch(productName);
    searchTerms.push(`${brand} ${normalizedProduct}`);
    searchTerms.push(`${normalizedProduct} ${brand}`);
  }

  // 3. Extract keywords from product name
  if (productName) {
    const keywords = extractKeywords(productName);
    if (keywords.length > 0) {
      // Try brand + keywords
      if (brand) {
        searchTerms.push(`${brand} ${keywords.join(' ')}`);
        // Try different keyword combinations
        if (keywords.length >= 2) {
          searchTerms.push(`${brand} ${keywords.slice(0, 2).join(' ')}`);
        }
      }
      // Try keywords alone (if significant)
      if (keywords.length >= 2) {
        searchTerms.push(keywords.join(' '));
        searchTerms.push(keywords.slice(0, 2).join(' '));
      }
    }
  }

  // 4. Brand alone (if not already tried)
  if (brand) {
    searchTerms.push(brand);
  }

  // 5. Barcode-based searches
  if (barcode) {
    if (productName) {
      searchTerms.push(`${productName} ${barcode}`);
    }
    if (brand) {
      searchTerms.push(`${brand} ${barcode}`);
    }
    // Barcode alone (some recalls may have barcodes)
    searchTerms.push(barcode);
  }

  // Remove duplicates and empty terms
  return Array.from(new Set(searchTerms.filter(term => term && term.trim().length > 0)));
}

/**
 * Normalize product name for search (handles US/UK spelling variations)
 */
function normalizeProductNameForSearch(name: string): string {
  return name
    .toLowerCase()
    .trim()
    // US/UK spelling variations
    .replace(/\byoghurt\b/g, 'yogurt')
    .replace(/\byoghurts\b/g, 'yogurts')
    .replace(/\bcolour\b/g, 'color')
    .replace(/\bcolours\b/g, 'colors')
    .replace(/\bflavour\b/g, 'flavor')
    .replace(/\bflavours\b/g, 'flavors')
    .replace(/\borganised\b/g, 'organized')
    .replace(/\borganise\b/g, 'organize')
    .replace(/\bcentre\b/g, 'center')
    .replace(/\bcentres\b/g, 'centers')
    .replace(/\btheatre\b/g, 'theater')
    .replace(/\bfibre\b/g, 'fiber')
    .replace(/\bfibres\b/g, 'fibers')
    // Normalize hyphens and dashes
    .replace(/[-–—]/g, ' ')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract meaningful keywords from product name (removes stop words)
 */
function extractKeywords(productName: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'as', 'is', 'was', 'are', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
    'from', 'into', 'onto', 'upon', 'over', 'under', 'above', 'below', 'between', 'among', 'during',
    'before', 'after', 'through', 'across', 'around', 'near', 'far', 'up', 'down', 'out', 'off',
    'about', 'against', 'along', 'beside', 'beyond', 'inside', 'outside', 'within', 'without'
  ]);

  const words = normalizeProductNameForSearch(productName)
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));

  // Return top 5 keywords (most significant)
  return words.slice(0, 5);
}

/**
 * Filter recalls to be more product-specific
 * Removes generic/too-broad recalls that match on manufacturer only
 * CRITICAL: Now uses barcode for more precise filtering
 */
function filterProductSpecificRecalls(
  recalls: FoodRecall[],
  productName?: string,
  brand?: string,
  barcode?: string
): FoodRecall[] {
  if (!productName && !brand && !barcode) {
    return recalls;
  }

  // ENHANCED: Normalize product name for better matching (US/UK spelling)
  const normalizedProductName = productName ? normalizeProductNameForSearch(productName) : '';
  const productWords = normalizedProductName.split(/\s+/).filter(w => w.length > 2) || [];
  const brandLower = brand?.toLowerCase() || '';

  return recalls.filter(recall => {
    // Normalize recall product name for comparison
    const recallProduct = normalizeProductNameForSearch(recall.productName);
    const recallBrand = recall.brand?.toLowerCase() || '';

    // CRITICAL: If barcode is available, prioritize exact product matches
    // Check if recall product description contains the barcode (exact product match)
    if (barcode && recallProduct.includes(barcode)) {
      return true; // Exact barcode match - definitely relevant
    }

    // If brand matches but product name doesn't contain any product words, it's likely too generic
    if (brandLower && recallBrand.includes(brandLower)) {
      // Check if product name has at least 2 matching words (more specific)
      if (productWords.length > 0) {
        const matchingWords = productWords.filter(word => recallProduct.includes(word));
        // STRICTER: Require at least 2 matching words AND 60% match for product-specific recall
        const matchRatio = matchingWords.length / productWords.length;
        if (matchingWords.length < 2 || matchRatio < 0.6) {
          return false; // Too generic, filter it out
        }
      } else {
        // No product name to match, but brand matches - filter out manufacturer-only matches
        // Only keep if recall product description is very specific (contains numbers, sizes, etc.)
        const hasSpecificDetails = /\d+|oz|ml|g|kg|lb|pack|size|count/i.test(recallProduct);
        if (!hasSpecificDetails) {
          return false; // Too generic manufacturer-only match
        }
      }
    }

    // Keep recalls that match product name significantly (STRICTER)
    // ENHANCED: Use normalized comparison for better US/UK spelling matching
    if (productWords.length > 0) {
      const matchingWords = productWords.filter(word => recallProduct.includes(word));
      const matchRatio = matchingWords.length / productWords.length;
      // Require at least 2 matching words AND 60% match ratio
      if (matchingWords.length >= 2 && matchRatio >= 0.6) {
        return true;
      }
    }

    // Keep recalls that match brand
    if (brandLower && recallBrand.includes(brandLower)) {
      return true;
    }

    // Filter out if no meaningful match
    return false;
  });
}

/**
 * Search FDA API for recalls matching a search term
 */
async function searchFDARecalls(searchTerm: string): Promise<FoodRecall[]> {
  try {
    // Clean search term - remove common words that might cause false positives
    const cleanedTerm = cleanSearchTerm(searchTerm);
    if (!cleanedTerm || cleanedTerm.length < 3) {
      return [];
    }

    // FDA API search - search in product_description field
    const searchQuery = `product_description:"${encodeURIComponent(cleanedTerm)}"`;
    const url = `${FDA_API_BASE}?search=${searchQuery}&limit=10`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TrueScan-FoodScanner/1.0.0',
      },
    });

    if (!response.ok) {
      // 404 is expected when no recalls found - use debug level
      if (response.status === 404) {
        console.log(`[FDA] No recalls found for product (expected)`);
      } else {
        console.warn(`FDA API error: ${response.status}`);
      }
      return [];
    }

    const data: FDAResponse = await response.json();

    if (!data.results || data.results.length === 0) {
      return [];
    }

    // Convert FDA response to our FoodRecall format
    return data.results
      .filter(result => {
        // Only include active recalls or recent ones (within last 2 years)
        const status = result.status?.toLowerCase();
        const isActive = status === 'ongoing' || status === 'terminated';
        
        // Check if recall date is recent (within 2 years)
        if (result.recall_initiation_date) {
          const recallDate = new Date(result.recall_initiation_date);
          const twoYearsAgo = new Date();
          twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
          const isRecent = recallDate >= twoYearsAgo;
          
          return isActive || isRecent;
        }
        
        return isActive;
      })
      .map(result => ({
        recallId: result.recall_number || result.event_id || 'unknown',
        productName: result.product_description || 'Unknown Product',
        brand: result.recalling_firm,
        reason: result.reason_for_recall || 'No reason provided',
        recallDate: result.recall_initiation_date || new Date().toISOString(),
        distribution: result.distribution_pattern
          ? result.distribution_pattern.split(',').map(d => d.trim())
          : undefined,
        isActive: result.status?.toLowerCase() === 'ongoing',
        url: `https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts`,
      }));
  } catch (error) {
    console.error('Error searching FDA recalls:', error);
    return [];
  }
}

/**
 * Clean search term to improve recall matching
 * ENHANCED: Better normalization and stop word removal
 */
function cleanSearchTerm(term: string): string {
  if (!term) return '';
  
  // Normalize first (US/UK spelling, hyphens, etc.)
  const normalized = normalizeProductNameForSearch(term);
  
  // Remove common words that cause false positives
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'as', 'is', 'was', 'are', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did'];
  const words = normalized.split(/\s+/);
  const cleaned = words.filter(word => 
    word.length > 2 && !commonWords.includes(word)
  );
  
  // Take first 3-4 meaningful words
  return cleaned.slice(0, 4).join(' ');
}

/**
 * Get cached recall data
 */
async function getCachedRecall(cacheKey: string): Promise<FoodRecall[] | null> {
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;

    if (age < CACHE_DURATION) {
      return data;
    }

    // Cache expired
    await AsyncStorage.removeItem(cacheKey);
    return null;
  } catch (error) {
    console.error('Error reading recall cache:', error);
    return null;
  }
}

/**
 * Cache recall data
 */
async function cacheRecall(cacheKey: string, recalls: FoodRecall[]): Promise<void> {
  try {
    await AsyncStorage.setItem(
      cacheKey,
      JSON.stringify({
        data: recalls,
        timestamp: Date.now(),
      })
    );
  } catch (error) {
    console.error('Error caching recall:', error);
  }
}

/**
 * Check if a product has active recalls
 */
export function hasActiveRecalls(recalls: FoodRecall[]): boolean {
  return recalls.some(r => r.isActive);
}

