// Enhanced store scraping with better pattern matching and fallback mechanisms
// Handles JavaScript-rendered content via service-based approach
import { PriceEntry } from '../../types/pricing';
import { StoreLocation } from './localStorePricing';
import { fetchWithCorsProxy } from './corsProxy';
import { matchStoreToChain, buildStoreSearchUrl as buildChainSearchUrl } from './countryStores';

/**
 * Enhanced scraping with multiple pattern strategies and fallback mechanisms
 */
export async function scrapeStoreWebsiteEnhanced(
  barcode: string,
  productName: string,
  store: StoreLocation,
  countryCode?: string
): Promise<PriceEntry | null> {
  try {
    if (!countryCode) {
      console.warn(`[EnhancedScraping] Country code required for ${store.name}`);
      return null;
    }

    const searchUrl = buildStoreSearchUrl(store, barcode, productName, countryCode);
    if (!searchUrl) {
      return null;
    }

    console.log(`[EnhancedScraping] Scraping ${store.name} for ${barcode}: ${searchUrl}`);

    // Try multiple scraping strategies
    // Order: Advanced parsing first (better pattern matching), then direct fetch
    const strategies = [
      () => scrapeWithAdvancedParsing(searchUrl, store, productName, barcode, countryCode),
      () => scrapeWithDirectFetch(searchUrl, store, productName, barcode, countryCode),
    ];

    for (const strategy of strategies) {
      try {
        const result = await strategy();
        if (result) {
          return result;
        }
      } catch (error) {
        console.warn(`[EnhancedScraping] Strategy failed:`, error);
      }
    }

    return null;
  } catch (error) {
    console.error(`[EnhancedScraping] Error:`, error);
    return null;
  }
}

/**
 * Direct fetch strategy (current approach)
 */
