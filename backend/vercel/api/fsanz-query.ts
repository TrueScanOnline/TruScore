/**
 * FSANZ Query API - Query FSANZ databases by product name
 * This is the PRIMARY way to access full FSANZ databases
 * 
 * Endpoint: /api/fsanz-query?country=nz&productName=Baked%20Beans
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as fs from 'fs';
import * as path from 'path';

// Cache loaded databases in memory
let nzfcdCache: any[] | null = null;
let afcdCache: any[] | null = null;

/**
 * Load NZFCD database from JSON file
 */
function loadNZFCDDatabase(): any[] {
  if (nzfcdCache) {
    return nzfcdCache;
  }

  try {
    const jsonPath = path.join(process.cwd(), 'data', 'nzfcd.json');
    
    // Try alternative paths (Vercel deployment paths)
    // In Vercel, files in data/ directory are accessible relative to the function
    // Vercel deploys files from the project root, so data/ should be at root level
    const possiblePaths = [
      path.join(__dirname, '..', 'data', 'nzfcd.json'), // Relative to API function (most likely)
      path.join(process.cwd(), 'data', 'nzfcd.json'), // Vercel working directory
      '/var/task/data/nzfcd.json', // Vercel serverless function path (standard)
      '/var/task/api/../data/nzfcd.json', // Alternative relative path
      path.join(process.cwd(), 'backend', 'vercel', 'data', 'nzfcd.json'),
      path.join(__dirname, '../../data/nzfcd.json'), // Alternative relative
      path.join(__dirname, '..', 'data', 'fsanz-nz.json'), // Alternative filename
      path.join(process.cwd(), 'data', 'fsanz-nz.json'), // Alternative filename
      '/var/task/data/fsanz-nz.json', // Alternative filename
      jsonPath,
    ];

    let jsonData: string | null = null;
    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        jsonData = fs.readFileSync(filePath, 'utf8');
        break;
      }
    }

    if (!jsonData) {
      console.error('NZFCD JSON file not found in any expected location');
      console.error('Tried paths:', possiblePaths);
      console.error('Current working directory:', process.cwd());
      console.error('__dirname:', __dirname);
      return [];
    }

    console.log(`[NZFCD] Parsing JSON data (${(jsonData.length / 1024 / 1024).toFixed(2)} MB)...`);
    const startTime = Date.now();
    const data = JSON.parse(jsonData);
    const parseTime = Date.now() - startTime;
    console.log(`[NZFCD] JSON parsed in ${parseTime}ms, ${data.length} entries`);
    
    if (!Array.isArray(data)) {
      console.error('[NZFCD] Data is not an array! Type:', typeof data);
      return [];
    }
    
    if (data.length === 0) {
      console.error('[NZFCD] Data array is empty!');
      return [];
    }
    
    nzfcdCache = data;
    console.log(`✅ Loaded ${data.length} NZFCD foods into cache`);
    return data;
  } catch (error) {
    console.error('[NZFCD] Error loading NZFCD database:', error);
    if (error instanceof Error) {
      console.error('[NZFCD] Error message:', error.message);
      console.error('[NZFCD] Error stack:', error.stack);
    }
    return [];
  }
}

/**
 * Load AFCD database from JSON file
 */
function loadAFCDDatabase(): any[] {
  if (afcdCache) {
    return afcdCache;
  }

  try {
    const jsonPath = path.join(process.cwd(), 'data', 'afcd.json');
    
    // Try alternative paths (Vercel deployment paths)
    // In Vercel, files in data/ directory are accessible relative to the function
    // Vercel deploys files from the project root, so data/ should be at root level
    const possiblePaths = [
      path.join(__dirname, '..', 'data', 'afcd.json'), // Relative to API function (most likely)
      path.join(process.cwd(), 'data', 'afcd.json'), // Vercel working directory
      '/var/task/data/afcd.json', // Vercel serverless function path (standard)
      '/var/task/api/../data/afcd.json', // Alternative relative path
      path.join(process.cwd(), 'backend', 'vercel', 'data', 'afcd.json'),
      path.join(__dirname, '../../data/afcd.json'), // Alternative relative
      path.join(__dirname, '..', 'data', 'fsanz-au.json'), // Alternative filename
      path.join(process.cwd(), 'data', 'fsanz-au.json'), // Alternative filename
      '/var/task/data/fsanz-au.json', // Alternative filename
      jsonPath,
    ];

    let jsonData: string | null = null;
    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        jsonData = fs.readFileSync(filePath, 'utf8');
        break;
      }
    }

    if (!jsonData) {
      console.error('AFCD JSON file not found in any expected location');
      console.error('Tried paths:', possiblePaths);
      console.error('Current working directory:', process.cwd());
      console.error('__dirname:', __dirname);
      return [];
    }

    console.log(`[AFCD] Parsing JSON data (${(jsonData.length / 1024 / 1024).toFixed(2)} MB)...`);
    const startTime = Date.now();
    const data = JSON.parse(jsonData);
    const parseTime = Date.now() - startTime;
    console.log(`[AFCD] JSON parsed in ${parseTime}ms, ${data.length} entries`);
    
    if (!Array.isArray(data)) {
      console.error('[AFCD] Data is not an array! Type:', typeof data);
      return [];
    }
    
    if (data.length === 0) {
      console.error('[AFCD] Data array is empty!');
      return [];
    }
    
    afcdCache = data;
    console.log(`✅ Loaded ${data.length} AFCD foods into cache`);
    return data;
  } catch (error) {
    console.error('[AFCD] Error loading AFCD database:', error);
    if (error instanceof Error) {
      console.error('[AFCD] Error message:', error.message);
      console.error('[AFCD] Error stack:', error.stack);
    }
    return [];
  }
}

