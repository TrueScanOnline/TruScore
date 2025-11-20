// Web Search Fallback Service
// When all product databases fail, use web search to find basic product information
// This ensures users always get SOME result for any scanned barcode
// Enhanced to fetch images and nutrition information when available

import { Product, ProductNutriments } from '../types/product';
import * as Linking from 'expo-linking';
import { scrapeProductInfo } from './webScrapingService';

/**
 * Create a Google search URL for a barcode
 */
export function createWebSearchUrl(barcode: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(barcode)}`;
}

/**
 * Create a DuckDuckGo search URL for a barcode
 */
export function createDuckDuckGoSearchUrl(barcode: string): string {
  return `https://duckduckgo.com/?q=${encodeURIComponent(barcode)}`;
}

/**
 * Create a Bing search URL for a barcode
 */
export function createBingSearchUrl(barcode: string): string {
  return `https://www.bing.com/search?q=${encodeURIComponent(barcode)}`;
}

/**
 * Open web search in user's browser
 */
export async function openWebSearch(barcode: string, searchEngine: 'google' | 'duckduckgo' | 'bing' = 'google'): Promise<void> {
  let url: string;
  
  switch (searchEngine) {
    case 'duckduckgo':
      url = createDuckDuckGoSearchUrl(barcode);
      break;
    case 'bing':
      url = createBingSearchUrl(barcode);
      break;
    case 'google':
    default:
      url = createWebSearchUrl(barcode);
      break;
  }
  
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      console.warn(`Cannot open URL: ${url}`);
    }
  } catch (error) {
    console.error('Error opening web search:', error);
  }
}

/**
 * Fetch product image from multiple sources
 * Tries DuckDuckGo first, then multiple query variations
 * This is free and doesn't require an API key
 */
