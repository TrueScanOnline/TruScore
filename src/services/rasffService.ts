// EU RASFF (Rapid Alert System for Food and Feed) Service
// Provides EU food safety alerts and notifications
// Note: Full RASFF system is restricted to member authorities, but public data is available

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

const CACHE_KEY_PREFIX = 'rasff_';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// Note: RASFF Window provides public access to summary information
// Full API access may require registration with European Commission

export interface RASFFAlert {
  alertId: string;
  productName: string;
  brand?: string;
  country?: string;
  reason: string;
  alertDate: string;
  riskLevel?: 'serious' | 'information' | 'border rejection';
  category?: string;
  isActive: boolean;
  url?: string;
  barcode?: string; // If available
}

/**
 * Check for EU RASFF food safety alerts
 * Uses RASFF Window public data (2020 onwards)
 */
export async function checkRASFFAlerts(
  productName?: string,
  brand?: string,
  barcode?: string
): Promise<RASFFAlert[]> {
  if (!productName && !brand && !barcode) {
    return [];
  }

  try {
    // Try to get from cache first
    const cacheKey = `${CACHE_KEY_PREFIX}${barcode || productName || brand || 'unknown'}`;
    const cached = await getCachedAlert(cacheKey);
    if (cached) {
      return filterProductSpecificAlerts(cached, productName, brand, barcode);
    }

    // Note: RASFF Window API may require registration
    // For now, we'll use a placeholder that can be enhanced when API access is available
    // The RASFF Consumers' Portal provides public information but may not have direct API access

    // TODO: Implement RASFF Window API integration when API key is available
    // For now, return empty array (can be enhanced with web scraping or API access)
    
    logger.debug(`RASFF: Public API access may require registration. Check https://food.ec.europa.eu/safety/rasff_en for API access.`);
    
    return [];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error checking RASFF alerts:`, errorMessage);
    return [];
  }
}

/**
 * Filter alerts to be product-specific
 */
function filterProductSpecificAlerts(
  alerts: RASFFAlert[],
  productName?: string,
  brand?: string,
  barcode?: string
): RASFFAlert[] {
  if (!productName && !brand && !barcode) {
    return alerts;
  }

  const productWords = productName?.toLowerCase().split(/\s+/).filter(w => w.length > 2) || [];
  const brandLower = brand?.toLowerCase() || '';

  return alerts.filter(alert => {
    const alertProduct = alert.productName.toLowerCase();
    const alertBrand = alert.brand?.toLowerCase() || '';

    // If barcode is available, prioritize exact product matches
    if (barcode && alert.barcode && alert.barcode === barcode) {
      return true;
    }

    // If brand matches, check product name match
    if (brandLower && alertBrand.includes(brandLower)) {
      if (productWords.length > 0) {
        const matchingWords = productWords.filter(word => alertProduct.includes(word));
        const matchRatio = matchingWords.length / productWords.length;
        if (matchingWords.length < 2 || matchRatio < 0.6) {
          return false;
        }
      }
    }

    // Keep alerts that match product name significantly
    if (productWords.length > 0) {
      const matchingWords = productWords.filter(word => alertProduct.includes(word));
      return matchingWords.length >= 2 && (matchingWords.length / productWords.length) >= 0.6;
    }

    return true;
  });
}

/**
 * Cache alert data
 */
async function cacheAlert(key: string, alerts: RASFFAlert[]): Promise<void> {
  try {
    const data = {
      alerts,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    logger.debug('Error caching RASFF alerts:', error);
  }
}

/**
 * Get cached alert data
 */
async function getCachedAlert(key: string): Promise<RASFFAlert[] | null> {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;

    const data = JSON.parse(cached);
    const age = Date.now() - data.timestamp;

    if (age > CACHE_DURATION) {
      await AsyncStorage.removeItem(key);
      return null;
    }

    return data.alerts || null;
  } catch (error) {
    logger.debug('Error getting cached RASFF alerts:', error);
    return null;
  }
}

