// Open Products Facts API client
import { Product } from '../types/product';
import { fetchWithRateLimit } from '../utils/timeoutHelper';

const OPF_API_BASE = 'https://world.openproductsfacts.org/api/v2/product';
const USER_AGENT = 'TrueScan-FoodScanner/1.0.0';

export interface OPFResponse {
  status: number;
  status_verbose: string;
  product?: Product;
  code?: string;
}

/**
 * Fetch product data from Open Products Facts API
 * Covers general products (electronics, household items, tools, etc.)
 */
export async function fetchProductFromOPF(barcode: string): Promise<Product | null> {
  try {
    const url = `${OPF_API_BASE}/${barcode}.json`;
    
    const response = await fetchWithRateLimit(url, {
      headers: {
        'User-Agent': USER_AGENT,
      },
    }, 'openproductsfacts');

    if (!response.ok) {
      // 404 is expected when product not in general products database - use debug level
      if (response.status === 404) {
        console.log(`[OPF] Product not found in general products database (expected)`);
      } else {
        console.warn(`OPF API error: ${response.status} ${response.statusText}`);
      }
      return null;
    }

    const data: OPFResponse = await response.json();

    // CRITICAL FIX: Accept products even with status: 0 if product data exists
    // Open Products Facts may return status: 0 with partial product data
    if (!data.product) {
      console.warn(`Product not found in OPF: ${barcode}`);
      return null;
    }

    // Log if status was 0 but we're accepting the product anyway (for debugging)
    if (data.status === 0) {
      console.log(`OPF API returned status: 0 but product data exists for ${barcode} (accepting product)`);
    }

    // Add source and barcode
    const product: Product = {
      ...data.product,
      barcode,
      source: 'openproductsfacts',
    };

    return product;
  } catch (error) {
    console.error(`Error fetching from OPF: ${error}`);
    return null;
  }
}

