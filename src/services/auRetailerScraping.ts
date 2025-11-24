// Australian retailer API integration
// Direct API lookups for Woolworths AU, Coles, IGA Australia
// This provides another data source for AU products

import { Product } from '../types/product';
import { logger } from '../utils/logger';
import { getUserCountryCode } from '../utils/countryDetection';
import { createTimeoutSignal, fetchWithRateLimit } from '../utils/timeoutHelper';

const REQUEST_TIMEOUT = 5000; // 5 seconds timeout

/**
 * Try to fetch product from Woolworths Australia API
 */
async function fetchFromWoolworthsAU(barcode: string): Promise<Product | null> {
  try {
    logger.debug(`[Woolworths AU] Attempting to fetch product: ${barcode}`);
    
    // Woolworths AU API endpoint
    const searchUrl = `https://www.woolworths.com.au/api/v3/ui/products/search?SearchTerm=${barcode}`;
    
    const response = await fetchWithRateLimit(searchUrl, {
      headers: {
        'User-Agent': 'TrueScan-FoodScanner/1.0.0',
        'Accept': 'application/json',
      },
      signal: createTimeoutSignal(REQUEST_TIMEOUT),
    }, 'woolworths_au');
    
    if (response.ok) {
      const data = await response.json();
      const products = data?.Products || data?.products || [];
      
      // Try to find exact barcode match first
      let product = products.find((p: any) => 
        p.Barcode === barcode || 
        p.ProductId === barcode ||
        p.GTIN === barcode ||
        p.UPC === barcode
      );
      
      // If no exact match, use first result
      if (!product && products.length > 0) {
        product = products[0];
      }
      
      if (product) {
        // Convert Woolworths AU product to our Product format
        const convertedProduct: Product = {
          barcode,
          product_name: product.Name || product.DisplayName || product.ProductName || product.Title,
          brands: product.Brand || product.BrandName || product.Manufacturer,
          image_url: product.ImageUrl || product.Images?.[0]?.Url || product.Image || product.MediumImageFile,
          source: 'woolworths_au',
          
          // Add nutrition if available
          nutriments: product.Nutrition || product.NutritionalInformation ? {
            'energy-kcal_100g': product.Nutrition?.Energy || product.NutritionalInformation?.Energy,
            'energy-kcal': product.Nutrition?.Energy || product.NutritionalInformation?.Energy,
            fat: product.Nutrition?.Fat || product.NutritionalInformation?.Fat,
            'fat_100g': product.Nutrition?.Fat || product.NutritionalInformation?.Fat,
            'saturated-fat': product.Nutrition?.SaturatedFat || product.NutritionalInformation?.SaturatedFat,
            'saturated-fat_100g': product.Nutrition?.SaturatedFat || product.NutritionalInformation?.SaturatedFat,
            carbohydrates: product.Nutrition?.Carbohydrates || product.NutritionalInformation?.Carbohydrates,
            'carbohydrates_100g': product.Nutrition?.Carbohydrates || product.NutritionalInformation?.Carbohydrates,
            sugars: product.Nutrition?.Sugars || product.NutritionalInformation?.Sugars,
            'sugars_100g': product.Nutrition?.Sugars || product.NutritionalInformation?.Sugars,
            proteins: product.Nutrition?.Protein || product.NutritionalInformation?.Protein,
            'proteins_100g': product.Nutrition?.Protein || product.NutritionalInformation?.Protein,
            salt: product.Nutrition?.Salt || product.NutritionalInformation?.Salt,
            'salt_100g': product.Nutrition?.Salt || product.NutritionalInformation?.Salt,
            sodium: product.Nutrition?.Sodium || product.NutritionalInformation?.Sodium,
            'sodium_100g': product.Nutrition?.Sodium || product.NutritionalInformation?.Sodium,
          } : undefined,
          
          ingredients_text: product.Ingredients || product.IngredientsText || product.IngredientList,
          
          // Categories
          categories: product.Category || product.Categories || product.CategoryName,
        };
        
        logger.debug(`[Woolworths AU] Found product: ${barcode}`);
        return convertedProduct;
      }
    } else {
      logger.debug(`[Woolworths AU] API returned status ${response.status} for ${barcode}`);
    }
    
    return null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Don't log timeout errors as errors - they're expected
    if (!errorMessage.includes('aborted') && !errorMessage.includes('timeout')) {
      logger.debug(`[Woolworths AU] API error for ${barcode}:`, errorMessage);
    }
    return null;
  }
}

/**
 * Try to fetch product from Coles Australia API
 */
