// Comprehensive Web Scraping Service
// Aggressively searches the internet for product information: image, ingredients, and nutrition
// Uses multiple strategies including CORS proxies, structured data parsing, and multiple sources

import { Product, ProductNutriments } from '../types/product';

// Free CORS proxies (public, rate-limited but usable)
const CORS_PROXIES = [
  'https://api.allorigins.win/get?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://cors-anywhere.herokuapp.com/',
  'https://thingproxy.freeboard.io/fetch/',
];

/**
 * Create an AbortSignal with timeout (React Native compatible)
 */
function createTimeoutSignal(timeoutMs: number): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);
  
  const cleanup = () => {
    clearTimeout(timeoutId);
  };
  
  return { signal: controller.signal, cleanup };
}

/**
 * Try to fetch a URL through CORS proxies
 */
async function fetchWithCorsProxy(url: string, retries = 3): Promise<string | null> {
  for (let i = 0; i < Math.min(retries, CORS_PROXIES.length); i++) {
    const proxy = CORS_PROXIES[i];
    const { signal: abortSignal, cleanup } = createTimeoutSignal(10000); // 10 second timeout
    
    try {
      const proxyUrl = proxy + encodeURIComponent(url);
      
      const response = await fetch(proxyUrl, {
        headers: {
          'Accept': 'text/html,application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: abortSignal,
      });

      // Clean up timeout since request completed
      cleanup();

      if (response.ok) {
        // Some proxies wrap the response in JSON
        const text = await response.text();
        if (!text || text.length < 100) {
          // Too short, probably an error page
          continue;
        }
        try {
          const json = JSON.parse(text);
          if (json.contents) return json.contents; // allorigins format
          if (json.content) return json.content;
          if (typeof json === 'string') return json;
        } catch {
          // Not JSON, return as-is
          return text;
        }
        return text;
      }
    } catch (error: unknown) {
      // Clean up timeout on error
      cleanup();
      
      // Only log detailed error if it's not a timeout or network error
      const errorName = error instanceof Error ? error.name : 'Unknown';
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorName !== 'AbortError' && errorMessage !== 'Network request failed' && !errorMessage?.includes('AbortSignal.timeout')) {
        console.warn(`[WebScraping] CORS proxy ${proxy} failed:`, errorMessage);
      }
      continue;
    }
  }
  return null;
}

/**
 * Extract JSON-LD structured data from HTML
 */
interface StructuredData {
  '@context'?: string;
  '@type'?: string;
  name?: string;
  description?: string;
  nutrition?: Record<string, unknown>;
  ingredients?: string[];
  [key: string]: unknown;
}

function extractStructuredData(html: string): StructuredData | null {
  try {
    // Extract JSON-LD scripts
    const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis;
    const matches = html.matchAll(jsonLdRegex);
    
    for (const match of matches) {
      try {
        const data = JSON.parse(match[1]);
        if (data['@type'] && (data['@type'].includes('Product') || data['@type'] === 'Product')) {
          return data;
        }
        if (Array.isArray(data)) {
          for (const item of data) {
            if (item['@type'] && (item['@type'].includes('Product') || item['@type'] === 'Product')) {
              return item;
            }
          }
        }
      } catch {}
    }
  } catch (error) {
    console.warn('[WebScraping] Error extracting structured data:', error);
  }
  return null;
}

/**
 * Parse product information from structured data
 */
function parseStructuredData(structuredData: any): {
  name?: string;
  image?: string;
  description?: string;
  nutrition?: any;
  ingredients?: string;
} {
  const result: any = {};

  if (structuredData.name) result.name = structuredData.name;
  if (structuredData.image) {
    const image = Array.isArray(structuredData.image) ? structuredData.image[0] : structuredData.image;
    result.image = typeof image === 'string' ? image : image?.url || image?.['@id'];
  }
  if (structuredData.description) result.description = structuredData.description;
  
  // Nutrition information
  if (structuredData.nutrition || structuredData.nutritionInformation) {
    const nutritionData = structuredData.nutrition || structuredData.nutritionInformation;
    if (typeof nutritionData === 'object') {
      // Try to convert to ProductNutriments format
      const nutrition: ProductNutriments = {};
      if (nutritionData.calories) nutrition['energy-kcal_100g'] = nutritionData.calories;
      if (nutritionData.protein) nutrition.proteins_100g = nutritionData.protein;
      if (nutritionData.fat) nutrition.fat_100g = nutritionData.fat;
      if (nutritionData.carbohydrates) nutrition.carbohydrates_100g = nutritionData.carbohydrates;
      if (nutritionData.sugar) nutrition.sugars_100g = nutritionData.sugar;
      if (nutritionData.sodium) nutrition.sodium_100g = nutritionData.sodium;
      result.nutrition = nutrition;
    }
  }
  
  // Ingredients
  if (structuredData.ingredients || structuredData.hasIngredient) {
    const ingredients = structuredData.ingredients || structuredData.hasIngredient;
    if (Array.isArray(ingredients)) {
      result.ingredients = ingredients.map((i: any) => 
        typeof i === 'string' ? i : i.name || i.text
      ).join(', ');
    } else if (typeof ingredients === 'string') {
      result.ingredients = ingredients;
    }
  }

  return result;
}

