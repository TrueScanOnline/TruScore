/**
 * Complete matching test - replicate API logic locally
 */

const fs = require('fs');
const path = require('path');

// Load database
const nzfcdPath = path.join(__dirname, '..', 'backend', 'vercel', 'data', 'nzfcd.json');
console.log('Loading NZFCD database...');
const database = JSON.parse(fs.readFileSync(nzfcdPath, 'utf8'));
console.log(`✅ Loaded ${database.length} entries\n`);

// Replicate exact matching function from API
function findMatchingFood(productName, database) {
  if (!productName || !database || database.length === 0) {
    return null;
  }

  const searchName = productName.toLowerCase().trim();
  console.log(`Searching for: "${searchName}"`);
  
  const allWords = searchName.split(/\s+/).filter(word => word.length > 0);
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'in', 'on', 'with', 'for', 'of'];
  const keywords = allWords
    .filter(word => !commonWords.includes(word))
    .slice(0, 5);

  if (keywords.length === 0) {
    keywords.push(searchName);
  }

  console.log(`Keywords: ${keywords.join(', ')}`);

  // Strategy 0: Single keyword search (like "Milk")
  if (keywords.length === 1 && keywords[0].length >= 3) {
    const singleKeyword = keywords[0];
    console.log(`Single keyword: "${singleKeyword}"`);
    
    // Try exact word match first
    for (let i = 0; i < database.length; i++) {
      const food = database[i];
      const foodNameLower = food.foodNameLower || (food.foodName || '').toLowerCase();
      
      if (foodNameLower.includes(singleKeyword)) {
        const isExactWord = new RegExp(`\\b${singleKeyword}\\b`, 'i').test(foodNameLower);
        if (isExactWord) {
          console.log(`✅ Exact word match: "${food.foodName}"`);
          return food;
        }
      }
    }
    
    // If no exact match, return first contains match
    for (let i = 0; i < database.length; i++) {
      const food = database[i];
      const foodNameLower = food.foodNameLower || (food.foodName || '').toLowerCase();
      if (foodNameLower.includes(singleKeyword)) {
        console.log(`✅ Contains match: "${food.foodName}"`);
        return food;
      }
    }
    
    console.log(`❌ No match found`);
    return null;
  }

  return null;
}

// Test cases
const tests = ['Milk', 'milk', 'Bread', 'Tomato Sauce'];

console.log('========================================');
console.log('Testing Matching Algorithm');
console.log('========================================\n');

for (const test of tests) {
  console.log(`\n--- Test: "${test}" ---`);
  const result = findMatchingFood(test, database);
  if (result) {
    console.log(`✅ FOUND: ${result.foodName}`);
    console.log(`   Energy: ${result.energyKcal || 'N/A'} kcal`);
  } else {
    console.log(`❌ NOT FOUND`);
  }
}