async function fetchFromColes(barcode: string): Promise<Product | null> {
  try {
    logger.debug(`[Coles AU] Attempting to fetch product: ${barcode}`);
    
    // Coles AU API endpoint
    const searchUrl = `https://www.coles.com.au/api/product/search?searchTerm=${barcode}`;
    
    const response = await fetchWithRateLimit(searchUrl, {
      headers: {
        'User-Agent': 'TrueScan-FoodScanner/1.0.0',
        'Accept': 'application/json',
      },
      signal: createTimeoutSignal(REQUEST_TIMEOUT),
    }, 'coles_au');
    
    if (response.ok) {
      const data = await response.json();
      const products = data?.products || data?.Products || data?.results || [];
      
      // Try to find exact barcode match first
      let product = products.find((p: any) => 
        p.barcode === barcode || 
        p.Barcode === barcode ||
        p.productId === barcode ||
        p.ProductId === barcode ||
        p.gtin === barcode ||
        p.GTIN === barcode
      );
      
      // If no exact match, use first result
      if (!product && products.length > 0) {
        product = products[0];
      }
      
      if (product) {
        // Convert Coles product to our Product format
        const convertedProduct: Product = {
          barcode,
          product_name: product.name || product.Name || product.displayName || product.productName || product.title,
          brands: product.brand || product.Brand || product.brandName || product.BrandName || product.manufacturer,
          image_url: product.imageUrl || product.ImageUrl || product.images?.[0]?.url || product.Images?.[0]?.Url || product.image || product.Image,
          source: 'coles_au',
          
          // Add nutrition if available
          nutriments: product.nutrition || product.Nutrition || product.nutritionalInformation ? {
            'energy-kcal_100g': product.nutrition?.energy || product.Nutrition?.Energy || product.nutritionalInformation?.energy,
            'energy-kcal': product.nutrition?.energy || product.Nutrition?.Energy || product.nutritionalInformation?.energy,
            fat: product.nutrition?.fat || product.Nutrition?.Fat || product.nutritionalInformation?.fat,
            'fat_100g': product.nutrition?.fat || product.Nutrition?.Fat || product.nutritionalInformation?.fat,
            'saturated-fat': product.nutrition?.saturatedFat || product.Nutrition?.SaturatedFat || product.nutritionalInformation?.saturatedFat,
            'saturated-fat_100g': product.nutrition?.saturatedFat || product.Nutrition?.SaturatedFat || product.nutritionalInformation?.saturatedFat,
            carbohydrates: product.nutrition?.carbohydrates || product.Nutrition?.Carbohydrates || product.nutritionalInformation?.carbohydrates,
            'carbohydrates_100g': product.nutrition?.carbohydrates || product.Nutrition?.Carbohydrates || product.nutritionalInformation?.carbohydrates,
            sugars: product.nutrition?.sugars || product.Nutrition?.Sugars || product.nutritionalInformation?.sugars,
            'sugars_100g': product.nutrition?.sugars || product.Nutrition?.Sugars || product.nutritionalInformation?.sugars,
            proteins: product.nutrition?.protein || product.Nutrition?.Protein || product.nutritionalInformation?.protein,
            'proteins_100g': product.nutrition?.protein || product.Nutrition?.Protein || product.nutritionalInformation?.protein,
            salt: product.nutrition?.salt || product.Nutrition?.Salt || product.nutritionalInformation?.salt,
            'salt_100g': product.nutrition?.salt || product.Nutrition?.Salt || product.nutritionalInformation?.salt,
            sodium: product.nutrition?.sodium || product.Nutrition?.Sodium || product.nutritionalInformation?.sodium,
            'sodium_100g': product.nutrition?.sodium || product.Nutrition?.Sodium || product.nutritionalInformation?.sodium,
          } : undefined,
          
          ingredients_text: product.ingredients || product.Ingredients || product.ingredientsText || product.IngredientsText || product.ingredientList,
          
          // Categories
          categories: product.category || product.Category || product.categories || product.Categories || product.categoryName,
        };
        
        logger.debug(`[Coles AU] Found product: ${barcode}`);
        return convertedProduct;
      }
    } else {
      logger.debug(`[Coles AU] API returned status ${response.status} for ${barcode}`);
    }
    
    return null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Don't log timeout errors as errors - they're expected
    if (!errorMessage.includes('aborted') && !errorMessage.includes('timeout')) {
      logger.debug(`[Coles AU] API error for ${barcode}:`, errorMessage);
    }
    return null;
  }
}

/**
 * Try to fetch product from IGA Australia API
 */
