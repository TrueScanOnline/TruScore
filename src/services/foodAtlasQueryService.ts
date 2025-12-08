// FoodAtlas Query Service
// Client-side service to query FoodAtlas database via server-side API
// FREE, Open Source (Apache-2.0 license)
// URL: https://www.foodatlas.ai/

import { Product, ProductNutriments } from '../types/product';
import { logger } from '../utils/logger';

const FOODATLAS_QUERY_API = process.env.EXPO_PUBLIC_FOODATLAS_QUERY_URL || 
  'https://truscoreapi-l69qp6606-leightons-projects-d328c774.vercel.app/api/foodatlas-query';

export interface FoodAtlasResponse {
  found: boolean;
  name?: string;
  nutriments?: ProductNutriments;
  nutrient_count?: number;
  source?: string;
}

/**
 * Query FoodAtlas database by product name
 * Uses server-side API endpoint (database is on Vercel)
 */
export async function queryFoodAtlasByProductName(
  productName: string
): Promise<Product | null> {
  try {
    if (!productName || productName.trim().length === 0) {
      return null;
    }

    // Reject generic product names (e.g., "Product 9310645467740")
    const trimmedName = productName.trim();
    if (trimmedName.match(/^Product\s+\d+$/i) || trimmedName.match(/^Product\s+[a-z0-9]+$/i)) {
      logger.debug(`[FoodAtlas] Rejecting generic product name: "${trimmedName}"`);
      return null;
    }

    const url = `${FOODATLAS_QUERY_API}?productName=${encodeURIComponent(trimmedName)}`;
    
    logger.debug(`[FoodAtlas] Querying API: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        logger.debug(`[FoodAtlas] Product not found: ${productName}`);
        return null;
      }
      logger.warn(`[FoodAtlas] API error: ${response.status}`);
      return null;
    }

    const data: FoodAtlasResponse = await response.json();

    if (!data.found || !data.nutriments) {
      return null;
    }

    // Convert to Product format
    const product: Product = {
      barcode: '', // FoodAtlas doesn't have barcodes
      product_name: data.name,
      product_name_en: data.name,
      nutriments: data.nutriments,
      source: 'foodatlas',
      quality: 80, // High quality nutrition data
      completion: 60, // Moderate completeness (nutrition only)
    };

    logger.debug(`[FoodAtlas] Found product: ${data.name} (${data.nutrient_count} nutrients)`);
    return product;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.debug(`[FoodAtlas] API error for ${productName}:`, errorMessage);
    return null;
  }
}

