// Open Food Facts pricing data extraction
// Open Food Facts sometimes includes pricing from various stores
import { PriceEntry } from '../../types/pricing';
import { fetchProductFromOFF } from '../openFoodFacts';

/**
 * Extract pricing data from Open Food Facts product data
 * OFF sometimes includes prices from various stores in the product data
 */
export async function fetchOpenFoodFactsPrices(barcode: string): Promise<PriceEntry[]> {
  const prices: PriceEntry[] = [];

  try {
    // Fetch product data from Open Food Facts
    const product = await fetchProductFromOFF(barcode);

    if (!product) {
      return prices;
    }

    // Open Food Facts primarily focuses on nutrition and ingredients,
    // not pricing. Pricing data is limited and user-submitted.
    // Note: OFF doesn't have a stores or pricing field in the Product type
    // This is why we use it as a secondary source for pricing.

    // Note: Open Food Facts primarily focuses on nutrition and ingredients,
    // not pricing. Pricing data is limited and user-submitted.
    // This is why we use it as a secondary source.

    console.log(`[OpenFoodFacts] Pricing data limited (product found: ${!!product})`);
    return prices;
  } catch (error) {
    console.error('[OpenFoodFacts] Error fetching pricing:', error);
    return prices;
  }
}

