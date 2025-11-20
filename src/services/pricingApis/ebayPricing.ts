// eBay Finding API pricing integration
// Requires App ID from https://developer.ebay.com/
import { PriceEntry } from '../../types/pricing';

const EBAY_API_BASE = 'https://svcs.ebay.com/services/search/FindingService/v1';
const EBAY_APP_ID = process.env.EXPO_PUBLIC_EBAY_APP_ID || '';

export interface eBayItem {
  itemId: string;
  title: string;
  globalId: string;
  primaryCategory: {
    categoryId: string;
    categoryName: string;
  };
  galleryURL?: string;
  viewItemURL: string;
  location: string;
  country: string;
  shippingInfo: {
    shippingServiceCost?: {
      '@currencyId': string;
      __value__: string;
    };
    shippingType: string;
    shipToLocations: string;
    expeditedShipping: boolean;
    oneDayShippingAvailable: boolean;
    handlingTime: number;
  };
  sellingStatus: {
    currentPrice: {
      '@currencyId': string;
      __value__: string;
    };
    convertedCurrentPrice: {
      '@currencyId': string;
      __value__: string;
    };
    bidCount?: string;
    timeLeft: string;
    listingStatus: string;
  };
  listingInfo: {
    bestOfferEnabled: boolean;
    buyItNowAvailable: boolean;
    listingType: string;
    gift: boolean;
    watchCount?: string;
  };
  returnsAccepted: boolean;
  condition?: {
    conditionId: string;
    conditionDisplayName: string;
  };
  isMultiVariationListing: boolean;
  topRatedListing: boolean;
}

export interface eBayResponse {
  findItemsByProductResponse: Array<{
    ack: string[];
    version: string[];
    timestamp: string[];
    searchResult?: Array<{
      '@count': string;
      item?: eBayItem[];
    }>;
    paginationOutput?: Array<{
      totalPages: string[];
      totalEntries: string[];
      pageNumber: string[];
      entriesPerPage: string[];
    }>;
    errorMessage?: Array<{
      error: Array<{
        errorId: string[];
        domain: string[];
        severity: string[];
        category: string[];
        message: string[];
        subdomain?: string[];
        parameter?: Array<{
          '@name': string;
          __value__: string;
        }>;
      }>;
    }>;
  }>;
}

/**
 * Fetch pricing from eBay Finding API using UPC/EAN
 */
export async function fetchEbayPrices(barcode: string): Promise<PriceEntry[]> {
  const prices: PriceEntry[] = [];

  if (!EBAY_APP_ID) {
    console.warn('[eBay] App ID not configured');
    return prices;
  }

  try {
    // eBay Finding API with product ID (UPC/EAN)
    const url = `${EBAY_API_BASE}?OPERATION-NAME=findItemsByProduct&SERVICE-VERSION=1.0.0&SECURITY-APPNAME=${EBAY_APP_ID}&RESPONSE-DATA-FORMAT=JSON&REST-PAYLOAD&productId.@type=UPC&productId=${barcode}&paginationInput.entriesPerPage=20&sortOrder=PricePlusShippingLowest`;
    
    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`[eBay] API error: ${response.status}`);
      return prices;
    }

    const data: eBayResponse = await response.json();

    const searchResult = data.findItemsByProductResponse?.[0]?.searchResult?.[0];
    
    if (searchResult?.item) {
      searchResult.item.forEach(item => {
        // eBay API response structure - sellingStatus is an object, not array
        const sellingStatus = item.sellingStatus;
        const currentPrice = sellingStatus?.currentPrice;
        
        if (currentPrice) {
          const priceValue = typeof currentPrice === 'object' && '__value__' in currentPrice
            ? currentPrice.__value__
            : currentPrice;
          const price = parseFloat(priceValue || '0');
          const currency = (typeof currentPrice === 'object' && '@currencyId' in currentPrice
            ? currentPrice['@currencyId']
            : 'USD') || 'USD';
          
          if (price > 0) {
            prices.push({
              price,
              currency,
              retailer: 'eBay',
              timestamp: Date.now(),
              source: 'api',
              verified: false, // eBay listings vary by seller
            });
          }
        }
      });
    }

    console.log(`[eBay] Found ${prices.length} listings`);
    return prices;
  } catch (error) {
    console.error('[eBay] Error fetching prices:', error);
    return prices;
  }
}

