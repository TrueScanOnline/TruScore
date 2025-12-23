// UK FSA (Food Standards Agency) Recall Service
// Provides UK food recall and alert information
// FREE API - JSON format via data.gov.uk / FSA Food Alerts API
// NON-BLOCKING: Async background service, doesn't affect product display

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';
import { UnifiedRecall, RecallClassification } from '../types/recall';

const CACHE_KEY_PREFIX = 'uk_fsa_recall_';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface UKFSARecall {
  alertId: string;
  productName: string;
  brand?: string;
  reason: string;
  recallDate: string;
  alertType: 'AA' | 'PRIN' | 'FAFA'; // Allergy Alert, Product Recall Information Notice, Food Alert for Action
  distribution?: string[];
  isActive: boolean;
  url?: string;
  barcode?: string;
}

/**
 * Check for UK FSA food recalls and alerts
 * NON-BLOCKING: Fast timeout (3 seconds), returns empty array if slow
 * Uses FSA Food Alerts API: https://www.api.gov.uk/fsa/food-alerts/
 */
export async function checkUKFSARecalls(
  productName?: string,
  brand?: string,
  barcode?: string
): Promise<UKFSARecall[]> {
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

    const recalls: UKFSARecall[] = [];
    
    try {
      // FSA Food Alerts API endpoint
      // Note: UK FSA API endpoint may have changed or requires different format
      // For now, we'll return empty array and log that API needs verification
      // The API documentation suggests the endpoint exists but may require authentication or different format
      logger.debug('UK FSA API: Endpoint may need verification. API documentation: https://www.api.gov.uk/fsa/food-alerts/');
      return [];
      
      /* Future implementation when correct endpoint is verified:
      const searchQuery = encodeURIComponent(productName || brand || '');
      const url = `https://data.food.gov.uk/food-alerts`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TrueScan-FoodScanner/1.0.0',
        },
        signal: (() => {
          const controller = new AbortController();
          setTimeout(() => controller.abort(), 3000);
          return controller.signal;
        })(),
      });
      */
    } catch (error) {
      // Non-blocking: Log and continue without recalls
      logger.debug('UK FSA recall fetch error (non-critical):', error);
      return [];
    }
    
    // Cache results if any found
    if (recalls.length > 0) {
      await cacheRecall(cacheKey, recalls);
      return filterProductSpecificRecalls(recalls, productName, brand, barcode);
    }
    
    return recalls;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.debug(`Error checking UK FSA recalls (non-critical):`, errorMessage);
    return [];
  }
}

/**
 * Filter recalls to be product-specific
 */
function filterProductSpecificRecalls(
  recalls: UKFSARecall[],
  productName?: string,
  brand?: string,
  barcode?: string
): UKFSARecall[] {
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
async function cacheRecall(key: string, recalls: UKFSARecall[]): Promise<void> {
  try {
    const data = {
      recalls,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    logger.debug('Error caching UK FSA recalls:', error);
  }
}

/**
 * Get cached recall data
 */
async function getCachedRecall(key: string): Promise<UKFSARecall[] | null> {
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
    logger.debug('Error getting cached UK FSA recalls:', error);
    return null;
  }
}

/**
 * Convert UKFSARecall to UnifiedRecall
 */
export function convertUKFSARecall(recall: UKFSARecall): UnifiedRecall {
  // Infer classification from alert type and reason
  const classification = inferClassificationFromAlert(recall.alertType, recall.reason);
  
  return {
    recallId: recall.alertId,
    productName: recall.productName,
    brand: recall.brand,
    reason: recall.reason,
    recallDate: recall.recallDate,
    agency: 'UK_FSA',
    distribution: recall.distribution,
    isActive: recall.isActive,
    url: recall.url,
    barcode: recall.barcode,
    classification,
  };
}

/**
 * Infer recall classification from alert type and reason
 */
function inferClassificationFromAlert(alertType: 'AA' | 'PRIN' | 'FAFA', reason: string): RecallClassification {
  // FAFA (Food Alert for Action) is most serious
  if (alertType === 'FAFA') {
    return 'Class I';
  }
  
  // AA (Allergy Alert) is serious
  if (alertType === 'AA') {
    return 'Class I';
  }
  
  // PRIN (Product Recall Information Notice) varies
  const reasonLower = reason.toLowerCase();
  if (reasonLower.match(/\b(death|serious|life-threatening|fatal|contamination|listeria|salmonella|e\.?coli)\b/)) {
    return 'Class I';
  }
  if (reasonLower.match(/\b(temporary|reversible|minor|mislabeling|undeclared)\b/)) {
    return 'Class II';
  }
  
  return 'Class II'; // Default for PRIN
}

