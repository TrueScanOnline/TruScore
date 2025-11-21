// Additional pricing sources via web scraping
// These provide more diverse pricing data from various online retailers
import { PriceEntry } from '../../types/pricing';
import { fetchWithCorsProxy } from './corsProxy';

/**
 * Fetch prices from multiple additional sources via web scraping
 * This aggregates prices from various online retailers and comparison sites
 */
export async function fetchAdditionalPricingSources(
  barcode: string,
  productName?: string
): Promise<PriceEntry[]> {
  const allPrices: PriceEntry[] = [];

  // Fetch from multiple sources in parallel - EXPANDED for larger dataset
  const sourcePromises: Promise<PriceEntry[]>[] = [
    // Major retailers (web scraping)
    fetchTargetPrices(barcode, productName).catch(() => []),
    fetchBestBuyPrices(barcode, productName).catch(() => []),
    fetchCostcoPrices(barcode, productName).catch(() => []),
    fetchOverstockPrices(barcode, productName).catch(() => []),
    fetchBHPhotoPrices(barcode, productName).catch(() => []),
    
    // Additional grocery retailers
    fetchKrogerPrices(barcode, productName).catch(() => []),
    fetchSafewayPrices(barcode, productName).catch(() => []),
    fetchHomeDepotPrices(barcode, productName).catch(() => []),
    fetchLowesPrices(barcode, productName).catch(() => []),
    
    // More comparison sites (Nextag and Shopzilla removed - sites no longer active)
    fetchBingShoppingPrices(barcode, productName).catch(() => []),
  ];

  const results = await Promise.allSettled(sourcePromises);
  
  results.forEach(result => {
    if (result.status === 'fulfilled' && result.value) {
      allPrices.push(...result.value);
    }
  });

  console.log(`[AdditionalPricing] Found ${allPrices.length} prices from additional sources`);
  return allPrices;
}

/**
 * Fetch prices from Target website
 */
async function fetchTargetPrices(barcode: string, productName?: string): Promise<PriceEntry[]> {
  const prices: PriceEntry[] = [];
  
  try {
    const query = encodeURIComponent(productName || barcode);
    const url = `https://www.target.com/s?searchTerm=${query}`;
    
    const html = await fetchWithCorsProxy(url);
    if (!html) return prices;

    // Extract prices from Target HTML
    const pricePatterns = [
      /\$[\d,]+\.?\d{0,2}/g,
      /data-test="product-price"[^>]*>[\s\S]*?\$[\d,]+\.?\d{0,2}/gi,
      /"current_retail"\s*:\s*([\d.]+)/gi,
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
        retailer: 'Target',
        timestamp: Date.now(),
        source: 'api',
        verified: false,
      });
    });

    console.log(`[Target] Found ${prices.length} prices`);
  } catch (error) {
    console.warn('[Target] Error fetching prices:', error);
  }
  
  return prices;
}

/**
 * Fetch prices from Best Buy website
 */
async function fetchBestBuyPrices(barcode: string, productName?: string): Promise<PriceEntry[]> {
  const prices: PriceEntry[] = [];
  
  try {
    const query = encodeURIComponent(productName || barcode);
    const url = `https://www.bestbuy.com/site/searchpage.jsp?st=${query}`;
    
    const html = await fetchWithCorsProxy(url);
    if (!html) return prices;

    // Extract prices from Best Buy HTML
    const pricePatterns = [
      /\$[\d,]+\.?\d{0,2}/g,
      /"price"\s*:\s*([\d.]+)/gi,
      /current-price["']?\s*:\s*["']?([\d.]+)/gi,
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
        retailer: 'Best Buy',
        timestamp: Date.now(),
        source: 'api',
        verified: false,
      });
    });

    console.log(`[BestBuy] Found ${prices.length} prices`);
  } catch (error) {
    console.warn('[BestBuy] Error fetching prices:', error);
  }
  
  return prices;
}

/**
 * Fetch prices from Costco website
 */
async function fetchCostcoPrices(barcode: string, productName?: string): Promise<PriceEntry[]> {
  const prices: PriceEntry[] = [];
  
  try {
    const query = encodeURIComponent(productName || barcode);
    const url = `https://www.costco.com/CatalogSearch?keyword=${query}`;
    
    const html = await fetchWithCorsProxy(url);
    if (!html) return prices;

    // Extract prices from Costco HTML
    const pricePatterns = [
      /\$[\d,]+\.?\d{0,2}/g,
      /"price"\s*:\s*([\d.]+)/gi,
      /price-now["']?\s*:\s*["']?([\d.]+)/gi,
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
        retailer: 'Costco',
        timestamp: Date.now(),
        source: 'api',
        verified: false,
      });
    });

    console.log(`[Costco] Found ${prices.length} prices`);
  } catch (error) {
    console.warn('[Costco] Error fetching prices:', error);
  }
  
  return prices;
}

