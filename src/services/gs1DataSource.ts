// GS1 Data Source API client
// Official GS1 barcode registry (Global Trade Item Number)
// Uses FREE GS1 Digital Link service (no API key required)
import { Product } from '../types/product';
import { fetchWithRateLimit } from '../utils/timeoutHelper';
import { logger } from '../utils/logger';

const USER_AGENT = 'TrueScan-FoodScanner/1.0.0';

// Note: Using free GS1 Digital Link service (no API key required)
// GS1 Digital Link is a free, public service that provides product information
// Not all products have GS1 Digital Links, but it's free to use

/**
 * GS1 lookup using free GS1 Digital Link service
 * No API key required - uses public GS1 Digital Link service
 * Official barcode verification and basic product information
 */
export async function fetchProductFromGS1(barcode: string): Promise<Product | null> {
  // Use free GS1 Digital Link service (no API key required)
  try {
    const digitalLinkProduct = await fetchProductFromGS1DigitalLink(barcode);
    if (digitalLinkProduct) {
      return digitalLinkProduct;
    }
  } catch (error) {
    logger.debug('GS1 Digital Link failed:', error);
  }
  
  return null;
}

/**
 * Fetch from GS1 Digital Link (free, no API key required)
 * GS1 Digital Link is a free service that provides product information via QR codes/URLs
 * Note: Not all products have GS1 Digital Links
 */
async function fetchProductFromGS1DigitalLink(barcode: string): Promise<Product | null> {
  try {
    // GS1 Digital Link format: https://id.gs1.org/01/{gtin}
    // This is a free, public service
    const digitalLinkUrl = `https://id.gs1.org/01/${barcode}`;
    
    // Try to resolve the Digital Link
    // Note: This may redirect to manufacturer's product page or return JSON-LD
    const response = await fetchWithRateLimit(digitalLinkUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json, application/ld+json, text/html',
      },
      redirect: 'follow',
    }, 'gs1_digital_link');
    
    if (!response.ok) {
      return null;
    }
    
    const contentType = response.headers.get('content-type') || '';
    
    // If JSON-LD, parse structured data
    if (contentType.includes('application/json') || contentType.includes('application/ld+json')) {
      const data = await response.json();
      
      // Extract product information from JSON-LD
      if (data.name || data.productName) {
        const product: Product = {
          barcode,
          product_name: data.name || data.productName || `Product ${barcode}`,
          brands: data.brand?.name || data.manufacturer?.name || undefined,
          image_url: data.image || data.imageUrl || undefined,
          source: 'gs1_digital_link',
          quality: 85, // Digital Link data is official but may be incomplete
          completion: 60,
        };
        
        return product;
      }
    }
    
    // If HTML, try to extract product info from page
    if (contentType.includes('text/html')) {
      const html = await response.text();
      
      // Try to extract JSON-LD from HTML
      const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
      if (jsonLdMatch) {
        try {
          const jsonLd = JSON.parse(jsonLdMatch[1]);
          if (jsonLd.name || jsonLd.productName) {
            const product: Product = {
              barcode,
              product_name: jsonLd.name || jsonLd.productName || `Product ${barcode}`,
              brands: jsonLd.brand?.name || jsonLd.manufacturer?.name || undefined,
              image_url: jsonLd.image || jsonLd.imageUrl || undefined,
              source: 'gs1_digital_link',
              quality: 85,
              completion: 60,
            };
            
            return product;
          }
        } catch (e) {
          // JSON-LD parse failed - continue
        }
      }
    }
    
    return null;
  } catch (error) {
    logger.debug(`Error fetching from GS1 Digital Link`, error);
    return null;
  }
}

/**
 * Search GS1 Data Source by product name (if search endpoint available)
 * Note: GS1 primarily provides barcode lookup, not search
 */
export async function searchGS1DataSource(query: string, limit = 20): Promise<Product[]> {
  // GS1 API doesn't have a public search endpoint
  // This is primarily for barcode verification
  // Return empty array as GS1 is lookup-only
  return [];
}

