/**
 * Complete test of FSANZ query functionality
 */

const fs = require('fs');
const path = require('path');

const NZFCD_JSON = path.join(__dirname, '..', 'backend', 'vercel', 'data', 'nzfcd.json');
const AFCD_JSON = path.join(__dirname, '..', 'backend', 'vercel', 'data', 'afcd.json');

console.log('========================================');
console.log('FSANZ Query Complete Test');
console.log('========================================');
console.log('');

// Load databases
let nzfcdData = [];
let afcdData = [];

if (fs.existsSync(NZFCD_JSON)) {
  nzfcdData = JSON.parse(fs.readFileSync(NZFCD_JSON, 'utf8'));
  console.log(`✅ NZFCD: ${nzfcdData.length} foods loaded`);
  console.log(`   Sample: ${nzfcdData[0]?.foodName || 'N/A'}`);
} else {
  console.log(`❌ NZFCD JSON not found: ${NZFCD_JSON}`);
}

if (fs.existsSync(AFCD_JSON)) {
  afcdData = JSON.parse(fs.readFileSync(AFCD_JSON, 'utf8'));
  console.log(`✅ AFCD: ${afcdData.length} foods loaded`);
  console.log(`   Sample: ${afcdData[0]?.foodName || 'N/A'}`);
} else {
  console.log(`❌ AFCD JSON not found: ${AFCD_JSON}`);
}

console.log('');

// Matching function (same as API)
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

// Real-world test cases
const testCases = [
  // Common products
  { name: 'Baked Beans in Tomato Sauce', country: 'NZ', expected: true },
  { name: 'Milk', country: 'NZ', expected: true },
  { name: 'Apple', country: 'NZ', expected: true },
  { name: 'Bread', country: 'NZ', expected: true },
  { name: 'Chicken', country: 'NZ', expected: true },
  { name: 'Banana', country: 'NZ', expected: true },
  { name: 'Egg', country: 'NZ', expected: true },
  { name: 'Rice', country: 'NZ', expected: true },
  { name: 'Potato', country: 'NZ', expected: true },
  { name: 'Tomato', country: 'NZ', expected: true },
  { name: 'Milk', country: 'AU', expected: true },
  { name: 'Apple', country: 'AU', expected: true },
  { name: 'Bread', country: 'AU', expected: true },
  // Specific product names from scans
  { name: 'Pams Fresh Milk 2L', country: 'NZ', expected: true },
  { name: 'Anchor Butter 500g', country: 'NZ', expected: true },
  { name: 'Woolworths Full Cream Milk 2L', country: 'AU', expected: true },
];

console.log('Testing product name matching:');
console.log('');

let successCount = 0;
let failCount = 0;
const results = [];

for (const test of testCases) {
  const database = test.country === 'NZ' ? nzfcdData : afcdData;
  const match = findMatchingFood(test.name, database);
  
  const result = {
    productName: test.name,
    country: test.country,
    found: !!match,
    matchedFood: match?.foodName || null,
    energyKcal: match?.energyKcal || null,
    protein: match?.protein || null,
    fat: match?.fat || null,
  };
  
  results.push(result);
  
  if (match) {
    successCount++;
    console.log(`✅ "${test.name}" (${test.country})`);
    console.log(`   → "${match.foodName}"`);
    console.log(`   Energy: ${match.energyKcal || 'N/A'} kcal, Protein: ${match.protein || 'N/A'}g, Fat: ${match.fat || 'N/A'}g`);
  } else {
    failCount++;
    console.log(`❌ "${test.name}" (${test.country}) → No match`);
  }
  console.log('');
}

console.log('========================================');
console.log(`Results: ${successCount} matches, ${failCount} no matches`);
console.log(`Success rate: ${((successCount / testCases.length) * 100).toFixed(1)}%`);
console.log('========================================');
console.log('');

// Show statistics
if (nzfcdData.length > 0) {
  console.log('NZFCD Statistics:');
  console.log(`  Total foods: ${nzfcdData.length}`);
  const withNutrition = nzfcdData.filter(f => f.energyKcal || f.protein || f.fat).length;
  console.log(`  Foods with nutrition data: ${withNutrition}`);
  console.log('');
}

if (afcdData.length > 0) {
  console.log('AFCD Statistics:');
  console.log(`  Total foods: ${afcdData.length}`);
  const withNutrition = afcdData.filter(f => f.energyKcal || f.protein || f.fat).length;
  console.log(`  Foods with nutrition data: ${withNutrition}`);
  console.log('');
}

// Save results
const resultsPath = path.join(__dirname, '..', 'FSANZ_TEST_RESULTS.json');
fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
console.log(`Results saved to: ${resultsPath}`);
