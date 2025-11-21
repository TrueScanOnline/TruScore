// Country-specific supermarket chain configurations
// Used to detect and scrape prices from local stores based on user location

export interface StoreChain {
  name: string;
  searchUrl?: string; // Custom search URL pattern
  patterns: string[]; // Name patterns to match
  countryCodes: string[]; // ISO country codes where this chain operates
}

export interface CountryStoreConfig {
  countryCode: string;
  countryName: string;
  chains: StoreChain[];
  defaultSearchQuery?: string; // Default query type for store searches
}

// New Zealand Supermarkets - CURATED TOP 5 STORES ONLY
// Only the largest supermarkets by volume are included
const NZ_STORES: StoreChain[] = [
  {
    name: 'New World',
    searchUrl: 'https://www.newworld.co.nz/shop/search?q={query}',
    patterns: ['new world'],
    countryCodes: ['NZ'],
  },
  {
    name: 'Pack n Save',
    searchUrl: 'https://www.paknsave.co.nz/shop/search?q={query}',
    patterns: ['pak n save', 'paknsave', 'pack n save', 'packnsave'],
    countryCodes: ['NZ'],
  },
  {
    name: 'Countdown',
    searchUrl: 'https://www.countdown.co.nz/shop/searchproducts?q={query}',
    patterns: ['countdown'],
    countryCodes: ['NZ'],
  },
  {
    name: 'Woolworths',
    searchUrl: 'https://www.woolworths.co.nz/shop/search?q={query}',
    patterns: ['woolworths', 'woolies'],
    countryCodes: ['NZ'],
  },
  {
    name: 'Fresh Choice',
    searchUrl: 'https://www.freshchoice.co.nz/shop/search?q={query}',
    patterns: ['fresh choice'],
    countryCodes: ['NZ'],
  },
];

// United States Supermarkets
const US_STORES: StoreChain[] = [
  {
    name: 'Walmart',
    searchUrl: 'https://www.walmart.com/search?q={query}',
    patterns: ['walmart'],
    countryCodes: ['US'],
  },
  {
    name: 'Target',
    searchUrl: 'https://www.target.com/s?searchTerm={query}',
    patterns: ['target'],
    countryCodes: ['US'],
  },
  {
    name: 'Kroger',
    searchUrl: 'https://www.kroger.com/search?query={query}',
    patterns: ['kroger'],
    countryCodes: ['US'],
  },
  {
    name: 'Safeway',
    searchUrl: 'https://www.safeway.com/shop/search-results.html?q={query}',
    patterns: ['safeway'],
    countryCodes: ['US'],
  },
  {
    name: 'Albertsons',
    searchUrl: 'https://www.albertsons.com/shop/search-results.html?q={query}',
    patterns: ['albertsons'],
    countryCodes: ['US'],
  },
  {
    name: 'Whole Foods',
    searchUrl: 'https://www.amazon.com/s?k={query}',
    patterns: ['whole foods'],
    countryCodes: ['US'],
  },
  {
    name: 'Costco',
    searchUrl: 'https://www.costco.com/CatalogSearch?keyword={query}',
    patterns: ['costco'],
    countryCodes: ['US'],
  },
  {
    name: 'Publix',
    searchUrl: 'https://www.publix.com/shop/search-results?q={query}',
    patterns: ['publix'],
    countryCodes: ['US'],
  },
  {
    name: 'Trader Joe\'s',
    patterns: ['trader joe', 'trader joes'],
    countryCodes: ['US'],
  },
  {
    name: 'Aldi',
    searchUrl: 'https://www.aldi.us/en/search.html?q={query}',
    patterns: ['aldi'],
    countryCodes: ['US'],
  },
  {
    name: 'Meijer',
    searchUrl: 'https://www.meijer.com/shopping/search.html?query={query}',
    patterns: ['meijer'],
    countryCodes: ['US'],
  },
  {
    name: 'H-E-B',
    searchUrl: 'https://www.heb.com/search/?q={query}',
    patterns: ['h-e-b', 'heb', 'h.e.b'],
    countryCodes: ['US'],
  },
];