/**
 * Calculate match score for a food item
 * Higher score = better match
 */
function calculateMatchScore(
  searchName: string,
  keywords: string[],
  foodNameLower: string
): { score: number; matchType: string; matchedKeywords: string[] } {
  let score = 0;
  const matchedKeywords: string[] = [];
  let matchType = 'none';

  // Strategy 1: Exact match (highest priority)
  if (foodNameLower === searchName) {
    return { score: 1000, matchType: 'exact', matchedKeywords: keywords };
  }

  // Strategy 2: Starts with search name (very high priority)
  if (foodNameLower.startsWith(searchName)) {
    score = 800;
    matchType = 'starts_with';
    matchedKeywords.push(...keywords);
    return { score, matchType, matchedKeywords };
  }

  // Strategy 3: Search name contains food name (high priority for generic searches)
  if (searchName.includes(foodNameLower) && foodNameLower.length >= 3) {
    score = 700;
    matchType = 'search_contains_food';
    matchedKeywords.push(...keywords);
    return { score, matchType, matchedKeywords };
  }

  // Strategy 4: Food name contains search name (medium-high priority)
  if (foodNameLower.includes(searchName)) {
    // Check if it's at the start (better) or middle/end (worse)
    const position = foodNameLower.indexOf(searchName);
    if (position === 0) {
      score = 600;
      matchType = 'food_starts_with_search';
    } else {
      // Penalize if search term appears late in the name (likely a minor ingredient)
      const positionRatio = position / foodNameLower.length;
      score = Math.max(300, 500 - (positionRatio * 200));
      matchType = 'food_contains_search';
    }
    matchedKeywords.push(...keywords);
    return { score, matchType, matchedKeywords };
  }

  // Strategy 5: Word boundary matches (for multi-word searches)
  if (keywords.length > 1) {
    let wordBoundaryMatches = 0;
    let exactWordMatches = 0;
    
    for (const keyword of keywords) {
      // Exact word match (word boundary)
      const exactWordRegex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (exactWordRegex.test(foodNameLower)) {
        exactWordMatches++;
        matchedKeywords.push(keyword);
        score += keyword.length * 10; // Longer keywords = higher score
      } else if (foodNameLower.includes(keyword)) {
        wordBoundaryMatches++;
        matchedKeywords.push(keyword);
        score += keyword.length * 5; // Lower score for substring match
      }
    }

    if (exactWordMatches > 0) {
      // Bonus for matching multiple exact words
      score += exactWordMatches * 50;
      // Bonus for matching all keywords
      if (exactWordMatches === keywords.length) {
        score += 200;
      }
      matchType = `exact_words_${exactWordMatches}`;
    } else if (wordBoundaryMatches > 0) {
      score += wordBoundaryMatches * 20;
      matchType = `contains_words_${wordBoundaryMatches}`;
    }
  }

  // Strategy 6: Single keyword with word boundary (for simple searches like "Milk")
  if (keywords.length === 1) {
    const keyword = keywords[0];
    const exactWordRegex = new RegExp(`\\b${keyword}\\b`, 'i');
    
    // Also try plural/singular variations for better matching
    let keywordVariations = [keyword];
    if (keyword.endsWith('s') && keyword.length > 3) {
      keywordVariations.push(keyword.slice(0, -1)); // "apples" -> "apple"
    } else if (!keyword.endsWith('s') && keyword.length > 3) {
      keywordVariations.push(keyword + 's'); // "apple" -> "apples"
    }
    
    let bestVariationScore = 0;
    let bestVariationType = '';
    
    for (const variation of keywordVariations) {
      const variationRegex = new RegExp(`\\b${variation}\\b`, 'i');
      
      if (variationRegex.test(foodNameLower)) {
        // Check position - if keyword is at start, it's likely the main food
        const matchIndex = foodNameLower.search(variationRegex);
        let variationScore = 0;
        let variationType = '';
        
        if (matchIndex === 0) {
          variationScore = 500; // High score for "Milk" matching "Milk, whole"
          variationType = 'exact_word_at_start';
        } else if (matchIndex < 20) {
          variationScore = 400; // Good score for "Milk" matching "Whole milk, pasteurised"
          variationType = 'exact_word_early';
        } else {
          // Keyword appears late - likely a minor ingredient
          // Only accept if it's a very short food name (likely still relevant)
          if (foodNameLower.length < 50) {
            variationScore = 200; // Lower score for "Milk" matching "Beverage, chocolate flavour, with milk"
            variationType = 'exact_word_late';
          } else {
            variationScore = 50; // Very low score - likely false positive
            variationType = 'exact_word_very_late';
          }
        }
        
        if (variationScore > bestVariationScore) {
          bestVariationScore = variationScore;
          bestVariationType = variationType;
        }
      } else if (foodNameLower.includes(variation)) {
        // Contains but not word boundary - check if it's at the start
        const matchIndex = foodNameLower.indexOf(variation);
        let variationScore = 0;
        let variationType = '';
        
        if (matchIndex === 0) {
          variationScore = 300; // "Milk" matching "Milkshake"
          variationType = 'contains_at_start';
        } else if (matchIndex < 15) {
          variationScore = 150; // "Milk" matching "Whole milk product"
          variationType = 'contains_early';
        } else {
          // Very late in the name - likely false positive, but still consider it
          variationScore = 50;
          variationType = 'contains_late';
        }
        
        if (variationScore > bestVariationScore) {
          bestVariationScore = variationScore;
          bestVariationType = variationType;
        }
      }
    }
    
    if (bestVariationScore > 0) {
      score = bestVariationScore;
      matchType = bestVariationType;
      matchedKeywords.push(keyword);
    }
  }

  // Penalties for false positives
  if (keywords.length === 1) {
    const keyword = keywords[0];
    // Penalize matches where the keyword is clearly a minor ingredient
    // e.g., "Milk" shouldn't match "Beverage, chocolate flavour, from Nesquik powder, with regular fat cows milk"
    if (foodNameLower.includes('beverage') || foodNameLower.includes('drink') || foodNameLower.includes('flavour')) {
      // Check position of keyword or its variations
      let keywordPosition = foodNameLower.indexOf(keyword);
      if (keywordPosition === -1) {
        // Try variations
        if (keyword.endsWith('s')) {
          keywordPosition = foodNameLower.indexOf(keyword.slice(0, -1));
        } else {
          keywordPosition = foodNameLower.indexOf(keyword + 's');
        }
      }
      
      if (keywordPosition !== -1) {
        const foodLength = foodNameLower.length;
        // If keyword appears in last 30% of the name, it's likely a minor ingredient
        if (keywordPosition > foodLength * 0.7) {
          score = Math.max(0, score - 300); // Heavy penalty
          matchType += '_minor_ingredient_penalty';
        }
      }
    }
  }

  return { score, matchType, matchedKeywords };
}

