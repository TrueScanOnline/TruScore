// CFIA (Canadian Food Inspection Agency) Recall Service
// Provides Canadian food recall and safety alert information
// Note: CFIA doesn't have a public API, but recall data is available on their website

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
      logger.debug(`CFIA CORS proxy ${proxy} failed:`, error);
      continue;
    }
  }
  return null;
}

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

    // CFIA doesn't have a public API, implement web scraping
    // CFIA Recalls website: https://recalls-rappels.canada.ca/en
    // Note: Respect ToS and rate limits
    
    const recalls: CFIARecall[] = [];
    
    try {
      // CFIA Recalls search URL (public access)
      const searchTerms: string[] = [];
      if (productName) searchTerms.push(encodeURIComponent(productName));
      if (brand) searchTerms.push(encodeURIComponent(brand));
      if (barcode) searchTerms.push(encodeURIComponent(barcode));
      
      if (searchTerms.length === 0) {
        return [];
      }
      
      // Try to scrape CFIA Recalls website
      // Using CORS proxy for web scraping
      const cfiaUrl = `https://recalls-rappels.canada.ca/en`;
      const html = await fetchWithCorsProxy(cfiaUrl);
      
      if (html) {
        // Parse HTML to extract recall data
        // CFIA website uses structured HTML - try multiple parsing strategies
        
        // Strategy 1: Look for JSON-LD structured data
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
                      recalls.push({
                        recallId: item.identifier || `cfia-${Date.now()}-${Math.random()}`,
                        productName,
                        brand: brand,
                        reason: item.description || 'CFIA recall - check details',
                        recallDate: item.datePublished || new Date().toISOString(),
                        distribution: undefined,
                        isActive: true,
                        url: item.url || `https://recalls-rappels.canada.ca/en`,
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
        
        // Strategy 2: Look for table rows or list items (fallback)
        if (recalls.length === 0) {
          // Look for links or text that might be product names
          const linkMatches = html.match(/<a[^>]*href=["'][^"']*recall[^"']*["'][^>]*>([^<]+)<\/a>/gi) || [];
          const textMatches = html.match(/>([^<]{10,100})</g) || [];
          const allMatches = [...linkMatches, ...textMatches];
          
          for (const match of allMatches.slice(0, 20)) {
            // Extract text from HTML
            const textMatch = match.match(/>([^<]+)</);
            const productText = textMatch?.[1]?.trim() || '';
            
            if (productText && productText.length > 5 && productText.length < 100) {
              // Check if it matches search terms
              const productLower = productText.toLowerCase();
              const matchesSearch = searchTerms.length === 0 || searchTerms.some(term => 
                productLower.includes(decodeURIComponent(term).toLowerCase())
              );
              
              if (matchesSearch) {
                // Extract date if available
                const dateMatch = match.match(/(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/);
                
                recalls.push({
                  recallId: `cfia-${Date.now()}-${Math.random()}`,
                  productName: productText,
                  brand: brand,
                  reason: 'CFIA recall - check details',
                  recallDate: dateMatch?.[1] || new Date().toISOString(),
                  distribution: undefined,
                  isActive: true,
                  url: `https://recalls-rappels.canada.ca/en`,
                  barcode: barcode,
                });
              }
            }
          }
        }
      }
    } catch (error) {
      logger.debug('CFIA web scraping error (non-critical):', error);
      // Continue without recalls if scraping fails
    }
    
    // Cache results if any found
    if (recalls.length > 0) {
      await cacheRecall(cacheKey, recalls);
      return filterProductSpecificRecalls(recalls, productName, brand, barcode);
    }
    
    logger.debug(`CFIA: Web scraping attempted, ${recalls.length} recalls found`);
    
    return recalls;
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

