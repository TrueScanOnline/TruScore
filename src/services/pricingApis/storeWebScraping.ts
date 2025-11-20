// Real-time web scraping for local store prices
// Scrapes store websites directly on the user's device
import { PriceEntry } from '../../types/pricing';
import { StoreLocation } from './localStorePricing';

/**
 * Scrape product price from a store's website
 * Works by fetching the HTML and parsing it for price information
 */
export async function scrapeStoreWebsite(
  barcode: string,
  productName: string,
  store: StoreLocation
): Promise<PriceEntry | null> {
  try {
    // Build store-specific search URL
    const searchUrl = buildStoreSearchUrl(store, barcode, productName);
    
    if (!searchUrl) {
      console.log(`[StoreWebScraping] No search URL for ${store.name}`);
      return null;
    }

    console.log(`[StoreWebScraping] Scraping ${store.name} for ${barcode}: ${searchUrl}`);
    
    // Fetch the page HTML
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      console.warn(`[StoreWebScraping] ${store.name} returned status ${response.status}`);
      return null;
    }

    const html = await response.text();
    
    // Parse price from HTML
    const price = extractPriceFromHTML(html, store.chain || store.name);
    
    if (price && price > 0) {
      return {
        price,
        currency: 'USD', // Will be normalized later
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
 * Build store-specific search URL
 */
function buildStoreSearchUrl(
  store: StoreLocation,
  barcode: string,
  productName: string
): string | null {
  const storeName = (store.chain || store.name || '').toLowerCase();
  
  // Walmart
  if (storeName.includes('walmart')) {
    // Walmart search by UPC
    return `https://www.walmart.com/search?q=${encodeURIComponent(barcode)}`;
  }
  
  // Target
  if (storeName.includes('target')) {
    return `https://www.target.com/s?searchTerm=${encodeURIComponent(barcode)}`;
  }
  
  // Kroger
  if (storeName.includes('kroger')) {
    return `https://www.kroger.com/search?query=${encodeURIComponent(barcode)}`;
  }
  
  // Safeway
  if (storeName.includes('safeway')) {
    return `https://www.safeway.com/shop/search-results.html?q=${encodeURIComponent(barcode)}`;
  }
  
  // Albertsons
  if (storeName.includes('albertsons')) {
    return `https://www.albertsons.com/shop/search-results.html?q=${encodeURIComponent(barcode)}`;
  }
  
  // Whole Foods (Amazon)
  if (storeName.includes('whole foods')) {
    return `https://www.amazon.com/s?k=${encodeURIComponent(barcode)}`;
  }
  
  // Costco
  if (storeName.includes('costco')) {
    return `https://www.costco.com/CatalogSearch?keyword=${encodeURIComponent(barcode)}`;
  }
  
  // Publix
  if (storeName.includes('publix')) {
    return `https://www.publix.com/shop/search-results?q=${encodeURIComponent(barcode)}`;
  }
  
  // Stop & Shop
  if (storeName.includes('stop') || storeName.includes('shop')) {
    return `https://www.stopandshop.com/search?q=${encodeURIComponent(barcode)}`;
  }
  
  // ShopRite
  if (storeName.includes('shoprite')) {
    return `https://www.shoprite.com/sm/planning/rsid/3000/query/${encodeURIComponent(barcode)}`;
  }
  
  // H-E-B
  if (storeName.includes('h-e-b') || storeName.includes('heb')) {
    return `https://www.heb.com/search/?q=${encodeURIComponent(barcode)}`;
  }
  
  // Generic - try Google Shopping
  return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(productName + ' ' + barcode)}`;
}

/**
 * Extract price from HTML using regex patterns
 * Tries multiple patterns to find price
 */
function extractPriceFromHTML(html: string, storeName: string): number | null {
  const storeNameLower = storeName.toLowerCase();
  
  // Common price patterns
  const pricePatterns = [
    // $12.99, $1,234.56
    /\$[\d,]+\.?\d{0,2}/g,
    // USD 12.99
    /USD\s*[\d,]+\.?\d{0,2}/gi,
    // 12.99 (standalone price)
    /(?<!\d)(?:[0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?|[0-9]+\.[0-9]{2})(?!\d)/g,
    // Data attributes
    /data-price=["']([\d.]+)["']/gi,
    /price["']?\s*[:=]\s*["']?([\d.]+)/gi,
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
  
  // Return best price found (if confidence is high enough)
  return bestPriceConfidence >= 2 ? bestPrice : null;
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

