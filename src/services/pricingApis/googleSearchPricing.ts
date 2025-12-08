// Google Custom Search API - Replicates what Google Search does
// This uses Google's official API to get search results with prices
// Just like when a user types a product name into Google Search
import { PriceEntry } from '../../types/pricing';

const GOOGLE_CUSTOM_SEARCH_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_CUSTOM_SEARCH_API_KEY || '';
const GOOGLE_CUSTOM_SEARCH_ENGINE_ID = process.env.EXPO_PUBLIC_GOOGLE_CUSTOM_SEARCH_ENGINE_ID || '';

interface GoogleSearchResult {
  title: string;
  link: string;
  snippet: string;
  pagemap?: {
    offer?: Array<{
      price?: string;
      pricecurrency?: string;
      availability?: string;
    }>;
    product?: Array<{
      name?: string;
      price?: string;
      pricecurrency?: string;
    }>;
  };
}

interface GoogleSearchResponse {
  items?: GoogleSearchResult[];
  searchInformation?: {
    totalResults: string;
  };
}

/**
 * Fetch prices using Google Custom Search API
 * This replicates what happens when a user searches Google for a product
 * Returns structured results with prices, just like Google Search shows
 */
export async function fetchGoogleSearchPrices(
  barcode: string,
  productName?: string,
  countryCode?: string
): Promise<PriceEntry[]> {
  const prices: PriceEntry[] = [];

  if (!GOOGLE_CUSTOM_SEARCH_API_KEY || !GOOGLE_CUSTOM_SEARCH_ENGINE_ID) {
    console.warn('[GoogleSearch] API key or Engine ID not configured');
    return prices;
  }

  try {
    // Build search query - same as what user would type in Google
    const query = productName 
      ? `${productName} ${barcode}`
      : barcode;
    
    // Add location context for better results
    const locationContext = countryCode ? ` site:${countryCode.toLowerCase()}` : '';
    const fullQuery = encodeURIComponent(query + locationContext);
    
    // Google Custom Search API endpoint
    // This is the official API that returns what Google Search shows
    const apiUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_CUSTOM_SEARCH_API_KEY}&cx=${GOOGLE_CUSTOM_SEARCH_ENGINE_ID}&q=${fullQuery}&num=10`;
    
    console.log(`[GoogleSearch] Searching Google for: ${query}`);
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      console.warn(`[GoogleSearch] API error: ${response.status}`);
      return prices;
    }

    const data: GoogleSearchResponse = await response.json();

    if (!data.items || data.items.length === 0) {
      console.log('[GoogleSearch] No results found');
      return prices;
    }

    // Extract prices from search results
    // Google Search results include structured data with prices
    data.items.forEach((item, index) => {
      // Try to extract price from structured data (pagemap)
      if (item.pagemap) {
        // Check for offer data (most common for products)
        if (item.pagemap.offer && item.pagemap.offer.length > 0) {
          item.pagemap.offer.forEach(offer => {
            if (offer.price) {
              const price = parseFloat(offer.price);
              if (!isNaN(price) && price > 0 && price < 10000) {
                prices.push({
                  price,
                  currency: offer.pricecurrency || getCurrencyFromCountry(countryCode),
                  retailer: extractRetailerName(item.link),
                  url: item.link,
                  timestamp: Date.now(),
                  source: 'api',
                  verified: false,
                });
              }
            }
          });
        }

        // Check for product data
        if (item.pagemap.product && item.pagemap.product.length > 0) {
          item.pagemap.product.forEach(product => {
            if (product.price) {
              const price = parseFloat(product.price);
              if (!isNaN(price) && price > 0 && price < 10000) {
                prices.push({
                  price,
                  currency: product.pricecurrency || getCurrencyFromCountry(countryCode),
                  retailer: extractRetailerName(item.link),
                  url: item.link,
                  timestamp: Date.now(),
                  source: 'api',
                  verified: false,
                });
              }
            }
          });
        }
      }

      // Also try to extract price from snippet (text description)
      // Google Search snippets often include prices like "$4.99" or "NZD 4.99"
      const snippet = item.snippet || '';
      const priceMatches = snippet.match(/(?:NZ|US|AU|CA|GB|EU)?\$?\s*([\d,]+\.?\d{0,2})/gi);
      if (priceMatches && priceMatches.length > 0) {
        priceMatches.forEach(match => {
          const priceStr = match.replace(/[^\d.]/g, '');
          const price = parseFloat(priceStr);
          if (!isNaN(price) && price > 0 && price < 10000) {
            // Check if we already added this price
            const exists = prices.some(p => 
              Math.abs(p.price - price) < 0.01 && 
              p.url === item.link
            );
            if (!exists) {
              prices.push({
                price,
                currency: getCurrencyFromCountry(countryCode),
                retailer: extractRetailerName(item.link),
                url: item.link,
                timestamp: Date.now(),
                source: 'api',
                verified: false,
              });
            }
          }
        });
      }
    });

    // Remove duplicates and sort by price
    const uniquePrices = removeDuplicates(prices);
    uniquePrices.sort((a, b) => a.price - b.price);

    console.log(`[GoogleSearch] Found ${uniquePrices.length} prices from Google Search results`);
    return uniquePrices.slice(0, 10); // Return top 10 results
  } catch (error) {
    console.error('[GoogleSearch] Error fetching prices:', error);
    return prices;
  }
}

/**
 * Extract retailer name from URL
 */
function extractRetailerName(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    // Remove www. and common TLDs
    let name = hostname.replace(/^www\./, '').split('.')[0];
    
    // Capitalize first letter
    name = name.charAt(0).toUpperCase() + name.slice(1);
    
    return name;
  } catch {
    return 'Online Store';
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
  };
  
  return currencyMap[countryCode || ''] || 'USD';
}

/**
 * Remove duplicate prices (same price, same retailer)
 */
function removeDuplicates(prices: PriceEntry[]): PriceEntry[] {
  const seen = new Set<string>();
  const unique: PriceEntry[] = [];
  
  prices.forEach(price => {
    const key = `${price.price}_${price.retailer}_${price.url || ''}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(price);
    }
  });
  
  return unique;
}

