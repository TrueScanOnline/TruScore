// USDA FoodData Central API client
// Official US nutritional data for branded products
import { Product } from '../types/product';
import { fetchWithRateLimit } from '../utils/timeoutHelper';

const USDA_API_BASE = 'https://api.nal.usda.gov/fdc/v1';
const USER_AGENT = 'TrueScan-FoodScanner/1.0.0';

// Note: USDA API requires free API key registration
// Get your key at: https://fdc.nal.usda.gov/api-guide.html
// Store in environment variable: EXPO_PUBLIC_USDA_API_KEY
const USDA_API_KEY = process.env.EXPO_PUBLIC_USDA_API_KEY || '';

export interface USDASearchResponse {
  foods?: USDASearchFood[];
  totalHits?: number;
  currentPage?: number;
  totalPages?: number;
}

export interface USDASearchFood {
  fdcId: number;
  description: string;
  brandOwner?: string;
  brandName?: string;
  gtinUpc?: string;
  ingredients?: string;
  foodNutrients?: USDANutrient[];
  foodCategory?: {
    description: string;
  };
}

export interface USDANutrient {
  nutrientId: number;
  nutrientName: string;
  value: number;
  unitName: string;
}

/**
 * Search USDA FoodData Central by barcode
 * Note: USDA doesn't have direct barcode lookup, so we search by GTIN/UPC
 * and match the barcode
 */
export async function fetchProductFromUSDA(barcode: string): Promise<Product | null> {
  // Skip if no API key configured
  if (!USDA_API_KEY) {
    console.log('USDA API key not configured, skipping USDA lookup');
    return null;
  }

  try {
    // USDA doesn't have direct barcode lookup, so we search by GTIN/UPC
    // This is a search-based approach, not direct lookup
    const searchUrl = `${USDA_API_BASE}/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(barcode)}&dataType=Branded&pageSize=10`;
    
    const response = await fetchWithRateLimit(searchUrl, {
      headers: {
        'User-Agent': USER_AGENT,
      },
    }, 'usda_fooddata');

    if (!response.ok) {
      console.warn(`USDA API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: USDASearchResponse = await response.json();

    if (!data.foods || data.foods.length === 0) {
      console.warn(`Product not found in USDA: ${barcode}`);
      return null;
    }

    // Find exact barcode match
    const matchedFood = data.foods.find(food => 
      food.gtinUpc === barcode || 
      food.gtinUpc?.replace(/-/g, '') === barcode ||
      food.gtinUpc?.replace(/\s/g, '') === barcode
    );

    if (!matchedFood) {
      // If no exact match, use first result (might be related product)
      // But only if we're confident it's a match
      if (data.foods.length > 0 && data.foods[0].gtinUpc) {
        const firstFood = data.foods[0];
        const firstGtin = firstFood.gtinUpc;
        if (firstGtin) {
          // Check if barcode is similar (might have formatting differences)
          const normalizedGtin = firstGtin.replace(/[-\s]/g, '');
          const normalizedBarcode = barcode.replace(/[-\s]/g, '');
          if (normalizedGtin === normalizedBarcode || normalizedGtin.endsWith(normalizedBarcode) || normalizedBarcode.endsWith(normalizedGtin)) {
            return convertUSDAFoodToProduct(firstFood, barcode);
          }
        }
      }
      return null;
    }

    return convertUSDAFoodToProduct(matchedFood, barcode);
  } catch (error) {
    console.error(`Error fetching from USDA: ${error}`);
    return null;
  }
}

/**
 * Convert USDA food data to Product format
 */
function convertUSDAFoodToProduct(usdaFood: USDASearchFood, barcode: string): Product {
  // Convert USDA nutrients to our format
  const nutriments: Product['nutriments'] = {};
  
  if (usdaFood.foodNutrients) {
    usdaFood.foodNutrients.forEach(nutrient => {
      const nutrientName = nutrient.nutrientName.toLowerCase();
      const value = nutrient.value;
      
      // Map USDA nutrients to our format
      if (nutrientName.includes('energy') && nutrientName.includes('kcal')) {
        nutriments['energy-kcal'] = value;
        nutriments['energy-kcal_100g'] = value; // USDA provides per serving, estimate 100g
      } else if (nutrientName.includes('protein')) {
        nutriments.proteins = value;
        nutriments['proteins_100g'] = value;
      } else if (nutrientName.includes('total lipid') || nutrientName.includes('fat')) {
        nutriments.fat = value;
        nutriments['fat_100g'] = value;
      } else if (nutrientName.includes('carbohydrate')) {
        nutriments.carbohydrates = value;
        nutriments['carbohydrates_100g'] = value;
      } else if (nutrientName.includes('sugar')) {
        nutriments.sugars = value;
        nutriments['sugars_100g'] = value;
      } else if (nutrientName.includes('fiber')) {
        nutriments.fiber = value;
        nutriments['fiber_100g'] = value;
      } else if (nutrientName.includes('sodium')) {
        nutriments.sodium = value;
        nutriments['sodium_100g'] = value;
        // Convert sodium to salt (salt = sodium * 2.54)
        nutriments.salt = value * 2.54;
        nutriments['salt_100g'] = value * 2.54;
      }
    });
  }

  const product: Product = {
    barcode,
    product_name: usdaFood.description || `Product ${barcode}`,
    brands: usdaFood.brandOwner || usdaFood.brandName || undefined,
    ingredients_text: usdaFood.ingredients || undefined,
    nutriments: Object.keys(nutriments).length > 0 ? nutriments : undefined,
    source: 'usda_fooddata',
    // USDA provides official, verified data
    quality: 90,
    completion: 85,
  };

  return product;
}

/**
 * Search USDA FoodData Central by product name (for search functionality)
 */
export async function searchUSDAFoodData(query: string, limit = 20): Promise<Product[]> {
  if (!USDA_API_KEY) {
    return [];
  }

  try {
    const searchUrl = `${USDA_API_BASE}/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(query)}&dataType=Branded&pageSize=${limit}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': USER_AGENT,
      },
    });

    if (!response.ok) return [];

    const data: USDASearchResponse = await response.json();
    if (!data.foods || data.foods.length === 0) return [];

    return data.foods
      .filter(food => food.gtinUpc) // Only return foods with barcodes
      .map(food => convertUSDAFoodToProduct(food, food.gtinUpc!))
      .slice(0, limit);
  } catch (error) {
    console.error('Error searching USDA FoodData Central:', error);
    return [];
  }
}

