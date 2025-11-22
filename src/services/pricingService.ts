// Pricing Service - LOCAL STORES ONLY
// Fetches prices ONLY from local supermarkets/stores based on user's geo-location
// No international pricing - only local prices in local currency

import * as Location from 'expo-location';
import { ProductPricing, PriceEntry, RetailerPrice, LocationInfo } from '../types/pricing';
import { currencyService } from './currencyService';
import { priceStorageService } from './priceStorageService';
import { fetchLocalStorePrices } from './pricingApis/localStorePricing';
import { scrapeStoreWebsite } from './pricingApis/storeWebScraping';
import { scrapeStoreWebsiteEnhanced } from './pricingApis/enhancedStoreScraping';
import { scrapeProductSpecificPrice } from './pricingApis/productSpecificScraping';
import { getStoreChainsForCountry, StoreChain, buildStoreSearchUrl } from './pricingApis/countryStores';
import { fetchGoogleShoppingPrices } from './pricingApis/googleShoppingPricing';

class PricingService {
  /**
   * Get user's current location
   * REQUIRED for local pricing
   */
  private async getUserLocation(): Promise<LocationInfo | null> {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('[pricingService] Location permission denied');
        return null;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Reverse geocode to get address/country info
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (reverseGeocode && reverseGeocode.length > 0) {
          const address = reverseGeocode[0];
          return {
            country: address.country || undefined,
            countryCode: address.isoCountryCode || undefined,
            region: address.region || undefined,
            city: address.city || address.district || undefined,
            coordinates: {
              lat: location.coords.latitude,
              lng: location.coords.longitude,
            },
          };
        }
      } catch (geocodeError) {
        console.warn('[pricingService] Reverse geocoding failed:', geocodeError);
      }