async function fetchProductImage(productName: string, barcode?: string): Promise<string | undefined> {
  // If productName is just "Product {barcode}" or looks like a barcode, try different queries
  const isGenericName = productName.startsWith('Product ') || /^\d{8,14}$/.test(productName);
  
  const queries = isGenericName && barcode ? [
    barcode, // Try raw barcode
    `barcode ${barcode}`,
    `UPC ${barcode}`,
    `EAN ${barcode}`,
    `product barcode ${barcode}`,
  ] : [
    productName,
    `${productName} product image`,
    `${productName} product photo`,
    barcode ? `barcode ${barcode}` : undefined,
  ].filter(Boolean) as string[];

  for (const query of queries) {
    try {
      // DuckDuckGo image search API (free, no key required)
      const imageUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&iax=images&ia=images`;
      
      const response = await fetch(imageUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TrueScan-FoodScanner/1.0.0',
        },
      });

      if (!response.ok) {
        continue;
      }

      const data = await response.json();

      // DuckDuckGo returns RelatedTopics or Results array with images
      if (data.Results && data.Results.length > 0) {
        const firstResult = data.Results[0];
        if (firstResult.Image && firstResult.Image.startsWith('http')) {
          return firstResult.Image;
        }
      }

      // Also check RelatedTopics
      if (data.RelatedTopics && data.RelatedTopics.length > 0) {
        for (const topic of data.RelatedTopics) {
          if (topic.Icon?.URL && topic.Icon.URL.startsWith('http')) {
            return topic.Icon.URL;
          }
          if (topic.FirstURL && topic.Text) {
            // Try to extract image URL from the topic
            const imgMatch = topic.Text.match(/https?:\/\/[^\s]+\.(jpg|jpeg|png|webp|gif)/i);
            if (imgMatch) {
              return imgMatch[0];
            }
          }
        }
      }
    } catch (error) {
      // Continue to next query
      continue;
    }
  }

  return undefined;
}

/**
 * Try to extract nutrition information from web search
 * Uses DuckDuckGo Instant Answer and tries to parse nutrition data
 * Enhanced with multiple query variations and better parsing
 */
async function fetchNutritionInfo(productName: string): Promise<ProductNutriments | undefined> {
  const queries = [
    `${productName} nutrition facts`,
    `${productName} nutritional information`,
    `${productName} nutrition label`,
  ];

  for (const nutritionQuery of queries) {
    try {
      const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(nutritionQuery)}&format=json&no_html=1&skip_disambig=1`;
      
      const response = await fetch(ddgUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TrueScan-FoodScanner/1.0.0',
        },
      });

      if (!response.ok) {
        continue;
      }

      const data = await response.json();

      // Try to parse basic nutrition from AbstractText
      if (data.AbstractText) {
        const text = data.AbstractText.toLowerCase();
        
        // Try to extract common nutrition values (enhanced parsing)
        const nutrition: ProductNutriments = {};
        
        // Calories (multiple patterns)
        const caloriesPatterns = [
          /(\d+)\s*(?:kcal|calories?)/i,
          /calories?[:\s]*(\d+)/i,
          /energy[:\s]*(\d+)\s*(?:kcal|cal)/i,
        ];
        for (const pattern of caloriesPatterns) {
          const match = text.match(pattern);
          if (match) {
            nutrition['energy-kcal_100g'] = parseInt(match[1]);
            break;
          }
        }
        
        // Protein (multiple patterns)
        const proteinPatterns = [
          /(?:protein|prot)[:\s]*(\d+(?:\.\d+)?)\s*g/i,
          /(\d+(?:\.\d+)?)\s*g(?:ram)?s?\s*(?:of\s*)?protein/i,
        ];
        for (const pattern of proteinPatterns) {
          const match = text.match(pattern);
          if (match) {
            nutrition.proteins_100g = parseFloat(match[1]);
            break;
          }
        }
        
        // Carbs (multiple patterns)
        const carbsPatterns = [
          /(?:carbohydrates?|carbs?)[:\s]*(\d+(?:\.\d+)?)\s*g/i,
          /(\d+(?:\.\d+)?)\s*g(?:ram)?s?\s*(?:of\s*)?(?:carb|carbohydrate)s?/i,
          /total\s*carbohydrates?[:\s]*(\d+(?:\.\d+)?)/i,
        ];
        for (const pattern of carbsPatterns) {
          const match = text.match(pattern);
          if (match) {
            nutrition.carbohydrates_100g = parseFloat(match[1]);
            break;
          }
        }
        
        // Fat (multiple patterns)
        const fatPatterns = [
          /(?:total\s*)?(?:fat|fats)[:\s]*(\d+(?:\.\d+)?)\s*g/i,
          /(\d+(?:\.\d+)?)\s*g(?:ram)?s?\s*(?:of\s*)?(?:total\s*)?fat/i,
        ];
        for (const pattern of fatPatterns) {
          const match = text.match(pattern);
          if (match) {
            nutrition.fat_100g = parseFloat(match[1]);
            break;
          }
        }
        
        // Sugar (multiple patterns)
        const sugarPatterns = [
          /(?:total\s*)?sugars?[:\s]*(\d+(?:\.\d+)?)\s*g/i,
          /(\d+(?:\.\d+)?)\s*g(?:ram)?s?\s*(?:of\s*)?sugars?/i,
        ];
        for (const pattern of sugarPatterns) {
          const match = text.match(pattern);
          if (match) {
            nutrition.sugars_100g = parseFloat(match[1]);
            break;
          }
        }
        
        // Sodium (multiple patterns)
        const sodiumPatterns = [
          /sodium[:\s]*(\d+(?:\.\d+)?)\s*mg/i,
          /(\d+(?:\.\d+)?)\s*mg(?:ram)?s?\s*(?:of\s*)?sodium/i,
          /sodium[:\s]*(\d+(?:\.\d+)?)\s*g/i,
        ];
        for (const pattern of sodiumPatterns) {
          const match = text.match(pattern);
          if (match) {
            const value = parseFloat(match[1]);
            // Convert mg to g/100g if needed (approximate)
            nutrition.sodium_100g = value > 100 ? value / 10 : value;
            break;
          }
        }
        
        // Fiber
        const fiberPatterns = [
          /(?:dietary\s*)?fiber[:\s]*(\d+(?:\.\d+)?)\s*g/i,
          /(\d+(?:\.\d+)?)\s*g(?:ram)?s?\s*(?:of\s*)?(?:dietary\s*)?fiber/i,
        ];
        for (const pattern of fiberPatterns) {
          const match = text.match(pattern);
          if (match) {
            nutrition.fiber_100g = parseFloat(match[1]);
            break;
          }
        }
        
        // Saturated Fat
        const satFatPatterns = [
          /(?:saturated\s*)?fat[:\s]*(\d+(?:\.\d+)?)\s*g/i,
          /(\d+(?:\.\d+)?)\s*g(?:ram)?s?\s*(?:of\s*)?saturated\s*fat/i,
        ];
        for (const pattern of satFatPatterns) {
          const match = text.match(pattern);
          if (match) {
            nutrition['saturated-fat_100g'] = parseFloat(match[1]);
            break;
          }
        }
        
        // Only return if we found at least some nutrition data
        if (Object.keys(nutrition).length > 0) {
          return nutrition;
        }
      }
    } catch (error) {
      // Continue to next query
      continue;
    }
  }

  return undefined;
}

