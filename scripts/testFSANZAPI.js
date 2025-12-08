/**
 * Test FSANZ Query API with real-world examples
 */

const fs = require('fs');
const path = require('path');

const NZFCD_JSON = path.join(__dirname, '..', 'backend', 'vercel', 'data', 'nzfcd.json');
const AFCD_JSON = path.join(__dirname, '..', 'backend', 'vercel', 'data', 'afcd.json');

console.log('========================================');
console.log('FSANZ API Test');
console.log('========================================');
console.log('');

// Load databases
let nzfcdData = [];
let afcdData = [];

if (fs.existsSync(NZFCD_JSON)) {
  nzfcdData = JSON.parse(fs.readFileSync(NZFCD_JSON, 'utf8'));
  console.log(`✅ NZFCD loaded: ${nzfcdData.length} foods`);
} else {
  console.log(`❌ NZFCD JSON not found: ${NZFCD_JSON}`);
}

if (fs.existsSync(AFCD_JSON)) {
  afcdData = JSON.parse(fs.readFileSync(AFCD_JSON, 'utf8'));
  console.log(`✅ AFCD loaded: ${afcdData.length} foods`);
} else {
  console.log(`❌ AFCD JSON not found: ${AFCD_JSON}`);
}

console.log('');

// Test product name matching function
function findMatchingFood(productName, database) {
  if (!productName || !database || database.length === 0) {
    return null;
  }

  const searchName = productName.toLowerCase().trim();
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'in', 'on', 'with', 'for', 'of', 'tomato', 'sauce'];
  const keywords = searchName
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.includes(word))
    .slice(0, 3);

  if (keywords.length === 0) {
    return null;
  }

  // Try exact match first
  for (const food of database) {
    const foodNameLower = food.foodNameLower || (food.foodName || '').toLowerCase();
    if (foodNameLower === searchName || foodNameLower.includes(searchName) || searchName.includes(foodNameLower)) {
      return food;
    }
  }

  // Try fuzzy match
  let bestMatch = null;
  let bestScore = 0;

  for (const food of database) {
    const foodNameLower = food.foodNameLower || (food.foodName || '').toLowerCase();
    let score = 0;
    for (const keyword of keywords) {
      if (foodNameLower.includes(keyword)) {
        score += keyword.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = food;
    }
  }

  if (bestScore > 5) {
    return bestMatch;
  }

  return null;
}

// Test cases
const testCases = [
  { name: 'Baked Beans in Tomato Sauce', country: 'NZ' },
  { name: 'Milk', country: 'NZ' },
  { name: 'Apple', country: 'NZ' },
  { name: 'Bread', country: 'NZ' },
  { name: 'Chicken', country: 'NZ' },
  { name: 'Banana', country: 'NZ' },
  { name: 'Egg', country: 'NZ' },
  { name: 'Rice', country: 'NZ' },
  { name: 'Milk', country: 'AU' },
  { name: 'Apple', country: 'AU' },
];

console.log('Testing product name matching:');
console.log('');

let successCount = 0;
let failCount = 0;

for (const test of testCases) {
  const database = test.country === 'NZ' ? nzfcdData : afcdData;
  const match = findMatchingFood(test.name, database);
  
  if (match) {
    successCount++;
    console.log(`✅ "${test.name}" (${test.country}) → "${match.foodName}"`);
    console.log(`   Energy: ${match.energyKcal || 'N/A'} kcal, Protein: ${match.protein || 'N/A'}g, Fat: ${match.fat || 'N/A'}g`);
  } else {
    failCount++;
    console.log(`❌ "${test.name}" (${test.country}) → No match found`);
  }
}

console.log('');
console.log('========================================');
console.log(`Results: ${successCount} matches, ${failCount} no matches`);
console.log('========================================');
