// Open GTIN Database API Integration
// Free, open-source barcode database - no API key required
// https://opengtindb.org/

import { Product } from '../types/product';
import { logger } from '../utils/logger';
import { createTimeoutSignal } from '../utils/timeoutHelper';

const OPEN_GTIN_API = 'https://opengtindb.org/index.php';

/**
 * Fetch product data from Open GTIN Database
 * Free, no API key required
 */
export async function fetchProductFromOpenGTIN(barcode: string): Promise<Product | null> {
  try {
    // Open GTIN DB uses a simple GET request with the barcode
    const url = `${OPEN_GTIN_API}?cmd=ean&ean=${barcode}&cmd=ean&ean=${barcode}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TrueScan-FoodScanner/1.0.0',
        'Accept': 'text/html, application/xhtml+xml, application/xml;q=0.9, */*;q=0.8',
      },
      signal: createTimeoutSignal(10000), // 10 second timeout
    });

    if (!response.ok) {
      logger.debug(`Open GTIN API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const html = await response.text();
    
    // Parse HTML response (Open GTIN returns HTML, not JSON)
    // Look for product name in the HTML
    const nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i) || 
                     html.match(/<title[^>]*>([^<]+)<\/title>/i) ||
                     html.match(/Product[:\s]+([^<\n]+)/i);
    
    if (!nameMatch || !nameMatch[1] || nameMatch[1].includes('not found') || nameMatch[1].includes('404')) {
      logger.debug(`Product not found in Open GTIN: ${barcode}`);
      return null;
    }

    const productName = nameMatch[1].trim();
    
    // Try to extract additional info from HTML
    const brandMatch = html.match(/Brand[:\s]+([^<\n]+)/i);
    const categoryMatch = html.match(/Category[:\s]+([^<\n]+)/i);
    const descriptionMatch = html.match(/Description[:\s]+([^<\n]+)/i);

    // Convert to our Product format
    // Note: Open GTIN often returns minimal data (just name), so we mark quality/completion as low
    // This helps the UI determine if the product has sufficient data to display
    const hasMinimalData = !brandMatch && !descriptionMatch && !categoryMatch;
    const convertedProduct: Product = {
      barcode,
      product_name: productName,
      brands: brandMatch ? brandMatch[1].trim() : undefined,
      generic_name: descriptionMatch ? descriptionMatch[1].trim() : undefined,
      categories_tags: categoryMatch ? [categoryMatch[1].trim()] : undefined,
      source: 'open_gtin',
      // Mark as low quality if we only have a name (no brand, description, category, nutrition, image)
      quality: hasMinimalData ? 40 : undefined,
      completion: hasMinimalData ? 40 : undefined,
    };

    logger.debug(`Found product in Open GTIN: ${barcode}`);
    return convertedProduct;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!errorMessage.includes('aborted') && !errorMessage.includes('timeout')) {
      logger.error(`Error fetching from Open GTIN for ${barcode}:`, errorMessage);
    } else {
      logger.debug(`Open GTIN timeout for ${barcode}`);
    }
    return null;
  }
}

