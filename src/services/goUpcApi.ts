// Go-UPC API client (free tier available)
// Good for general products, returns product name, brand, image, stores
import { Product } from '../types/product';
import { createTimeoutSignal, fetchWithRateLimit } from '../utils/timeoutHelper';

const GO_UPC_API = 'https://go-upc.com/api/v1/code';
const API_KEY = process.env.EXPO_PUBLIC_GO_UPC_API_KEY || ''; // Optional - free tier works without key

export interface GoUpcResponse {
  code: string;
  product?: {
    name?: string;
    description?: string;
    brand?: string;
    category?: string;
    image?: string;
    stores?: Array<{
      name?: string;
      price?: string;
      currency?: string;
      availability?: string;
      link?: string;
    }>;
  };
}

/**
 * Fetch product data from Go-UPC API
 */
export async function fetchProductFromGoUpc(barcode: string): Promise<Product | null> {
  try {
    const url = API_KEY 
      ? `${GO_UPC_API}/${barcode}?key=${API_KEY}`
      : `${GO_UPC_API}/${barcode}`;
    
    const signal = createTimeoutSignal(5000); // 5 second timeout
    
    const response = await fetchWithRateLimit(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TrueScan-FoodScanner/1.0.0',
      },
      signal,
    }, 'go_upc');

    if (!response.ok) {
      // Suppress 401 (unauthorized) and 404 (not found) - they're expected
      // Only log unexpected server errors (5xx)
      if (response.status >= 500) {
        console.warn(`Go-UPC API error: ${response.status}`);
      }
      return null;
    }

    const data: GoUpcResponse = await response.json();

    if (!data.product || !data.product.name) {
      return null;
    }

    const product = data.product;

    // Convert to our Product format
    const result: Product = {
      barcode: data.code || barcode,
      product_name: product.name,
      brands: product.brand,
      generic_name: product.description,
      categories: product.category,
      image_url: product.image,
      source: 'go_upc',
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
      console.log(`[DEBUG] Go-UPC API error for ${barcode}:`, error.message);
    }
    return null;
  }
}

