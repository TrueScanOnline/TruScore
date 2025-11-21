// Google Shopping pricing via scraping (fallback when API unavailable)
// Note: This uses web scraping - use responsibly and respect ToS
import { PriceEntry } from '../../types/pricing';
import { fetchWithCorsProxy } from './corsProxy';

export interface GoogleShoppingPrice {
  price: number;
  currency: string;
  retailer: string;
  url?: string;
  inStock: boolean;
}

/**
 * Fetch pricing from Google Shopping (via web scraping)
 * Real-time scraping from Google Shopping results
 * @param countryCode Optional country code to help with currency detection (e.g., 'NZ' for New Zealand)
 */
export async function fetchGoogleShoppingPrices(
  barcode: string,
  productName?: string,
  countryCode?: string
): Promise<PriceEntry[]> {
  const prices: PriceEntry[] = [];

  try {
    // Build search query - use product name if available, otherwise just barcode
    const query = productName 
      ? encodeURIComponent(`${productName} ${barcode}`)
      : encodeURIComponent(barcode);
    
    // Google Shopping search URL
    const searchUrl = `https://www.google.com/search?tbm=shop&q=${query}`;
    
    console.log(`[GoogleShopping] Scraping Google Shopping for: ${query}`);
    
    // Fetch Google Shopping results page using CORS proxy
    const html = await fetchWithCorsProxy(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!html || html.length < 100) {
      console.warn(`[GoogleShopping] Failed to fetch HTML (length: ${html?.length || 0})`);
      return prices;
    }
    
    // Extract prices from Google Shopping HTML
    // Enhanced to extract MULTIPLE prices from different retailers
    const pricePatterns = [
      // Price in Google Shopping format: $12.99
      { pattern: /\$\s*[\d,]+\.?\d{0,2}/g, extractValue: (m: string) => m.replace(/[^\d.]/g, '') },
      // NZ$12.99, US$12.99, etc.
      { pattern: /(NZ|US|AU|CA|GB|EU)\$\s*[\d,]+\.?\d{0,2}/gi, extractValue: (m: string) => m.replace(/[^\d.]/g, '') },
      // Price with currency code
      { pattern: /(USD|EUR|GBP|CAD|AUD|NZD)\s*[\d,]+\.?\d{0,2}/gi, extractValue: (m: string) => m.replace(/[^\d.]/g, '') },
      // Data attributes (more reliable)
      { pattern: /data-price=["']([\d.]+)["']/gi, extractValue: (m: string) => m.match(/[\d.]+/)?.[0] || '' },
      // JSON-LD structured data (most reliable)
      { pattern: /"price"\s*:\s*["']?([\d.]+)/gi, extractValue: (m: string) => m.match(/[\d.]+/)?.[0] || '' },
      { pattern: /"lowPrice"\s*:\s*["']?([\d.]+)/gi, extractValue: (m: string) => m.match(/[\d.]+/)?.[0] || '' },
      { pattern: /"highPrice"\s*:\s*["']?([\d.]+)/gi, extractValue: (m: string) => m.match(/[\d.]+/)?.[0] || '' },
    ];
    
    const foundPrices = new Map<number, { count: number; retailers: string[] }>();
    
    // Try to extract retailer names along with prices
    const retailerPatterns = [
      /<span[^>]*class="[^"]*retailer[^"]*"[^>]*>([^<]+)</gi,
      /"seller"\s*:\s*"([^"]+)"/gi,
      /"brand"\s*:\s*"([^"]+)"/gi,
      /data-merchant=["']([^"']+)["']/gi,
    ];
    
    const retailers = new Set<string>();
    for (const { pattern } of retailerPatterns.map(p => ({ pattern: p }))) {
      const matches = html.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const name = match.replace(/<[^>]*>/g, '').replace(/[":']/g, '').trim();
          if (name && name.length > 2 && name.length < 50) {
            retailers.add(name);
          }
        });
      }
    }
    
    for (const { pattern, extractValue } of pricePatterns) {
      const matches = html.match(pattern);
      if (matches) {
        for (const match of matches) {
          const priceStr = extractValue(match);
          const price = parseFloat(priceStr);
          
          // Validate price range (reasonable prices for consumer products)
          // Do NOT filter by price value - products can legitimately be very cheap
          if (!isNaN(price) && price > 0 && price < 10000) {
            const existing = foundPrices.get(price);
            if (existing) {
              existing.count++;
            } else {
              foundPrices.set(price, { count: 1, retailers: [] });
            }
          }
        }
      }
    }
    
    // Determine currency based on country code
    const defaultCurrency = countryCode === 'NZ' ? 'NZD' : 
                           countryCode === 'AU' ? 'AUD' :
                           countryCode === 'GB' ? 'GBP' :
                           countryCode === 'CA' ? 'CAD' :
                           countryCode === 'US' ? 'USD' : 'USD';

    // Convert to PriceEntry format with retailer names when available
    const retailerArray = Array.from(retailers);
    let retailerIndex = 0;
    
    foundPrices.forEach((data, price) => {
      // Use retailer name if available, otherwise use generic
      const retailer = retailerArray[retailerIndex] || `Google Shopping (${retailerIndex + 1})`;
      retailerIndex++;
      
      // Add multiple entries if price appears multiple times (different retailers)
      for (let i = 0; i < Math.min(data.count, 3); i++) {
        prices.push({
          price,
          currency: defaultCurrency, // Use country-specific currency
          retailer: retailerArray[retailerIndex - 1] || retailer,
          timestamp: Date.now(),
          source: 'api',
          verified: false,
        });
      }
    });
    
    // Sort by price (lowest first) and remove exact duplicates
    prices.sort((a, b) => {
      if (a.price !== b.price) return a.price - b.price;
      const retailerA = a.retailer || 'Unknown';
      const retailerB = b.retailer || 'Unknown';
      return retailerA.localeCompare(retailerB);
    });
    
    // Remove exact duplicates (same price and retailer)
    const uniquePrices: PriceEntry[] = [];
    const seen = new Set<string>();
    prices.forEach(p => {
      const retailer = p.retailer || 'Unknown';
      const key = `${p.price}_${retailer}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniquePrices.push(p);
      }
    });
    
    // Take up to 15 prices for better range
    const topPrices = uniquePrices.slice(0, 15);
    
    console.log(`[GoogleShopping] Found ${topPrices.length} unique prices from Google Shopping`);
    return topPrices;
  } catch (error) {
    console.error('[GoogleShopping] Error fetching prices:', error);
    return prices;
  }
}

