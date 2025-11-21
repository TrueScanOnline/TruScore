// Local store pricing - fetches prices from nearby stores/supermarkets
// Uses geolocation to find stores within radius and get their prices
import { PriceEntry } from '../../types/pricing';
import { getStoreChainsForCountry, matchStoreToChain, buildStoreSearchUrl, StoreChain } from './countryStores';

export interface StoreLocation {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance?: number; // in miles
  chain?: string; // e.g., "Walmart", "Target", "Kroger", "Safeway"
  phone?: string;
  hours?: string;
}

export interface LocalStorePrice extends PriceEntry {
  storeLocation: StoreLocation;
  inStoreOnly?: boolean;
  onlinePrice?: number; // Sometimes stores have different online vs in-store prices
}

const STORE_SEARCH_RADIUS_MILES = 20;
const MILES_TO_METERS = 1609.34; // 1 mile = 1609.34 meters

/**
 * Calculate distance between two coordinates in miles using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find nearby stores/supermarkets within radius
 * STRICTLY filters by country code - only returns stores matching country-specific chains
 * Uses multiple APIs: Google Places, Geoapify, etc.
 */
export async function findNearbyStores(
  latitude: number,
  longitude: number,
  radiusMiles: number = STORE_SEARCH_RADIUS_MILES,
  countryCode?: string
): Promise<StoreLocation[]> {
  const stores: StoreLocation[] = [];
  const radiusMeters = Math.round(radiusMiles * MILES_TO_METERS);

  // CRITICAL: Must have country code to filter stores
  if (!countryCode) {
    console.warn('[LocalStorePricing] Country code required for store filtering');
    return stores;
  }

  try {
    // Get country-specific store chains - ONLY search for these stores
    const countryChains = getStoreChainsForCountry(countryCode);
    if (countryChains.length === 0) {
      console.warn(`[LocalStorePricing] No store chains configured for country: ${countryCode}`);
      return stores;
    }

    // Build search keywords from country-specific store names
    const storeKeywords = countryChains
      .map(chain => chain.name)
      .filter(name => name.length > 0);

    console.log(`[LocalStorePricing] Searching for ${storeKeywords.length} country-specific stores in ${countryCode}`);

    // Try Google Places API first (if API key available)
    const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';
    
    if (GOOGLE_PLACES_API_KEY) {
      try {
        // Search for country-specific store chains ONLY
        for (const storeName of storeKeywords.slice(0, 10)) { // Limit to first 10 to avoid too many requests
          const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radiusMeters}&type=grocery_or_supermarket&keyword=${encodeURIComponent(storeName)}&key=${GOOGLE_PLACES_API_KEY}`;
          
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            if (data.results && Array.isArray(data.results)) {
              data.results.forEach((place: any) => {
                if (place.geometry && place.geometry.location) {
                  const placeLat = place.geometry.location.lat;
                  const placeLng = place.geometry.location.lng;
                  const distance = calculateDistance(latitude, longitude, placeLat, placeLng);
                  
    if (distance <= radiusMiles) {
                  // CRITICAL: Verify store name matches a country-specific chain
                  const placeName = (place.name || '').toLowerCase();
                  const matchesChain = countryChains.some(chain => 
                    chain.patterns.some(pattern => placeName.includes(pattern.toLowerCase()))
                  );
                  
                  // CRITICAL: Also verify the place is in the correct country
                  const placeCountry = place.plus_code?.compound_code?.split(' ').pop() || '';
                  const isCorrectCountry = !placeCountry || placeCountry.toLowerCase().includes(countryCode.toLowerCase());
                  
                  if (matchesChain && isCorrectCountry) {
                      stores.push({
                        name: place.name,
                        address: place.vicinity || place.formatted_address || '',
                        latitude: placeLat,
                        longitude: placeLng,
                        distance,
                        chain: place.name,
                        phone: place.formatted_phone_number,
                        hours: place.opening_hours?.weekday_text?.join(', '),
                      });
                    }
                  }
                }
              });
            }
          }
        }
        console.log(`[LocalStorePricing] Google Places found ${stores.length} stores matching ${countryCode} chains`);
      } catch (error) {
        console.warn('[LocalStorePricing] Google Places API error:', error);
      }
    }

    // Try Geoapify Places API (free tier: 3000 credits/day)
    const GEOAPIFY_API_KEY = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY || '';
    
    if (GEOAPIFY_API_KEY && stores.length < 10) {
      try {
        // Geoapify Places API - search for country-specific stores
        const url = `https://api.geoapify.com/v2/places?categories=commercial.supermarket,commercial.grocery&filter=circle:${longitude},${latitude},${radiusMeters}&bias=proximity:${longitude},${latitude}&limit=20&apiKey=${GEOAPIFY_API_KEY}`;
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (data.features && Array.isArray(data.features)) {
            data.features.forEach((feature: any) => {
              const props = feature.properties;
              const coords = feature.geometry.coordinates;
              
              if (coords && coords.length >= 2) {
                const placeLng = coords[0];
                const placeLat = coords[1];
                const distance = calculateDistance(latitude, longitude, placeLat, placeLng);
                
                if (distance <= radiusMiles) {
                  // CRITICAL: Verify store name matches a country-specific chain
                  const placeName = (props.name || '').toLowerCase();
                  const matchesChain = countryChains.some(chain => 
                    chain.patterns.some(pattern => placeName.includes(pattern.toLowerCase()))
                  );
                  
                  // CRITICAL: Verify country matches (Geoapify provides country code)
                  const placeCountryCode = props.country_code?.toUpperCase();
                  const isCorrectCountry = !placeCountryCode || placeCountryCode === countryCode.toUpperCase();
                  
                  if (matchesChain && isCorrectCountry) {
                    // Check if we already have this store
                    const existing = stores.find(s => 
                      s.latitude === placeLat && s.longitude === placeLng
                    );
                    
                    if (!existing) {
                      stores.push({
                        name: props.name || 'Store',
                        address: props.address_line2 || props.address_line1 || '',
                        latitude: placeLat,
                        longitude: placeLng,
                        distance,
                        chain: props.name,
                      });
                    }
                  }
                }
              }
            });
          }
        }
        console.log(`[LocalStorePricing] Geoapify found ${stores.length} total stores matching ${countryCode} chains`);
      } catch (error) {
        console.warn('[LocalStorePricing] Geoapify API error:', error);
      }
    }

    // Sort by distance (closest first) and remove duplicates
    const uniqueStores = Array.from(
      new Map(stores.map(store => [`${store.latitude},${store.longitude}`, store])).values()
    ).sort((a, b) => (a.distance || 0) - (b.distance || 0));

    console.log(`[LocalStorePricing] Found ${uniqueStores.length} unique ${countryCode} stores within ${radiusMiles} miles`);
    return uniqueStores.slice(0, 20); // Limit to 20 closest stores
  } catch (error) {
    console.error('[LocalStorePricing] Error finding nearby stores:', error);
    return stores;
  }
}