/**
 * Try to extract ingredients from web search
 * Uses DuckDuckGo Instant Answer and tries to parse ingredients list
 */
async function fetchIngredients(productName: string): Promise<string | undefined> {
  const queries = [
    `${productName} ingredients`,
    `${productName} ingredients list`,
    `${productName} what's inside`,
  ];

  for (const ingredientsQuery of queries) {
    try {
      const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(ingredientsQuery)}&format=json&no_html=1&skip_disambig=1`;
      
      const response = await fetch(ddgUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TrueScan-FoodScanner/1.0.0',
        },
      });

      if (!response.ok) {
        continue;
      }

      const data = await response.json();

      // Try to extract ingredients from AbstractText
      if (data.AbstractText) {
        const text = data.AbstractText;
        
        // Look for common ingredient list indicators
        const ingredientPatterns = [
          // "Ingredients:" followed by list
          /ingredients?[:\s]+([^\.]+(?:\.|$))/i,
          // "Contains:" followed by list
          /contains?[:\s]+([^\.]+(?:\.|$))/i,
          // List starting with common ingredients
          /(?:water|sugar|salt|flour|oil|milk|egg)[^\.]*(?:\.|$)/i,
          // Comma-separated list after "Ingredients"
          /ingredients?[:\s]*([a-z][^\.]{10,200})/i,
        ];

        for (const pattern of ingredientPatterns) {
          const match = text.match(pattern);
          if (match && match[1]) {
            let ingredients = match[1].trim();
            
            // Clean up common prefixes/suffixes
            ingredients = ingredients.replace(/^(contains|may contain|ingredients?)[:\s]+/i, '');
            ingredients = ingredients.replace(/\s*\.\s*$/, '');
            ingredients = ingredients.replace(/\s+/g, ' ');
            
            // If it looks like a valid ingredients list (has commas or multiple words)
            if (ingredients.length > 10 && (ingredients.includes(',') || ingredients.split(' ').length > 3)) {
              return ingredients;
            }
          }
        }

        // If no specific pattern found, try to extract a meaningful sentence
        // that mentions ingredients
        if (text.toLowerCase().includes('ingredient')) {
          const sentences = text.split(/[\.\!\?]\s+/);
          for (const sentence of sentences) {
            if (sentence.toLowerCase().includes('ingredient') && sentence.length > 20) {
              // Try to extract the ingredient list part
              const cleaned = sentence.replace(/^(.*?ingredients?[:\s]+)/i, '').trim();
              if (cleaned.length > 10) {
                return cleaned;
              }
            }
          }
        }
      }
    } catch (error) {
      // Continue to next query
      continue;
    }
  }

  return undefined;
}

/**
 * Try to get product name from barcode using multiple strategies
 * This is critical because we need a product name before we can search for images/nutrition/ingredients
 */
async function getProductNameFromBarcode(barcode: string): Promise<string | null> {
  const strategies = [
    // Strategy 1: Try DuckDuckGo with barcode
    async () => {
      try {
        const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(barcode)}&format=json&no_html=1&skip_disambig=1`;
        const response = await fetch(ddgUrl, {
          headers: { 'Accept': 'application/json', 'User-Agent': 'TrueScan-FoodScanner/1.0.0' },
        });
        if (response.ok) {
          const data = await response.json();
          console.log(`[WebSearch] Strategy 1 - DuckDuckGo response:`, JSON.stringify(data).substring(0, 200));
          
          if (data.Heading && data.Heading !== barcode && data.Heading.length > 2) {
            return data.Heading;
          }
          
          // Try RelatedTopics - sometimes product info is here
          if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
            for (const topic of data.RelatedTopics) {
              if (topic.Text && topic.FirstURL) {
                // Extract product name from topic text
                const nameMatch = topic.Text.match(/^(?:The\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,4})/);
                if (nameMatch && nameMatch[1] && nameMatch[1].length > 3) {
                  return nameMatch[1];
                }
              }
            }
          }
        }
      } catch (e) {
        console.warn(`[WebSearch] Strategy 1 error:`, e);
      }
      return null;
    },
    
    // Strategy 2: Try DuckDuckGo with "barcode {barcode}" query
    async () => {
      try {
        const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(`barcode ${barcode}`)}&format=json&no_html=1&skip_disambig=1`;
        const response = await fetch(ddgUrl, {
          headers: { 'Accept': 'application/json', 'User-Agent': 'TrueScan-FoodScanner/1.0.0' },
        });
        if (response.ok) {
          const data = await response.json();
          console.log(`[WebSearch] Strategy 2 - DuckDuckGo "barcode" response:`, JSON.stringify(data).substring(0, 200));
          
          if (data.Heading && !data.Heading.includes('Barcode') && data.Heading.length > 2) {
            return data.Heading;
          }
          
          // Try to extract product name from AbstractText
          if (data.AbstractText) {
            const text = data.AbstractText;
            // Look for quoted product names
            const quotedMatch = text.match(/"([^"]{3,50})"/);
            if (quotedMatch && quotedMatch[1]) {
              return quotedMatch[1];
            }
            
            // Look for patterns like "Product Name" or "Item Name"
            const nameMatch = text.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/);
            if (nameMatch && nameMatch[1].length > 3) {
              return nameMatch[1];
            }
            
            // Try to find capitalized product name patterns
            const capitalizedMatch = text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,4})\b/);
            if (capitalizedMatch && capitalizedMatch[1].length > 5 && !capitalizedMatch[1].includes('Barcode')) {
              return capitalizedMatch[1];
            }
          }
        }
      } catch (e) {
        console.warn(`[WebSearch] Strategy 2 error:`, e);
      }
      return null;
    },
    
    // Strategy 3: Try DuckDuckGo with "UPC {barcode}" query
    async () => {
      try {
        const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(`UPC ${barcode}`)}&format=json&no_html=1&skip_disambig=1`;
        const response = await fetch(ddgUrl, {
          headers: { 'Accept': 'application/json', 'User-Agent': 'TrueScan-FoodScanner/1.0.0' },
        });
        if (response.ok) {
          const data = await response.json();
          console.log(`[WebSearch] Strategy 3 - DuckDuckGo "UPC" response:`, JSON.stringify(data).substring(0, 200));
          
          if (data.Heading && !data.Heading.includes('UPC') && !data.Heading.includes('Barcode') && data.Heading.length > 2) {
            return data.Heading;
          }
          
          if (data.AbstractText) {
            const quotedMatch = data.AbstractText.match(/"([^"]{3,50})"/);
            if (quotedMatch && quotedMatch[1]) {
              return quotedMatch[1];
            }
          }
        }
      } catch (e) {
        console.warn(`[WebSearch] Strategy 3 error:`, e);
      }
      return null;
    },
    
    // Strategy 4: Try "EAN {barcode}" query
    async () => {
      try {
        const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(`EAN ${barcode}`)}&format=json&no_html=1&skip_disambig=1`;
        const response = await fetch(ddgUrl, {
          headers: { 'Accept': 'application/json', 'User-Agent': 'TrueScan-FoodScanner/1.0.0' },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.Heading && !data.Heading.includes('EAN') && !data.Heading.includes('Barcode') && data.Heading.length > 2) {
            return data.Heading;
          }
        }
      } catch {}
      return null;
    },
  ];

  // Try each strategy in sequence
  for (let i = 0; i < strategies.length; i++) {
    try {
      const productName = await strategies[i]();
      if (productName && productName.length > 2 && productName !== barcode) {
        console.log(`[WebSearch] Found product name via Strategy ${i + 1}: ${productName} for barcode: ${barcode}`);
        return productName;
      }
    } catch (error) {
      console.warn(`[WebSearch] Strategy ${i + 1} failed:`, error);
      continue;
    }
  }

  console.log(`[WebSearch] All strategies failed to find product name for barcode: ${barcode}`);
  return null;
}

/**
 * Try to fetch basic product info from web search using DuckDuckGo Instant Answer API
 * Enhanced to also fetch images, nutrition, and ingredients
 * This is free and doesn't require an API key
 */
export async function fetchProductFromWebSearch(barcode: string): Promise<Product | null> {
  console.log(`[WebSearch] Starting web search fallback for barcode: ${barcode}`);
  
  try {
    // CRITICAL: First, try to get the product name from the barcode
    // Without a product name, we can't search for images/nutrition/ingredients
    let productName = await getProductNameFromBarcode(barcode);
    
    let genericDescription: string | undefined;
    
    // If we couldn't get a product name, try one more strategy: search DuckDuckGo directly
    if (!productName) {
      console.log(`[WebSearch] Product name not found, trying direct DuckDuckGo search...`);
      try {
        const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(barcode)}&format=json&no_html=1&skip_disambig=1`;
        const response = await fetch(ddgUrl, {
          headers: { 'Accept': 'application/json', 'User-Agent': 'TrueScan-FoodScanner/1.0.0' },
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.Heading && data.Heading !== barcode) {
            productName = data.Heading;
          }
          
          if (data.AbstractText) {
            genericDescription = data.AbstractText;
            // Try to extract product name from AbstractText if Heading didn't work
            if (!productName) {
              const text = data.AbstractText;
              // Look for quoted product names or capitalized names
              const quotedMatch = text.match(/"([^"]+)"/);
              if (quotedMatch) {
                productName = quotedMatch[1];
              } else {
                // Try to find a capitalized phrase that looks like a product name
                const nameMatch = text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,4})\b/);
                if (nameMatch && nameMatch[1].length > 5) {
                  productName = nameMatch[1];
                }
              }
            }
          }
        }
      } catch (error) {
        console.warn(`[WebSearch] Error in DuckDuckGo search:`, error);
      }
    }

    // If we still don't have a product name, try searching with the barcode directly
    // This is important because sometimes we can still find data even without a product name
    if (!productName) {
      console.log(`[WebSearch] No product name found, trying to fetch data using barcode directly...`);
      
      // Try comprehensive web scraping with barcode directly
      console.log(`[WebSearch] Trying comprehensive web scraping with barcode: ${barcode}`);
      
      const scrapedData = await scrapeProductInfo(barcode);
      
      // Also try old methods as fallback
      const [imageUrlOld, nutrimentsOld, ingredientsTextOld] = await Promise.all([
        fetchProductImage(barcode, barcode).catch(() => undefined),
        fetchNutritionInfo(barcode).catch(() => undefined),
        fetchIngredients(barcode).catch(() => undefined),
      ]);

      const imageUrl = scrapedData.image || imageUrlOld;
      const nutriments = scrapedData.nutrition || nutrimentsOld;
      const ingredientsText = scrapedData.ingredients || ingredientsTextOld;

      console.log(`[WebSearch] Barcode direct results - Image: ${imageUrl ? 'Found' : 'Not found'}, Nutrition: ${nutriments ? Object.keys(nutriments).length + ' fields' : 'Not found'}, Ingredients: ${ingredientsText ? 'Found' : 'Not found'}`);

      // If we found anything, use it even without a product name
      if (imageUrl || nutriments || ingredientsText) {
        let quality = 30;
        let completion = 30;
        
        if (imageUrl) quality += 20;
        if (nutriments && Object.keys(nutriments).length > 0) {
          quality += 15;
          completion += 20;
        }
        if (ingredientsText) {
          quality += 10;
          completion += 20;
        }

        return {
          barcode,
          product_name: scrapedData.productName,
          generic_name: genericDescription || scrapedData.ingredients?.substring(0, 200),
          source: 'web_search',
          image_url: imageUrl,
          nutriments: nutriments,
          ingredients_text: ingredientsText,
          quality: Math.min(quality, 70),
          completion: Math.min(completion, 70),
        };
      }

      // Still no luck, use generic name
      productName = `Product ${barcode}`;
    } else {
      console.log(`[WebSearch] Using product name: ${productName}`);
    }

    // Now fetch image, nutrition, and ingredients using comprehensive web scraping
    console.log(`[WebSearch] Starting comprehensive web scraping for: ${productName || barcode}`);
    
    // Use comprehensive web scraping service
    const scrapedData = await scrapeProductInfo(barcode, productName);
    
    // Also try the old methods in parallel as fallback
    const [imageUrlOld, nutrimentsOld, ingredientsTextOld] = await Promise.all([
      fetchProductImage(productName, barcode).catch(() => undefined),
      fetchNutritionInfo(productName).catch(() => undefined),
      fetchIngredients(productName).catch(() => undefined),
    ]);

    // Merge results (scraped data takes priority, but use old methods as fallback)
    const imageUrl = scrapedData.image || imageUrlOld;
    const nutriments = scrapedData.nutrition || nutrimentsOld;
    const ingredientsText = scrapedData.ingredients || ingredientsTextOld;
    const finalProductName = scrapedData.productName || productName;

    console.log(`[WebSearch] Results - Image: ${imageUrl ? 'Found' : 'Not found'}, Nutrition: ${nutriments ? Object.keys(nutriments).length + ' fields' : 'Not found'}, Ingredients: ${ingredientsText ? 'Found' : 'Not found'}`);

    // Calculate quality and completion based on available data
    let quality = 30; // Base quality
    let completion = 30; // Base completion
    
    if (imageUrl) {
      quality += 20;
      console.log(`[WebSearch] +20 quality for image`);
    }
    if (nutriments && Object.keys(nutriments).length > 0) {
      quality += 15;
      completion += 20;
      console.log(`[WebSearch] +15 quality, +20 completion for nutrition (${Object.keys(nutriments).length} fields)`);
    }
    if (ingredientsText) {
      quality += 10;
      completion += 20;
      console.log(`[WebSearch] +10 quality, +20 completion for ingredients`);
    }

    const finalQuality = Math.min(quality, 70);
    const finalCompletion = Math.min(completion, 70);
    
    console.log(`[WebSearch] Final quality: ${finalQuality}, completion: ${finalCompletion}`);

    const product: Product = {
      barcode,
      product_name: finalProductName !== `Product ${barcode}` ? finalProductName : (productName !== `Product ${barcode}` ? productName : undefined),
      generic_name: genericDescription || scrapedData.ingredients?.substring(0, 200),
      source: 'web_search',
      image_url: imageUrl,
      nutriments: nutriments,
      ingredients_text: ingredientsText,
      quality: finalQuality,
      completion: finalCompletion,
    };

    return product;
  } catch (error) {
    console.error('[WebSearch] Error fetching from web search:', error);
    // Even if web search fails, create a fallback product
    return await createFallbackProduct(barcode);
  }
}

