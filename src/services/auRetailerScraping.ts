// Australia retailer scraping
// Scrapes product data from major Australian supermarket websites
// Woolworths AU, Coles, IGA

import { Product } from '../types/product';
import { logger } from '../utils/logger';
import { getUserCountryCode } from '../utils/countryDetection';

/**
 * Fetch product from Woolworths Australia
 * Uses their public search API
 */
async function fetchFromWoolworthsAU(barcode: string): Promise<Product | null> {
  try {
    // Strategy 1: Direct barcode search via API
    const searchUrl = `https://www.woolworths.com.au/apis/ui/Search/products?PageNumber=1&PageSize=1&SearchTerm=${encodeURIComponent(barcode)}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'TrueScan-FoodScanner/1.0.0',
        'Accept': 'application/json',
        'Referer': 'https://www.woolworths.com.au/',
      },
    });

    if (!response.ok) {
      logger.debug(`Woolworths AU API error ${response.status} for ${barcode}`);
      return null;
    }

    const data = await response.json();
    const products = data?.Products;
    
    if (!products || products.length === 0) {
      return null;
    }

    // Find exact barcode match
    let product = products.find((p: { Stockcode?: string; Barcode?: string }) => 
      p.Stockcode === barcode || p.Barcode === barcode
    );
    
    // If no exact match, use first result
    if (!product && products[0]) {
      product = products[0];
    }

    if (!product) {
      return null;
    }

    // Convert to our Product format
    const convertedProduct: Product = {
      barcode: barcode,
      product_name: product.DisplayName || product.Name || product.Title,
      brands: product.Brand || product.BrandName,
      image_url: product.LargeImageFile || product.MediumImageFile || product.SmallImageFile,
      source: 'woolworths_au',
      // Nutrition data if available
      nutriments: product.NutritionInformation ? {
        'energy-kcal_100g': product.NutritionInformation.Energy,
        fat: product.NutritionInformation.Fat,
        'saturated-fat': product.NutritionInformation.SaturatedFat,
        carbohydrates: product.NutritionInformation.Carbohydrate,
        sugars: product.NutritionInformation.Sugars,
        proteins: product.NutritionInformation.Protein,
        salt: product.NutritionInformation.Sodium ? product.NutritionInformation.Sodium / 1000 : undefined,
        fiber: product.NutritionInformation.DietaryFibre,
      } : undefined,
      ingredients_text: product.Ingredients || product.IngredientsText,
      quantity: product.PackageSize || product.Size,
      categories_tags: product.CategoryName ? (Array.isArray(product.CategoryName) ? product.CategoryName as string[] : [String(product.CategoryName)]) : undefined,
    };

    logger.debug(`Found product in Woolworths AU: ${barcode}`);
    return convertedProduct;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.debug(`Woolworths AU API error for ${barcode}:`, errorMessage);
    return null;
  }
}

/**
 * Fetch product from Coles Australia
 * Uses their public search API
 */
async function fetchFromColes(barcode: string): Promise<Product | null> {
  try {
    // Coles search API endpoint
    const searchUrl = `https://www.coles.com.au/api/product/search?q=${encodeURIComponent(barcode)}&page=1&pageSize=1`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'TrueScan-FoodScanner/1.0.0',
        'Accept': 'application/json',
        'Referer': 'https://www.coles.com.au/',
      },
    });

    if (!response.ok) {
      logger.debug(`Coles API error ${response.status} for ${barcode}`);
      return null;
    }

    const data = await response.json();
    const products = data?.products || data?.results;
    
    if (!products || products.length === 0) {
      return null;
    }

    // Find exact barcode match
    let product = products.find((p: { sku?: string; barcode?: string; productId?: string }) => 
      p.sku === barcode || p.barcode === barcode || p.productId === barcode
    );
    
    // If no exact match, use first result
    if (!product && products[0]) {
      product = products[0];
    }

    if (!product) {
      return null;
    }

    // Convert to our Product format
    const convertedProduct: Product = {
      barcode: barcode,
      product_name: product.name || product.displayName || product.title,
      brands: product.brand || product.brandName,
      image_url: product.imageUrl || product.image || product.thumbnail,
      source: 'coles_au',
      // Nutrition data if available
      nutriments: product.nutrition || product.nutritionInformation ? {
        'energy-kcal_100g': product.nutrition?.energy || product.nutritionInformation?.energy,
        fat: product.nutrition?.fat || product.nutritionInformation?.fat,
        'saturated-fat': product.nutrition?.saturatedFat || product.nutritionInformation?.saturatedFat,
        carbohydrates: product.nutrition?.carbohydrates || product.nutritionInformation?.carbohydrates,
        sugars: product.nutrition?.sugars || product.nutritionInformation?.sugars,
        proteins: product.nutrition?.protein || product.nutritionInformation?.protein,
        salt: product.nutrition?.sodium ? product.nutrition.sodium / 1000 : 
              product.nutritionInformation?.sodium ? product.nutritionInformation.sodium / 1000 : undefined,
        fiber: product.nutrition?.fiber || product.nutritionInformation?.dietaryFiber,
      } : undefined,
      ingredients_text: product.ingredients || product.ingredientsText,
      quantity: product.size || product.packageSize,
      categories_tags: product.category ? (Array.isArray(product.category) ? product.category as string[] : [String(product.category)]) : undefined,
    };

    logger.debug(`Found product in Coles AU: ${barcode}`);
    return convertedProduct;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.debug(`Coles API error for ${barcode}:`, errorMessage);
    return null;
  }
}

/**
 * Fetch product from Australia retailers
 * Only tries if user is in Australia (detected from device locale)
 */
export async function fetchProductFromAURetailers(barcode: string): Promise<Product | null> {
  const userCountry = getUserCountryCode();
  
  // Only try AU retailers if user is in Australia
  if (userCountry !== 'AU') {
    return null;
  }
  
  try {
    // Try both retailers in parallel
    const [woolworthsProduct, colesProduct] = await Promise.allSettled([
      fetchFromWoolworthsAU(barcode),
      fetchFromColes(barcode),
    ]);
    
    // Return first successful result
    if (woolworthsProduct.status === 'fulfilled' && woolworthsProduct.value) {
      return woolworthsProduct.value;
    }
    
    if (colesProduct.status === 'fulfilled' && colesProduct.value) {
      return colesProduct.value;
    }
    
    return null;
  } catch (error) {
    logger.debug(`AU retailer API error for ${barcode}:`, error);
    return null;
  }
}