/**
 * Fetch prices from Overstock website
 */
async function fetchOverstockPrices(barcode: string, productName?: string): Promise<PriceEntry[]> {
  const prices: PriceEntry[] = [];
  
  try {
    const query = encodeURIComponent(productName || barcode);
    const url = `https://www.overstock.com/search?keywords=${query}`;
    
    const html = await fetchWithCorsProxy(url);
    if (!html) return prices;

    // Extract prices from Overstock HTML
    const pricePatterns = [
      /\$[\d,]+\.?\d{0,2}/g,
      /"price"\s*:\s*([\d.]+)/gi,
      /price-value["']?\s*:\s*["']?([\d.]+)/gi,
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
        retailer: 'Overstock',
        timestamp: Date.now(),
        source: 'api',
        verified: false,
      });
    });

    console.log(`[Overstock] Found ${prices.length} prices`);
  } catch (error) {
    console.warn('[Overstock] Error fetching prices:', error);
  }
  
  return prices;
}

/**
 * Fetch prices from B&H Photo Video website
 */
async function fetchBHPhotoPrices(barcode: string, productName?: string): Promise<PriceEntry[]> {
  const prices: PriceEntry[] = [];
  
  try {
    const query = encodeURIComponent(productName || barcode);
    const url = `https://www.bhphotovideo.com/c/search?q=${query}`;
    
    const html = await fetchWithCorsProxy(url);
    if (!html) return prices;

    // Extract prices from B&H HTML
    const pricePatterns = [
      /\$[\d,]+\.?\d{0,2}/g,
      /"price"\s*:\s*([\d.]+)/gi,
      /data-price=["']([\d.]+)["']/gi,
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
        retailer: 'B&H Photo Video',
        timestamp: Date.now(),
        source: 'api',
        verified: false,
      });
    });

    console.log(`[B&H Photo] Found ${prices.length} prices`);
  } catch (error) {
    console.warn('[B&H Photo] Error fetching prices:', error);
  }
  
  return prices;
}

/**
 * Fetch prices from Kroger website
 */
async function fetchKrogerPrices(barcode: string, productName?: string): Promise<PriceEntry[]> {
  const prices: PriceEntry[] = [];
  
  try {
    const query = encodeURIComponent(productName || barcode);
    const url = `https://www.kroger.com/search?query=${query}`;
    
    const html = await fetchWithCorsProxy(url);
    if (!html) return prices;

    const pricePatterns = [
      /\$[\d,]+\.?\d{0,2}/g,
      /"price"\s*:\s*([\d.]+)/gi,
      /data-price=["']([\d.]+)["']/gi,
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
        retailer: 'Kroger',
        timestamp: Date.now(),
        source: 'api',
        verified: false,
      });
    });

    console.log(`[Kroger] Found ${prices.length} prices`);
  } catch (error) {
    console.warn('[Kroger] Error fetching prices:', error);
  }
  
  return prices;
}

/**
 * Fetch prices from Safeway website
 */
async function fetchSafewayPrices(barcode: string, productName?: string): Promise<PriceEntry[]> {
  const prices: PriceEntry[] = [];
  
  try {
    const query = encodeURIComponent(productName || barcode);
    const url = `https://www.safeway.com/shop/search-results.html?q=${query}`;
    
    const html = await fetchWithCorsProxy(url);
    if (!html) return prices;

    const pricePatterns = [
      /\$[\d,]+\.?\d{0,2}/g,
      /"price"\s*:\s*([\d.]+)/gi,
      /price-value["']?\s*:\s*["']?([\d.]+)/gi,
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
        retailer: 'Safeway',
        timestamp: Date.now(),
        source: 'api',
        verified: false,
      });
    });

    console.log(`[Safeway] Found ${prices.length} prices`);
  } catch (error) {
    console.warn('[Safeway] Error fetching prices:', error);
  }
  
  return prices;
}

/**
 * Fetch prices from Home Depot website
 */
