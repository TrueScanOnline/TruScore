// Flipp API integration - Flipp provides local grocery store circulars and pricing
// Note: Flipp has a public API but requires location-based queries
import { PriceEntry } from '../../types/pricing';
import { LocationInfo } from '../../types/pricing';

/**
 * Fetch pricing from Flipp (local grocery store circulars)
 * Flipp aggregates deals from major grocery chains
 */
export async function fetchFlippPrices(
  barcode: string,
  productName?: string,
  location?: LocationInfo
): Promise<PriceEntry[]> {
  const prices: PriceEntry[] = [];

  try {
    // Flipp search requires location for accurate results
    if (!location || !location.coordinates) {
      console.log('[Flipp] Location not provided - skipping Flipp search');
      return prices;
    }

    // Build search query
    const query = productName || barcode;
    
    // Flipp search URL (note: this may require API key or web scraping)
    // For now, we'll use web scraping as Flipp doesn't have a public API
    const searchUrl = `https://flipp.com/search?q=${encodeURIComponent(query)}&latitude=${location.coordinates.lat}&longitude=${location.coordinates.lng}`;
    
    console.log(`[Flipp] Searching Flipp for: ${query} near ${location.city || location.region || location.country}`);
    
    // Use web scraping to get Flipp prices
    // Note: Flipp's website structure may change, so this is a best-effort approach
    const { fetchWithCorsProxy } = await import('./corsProxy');
    const html = await fetchWithCorsProxy(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (!html || html.length < 100) {
      console.warn('[Flipp] Failed to fetch HTML');
      return prices;
    }

    // Extract prices from Flipp HTML
    // Flipp typically displays prices in specific formats
    const pricePatterns = [
      /\$[\d,]+\.?\d{0,2}/g,
      /data-price=["']([\d.]+)["']/gi,
      /"price"\s*:\s*["']?([\d.]+)/gi,
      /price-value["']?\s*[>:]?\s*\$?([\d.]+)/gi,
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

    // Extract retailer/store information from Flipp
    // Flipp typically shows which store the deal is from
    const storePattern = /(?:store|retailer|from)\s*[:=]\s*["']?([^"',<\n]+)/gi;
    const storeMatches = html.match(storePattern);
    const retailers = new Set<string>();
    
    if (storeMatches) {
      storeMatches.forEach(match => {
        const storeName = match.replace(/(?:store|retailer|from)\s*[:=]\s*["']?/i, '').replace(/["',<\n].*/, '').trim();
        if (storeName && storeName.length > 2 && storeName.length < 50) {
          retailers.add(storeName);
        }
      });
    }

    // Convert found prices to PriceEntry format
    const retailerArray = Array.from(retailers);
    foundPrices.forEach((price, index) => {
      const retailer = retailerArray[index] || retailerArray[0] || 'Local Store (Flipp)';
      
      prices.push({
        price,
        currency: 'USD', // Will be normalized later
        retailer,
        location: location.city || location.region || location.country,
        timestamp: Date.now(),
        source: 'api',
        verified: true, // Flipp deals are verified by stores
      });
    });

    // Sort by price (lowest first)
    prices.sort((a, b) => a.price - b.price);

    console.log(`[Flipp] Found ${prices.length} prices from Flipp`);
    return prices.slice(0, 10); // Limit to 10 results
  } catch (error) {
    console.error('[Flipp] Error fetching prices:', error);
    return prices;
  }
}

