// Main pricing service - aggregates pricing data from multiple sources
import * as Location from 'expo-location';
import { ProductPricing, PriceEntry, RetailerPrice, LocationInfo } from '../types/pricing';
import { currencyService } from './currencyService';
import { priceStorageService } from './priceStorageService';
import { fetchProductFromUPCitemdb, UPCitemdbResponse } from './upcitemdb';
import { fetchProductFromBarcodeSpider, BarcodeSpiderResponse } from './barcodeSpider';
// Additional pricing APIs
import { fetchWalmartPrices } from './pricingApis/walmartPricing';
import { fetchEbayPrices } from './pricingApis/ebayPricing';
import { fetchGoogleShoppingPrices } from './pricingApis/googleShoppingPricing';
import { fetchPriceComPrices } from './pricingApis/priceComApi';
import { fetchOpenFoodFactsPrices } from './pricingApis/openFoodFactsPricing';
import { fetchAmazonPrices } from './pricingApis/amazonPricing';
import { fetchLocalStorePrices, LocalStorePrice } from './pricingApis/localStorePricing';

class PricingService {
  private locationCache: LocationInfo | null = null;
  private locationTimestamp: number = 0;
  private readonly LOCATION_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  /**
   * Deduplicate prices - remove similar prices from same retailer
   */
  private deduplicatePrices(prices: PriceEntry[]): PriceEntry[] {
    const seen = new Map<string, PriceEntry>();
    
    prices.forEach(price => {
      const key = `${price.retailer || 'unknown'}_${price.currency}`;
      const existing = seen.get(key);
      
      // Keep the lowest price from each retailer
      if (!existing || price.price < existing.price) {
        seen.set(key, price);
      }
    });
    
    return Array.from(seen.values());
  }

