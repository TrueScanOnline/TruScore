// Real-time web scraping for local store prices
// Scrapes store websites directly on the user's device
import { PriceEntry } from '../../types/pricing';
import { StoreLocation } from './localStorePricing';
import { fetchWithCorsProxy } from './corsProxy';
import { matchStoreToChain, buildStoreSearchUrl as buildChainSearchUrl } from './countryStores';

/**
 * Scrape product price from a store's website
 * Works by fetching the HTML and parsing it for price information
 */
export async function scrapeStoreWebsite(
  barcode: string,
  productName: string,
  store: StoreLocation,
  countryCode?: string
): Promise<PriceEntry | null> {
  try {
    // CRITICAL: Must have country code to ensure country-specific filtering
    if (!countryCode) {
      console.warn(`[StoreWebScraping] Country code required for ${store.name} - skipping`);
      return null;
    }

    // Build store-specific search URL using country-specific configuration
    const searchUrl = buildStoreSearchUrl(store, barcode, productName, countryCode);
    
    if (!searchUrl) {
      console.log(`[StoreWebScraping] No search URL for ${store.name} in ${countryCode}`);
      return null;
    }

    // CRITICAL: Validate that search URL is for a country-specific store (not Google Shopping)
    if (searchUrl.includes('google.com/search') || searchUrl.includes('google.com/shopping')) {
      console.warn(`[StoreWebScraping] Rejecting Google Shopping URL for ${store.name} - must use country-specific store`);
      return null;
    }

    console.log(`[StoreWebScraping] Scraping ${store.name} for ${barcode} (${productName}): ${searchUrl}`);
    
    // Fetch the page HTML using CORS proxy to bypass CORS restrictions
    const html = await fetchWithCorsProxy(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    
    // Log HTML length for debugging
    if (html) {
      console.log(`[StoreWebScraping] ${store.name} returned HTML (${html.length} chars)`);
      
      // Debug: Check if HTML contains price-related keywords
      const htmlLower = html.toLowerCase();
      const hasPriceKeywords = htmlLower.includes('price') || htmlLower.includes('$') || htmlLower.includes('nz$');
      const hasProductKeywords = productName && htmlLower.includes(productName.toLowerCase().split(' ')[0]);
      console.log(`[StoreWebScraping] ${store.name} HTML check - has price keywords: ${hasPriceKeywords}, has product keywords: ${hasProductKeywords}`);
    }

    if (!html || html.length < 100) {
      console.warn(`[StoreWebScraping] ${store.name} returned invalid HTML (length: ${html?.length || 0})`);
      return null;
    }
    
    // Determine currency based on country or default to USD
    let currency = 'USD';
    if (countryCode === 'NZ') currency = 'NZD';
    else if (countryCode === 'GB') currency = 'GBP';
    else if (countryCode === 'AU') currency = 'AUD';
    else if (countryCode === 'CA') currency = 'CAD';
    
    // Extract MULTIPLE prices from HTML (improved to get range)
    // Pass product name and barcode for better matching
    const extractedPrices = extractPricesFromHTML(html, store.chain || store.name, productName, barcode);
    
    if (extractedPrices.length > 0) {
      // Return the highest confidence price (most reliable)
      const bestPrice = extractedPrices[0];
      
      // CRITICAL: Validate price using context-based validation (not price value)
      // Check if price has high confidence and proper context
      if (bestPrice.confidence < 5) {
        console.warn(`[StoreWebScraping] ${store.name} returned low confidence price: $${bestPrice.price} (confidence: ${bestPrice.confidence}) - trying alternatives`);
        // Try next best price if available with higher confidence
        if (extractedPrices.length > 1) {
          for (let i = 1; i < Math.min(extractedPrices.length, 5); i++) {
            const candidate = extractedPrices[i];
            if (candidate.confidence >= 5) {
              console.log(`[StoreWebScraping] Using higher confidence alternative: $${candidate.price} (confidence: ${candidate.confidence})`);
              return {
                price: candidate.price,
                currency,
                retailer: store.name,
                location: store.address,
                timestamp: Date.now(),
                source: 'api',
                verified: true,
              };
            }
          }
        }
        console.warn(`[StoreWebScraping] ${store.name} - No high confidence prices found in ${extractedPrices.length} candidates`);
        // Still return the best price if we have one, even if low confidence
      }
      
      console.log(`[StoreWebScraping] ✅ ${store.name}: Found price $${bestPrice.price} (confidence: ${bestPrice.confidence})`);
      
      return {
        price: bestPrice.price,
        currency, // Will be normalized later
        retailer: store.name,
        location: store.address,
        timestamp: Date.now(),
        source: 'api', // Scraped from official website
        verified: true,
      };
    }

    console.log(`[StoreWebScraping] No price found for ${barcode} at ${store.name}`);
    return null;
  } catch (error) {
    console.error(`[StoreWebScraping] Error scraping ${store.name}:`, error);
    return null;
  }
}

/**
 * Build store-specific search URL using country-specific chain configuration
 */
function buildStoreSearchUrl(
  store: StoreLocation,
  barcode: string,
  productName: string,
  countryCode?: string
): string | null {
  const storeName = store.chain || store.name || '';
  
  // Try to match store to configured chain
  try {
    const chain = matchStoreToChain(storeName, countryCode);
    if (chain) {
      const url = buildChainSearchUrl(chain, barcode, productName);
      if (url) {
        return url;
      }
    }
  } catch (error) {
    // Fallback if chain matching fails
    console.log(`[StoreWebScraping] Chain matching failed, using fallback`);
  }
  
  // NO FALLBACK - Return null if no store-specific URL found
  // This ensures we only use country-specific stores, not international Google Shopping
  console.warn(`[StoreWebScraping] No search URL configured for store: ${storeName} in country: ${countryCode || 'unknown'}`);
  return null;
}

/**
 * Extract MULTIPLE prices from HTML (not just one)
 * Returns array of potential prices with confidence scores
 */
function extractPricesFromHTML(html: string, storeName: string, productName?: string, barcode?: string): Array<{ price: number; confidence: number }> {
  const prices: Array<{ price: number; confidence: number }> = [];
  const storeNameLower = storeName.toLowerCase();
  const productNameLower = productName?.toLowerCase() || '';
  
  // Common price patterns - prioritize patterns with currency symbols
  const pricePatterns = [
    // $12.99, $1,234.56 (most reliable)
    { pattern: /\$[\d,]+\.?\d{0,2}/g, baseConfidence: 5 },
    // $ 12.99 (with space)
    { pattern: /\$\s*[\d,]+\.?\d{0,2}/g, baseConfidence: 5 },
    // NZ$12.99, US$12.99
    { pattern: /(NZ|US|AU|CA|GB|EU)\$[\d,]+\.?\d{0,2}/gi, baseConfidence: 6 },
    // USD 12.99, EUR 12.99
    { pattern: /(USD|EUR|GBP|CAD|AUD|NZD)\s*[\d,]+\.?\d{0,2}/gi, baseConfidence: 6 },
    // Data attributes (common in e-commerce)
    { pattern: /data-price=["']([\d.]+)["']/gi, baseConfidence: 7 },
    { pattern: /data-price-amount=["']([\d.]+)["']/gi, baseConfidence: 7 },
    { pattern: /price["']?\s*[:=]\s*["']?([\d.]+)/gi, baseConfidence: 6 },
    // JSON-LD structured data (common in e-commerce)
    { pattern: /"price"\s*:\s*["']?([\d.]+)/gi, baseConfidence: 8 },
    { pattern: /"lowPrice"\s*:\s*["']?([\d.]+)/gi, baseConfidence: 7 },
    { pattern: /"highPrice"\s*:\s*["']?([\d.]+)/gi, baseConfidence: 7 },
    { pattern: /"offers"\s*:\s*\{[^}]*"price"\s*:\s*["']?([\d.]+)/gi, baseConfidence: 9 },
  ];
  
  // New Zealand supermarket-specific patterns
  if (storeNameLower.includes('woolworths') || storeNameLower.includes('countdown')) {
    // Woolworths/Countdown NZ patterns
    pricePatterns.push(
      { pattern: /class="[^"]*price[^"]*"[^>]*>[\s\S]*?\$?([\d,]+\.?\d{0,2})/gi, baseConfidence: 9 },
      { pattern: /data-price=["']([\d.]+)["']/gi, baseConfidence: 9 },
      { pattern: /"price"\s*:\s*"([\d.]+)"/gi, baseConfidence: 9 }
    );
  }
  if (storeNameLower.includes('pak') || storeNameLower.includes('pack n save')) {
    // Pak'nSave NZ patterns
    pricePatterns.push(
      { pattern: /class="[^"]*product-price[^"]*"[^>]*>[\s\S]*?\$?([\d,]+\.?\d{0,2})/gi, baseConfidence: 9 },
      { pattern: /data-price=["']([\d.]+)["']/gi, baseConfidence: 9 }
    );
  }
  if (storeNameLower.includes('new world')) {
    // New World NZ patterns
    pricePatterns.push(
      { pattern: /class="[^"]*price[^"]*"[^>]*>[\s\S]*?\$?([\d,]+\.?\d{0,2})/gi, baseConfidence: 9 },
      { pattern: /"price"\s*:\s*"([\d.]+)"/gi, baseConfidence: 9 }
    );
  }
  if (storeNameLower.includes('fresh choice')) {
    // Fresh Choice NZ patterns
    pricePatterns.push(
      { pattern: /class="[^"]*price[^"]*"[^>]*>[\s\S]*?\$?([\d,]+\.?\d{0,2})/gi, baseConfidence: 9 }
    );
  }
  
  // Store-specific high-confidence patterns
  if (storeNameLower.includes('walmart')) {
    pricePatterns.push({ pattern: /data-automation-id="product-price"[^>]*>[\s\S]*?\$([\d.]+)/gi, baseConfidence: 9 });
  }
  if (storeNameLower.includes('target')) {
    pricePatterns.push({ pattern: /"current_retail"\s*:\s*"([\d.]+)"/, baseConfidence: 9 });
  }
  if (storeNameLower.includes('amazon') || storeNameLower.includes('whole foods')) {
    pricePatterns.push({ pattern: /a-price-whole[^>]*>([\d,]+)/, baseConfidence: 9 });
  }
  
  for (const { pattern, baseConfidence } of pricePatterns) {
    const matches = html.match(pattern);
    if (matches) {
      for (const match of matches) {
        // Extract numeric value
        const priceStr = match.replace(/[^\d.]/g, '');
        const price = parseFloat(priceStr);
        
        // Validate price is a number and within reasonable bounds
        // Do NOT filter by minimum price value - products can legitimately be very cheap
        if (isNaN(price) || price <= 0 || price > 10000) {
          continue;
        }
        
        // Look for context clues
        const matchIndex = html.indexOf(match);
        const contextBefore = html.substring(Math.max(0, matchIndex - 200), matchIndex).toLowerCase();
        const contextAfter = html.substring(matchIndex, matchIndex + 200).toLowerCase();
        const context = contextBefore + contextAfter;
        
        let confidence = baseConfidence;
        
        // Higher confidence if near price-related keywords
        if (context.includes('price') || context.includes('cost') || context.includes('$') || context.includes('nz$')) {
          confidence += 2;
        }
        
        // Higher confidence if near product info
        if (context.includes('product') || context.includes('item') || context.includes('add to cart')) {
          confidence += 1;
        }
        
        // MUCH higher confidence if product name or barcode appears near the price
        if (productNameLower && context.includes(productNameLower.split(' ')[0])) {
          confidence += 5; // Strong indicator this is the right product
        }
        if (barcode && context.includes(barcode)) {
          confidence += 10; // Very strong indicator - barcode match
        }
        
        // Lower confidence if near non-price numbers
        if (context.includes('quantity') || context.includes('stock') || context.includes('sku') || context.includes('weight')) {
          confidence -= 2;
        }
        
        // Lower confidence if near shipping/delivery costs
        if (context.includes('shipping') || context.includes('delivery') || context.includes('fee')) {
          confidence -= 3;
        }
        
        // Avoid duplicates (within 1 cent)
        const existing = prices.find(p => Math.abs(p.price - price) < 0.01);
        if (!existing) {
          prices.push({ price, confidence });
        } else if (confidence > existing.confidence) {
          existing.confidence = confidence;
        }
      }
    }
  }
  
  // Sort by confidence and return top prices
  // Filter out prices with very low confidence (< 3) unless we have no other options
  const sortedPrices = prices.sort((a, b) => b.confidence - a.confidence);
  const highConfidencePrices = sortedPrices.filter(p => p.confidence >= 3);
  
  // Log what we found for debugging
  if (prices.length > 0) {
    console.log(`[StoreWebScraping] Extracted ${prices.length} price candidates for ${storeName}:`, 
      sortedPrices.slice(0, 5).map(p => `$${p.price} (conf: ${p.confidence})`).join(', '));
  } else {
    console.log(`[StoreWebScraping] No prices extracted from HTML for ${storeName} - patterns may not match HTML structure`);
  }
  
  // Return high confidence prices, or all prices if none are high confidence
  return highConfidencePrices.length > 0 ? highConfidencePrices : sortedPrices.slice(0, 5);
}

/**
 * Extract price from HTML using regex patterns (backward compatibility)
 * Returns single best price
 */
function extractPriceFromHTML(html: string, storeName: string): number | null {
  const storeNameLower = storeName.toLowerCase();
  
  // Common price patterns - prioritize patterns with currency symbols
  const pricePatterns = [
    // $12.99, $1,234.56 (most reliable)
    /\$[\d,]+\.?\d{0,2}/g,
    // $ 12.99 (with space)
    /\$\s*[\d,]+\.?\d{0,2}/g,
    // USD 12.99
    /USD\s*[\d,]+\.?\d{0,2}/gi,
    // EUR, GBP, etc.
    /(EUR|GBP|CAD|AUD)\s*[\d,]+\.?\d{0,2}/gi,
    // Data attributes (common in e-commerce)
    /data-price=["']([\d.]+)["']/gi,
    /data-price-amount=["']([\d.]+)["']/gi,
    /price["']?\s*[:=]\s*["']?([\d.]+)/gi,
    // JSON-LD structured data (common in e-commerce)
    /"price"\s*:\s*["']?([\d.]+)/gi,
    /"lowPrice"\s*:\s*["']?([\d.]+)/gi,
    /"highPrice"\s*:\s*["']?([\d.]+)/gi,
    // Standalone price (less reliable, use as last resort)
    /(?<!\d)(?:[0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?|[0-9]+\.[0-9]{2})(?!\d)/g,
  ];
  
  let bestPrice: number | null = null;
  let bestPriceConfidence = 0;
  
  for (const pattern of pricePatterns) {
    const matches = html.match(pattern);
    if (matches) {
      for (const match of matches) {
        // Extract numeric value
        const priceStr = match.replace(/[^\d.]/g, '');
        const price = parseFloat(priceStr);
        
        if (!isNaN(price) && price > 0 && price < 10000) {
          // Reasonable price range check
          // Look for context clues
          const matchIndex = html.indexOf(match);
          const context = html.substring(Math.max(0, matchIndex - 50), matchIndex + 50).toLowerCase();
          
          let confidence = 1;
          
          // Higher confidence if near price-related keywords
          if (context.includes('price') || context.includes('cost') || context.includes('$')) {
            confidence += 2;
          }
          
          // Higher confidence if near product info
          if (context.includes('product') || context.includes('item')) {
            confidence += 1;
          }
          
          // Lower confidence if near non-price numbers
          if (context.includes('quantity') || context.includes('stock') || context.includes('sku')) {
            confidence -= 1;
          }
          
          // Store-specific patterns
          if (storeNameLower.includes('walmart')) {
            // Walmart specific patterns
            if (html.includes('data-automation-id="product-price"')) {
              const walmartMatch = html.match(/data-automation-id="product-price"[^>]*>[\s\S]*?\$([\d.]+)/i);
              if (walmartMatch) {
                const walmartPrice = parseFloat(walmartMatch[1]);
                if (!isNaN(walmartPrice)) return walmartPrice;
              }
            }
          }
          
          if (storeNameLower.includes('target')) {
            // Target specific patterns
            const targetMatch = html.match(/"current_retail"\s*:\s*"([\d.]+)"/);
            if (targetMatch) {
              const targetPrice = parseFloat(targetMatch[1]);
              if (!isNaN(targetPrice)) return targetPrice;
            }
          }
          
          if (storeNameLower.includes('amazon') || storeNameLower.includes('whole foods')) {
            // Amazon/Whole Foods patterns
            const amazonMatch = html.match(/a-price-whole[^>]*>([\d,]+)/);
            if (amazonMatch) {
              const amazonPrice = parseFloat(amazonMatch[1].replace(/,/g, ''));
              if (!isNaN(amazonPrice)) {
                // Look for cents
                const centsMatch = html.match(/a-price-fraction[^>]*>(\d+)/);
                const cents = centsMatch ? parseFloat(centsMatch[1]) / 100 : 0;
                return amazonPrice + cents;
              }
            }
          }
          
          if (confidence > bestPriceConfidence) {
            bestPrice = price;
            bestPriceConfidence = confidence;
          }
        }
      }
    }
  }
  
  // Return best price found (lower threshold to get more results)
  // If we found a price with confidence >= 1, return it
  return bestPriceConfidence >= 1 ? bestPrice : null;
}

/**
 * Scrape prices from multiple stores in parallel
 */
export async function scrapeMultipleStores(
  barcode: string,
  productName: string,
  stores: StoreLocation[]
): Promise<PriceEntry[]> {
  const prices: PriceEntry[] = [];
  
  // Limit to first 10 stores to avoid too many requests
  const storesToScrape = stores.slice(0, 10);
  
  console.log(`[StoreWebScraping] Scraping ${storesToScrape.length} stores for ${barcode}`);
  
  // Scrape in parallel (but limit concurrent requests)
  const scrapePromises = storesToScrape.map(store =>
    scrapeStoreWebsite(barcode, productName, store)
      .catch(error => {
        console.warn(`[StoreWebScraping] Error scraping ${store.name}:`, error);
        return null;
      })
  );
  
  const results = await Promise.allSettled(scrapePromises);
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      prices.push(result.value);
      console.log(`[StoreWebScraping] Found price $${result.value.price} at ${storesToScrape[index].name}`);
    }
  });
  
  console.log(`[StoreWebScraping] Scraped ${prices.length} prices from ${storesToScrape.length} stores`);
  
  return prices;
}

