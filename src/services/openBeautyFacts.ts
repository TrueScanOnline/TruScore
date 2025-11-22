// Open Beauty Facts API client
// Similar structure to Open Food Facts but for cosmetics and personal care products
import { Product, PalmOilAnalysis, PackagingData, PackagingItem, AgribalyseData } from '../types/product';

const OBF_API_BASE = 'https://world.openbeautyfacts.org/api/v2/product';
const USER_AGENT = 'TrueScan-FoodScanner/1.0.0';

export interface OBFResponse {
  status: number;
  status_verbose: string;
  product?: Product;
  code?: string;
}

/**
 * Fetch product data from Open Beauty Facts API
 * Used for cosmetics, personal care, and beauty products
 */
export async function fetchProductFromOBF(barcode: string): Promise<Product | null> {
  try {
    const url = `${OBF_API_BASE}/${barcode}.json`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
      },
    });

    if (!response.ok) {
      // 404 is expected when product not in beauty database - use debug level
      if (response.status === 404) {
        console.log(`[OBF] Product not found in beauty database (expected)`);
      } else {
        console.warn(`OBF API error: ${response.status} ${response.statusText}`);
      }
      return null;
    }

    const data: OBFResponse = await response.json();

    if (data.status === 0 || !data.product) {
      console.warn(`Product not found in OBF: ${barcode}`);
      return null;
    }

    // Add source and barcode
    const product: Product = {
      ...data.product,
      barcode,
      source: 'openbeautyfacts',
    };

    // Enhance product with extracted sustainability data (similar to OFF)
    enhanceProductWithSustainabilityData(product);

    return product;
  } catch (error) {
    console.error('Error fetching from Open Beauty Facts:', error);
    return null;
  }
}

/**
 * Enhance product with extracted sustainability data from OBF
 * Similar to OFF but cosmetics may have different data structure
 */
function enhanceProductWithSustainabilityData(product: Product): void {
  // Extract palm oil analysis (if available)
  if (product.ingredients_analysis_tags || product.ingredients_analysis) {
    product.palm_oil_analysis = extractPalmOilAnalysis(product);
  }

  // Extract packaging data
  if (product.packagings || product.packaging_tags) {
    product.packaging_data = extractPackagingData(product);
  }

  // Note: OBF doesn't have Eco-Score (that's food-specific)
  // But we can still extract other sustainability data
}

/**
 * Extract palm oil analysis from ingredients_analysis_tags
 * (Reuse from openFoodFacts.ts logic)
 */
function extractPalmOilAnalysis(product: Product): PalmOilAnalysis {
  const tags = product.ingredients_analysis_tags || [];
  const analysis = product.ingredients_analysis || {};

  const containsPalmOil = 
    tags.includes('en:palm-oil') || 
    analysis['en:palm-oil'] === 'yes' ||
    analysis['en:palm-oil'] === 'maybe';

  const isPalmOilFree = 
    tags.includes('en:palm-oil-free') || 
    analysis['en:palm-oil'] === 'no';

  const isNonSustainable = 
    tags.includes('en:non-sustainable-palm-oil');

  let score = 0;
  if (isNonSustainable) {
    score = -10;
  } else if (containsPalmOil && !isPalmOilFree) {
    score = -5;
  } else if (isPalmOilFree) {
    score = 10;
  }

  return {
    containsPalmOil,
    isPalmOilFree,
    isNonSustainable,
    score,
  };
}

/**
 * Extract packaging sustainability data
 * (Reuse from openFoodFacts.ts logic)
 */
function extractPackagingData(product: Product): PackagingData {
  const packagings = (product.packagings || []) as PackagingItem[];
  const tags = product.packaging_tags || [];

  const isRecyclable = tags.some(tag => 
    tag.includes('recyclable') && !tag.includes('non-recyclable')
  );
  const isReusable = tags.some(tag => tag.includes('reusable'));
  const isBiodegradable = tags.some(tag => tag.includes('biodegradable'));

  let recyclabilityScore = 0;
  
  if (isRecyclable) {
    recyclabilityScore += 50;
  }
  if (isReusable) {
    recyclabilityScore += 30;
  }
  if (isBiodegradable) {
    recyclabilityScore += 20;
  }

  const hasPlastic = packagings.some(p => p.material?.includes('plastic'));
  const hasCardboard = packagings.some(p => p.material?.includes('cardboard') || p.material?.includes('paper'));
  const hasGlass = packagings.some(p => p.material?.includes('glass'));
  const hasMetal = packagings.some(p => p.material?.includes('metal'));

  if (hasCardboard || hasGlass || hasMetal) {
    recyclabilityScore += 10;
  }
  if (hasPlastic && !isRecyclable) {
    recyclabilityScore = Math.max(0, recyclabilityScore - 20);
  }

  return {
    items: packagings,
    isRecyclable,
    isReusable,
    isBiodegradable,
    recyclabilityScore: Math.min(100, recyclabilityScore),
  };
}

