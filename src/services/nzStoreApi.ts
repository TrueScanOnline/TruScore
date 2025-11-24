// New Zealand store API integration
// Direct API lookups for Woolworths NZ, Countdown, Pak'nSave, New World
// This provides another data source for NZ products

import { Product } from '../types/product';
import { logger } from '../utils/logger';
import { getUserCountryCode } from '../utils/countryDetection';
import { fetchWithRateLimit } from '../utils/timeoutHelper';

/**
 * Try to fetch product from Woolworths NZ / Countdown API
 */
async function fetchFromWoolworthsNZ(barcode: string): Promise<Product | null> {
  try {
    // Try multiple search strategies for Woolworths NZ
    // Strategy 1: Direct barcode search
    const searchUrl1 = `https://www.woolworths.co.nz/api/v1/products?searchTerm=${barcode}`;
    let response = await fetchWithRateLimit(searchUrl1, {
      headers: {
        'User-Agent': 'TrueScan-FoodScanner/1.0.0',
        'Accept': 'application/json',
      },
    }, 'woolworths_nz');
    
    if (response.ok) {
      const data = await response.json();
      const product = data?.products?.[0];
      
      if (product) {
        // Convert Woolworths product to our Product format
        const convertedProduct: Product = {
          barcode,
          product_name: product.name || product.displayName || product.productName,
          brands: product.brand || product.manufacturer || product.brandName,
          image_url: product.imageUrl || product.images?.[0]?.url || product.image,
          source: 'woolworths_nz',
          // Add nutrition if available
          nutriments: product.nutrition ? {
            'energy-kcal_100g': product.nutrition.energy,
            fat: product.nutrition.fat,
            'saturated-fat': product.nutrition.saturatedFat,
            carbohydrates: product.nutrition.carbohydrates,
            sugars: product.nutrition.sugars,
            proteins: product.nutrition.protein,
            salt: product.nutrition.salt,
          } : undefined,
          ingredients_text: product.ingredients,
        };
        
        logger.debug(`Found product in Woolworths NZ: ${barcode}`);
        return convertedProduct;
      }
    }
    
    // Strategy 2: Try with product ID if barcode search fails
    // Some products might be indexed by internal ID rather than barcode
    return null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.debug(`Woolworths NZ API error for ${barcode}:`, errorMessage);
    return null;
  }
}

/**
 * Try to fetch product from Foodstuffs (Pak'nSave, New World) API
 */
async function fetchFromFoodstuffs(barcode: string): Promise<Product | null> {
  try {
    // Try Pak'nSave first
    const paknsaveUrl = `https://www.paknsave.co.nz/CommonApi/ProductSearch/Search`;
    const response = await fetchWithRateLimit(paknsaveUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TrueScan-FoodScanner/1.0.0',
      },
      body: JSON.stringify({ searchTerm: barcode, pageSize: 5 }),
    }, 'paknsave');
    
    if (response.ok) {
      const data = await response.json();
      // Try to find exact barcode match first
      let product = data?.Products?.find((p: { Barcode?: string; ProductId?: string }) => 
        p.Barcode === barcode || p.ProductId === barcode
      );
      
      // If no exact match, use first result
      if (!product && data?.Products?.[0]) {
        product = data.Products[0];
      }
      
      if (product) {
        const convertedProduct: Product = {
          barcode,
          product_name: product.Name || product.ProductName,
          brands: product.Brand || product.BrandName,
          image_url: product.ImageUrl || product.Image,
          source: 'paknsave',
          // Add nutrition if available
          nutriments: product.Nutrition ? {
            'energy-kcal_100g': product.Nutrition.Energy,
            fat: product.Nutrition.Fat,
            'saturated-fat': product.Nutrition.SaturatedFat,
            carbohydrates: product.Nutrition.Carbohydrates,
            sugars: product.Nutrition.Sugars,
            proteins: product.Nutrition.Protein,
            salt: product.Nutrition.Salt,
          } : undefined,
          ingredients_text: product.Ingredients || product.IngredientsText,
        };
        
        logger.debug(`Found product in Pak'nSave: ${barcode}`);
        return convertedProduct;
      }
    }
    
    // Try New World
    const newworldUrl = `https://www.newworld.co.nz/CommonApi/ProductSearch/Search`;
    const newworldResponse = await fetch(newworldUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TrueScan-FoodScanner/1.0.0',
      },
      body: JSON.stringify({ searchTerm: barcode, pageSize: 5 }),
    });
    
    if (newworldResponse.ok) {
      const data = await newworldResponse.json();
      // Try to find exact barcode match first
      let product = data?.Products?.find((p: { Barcode?: string; ProductId?: string }) => 
        p.Barcode === barcode || p.ProductId === barcode
      );
      
      // If no exact match, use first result
      if (!product && data?.Products?.[0]) {
        product = data.Products[0];
      }
      
      if (product) {
        const convertedProduct: Product = {
          barcode,
          product_name: product.Name || product.ProductName,
          brands: product.Brand || product.BrandName,
          image_url: product.ImageUrl || product.Image,
          source: 'newworld',
          // Add nutrition if available
          nutriments: product.Nutrition ? {
            'energy-kcal_100g': product.Nutrition.Energy,
            fat: product.Nutrition.Fat,
            'saturated-fat': product.Nutrition.SaturatedFat,
            carbohydrates: product.Nutrition.Carbohydrates,
            sugars: product.Nutrition.Sugars,
            proteins: product.Nutrition.Protein,
            salt: product.Nutrition.Salt,
          } : undefined,
          ingredients_text: product.Ingredients || product.IngredientsText,
        };
        
        logger.debug(`Found product in New World: ${barcode}`);
        return convertedProduct;
      }
    }
    
    return null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.debug(`Foodstuffs API error for ${barcode}:`, errorMessage);
    return null;
  }
}

/**
 * Fetch product from NZ store APIs
 * Only tries if user is in NZ (detected from device locale)
 */
export async function fetchProductFromNZStores(barcode: string): Promise<Product | null> {
  const userCountry = getUserCountryCode();
  
  // Only try NZ stores if user is in NZ
  if (userCountry !== 'NZ') {
    return null;
  }
  
  try {
    // Try both stores in parallel
    const [woolworthsProduct, foodstuffsProduct] = await Promise.allSettled([
      fetchFromWoolworthsNZ(barcode),
      fetchFromFoodstuffs(barcode),
    ]);
    
    // Return first successful result
    if (woolworthsProduct.status === 'fulfilled' && woolworthsProduct.value) {
      return woolworthsProduct.value;
    }
    
    if (foodstuffsProduct.status === 'fulfilled' && foodstuffsProduct.value) {
      return foodstuffsProduct.value;
    }
    
    return null;
  } catch (error) {
    logger.debug(`NZ store API error for ${barcode}:`, error);
    return null;
  }
}