async function fetchFromIGA(barcode: string): Promise<Product | null> {
  try {
    logger.debug(`[IGA AU] Attempting to fetch product: ${barcode}`);
    
    // IGA Australia API endpoint
    // Note: IGA may use different endpoints, this is a common pattern
    const searchUrl = `https://www.iga.com.au/api/products/search?term=${barcode}`;
    
    const response = await fetchWithRateLimit(searchUrl, {
      headers: {
        'User-Agent': 'TrueScan-FoodScanner/1.0.0',
        'Accept': 'application/json',
      },
      signal: createTimeoutSignal(REQUEST_TIMEOUT),
    }, 'iga_au');
    
    if (response.ok) {
      const data = await response.json();
      const products = data?.products || data?.Products || data?.results || data?.items || [];
      
      // Try to find exact barcode match first
      let product = products.find((p: any) => 
        p.barcode === barcode || 
        p.Barcode === barcode ||
        p.productId === barcode ||
        p.ProductId === barcode ||
        p.gtin === barcode ||
        p.GTIN === barcode ||
        p.sku === barcode ||
        p.SKU === barcode
      );
      
      // If no exact match, use first result
      if (!product && products.length > 0) {
        product = products[0];
      }
      
      if (product) {
        // Convert IGA product to our Product format
        const convertedProduct: Product = {
          barcode,
          product_name: product.name || product.Name || product.displayName || product.productName || product.title || product.Title,
          brands: product.brand || product.Brand || product.brandName || product.BrandName || product.manufacturer || product.Manufacturer,
          image_url: product.imageUrl || product.ImageUrl || product.images?.[0]?.url || product.Images?.[0]?.Url || product.image || product.Image || product.thumbnail,
          source: 'iga_au',
          
          // Add nutrition if available
          nutriments: product.nutrition || product.Nutrition || product.nutritionalInformation ? {
            'energy-kcal_100g': product.nutrition?.energy || product.Nutrition?.Energy || product.nutritionalInformation?.energy,
            'energy-kcal': product.nutrition?.energy || product.Nutrition?.Energy || product.nutritionalInformation?.energy,
            fat: product.nutrition?.fat || product.Nutrition?.Fat || product.nutritionalInformation?.fat,
            'fat_100g': product.nutrition?.fat || product.Nutrition?.Fat || product.nutritionalInformation?.fat,
            'saturated-fat': product.nutrition?.saturatedFat || product.Nutrition?.SaturatedFat || product.nutritionalInformation?.saturatedFat,
            'saturated-fat_100g': product.nutrition?.saturatedFat || product.Nutrition?.SaturatedFat || product.nutritionalInformation?.saturatedFat,
            carbohydrates: product.nutrition?.carbohydrates || product.Nutrition?.Carbohydrates || product.nutritionalInformation?.carbohydrates,
            'carbohydrates_100g': product.nutrition?.carbohydrates || product.Nutrition?.Carbohydrates || product.nutritionalInformation?.carbohydrates,
            sugars: product.nutrition?.sugars || product.Nutrition?.Sugars || product.nutritionalInformation?.sugars,
            'sugars_100g': product.nutrition?.sugars || product.Nutrition?.Sugars || product.nutritionalInformation?.sugars,
            proteins: product.nutrition?.protein || product.Nutrition?.Protein || product.nutritionalInformation?.protein,
            'proteins_100g': product.nutrition?.protein || product.Nutrition?.Protein || product.nutritionalInformation?.protein,
            salt: product.nutrition?.salt || product.Nutrition?.Salt || product.nutritionalInformation?.salt,
            'salt_100g': product.nutrition?.salt || product.Nutrition?.Salt || product.nutritionalInformation?.salt,
            sodium: product.nutrition?.sodium || product.Nutrition?.Sodium || product.nutritionalInformation?.sodium,
            'sodium_100g': product.nutrition?.sodium || product.Nutrition?.Sodium || product.nutritionalInformation?.sodium,
          } : undefined,
          
          ingredients_text: product.ingredients || product.Ingredients || product.ingredientsText || product.IngredientsText || product.ingredientList,
          
          // Categories
          categories: product.category || product.Category || product.categories || product.Categories || product.categoryName,
        };
        
        logger.debug(`[IGA AU] Found product: ${barcode}`);
        return convertedProduct;
      }
    } else {
      logger.debug(`[IGA AU] API returned status ${response.status} for ${barcode}`);
    }
    
    return null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Don't log timeout errors as errors - they're expected
    if (!errorMessage.includes('aborted') && !errorMessage.includes('timeout')) {
      logger.debug(`[IGA AU] API error for ${barcode}:`, errorMessage);
    }
    return null;
  }
}

/**
 * Fetch product from Australian retailer APIs
 * Queries all 3 retailers (Woolworths AU, Coles, IGA) in parallel
 * Only tries if user is in AU (detected from device locale)
 */
export async function fetchProductFromAURetailers(barcode: string): Promise<Product | null> {
  const userCountry = getUserCountryCode();
  
  // Only try AU retailers if user is in AU
  if (userCountry !== 'AU') {
    return null;
  }
  
  try {
    logger.debug(`Trying AU store APIs for barcode variants: ${barcode}`);
    
    // Try all 3 retailers in parallel
    const [woolworthsProduct, colesProduct, igaProduct] = await Promise.allSettled([
      fetchFromWoolworthsAU(barcode),
      fetchFromColes(barcode),
      fetchFromIGA(barcode),
    ]);
    
    // Return first successful result (prioritize Woolworths, then Coles, then IGA)
    if (woolworthsProduct.status === 'fulfilled' && woolworthsProduct.value) {
      return woolworthsProduct.value;
    }
    
    if (colesProduct.status === 'fulfilled' && colesProduct.value) {
      return colesProduct.value;
    }
    
    if (igaProduct.status === 'fulfilled' && igaProduct.value) {
      return igaProduct.value;
    }
    
    return null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.debug(`AU retailer API error for ${barcode}:`, errorMessage);
    return null;
  }
}

