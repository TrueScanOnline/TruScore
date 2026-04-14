// Walmart Open API client
// Official Walmart US products API
// Note: Requires API key registration at https://developer.walmartlabs.com/

import { Product } from '../types/product';
import { fetchWithRateLimit } from '../utils/timeoutHelper';
import { logger } from '../utils/logger';

const WALMART_API_BASE = 'https://api.walmartlabs.com/v1';
const USER_AGENT = 'Rveel/1.0.0';

// Note: Walmart Open API requires free API key registration
// Get your key at: https://developer.walmartlabs.com/
// Store in environment variable: EXPO_PUBLIC_WALMART_API_KEY
const WALMART_API_KEY = process.env.EXPO_PUBLIC_WALMART_API_KEY || '';

export interface WalmartProductResponse {
  items?: Array<{
    itemId?: number;
    upc?: string;
    name?: string;
    brandName?: string;
    shortDescription?: string;
    longDescription?: string;
    thumbnailImage?: string;
    largeImage?: string;
    productUrl?: string;
    salePrice?: number;
    msrp?: number;
    categoryPath?: string;
    categoryNode?: string;
    standardShipRate?: number;
    modelNumber?: string;
    productId?: string;
    productTrackingUrl?: string;
    availableOnline?: boolean;
    sellerInfo?: string;
    addToCartUrl?: string;
    affiliateAddToCartUrl?: string;
    freeShippingOver35Dollars?: boolean;
    offerType?: string;
    isTwoDayShippingEligible?: boolean;
    bundle?: boolean;
    clearance?: boolean;
    preOrder?: boolean;
    preOrderShipsOn?: string;
    stock?: string;
    size?: string;
    color?: string;
    format?: string;
    shipToStore?: boolean;
    freeShipToStore?: boolean;
    marketplace?: boolean;
    onlineOnly?: boolean;
    ninetySevenCentShipping?: boolean;
    specialBuy?: boolean;
    centerColumnImage?: string;
    showSellerInfo?: boolean;
    ageRestricted?: boolean;
    rhid?: string;
    attributes?: {
      [key: string]: string;
    };
    giftOptions?: {
      allowGiftWrap?: boolean;
      allowGiftMessage?: boolean;
      allowGiftReceipt?: boolean;
    };
    imageEntities?: Array<{
      thumbnailImage?: string;
      mediumImage?: string;
      largeImage?: string;
      entityType?: string;
    }>;
    offerCount?: number;
    customerRating?: string;
    customerRatingImage?: string;
    bestMarketplacePrice?: {
      price?: number;
      sellerInfo?: string;
      standardShipRate?: number;
      twoDayShippingRate?: number;
      availableOnline?: boolean;
      clearance?: boolean;
    };
  }>;
}

/**
 * Fetch product from Walmart Open API by barcode (UPC)
 */
export async function fetchProductFromWalmart(barcode: string): Promise<Product | null> {
  // Skip if no API key configured
  if (!WALMART_API_KEY) {
    logger.debug('Walmart Open API key not configured, skipping Walmart lookup');
    return null;
  }

  try {
    // Walmart API uses UPC lookup
    const url = `${WALMART_API_BASE}/items?apiKey=${WALMART_API_KEY}&upc=${encodeURIComponent(barcode)}`;
    
    const response = await fetchWithRateLimit(url, {
      headers: {
        'User-Agent': USER_AGENT,
      },
    }, 'walmart_open');

    if (!response.ok) {
      if (response.status === 404) {
        logger.debug(`Walmart: Product not found for ${barcode}`);
        return null;
      }
      logger.debug(`Walmart Open API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: WalmartProductResponse = await response.json();

    if (!data.items || data.items.length === 0) {
      logger.debug(`Walmart: Product not found for ${barcode}`);
      return null;
    }

    const walmartItem = data.items[0];
    
    // Convert Walmart product to our Product format
    const product: Product = {
      barcode,
      product_name: walmartItem.name || `Product ${barcode}`,
      brands: walmartItem.brandName,
      source: 'walmart_open',
      
      // Product description
      image_url: walmartItem.largeImage || walmartItem.thumbnailImage,
      
      // Extract nutrition from attributes if available
      nutriments: extractNutritionFromAttributes(walmartItem.attributes),
      
      // Extract ingredients from attributes if available
      ingredients_text: walmartItem.attributes?.ingredients || walmartItem.attributes?.ingredientList,
      
      // Quality indicators (store API data is good quality)
      quality: 80,
      completion: 75,
    };

    logger.debug(`Found product in Walmart: ${barcode}`);
    return product;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.debug(`Walmart Open API error for ${barcode}:`, errorMessage);
    return null;
  }
}

/**
 * Extract nutrition data from Walmart attributes
 */
function extractNutritionFromAttributes(attributes?: { [key: string]: string }): Product['nutriments'] {
  if (!attributes) {
    return undefined;
  }

  const nutriments: Product['nutriments'] = {};

  // Common nutrition attribute keys in Walmart data
  Object.entries(attributes).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase();
    const numValue = parseFloat(value);

    if (isNaN(numValue)) return;

    if (lowerKey.includes('calories') || lowerKey.includes('energy')) {
      nutriments['energy-kcal'] = numValue;
      nutriments['energy-kcal_100g'] = numValue;
    } else if (lowerKey.includes('fat')) {
      nutriments.fat = numValue;
      nutriments['fat_100g'] = numValue;
      if (lowerKey.includes('saturated')) {
        nutriments['saturated-fat'] = numValue;
        nutriments['saturated-fat_100g'] = numValue;
      }
    } else if (lowerKey.includes('carbohydrate')) {
      nutriments.carbohydrates = numValue;
      nutriments['carbohydrates_100g'] = numValue;
      if (lowerKey.includes('sugar')) {
        nutriments.sugars = numValue;
        nutriments['sugars_100g'] = numValue;
      }
    } else if (lowerKey.includes('fiber') || lowerKey.includes('fibre')) {
      nutriments.fiber = numValue;
      nutriments['fiber_100g'] = numValue;
    } else if (lowerKey.includes('protein')) {
      nutriments.proteins = numValue;
      nutriments['proteins_100g'] = numValue;
    } else if (lowerKey.includes('sodium')) {
      nutriments.sodium = numValue;
      nutriments['sodium_100g'] = numValue;
      // Convert sodium to salt
      nutriments.salt = numValue * 2.54;
      nutriments['salt_100g'] = numValue * 2.54;
    } else if (lowerKey.includes('salt')) {
      nutriments.salt = numValue;
      nutriments['salt_100g'] = numValue;
    }
  });

  return Object.keys(nutriments).length > 0 ? nutriments : undefined;
}