/**
 * Try to scrape product page from a URL
 */
async function scrapeProductPage(url: string): Promise<{
  name?: string;
  image?: string;
  description?: string;
  nutrition?: ProductNutriments;
  ingredients?: string;
} | null> {
  try {
    const html = await fetchWithCorsProxy(url);
    if (!html || html.length < 500) {
      // HTML too short, probably an error page
      return null;
    }

    // Extract structured data (JSON-LD)
    const structuredData = extractStructuredData(html);
    if (structuredData) {
      const parsed = parseStructuredData(structuredData);
      return {
        name: parsed.name,
        image: parsed.image,
        description: parsed.description,
        nutrition: parsed.nutrition,
        ingredients: parsed.ingredients,
      };
    }

    // Try to extract image from HTML (multiple patterns)
    let image: string | undefined;
    const imagePatterns = [
      /<img[^>]*src=["']([^"']*product[^"']*\.(jpg|jpeg|png|webp))[^"']*["'][^>]*/i,
      /<img[^>]*src=["']([^"']*\.(jpg|jpeg|png|webp))[^"']*["'][^>]*/i,
      /"image":\s*"([^"]+\.(jpg|jpeg|png|webp))"/i,
      /"imageUrl":\s*"([^"]+\.(jpg|jpeg|png|webp))"/i,
    ];
    
    for (const pattern of imagePatterns) {
      const match = html.match(pattern);
      if (match && match[1] && !match[1].includes('placeholder') && !match[1].includes('logo')) {
        image = match[1].startsWith('http') ? match[1] : `https:${match[1]}`;
        break;
      }
    }

    // Try to extract ingredients (look for common patterns)
    let ingredients: string | undefined;
    const ingredientsPatterns = [
      /ingredients?[:\s]+([^<\n]{20,1000})/i,
      /<[^>]*ingredients?[^>]*>([^<]{20,1000})/i,
      /"ingredients?":\s*"([^"]{20,500})"/i,
      /ingredients?[:\s]*<[^>]*>([^<]{20,1000})/i,
    ];
    
    for (const pattern of ingredientsPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        let text = match[1].trim();
        // Clean up HTML
        text = text.replace(/<[^>]+>/g, ' ').replace(/&[^;]+;/g, ' ').replace(/\s+/g, ' ').trim();
        if (text.length > 20) {
          ingredients = text.substring(0, 500);
          break;
        }
      }
    }

    // Try to extract nutrition (look for nutrition facts tables/labels)
    let nutrition: ProductNutriments | undefined;
    const nutritionTableMatch = html.match(/nutrition[^<]*facts?[^<]*>[\s\S]{0,5000}?calories?[:\s]*(\d+)/i) ||
                                html.match(/nutritional[^<]*information[^<]*>[\s\S]{0,5000}?calories?[:\s]*(\d+)/i);
    
    if (nutritionTableMatch) {
      const tableHtml = nutritionTableMatch[0];
      nutrition = {};
      
      // Extract calories
      const caloriesMatch = tableHtml.match(/calories?[:\s]*(\d+)/i);
      if (caloriesMatch) nutrition['energy-kcal_100g'] = parseFloat(caloriesMatch[1]);
      
      // Extract other nutrients
      const proteinMatch = tableHtml.match(/protein[:\s]*(\d+(?:\.\d+)?)\s*g/i);
      if (proteinMatch) nutrition.proteins_100g = parseFloat(proteinMatch[1]);
      
      const fatMatch = tableHtml.match(/total\s*fat[:\s]*(\d+(?:\.\d+)?)\s*g/i) || tableHtml.match(/fat[:\s]*(\d+(?:\.\d+)?)\s*g/i);
      if (fatMatch) nutrition.fat_100g = parseFloat(fatMatch[1]);
      
      const carbMatch = tableHtml.match(/total\s*carbohydrates?[:\s]*(\d+(?:\.\d+)?)\s*g/i) || tableHtml.match(/carbohydrates?[:\s]*(\d+(?:\.\d+)?)\s*g/i);
      if (carbMatch) nutrition.carbohydrates_100g = parseFloat(carbMatch[1]);
      
      if (Object.keys(nutrition).length === 0) {
        nutrition = undefined; // Don't return empty nutrition object
      }
    }
    
    // Only return if we found something
    if (image || ingredients || nutrition) {
      return {
        image,
        ingredients,
        nutrition,
      };
    }
    
    return null;
  } catch (error) {
    console.warn(`[WebScraping] Error scraping ${url}:`, error);
    return null;
  }
}

