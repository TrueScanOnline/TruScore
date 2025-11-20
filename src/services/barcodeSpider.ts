// Barcode Spider API client (fallback)
import { Product } from '../types/product';

const BARCODE_SPIDER_API = 'https://api.barcodespider.com/v1/lookup';
const API_KEY = ''; // Free tier - no key needed for basic lookup

export interface BarcodeSpiderResponse {
  item_response: {
    code: number;
    status: number;
    message: string;
    item?: {
      barcode: string;
      title?: string;
      alias?: string;
      description?: string;
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
      stores?: Array<{
        name: string;
        price: string;
        currency: string;
        availability: string;
        link: string;
      }>;
    };
  };
}

/**
 * Fetch basic product info from Barcode Spider (fallback)
 */
export async function fetchProductFromBarcodeSpider(barcode: string): Promise<Product | null> {
  try {
    const url = `${BARCODE_SPIDER_API}?token=${API_KEY}&upc=${barcode}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`Barcode Spider API error: ${response.status}`);
      return null;
    }

    const data: BarcodeSpiderResponse = await response.json();

    if (data.item_response.code !== 200 || !data.item_response.item) {
      console.warn(`Product not found in Barcode Spider: ${barcode}`);
      return null;
    }

    const item = data.item_response.item;

    // Convert to our Product format
    const product: Product = {
      barcode: item.barcode || barcode,
      product_name: item.title || item.alias,
      brands: item.brand,
      generic_name: item.description,
      categories: item.category,
      image_url: item.images && item.images.length > 0 ? item.images[0] : undefined,
      source: 'barcode_spider',
    };

    return product;
  } catch (error) {
    console.error('Error fetching from Barcode Spider:', error);
    return null;
  }
}