async function scrapeWithDirectFetch(
  url: string,
  store: StoreLocation,
  productName: string,
  barcode: string,
  countryCode: string
): Promise<PriceEntry | null> {
  const html = await fetchWithCorsProxy(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  if (!html || html.length < 100) {
    return null;
  }

  const prices = extractPricesWithEnhancedPatterns(html, store.name, productName, barcode);
  if (prices.length === 0) {
    return null;
  }

  const bestPrice = prices[0];
  if (bestPrice.confidence < 6) {
    return null; // Require higher confidence
  }

  let currency = 'USD';
  if (countryCode === 'NZ') currency = 'NZD';
  else if (countryCode === 'GB') currency = 'GBP';
  else if (countryCode === 'AU') currency = 'AUD';
  else if (countryCode === 'CA') currency = 'CAD';

  return {
    price: bestPrice.price,
    currency,
    retailer: store.name,
    location: store.address,
    timestamp: Date.now(),
    source: 'api',
    verified: true,
  };
}

/**
 * Advanced HTML parsing strategy
 * Uses multiple fetch attempts with different user agents and headers
 * Tries to extract data from JSON-LD, microdata, and various HTML structures
 */
async function scrapeWithAdvancedParsing(
  url: string,
  store: StoreLocation,
  productName: string,
  barcode: string,
  countryCode: string
): Promise<PriceEntry | null> {
  try {
    console.log(`[EnhancedScraping] Using advanced parsing for ${store.name}`);
    
    // Try multiple user agents to get different HTML responses
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    ];

    for (const userAgent of userAgents) {
      try {
        const html = await fetchWithCorsProxy(url, {
          headers: {
            'User-Agent': userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        });

        if (!html || html.length < 100) {
          continue;
        }

        // Try to extract from JSON-LD structured data first (most reliable)
        const jsonLdPrices = extractFromJsonLd(html, productName, barcode);
        if (jsonLdPrices.length > 0) {
          const bestPrice = jsonLdPrices[0];
          let currency = 'USD';
          if (countryCode === 'NZ') currency = 'NZD';
          else if (countryCode === 'GB') currency = 'GBP';
          else if (countryCode === 'AU') currency = 'AUD';
          else if (countryCode === 'CA') currency = 'CAD';

          console.log(`[EnhancedScraping] ✅ Found price from JSON-LD: $${bestPrice.price} for ${store.name}`);
          return {
            price: bestPrice.price,
            currency,
            retailer: store.name,
            location: store.address,
            timestamp: Date.now(),
            source: 'api',
            verified: true,
          };
        }

        // Fallback to enhanced pattern matching
        const prices = extractPricesWithEnhancedPatterns(html, store.name, productName, barcode);
        if (prices.length > 0 && prices[0].confidence >= 8) {
          const bestPrice = prices[0];
          let currency = 'USD';
          if (countryCode === 'NZ') currency = 'NZD';
          else if (countryCode === 'GB') currency = 'GBP';
          else if (countryCode === 'AU') currency = 'AUD';
          else if (countryCode === 'CA') currency = 'CAD';

          console.log(`[EnhancedScraping] ✅ Found price with high confidence: $${bestPrice.price} (conf: ${bestPrice.confidence}) for ${store.name}`);
          return {
            price: bestPrice.price,
            currency,
            retailer: store.name,
            location: store.address,
            timestamp: Date.now(),
            source: 'api',
            verified: true,
          };
        }
      } catch (error) {
        console.log(`[EnhancedScraping] User agent ${userAgent.substring(0, 30)}... failed, trying next`);
        continue;
      }
    }

    return null;
  } catch (error) {
    console.warn(`[EnhancedScraping] Advanced parsing failed for ${store.name}:`, error);
    return null;
  }
}

/**
 * Extract prices from JSON-LD structured data
 * This is the most reliable method as it's machine-readable
 */
function extractFromJsonLd(html: string, productName?: string, barcode?: string): Array<{ price: number; confidence: number }> {
  const prices: Array<{ price: number; confidence: number }> = [];
  
  // Find all JSON-LD script tags
  const jsonLdPattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const matches = html.match(jsonLdPattern);
  
  if (!matches) {
    return prices;
  }

  for (const match of matches) {
    try {
      // Extract JSON content
      const jsonMatch = match.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
      if (!jsonMatch) continue;

      const jsonStr = jsonMatch[1].trim();
      let jsonData: any;

      // Handle both single objects and arrays
      if (jsonStr.startsWith('[')) {
        jsonData = JSON.parse(jsonStr);
      } else {
        jsonData = [JSON.parse(jsonStr)];
      }

      for (const item of Array.isArray(jsonData) ? jsonData : [jsonData]) {
        // Check if it's a Product schema
        if (item['@type'] === 'Product' || item['@type'] === 'http://schema.org/Product' || item['@type'] === 'https://schema.org/Product') {
          // Extract price from offers
          if (item.offers) {
            const offers = Array.isArray(item.offers) ? item.offers : [item.offers];
            for (const offer of offers) {
              if (offer.price !== undefined) {
                const price = typeof offer.price === 'string' ? parseFloat(offer.price) : offer.price;
                if (!isNaN(price) && price > 0 && price < 10000) {
                  // High confidence for JSON-LD
                  let confidence = 10;
                  
                  // Boost confidence if product name or barcode matches
                  if (productName && item.name && item.name.toLowerCase().includes(productName.toLowerCase().split(' ')[0])) {
                    confidence += 5;
                  }
                  if (barcode && item.gtin13 === barcode) {
                    confidence += 10;
                  }
                  
                  prices.push({ price, confidence });
                }
              }
            }
          }
          
          // Also check for aggregateOffer (price range)
          if (item.aggregateOffer) {
            if (item.aggregateOffer.lowPrice) {
              const price = typeof item.aggregateOffer.lowPrice === 'string' 
                ? parseFloat(item.aggregateOffer.lowPrice) 
                : item.aggregateOffer.lowPrice;
              if (!isNaN(price) && price > 0 && price < 10000) {
                prices.push({ price, confidence: 9 });
              }
            }
          }
        }
      }
    } catch (error) {
      // Invalid JSON, skip
      continue;
    }
  }

  return prices.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Enhanced price extraction with store-specific patterns
 */
function extractPricesWithEnhancedPatterns(
  html: string,
  storeName: string,
  productName?: string,
  barcode?: string
): Array<{ price: number; confidence: number }> {
  const prices: Array<{ price: number; confidence: number }> = [];
  const storeNameLower = storeName.toLowerCase();
  const productNameLower = productName?.toLowerCase() || '';
  const productKeywords = productNameLower.split(' ').filter(w => w.length > 3);

  // Enhanced patterns for NZ supermarkets based on common e-commerce structures
  const patterns = getStoreSpecificPatterns(storeNameLower);

  // Debug: Log sample HTML snippets to understand structure
  if (html.length > 0) {
    // Find first occurrence of common price-related terms
    const priceIndicators = ['price', '$', 'nz$', 'cost'];
    for (const indicator of priceIndicators) {
      const index = html.toLowerCase().indexOf(indicator);
      if (index !== -1) {
        const snippet = html.substring(Math.max(0, index - 100), Math.min(html.length, index + 200));
        console.log(`[EnhancedScraping] HTML snippet near "${indicator}" for ${storeName}: ${snippet.substring(0, 150)}...`);
        break; // Only log first occurrence
      }
    }
  }

  for (const { pattern, baseConfidence, extractValue } of patterns) {
    const matches = html.match(pattern);
    if (matches) {
      console.log(`[EnhancedScraping] Pattern matched ${matches.length} times for ${storeName}`);
      for (const match of matches) {
        const priceStr = extractValue ? extractValue(match) : match.replace(/[^\d.]/g, '');
        const price = parseFloat(priceStr);

        if (isNaN(price) || price <= 0 || price > 10000) {
          continue;
        }

        // Context-based validation (not price-based)
        const matchIndex = html.indexOf(match);
        const context = html.substring(
          Math.max(0, matchIndex - 300),
          Math.min(html.length, matchIndex + 300)
        ).toLowerCase();

        let confidence = baseConfidence;

        // Boost confidence based on context
        confidence += getContextConfidence(context, productKeywords, barcode, storeNameLower);

        // Avoid duplicates
        const existing = prices.find(p => Math.abs(p.price - price) < 0.01);
        if (!existing) {
          prices.push({ price, confidence });
        } else if (confidence > existing.confidence) {
          existing.confidence = confidence;
        }
      }
    }
  }

  const sorted = prices.sort((a, b) => b.confidence - a.confidence);
  
  // Log what we found for debugging
  if (sorted.length > 0) {
    console.log(`[EnhancedScraping] Extracted ${sorted.length} price candidates for ${storeName}:`, 
      sorted.slice(0, 5).map(p => `$${p.price} (conf: ${p.confidence})`).join(', '));
  } else {
    console.log(`[EnhancedScraping] No prices extracted from HTML for ${storeName} - trying to find any price-like numbers`);
    // Last resort: look for any number that looks like a price (between $1 and $1000)
    const anyPricePattern = /\$?\s*([\d,]+\.?\d{2})/g;
    const anyMatches = html.match(anyPricePattern);
    if (anyMatches) {
      console.log(`[EnhancedScraping] Found ${anyMatches.length} price-like numbers in HTML for ${storeName}`);
      // Try to extract reasonable prices
      for (const match of anyMatches.slice(0, 20)) { // Limit to first 20
        const priceStr = match.replace(/[^\d.]/g, '');
        const price = parseFloat(priceStr);
        if (!isNaN(price) && price >= 1 && price <= 1000) {
          const matchIndex = html.indexOf(match);
          const context = html.substring(Math.max(0, matchIndex - 100), Math.min(html.length, matchIndex + 100)).toLowerCase();
          // Only add if it's not clearly a date, quantity, or other non-price number
          if (!context.includes('quantity') && !context.includes('stock') && !context.includes('sku') && 
              !context.includes('weight') && !context.includes('kg') && !context.includes('g') &&
              (context.includes('price') || context.includes('$') || context.includes('cost'))) {
            sorted.push({ price, confidence: 3 });
            console.log(`[EnhancedScraping] Added fallback price: $${price} for ${storeName}`);
          }
        }
      }
    }
  }
  
  return sorted.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Get store-specific patterns with higher confidence
 */
function getStoreSpecificPatterns(storeNameLower: string): Array<{
  pattern: RegExp;
  baseConfidence: number;
  extractValue?: (match: string) => string;
}> {
  const patterns: Array<{ pattern: RegExp; baseConfidence: number; extractValue?: (match: string) => string }> = [];

  // New World specific patterns
  if (storeNameLower.includes('new world')) {
    patterns.push(
      { pattern: /<span[^>]*class="[^"]*price[^"]*"[^>]*>[\s\S]{0,200}?\$?([\d,]+\.?\d{0,2})/gi, baseConfidence: 10 },
      { pattern: /"price"\s*:\s*"([\d.]+)"/gi, baseConfidence: 9 },
      { pattern: /data-price=["']([\d.]+)["']/gi, baseConfidence: 9 },
      { pattern: /price-amount[^>]*>[\s\S]{0,100}?\$?([\d,]+\.?\d{0,2})/gi, baseConfidence: 9 }
    );
  }

  // Pak'nSave specific patterns (based on actual site structure)
  if (storeNameLower.includes('pak') || storeNameLower.includes('pack n save')) {
    patterns.push(
      // JSON-LD structured data
      { pattern: /"@type"\s*:\s*"Product"[\s\S]{0,5000}?"price"\s*:\s*"([\d.]+)"/gi, baseConfidence: 12 },
      { pattern: /"offers"\s*:\s*\{[\s\S]{0,500}?"price"\s*:\s*"([\d.]+)"/gi, baseConfidence: 11 },
      // Product price classes
      { pattern: /product-price[^>]*>[\s\S]{0,200}?\$?([\d,]+\.?\d{0,2})/gi, baseConfidence: 10 },
      { pattern: /class="[^"]*product[^"]*price[^"]*"[^>]*>[\s\S]{0,200}?\$?([\d,]+\.?\d{0,2})/gi, baseConfidence: 10 },
      // Data attributes
      { pattern: /data-price=["']([\d.]+)["']/gi, baseConfidence: 9 },
      { pattern: /data-product-price=["']([\d.]+)["']/gi, baseConfidence: 9 },
      // Generic patterns
      { pattern: /<span[^>]*class="[^"]*price[^"]*"[^>]*>[\s\S]{0,200}?\$?([\d,]+\.?\d{0,2})/gi, baseConfidence: 8 },
      { pattern: /"price"\s*:\s*"([\d.]+)"/gi, baseConfidence: 8 }
    );
  }

  // Countdown/Woolworths NZ patterns (based on actual site structure)
  if (storeNameLower.includes('countdown') || storeNameLower.includes('woolworths')) {
    patterns.push(
      // JSON-LD structured data
      { pattern: /"@type"\s*:\s*"Product"[\s\S]{0,5000}?"price"\s*:\s*"([\d.]+)"/gi, baseConfidence: 12 },
      { pattern: /"offers"\s*:\s*\{[\s\S]{0,500}?"price"\s*:\s*"([\d.]+)"/gi, baseConfidence: 11 },
      // Price value classes
      { pattern: /price-value[^>]*>[\s\S]{0,200}?\$?([\d,]+\.?\d{0,2})/gi, baseConfidence: 10 },
      { pattern: /class="[^"]*price[^"]*value[^"]*"[^>]*>[\s\S]{0,200}?\$?([\d,]+\.?\d{0,2})/gi, baseConfidence: 10 },
      // Data attributes
      { pattern: /data-price=["']([\d.]+)["']/gi, baseConfidence: 9 },
      { pattern: /data-product-price=["']([\d.]+)["']/gi, baseConfidence: 9 },
      // Generic patterns
      { pattern: /<span[^>]*class="[^"]*price[^"]*"[^>]*>[\s\S]{0,200}?\$?([\d,]+\.?\d{0,2})/gi, baseConfidence: 8 },
      { pattern: /"price"\s*:\s*"([\d.]+)"/gi, baseConfidence: 8 }
    );
  }

  // Fresh Choice patterns
  if (storeNameLower.includes('fresh choice')) {
    patterns.push(
      { pattern: /<span[^>]*class="[^"]*price[^"]*"[^>]*>[\s\S]{0,200}?\$?([\d,]+\.?\d{0,2})/gi, baseConfidence: 9 },
      { pattern: /"price"\s*:\s*"([\d.]+)"/gi, baseConfidence: 9 }
    );
  }

  // Generic patterns (lower confidence, used as fallback)
  // These should catch most common price formats
  patterns.push(
    // Currency symbols with numbers
    { pattern: /(NZ|US|AU|CA|GB|EU)\$[\d,]+\.?\d{0,2}/gi, baseConfidence: 6 },
    { pattern: /\$[\d,]+\.?\d{0,2}/g, baseConfidence: 5 },
    // JSON patterns
    { pattern: /"price"\s*:\s*["']?([\d.]+)/gi, baseConfidence: 7 },
    { pattern: /"price"\s*:\s*([\d.]+)/gi, baseConfidence: 7 },
    // Data attributes
    { pattern: /data-price=["']([\d.]+)["']/gi, baseConfidence: 7 },
    { pattern: /data-price=([\d.]+)/gi, baseConfidence: 6 },
    // More flexible patterns for common e-commerce structures
    { pattern: /price["']?\s*[:=]\s*["']?([\d.]+)/gi, baseConfidence: 6 },
    { pattern: /price\s*:\s*([\d.]+)/gi, baseConfidence: 6 },
    // Look for numbers near price-related text
    { pattern: /(?:price|cost|amount)[^>]*>[\s\S]{0,50}?([\d,]+\.?\d{0,2})/gi, baseConfidence: 5 },
    // Generic dollar sign patterns (most flexible)
    { pattern: /\$\s*([\d,]+\.?\d{0,2})/g, baseConfidence: 4 },
    { pattern: /([\d,]+\.?\d{2})\s*(?:NZD|USD|AUD|CAD|GBP|EUR)/gi, baseConfidence: 5 }
  );

  return patterns;
}

/**
 * Context-based confidence scoring (not price-based)
 */
function getContextConfidence(
  context: string,
  productKeywords: string[],
  barcode?: string,
  storeName?: string
): number {
  let confidence = 0;

  // High confidence if product keywords appear near price
  for (const keyword of productKeywords) {
    if (context.includes(keyword)) {
      confidence += 3;
      break;
    }
  }

  // Very high confidence if barcode appears
  if (barcode && context.includes(barcode)) {
    confidence += 10;
  }

  // High confidence if price-related keywords
  if (context.includes('price') || context.includes('cost') || context.includes('$') || context.includes('nz$')) {
    confidence += 2;
  }

  // High confidence if product-related keywords
  if (context.includes('product') || context.includes('item') || context.includes('add to cart') || context.includes('buy')) {
    confidence += 2;
  }

  // Lower confidence if near non-price numbers
  if (context.includes('quantity') || context.includes('stock') || context.includes('sku') || context.includes('weight') || context.includes('kg')) {
    confidence -= 3;
  }

  // Lower confidence if near shipping/delivery
  if (context.includes('shipping') || context.includes('delivery') || context.includes('fee') || context.includes('postage')) {
    confidence -= 4;
  }

  // Lower confidence if near promotional text
  if (context.includes('save') || context.includes('off') || context.includes('discount') || context.includes('%')) {
    confidence -= 1;
  }

  return confidence;
}

/**
 * Build store search URL
 */
function buildStoreSearchUrl(
  store: StoreLocation,
  barcode: string,
  productName: string,
  countryCode?: string
): string | null {
  const storeName = store.chain || store.name || '';
  try {
    const chain = matchStoreToChain(storeName, countryCode);
    if (chain) {
      const url = buildChainSearchUrl(chain, barcode, productName);
      if (url) {
        return url;
      }
    }
  } catch (error) {
    console.log(`[EnhancedScraping] Chain matching failed`);
  }
  return null;
}

