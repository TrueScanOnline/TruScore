// UPCitemdb API client (additional data source for broader product coverage)
// Covers: food, drinks, alcohol, cosmetics, household products, pet food, etc.
import { Product } from '../types/product';

const UPCITEMDB_API = 'https://api.upcitemdb.com/prod/trial/lookup';

export interface UPCitemdbResponse {
  code: string;
  total: number;
  offset: number;
  items?: Array<{
    ean: string;
    title?: string;
    description?: string;
    upc?: string;
    brand?: string;
    model?: string;
    color?: string;
    size?: string;
    dimension?: string;
    weight?: string;
    category?: string;
    currency?: string;
    lowest_recorded_price?: number;
    highest_recorded_price?: number;
    images?: string[];
    offers?: Array<{
      merchant?: string;
      title?: string;
      link?: string;
      updated_t?: number;
      availability?: string;
      price?: number;
      shipping?: string;
      condition?: string;
    }>;
  }>;
}

/**
 * Fetch product data from UPCitemdb API
 * Covers a wide range of products including alcohol, household items, cosmetics, etc.
 */
export async function fetchProductFromUPCitemdb(barcode: string): Promise<Product | null> {
  try {
    const url = `${UPCITEMDB_API}?upc=${barcode}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TrueScan-FoodScanner/1.0.0',
      },
    });

    if (!response.ok) {
      console.warn(`UPCitemdb API error: ${response.status}`);
      return null;
    }

    const data: UPCitemdbResponse = await response.json();

    if (!data.items || data.items.length === 0 || !data.items[0]) {
      console.warn(`Product not found in UPCitemdb: ${barcode}`);
      return null;
    }

    const item = data.items[0];

    // Convert to our Product format
    const product: Product = {
      barcode: item.ean || item.upc || barcode,
      product_name: item.title,
      brands: item.brand,
      generic_name: item.description,
      categories: item.category,
      image_url: item.images && item.images.length > 0 ? item.images[0] : undefined,
      source: 'upcitemdb',
      // Map additional fields if available
      quantity: item.weight || item.size,
      packaging: item.dimension,
    };

    return product;
  } catch (error) {
    console.error('Error fetching from UPCitemdb:', error);
    return null;
  }
}

