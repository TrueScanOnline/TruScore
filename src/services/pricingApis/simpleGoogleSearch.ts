// Simple Google Search - No API Key Required
// Replicates what happens when user types product name into Google Search
// Uses geo-location to get local prices
import { PriceEntry } from '../../types/pricing';
import { fetchWithCorsProxy } from './corsProxy';

/**
 * Simple Google Search for product prices
 * No API key needed - just searches Google like a browser would
 * Uses geo-location to get local prices
 */
export async function simpleGoogleSearchPrices(
  barcode: string,
  productName?: string,
  countryCode?: string,
  city?: string
): Promise<PriceEntry[]> {
  const prices: PriceEntry[] = [];

  try {
    // Build search query - prioritize product name, fallback to barcode
    let query = '';
    
    if (productName && !productName.toLowerCase().startsWith('product ')) {
      // Use product name if available
      query = productName;
    } else {
      // Fallback to barcode
      query = barcode;
    }

    // Add location context for better local results
    let locationContext = '';
    if (countryCode) {
      // Add country to search for local results
      locationContext = ` ${countryCode}`;
    }
    if (city) {
      // Add city for even more local results
      locationContext = ` ${city}${locationContext}`;
    }

    const fullQuery = encodeURIComponent(`${query}${locationContext} price`);
    
    // Google Search URL - same as typing in browser
    // Using "tbm=shop" for shopping results (includes prices)
    const searchUrl = `https://www.google.com/search?q=${fullQuery}&tbm=shop&gl=${countryCode?.toLowerCase() || 'us'}&hl=en`;
    
    console.log(`[SimpleGoogleSearch] Searching: ${query}${locationContext}`);
    
    // Fetch Google Search results (like a browser)
    const html = await fetchWithCorsProxy(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!html || html.length < 100) {
      console.warn(`[SimpleGoogleSearch] Failed to fetch HTML`);
      return prices;
    }

    // Extract prices from Google Search results
    // Google Search shows prices in various formats in the HTML
    const pricePatterns = [
      // Standard price format: $4.29, NZ$4.29, etc.
      { 
        pattern: /(?:NZ|US|AU|CA|GB|EU)?\$?\s*([\d,]+\.?\d{0,2})/gi, 
        extractValue: (m: string) => {
          const match = m.match(/[\d,]+\.?\d{0,2}/);
          return match ? match[0].replace(/,/g, '') : '';
        }
      },
      // Price in structured data (JSON-LD)
      { 
        pattern: /"price"\s*:\s*["']?([\d.]+)/gi,
        extractValue: (m: string) => m.match(/[\d.]+/)?.[0] || ''
      },
      // Price in data attributes
      { 
        pattern: /data-price=["']([\d.]+)["']/gi,
        extractValue: (m: string) => m.match(/[\d.]+/)?.[0] || ''
      },
      // Price in shopping results
      { 
        pattern: /<span[^>]*class="[^"]*price[^"]*"[^>]*>([^<]+)<\/span>/gi,
        extractValue: (m: string) => {
          const match = m.match(/[\d,]+\.?\d{0,2}/);
          return match ? match[0].replace(/,/g, '') : '';
        }
      },
    ];

    const foundPrices = new Map<number, { count: number; sources: string[] }>();

    // Extract retailer/store names
    const retailerPatterns = [
      /<span[^>]*class="[^"]*retailer[^"]*"[^>]*>([^<]+)<\/span>/gi,
      /"seller"\s*:\s*"([^"]+)"/gi,
      /from\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
      /at\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
    ];

    const retailers = new Set<string>();
    retailerPatterns.forEach(pattern => {
      const matches = html.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const name = match
            .replace(/<[^>]*>/g, '')
            .replace(/["']/g, '')
            .replace(/^(from|at)\s+/i, '')
            .trim();
          if (name && name.length > 2 && name.length < 50) {
            retailers.add(name);
          }
        });
      }
    });

    // Extract prices using all patterns
    pricePatterns.forEach(({ pattern, extractValue }) => {
      const matches = html.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const priceStr = extractValue(match);
          const price = parseFloat(priceStr);
          
          // Validate price (reasonable range for consumer products)
          if (!isNaN(price) && price > 0 && price < 10000) {
            const existing = foundPrices.get(price);
            if (existing) {
              existing.count++;
            } else {
              foundPrices.set(price, { count: 1, sources: [] });
            }
          }
        });
      }
    });

    // Determine currency from country code
    const currency = getCurrencyFromCountry(countryCode);

    // Convert to PriceEntry format
    const retailerArray = Array.from(retailers);
    let retailerIndex = 0;

    foundPrices.forEach((data, price) => {
      // Use retailer name if available, otherwise generic
      const retailer = retailerArray[retailerIndex] || `Store ${retailerIndex + 1}`;
      retailerIndex++;

      // Add price entry (limit duplicates)
      for (let i = 0; i < Math.min(data.count, 2); i++) {
        prices.push({
          price,
          currency,
          retailer: retailerArray[retailerIndex - 1] || retailer,
          timestamp: Date.now(),
          source: 'api',
          verified: false,
        });
      }
    });

    // Remove duplicates and sort
    const uniquePrices = removeDuplicates(prices);
    uniquePrices.sort((a, b) => a.price - b.price);

    console.log(`[SimpleGoogleSearch] Found ${uniquePrices.length} prices from Google Search`);
    return uniquePrices.slice(0, 10); // Return top 10

  } catch (error) {
    console.error('[SimpleGoogleSearch] Error:', error);
    return prices;
  }
}

/**
 * Get currency code from country code
 */
function getCurrencyFromCountry(countryCode?: string): string {
  const currencyMap: Record<string, string> = {
    'NZ': 'NZD',
    'AU': 'AUD',
    'GB': 'GBP',
    'CA': 'CAD',
    'US': 'USD',
    'EU': 'EUR',
    'FR': 'EUR',
    'DE': 'EUR',
    'IT': 'EUR',
    'ES': 'EUR',
  };
  
  return currencyMap[countryCode || ''] || 'USD';
}

/**
 * Remove duplicate prices
 */
function removeDuplicates(prices: PriceEntry[]): PriceEntry[] {
  const seen = new Set<string>();
  const unique: PriceEntry[] = [];
  
  prices.forEach(price => {
    const key = `${price.price.toFixed(2)}_${price.retailer}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(price);
    }
  });
  
  return unique;
}

