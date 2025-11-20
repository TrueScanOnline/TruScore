// Walmart Open API pricing integration
// Requires API key from https://developer.walmartlabs.com/
import { PriceEntry } from '../../types/pricing';

const WALMART_API_BASE = 'https://api.walmartlabs.com/v1';
const WALMART_API_KEY = process.env.EXPO_PUBLIC_WALMART_API_KEY || '';

export interface WalmartProduct {
  itemId: number;
  name: string;
  salePrice: number;
  msrp?: number;
  currency: string;
  availableOnline: boolean;
  productUrl: string;
  addToCartUrl: string;
  numReviews?: number;
  customerRating?: number;
  largeImage?: string;
}

export interface WalmartResponse {
  query: string;
  sort: string;
  format: string;
  responseGroup: string;
  totalResults: number;
  start: number;
  numItems: number;
  items?: WalmartProduct[];
  errors?: Array<{
    code: string;
    message: string;
  }>;
}

/**
 * Fetch pricing from Walmart Open API
 */
export async function fetchWalmartPrices(barcode: string): Promise<PriceEntry[]> {
  const prices: PriceEntry[] = [];

  if (!WALMART_API_KEY) {
    console.warn('[Walmart] API key not configured');
    return prices;
  }

  try {
    const url = `${WALMART_API_BASE}/items?apiKey=${WALMART_API_KEY}&upc=${barcode}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`[Walmart] API error: ${response.status}`);
      return prices;
    }

    const data: WalmartResponse = await response.json();

    if (data.items && data.items.length > 0) {
      data.items.forEach(item => {
        if (item.salePrice) {
          prices.push({
            price: item.salePrice,
            currency: item.currency || 'USD',
            retailer: 'Walmart',
            timestamp: Date.now(),
            source: 'api',
            verified: true,
          });

          // Also add MSRP if different from sale price
          if (item.msrp && item.msrp !== item.salePrice) {
            prices.push({
              price: item.msrp,
              currency: item.currency || 'USD',
              retailer: 'Walmart (MSRP)',
              timestamp: Date.now(),
              source: 'api',
              verified: true,
            });
          }
        }
      });
    }

    console.log(`[Walmart] Found ${prices.length} prices`);
    return prices;
  } catch (error) {
    console.error('[Walmart] Error fetching prices:', error);
    return prices;
  }
}