/**
 * Fetch prices from local stores for a specific product
 * This would integrate with store APIs or web scraping
 */
export async function fetchLocalStorePrices(
  barcode: string,
  productName: string,
  latitude: number,
  longitude: number,
  radiusMiles: number = STORE_SEARCH_RADIUS_MILES,
  countryCode?: string
): Promise<LocalStorePrice[]> {
  const prices: LocalStorePrice[] = [];

  try {
    // CRITICAL: Must have country code to filter stores
    if (!countryCode) {
      console.warn('[LocalStorePricing] Country code required for local store pricing');
      return prices;
    }

    // Step 1: Find nearby stores - STRICTLY filtered by country code
    const nearbyStores = await findNearbyStores(latitude, longitude, radiusMiles, countryCode);
    
    if (nearbyStores.length === 0) {
      console.log(`[LocalStorePricing] No nearby ${countryCode} stores found`);
      return prices;
    }

    console.log(`[LocalStorePricing] Found ${nearbyStores.length} nearby ${countryCode} stores`);

    // Step 2: Real-time web scraping from store websites
    // This uses the user's internet connection to scrape prices directly
    // from each store's website in real-time
    
    console.log(`[LocalStorePricing] Starting real-time web scraping for ${nearbyStores.length} stores`);
    
    // Use batch scraping for better performance
    // Scrape stores in parallel (limit to 5 concurrent to avoid rate limiting)
    const batchSize = 5;
    const batches = [];
    
    for (let i = 0; i < nearbyStores.length; i += batchSize) {
      batches.push(nearbyStores.slice(i, i + batchSize));
    }
    
    // Process batches sequentially to avoid overwhelming stores
    for (const batch of batches) {
      const batchPromises = batch.map(store =>
        fetchPriceFromStore(barcode, productName, store, countryCode)
          .catch(error => {
            console.warn(`[LocalStorePricing] Error fetching from ${store.name}:`, error);
            return [];
          })
      );
      
      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(storePrices => {
        if (storePrices && storePrices.length > 0) {
          prices.push(...storePrices);
        }
      });
      
      // Small delay between batches to be respectful to store servers
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
      }
    }

    // Sort by distance (closest first)
    prices.sort((a, b) => {
      const distA = a.storeLocation.distance || Infinity;
      const distB = b.storeLocation.distance || Infinity;
      return distA - distB;
    });

    console.log(`[LocalStorePricing] Found ${prices.length} prices from local stores`);
    return prices;
  } catch (error) {
    console.error('[LocalStorePricing] Error fetching local store prices:', error);
    return prices;
  }
}

