// Product-specific scraping - finds the exact product in search results, then extracts its price
// This is critical for accuracy: we must find the product first, then get its price
import { PriceEntry } from '../../types/pricing';
import { StoreLocation } from './localStorePricing';
import { fetchWithCorsProxy } from './corsProxy';
import { matchStoreToChain, buildStoreSearchUrl as buildChainSearchUrl, StoreChain } from './countryStores';

/**
 * Scrape price for a SPECIFIC product by finding it in search results first
 * This is the correct approach: find product → extract its price
 */
export async function scrapeProductSpecificPrice(
  barcode: string,
  productName: string,
  store: StoreLocation,
  countryCode?: string
): Promise<PriceEntry | null> {
  try {
    if (!countryCode) {
      return null;
    }

    console.log(`[ProductSpecific] Scraping ${store.name} for product: ${productName} (${barcode})`);

    // Try alternative URL strategies
    const { html: htmlResult, url: usedUrl, strategy } = await tryAlternativeUrls(store, barcode, productName, countryCode);
    
    if (!htmlResult) {
      console.log(`[ProductSpecific] All URL strategies failed for ${store.name}`);
      return null;
    }
    
    const html = htmlResult;
    console.log(`[ProductSpecific] Using ${strategy} strategy, URL: ${usedUrl.substring(0, 80)}...`);

    if (!html || html.length < 100) {
      return null;
    }

    // Check if HTML is compressed/binary (common issue)
    const isBinary = /[\x00-\x08\x0E-\x1F]/.test(html.substring(0, 1000));
    if (isBinary) {
      console.warn(`[ProductSpecific] HTML appears to be compressed/binary for ${store.name} - may need decompression`);
      // Try to find readable sections
      const readableSections = extractReadableSections(html);
      if (readableSections.length === 0) {
        return null;
      }
      // Use readable sections for extraction
      return extractPriceFromProductSections(readableSections, store.name, productName, barcode, countryCode);
    }

    // Log HTML structure for debugging
    console.log(`[ProductSpecific] HTML received for ${store.name}: ${html.length} chars`);
    console.log(`[ProductSpecific] Searching for: "${productName}" (barcode: ${barcode})`);
    
    // Log HTML snippet around product name if found
    const productNameLower = productName.toLowerCase();
    const nameIndex = html.toLowerCase().indexOf(productNameLower);
    if (nameIndex !== -1) {
      const snippet = html.substring(
        Math.max(0, nameIndex - 200),
        Math.min(html.length, nameIndex + 500)
      );
      console.log(`[ProductSpecific] Found product name in HTML at index ${nameIndex}:`);
      console.log(`[ProductSpecific] HTML snippet: ${snippet.replace(/\s+/g, ' ').substring(0, 300)}...`);
    } else {
      console.log(`[ProductSpecific] Product name "${productName}" NOT found in HTML`);
      // Try partial matches
      const keywords = productNameLower.split(' ').filter(w => w.length > 3);
      for (const keyword of keywords) {
        const keywordIndex = html.toLowerCase().indexOf(keyword);
        if (keywordIndex !== -1) {
          const snippet = html.substring(
            Math.max(0, keywordIndex - 200),
            Math.min(html.length, keywordIndex + 500)
          );
          console.log(`[ProductSpecific] Found keyword "${keyword}" in HTML at index ${keywordIndex}:`);
          console.log(`[ProductSpecific] HTML snippet: ${snippet.replace(/\s+/g, ' ').substring(0, 300)}...`);
        }
      }
    }
    
    // Log HTML structure (check for common patterns)
    const hasJsonLd = /<script[^>]*type=["']application\/ld\+json["']/i.test(html);
    const hasProductCards = /class="[^"]*product[^"]*"/i.test(html) || /class="[^"]*item[^"]*"/i.test(html);
    const hasPricePatterns = /\$[\d,]+\.?\d{0,2}/.test(html) || /"price"\s*:/i.test(html);
    console.log(`[ProductSpecific] HTML structure check: JSON-LD=${hasJsonLd}, ProductCards=${hasProductCards}, PricePatterns=${hasPricePatterns}`);
    
    // Find the specific product in search results
    const productSection = findProductInSearchResults(html, productName, barcode, store.name);
    
    if (!productSection) {
      console.log(`[ProductSpecific] Product not found in search results for ${store.name} - product may not be available or search didn't return it`);
      // Log what we did find for debugging
      const priceMatches = html.match(/\$[\d,]+\.?\d{0,2}/g);
      if (priceMatches) {
        console.log(`[ProductSpecific] Found ${priceMatches.length} price-like patterns in HTML (but couldn't match product): ${priceMatches.slice(0, 10).join(', ')}`);
      }
      // Don't return wrong prices - better to return null than incorrect data
      return null;
    }
    
    console.log(`[ProductSpecific] Found product section (${productSection.length} chars) for ${store.name}`);

    console.log(`[ProductSpecific] Found product section for ${store.name}, extracting price...`);

    // Extract price from the product's specific section only
    const price = extractPriceFromProductSection(productSection, store.name, countryCode);
    
    if (price && price.confidence >= 8) {
      let currency = 'USD';
      if (countryCode === 'NZ') currency = 'NZD';
      else if (countryCode === 'GB') currency = 'GBP';
      else if (countryCode === 'AU') currency = 'AUD';
      else if (countryCode === 'CA') currency = 'CAD';

      console.log(`[ProductSpecific] ✅ Extracted price $${price.price} (confidence: ${price.confidence}) for ${store.name}`);
      return {
        price: price.price,
        currency,
        retailer: store.name,
        location: store.address,
        timestamp: Date.now(),
        source: 'api',
        verified: true,
      };
    }

    console.log(`[ProductSpecific] Price extraction failed or low confidence for ${store.name}`);
    return null;
  } catch (error) {
    console.error(`[ProductSpecific] Error scraping ${store.name}:`, error);
    return null;
  }
}

/**
 * Find the specific product in search results HTML
 * Looks for product name, barcode, or product card that matches
 */
/**
 * Calculate Levenshtein distance between two strings (for fuzzy matching)
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  const len1 = str1.length;
  const len2 = str2.length;

  if (len1 === 0) return len2;
  if (len2 === 0) return len1;

  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[len2][len1];
}

/**
 * Calculate similarity score between two strings (0-1, higher is more similar)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
  return (longer.length - distance) / longer.length;
}

/**
 * Check if product name matches using fuzzy matching
 */
function fuzzyMatchProduct(productName: string, candidateName: string, threshold: number = 0.6): boolean {
  const similarity = calculateSimilarity(productName, candidateName);
  
  // Also check if key words match (word order independent)
  const productWords = productName.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const candidateWords = candidateName.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const matchingWords = productWords.filter(w => candidateWords.some(cw => cw.includes(w) || w.includes(cw)));
  const wordMatchRatio = productWords.length > 0 ? matchingWords.length / productWords.length : 0;
  
  // Match if similarity is high OR if most words match
  return similarity >= threshold || wordMatchRatio >= 0.7;
}

function findProductInSearchResults(
  html: string,
  productName: string,
  barcode: string,
  storeName: string
): string | null {
  const productNameLower = productName.toLowerCase();
  // Include shorter keywords too (2+ chars) for better matching
  const productKeywords = productNameLower.split(' ').filter(w => w.length > 2);
  const storeNameLower = storeName.toLowerCase();
  
  console.log(`[ProductSpecific] Searching for product: "${productName}" (keywords: ${productKeywords.join(', ')})`);

  // Strategy 1: Look for JSON-LD structured data with product info
  const jsonLdPattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const jsonLdMatches = html.match(jsonLdPattern);
  
  if (jsonLdMatches) {
    for (const match of jsonLdMatches) {
      try {
        const jsonMatch = match.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
        if (!jsonMatch) continue;

        const jsonStr = jsonMatch[1].trim();
        let jsonData: any;

        if (jsonStr.startsWith('[')) {
          jsonData = JSON.parse(jsonStr);
        } else {
          jsonData = [JSON.parse(jsonStr)];
        }

        for (const item of Array.isArray(jsonData) ? jsonData : [jsonData]) {
          if (item['@type'] === 'Product' || item['@type']?.includes('Product')) {
            // Check if this product matches
            const itemName = (item.name || '').toLowerCase();
            const itemGtin = item.gtin13 || item.gtin || '';
            
            // Match by barcode (most reliable)
            if (barcode && itemGtin === barcode) {
              console.log(`[ProductSpecific] Found product by barcode in JSON-LD`);
              return match; // Return the JSON-LD section
            }
            
            // Match by product name keywords (more flexible - try partial matches)
            if (productKeywords.length > 0) {
              // Try exact match first
              if (itemName.includes(productNameLower)) {
                console.log(`[ProductSpecific] Found product by exact name match in JSON-LD: "${item.name}"`);
                return match;
              }
              // Try fuzzy matching
              if (fuzzyMatchProduct(productNameLower, itemName)) {
                console.log(`[ProductSpecific] Found product by fuzzy match in JSON-LD: "${item.name}"`);
                return match;
              }
              // Try keyword matches (at least 2 keywords must match)
              const matchingKeywords = productKeywords.filter(kw => itemName.includes(kw));
              if (matchingKeywords.length >= 2) {
                console.log(`[ProductSpecific] Found product by ${matchingKeywords.length} keyword matches in JSON-LD: "${item.name}"`);
                return match;
              }
            }
          }
        }
      } catch (error) {
        continue;
      }
    }
  }

  // Strategy 2: Look for product cards/sections in HTML
  // Common patterns for product listings - be more flexible
  const productCardPatterns = [
    // More flexible patterns to catch various HTML structures
    /<div[^>]*class="[^"]*(?:product|item|tile|card)[^"]*"[^>]*>[\s\S]{0,3000}?<\/div>/gi,
    /<article[^>]*class="[^"]*(?:product|item|tile|card)[^"]*"[^>]*>[\s\S]{0,3000}?<\/article>/gi,
    /<li[^>]*class="[^"]*(?:product|item|tile|card)[^"]*"[^>]*>[\s\S]{0,3000}?<\/li>/gi,
    // Also try data attributes
    /<div[^>]*data-[^=]*product[^=]*="[^"]*"[^>]*>[\s\S]{0,3000}?<\/div>/gi,
    // Generic divs that might contain products (wider search)
    /<div[^>]*>[\s\S]{200,3000}?<\/div>/gi,
  ];

  // Score each potential product card
  const scoredCards: Array<{ card: string; score: number }> = [];

  for (const pattern of productCardPatterns) {
    const matches = html.match(pattern);
    if (matches) {
      for (const card of matches) {
        const cardLower = card.toLowerCase();
        let score = 0;
        
        // Check if this card contains product name keywords
        if (productKeywords.length > 0) {
          // Try to extract product name from card (look for common patterns)
          const namePatterns = [
            /<[^>]*class="[^"]*product[^"]*name[^"]*"[^>]*>([^<]+)<\/[^>]*>/i,
            /<[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/[^>]*>/i,
            /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i,
            /data-product-name=["']([^"']+)["']/i,
          ];
          
          let cardProductName = '';
          for (const pattern of namePatterns) {
            const match = card.match(pattern);
            if (match && match[1]) {
              cardProductName = match[1].trim();
              break;
            }
          }
          
          // If we found a product name in the card, try fuzzy matching
          if (cardProductName) {
            if (fuzzyMatchProduct(productNameLower, cardProductName.toLowerCase())) {
              score += 50; // High score for fuzzy match
              console.log(`[ProductSpecific] Fuzzy matched product name in card: "${cardProductName}"`);
            }
          }
          
          const matchingKeywords = productKeywords.filter(kw => cardLower.includes(kw));
          // Require at least 2 keywords to match (reduces false positives)
          if (matchingKeywords.length >= 2) {
            score += matchingKeywords.length * 15; // 15 points per matching keyword
          } else if (matchingKeywords.length === 1 && productKeywords.length === 1) {
            // If only one keyword total, accept single match
            score += 10;
          }
        }
        
        // Check for product images (indicates it's a product card)
        if (cardLower.includes('<img') || cardLower.includes('data-src') || cardLower.includes('src=')) {
          score += 5;
        }
        
        // Check for barcode (very high score)
        if (barcode && cardLower.includes(barcode)) {
          score += 100;
        }
        
        // Check for price indicators (indicates it's a product listing)
        if (cardLower.includes('price') || cardLower.includes('$') || cardLower.includes('nz$')) {
          score += 5;
        }
        
        // Check for product-related terms
        if (cardLower.includes('add to cart') || cardLower.includes('buy') || cardLower.includes('product')) {
          score += 3;
        }
        
        // Penalize if it's clearly not a product (navigation, header, footer)
        if (cardLower.includes('navigation') || cardLower.includes('header') || cardLower.includes('footer') ||
            cardLower.includes('menu') || cardLower.includes('search')) {
          score -= 20;
        }
        
        if (score > 0) {
          scoredCards.push({ card, score });
        }
      }
    }
  }

  // Sort by score and return the best match (require minimum score)
  if (scoredCards.length > 0) {
    scoredCards.sort((a, b) => b.score - a.score);
    const bestCard = scoredCards[0];
    // Require minimum score of 15 to ensure it's actually a product match
    if (bestCard.score >= 15) {
      console.log(`[ProductSpecific] Found product card with score ${bestCard.score}`);
      return bestCard.card;
    } else {
      console.log(`[ProductSpecific] Best card score ${bestCard.score} too low (min: 15)`);
    }
  }

  // Strategy 3: Look for product sections near product name (more flexible)
  if (productKeywords.length > 0) {
    // Try each keyword
    for (const keyword of productKeywords) {
      const keywordLower = keyword.toLowerCase();
      const productNameIndex = html.toLowerCase().indexOf(keywordLower);
      
      if (productNameIndex !== -1) {
        // Extract a larger section around the product name (3000 chars to catch full product card)
        const section = html.substring(
          Math.max(0, productNameIndex - 1000),
          Math.min(html.length, productNameIndex + 3000)
        );
        
        // Verify this section likely contains product info
        const sectionLower = section.toLowerCase();
        const hasPrice = sectionLower.includes('price') || section.includes('$') || section.includes('nz$');
        const hasProductTerms = sectionLower.includes('product') || sectionLower.includes('item') || 
                                sectionLower.includes('add to cart') || sectionLower.includes('buy') ||
                                sectionLower.includes('cart') || sectionLower.includes('shop');
        
        // Also check if multiple keywords appear in this section (stronger match)
        const keywordsInSection = productKeywords.filter(kw => sectionLower.includes(kw));
        
        if ((hasPrice || hasProductTerms) && keywordsInSection.length >= 2) {
          console.log(`[ProductSpecific] Found product section near keyword "${keyword}" (${keywordsInSection.length} keywords found)`);
          return section;
        }
      }
    }
  }

  // Strategy 4: If product name not found, try searching for barcode
  if (barcode) {
    const barcodeIndex = html.indexOf(barcode);
    if (barcodeIndex !== -1) {
      const section = html.substring(
        Math.max(0, barcodeIndex - 1000),
        Math.min(html.length, barcodeIndex + 3000)
      );
      console.log(`[ProductSpecific] Found product section near barcode`);
      return section;
    }
  }

  console.log(`[ProductSpecific] Could not find product section - product may not be in search results`);
  return null;
}