/**
 * Fuzzy match product name to FSANZ food name
 * Improved algorithm with scoring and ranking for accurate results
 */
function findMatchingFood(productName: string, database: any[]): any | null {
  if (!productName || !database || database.length === 0) {
    console.log(`[MATCH] No product name or empty database`);
    return null;
  }

  const searchName = productName.toLowerCase().trim();
  console.log(`[MATCH] Searching for: "${searchName}" in database of ${database.length} foods`);
  
  // CRITICAL: Reject generic product names (e.g., "Product 9310645467740")
  // These are fallback names when no product is found and will never match correctly
  if (searchName.match(/^product\s+\d+$/i) || searchName.match(/^product\s+[a-z0-9]+$/i)) {
    console.log(`[MATCH] Rejecting generic product name: "${searchName}" - will not match correctly`);
    return null;
  }
  
  // Extract ALL words (don't filter too aggressively)
  const allWords = searchName.split(/\s+/).filter(word => word.length > 0);
  
  // Common words to ignore (but keep important food words)
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'in', 'on', 'with', 'for', 'of', 'from'];
  
  // Extract meaningful keywords (keep food-related words even if short)
  let keywords = allWords
    .filter(word => !commonWords.includes(word))
    .slice(0, 5); // Use up to 5 words for better matching

  // If no keywords after filtering, use the original search name
  if (keywords.length === 0) {
    keywords.push(searchName);
  }

  console.log(`[MATCH] Keywords extracted: ${keywords.join(', ')}`);

  // Collect all matches with scores
  const matches: Array<{ food: any; score: number; matchType: string; matchedKeywords: string[] }> = [];
  let checked = 0;

  // AGGRESSIVE field name detection - try ALL possible variations
  let nameField: string | null = null;
  let nameLowerField: string | null = null;
  
  if (database.length > 0) {
    const firstEntry = database[0];
    const allKeys = Object.keys(firstEntry);
    
    // Find ANY field that looks like it contains a food name
    // Check ALL keys, not just a predefined list
    for (const key of allKeys) {
      const keyLower = key.toLowerCase();
      const value = firstEntry[key];
      
      // If it's a string field and looks like a name field
      if (typeof value === 'string' && value.length > 0) {
        if (keyLower.includes('name') || 
            keyLower.includes('food') || 
            keyLower.includes('title') ||
            keyLower.includes('description') ||
            keyLower.includes('item')) {
          // Check if it's already lowercase
          if (keyLower.includes('lower') || value === value.toLowerCase()) {
            nameLowerField = key;
            console.log(`[MATCH] Found nameLower field: "${key}"`);
            break;
          } else {
            nameField = key;
            console.log(`[MATCH] Found name field: "${key}"`);
            // Don't break - keep looking for lowercase version
          }
        }
      }
    }
    
    // If still no field found, use the first string field that's not a number
    if (!nameField && !nameLowerField) {
      for (const key of allKeys) {
        const value = firstEntry[key];
        if (typeof value === 'string' && value.length > 3 && isNaN(Number(value))) {
          nameField = key;
          console.log(`[MATCH] Using first string field as name: "${key}"`);
          break;
        }
      }
    }
  }

  for (const food of database) {
    checked++;
    if (checked % 50000 === 0) {
      console.log(`[MATCH] Checked ${checked}/${database.length} entries...`);
    }
    
    // Get food name - use detected field or search ALL fields
    let foodNameLower: string = '';
    
    if (nameLowerField && food[nameLowerField]) {
      foodNameLower = String(food[nameLowerField]).toLowerCase();
    } else if (nameField && food[nameField]) {
      foodNameLower = String(food[nameField]).toLowerCase();
    } else {
      // AGGRESSIVE fallback: search ALL fields for a string that looks like a name
      const allKeys = Object.keys(food);
      for (const key of allKeys) {
        const value = food[key];
        if (typeof value === 'string' && value.length > 3) {
          const keyLower = key.toLowerCase();
          // If field name suggests it's a name field, use it
          if (keyLower.includes('name') || 
              keyLower.includes('food') || 
              keyLower.includes('title') ||
              keyLower.includes('description')) {
            foodNameLower = value.toLowerCase();
            break;
          }
        }
      }
      
      // If still nothing, use first non-numeric string field
      if (!foodNameLower) {
        for (const key of allKeys) {
          const value = food[key];
          if (typeof value === 'string' && value.length > 3 && isNaN(Number(value))) {
            foodNameLower = value.toLowerCase();
            break;
          }
        }
      }
    }
    
    if (!foodNameLower || foodNameLower.trim().length === 0) {
      continue; // Skip entries without names
    }
    
    // Calculate match score
    const matchResult = calculateMatchScore(searchName, keywords, foodNameLower);
    
    if (matchResult.score > 0) {
      matches.push({
        food,
        score: matchResult.score,
        matchType: matchResult.matchType,
        matchedKeywords: matchResult.matchedKeywords,
      });
    }
  }

  console.log(`[MATCH] Searched ${checked} entries, found ${matches.length} potential matches`);

  if (matches.length === 0) {
    console.log(`[MATCH] No matches found`);
    return null;
  }

  // Sort by score (highest first)
  matches.sort((a, b) => b.score - a.score);

  // Log top 5 matches for debugging
  const topMatches = matches.slice(0, 5);
  console.log(`[MATCH] Top matches:`);
  topMatches.forEach((match, idx) => {
    const foodName = match.food.foodName || 
                     match.food['Food Name'] || 
                     match.food['Food name'] || 
                     match.food.food_name || 
                     match.food.name || 
                     'Unknown';
    console.log(`  ${idx + 1}. "${foodName}" (score: ${match.score}, type: ${match.matchType})`);
  });

  // Apply minimum score threshold to filter out poor matches
  // This prevents false positives like "Milk" matching "Beverage...with milk" or "Apple" matching "Cider, apple"
  // CRITICAL: For multi-word searches, require that at least 50% of keywords match
  // This prevents "Hommus Classic" from matching "Biscuit, dark chocolate, Classic Dark" (only 1/2 keywords match)
  let MIN_SCORE_THRESHOLD = 100; // Minimum score for a valid match
  
  // For multi-word searches (2+ keywords), require that the FIRST keyword matches
  // This prevents false positives like "Hommus Classic" matching "Biscuit, Classic Dark"
  // The first keyword is usually the main product name and must be present
  if (keywords.length >= 2) {
    const firstKeyword = keywords[0]; // Main product name (e.g., "Hommus" in "Hommus Classic")
    
    // Filter matches to only include those where the FIRST keyword matches
    // This ensures we match the main product, not just a modifier word
    let filteredCount = 0;
    const filteredMatches = matches.filter(m => {
      const firstKeywordMatched = m.matchedKeywords.includes(firstKeyword);
      if (!firstKeywordMatched) {
        filteredCount++;
        // Only log in debug mode (reduce verbosity)
        if (process.env.DEBUG_MATCHING === 'true') {
          console.log(`[MATCH] Filtering out match: first keyword "${firstKeyword}" not matched (only matched: ${m.matchedKeywords.join(', ')})`);
        }
        return false;
      }
      
      // Also require at least 50% of all keywords to match
      const matchedCount = m.matchedKeywords.length;
      const requiredMatches = Math.ceil(keywords.length * 0.5);
      if (matchedCount < requiredMatches) {
        filteredCount++;
        // Only log in debug mode (reduce verbosity)
        if (process.env.DEBUG_MATCHING === 'true') {
          console.log(`[MATCH] Filtering out match: only ${matchedCount}/${keywords.length} keywords matched (need ${requiredMatches})`);
        }
        return false;
      }
      
      return true;
    });
    
    // Log summary instead of individual filters
    if (filteredCount > 0) {
      console.log(`[MATCH] Filtered out ${filteredCount} matches that didn't meet keyword requirements`);
    }
    
    if (filteredMatches.length > 0) {
      matches.splice(0, matches.length, ...filteredMatches);
      console.log(`[MATCH] After keyword requirement filter: ${matches.length} matches remain (first keyword "${firstKeyword}" required)`);
    } else {
      console.log(`[MATCH] No matches meet keyword requirement (first keyword "${firstKeyword}" must match)`);
      return null;
    }
    
    // Also increase threshold for multi-word searches to ensure quality
    MIN_SCORE_THRESHOLD = 150; // Higher threshold for multi-word searches
  }
  
  // For single-word searches, be more strict to avoid false positives
  // e.g., "Apple" should match "Apple, raw" not "Cider, apple"
  if (keywords.length === 1) {
    // Require higher score for single-word searches to ensure quality matches
    MIN_SCORE_THRESHOLD = 150;
    
    // For single-word searches, also filter out matches where the keyword appears very late
    // This helps prevent "Apple" from matching "Cider, apple" when "Apple, raw" exists
    const filteredMatches = matches.filter(m => {
      // Get food name with field name detection
      let foodNameLower = '';
      if (m.food.foodNameLower) {
        foodNameLower = String(m.food.foodNameLower).toLowerCase();
      } else if (m.food.foodName) {
        foodNameLower = String(m.food.foodName).toLowerCase();
      } else {
        foodNameLower = (m.food['Food Name'] || m.food['Food name'] || m.food.food_name || m.food.name || '').toString().toLowerCase();
      }
      const keyword = keywords[0];
      
      // Find where keyword appears
      let keywordPos = foodNameLower.indexOf(keyword);
      if (keywordPos === -1 && keyword.endsWith('s')) {
        keywordPos = foodNameLower.indexOf(keyword.slice(0, -1));
      } else if (keywordPos === -1 && !keyword.endsWith('s')) {
        keywordPos = foodNameLower.indexOf(keyword + 's');
      }
      
      // If keyword appears after position 30, it's likely not the main food
      // But allow it if the score is very high (exact match, etc.)
      if (keywordPos > 30 && m.score < 300) {
        return false; // Filter out late matches with low scores
      }
      
      return true;
    });
    
    // Use filtered matches if we have any, otherwise fall back to all matches
    if (filteredMatches.length > 0) {
      matches.splice(0, matches.length, ...filteredMatches);
    }
  }
  
  const validMatches = matches.filter(m => m.score >= MIN_SCORE_THRESHOLD);
  
  if (validMatches.length === 0) {
    console.log(`[MATCH] No matches above threshold (${MIN_SCORE_THRESHOLD})`);
    // If no matches meet threshold, but we have some matches, log why
    if (matches.length > 0) {
      console.log(`[MATCH] Best match score (${matches[0].score}) below threshold - likely false positive`);
    }
    return null;
  }

  // Return the best valid match
  const bestMatch = validMatches[0];
  const selectedFoodName = bestMatch.food.foodName || 
                           bestMatch.food['Food Name'] || 
                           bestMatch.food['Food name'] || 
                           bestMatch.food.food_name || 
                           bestMatch.food.name || 
                           'Unknown';
  console.log(`[MATCH] Selected: "${selectedFoodName}" (score: ${bestMatch.score}, type: ${bestMatch.matchType})`);
  
  return bestMatch.food;
}

