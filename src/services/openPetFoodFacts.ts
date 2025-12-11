// Open Pet Food Facts API client
import { Product } from '../types/product';
import { fetchWithRateLimit } from '../utils/timeoutHelper';

const OPFF_API_BASE = 'https://world.openpetfoodfacts.org/api/v2/product';
const USER_AGENT = 'TrueScan-FoodScanner/1.0.0';

export interface OPFFResponse {
  status: number;
  status_verbose: string;
  product?: Product;
  code?: string;
}

/**
 * Fetch product data from Open Pet Food Facts API
 * Covers pet food products (dog food, cat food, pet treats, etc.)
 */
export async function fetchProductFromOPFF(barcode: string): Promise<Product | null> {
  try {
    const url = `${OPFF_API_BASE}/${barcode}.json`;
    
    const response = await fetchWithRateLimit(url, {
      headers: {
        'User-Agent': USER_AGENT,
      },
    }, 'openpetfoodfacts');

    if (!response.ok) {
      // 404 is expected when product not in pet food database - use debug level
      if (response.status === 404) {
        console.log(`[OPFF] Product not found in pet food database (expected)`);
      } else {
        console.warn(`OPFF API error: ${response.status} ${response.statusText}`);
      }
      return null;
    }

    const data: OPFFResponse = await response.json();

    // CRITICAL FIX: Accept products even with status: 0 if product data exists
    // Open Pet Food Facts may return status: 0 with partial product data
    if (!data.product) {
      console.warn(`Product not found in OPFF: ${barcode}`);
      return null;
    }

    // Log if status was 0 but we're accepting the product anyway (for debugging)
    if (data.status === 0) {
      console.log(`OPFF API returned status: 0 but product data exists for ${barcode} (accepting product)`);
    }

    // Add source and barcode
    const product: Product = {
      ...data.product,
      barcode,
      source: 'openpetfoodfacts',
    };

    // Pet food products use similar structure to Open Food Facts
    // Enhance with sustainability data if available
    if (product.ecoscore_grade || product.ecoscore_score) {
      // Pet food products may have eco-score data
    }

    return product;
  } catch (error) {
    console.error(`Error fetching from OPFF: ${error}`);
    return null;
  }
}

