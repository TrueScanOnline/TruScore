/**
 * FoodAtlas Query API - Query FoodAtlas database by product name
 * Server-side API endpoint for FoodAtlas nutrition data
 * 
 * Endpoint: /api/foodatlas-query?productName=Apple
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as fs from 'fs';
import * as path from 'path';

// Cache loaded database in memory
let foodAtlasCache: any[] | null = null;

/**
 * Load FoodAtlas database from JSON file
 */
function loadFoodAtlasDatabase(): any[] {
  if (foodAtlasCache) {
    return foodAtlasCache;
  }

  try {
    // Try multiple possible paths (Vercel deployment paths)
    const possiblePaths = [
      path.join(__dirname, '..', 'data', 'foodatlas.json'), // Relative to API function (most likely)
      path.join(process.cwd(), 'data', 'foodatlas.json'), // Vercel working directory
      '/var/task/data/foodatlas.json', // Vercel serverless function path (standard)
      path.join(process.cwd(), 'backend', 'vercel', 'data', 'foodatlas.json'),
      path.join(__dirname, '../../data/foodatlas.json'), // Alternative relative
    ];

    let jsonData: string | null = null;
    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        jsonData = fs.readFileSync(filePath, 'utf8');
        console.log(`[FoodAtlas] Loaded database from: ${filePath}`);
        break;
      }
    }

    if (!jsonData) {
      console.warn('[FoodAtlas] Database file not found in any expected location');
      return [];
    }

    const database = JSON.parse(jsonData);
    foodAtlasCache = database;
    console.log(`[FoodAtlas] Loaded ${database.length} foods from database`);
    return database;
  } catch (error) {
    console.error('[FoodAtlas] Error loading database:', error);
    return [];
  }
}

/**
 * Find matching food in FoodAtlas by name
 * Uses fuzzy matching similar to FSANZ
 */
function findMatchingFood(productName: string): any | null {
  const database = loadFoodAtlasDatabase();
  if (!database || database.length === 0) {
    return null;
  }

  if (!productName || productName.trim().length === 0) {
    return null;
  }

  const searchName = productName.toLowerCase().trim();
  
  // Extract keywords (similar to FSANZ matching)
  const keywords = searchName
    .split(/\s+/)
    .filter(word => word.length > 2)
    .slice(0, 5);

  if (keywords.length === 0) {
    return null;
  }

  let bestMatch: any | null = null;
  let bestScore = 0;

  // Search for matches
  for (const food of database) {
    const foodName = (food.name || '').toLowerCase();
    
    // Calculate match score
    let score = 0;
    let matchedKeywords = 0;

    keywords.forEach(keyword => {
      if (foodName.includes(keyword)) {
        score += keyword.length * 10; // Longer keywords worth more
        matchedKeywords++;
      }
    });

    // Require at least 50% of keywords to match
    if (matchedKeywords < Math.ceil(keywords.length * 0.5)) {
      continue;
    }

    // Bonus for exact name match
    if (foodName === searchName) {
      score += 1000;
    } else if (foodName.startsWith(searchName) || searchName.startsWith(foodName)) {
      score += 500;
    }

    // Bonus for more nutrients
    score += (food.nutrient_count || 0) * 2;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = food;
    }
  }

  // Minimum score threshold
  if (bestScore < 50) {
    return null;
  }

  return bestMatch;
}

/**
 * API Handler
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { productName } = req.query;

    if (!productName || typeof productName !== 'string') {
      return res.status(400).json({ error: 'productName parameter is required' });
    }

    console.log(`[FoodAtlas] Querying for: "${productName}"`);

    const matchingFood = findMatchingFood(productName);

    if (!matchingFood) {
      return res.status(200).json({ found: false });
    }

    // Return product in standard format
    const product = {
      found: true,
      name: matchingFood.name,
      nutriments: matchingFood.nutriments || {},
      nutrient_count: matchingFood.nutrient_count || 0,
      source: 'foodatlas',
    };

    console.log(`[FoodAtlas] Found match: "${matchingFood.name}" (${matchingFood.nutrient_count} nutrients)`);

    return res.status(200).json(product);
  } catch (error) {
    console.error('[FoodAtlas] API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}

