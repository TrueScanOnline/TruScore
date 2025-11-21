// Price.com API integration (via scraping/API when available)
// Price.com provides price comparison data
import { PriceEntry } from '../../types/pricing';
import { fetchWithCorsProxy } from './corsProxy';

/**
 * Fetch pricing from Price.com via web scraping
 * Real-time scraping from Price.com price comparison
 */
export async function fetchPriceComPrices(
  barcode: string,
  productName?: string
): Promise<PriceEntry[]> {
  const prices: PriceEntry[] = [];

  try {
    // Build search query
    const query = productName 
      ? encodeURIComponent(`${productName} ${barcode}`)
      : encodeURIComponent(barcode);
    
    // Price.com search URL
    const searchUrl = `https://www.price.com/search?q=${query}`;
    
    console.log(`[Price.com] Scraping Price.com for: ${query}`);
    
    // Fetch Price.com results using CORS proxy
    const html = await fetchWithCorsProxy(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (!html || html.length < 100) {
      console.warn(`[Price.com] Failed to fetch HTML (length: ${html?.length || 0})`);
      return prices;
    }
    
    // Extract prices from Price.com HTML
    const pricePatterns = [
      /\$\s*[\d,]+\.?\d{0,2}/g,
      /data-price=["']([\d.]+)["']/gi,
      /"price"\s*:\s*["']?([\d.]+)/gi,
    ];
    
    const foundPrices = new Set<number>();
    
    for (const pattern of pricePatterns) {
      const matches = html.match(pattern);
      if (matches) {
        for (const match of matches) {
          const priceStr = match.replace(/[^\d.]/g, '');
          const price = parseFloat(priceStr);
          
          if (!isNaN(price) && price > 0 && price < 10000) {
            foundPrices.add(price);
          }
        }
      }
    }
    
    foundPrices.forEach(price => {
      prices.push({
        price,
        currency: 'USD',
        retailer: 'Price.com',
        timestamp: Date.now(),
        source: 'api',
        verified: false,
      });
    });
    
    prices.sort((a, b) => a.price - b.price);
    
    console.log(`[Price.com] Found ${prices.length} prices`);
    return prices.slice(0, 10); // Limit to 10
  } catch (error) {
    console.error('[Price.com] Error fetching prices:', error);
    return prices;
  }
}