/**
 * Create a minimal fallback product when all sources fail
 * This ensures we always return SOME result, even if it's just the barcode
 * Enhanced to try fetching an image even for minimal products
 */
async function createFallbackProduct(barcode: string): Promise<Product> {
  console.log(`[WebSearch] Creating fallback product for barcode: ${barcode}`);
  
  // Try comprehensive web scraping first
  console.log(`[WebSearch] Trying comprehensive web scraping for fallback product`);
  const scrapedData = await scrapeProductInfo(barcode);
  
  // Try to get product name from scraping or other methods
  let productName: string | undefined = scrapedData.productName;
  if (!productName) {
    productName = await getProductNameFromBarcode(barcode) || undefined;
  }
  if (!productName) {
    productName = `Product ${barcode}`;
  }
  
  console.log(`[WebSearch] Fallback product name: ${productName}`);
  
  // If scraping didn't find everything, try old methods
  const [imageUrlOld, nutrimentsOld, ingredientsTextOld] = await Promise.all([
    scrapedData.image ? Promise.resolve(undefined) : fetchProductImage(productName, barcode).catch(() => undefined),
    scrapedData.nutrition ? Promise.resolve(undefined) : fetchNutritionInfo(productName).catch(() => undefined),
    scrapedData.ingredients ? Promise.resolve(undefined) : fetchIngredients(productName).catch(() => undefined),
  ]);

  // Merge results
  const imageUrl = scrapedData.image || imageUrlOld;
  const nutriments = scrapedData.nutrition || nutrimentsOld;
  const ingredientsText = scrapedData.ingredients || ingredientsTextOld;

  console.log(`[WebSearch] Fallback results - Image: ${imageUrl ? 'Found' : 'Not found'}, Nutrition: ${nutriments ? Object.keys(nutriments).length + ' fields' : 'Not found'}, Ingredients: ${ingredientsText ? 'Found' : 'Not found'}`);

  // Calculate quality and completion based on available data
  let quality = 10;
  let completion = 20;
  
  if (imageUrl) quality += 15;
  if (nutriments && Object.keys(nutriments).length > 0) {
    quality += 10;
    completion += 15;
  }
  if (ingredientsText) {
    quality += 5;
    completion += 15;
  }

  return {
    barcode,
    product_name: productName !== `Product ${barcode}` ? productName : undefined,
    source: 'web_search',
    image_url: imageUrl,
    nutriments: nutriments,
    ingredients_text: ingredientsText,
    quality: Math.min(quality, 40),
    completion: Math.min(completion, 50),
    // Mark this as needing web search for more info
    states_tags: ['en:web-search-needed'],
  };
}

/**
 * Check if a product is from web search fallback (low quality, needs web search)
 */
export function isWebSearchFallback(product: Product | null): boolean {
  if (!product) return false;
  return product.source === 'web_search' || 
         (product.states_tags?.includes('en:web-search-needed') ?? false) ||
         (product.quality !== undefined && product.quality < 50);
}