// United Kingdom Supermarkets
const UK_STORES: StoreChain[] = [
  {
    name: 'Tesco',
    searchUrl: 'https://www.tesco.com/groceries/en-GB/search?query={query}',
    patterns: ['tesco'],
    countryCodes: ['GB'],
  },
  {
    name: 'Sainsbury\'s',
    searchUrl: 'https://www.sainsburys.co.uk/gol-ui/SearchDisplayView?searchTerm={query}',
    patterns: ['sainsbury', 'sainsburys'],
    countryCodes: ['GB'],
  },
  {
    name: 'Asda',
    searchUrl: 'https://groceries.asda.com/search/{query}',
    patterns: ['asda'],
    countryCodes: ['GB'],
  },
  {
    name: 'Morrisons',
    searchUrl: 'https://groceries.morrisons.com/search?entry={query}',
    patterns: ['morrisons', 'morrison'],
    countryCodes: ['GB'],
  },
  {
    name: 'Waitrose',
    searchUrl: 'https://www.waitrose.com/ecom/shop/search?&searchTerm={query}',
    patterns: ['waitrose'],
    countryCodes: ['GB'],
  },
  {
    name: 'M&S',
    searchUrl: 'https://www.marksandspencer.com/c/search?q={query}',
    patterns: ['marks & spencer', 'marks and spencer', 'm&s'],
    countryCodes: ['GB'],
  },
  {
    name: 'Co-op',
    searchUrl: 'https://www.coop.co.uk/search?query={query}',
    patterns: ['co-op', 'coop', 'co op'],
    countryCodes: ['GB'],
  },
  {
    name: 'Aldi',
    searchUrl: 'https://www.aldi.co.uk/search?query={query}',
    patterns: ['aldi'],
    countryCodes: ['GB'],
  },
  {
    name: 'Lidl',
    searchUrl: 'https://www.lidl.co.uk/search?query={query}',
    patterns: ['lidl'],
    countryCodes: ['GB'],
  },
  {
    name: 'Iceland',
    searchUrl: 'https://www.iceland.co.uk/search?q={query}',
    patterns: ['iceland'],
    countryCodes: ['GB'],
  },
];

// Australia Supermarkets - CURATED STORES ONLY
// Only the specified stores are included: Woolworths, Coles, IGA, Amazon, Kogan, Catch
const AU_STORES: StoreChain[] = [
  {
    name: 'Woolworths',
    searchUrl: 'https://www.woolworths.com.au/shop/search/products?searchTerm={query}',
    patterns: ['woolworths', 'woolies'],
    countryCodes: ['AU'],
  },
  {
    name: 'Coles',
    searchUrl: 'https://www.coles.com.au/search?q={query}',
    patterns: ['coles'],
    countryCodes: ['AU'],
  },
  {
    name: 'IGA',
    searchUrl: 'https://www.iga.com.au/search?q={query}',
    patterns: ['iga'],
    countryCodes: ['AU'],
  },
  {
    name: 'Amazon',
    searchUrl: 'https://www.amazon.com.au/s?k={query}',
    patterns: ['amazon'],
    countryCodes: ['AU'],
  },
  {
    name: 'Kogan',
    searchUrl: 'https://www.kogan.com/au/search/?q={query}',
    patterns: ['kogan'],
    countryCodes: ['AU'],
  },
  {
    name: 'Catch',
    searchUrl: 'https://www.catch.com.au/search?query={query}',
    patterns: ['catch'],
    countryCodes: ['AU'],
  },
];