/**
 * Fetch price for a product from a specific store
 * Uses real-time web scraping from store websites
 */
async function fetchPriceFromStore(
  barcode: string,
  productName: string,
  store: StoreLocation,
  countryCode?: string
): Promise<LocalStorePrice[]> {
  const prices: LocalStorePrice[] = [];

  // CRITICAL: Must have country code
  if (!countryCode) {
    console.warn(`[LocalStorePricing] Country code required for ${store.name}`);
    return prices;
  }

  try {
    // CRITICAL: Verify store matches country-specific chain
    const storeNameLower = (store.chain || store.name || '').toLowerCase();
    const countryChains = getStoreChainsForCountry(countryCode);
    const matchesChain = countryChains.some(chain => 
      chain.patterns.some(pattern => storeNameLower.includes(pattern.toLowerCase()))
    );

    if (!matchesChain) {
      console.log(`[LocalStorePricing] Skipping ${store.name} - does not match ${countryCode} store chains`);
      return prices;
    }

    // Try store-specific APIs first (if available)
    const storeChain = storeNameLower;
    
    // Walmart - try Walmart Open API (US/CA only)
    if (storeChain.includes('walmart') && (countryCode === 'US' || countryCode === 'CA')) {
      try {
        const WALMART_API_KEY = process.env.EXPO_PUBLIC_WALMART_API_KEY || '';
        if (WALMART_API_KEY) {
          const url = `https://api.walmartlabs.com/v1/items?apiKey=${WALMART_API_KEY}&upc=${barcode}`;
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            if (data.items && data.items.length > 0 && data.items[0].salePrice) {
              prices.push({
                price: data.items[0].salePrice,
                currency: data.items[0].currency || (countryCode === 'CA' ? 'CAD' : 'USD'),
                retailer: store.name,
                timestamp: Date.now(),
                source: 'api',
                verified: true,
                storeLocation: store,
                inStoreOnly: true,
              });
              return prices; // Return early if API price found
            }
          }
        }
      } catch (error) {
        console.warn(`[LocalStorePricing] Walmart API error for ${store.name}:`, error);
      }
    }
    
    // REAL-TIME WEB SCRAPING - Scrape store website directly
    // This runs on the user's device, using their internet connection
    if (prices.length === 0) {
      try {
        // Import web scraping function
        const { scrapeStoreWebsite } = await import('./storeWebScraping');
        
        // Use provided country code (already validated)
        const scrapedPrice = await scrapeStoreWebsite(barcode, productName, store, countryCode);
        
        if (scrapedPrice) {
          prices.push({
            ...scrapedPrice,
            storeLocation: store,
            inStoreOnly: true,
          });
          console.log(`[LocalStorePricing] ✅ Successfully scraped price ${scrapedPrice.currency}${scrapedPrice.price} from ${store.name}`);
        } else {
          console.log(`[LocalStorePricing] No price found via scraping for ${barcode} at ${store.name}`);
        }
      } catch (error) {
        console.error(`[LocalStorePricing] Error scraping ${store.name}:`, error);
      }
    }
    
    return prices;
  } catch (error) {
    console.error(`[LocalStorePricing] Error fetching price from ${store.name}:`, error);
    return prices;
  }
}

/**
 * Format distance for display
 */
export function formatDistance(miles?: number): string {
  if (!miles) return 'Unknown distance';
  
  if (miles < 1) {
    return `${Math.round(miles * 5280)} ft away`;
  } else if (miles < 10) {
    return `${miles.toFixed(1)} mi away`;
  } else {
    return `${Math.round(miles)} mi away`;
  }
}

