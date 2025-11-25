// Buycott API client (free tier available)
// Good for ethical product data, returns product name, brand, ethical info
import { Product } from '../types/product';
import { createTimeoutSignal, fetchWithRateLimit } from '../utils/timeoutHelper';

const BUYCOTT_API = 'https://api.buycott.com/v4/products/lookup';
const API_KEY = process.env.EXPO_PUBLIC_BUYCOTT_API_KEY || ''; // Optional - free tier works without key

export interface BuycottResponse {
  products?: Array<{
    id?: string;
    name?: string;
    brand?: string;
    barcode?: string;
    image_url?: string;
    description?: string;
    category?: string;
  }>;
}

/**
 * Fetch product data from Buycott API
 */
export async function fetchProductFromBuycott(barcode: string): Promise<Product | null> {
  try {
    const url = API_KEY
      ? `${BUYCOTT_API}?barcode=${barcode}&api_key=${API_KEY}`
      : `${BUYCOTT_API}?barcode=${barcode}`;
    
    const signal = createTimeoutSignal(5000); // 5 second timeout
    
    const response = await fetchWithRateLimit(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TrueScan-FoodScanner/1.0.0',
      },
      signal,
    }, 'buycott');

    if (!response.ok) {
      if (response.status !== 404) {
        console.warn(`Buycott API error: ${response.status}`);
      }
      return null;
    }

    const data: BuycottResponse = await response.json();

    if (!data.products || data.products.length === 0 || !data.products[0]) {
      return null;
    }

    const product = data.products[0];

    // Convert to our Product format
    const result: Product = {
      barcode: product.barcode || barcode,
      product_name: product.name,
      brands: product.brand,
      generic_name: product.description,
      categories: product.category,
      image_url: product.image_url,
      source: 'buycott',
    };

    return result;
  } catch (error: any) {
    // Suppress network errors and timeouts - they're expected and not actionable
    // Only log unexpected errors that might indicate a code issue
    if (error.name !== 'AbortError' && 
        error.message && 
        !error.message.includes('timeout') && 
        !error.message.includes('Network request failed') &&
        !error.message.includes('Failed to fetch')) {
      // Only log non-network errors that might be actionable
      console.log(`[DEBUG] Buycott API error for ${barcode}:`, error.message);
    }
    return null;
  }
}