// Canada Supermarkets
const CA_STORES: StoreChain[] = [
  {
    name: 'Loblaws',
    searchUrl: 'https://www.loblaws.ca/search?search-bar={query}',
    patterns: ['loblaws', 'loblaw'],
    countryCodes: ['CA'],
  },
  {
    name: 'Sobeys',
    searchUrl: 'https://www.sobeys.com/en/search/?q={query}',
    patterns: ['sobeys'],
    countryCodes: ['CA'],
  },
  {
    name: 'Metro',
    searchUrl: 'https://www.metro.ca/en/search?query={query}',
    patterns: ['metro'],
    countryCodes: ['CA'],
  },
  {
    name: 'Save-On-Foods',
    searchUrl: 'https://www.saveonfoods.com/search?q={query}',
    patterns: ['save-on-foods', 'save on foods'],
    countryCodes: ['CA'],
  },
  {
    name: 'Real Canadian Superstore',
    searchUrl: 'https://www.realcanadiansuperstore.ca/search?search-bar={query}',
    patterns: ['real canadian superstore', 'superstore'],
    countryCodes: ['CA'],
  },
  {
    name: 'Walmart',
    searchUrl: 'https://www.walmart.ca/search?q={query}',
    patterns: ['walmart'],
    countryCodes: ['CA'],
  },
  {
    name: 'Costco',
    searchUrl: 'https://www.costco.ca/CatalogSearch?keyword={query}',
    patterns: ['costco'],
    countryCodes: ['CA'],
  },
  {
    name: 'FreshCo',
    patterns: ['freshco'],
    countryCodes: ['CA'],
  },
  {
    name: 'No Frills',
    patterns: ['no frills'],
    countryCodes: ['CA'],
  },
];

// Country configurations
export const COUNTRY_STORE_CONFIGS: Record<string, CountryStoreConfig> = {
  NZ: {
    countryCode: 'NZ',
    countryName: 'New Zealand',
    chains: NZ_STORES,
  },
  US: {
    countryCode: 'US',
    countryName: 'United States',
    chains: US_STORES,
  },
  GB: {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    chains: UK_STORES,
  },
  AU: {
    countryCode: 'AU',
    countryName: 'Australia',
    chains: AU_STORES,
  },
  CA: {
    countryCode: 'CA',
    countryName: 'Canada',
    chains: CA_STORES,
  },
};

/**
 * Get store chains for a specific country
 */
export function getStoreChainsForCountry(countryCode: string): StoreChain[] {
  const code = countryCode.toUpperCase();
  const config = COUNTRY_STORE_CONFIGS[code];
  return config?.chains || [];
}

/**
 * Get all store chains for multiple countries
 */
export function getStoreChainsForCountries(countryCodes: string[]): StoreChain[] {
  const chains = new Map<string, StoreChain>();
  
  countryCodes.forEach(code => {
    const countryChains = getStoreChainsForCountry(code);
    countryChains.forEach(chain => {
      // Use name as key to avoid duplicates
      const key = chain.name.toLowerCase();
      if (!chains.has(key)) {
        chains.set(key, chain);
      }
    });
  });
  
  return Array.from(chains.values());
}

/**
 * Match a store name to a configured chain
 */
export function matchStoreToChain(storeName: string, countryCode?: string): StoreChain | null {
  const name = storeName.toLowerCase();
  
  // If country code provided, search only in that country's chains
  if (countryCode) {
    const chains = getStoreChainsForCountry(countryCode);
    for (const chain of chains) {
      if (chain.patterns.some(pattern => name.includes(pattern.toLowerCase()))) {
        return chain;
      }
    }
  } else {
    // Search all countries
    for (const config of Object.values(COUNTRY_STORE_CONFIGS)) {
      for (const chain of config.chains) {
        if (chain.patterns.some(pattern => name.includes(pattern.toLowerCase()))) {
          return chain;
        }
      }
    }
  }
  
  return null;
}

/**
 * Build search URL for a store chain
 */
export function buildStoreSearchUrl(
  chain: StoreChain,
  barcode: string,
  productName?: string
): string | null {
  if (chain.searchUrl) {
    const query = encodeURIComponent(productName || barcode);
    return chain.searchUrl.replace('{query}', query);
  }
  
  // NO FALLBACK - Return null if no search URL configured
  // This ensures we only use country-specific stores with proper search URLs
  // Google Shopping fallback removed to prevent international results
  console.warn(`[CountryStores] No search URL configured for chain: ${chain.name}`);
  return null;
}