/**
 * Extract price from a specific product section (not the whole page)
 */
function extractPriceFromProductSection(
  productSection: string,
  storeName: string,
  countryCode: string
): { price: number; confidence: number } | null {
  const storeNameLower = storeName.toLowerCase();
  const prices: Array<{ price: number; confidence: number }> = [];

  // High-confidence patterns for product prices
  const pricePatterns = [
    // JSON-LD price (highest confidence)
    { pattern: /"price"\s*:\s*"([\d.]+)"/gi, baseConfidence: 12 },
    { pattern: /"price"\s*:\s*([\d.]+)/gi, baseConfidence: 11 },
    { pattern: /"offers"\s*:\s*\{[\s\S]{0,500}?"price"\s*:\s*"([\d.]+)"/gi, baseConfidence: 12 },
    // Data attributes
    { pattern: /data-price=["']([\d.]+)["']/gi, baseConfidence: 10 },
    { pattern: /data-product-price=["']([\d.]+)["']/gi, baseConfidence: 10 },
    // Currency with price
    { pattern: /(?:NZ|US|AU|CA|GB|EU)\$[\s]*([\d,]+\.?\d{0,2})/gi, baseConfidence: 9 },
    { pattern: /\$[\s]*([\d,]+\.?\d{0,2})/g, baseConfidence: 8 },
    // Price in text near price keywords
    { pattern: /(?:price|cost)[^>]*>[\s\S]{0,100}?\$?([\d,]+\.?\d{0,2})/gi, baseConfidence: 9 },
  ];

  for (const { pattern, baseConfidence } of pricePatterns) {
    const matches = productSection.match(pattern);
    if (matches) {
      for (const match of matches) {
        const priceStr = match.replace(/[^\d.]/g, '');
        const price = parseFloat(priceStr);

        if (isNaN(price) || price <= 0 || price > 1000) {
          continue;
        }

        // Higher confidence if near product-related keywords
        const matchIndex = productSection.indexOf(match);
        const context = productSection.substring(
          Math.max(0, matchIndex - 100),
          Math.min(productSection.length, matchIndex + 100)
        ).toLowerCase();

        let confidence = baseConfidence;

        // Boost if near product keywords
        if (context.includes('product') || context.includes('item') || context.includes('add to cart')) {
          confidence += 2;
        }

        // Lower if near non-price keywords
        if (context.includes('quantity') || context.includes('weight') || context.includes('kg')) {
          confidence -= 3;
        }

        const existing = prices.find(p => Math.abs(p.price - price) < 0.01);
        if (!existing) {
          prices.push({ price, confidence });
        } else if (confidence > existing.confidence) {
          existing.confidence = confidence;
        }
      }
    }
  }

  if (prices.length === 0) {
    return null;
  }

  // Return highest confidence price
  const sorted = prices.sort((a, b) => b.confidence - a.confidence);
  
  // Require minimum confidence and reasonable price range
  // For grocery items, prices should typically be between $1 and $100
  for (const candidate of sorted) {
    if (candidate.confidence >= 8 && candidate.price >= 1 && candidate.price <= 100) {
      console.log(`[ProductSpecific] Extracted price $${candidate.price} (confidence: ${candidate.confidence})`);
      return candidate;
    }
  }

  console.log(`[ProductSpecific] No prices met confidence/range criteria (best: $${sorted[0].price}, conf: ${sorted[0].confidence})`);
  return null;
}

/**
 * Extract readable sections from compressed/binary HTML
 */
function extractReadableSections(html: string): string[] {
  const sections: string[] = [];
  
  // Look for readable text blocks (likely product listings)
  // Try to find JSON-LD or script tags that might contain readable data
  const scriptPattern = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  const scriptMatches = html.match(scriptPattern);
  
  if (scriptMatches) {
    for (const match of scriptMatches) {
      // Check if it's readable (not binary)
      if (!/[\x00-\x08\x0E-\x1F]/.test(match)) {
        sections.push(match);
      }
    }
  }

  // Look for div/article sections that might be readable
  // Match opening and closing tags properly
  const htmlPattern = /<(?:div|article|section)[^>]*>([\s\S]{100,2000})<\/(?:div|article|section)>/gi;
  const htmlMatches = html.match(htmlPattern);
  
  if (htmlMatches) {
    for (const match of htmlMatches) {
      if (!/[\x00-\x08\x0E-\x1F]/.test(match)) {
        sections.push(match);
      }
    }
  }

  return sections;
}

/**
 * Extract price from multiple readable sections
 */
function extractPriceFromProductSections(
  sections: string[],
  storeName: string,
  productName: string,
  barcode: string,
  countryCode: string
): PriceEntry | null {
  // Try to find product in each section
  for (const section of sections) {
    const productSection = findProductInSearchResults(section, productName, barcode, storeName);
    if (productSection) {
      const price = extractPriceFromProductSection(productSection, storeName, countryCode);
      if (price) {
        let currency = 'USD';
        if (countryCode === 'NZ') currency = 'NZD';
        else if (countryCode === 'GB') currency = 'GBP';
        else if (countryCode === 'AU') currency = 'AUD';
        else if (countryCode === 'CA') currency = 'CAD';

        return {
          price: price.price,
          currency,
          retailer: storeName,
          location: '',
          timestamp: Date.now(),
          source: 'api',
          verified: true,
        };
      }
    }
  }

  return null;
}

/**
 * Build store search URL
 */
function buildStoreSearchUrl(
  store: StoreLocation,
  barcode: string,
  productName: string,
  countryCode?: string
): string | null {
  const storeName = store.chain || store.name || '';
  try {
    const chain = matchStoreToChain(storeName, countryCode);
    if (chain) {
      const url = buildChainSearchUrl(chain, barcode, productName);
      if (url) {
        return url;
      }
    }
  } catch (error) {
    console.log(`[ProductSpecific] Chain matching failed`);
  }
  return null;
}

/**
 * Try alternative URL strategies for finding products
 */
async function tryAlternativeUrls(
  store: StoreLocation,
  barcode: string,
  productName: string,
  countryCode: string
): Promise<{ html: string | null; url: string; strategy: string }> {
  const strategies: Array<{ url: string; strategy: string }> = [];
  
  // Strategy 1: Standard search URL
  const searchUrl = buildStoreSearchUrl(store, barcode, productName, countryCode);
  if (searchUrl) {
    strategies.push({ url: searchUrl, strategy: 'search' });
  }
  
  // Strategy 2: Try barcode directly in URL (PRIORITY - product detail pages are more reliable)
  // Try these FIRST before search URLs
  // Product detail pages are more reliable than search results
  const storeNameLower = store.name.toLowerCase();
  
  // New Zealand Stores - Product Detail Page URLs
  if (countryCode === 'NZ') {
    if (storeNameLower.includes('woolworths')) {
      // Try multiple URL patterns for Woolworths NZ
      strategies.unshift({ url: `https://www.woolworths.co.nz/shop/product/${barcode}`, strategy: 'barcode-direct-woolworths-nz' });
      strategies.unshift({ url: `https://www.woolworths.co.nz/shop/productdetails/${barcode}`, strategy: 'barcode-direct-woolworths-nz-alt' });
    }
    if (storeNameLower.includes('countdown')) {
      strategies.unshift({ url: `https://www.countdown.co.nz/shop/productdetails/${barcode}`, strategy: 'barcode-direct-countdown' });
      strategies.unshift({ url: `https://www.countdown.co.nz/shop/product/${barcode}`, strategy: 'barcode-direct-countdown-alt' });
    }
    if (storeNameLower.includes('new world')) {
      strategies.unshift({ url: `https://www.newworld.co.nz/shop/product/${barcode}`, strategy: 'barcode-direct-newworld' });
      strategies.unshift({ url: `https://www.newworld.co.nz/shop/productdetails/${barcode}`, strategy: 'barcode-direct-newworld-alt' });
    }
    if (storeNameLower.includes('pak') || storeNameLower.includes('pack n save')) {
      strategies.unshift({ url: `https://www.paknsave.co.nz/shop/product/${barcode}`, strategy: 'barcode-direct-paknsave' });
      strategies.unshift({ url: `https://www.paknsave.co.nz/shop/productdetails/${barcode}`, strategy: 'barcode-direct-paknsave-alt' });
    }
    if (storeNameLower.includes('fresh choice')) {
      strategies.unshift({ url: `https://www.freshchoice.co.nz/shop/product/${barcode}`, strategy: 'barcode-direct-freshchoice' });
      strategies.unshift({ url: `https://www.freshchoice.co.nz/shop/productdetails/${barcode}`, strategy: 'barcode-direct-freshchoice-alt' });
    }
  }
  
  // Australia Stores - Product Detail Page URLs
  if (countryCode === 'AU') {
    if (storeNameLower.includes('woolworths')) {
      strategies.unshift({ url: `https://www.woolworths.com.au/shop/productdetails/${barcode}`, strategy: 'barcode-direct-woolworths-au' });
      strategies.unshift({ url: `https://www.woolworths.com.au/shop/product/${barcode}`, strategy: 'barcode-direct-woolworths-au-alt' });
    }
    if (storeNameLower.includes('coles')) {
      strategies.unshift({ url: `https://www.coles.com.au/product/${barcode}`, strategy: 'barcode-direct-coles' });
      strategies.unshift({ url: `https://www.coles.com.au/productdetails/${barcode}`, strategy: 'barcode-direct-coles-alt' });
    }
    if (storeNameLower.includes('iga')) {
      strategies.unshift({ url: `https://www.iga.com.au/product/${barcode}`, strategy: 'barcode-direct-iga' });
      strategies.unshift({ url: `https://www.iga.com.au/productdetails/${barcode}`, strategy: 'barcode-direct-iga-alt' });
    }
  }
  
  // Strategy 3: Try simplified product name (remove common words)
  const simplifiedName = productName
    .replace(/\b(small|large|medium|original|chunk|pickle|520g|500g)\b/gi, '')
    .trim();
  if (simplifiedName && simplifiedName !== productName) {
    const simplifiedUrl = buildStoreSearchUrl(store, barcode, simplifiedName, countryCode);
    if (simplifiedUrl && simplifiedUrl !== searchUrl) {
      strategies.push({ url: simplifiedUrl, strategy: 'simplified-search' });
    }
  }
  
  // Try each strategy
  for (const { url, strategy } of strategies) {
    try {
      console.log(`[ProductSpecific] Trying ${strategy} strategy: ${url.substring(0, 80)}...`);
      const html = await fetchWithCorsProxy(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'identity',
          'Cache-Control': 'no-cache',
        },
      });
      
      if (html && html.length > 1000) {
        // Check if HTML is readable (not compressed/binary)
        const isReadable = /<html|<body|<div|<script|<title/i.test(html.substring(0, 1000));
        if (!isReadable) {
          console.warn(`[ProductSpecific] ${strategy} returned binary/compressed HTML - skipping`);
          continue;
        }
        
        // Check if this looks like a product page (not 404 or error)
        const htmlLower = html.toLowerCase();
        const isErrorPage = htmlLower.includes('404') || htmlLower.includes('not found') || 
                           htmlLower.includes('error') || htmlLower.includes('page not found');
        const hasProductContent = htmlLower.includes('product') || htmlLower.includes('price') || 
                                 htmlLower.includes(barcode) || htmlLower.includes(productName.toLowerCase().split(' ')[0]);
        
        if (!isErrorPage && hasProductContent) {
          console.log(`[ProductSpecific] ✅ ${strategy} strategy succeeded (${html.length} chars, readable HTML)`);
          return { html, url, strategy };
        } else if (isErrorPage) {
          console.log(`[ProductSpecific] ${strategy} returned error page (404/not found)`);
        } else {
          console.log(`[ProductSpecific] ${strategy} HTML doesn't contain product content`);
        }
      }
    } catch (error) {
      console.log(`[ProductSpecific] ${strategy} strategy failed:`, error);
    }
  }
  
  // Fallback to first strategy if available
  if (searchUrl) {
    try {
      const html = await fetchWithCorsProxy(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'identity',
          'Cache-Control': 'no-cache',
        },
      });
      return { html, url: searchUrl, strategy: 'search-fallback' };
    } catch (error) {
      console.log(`[ProductSpecific] Fallback fetch failed:`, error);
    }
  }
  
  return { html: null, url: '', strategy: 'none' };
}

