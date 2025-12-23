// EU RASFF (Rapid Alert System for Food and Feed) Service
// Provides EU food safety alerts and notifications
// Note: Full RASFF system is restricted to member authorities, but public data is available

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

// CORS proxy helper for web scraping
async function fetchWithCorsProxy(url: string, retries = 2): Promise<string | null> {
  const CORS_PROXIES = [
    'https://api.allorigins.win/get?url=',
    'https://corsproxy.io/?',
    'https://api.codetabs.com/v1/proxy?quest=',
  ];
  
  for (let i = 0; i < Math.min(retries, CORS_PROXIES.length); i++) {
    const proxy = CORS_PROXIES[i];
    try {
      const proxyUrl = proxy + encodeURIComponent(url);
      const response = await fetch(proxyUrl, {
        headers: {
          'Accept': 'text/html',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: (() => {
          const controller = new AbortController();
          setTimeout(() => controller.abort(), 10000);
          return controller.signal;
        })(),
      });
      
      if (response.ok) {
        const text = await response.text();
        if (text && text.length > 100) {
          try {
            const json = JSON.parse(text);
            if (json.contents) return json.contents; // allorigins format
            if (json.content) return json.content;
            if (typeof json === 'string') return json;
          } catch {
            return text;
          }
          return text;
        }
      }
    } catch (error) {
      logger.debug(`RASFF CORS proxy ${proxy} failed:`, error);
      continue;
    }
  }
  return null;
}

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

    // RASFF Window provides public data but no API
    // Implement web scraping from RASFF Portal: https://food.ec.europa.eu/safety/rasff_en
    // Note: Respect ToS and rate limits
    
    const alerts: RASFFAlert[] = [];
    
    try {
      // RASFF Portal search URL (public access)
      // Search by product name or brand
      const searchTerms: string[] = [];
      if (productName) searchTerms.push(encodeURIComponent(productName));
      if (brand) searchTerms.push(encodeURIComponent(brand));
      if (barcode) searchTerms.push(encodeURIComponent(barcode));
      
      if (searchTerms.length === 0) {
        return [];
      }
      
      // Try to scrape RASFF Portal (note: structure may change)
      // Using CORS proxy for web scraping
      const rasffUrl = `https://food.ec.europa.eu/safety/rasff_en`;
      const html = await fetchWithCorsProxy(rasffUrl);
      
      if (html) {
        // Parse HTML to extract alert data
        // RASFF Portal uses structured data - try to find JSON-LD or data attributes
        // Also look for table rows or list items with alert data
        
        // Method 1: Try to find JSON-LD structured data
        const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
        for (const jsonLd of jsonLdMatches) {
          try {
            const jsonContent = jsonLd.match(/<script[^>]*>([\s\S]*?)<\/script>/i)?.[1];
            if (jsonContent) {
              const parsed = JSON.parse(jsonContent);
              if (Array.isArray(parsed)) {
                parsed.forEach((item: any) => {
                  if (item['@type'] === 'Product' || item.name) {
                    const productName = item.name || item.productName || '';
                    if (productName) {
                      alerts.push({
                        alertId: item.identifier || `rasff-${Date.now()}-${Math.random()}`,
                        productName,
                        brand: brand,
                        country: 'EU',
                        reason: item.description || 'RASFF alert - check details',
                        alertDate: item.datePublished || new Date().toISOString(),
                        riskLevel: 'serious' as any,
                        category: 'Food',
                        isActive: true,
                        url: item.url || `https://food.ec.europa.eu/safety/rasff_en`,
                        barcode: barcode,
                      });
                    }
                  }
                });
              }
            }
          } catch {
            // Not valid JSON, continue
          }
        }
        
        // Method 2: Parse HTML table/list structure (fallback)
        if (alerts.length === 0) {
          // Look for table rows or list items
          const tableRowMatches = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
          const listItemMatches = html.match(/<li[^>]*>[\s\S]*?<\/li>/gi) || [];
          const allItems = [...tableRowMatches, ...listItemMatches];
          
          for (const itemHtml of allItems.slice(0, 20)) {
            // Extract product name from links or text
            const linkMatch = itemHtml.match(/<a[^>]*>([^<]+)<\/a>/i);
            const textMatch = itemHtml.match(/>([^<]{10,100})</);
            const productText = linkMatch?.[1] || textMatch?.[1] || '';
            
            if (productText && productText.length > 5) {
              // Check if it matches search terms
              const productLower = productText.toLowerCase();
              const matchesSearch = searchTerms.length === 0 || searchTerms.some(term => 
                productLower.includes(decodeURIComponent(term).toLowerCase())
              );
              
              if (matchesSearch) {
                // Extract date
                const dateMatch = itemHtml.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
                
                alerts.push({
                  alertId: `rasff-${Date.now()}-${Math.random()}`,
                  productName: productText.trim(),
                  brand: brand,
                  country: 'EU',
                  reason: 'RASFF alert - check details',
                  alertDate: dateMatch?.[1] || new Date().toISOString(),
                  riskLevel: 'serious' as any,
                  category: 'Food',
                  isActive: true,
                  url: `https://food.ec.europa.eu/safety/rasff_en`,
                  barcode: barcode,
                });
              }
            }
          }
        }
      }
    } catch (error) {
      logger.debug('RASFF web scraping error (non-critical):', error);
      // Continue without alerts if scraping fails
    }
    
    // Cache results if any found
    if (alerts.length > 0) {
      await cacheAlert(cacheKey, alerts);
      return filterProductSpecificAlerts(alerts, productName, brand, barcode);
    }
    
    logger.debug(`RASFF: Web scraping attempted, ${alerts.length} alerts found`);
    
    return alerts;
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