  /**
   * Get user's current location - REQUIRED for local store pricing
   */
  async getUserLocation(): Promise<LocationInfo | null> {
    // Check cache first
    const now = Date.now();
    if (this.locationCache && now - this.locationTimestamp < this.LOCATION_CACHE_TTL) {
      return this.locationCache;
    }

    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        return null;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Reverse geocode to get address
      const addresses = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const address = addresses[0];
      if (address) {
        const locationInfo: LocationInfo = {
          country: address.country || undefined,
          countryCode: address.isoCountryCode || undefined,
          region: address.region || undefined,
          city: address.city || address.subregion || undefined,
          coordinates: {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          },
        };

        // Cache the location
        this.locationCache = locationInfo;
        this.locationTimestamp = now;

        return locationInfo;
      }

      return null;
    } catch (error) {
      console.error('Error getting user location:', error);
      return null;
    }
  }

  /**
   * Extract pricing data from UPCitemdb response
   */
  private extractPricingFromUPCitemdb(
    barcode: string,
    data: UPCitemdbResponse
  ): PriceEntry[] {
    const prices: PriceEntry[] = [];

    if (!data.items || data.items.length === 0) {
      return prices;
    }

    const item = data.items[0];

    // Extract from price range
    if (item.lowest_recorded_price && item.currency) {
      prices.push({
        price: item.lowest_recorded_price,
        currency: item.currency.toUpperCase(),
        timestamp: Date.now(),
        source: 'api',
        verified: false,
      });
    }

    if (item.highest_recorded_price && item.currency) {
      prices.push({
        price: item.highest_recorded_price,
        currency: item.currency.toUpperCase(),
        timestamp: Date.now(),
        source: 'api',
        verified: false,
      });
    }

    // Extract from offers (most reliable source of pricing data)
    if (item.offers && item.offers.length > 0) {
      item.offers.forEach(offer => {
        if (offer.price && item.currency) {
          const currency = item.currency.toUpperCase();
          const price = typeof offer.price === 'string' ? parseFloat(offer.price) : offer.price;
          
          if (!isNaN(price) && price > 0) {
            prices.push({
              price,
              currency,
              retailer: offer.merchant || 'Unknown Retailer',
              timestamp: offer.updated_t ? offer.updated_t * 1000 : Date.now(),
              source: 'api',
              verified: true, // UPCitemdb offers are generally reliable
            });
          }
        }
      });
    }
    
    // Also check for lowest/highest recorded prices if offers are empty
    if (prices.length === 0) {
      if (item.lowest_recorded_price && item.currency) {
        const price = typeof item.lowest_recorded_price === 'string' 
          ? parseFloat(item.lowest_recorded_price) 
          : item.lowest_recorded_price;
        
        if (!isNaN(price) && price > 0) {
          prices.push({
            price,
            currency: item.currency.toUpperCase(),
            retailer: 'Lowest Recorded Price',
            timestamp: Date.now(),
            source: 'api',
            verified: false,
          });
        }
      }
      
      if (item.highest_recorded_price && item.currency) {
        const price = typeof item.highest_recorded_price === 'string' 
          ? parseFloat(item.highest_recorded_price) 
          : item.highest_recorded_price;
        
        if (!isNaN(price) && price > 0) {
          prices.push({
            price,
            currency: item.currency.toUpperCase(),
            retailer: 'Highest Recorded Price',
            timestamp: Date.now(),
            source: 'api',
            verified: false,
          });
        }
      }
    }

    return prices;
  }

  /**
   * Extract pricing data from BarcodeSpider response
   */
  private extractPricingFromBarcodeSpider(
    barcode: string,
    data: BarcodeSpiderResponse
  ): PriceEntry[] {
    const prices: PriceEntry[] = [];

    if (!data.item_response.item) {
      return prices;
    }

    const item = data.item_response.item;

    // Extract from price range
    if (item.lowest_recorded_price && item.currency) {
      prices.push({
        price: item.lowest_recorded_price,
        currency: item.currency.toUpperCase(),
        timestamp: Date.now(),
        source: 'api',
        verified: false,
      });
    }

    if (item.highest_recorded_price && item.currency) {
      prices.push({
        price: item.highest_recorded_price,
        currency: item.currency.toUpperCase(),
        timestamp: Date.now(),
        source: 'api',
        verified: false,
      });
    }

    // Extract from stores (BarcodeSpider store listings)
    if (item.stores && item.stores.length > 0) {
      item.stores.forEach(store => {
        if (store.price && store.currency) {
          const priceValue = typeof store.price === 'string' 
            ? parseFloat(store.price) 
            : store.price;
          
          if (!isNaN(priceValue) && priceValue > 0) {
            prices.push({
              price: priceValue,
              currency: store.currency.toUpperCase(),
              retailer: store.name || 'Unknown Store',
              location: store.availability,
              timestamp: Date.now(),
              source: 'api',
              verified: false,
            });
          }
        }
      });
    }
    
    // Also check for lowest/highest recorded prices if stores are empty
    if (prices.length === 0) {
      if (item.lowest_recorded_price && item.currency) {
        const price = typeof item.lowest_recorded_price === 'string' 
          ? parseFloat(item.lowest_recorded_price) 
          : item.lowest_recorded_price;
        
        if (!isNaN(price) && price > 0) {
          prices.push({
            price,
            currency: item.currency.toUpperCase(),
            retailer: 'Lowest Recorded Price',
            timestamp: Date.now(),
            source: 'api',
            verified: false,
          });
        }
      }
      
      if (item.highest_recorded_price && item.currency) {
        const price = typeof item.highest_recorded_price === 'string' 
          ? parseFloat(item.highest_recorded_price) 
          : item.highest_recorded_price;
        
        if (!isNaN(price) && price > 0) {
          prices.push({
            price,
            currency: item.currency.toUpperCase(),
            retailer: 'Highest Recorded Price',
            timestamp: Date.now(),
            source: 'api',
            verified: false,
          });
        }
      }
    }

    return prices;
  }

  /**
   * Fetch pricing data from all available sources
   * Aggregates data from multiple APIs in parallel for maximum coverage
   */
  private async fetchPricingFromAPIs(barcode: string, productName?: string): Promise<PriceEntry[]> {
    const allPrices: PriceEntry[] = [];

    // Fetch from all APIs in parallel for maximum speed and coverage
    console.log(`[pricingService] Fetching from ${8} pricing sources for barcode: ${barcode}`);
    
    const apiResults = await Promise.allSettled([
      // Primary APIs (free tier available)
      this.fetchFromUPCitemdb(barcode),
      this.fetchFromBarcodeSpider(barcode),
      fetchOpenFoodFactsPrices(barcode),
      
      // Major retailer APIs (require API keys)
      fetchWalmartPrices(barcode),
      fetchEbayPrices(barcode),
      fetchAmazonPrices(barcode),
      
      // Web scraping sources (fallback)
      fetchGoogleShoppingPrices(barcode, productName),
      fetchPriceComPrices(barcode, productName),
    ]);

    // Aggregate results from all APIs
    apiResults.forEach((result, index) => {
      const apiNames = [
        'UPCitemdb',
        'BarcodeSpider',
        'OpenFoodFacts',
        'Walmart',
        'eBay',
        'Amazon',
        'GoogleShopping',
        'Price.com',
      ];
      
      if (result.status === 'fulfilled' && result.value) {
        const prices = result.value;
        console.log(`[pricingService] ${apiNames[index]} returned ${prices.length} prices`);
        allPrices.push(...prices);
      } else if (result.status === 'rejected') {
        console.warn(`[pricingService] ${apiNames[index]} failed:`, result.reason);
      }
    });

    console.log(`[pricingService] Total prices from all APIs: ${allPrices.length}`);
    return allPrices;
  }

  /**
   * Fetch pricing from UPCitemdb (extracted for parallel execution)
   */
  private async fetchFromUPCitemdb(barcode: string): Promise<PriceEntry[]> {
    try {
      const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`);
      console.log(`[pricingService] UPCitemdb response status: ${response.status}`);
      if (response.ok) {
        const data: UPCitemdbResponse = await response.json();
        const prices = this.extractPricingFromUPCitemdb(barcode, data);
        console.log(`[pricingService] UPCitemdb extracted ${prices.length} prices`);
        return prices;
      } else {
        console.warn(`[pricingService] UPCitemdb returned status ${response.status}`);
      }
    } catch (error) {
      console.error('[pricingService] Error fetching pricing from UPCitemdb:', error);
    }
    return [];
  }

  /**
   * Fetch pricing from BarcodeSpider (extracted for parallel execution)
   */
  private async fetchFromBarcodeSpider(barcode: string): Promise<PriceEntry[]> {
    try {
      const response = await fetch(`https://api.barcodespider.com/v1/lookup?token=&upc=${barcode}`);
      console.log(`[pricingService] BarcodeSpider response status: ${response.status}`);
      if (response.ok) {
        const data: BarcodeSpiderResponse = await response.json();
        const prices = this.extractPricingFromBarcodeSpider(barcode, data);
        console.log(`[pricingService] BarcodeSpider extracted ${prices.length} prices`);
        return prices;
      } else {
        console.warn(`[pricingService] BarcodeSpider returned status ${response.status}`);
      }
    } catch (error) {
      console.error('[pricingService] Error fetching pricing from BarcodeSpider:', error);
    }
    return [];
  }

  /**
   * Calculate price range and statistics
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
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const sum = sorted.reduce((acc, val) => acc + val, 0);
    const average = sum / sorted.length;
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    return { min, max, average, median };
  }

  /**
   * Calculate price trends from history
   */
  private calculateTrends(
    currentAverage: number,
    history: Array<{ price: number; timestamp: number }>
  ): ProductPricing['trends'] {
    if (history.length < 2) {
      return {
        currentPrice: currentAverage,
        priceChangeDirection: 'stable',
        volatility: 'low',
      };
    }

    // Get price from 30 days ago (or oldest available)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const oldPrices = history.filter(entry => entry.timestamp <= thirtyDaysAgo);
    
    let price30DaysAgo: number | undefined;
    if (oldPrices.length > 0) {
      const sorted = oldPrices.sort((a, b) => b.timestamp - a.timestamp);
      price30DaysAgo = sorted[0].price;
    } else if (history.length > 0) {
      // If no 30-day old data, use oldest available
      const sorted = history.sort((a, b) => a.timestamp - b.timestamp);
      price30DaysAgo = sorted[0].price;
    }

    let priceChange: number | undefined;
    let priceChangeDirection: 'up' | 'down' | 'stable' = 'stable';

    if (price30DaysAgo && price30DaysAgo > 0) {
      priceChange = ((currentAverage - price30DaysAgo) / price30DaysAgo) * 100;
      
      if (Math.abs(priceChange) < 2) {
        priceChangeDirection = 'stable';
      } else if (priceChange > 0) {
        priceChangeDirection = 'up';
      } else {
        priceChangeDirection = 'down';
      }
    }

    // Calculate volatility (standard deviation)
    const prices = history.map(h => h.price);
    const avg = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    const volatilityPercent = (stdDev / avg) * 100;

    let volatility: 'low' | 'medium' | 'high' = 'low';
    if (volatilityPercent > 15) {
      volatility = 'high';
    } else if (volatilityPercent > 5) {
      volatility = 'medium';
    }

    return {
      currentPrice: currentAverage,
      price30DaysAgo,
      priceChange,
      priceChangeDirection,
      volatility,
    };
  }

  /**
   * Aggregate prices from multiple sources
   */
  private aggregatePrices(prices: PriceEntry[]): {
    retailerPrices: RetailerPrice[];
    priceEntries: PriceEntry[];
  } {
    const retailerMap = new Map<string, RetailerPrice>();
    const priceEntries: PriceEntry[] = [];

    prices.forEach(price => {
      priceEntries.push(price);

      if (price.retailer) {
        const key = `${price.retailer}_${price.currency}`;
        if (!retailerMap.has(key) || retailerMap.get(key)!.price > price.price) {
          retailerMap.set(key, {
            retailerName: price.retailer,
            price: price.price,
            currency: price.currency,
            inStock: true,
            location: price.location,
          });
        }
      }
    });

    return {
      retailerPrices: Array.from(retailerMap.values()),
      priceEntries,
    };
  }

  /**
   * Get pricing data for a product - location-aware with local store prices
   * Prioritizes prices from nearby stores within 20 miles
   */
  async getProductPricing(
    barcode: string,
    targetCurrency?: string,
    forceRefresh: boolean = false,
    productName?: string
  ): Promise<ProductPricing | null> {
    try {
      // Determine target currency
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

      // CRITICAL: Get user location - required for accurate local pricing
      let location = null;
      try {
        location = await this.getUserLocation();
        if (!location) {
          console.warn('[pricingService] Location not available - local store prices will not be fetched');
        } else {
          console.log(`[pricingService] Location obtained: ${location.city || location.region || location.country || 'Unknown'}`);
        }
      } catch (error) {
        console.warn('[pricingService] Location not available, continuing without location data:', error);
        // Continue without location - online pricing will still work
      }

      // Fetch pricing from APIs (parallel) - prioritize local stores if location available
      console.log(`[pricingService] Fetching pricing for barcode: ${barcode}`);
      
      const pricingPromises: Promise<PriceEntry[]>[] = [
        this.fetchPricingFromAPIs(barcode, productName),
        priceStorageService.getUserSubmittedPrices(barcode).then(prices => prices.map(up => ({
          price: up.price,
          currency: up.currency.toUpperCase(),
          retailer: up.retailer,
          timestamp: up.timestamp,
          source: 'user' as const,
          verified: false,
        }))),
      ];
      
      // Add local store pricing if location is available
      // This uses REAL-TIME WEB SCRAPING from store websites
      if (location && location.coordinates) {
        console.log(`[pricingService] Fetching local store prices via real-time web scraping`);
        pricingPromises.push(
          fetchLocalStorePrices(
            barcode,
            productName || `Product ${barcode}`,
            location.coordinates.lat,
            location.coordinates.lng,
            20 // 20 miles radius
          ).then(localPrices => {
            console.log(`[pricingService] ✅ Real-time scraping found ${localPrices.length} local store prices`);
            return localPrices.map(lp => ({
              price: lp.price,
              currency: lp.currency,
              retailer: lp.storeLocation.name,
              location: lp.storeLocation.address,
              timestamp: lp.timestamp,
              source: 'api' as const, // Scraped from official websites
              verified: true, // Real-time data is always verified
            }));
          }).catch(error => {
            console.error('[pricingService] Error in real-time web scraping:', error);
            return [];
          })
        );
      } else {
        console.warn('[pricingService] ⚠️ No location - cannot perform real-time web scraping. Enable location services to see local store prices.');
      }
      
      const pricingResults = await Promise.all(pricingPromises);
      const apiPrices = pricingResults[0] || [];
      const userPrices = pricingResults[1] || [];
      const localStorePrices = pricingResults[2] || [];
      
      console.log(`[pricingService] API prices: ${apiPrices.length}, User prices: ${userPrices.length}, Local store prices: ${localStorePrices.length}`);

      // Combine all prices - prioritize local store prices
      // Order: Local stores (most relevant) > API prices > User submitted prices
      const allPrices = [
        ...localStorePrices, // Local stores first (most relevant to user)
        ...apiPrices,        // Online API prices
        ...userPrices,       // User submitted prices
      ];
      
      // Filter out duplicates (same retailer, same currency, similar price)
      const uniquePrices = this.deduplicatePrices(allPrices);

      console.log(`[pricingService] Total prices found: ${uniquePrices.length} (${localStorePrices.length} local, ${apiPrices.length} online, ${userPrices.length} user)`);
      if (uniquePrices.length === 0) {
        console.log(`[pricingService] No pricing data available for barcode: ${barcode}`);
        if (!location || !location.coordinates) {
          console.warn(`[pricingService] No location - enable location services to see local store prices`);
        }
        return null;
      }

      // Normalize prices to local currency (user's currency based on location)
      const normalized = await currencyService.normalizePrices(
        uniquePrices.map(p => ({ price: p.price, currency: p.currency })),
        currency
      );

      // Map normalized prices back to PriceEntry format
      const normalizedPrices: PriceEntry[] = normalized.map((np, index) => ({
        ...allPrices[index],
        price: np.price,
        currency: np.currency,
      }));

      // Calculate price range
      const priceValues = normalizedPrices.map(p => p.price);
      const priceRange = this.calculatePriceRange(priceValues);

      // Aggregate retailer prices
      const { retailerPrices, priceEntries } = this.aggregatePrices(normalizedPrices);

      // Get price history for trends
      const history = await priceStorageService.getPriceHistory(barcode, 30);
      const trends = this.calculateTrends(priceRange.average, history);

      // Determine data quality
      let dataQuality: ProductPricing['dataQuality'] = 'insufficient';
      if (normalizedPrices.length >= 5) {
        dataQuality = 'high';
      } else if (normalizedPrices.length >= 3) {
        dataQuality = 'medium';
      } else if (normalizedPrices.length >= 1) {
        dataQuality = 'low';
      }

      // Build pricing object
      const pricing: ProductPricing = {
        barcode,
        currency: currency.toUpperCase(),
        location: location ? {
          country: location.country,
          region: location.region,
          city: location.city,
          coordinates: location.coordinates,
        } : undefined,
        prices: normalizedPrices,
        priceRange,
        trends,
        retailers: retailerPrices.length > 0 ? retailerPrices : undefined,
        lastUpdated: Date.now(),
        dataQuality,
      };

      // Cache the pricing data
      await priceStorageService.cachePricing(barcode, pricing);

      return pricing;
    } catch (error) {
      console.error('Error getting product pricing:', error);
      return null;
    }
  }

  /**
   * Submit user price
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

