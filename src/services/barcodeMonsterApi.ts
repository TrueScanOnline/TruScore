// Barcode Monster API client (free tier available)
// Good for general products, returns product name, brand, image
import { Product } from '../types/product';
import { createTimeoutSignal, fetchWithRateLimit } from '../utils/timeoutHelper';

const BARCODE_MONSTER_API = 'https://api.barcodemonster.com/v1/lookup';
const API_KEY = process.env.EXPO_PUBLIC_BARCODE_MONSTER_API_KEY || ''; // Optional - free tier works without key

export interface BarcodeMonsterResponse {
  barcode?: string;
  product?: {
    name?: string;
    brand?: string;
    description?: string;
    category?: string;
    image?: string;
  };
  status?: string;
}

/**
 * Fetch product data from Barcode Monster API
 */
export async function fetchProductFromBarcodeMonster(barcode: string): Promise<Product | null> {
  try {
    const url = API_KEY
      ? `${BARCODE_MONSTER_API}?barcode=${barcode}&api_key=${API_KEY}`
      : `${BARCODE_MONSTER_API}?barcode=${barcode}`;
    
    const signal = createTimeoutSignal(5000); // 5 second timeout
    
    const response = await fetchWithRateLimit(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TrueScan-FoodScanner/1.0.0',
      },
      signal,
    }, 'barcode_monster');

    if (!response.ok) {
      if (response.status !== 404) {
        console.log(`[DEBUG] Barcode Monster API error: ${response.status}`);
      }
      return null;
    }

    const data: BarcodeMonsterResponse = await response.json();

    if (!data.product || (!data.product.name && !data.product.brand)) {
      return null;
    }

    const product = data.product;

    // Convert to our Product format
    const result: Product = {
      barcode: data.barcode || barcode,
      product_name: product.name,
      brands: product.brand,
      generic_name: product.description,
      categories: product.category,
      image_url: product.image,
      source: 'barcode_monster',
    };

    return result;
  } catch (error: any) {
    // Don't log network errors as warnings - they're expected
    if (error.name !== 'AbortError' && error.message && !error.message.includes('timeout')) {
      console.log(`[DEBUG] Barcode Monster API error for ${barcode}:`, error.message);
    }
    return null;
  }
}

