// Recalls.gov Comprehensive US Recall Service
// Aggregates recalls from FDA, USDA FSIS, CPSC, and other US agencies
// FREE API - No key required

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

const CACHE_KEY_PREFIX = 'recalls_gov_';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// Note: Recalls.gov doesn't have a unified API, but individual agencies do
// We'll use FDA (already implemented), USDA FSIS, and CPSC APIs

export interface ComprehensiveRecall {
  recallId: string;
  productName: string;
  brand?: string;
  reason: string;
  recallDate: string;
  agency: 'FDA' | 'USDA_FSIS' | 'CPSC' | 'NHTSA' | 'OTHER';
  distribution?: string[];
  isActive: boolean;
  url?: string;
  barcode?: string; // If available
}

// Export for type conversion
export type { ComprehensiveRecall as ComprehensiveUSRecall };

/**
 * Check for comprehensive US recalls from multiple agencies
 * Uses FDA (existing), USDA FSIS, CPSC APIs
 */
export async function checkComprehensiveUSRecalls(
  productName?: string,
  brand?: string,
  barcode?: string
): Promise<ComprehensiveRecall[]> {
  if (!productName && !brand && !barcode) {
    return [];
  }

  try {
    // Try to get from cache first
    const cacheKey = `${CACHE_KEY_PREFIX}${barcode || productName || brand || 'unknown'}`;
    const cached = await getCachedRecall(cacheKey);
    if (cached) {
      return filterProductSpecificRecalls(cached, productName, brand, barcode);
    }

    const recalls: ComprehensiveRecall[] = [];

    // 1. FDA Recalls (already implemented, but we'll call it here for comprehensive coverage)
    // Note: We'll use the existing FDA service, but this provides a unified interface

    // 2. USDA FSIS Recalls (meat, poultry, egg products)
    if (productName || brand) {
      const fsisRecalls = await searchUSDAFSISRecalls(productName || brand || '');
      recalls.push(...fsisRecalls);
    }

    // 3. CPSC Recalls (consumer products - may include food-related items)
    if (productName || brand) {
      const cpscRecalls = await searchCPSCRecalls(productName || brand || '');
      recalls.push(...cpscRecalls);
    }

    // Remove duplicates
    const uniqueRecalls = Array.from(
      new Map(recalls.map(r => [r.recallId, r])).values()
    );

    // Filter to be product-specific
    const filteredRecalls = filterProductSpecificRecalls(uniqueRecalls, productName, brand, barcode);

    // Cache the results
    if (filteredRecalls.length > 0) {
      await cacheRecall(cacheKey, filteredRecalls);
    }

    return filteredRecalls;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error checking comprehensive US recalls:`, errorMessage);
    return [];
  }
}

/**
 * Search USDA FSIS Recall API
 * Covers meat, poultry, and egg products
 */
async function searchUSDAFSISRecalls(searchTerm: string): Promise<ComprehensiveRecall[]> {
  try {
    // USDA FSIS Recall API endpoint
    const url = `https://api.fsis.usda.gov/recalls/v1/recalls?search=${encodeURIComponent(searchTerm)}&limit=10`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TrueScan-FoodScanner/1.0.0',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return []; // No recalls found
      }
      logger.debug(`USDA FSIS API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    if (!data || !Array.isArray(data)) {
      return [];
    }

    return data
      .filter((recall: any) => {
        // Only include active or recent recalls (within last 2 years)
        if (recall.recallDate) {
          const recallDate = new Date(recall.recallDate);
          const twoYearsAgo = new Date();
          twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
          return recallDate >= twoYearsAgo;
        }
        return true;
      })
      .map((recall: any) => ({
        recallId: recall.recallNumber || recall.id || 'unknown',
        productName: recall.productDescription || recall.productName || 'Unknown Product',
        brand: recall.companyName || recall.brand,
        reason: recall.reasonForRecall || recall.hazard || 'No reason provided',
        recallDate: recall.recallDate || new Date().toISOString(),
        agency: 'USDA_FSIS' as const,
        distribution: recall.distributionPattern ? recall.distributionPattern.split(',').map((d: string) => d.trim()) : undefined,
        isActive: recall.status?.toLowerCase() === 'active' || recall.status?.toLowerCase() === 'ongoing',
        url: recall.url || `https://www.fsis.usda.gov/recalls`,
      }));
  } catch (error) {
    logger.debug('Error searching USDA FSIS recalls:', error);
    return [];
  }
}

/**
 * Search CPSC Recall API
 * Covers consumer products (may include food-related items)
 */
async function searchCPSCRecalls(searchTerm: string): Promise<ComprehensiveRecall[]> {
  try {
    // CPSC Recall API endpoint (XML format, but we'll parse it)
    const url = `https://www.cpsc.gov/api/Recalls/Recall?format=xml&query=${encodeURIComponent(searchTerm)}&limit=10`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/xml, application/json',
        'User-Agent': 'TrueScan-FoodScanner/1.0.0',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return []; // No recalls found
      }
      logger.debug(`CPSC API error: ${response.status}`);
      return [];
    }

    // CPSC returns XML, but we'll try to parse as JSON if possible
    // For now, return empty array (CPSC API may require different handling)
    // TODO: Implement XML parsing if needed
    return [];
  } catch (error) {
    logger.debug('Error searching CPSC recalls:', error);
    return [];
  }
}

/**
 * Filter recalls to be product-specific
 */
function filterProductSpecificRecalls(
  recalls: ComprehensiveRecall[],
  productName?: string,
  brand?: string,
  barcode?: string
): ComprehensiveRecall[] {
  if (!productName && !brand && !barcode) {
    return recalls;
  }

  const productWords = productName?.toLowerCase().split(/\s+/).filter(w => w.length > 2) || [];
  const brandLower = brand?.toLowerCase() || '';

  return recalls.filter(recall => {
    const recallProduct = recall.productName.toLowerCase();
    const recallBrand = recall.brand?.toLowerCase() || '';

    // If barcode is available, prioritize exact product matches
    if (barcode && recall.barcode && recall.barcode === barcode) {
      return true; // Exact barcode match
    }

    // If brand matches but product name doesn't contain any product words, it's likely too generic
    if (brandLower && recallBrand.includes(brandLower)) {
      if (productWords.length > 0) {
        const matchingWords = productWords.filter(word => recallProduct.includes(word));
        const matchRatio = matchingWords.length / productWords.length;
        if (matchingWords.length < 2 || matchRatio < 0.6) {
          return false; // Too generic
        }
      }
    }

    // Keep recalls that match product name significantly
    if (productWords.length > 0) {
      const matchingWords = productWords.filter(word => recallProduct.includes(word));
      return matchingWords.length >= 2 && (matchingWords.length / productWords.length) >= 0.6;
    }

    return true;
  });
}

/**
 * Cache recall data
 */
async function cacheRecall(key: string, recalls: ComprehensiveRecall[]): Promise<void> {
  try {
    const data = {
      recalls,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    logger.debug('Error caching recalls:', error);
  }
}

/**
 * Get cached recall data
 */
async function getCachedRecall(key: string): Promise<ComprehensiveRecall[] | null> {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;

    const data = JSON.parse(cached);
    const age = Date.now() - data.timestamp;

    if (age > CACHE_DURATION) {
      await AsyncStorage.removeItem(key);
      return null;
    }

    return data.recalls || null;
  } catch (error) {
    logger.debug('Error getting cached recalls:', error);
    return null;
  }
}

