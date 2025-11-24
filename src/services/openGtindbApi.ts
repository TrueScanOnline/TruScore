// Open GTIN Database API client (free tier available)
// Good for global product database, returns product name, brand, image
import { Product } from '../types/product';
import { createTimeoutSignal, fetchWithRateLimit } from '../utils/timeoutHelper';

const OPEN_GTIN_API = 'https://api.opengtindb.org/gtin';
const API_KEY = process.env.EXPO_PUBLIC_OPEN_GTIN_API_KEY || ''; // Optional - free tier works without key

export interface OpenGtinResponse {
  gtin?: string;
  name?: string;
  brand?: string;
  category?: string;
  image?: string;
  description?: string;
}

/**
 * Fetch product data from Open GTIN Database API
 */
export async function fetchProductFromOpenGtin(barcode: string): Promise<Product | null> {
  try {
    const url = API_KEY
      ? `${OPEN_GTIN_API}/${barcode}?key=${API_KEY}`
      : `${OPEN_GTIN_API}/${barcode}`;
    
    const signal = createTimeoutSignal(5000); // 5 second timeout
    
    const response = await fetchWithRateLimit(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TrueScan-FoodScanner/1.0.0',
      },
      signal,
    }, 'open_gtin');

    if (!response.ok) {
      if (response.status !== 404) {
        console.warn(`Open GTIN API error: ${response.status}`);
      }
      return null;
    }

    const data: OpenGtinResponse = await response.json();

    if (!data.name && !data.brand) {
      return null;
    }

    // Convert to our Product format
    const result: Product = {
      barcode: data.gtin || barcode,
      product_name: data.name,
      brands: data.brand,
      generic_name: data.description,
      categories: data.category,
      image_url: data.image,
      source: 'open_gtin',
    };

    return result;
  } catch (error: any) {
    // Don't log network errors as warnings - they're expected
    if (error.name !== 'AbortError' && error.message && !error.message.includes('timeout')) {
      console.log(`[DEBUG] Open GTIN API error for ${barcode}:`, error.message);
    }
    return null;
  }
}

