// Open Pet Food Facts API client
import { Product } from '../types/product';

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
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
      },
    });

    if (!response.ok) {
      console.warn(`OPFF API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: OPFFResponse = await response.json();

    if (data.status === 0 || !data.product) {
      console.warn(`Product not found in OPFF: ${barcode}`);
      return null;
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

