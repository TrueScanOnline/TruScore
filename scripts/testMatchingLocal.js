/**
 * Test matching algorithm locally
 */

const fs = require('fs');
const path = require('path');

// Load database
const nzfcdPath = path.join(__dirname, '..', 'backend', 'vercel', 'data', 'nzfcd.json');
const data = JSON.parse(fs.readFileSync(nzfcdPath, 'utf8'));

console.log('Total entries:', data.length);
console.log('First entry keys:', Object.keys(data[0]));
console.log('First entry sample:', JSON.stringify(data[0], null, 2).substring(0, 300));

// Test matching function (simplified version)
function findMatchingFood(productName, database) {
  if (!productName || !database || database.length === 0) {
    console.log(`[MATCH] No product name or empty database`);
    return null;
  }

  const searchName = productName.toLowerCase().trim();
  console.log(`[MATCH] Searching for: "${searchName}" in database of ${database.length} foods`);
  
  const allWords = searchName.split(/\s+/).filter(word => word.length > 0);
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'in', 'on', 'with', 'for', 'of'];
  const keywords = allWords
    .filter(word => !commonWords.includes(word))
    .slice(0, 5);

  if (keywords.length === 0) {
    keywords.push(searchName);
  }

  console.log(`[MATCH] Keywords extracted: ${keywords.join(', ')}`);

  // Strategy 1: Exact or substring match
  for (const food of database) {
    const foodNameLower = food.foodNameLower || (food.foodName || '').toLowerCase();
    
    if (foodNameLower === searchName) {
      console.log(`[MATCH] Exact match found: "${food.foodName}"`);
      return food;
    }
    
    if (foodNameLower.includes(searchName) || searchName.includes(foodNameLower)) {
      console.log(`[MATCH] Substring match found: "${food.foodName}"`);
      return food;
    }
  }

  // Strategy 2: Keyword matching
  let bestMatch = null;
  let bestScore = 0;
  let matchedKeywords = [];

  for (const food of database) {
    const foodNameLower = food.foodNameLower || (food.foodName || '').toLowerCase();
    
    let score = 0;
    const matched = [];
    
    for (const keyword of keywords) {
      if (foodNameLower.includes(keyword)) {
        const isExactWord = new RegExp(`\\b${keyword}\\b`, 'i').test(foodNameLower);
        score += isExactWord ? keyword.length * 2 : keyword.length;
        matched.push(keyword);
      }
    }

    if (matched.length > 1) {
      score += matched.length * 2;
    }

    if (keywords.length > 0 && matched.includes(keywords[0])) {
      score += 5;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = food;
      matchedKeywords = matched;
    }
  }

  if (bestMatch && bestScore > 0) {
    console.log(`[MATCH] Fuzzy match found: "${bestMatch.foodName}" (score: ${bestScore}, matched: ${matchedKeywords.join(', ')})`);
    return bestMatch;
  }

  // Fallback
  if (keywords.length > 0) {
    const firstKeyword = keywords[0];
    console.log(`[MATCH] Trying fallback with keyword: "${firstKeyword}"`);
    
    for (const food of database) {
      const foodNameLower = food.foodNameLower || (food.foodName || '').toLowerCase();
      
      if (foodNameLower.startsWith(firstKeyword) || 
          foodNameLower.includes(firstKeyword) ||
          new RegExp(`\\b${firstKeyword}`, 'i').test(foodNameLower)) {
        console.log(`[MATCH] Fallback match found: "${food.foodName}"`);
        return food;
      }
    }
  }

  console.log(`[MATCH] No match found (best score: ${bestScore}, keywords: ${keywords.join(', ')})`);
  return null;
}

// Test cases
console.log('\n========================================');
console.log('Testing Matching Algorithm');
console.log('========================================\n');

const testCases = ['Milk', 'milk', 'MILK', 'Tomato Sauce', 'Bread'];

for (const test of testCases) {
  console.log(`\n--- Testing: "${test}" ---`);
  const result = findMatchingFood(test, data);
  if (result) {
    console.log(`✅ FOUND: ${result.foodName}`);
  } else {
    console.log(`❌ NOT FOUND`);
    
    // Show what milk entries exist
    if (test.toLowerCase() === 'milk') {
      const milkEntries = data.filter(f => {
        const name = (f.foodName || f.foodNameLower || '').toLowerCase();
        return name.includes('milk');
      });
      console.log(`   Found ${milkEntries.length} entries containing "milk"`);
      if (milkEntries.length > 0) {
        console.log(`   First 5:`);
        milkEntries.slice(0, 5).forEach(f => {
          console.log(`     - "${f.foodName}" (foodNameLower: "${f.foodNameLower}")`);
        });
      }
    }
  }
}