/**
 * Generate potential product page URLs for a barcode
 */
function generateProductUrls(barcode: string, productName?: string): string[] {
  const urls: string[] = [];
  
  // Amazon
  urls.push(`https://www.amazon.com/s?k=${barcode}`);
  urls.push(`https://www.amazon.com/dp/${barcode}`);
  
  // Walmart
  urls.push(`https://www.walmart.com/search?q=${barcode}`);
  
  // Google Shopping
  urls.push(`https://www.google.com/search?tbm=shop&q=${barcode}`);
  
  // eBay
  urls.push(`https://www.ebay.com/sch/i.html?_nkw=${barcode}`);
  
  // Barcode lookup sites
  urls.push(`https://www.barcodelookup.com/${barcode}`);
  urls.push(`https://www.upcitemdb.com/upc/${barcode}`);
  
  // Open Food Facts (if product name suggests food)
  if (productName || barcode.length >= 8) {
    urls.push(`https://world.openfoodfacts.org/product/${barcode}`);
  }
  
  return urls;
}

/**
 * Comprehensive web scraping for product information
 * Tries multiple sources and strategies to find image, ingredients, and nutrition
 */
export async function scrapeProductInfo(barcode: string, productName?: string): Promise<{
  image?: string;
  ingredients?: string;
  nutrition?: ProductNutriments;
  productName?: string;
}> {
  console.log(`[WebScraping] Starting comprehensive web scraping for barcode: ${barcode}`);
  
  const results = {
    image: undefined as string | undefined,
    ingredients: undefined as string | undefined,
    nutrition: undefined as ProductNutriments | undefined,
    productName: undefined as string | undefined,
  };

  // Strategy 1: Try Open Food Facts directly (structured, reliable)
  try {
    const offUrl = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
    const response = await fetch(offUrl, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'TrueScan-FoodScanner/1.0.0' },
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.status === 1 && data.product) {
        const product = data.product;
        
        if (!results.image && product.image_url) results.image = product.image_url;
        if (!results.ingredients && product.ingredients_text) results.ingredients = product.ingredients_text;
        if (!results.nutrition && product.nutriments) results.nutrition = product.nutriments;
        if (!results.productName && product.product_name) results.productName = product.product_name;
        
        console.log(`[WebScraping] Found data from Open Food Facts`);
      }
    }
  } catch (error) {
    console.warn(`[WebScraping] Open Food Facts API error:`, error);
  }

  // Strategy 2: Try product page URLs (scrape with CORS proxy)
  const productUrls = generateProductUrls(barcode, productName);
  
  for (const url of productUrls.slice(0, 3)) { // Limit to 3 to avoid too many requests
    try {
      const scraped = await scrapeProductPage(url);
      if (scraped && (scraped.image || scraped.ingredients || scraped.nutrition || scraped.name)) {
        let foundAnything = false;
        if (!results.image && scraped.image) {
          results.image = scraped.image;
          foundAnything = true;
        }
        if (!results.ingredients && scraped.ingredients) {
          results.ingredients = scraped.ingredients;
          foundAnything = true;
        }
        if (!results.nutrition && scraped.nutrition && Object.keys(scraped.nutrition).length > 0) {
          results.nutrition = scraped.nutrition;
          foundAnything = true;
        }
        if (!results.productName && scraped.name) {
          results.productName = scraped.name;
          foundAnything = true;
        }
        
        if (foundAnything) {
          console.log(`[WebScraping] Found data from ${url}`);
        }
        
        // If we found all three, we're done
        if (results.image && results.ingredients && results.nutrition && Object.keys(results.nutrition).length > 2) {
          break;
        }
      }
    } catch (error) {
      // Silently continue - don't log every CORS failure
      continue;
    }
  }

  // Strategy 3: Try Google Image Search for product image
  if (!results.image) {
    try {
      const imageQuery = productName || barcode;
      const googleImageUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(imageQuery)}`;
      const html = await fetchWithCorsProxy(googleImageUrl);
      
      if (html) {
        // Extract first image URL from Google Image Search
        const imageMatch = html.match(/"ou":"([^"]+)"/);
        if (imageMatch && imageMatch[1]) {
          results.image = imageMatch[1];
          console.log(`[WebScraping] Found image from Google Image Search`);
        }
      }
    } catch (error) {
      console.warn(`[WebScraping] Google Image Search error:`, error);
    }
  }

  // Strategy 4: Try to find ingredients and nutrition using multiple web search queries
  if (!results.ingredients || !results.nutrition) {
    const searchQueries = [
      productName ? `${productName} ingredients nutrition facts` : `${barcode} product ingredients nutrition facts`,
      productName ? `${productName} ingredients list` : `${barcode} ingredients`,
      productName ? `${productName} nutrition label` : `${barcode} nutrition`,
    ];

    for (const searchQuery of searchQueries) {
      if (results.ingredients && results.nutrition && Object.keys(results.nutrition).length > 2) {
        break; // Found everything we need
      }

      try {
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
        const html = await fetchWithCorsProxy(searchUrl);
        
        if (html) {
          // Try to extract ingredients (more aggressive patterns)
          if (!results.ingredients) {
            const ingredientsPatterns = [
              /ingredients?[:\s]+([^<\n]{20,1000})/i,
              /contains?[:\s]+([^<\n]{20,1000})/i,
              /ingredients?[^<]*<\/?[^>]+>([^<]{20,1000})/i,
              /"ingredients?":\s*"([^"]{20,500})"/i,
            ];
            
            for (const pattern of ingredientsPatterns) {
              const match = html.match(pattern);
              if (match && match[1]) {
                let ingredients = match[1].trim();
                // Clean up HTML entities and tags
                ingredients = ingredients.replace(/<[^>]+>/g, ' ').replace(/&[^;]+;/g, ' ').replace(/\s+/g, ' ').trim();
                if (ingredients.length > 20) {
                  results.ingredients = ingredients.substring(0, 500);
                  console.log(`[WebScraping] Found ingredients from web search`);
                  break;
                }
              }
            }
          }
          
          // Try to extract nutrition (more aggressive patterns)
          if (!results.nutrition || Object.keys(results.nutrition).length < 3) {
            const nutritionPatterns = [
              { pattern: /calories?[:\s]*(\d+)/i, key: 'energy-kcal_100g' as keyof ProductNutriments },
              { pattern: /energy[:\s]*(\d+)\s*kcal/i, key: 'energy-kcal_100g' as keyof ProductNutriments },
              { pattern: /protein[:\s]*(\d+(?:\.\d+)?)\s*g/i, key: 'proteins_100g' as keyof ProductNutriments },
              { pattern: /fat[:\s]*(\d+(?:\.\d+)?)\s*g/i, key: 'fat_100g' as keyof ProductNutriments },
              { pattern: /total\s*fat[:\s]*(\d+(?:\.\d+)?)\s*g/i, key: 'fat_100g' as keyof ProductNutriments },
              { pattern: /carbohydrates?[:\s]*(\d+(?:\.\d+)?)\s*g/i, key: 'carbohydrates_100g' as keyof ProductNutriments },
              { pattern: /total\s*carbohydrates?[:\s]*(\d+(?:\.\d+)?)\s*g/i, key: 'carbohydrates_100g' as keyof ProductNutriments },
              { pattern: /sugar[:\s]*(\d+(?:\.\d+)?)\s*g/i, key: 'sugars_100g' as keyof ProductNutriments },
              { pattern: /total\s*sugar[:\s]*(\d+(?:\.\d+)?)\s*g/i, key: 'sugars_100g' as keyof ProductNutriments },
              { pattern: /sodium[:\s]*(\d+(?:\.\d+)?)\s*mg/i, key: 'sodium_100g' as keyof ProductNutriments },
              { pattern: /sodium[:\s]*(\d+(?:\.\d+)?)\s*g/i, key: 'sodium_100g' as keyof ProductNutriments },
              { pattern: /fiber[:\s]*(\d+(?:\.\d+)?)\s*g/i, key: 'fiber_100g' as keyof ProductNutriments },
              { pattern: /dietary\s*fiber[:\s]*(\d+(?:\.\d+)?)\s*g/i, key: 'fiber_100g' as keyof ProductNutriments },
            ];
            
            const nutrition: ProductNutriments = results.nutrition || {};
            for (const { pattern, key } of nutritionPatterns) {
              if (nutrition[key]) continue; // Already have this value
              const match = html.match(pattern);
              if (match) {
                let value = parseFloat(match[1]);
                // Convert mg to g for sodium if needed
                if (key === 'sodium_100g' && match[0].toLowerCase().includes('mg') && value > 100) {
                  value = value / 10; // Approximate conversion
                }
                nutrition[key] = value;
              }
            }
            
            if (Object.keys(nutrition).length > 0) {
              results.nutrition = nutrition;
              console.log(`[WebScraping] Found nutrition from web search (${Object.keys(nutrition).length} fields)`);
            }
          }
        }
      } catch (error) {
        console.warn(`[WebScraping] Web search error for "${searchQuery}":`, error);
        continue; // Try next query
      }
    }
  }

  console.log(`[WebScraping] Results - Image: ${results.image ? 'Found' : 'Not found'}, Ingredients: ${results.ingredients ? 'Found' : 'Not found'}, Nutrition: ${results.nutrition ? Object.keys(results.nutrition).length + ' fields' : 'Not found'}`);
  
  return results;
}