async function fetchHomeDepotPrices(barcode: string, productName?: string): Promise<PriceEntry[]> {
  const prices: PriceEntry[] = [];
  
  try {
    const query = encodeURIComponent(productName || barcode);
    const url = `https://www.homedepot.com/s/${query}`;
    
    const html = await fetchWithCorsProxy(url);
    if (!html) return prices;

    const pricePatterns = [
      /\$[\d,]+\.?\d{0,2}/g,
      /"price"\s*:\s*([\d.]+)/gi,
      /data-price=["']([\d.]+)["']/gi,
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
        retailer: 'Home Depot',
        timestamp: Date.now(),
        source: 'api',
        verified: false,
      });
    });

    console.log(`[HomeDepot] Found ${prices.length} prices`);
  } catch (error) {
    console.warn('[HomeDepot] Error fetching prices:', error);
  }
  
  return prices;
}

/**
 * Fetch prices from Lowe's website
 */
async function fetchLowesPrices(barcode: string, productName?: string): Promise<PriceEntry[]> {
  const prices: PriceEntry[] = [];
  
  try {
    const query = encodeURIComponent(productName || barcode);
    const url = `https://www.lowes.com/search?searchTerm=${query}`;
    
    const html = await fetchWithCorsProxy(url);
    if (!html) return prices;

    const pricePatterns = [
      /\$[\d,]+\.?\d{0,2}/g,
      /"price"\s*:\s*([\d.]+)/gi,
      /data-price=["']([\d.]+)["']/gi,
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
        retailer: "Lowe's",
        timestamp: Date.now(),
        source: 'api',
        verified: false,
      });
    });

    console.log(`[Lowes] Found ${prices.length} prices`);
  } catch (error) {
    console.warn('[Lowes] Error fetching prices:', error);
  }
  
  return prices;
}

/**
 * Fetch prices from Shopzilla (price comparison site)
 */
async function fetchShopzillaPrices(barcode: string, productName?: string): Promise<PriceEntry[]> {
  const prices: PriceEntry[] = [];
  
  try {
    const query = encodeURIComponent(productName || barcode);
    const url = `https://www.shopzilla.com/s?q=${query}`;
    
    const html = await fetchWithCorsProxy(url);
    if (!html) return prices;

    const pricePatterns = [
      /\$[\d,]+\.?\d{0,2}/g,
      /"price"\s*:\s*([\d.]+)/gi,
      /price-value["']?\s*:\s*["']?([\d.]+)/gi,
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
        retailer: 'Shopzilla',
        timestamp: Date.now(),
        source: 'api',
        verified: false,
      });
    });

    console.log(`[Shopzilla] Found ${prices.length} prices`);
  } catch (error) {
    console.warn('[Shopzilla] Error fetching prices:', error);
  }
  
  return prices;
}

/**
 * Fetch prices from Nextag (price comparison site)
 */
async function fetchNextagPrices(barcode: string, productName?: string): Promise<PriceEntry[]> {
  const prices: PriceEntry[] = [];
  
  try {
    const query = encodeURIComponent(productName || barcode);
    const url = `https://www.nextag.com/${query}/search`;
    
    const html = await fetchWithCorsProxy(url);
    if (!html) return prices;

    const pricePatterns = [
      /\$[\d,]+\.?\d{0,2}/g,
      /"price"\s*:\s*([\d.]+)/gi,
      /price-value["']?\s*:\s*["']?([\d.]+)/gi,
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
        retailer: 'Nextag',
        timestamp: Date.now(),
        source: 'api',
        verified: false,
      });
    });

    console.log(`[Nextag] Found ${prices.length} prices`);
  } catch (error) {
    console.warn('[Nextag] Error fetching prices:', error);
  }
  
  return prices;
}

/**
 * Fetch prices from Bing Shopping (price comparison)
 */
async function fetchBingShoppingPrices(barcode: string, productName?: string): Promise<PriceEntry[]> {
  const prices: PriceEntry[] = [];
  
  try {
    const query = encodeURIComponent(productName || barcode);
    const url = `https://www.bing.com/shop?q=${query}`;
    
    const html = await fetchWithCorsProxy(url);
    if (!html) return prices;

    const pricePatterns = [
      /\$[\d,]+\.?\d{0,2}/g,
      /"price"\s*:\s*([\d.]+)/gi,
      /data-price=["']([\d.]+)["']/gi,
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
        retailer: 'Bing Shopping',
        timestamp: Date.now(),
        source: 'api',
        verified: false,
      });
    });

    console.log(`[BingShopping] Found ${prices.length} prices`);
  } catch (error) {
    console.warn('[BingShopping] Error fetching prices:', error);
  }
  
  return prices;
}

