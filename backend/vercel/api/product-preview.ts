// Product preview API for redirect page
// Fetches product data to display on the redirect page

import { VercelRequest, VercelResponse } from '@vercel/node';

interface ProductPreview {
  barcode: string;
  product_name?: string;
  product_name_en?: string;
  brands?: string;
  image_url?: string;
  trust_score?: number | null;
  trust_score_breakdown?: {
    body: number;
    planet: number;
    ethics: number;
    open: number;
  };
  nutriments?: any;
  ingredients_text?: string;
  nova_group?: number;
  ecoscore_grade?: string;
  categories?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { barcode } = req.query;

  if (!barcode || typeof barcode !== 'string') {
    return res.status(400).json({ error: 'Invalid barcode' });
  }

  try {
    // Try Open Food Facts first (most comprehensive)
    const offUrl = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`;
    const offResponse = await fetch(offUrl, {
      headers: {
        'User-Agent': 'TrueScan-FoodScanner/1.0.0',
      },
    });

    if (offResponse.ok) {
      const offData = await offResponse.json();
      if (offData.status === 1 && offData.product) {
        const product = offData.product;
        
        // Calculate TruScore if not present
        let trustScore = product.trust_score;
        let trustScoreBreakdown = product.trust_score_breakdown;
        
        if (!trustScore && product.nutriments) {
          // Simple TruScore calculation for preview
          const body = calculateBodyScore(product);
          const planet = calculatePlanetScore(product);
          const ethics = calculateEthicsScore(product);
          const open = calculateOpenScore(product);
          
          trustScore = Math.round(body + planet + ethics + open);
          trustScoreBreakdown = { body, planet, ethics, open };
        }

        const preview: ProductPreview = {
          barcode,
          product_name: product.product_name || product.product_name_en,
          product_name_en: product.product_name_en,
          brands: product.brands,
          image_url: product.image_url || product.image_front_url || product.image_front_small_url,
          trust_score: trustScore,
          trust_score_breakdown: trustScoreBreakdown,
          nutriments: product.nutriments,
          ingredients_text: product.ingredients_text,
          nova_group: product.nova_group,
          ecoscore_grade: product.ecoscore_grade,
          categories: product.categories,
        };

        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.status(200).json(preview);
      }
    }

    // Fallback: Try UPCitemdb
    const upcUrl = `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`;
    const upcResponse = await fetch(upcUrl);

    if (upcResponse.ok) {
      const upcData = await upcResponse.json();
      if (upcData.items && upcData.items.length > 0) {
        const item = upcData.items[0];
        const preview: ProductPreview = {
          barcode,
          product_name: item.title,
          brands: item.brand,
          image_url: item.images && item.images.length > 0 ? item.images[0] : undefined,
          trust_score: null,
        };

        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.status(200).json(preview);
      }
    }

    // No product found
    return res.status(404).json({ error: 'Product not found' });
  } catch (error) {
    console.error('Error fetching product preview:', error);
    return res.status(500).json({ error: 'Failed to fetch product data' });
  }
}

// Simplified TruScore calculation for preview
function calculateBodyScore(product: any): number {
  if (!product.nutriments) return 0;
  
  let score = 12.5; // Base score
  
  // Check for high negative nutrients
  const sugars = product.nutriments['sugars_100g'] || 0;
  const salt = product.nutriments['salt_100g'] || 0;
  const saturatedFat = product.nutriments['saturated-fat_100g'] || 0;
  
  if (sugars > 22.5) score -= 3;
  if (salt > 1.5) score -= 3;
  if (saturatedFat > 5) score -= 3;
  
  // Check for positive nutrients
  const fiber = product.nutriments['fiber_100g'] || 0;
  const protein = product.nutriments['proteins_100g'] || 0;
  
  if (fiber > 3) score += 2;
  if (protein > 10) score += 2;
  
  return Math.max(0, Math.min(25, score));
}

function calculatePlanetScore(product: any): number {
  let score = 12.5; // Base score
  
  if (product.ecoscore_grade) {
    const grade = product.ecoscore_grade.toLowerCase();
    if (grade === 'a') score = 25;
    else if (grade === 'b') score = 20;
    else if (grade === 'c') score = 15;
    else if (grade === 'd') score = 10;
    else if (grade === 'e') score = 5;
  }
  
  return Math.max(0, Math.min(25, score));
}

function calculateEthicsScore(product: any): number {
  let score = 12.5; // Base score
  
  // Check for palm oil
  if (product.ingredients_text) {
    const hasPalmOil = /palm/i.test(product.ingredients_text);
    if (hasPalmOil) score -= 5;
  }
  
  // Check NOVA group
  if (product.nova_group === 4) score -= 5; // Ultra-processed
  
  return Math.max(0, Math.min(25, score));
}

function calculateOpenScore(product: any): number {
  let score = 0;
  
  // Data completeness
  if (product.product_name) score += 5;
  if (product.ingredients_text) score += 5;
  if (product.nutriments && Object.keys(product.nutriments).length > 0) score += 5;
  if (product.image_url) score += 5;
  if (product.brands) score += 5;
  
  return Math.max(0, Math.min(25, score));
}
