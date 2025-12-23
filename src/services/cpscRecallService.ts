// CPSC (Consumer Product Safety Commission) Recall Service
// Provides US consumer product recall information
// Note: CPSC API returns XML format, requires parsing

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';
import { UnifiedRecall, RecallClassification } from '../types/recall';

const CACHE_KEY_PREFIX = 'cpsc_recall_';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface CPSCRecall {
  recallId: string;
  productName: string;
  brand?: string;
  reason: string;
  recallDate: string;
  distribution?: string[];
  isActive: boolean;
  url?: string;
  barcode?: string;
}

/**
 * Check for CPSC consumer product recalls
 * Note: CPSC API returns XML, requires parsing
 * NON-BLOCKING: Returns empty array if parsing fails (doesn't block product display)
 */
export async function checkCPSCRecalls(
  productName?: string,
  brand?: string,
  barcode?: string
): Promise<CPSCRecall[]> {
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

    const recalls: CPSCRecall[] = [];
    
    try {
      // CPSC Recall API endpoint (corrected - uses SaferProducts.gov API)
      const searchTerm = productName || brand || barcode || '';
      // CPSC uses SaferProducts.gov API, supports JSON format
      const url = `https://www.saferproducts.gov/RestWebServices/Recall?format=json&ProductName=${encodeURIComponent(searchTerm)}&limit=10`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/xml, application/json',
          'User-Agent': 'TrueScan-FoodScanner/1.0.0',
        },
        signal: (() => {
          const controller = new AbortController();
          setTimeout(() => controller.abort(), 5000); // 5 second timeout
          return controller.signal;
        })(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return []; // No recalls found
        }
        logger.debug(`CPSC API error: ${response.status}`);
        return [];
      }

      // CPSC API returns JSON (when format=json is specified)
      const data = await response.json();
      
      // Parse CPSC API response
      // Structure may vary - handle both array and object responses
      const records = Array.isArray(data) ? data : (data.Recalls || data.recalls || data.results || []);
      
      for (const record of records.slice(0, 10)) {
        // Extract recall data (field names from CPSC API)
        const recallId = record.RecallNumber || record.recallNumber || record.id || `cpsc-${Date.now()}-${Math.random()}`;
        const product = record.ProductName || record.productName || record.ProductDescription || productName || 'Unknown Product';
        const brandName = record.Manufacturer || record.manufacturer || record.ManufacturerName || brand;
        const reason = record.RecallDescription || record.recallDescription || record.Description || record.Hazard || 'CPSC recall - check details';
        const recallDate = record.RecallDate || record.recallDate || record.Date || new Date().toISOString();
        const url = record.RecallURL || record.recallUrl || record.URL || `https://www.cpsc.gov/Recalls`;
        
        recalls.push({
          recallId,
          productName: product,
          brand: brandName,
          reason,
          recallDate,
          distribution: undefined,
          isActive: true,
          url,
          barcode: barcode,
        });
      }
    } catch (error) {
      logger.debug('CPSC XML parsing error (non-critical):', error);
      // Continue without recalls if parsing fails
    }
    
    // Cache results if any found
    if (recalls.length > 0) {
      await cacheRecall(cacheKey, recalls);
      return filterProductSpecificRecalls(recalls, productName, brand, barcode);
    }
    
    return recalls;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.debug(`Error checking CPSC recalls (non-critical):`, errorMessage);
    return [];
  }
}

/**
 * Filter recalls to be product-specific
 */
function filterProductSpecificRecalls(
  recalls: CPSCRecall[],
  productName?: string,
  brand?: string,
  barcode?: string
): CPSCRecall[] {
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
async function cacheRecall(key: string, recalls: CPSCRecall[]): Promise<void> {
  try {
    const data = {
      recalls,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    logger.debug('Error caching CPSC recalls:', error);
  }
}

/**
 * Get cached recall data
 */
async function getCachedRecall(key: string): Promise<CPSCRecall[] | null> {
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
    logger.debug('Error getting cached CPSC recalls:', error);
    return null;
  }
}

/**
 * Convert CPSCRecall to UnifiedRecall
 */
export function convertCPSCRecall(recall: CPSCRecall): UnifiedRecall {
  // Infer classification from reason text
  const classification = inferClassificationFromReason(recall.reason);
  
  return {
    recallId: recall.recallId,
    productName: recall.productName,
    brand: recall.brand,
    reason: recall.reason,
    recallDate: recall.recallDate,
    agency: 'CPSC',
    distribution: recall.distribution,
    isActive: recall.isActive,
    url: recall.url,
    barcode: recall.barcode,
    classification,
  };
}

/**
 * Infer recall classification from reason text
 */
function inferClassificationFromReason(reason: string): RecallClassification {
  if (!reason) return 'Unknown';
  
  const reasonLower = reason.toLowerCase();
  
  // Class I indicators: death, serious, life-threatening, injury, fire, burn
  if (reasonLower.match(/\b(death|serious|life-threatening|fatal|injury|fire|burn|electrocution)\b/)) {
    return 'Class I';
  }
  // Class II indicators: temporary, reversible, minor, mislabeling
  if (reasonLower.match(/\b(temporary|reversible|minor|mislabeling|undeclared|allergen)\b/)) {
    return 'Class II';
  }
  // Class III: unlikely to cause, quality issues
  if (reasonLower.match(/\b(unlikely|quality|packaging|cosmetic)\b/)) {
    return 'Class III';
  }
  
  return 'Unknown';
}