      // Fallback: return location with coordinates only
      return {
        coordinates: {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        },
      };
    } catch (error) {
      console.error('[pricingService] Error getting user location:', error);
      return null;
    }
  }

  /**
   * Fetch prices from local supermarket websites ONLY
   * Uses country-specific store chains based on user location
   */
  private async fetchLocalStorePricesOnly(
    barcode: string,
    productName: string,
    location: LocationInfo,
    countryCode: string
  ): Promise<PriceEntry[]> {
    const allPrices: PriceEntry[] = [];

    if (!location.coordinates) {
      console.warn('[pricingService] No coordinates available for local store pricing');
      return allPrices;
    }

    try {
      // Get country-specific store chains
      const storeChains = getStoreChainsForCountry(countryCode);
      
      if (storeChains.length === 0) {
        console.warn(`[pricingService] No store chains configured for country: ${countryCode}`);
        return allPrices;
      }

      console.log(`[pricingService] Found ${storeChains.length} store chains for ${countryCode}`);

      // Fetch prices from each local store chain in parallel
      const pricePromises = storeChains
        .filter(chain => chain.searchUrl) // Only chains with search URLs
        .map(async (chain: StoreChain) => {
          try {
            // Use barcode only if product name is generic/fallback
            const searchQuery = (productName && !productName.toLowerCase().startsWith('product ')) 
              ? productName 
              : barcode;
            
            const searchUrl = buildStoreSearchUrl(chain, barcode, searchQuery);
            if (!searchUrl) return [];

            console.log(`[pricingService] Scraping ${chain.name} for: ${productName}`);

            // Create a mock store location for scraping
            const storeLocation = {
              name: chain.name,
              address: location.city || location.region || location.country || '',
              latitude: location.coordinates!.lat,
              longitude: location.coordinates!.lng,
              chain: chain.name,
            };

            // CRITICAL: Only use product-specific scraping
            // This finds the exact product first, then extracts its price
            // We do NOT use fallback scraping methods because they extract wrong prices
            const price = await scrapeProductSpecificPrice(barcode, productName, storeLocation, countryCode);
            
            // Only return price if:
            // 1. Price was found
            // 2. Product was verified (matched by name/barcode)
            // 3. Price is reasonable (> 0)
            if (price && price.price > 0 && price.verified) {
              console.log(`[pricingService] ✅ ${chain.name}: Found VERIFIED price $${price.price}`);
              return [{
                price: price.price,
                currency: price.currency,
                retailer: chain.name,
                location: `${location.city || ''} ${location.region || ''}`.trim() || undefined,
                timestamp: Date.now(),
                source: 'api' as const,
                verified: true, // Verified - product was matched
              }];
            } else if (price && !price.verified) {
              console.log(`[pricingService] ⚠️ ${chain.name}: Found price but product not verified - skipping to avoid wrong data`);
            } else {
              console.log(`[pricingService] ❌ ${chain.name}: No price found (product may not be available)`);
            }
            return [];
          } catch (error) {
            console.warn(`[pricingService] Failed to scrape ${chain.name}:`, error);
            return [];
          }
        });

      // Wait for all store scrapes to complete
      const results = await Promise.allSettled(pricePromises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          allPrices.push(...result.value);
          if (result.value.length > 0) {
            console.log(`[pricingService] ✅ ${storeChains[index].name}: Found price`);
          }
        }
      });

      // Also try finding nearby physical stores and scraping their websites
      try {
        const nearbyStorePrices = await fetchLocalStorePrices(
          barcode,
          productName,
          location.coordinates.lat,
          location.coordinates.lng,
          20, // 20 miles radius
          countryCode
        );

        if (nearbyStorePrices.length > 0) {
          console.log(`[pricingService] ✅ Found ${nearbyStorePrices.length} prices from nearby stores`);
          nearbyStorePrices.forEach(localPrice => {
            // CRITICAL: Verify store matches country-specific chain before adding
            const storeNameLower = (localPrice.storeLocation.chain || localPrice.storeLocation.name || '').toLowerCase();
            const countryChains = getStoreChainsForCountry(countryCode);
            const matchesChain = countryChains.some(chain => 
              chain.patterns.some(pattern => storeNameLower.includes(pattern.toLowerCase()))
            );
            
            if (matchesChain) {
              allPrices.push({
                price: localPrice.price,
                currency: localPrice.currency,
                retailer: localPrice.storeLocation.name,
                location: localPrice.storeLocation.address,
                timestamp: localPrice.timestamp,
                source: 'api' as const,
                verified: true,
              });
            } else {
              console.warn(`[pricingService] ⚠️ Skipping ${localPrice.storeLocation.name} - does not match ${countryCode} store chains`);
            }
          });
        }
      } catch (error) {
        console.warn('[pricingService] Nearby store search failed:', error);
      }

      // Google Shopping removed - unreliable source
      // Prices should come only from official store websites

      console.log(`[pricingService] Total local prices found: ${allPrices.length}`);
      return allPrices;
    } catch (error) {
      console.error('[pricingService] Error fetching local store prices:', error);
      return allPrices;
    }
  }

  /**
   * Calculate price range and statistics (with outlier filtering)
   */
  private calculatePriceRange(prices: number[]): {
    min: number;
    max: number;
    average: number;
    median: number;
  } {
    if (prices.length === 0) {
      return { min: 0, max: 0, average: 0, median: 0 };
    }

    const sorted = [...prices].sort((a, b) => a - b);
    
    // Simple outlier filtering: Remove prices more than 2x the median
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    // Filter out extreme outliers (likely wrong products or bulk pricing)
    const filtered = sorted.filter(price => {
      if (median === 0) return true;
      const ratio = price / median;
      return ratio >= 0.3 && ratio <= 3.0; // Keep prices within 30%-300% of median
    });

    // Use filtered prices if we have enough, otherwise use all
    const pricesToUse = filtered.length >= 2 ? filtered : sorted;
    
    const min = pricesToUse[0];
    const max = pricesToUse[pricesToUse.length - 1];
    const sum = pricesToUse.reduce((acc, val) => acc + val, 0);
    const average = sum / pricesToUse.length;
    const finalMedian = pricesToUse.length % 2 === 0
      ? (pricesToUse[pricesToUse.length / 2 - 1] + pricesToUse[pricesToUse.length / 2]) / 2
      : pricesToUse[Math.floor(pricesToUse.length / 2)];

    return { min, max, average, median: finalMedian };
  }

  /**
   * Get pricing data for a product - LOCAL STORES ONLY
   * REQUIRES location - returns null if location not available
   */
  async getProductPricing(
    barcode: string,
    targetCurrency?: string,
    forceRefresh: boolean = false,
    productName?: string
  ): Promise<ProductPricing | null> {
    try {
      // REQUIRED: Get user location first
      let location = await this.getUserLocation();
      
      if (!location || !location.coordinates) {
        console.warn('[pricingService] Location required for local pricing - returning null');
        return null;
      }

      if (!location.countryCode) {
        console.warn('[pricingService] Country code not available - cannot fetch local prices');
        return null;
      }

      // Determine target currency from location
      let currency = targetCurrency;
      if (!currency) {
        currency = currencyService.getLocalCurrency();
      }

      // Check cache first
      if (!forceRefresh) {
        const cached = await priceStorageService.getCachedPricing(barcode, currency);
        if (cached) {
          return cached;
        }
      }

      console.log(`[pricingService] Fetching LOCAL prices for: ${productName || barcode}`);
      console.log(`[pricingService] Location: ${location.city || location.region || location.country} (${location.countryCode})`);

      // ONLY fetch from local stores - no international APIs
      const localPrices = await this.fetchLocalStorePricesOnly(
        barcode,
        productName || `Product ${barcode}`,
        location,
        location.countryCode
      );

      if (localPrices.length === 0) {
        console.log(`[pricingService] No local prices found for barcode: ${barcode}`);
        return null;
      }

      console.log(`[pricingService] Found ${localPrices.length} local prices from ${location.countryCode} stores`);

      // All prices should already be in local currency, but normalize just in case
      const normalized = await currencyService.normalizePrices(
        localPrices.map(p => ({ price: p.price, currency: p.currency })),
        currency
      );

      // Map normalized prices back to PriceEntry format
      const normalizedPrices: PriceEntry[] = normalized.map((np, index) => ({
        ...localPrices[index],
        price: np.price,
        currency: np.currency,
      }));

      // Calculate price range (with outlier filtering)
      const priceValues = normalizedPrices.map(p => p.price);
      const priceRange = this.calculatePriceRange(priceValues);

      // Aggregate by retailer (show lowest price per store)
      // CRITICAL: Filter out any retailers that don't match country-specific chains
      // For New Zealand: Allow curated stores + Google Shopping
      const countryChains = getStoreChainsForCountry(location.countryCode);
      const retailerMap = new Map<string, RetailerPrice>();
      normalizedPrices.forEach(price => {
        if (price.retailer) {
          const retailerLower = price.retailer.toLowerCase();
          
          // Google Shopping removed - no longer used as pricing source
          
          // Verify retailer matches a country-specific chain
          const matchesChain = countryChains.some(chain => 
            chain.patterns.some(pattern => retailerLower.includes(pattern.toLowerCase()))
          );
          
          // Also reject common international stores that shouldn't appear
          const isInternationalStore = retailerLower.includes('home depot') ||
                                      retailerLower.includes('b&h photo') ||
                                      retailerLower.includes('overstock') ||
                                      (retailerLower.includes('kroger') && location.countryCode !== 'US') ||
                                      (retailerLower.includes('target') && location.countryCode !== 'US');
          
          if (matchesChain && !isInternationalStore) {
            const key = retailerLower;
            const existing = retailerMap.get(key);
            if (!existing || price.price < existing.price) {
              retailerMap.set(key, {
                retailerName: price.retailer,
                price: price.price,
                currency: price.currency,
                inStock: true,
                location: price.location,
              });
            }
          } else {
            console.warn(`[pricingService] ⚠️ Filtering out retailer "${price.retailer}" - does not match ${location.countryCode} stores`);
          }
        }
      });

      const retailerPrices = Array.from(retailerMap.values());

      // Determine data quality based on number of stores found
      let dataQuality: ProductPricing['dataQuality'] = 'insufficient';
      if (retailerPrices.length >= 5) {
        dataQuality = 'high';
      } else if (retailerPrices.length >= 3) {
        dataQuality = 'medium';
      } else if (retailerPrices.length >= 1) {
        dataQuality = 'low';
      }

      // Build pricing object
      const pricing: ProductPricing = {
        barcode,
        currency: currency.toUpperCase(),
        location: {
          country: location.country,
          region: location.region,
          city: location.city,
          coordinates: location.coordinates,
        },
        prices: normalizedPrices,
        priceRange,
        trends: {
          currentPrice: priceRange.average,
          priceChangeDirection: 'stable', // No historical data for now
          volatility: 'low',
        },
        retailers: retailerPrices,
        lastUpdated: Date.now(),
        dataQuality,
      };

      // Cache the pricing data
      await priceStorageService.cachePricing(barcode, pricing);

      return pricing;
    } catch (error) {
      console.error('[pricingService] Error getting product pricing:', error);
      return null;
    }
  }

  /**
   * Submit user price (for local store they're currently in)
   */
  async submitUserPrice(
    barcode: string,
    price: number,
    currency: string,
    retailer?: string
  ): Promise<boolean> {
    try {
      await priceStorageService.saveUserSubmittedPrice(barcode, price, currency, retailer);
      
      // Invalidate cache to force refresh
      await priceStorageService.clearCachedPricing(barcode);
      
      return true;
    } catch (error) {
      console.error('Error submitting user price:', error);
      return false;
    }
  }
}

export const pricingService = new PricingService();
