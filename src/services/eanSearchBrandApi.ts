// EAN-Search.org Brand Enrichment API
// Provides brand owner mapping and basic product information
// Free tier: 1,000 queries/day

import { Product } from '../types/product';
import { logger } from '../utils/logger';
import { fetchWithRateLimit } from '../utils/timeoutHelper';

const EAN_SEARCH_API_BASE = 'https://api.ean-search.org/api';
const USER_AGENT = 'TrueScan-FoodScanner/1.0.0';

// Note: EAN-Search requires API access token
// Get your token at: https://www.ean-search.org/
// Store in environment variable: EXPO_PUBLIC_EAN_SEARCH_TOKEN
const EAN_SEARCH_TOKEN = process.env.EXPO_PUBLIC_EAN_SEARCH_TOKEN || '';

export interface EANSearchBrandData {
  ean?: string;
  name?: string;
  category?: string;
  manufacturer?: string;
  brand?: string;
  description?: string;
  image?: string;
}

/**
 * Fetch brand owner information from EAN-Search API
 * Used for brand database enrichment
 */
export async function fetchBrandFromEANSearch(barcode: string): Promise<EANSearchBrandData | null> {
  // Skip if no API token configured
  if (!EAN_SEARCH_TOKEN) {
    logger.debug('EAN-Search API token not configured, skipping brand lookup');
    return null;
  }

  try {
    const url = `${EAN_SEARCH_API_BASE}?token=${EAN_SEARCH_TOKEN}&op=barcode-lookup&format=json&ean=${encodeURIComponent(barcode)}`;
    
    const response = await fetchWithRateLimit(url, {
      headers: {
        'User-Agent': USER_AGENT,
      },
    }, 'ean_search');

    if (!response.ok) {
      if (response.status === 404) {
        logger.debug(`EAN-Search: Brand not found for ${barcode}`);
        return null;
      }
      logger.debug(`EAN-Search API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    if (!data || !data.name) {
      return null;
    }

    return {
      ean: data.ean || barcode,
      name: data.name,
      category: data.category,
      manufacturer: data.manufacturer,
      brand: data.brand,
      description: data.description,
      image: data.image,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.debug(`EAN-Search API error for ${barcode}:`, errorMessage);
    return null;
  }
}

/**
 * Enrich product with brand owner information from EAN-Search
 */
export async function enrichProductWithEANSearchBrand(product: Product): Promise<Product> {
  if (!product.barcode) {
    return product;
  }

  try {
    const brandData = await fetchBrandFromEANSearch(product.barcode);
    
    if (brandData) {
      // Enhance product with brand owner information
      if (brandData.manufacturer && !product.brands) {
        product.brands = brandData.manufacturer;
      }
      
      // Store EAN-Search data for reference
      (product as any).ean_search_brand = brandData;
      
      logger.debug(`Enriched product with EAN-Search brand data: ${product.barcode}`);
    }
  } catch (error) {
    logger.debug('Error enriching product with EAN-Search brand:', error);
  }

  return product;
}

