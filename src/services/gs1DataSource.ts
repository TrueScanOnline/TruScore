// GS1 Data Source API client
// Official GS1 barcode registry (Global Trade Item Number)
import { Product } from '../types/product';
import { fetchWithRateLimit } from '../utils/timeoutHelper';

const GS1_API_BASE = 'https://api.gs1.org/v1';
const USER_AGENT = 'TrueScan-FoodScanner/1.0.0';

// Note: GS1 API requires subscription or 60-day free trial (NOT completely free)
// Free trial registration: https://store.gs1us.org/view-use-api-trial/p
// Paid subscription: https://www.gs1us.org/tools/gs1-us-data-hub/gs1-us-apis
// Developer portal: https://developer.gs1.org/
// Store in environment variable: EXPO_PUBLIC_GS1_API_KEY
const GS1_API_KEY = process.env.EXPO_PUBLIC_GS1_API_KEY || '';

export interface GS1ProductResponse {
  gtin?: string;
  productName?: string;
  brandName?: string;
  description?: string;
  category?: string;
  imageUrl?: string;
  manufacturer?: {
    name?: string;
  };
  attributes?: Array<{
    name: string;
    value: string;
  }>;
}

/**
 * Fetch product data from GS1 Data Source API
 * Official barcode verification and basic product information
 */
export async function fetchProductFromGS1(barcode: string): Promise<Product | null> {
  // Skip if no API key configured
  // Note: GS1 requires subscription or trial, so this is expected if no key is provided
  if (!GS1_API_KEY) {
    console.log('GS1 API key not configured (requires subscription or 60-day trial), skipping GS1 lookup');
    return null;
  }

  try {
    // GS1 API endpoint for product lookup by GTIN
    const url = `${GS1_API_BASE}/product/gtin/${barcode}`;
    
    const response = await fetchWithRateLimit(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Authorization': `Bearer ${GS1_API_KEY}`,
        'Accept': 'application/json',
      },
    }, 'gs1_datasource');

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Product not found in GS1: ${barcode}`);
        return null;
      }
      console.warn(`GS1 API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: GS1ProductResponse = await response.json();

    if (!data.gtin) {
      return null;
    }

    // Convert GS1 data to Product format
    const product: Product = {
      barcode: data.gtin,
      product_name: data.productName || data.description || `Product ${barcode}`,
      brands: data.brandName || data.manufacturer?.name || undefined,
      image_url: data.imageUrl || undefined,
      source: 'gs1_datasource',
      // GS1 provides official, verified data
      quality: 95,
      completion: 70, // GS1 has basic info, not detailed nutrition
    };

    // Extract additional attributes if available
    if (data.attributes && data.attributes.length > 0) {
      const attributesMap: Record<string, string> = {};
      data.attributes.forEach(attr => {
        attributesMap[attr.name] = attr.value;
      });
      
      // Try to extract category
      if (data.category) {
        product.categories_tags = [data.category.toLowerCase()];
      }
    }

    return product;
  } catch (error) {
    console.error(`Error fetching from GS1: ${error}`);
    return null;
  }
}

/**
 * Search GS1 Data Source by product name (if search endpoint available)
 * Note: GS1 primarily provides barcode lookup, not search
 */
export async function searchGS1DataSource(query: string, limit = 20): Promise<Product[]> {
  // GS1 API doesn't have a public search endpoint
  // This is primarily for barcode verification
  // Return empty array as GS1 is lookup-only
  return [];
}

