// CFIA (Canadian Food Inspection Agency) Recall Service
// Provides Canadian food recall and safety alert information
// Note: CFIA doesn't have a public API, but recall data is available on their website

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

const CACHE_KEY_PREFIX = 'cfia_recall_';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// Note: CFIA Recalls and Safety Alerts website: https://recalls-rappels.canada.ca/en
// No public API available, but data can be accessed via web scraping (with caution)

export interface CFIARecall {
  recallId: string;
  productName: string;
  brand?: string;
  reason: string;
  recallDate: string;
  distribution?: string[];
  isActive: boolean;
  url?: string;
  barcode?: string; // If available
}

/**
 * Check for CFIA food recalls
 * Note: CFIA doesn't have a public API, so this is structured for future enhancement
 */
export async function checkCFIARecalls(
  productName?: string,
  brand?: string,
  barcode?: string
): Promise<CFIARecall[]> {
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

    // TODO: CFIA doesn't have a public API
    // Options:
    // 1. Web scraping (requires careful implementation and ToS compliance)
    // 2. Wait for CFIA to provide API access
    // 3. Use alternative Canadian recall sources if available
    
    logger.debug(`CFIA: No public API available. Data available at https://recalls-rappels.canada.ca/en`);
    
    // For now, return empty array (can be enhanced with web scraping if needed)
    return [];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error checking CFIA recalls:`, errorMessage);
    return [];
  }
}

/**
 * Filter recalls to be product-specific
 */
function filterProductSpecificRecalls(
  recalls: CFIARecall[],
  productName?: string,
  brand?: string,
  barcode?: string
): CFIARecall[] {
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
      return true;
    }

    // If brand matches, check product name match
    if (brandLower && recallBrand.includes(brandLower)) {
      if (productWords.length > 0) {
        const matchingWords = productWords.filter(word => recallProduct.includes(word));
        const matchRatio = matchingWords.length / productWords.length;
        if (matchingWords.length < 2 || matchRatio < 0.6) {
          return false;
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
async function cacheRecall(key: string, recalls: CFIARecall[]): Promise<void> {
  try {
    const data = {
      recalls,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    logger.debug('Error caching CFIA recalls:', error);
  }
}

/**
 * Get cached recall data
 */
async function getCachedRecall(key: string): Promise<CFIARecall[] | null> {
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
    logger.debug('Error getting cached CFIA recalls:', error);
    return null;
  }
}