/**
 * Convert FSANZ food to product format (from normalized JSON)
 */
function convertToProduct(food: any, country: 'NZ' | 'AU'): any {
  // Handle different field name variations
  const foodName = food.foodName || 
                   food['Food Name'] || 
                   food['Food name'] || 
                   food.food_name || 
                   food.name || 
                   'Unknown Food';
  
  return {
    productName: String(foodName),
    country,
    energyKcal: food.energyKcal || food['Energy (kcal)'] || food['Energy kcal'] || food.energy_kcal,
    energyKj: food.energyKj || food['Energy (kJ)'] || food['Energy kj'] || food.energy_kj,
    fat: food.fat || food['Fat'] || food.fat_total,
    saturatedFat: food.saturatedFat || food['Saturated Fat'] || food.saturated_fat,
    carbohydrates: food.carbohydrates || food['Carbohydrates'] || food['Carbohydrates (g)'] || food.carbohydrate_total,
    sugars: food.sugars || food['Sugars'] || food.carbohydrate_sugars,
    protein: food.protein || food['Protein'] || food.proteins,
    salt: food.salt || food['Salt'] || food.salt_total,
    sodium: food.sodium || food['Sodium'] || food.sodium_mg,
    dietaryFiber: food.dietaryFiber || food['Dietary Fiber'] || food['Dietary fibre'] || food.dietary_fiber || food.fiber,
    calcium: food.calcium || food['Calcium'] || food.calcium_mg,
    iron: food.iron || food['Iron'] || food.iron_mg,
    foodGroup: food.foodGroup || food['Food Group'] || food.food_group,
    foodSubgroup: food.foodSubgroup || food['Food Subgroup'] || food.food_subgroup,
  };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, User-Agent, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'false');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log(`[FSANZ-QUERY] Request received: ${req.method} ${req.url}`);
  console.log(`[FSANZ-QUERY] Query params:`, req.query);

  try {
    const country = (req.query.country as string)?.toUpperCase();
    const productName = req.query.productName as string;

    if (!country || (country !== 'NZ' && country !== 'AU')) {
      return res.status(400).json({ error: 'Invalid country. Must be NZ or AU' });
    }

    if (!productName || productName.trim().length === 0) {
      return res.status(400).json({ error: 'productName parameter is required' });
    }

    // Load appropriate database
    console.log(`[FSANZ-QUERY] Loading ${country} database...`);
    let database = country === 'NZ' ? loadNZFCDDatabase() : loadAFCDDatabase();
    let source = country === 'NZ' ? 'nzfcd' : 'afcd';

    console.log(`[FSANZ-QUERY] Database loaded: ${database.length} foods`);
    console.log(`[FSANZ-QUERY] Database type: ${Array.isArray(database) ? 'Array' : typeof database}`);
    
    // ===== COMPREHENSIVE DIAGNOSTIC: Inspect database structure =====
    // Use console.error for critical diagnostics (more likely to appear in logs)
    console.error(`[DIAGNOSTIC] ========================================`);
    console.error(`[DIAGNOSTIC] DATABASE STRUCTURE ANALYSIS FOR ${country}`);
    console.error(`[DIAGNOSTIC] ========================================`);
    console.error(`[DIAGNOSTIC] Database length: ${database.length}`);
    console.error(`[DIAGNOSTIC] Database is array: ${Array.isArray(database)}`);
    
    // Store diagnostic info for response
    let diagnosticInfo: any = {
      databaseSize: database.length,
      isArray: Array.isArray(database),
      firstEntryKeys: null as string[] | null,
      nameLikeKeys: null as string[] | null,
      sampleEntry: null as any,
    };
    
    if (database.length > 0) {
      const firstEntry = database[0];
      console.error(`[DIAGNOSTIC] ===== DATABASE STRUCTURE ANALYSIS =====`);
      console.error(`[DIAGNOSTIC] First entry type: ${typeof firstEntry}`);
      console.error(`[DIAGNOSTIC] First entry is object: ${typeof firstEntry === 'object' && firstEntry !== null}`);
      
      if (typeof firstEntry === 'object' && firstEntry !== null) {
        const allKeys = Object.keys(firstEntry);
        diagnosticInfo.firstEntryKeys = allKeys;
        console.error(`[DIAGNOSTIC] First entry has ${allKeys.length} keys`);
        console.error(`[DIAGNOSTIC] All keys: ${allKeys.join(', ')}`);
        
        // Check for name-related fields (case-insensitive)
        const nameLikeKeys = allKeys.filter(k => 
          k.toLowerCase().includes('name') || 
          k.toLowerCase().includes('food') ||
          k.toLowerCase().includes('title') ||
          k.toLowerCase().includes('description')
        );
        diagnosticInfo.nameLikeKeys = nameLikeKeys;
        console.error(`[DIAGNOSTIC] Name-like keys found: ${nameLikeKeys.join(', ')}`);
        
        // Show values for name-like keys
        nameLikeKeys.forEach(key => {
          const value = firstEntry[key];
          const valueStr = typeof value === 'string' ? value : JSON.stringify(value).substring(0, 100);
          console.error(`[DIAGNOSTIC]   ${key}: "${valueStr}"`);
        });
        
        // Store sample entry (first 5 fields only to avoid huge response)
        const sampleEntry: any = {};
        allKeys.slice(0, 5).forEach(key => {
          const value = firstEntry[key];
          if (typeof value === 'string') {
            sampleEntry[key] = value.substring(0, 100);
          } else if (typeof value === 'number' || typeof value === 'boolean') {
            sampleEntry[key] = value;
          } else {
            sampleEntry[key] = String(value).substring(0, 100);
          }
        });
        diagnosticInfo.sampleEntry = sampleEntry;
        
        // Show ALL field values (first 200 chars each)
        console.error(`[DIAGNOSTIC] All field values (first 200 chars):`);
        allKeys.slice(0, 10).forEach(key => {
          const value = firstEntry[key];
          let valueStr = '';
          if (value === null || value === undefined) {
            valueStr = 'null/undefined';
          } else if (typeof value === 'string') {
            valueStr = value.substring(0, 200);
          } else if (typeof value === 'number' || typeof value === 'boolean') {
            valueStr = String(value);
          } else {
            valueStr = JSON.stringify(value).substring(0, 200);
          }
          console.error(`[DIAGNOSTIC]   ${key}: ${valueStr}`);
        });
      }
      
      // Check multiple entries to see if structure is consistent
      if (database.length > 1) {
        const secondEntry = database[1];
        const secondKeys = Object.keys(secondEntry);
        console.error(`[DIAGNOSTIC] Second entry has ${secondKeys.length} keys`);
        if (secondKeys.length !== Object.keys(firstEntry).length) {
          console.error(`[DIAGNOSTIC] ⚠️  WARNING: Inconsistent structure! First entry: ${Object.keys(firstEntry).length} keys, Second: ${secondKeys.length} keys`);
        }
      }
      console.error(`[DIAGNOSTIC] ===== END STRUCTURE ANALYSIS =====`);
    }
    
    // Always calculate diagnostic info EARLY (before any returns)
    const searchLower = productName.toLowerCase().trim();
    let diagnosticMatches: any[] = [];
    if (database.length > 0) {
      try {
        // Check first few entries to understand structure
        const sampleEntries = database.slice(0, 3);
        console.log(`[DIAGNOSTIC] Sample entries structure:`);
        sampleEntries.forEach((entry: any, idx: number) => {
          console.log(`  Entry ${idx + 1} keys: ${Object.keys(entry).join(', ')}`);
          // Try to find name field with various possible names
          const possibleNameFields = ['foodName', 'foodNameLower', 'Food Name', 'Food name', 'food_name', 'name', 'Name'];
          for (const field of possibleNameFields) {
            if (entry[field]) {
              console.log(`    ${field}: "${entry[field]}"`);
              break;
            }
          }
        });
        
        // AGGRESSIVE matching: Search ALL string fields in ALL entries
        diagnosticMatches = database.filter((f: any) => {
          if (!f || typeof f !== 'object') return false;
          
          // Search EVERY field for the search term
          const allKeys = Object.keys(f);
          for (const key of allKeys) {
            const value = f[key];
            if (value && typeof value === 'string' && value.length > 0) {
              const valueLower = value.toLowerCase();
              if (valueLower.includes(searchLower)) {
                return true; // Found match in ANY field
              }
            }
          }
          return false;
        });
        console.log(`[DIAGNOSTIC] Calculated early: ${diagnosticMatches.length} matches for "${searchLower}"`);
        if (diagnosticMatches.length > 0) {
          const firstMatch = diagnosticMatches[0];
          const matchKeys = Object.keys(firstMatch);
          console.log(`[DIAGNOSTIC] First match keys: ${matchKeys.join(', ')}`);
          // Try to find the name field in the match
          for (const key of matchKeys) {
            const value = firstMatch[key];
            if (value && typeof value === 'string' && value.toLowerCase().includes(searchLower)) {
              console.log(`[DIAGNOSTIC] Match found in field "${key}": "${value.substring(0, 100)}"`);
              break;
            }
          }
        } else {
          console.log(`[DIAGNOSTIC] ⚠️  NO MATCHES FOUND in name-like fields - This suggests field name mismatch!`);
        }
      } catch (e) {
        console.error(`[DIAGNOSTIC] Error calculating matches:`, e);
        if (e instanceof Error) {
          console.error(`[DIAGNOSTIC] Error message: ${e.message}`);
          console.error(`[DIAGNOSTIC] Error stack: ${e.stack}`);
        }
      }
    } else {
      console.log(`[DIAGNOSTIC] ⚠️  Database is empty - cannot run diagnostics`);
    }
    
    // Verify database structure and try to find correct field names
    if (database.length > 0) {
      const sample = database[0];
      console.log(`[FSANZ-QUERY] Sample entry keys: ${Object.keys(sample).join(', ')}`);
      
      // Try to find the name field with various possible names
      const possibleNameFields = ['foodName', 'foodNameLower', 'Food Name', 'Food name', 'food_name', 'name', 'Name'];
      let actualNameField: string | null = null;
      let actualNameLowerField: string | null = null;
      
      for (const field of possibleNameFields) {
        if (sample[field]) {
          actualNameField = field;
          console.log(`[FSANZ-QUERY] Found name field: "${field}" = "${sample[field]}"`);
          break;
        }
      }
      
      // Look for lowercase version
      for (const field of ['foodNameLower', 'food_name_lower', 'name_lower']) {
        if (sample[field]) {
          actualNameLowerField = field;
          console.log(`[FSANZ-QUERY] Found nameLower field: "${field}"`);
          break;
        }
      }
      
      // Test search for debugging with correct field names
      const testSearch = productName.toLowerCase().trim();
      const testMatches = database.filter((f: any) => {
        let name = '';
        if (actualNameLowerField && f[actualNameLowerField]) {
          name = f[actualNameLowerField];
        } else if (actualNameField && f[actualNameField]) {
          name = typeof f[actualNameField] === 'string' ? f[actualNameField].toLowerCase() : '';
        } else {
          // Fallback: try all possible fields
          name = (f.foodNameLower || f.foodName || f['Food Name'] || f['Food name'] || f.food_name || f.name || '').toString().toLowerCase();
        }
        return name && name.includes(testSearch);
      });
      console.log(`[FSANZ-QUERY] Direct contains search for "${testSearch}": ${testMatches.length} matches`);
      if (testMatches.length > 0) {
        const firstMatch = testMatches[0];
        const matchName = actualNameField ? firstMatch[actualNameField] : (firstMatch.foodName || firstMatch['Food Name'] || 'Unknown');
        console.log(`[FSANZ-QUERY] First match: ${matchName}`);
      }
    }

    if (database.length === 0) {
      console.error(`[FSANZ-QUERY] Database is empty!`);
      return res.status(503).json({ 
        error: 'Database not available',
        message: `${country === 'NZ' ? 'NZFCD' : 'AFCD'} database file not found on server or is empty`,
        diagnostic: {
          databaseSize: 0,
          directContainsMatches: 0,
          firstMatch: null
        }
      });
    }

    // COMBINED DATABASE APPROACH: Search both databases for all users
    // This ensures maximum coverage regardless of user location
    console.log(`[FSANZ-QUERY] Searching both NZFCD and AFCD databases for maximum coverage`);
    
    let matchingFood = null;
    let bestMatch = null;
    let bestScore = 0;
    let bestSource = '';
    
    // Search primary database first
    matchingFood = findMatchingFood(productName, database);
    if (matchingFood) {
      // Get match score for comparison
      const foodNameLower = (matchingFood.foodNameLower || matchingFood.foodName?.toLowerCase() || '').trim();
      const searchLower = productName.toLowerCase().trim();
      const score = foodNameLower.includes(searchLower) ? 100 : 50;
      bestMatch = matchingFood;
      bestScore = score;
      bestSource = source;
      console.log(`[FSANZ-QUERY] Found match in ${source}: ${matchingFood.foodName}`);
    }
    
    // Always search the other database as well for best match
    const otherDatabase = country === 'NZ' ? loadAFCDDatabase() : loadNZFCDDatabase();
    const otherSource = country === 'NZ' ? 'afcd' : 'nzfcd';
    
    if (otherDatabase.length > 0) {
      console.log(`[FSANZ-QUERY] Also searching ${otherSource} database (${otherDatabase.length.toLocaleString()} foods)`);
      const otherMatch = findMatchingFood(productName, otherDatabase);
      
      if (otherMatch) {
        // Calculate match score
        const foodNameLower = (otherMatch.foodNameLower || otherMatch.foodName?.toLowerCase() || '').trim();
        const searchLower = productName.toLowerCase().trim();
        const score = foodNameLower.includes(searchLower) ? 100 : 50;
        
        // Use the better match (higher score, or if no primary match)
        if (!bestMatch || score > bestScore) {
          bestMatch = otherMatch;
          bestScore = score;
          bestSource = otherSource;
          console.log(`[FSANZ-QUERY] Better match found in ${otherSource}: ${otherMatch.foodName}`);
        } else {
          console.log(`[FSANZ-QUERY] Match found in ${otherSource} but primary match is better`);
        }
      }
    }
    
    matchingFood = bestMatch;
    source = bestSource;

    if (!matchingFood) {
      console.log(`[DIAGNOSTIC] Direct contains search for "${searchLower}": ${diagnosticMatches.length} matches`);
      
      // FALLBACK 1: If matching algorithm failed but we have direct matches, use the first one
      if (diagnosticMatches.length > 0) {
        console.log(`[DIAGNOSTIC] ⚠️  Matching algorithm failed, using direct match fallback`);
        matchingFood = diagnosticMatches[0];
        const fallbackFoodName = matchingFood.foodName || 
                                 matchingFood['Food Name'] || 
                                 matchingFood['Food name'] || 
                                 matchingFood.food_name || 
                                 matchingFood.name || 
                                 'Unknown';
        console.log(`[DIAGNOSTIC] Using fallback match: ${fallbackFoodName}`);
      } else {
        // FALLBACK 2: Try any-field search (searches ALL fields for the search term)
        console.log(`[DIAGNOSTIC] No direct matches found, trying any-field search...`);
        const anyFieldMatches = database.filter((f: any) => {
          if (!f || typeof f !== 'object') return false;
          const allKeys = Object.keys(f);
          for (const key of allKeys) {
            const value = f[key];
            if (value && typeof value === 'string') {
              if (value.toLowerCase().includes(searchLower)) {
                return true;
              }
            }
          }
          return false;
        });
        
        if (anyFieldMatches.length > 0) {
          console.log(`[DIAGNOSTIC] ⚠️  Found ${anyFieldMatches.length} matches in any-field search - using first match`);
          matchingFood = anyFieldMatches[0];
          
          // Try to identify which field matched
          const matchKeys = Object.keys(matchingFood);
          for (const key of matchKeys) {
            const value = matchingFood[key];
            if (value && typeof value === 'string' && value.toLowerCase().includes(searchLower)) {
              console.log(`[DIAGNOSTIC] ✅ Match found in field "${key}": "${value.substring(0, 100)}"`);
              console.log(`[DIAGNOSTIC] ⚠️  CRITICAL: ${country} database uses field "${key}" for food names!`);
              break;
            }
          }
        }
      }
      
      // If still no match after all fallbacks
      if (!matchingFood) {
        console.log(`[DIAGNOSTIC] Database has NO matches for "${searchLower}" after all fallbacks`);
        
        const response = {
          found: false,
          productName,
          country,
          message: `No matching food found in ${country === 'NZ' ? 'NZFCD' : 'AFCD'} database${country === 'AU' ? ' or NZFCD fallback' : ''}`,
          diagnostic: {
            ...diagnosticInfo,
            directContainsMatches: diagnosticMatches.length,
            firstMatch: diagnosticMatches.length > 0 ? 
              (diagnosticMatches[0].foodName || 
               diagnosticMatches[0]['Food Name'] || 
               diagnosticMatches[0].food_name || 
               diagnosticMatches[0].name || 
               'Unknown') : null
          }
        };
        
        return res.status(200).json(response);
      }
    }

    // Convert to product format (keep original country for response)
    const product = convertToProduct(matchingFood, country);

    return res.status(200).json({
      found: true,
      product,
      country,
      source,
      fallback: source === 'nzfcd-fallback' ? true : undefined,
      diagnostic: {
        ...diagnosticInfo,
        directContainsMatches: diagnosticMatches.length,
        firstMatch: diagnosticMatches.length > 0 ? 
          (diagnosticMatches[0].foodName || 
           diagnosticMatches[0]['Food Name'] || 
           diagnosticMatches[0].food_name || 
           diagnosticMatches[0].name || 
           'Unknown') : null
      }
    });

  } catch (error) {
    console.error('Error querying FSANZ:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}
