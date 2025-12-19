/**
 * Test NZFCD database locally to debug matching issue
 */

const fs = require('fs');
const path = require('path');

console.log('Loading NZFCD database...');
const nzfcdPath = path.join(__dirname, '..', 'backend', 'vercel', 'data', 'nzfcd.json');
const data = JSON.parse(fs.readFileSync(nzfcdPath, 'utf8'));

console.log(`\n✅ Loaded ${data.length} entries`);
console.log(`Is array: ${Array.isArray(data)}`);

if (data.length > 0) {
  const first = data[0];
  console.log(`\nFirst entry structure:`);
  console.log(`  Keys: ${Object.keys(first).join(', ')}`);
  console.log(`  foodName: ${first.foodName || 'MISSING'}`);
  console.log(`  foodNameLower: ${first.foodNameLower || 'MISSING'}`);
  console.log(`  Sample: ${JSON.stringify(first).substring(0, 200)}`);
}

// Test matching function (exact copy from API)
function findMatchingFood(productName, database) {
  if (!productName || !database || database.length === 0) {
    console.log(`[MATCH] No product name or empty database`);
    return null;
  }

  const searchName = productName.toLowerCase().trim();
  console.log(`\n[MATCH] Searching for: "${searchName}" in database of ${database.length} foods`);
  
  const allWords = searchName.split(/\s+/).filter(word => word.length > 0);
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'in', 'on', 'with', 'for', 'of'];
  const keywords = allWords
    .filter(word => !commonWords.includes(word))
    .slice(0, 5);

  if (keywords.length === 0) {
    keywords.push(searchName);
  }

  console.log(`[MATCH] Keywords extracted: ${keywords.join(', ')}`);

  // Strategy 0: Single keyword search
  if (keywords.length === 1 && keywords[0].length >= 3) {
    const singleKeyword = keywords[0];
    console.log(`[MATCH] Single keyword search, trying simple contains match for: "${singleKeyword}"`);
    
    // First pass: Exact word match
    let exactMatch = null;
    let containsMatch = null;
    let checked = 0;
    
    for (const food of database) {
      checked++;
      if (checked % 50000 === 0) {
        console.log(`[MATCH] Checked ${checked} entries...`);
      }
      
      const foodNameLower = food.foodNameLower || (food.foodName || '').toLowerCase();
      
      if (foodNameLower.includes(singleKeyword)) {
        if (!containsMatch) {
          containsMatch = food;
        }
        
        const isExactWord = new RegExp(`\\b${singleKeyword}\\b`, 'i').test(foodNameLower);
        if (isExactWord && !exactMatch) {
          exactMatch = food;
          console.log(`[MATCH] Exact word match found at entry ${checked}: "${food.foodName}"`);
          break; // Found exact match, stop searching
        }
      }
    }
    
    console.log(`[MATCH] Checked ${checked} entries total`);
    
    if (exactMatch) {
      return exactMatch;
    }
    
    if (containsMatch) {
      console.log(`[MATCH] Contains match found: "${containsMatch.foodName}"`);
      return containsMatch;
    }
    
    console.log(`[MATCH] No match found for "${singleKeyword}"`);
    return null;
  }

  return null;
}

// Test cases
console.log('\n========================================');
console.log('Testing Matching');
console.log('========================================\n');

const testCases = ['Milk', 'milk', 'Bread', 'Tomato Sauce'];

for (const test of testCases) {
  console.log(`\n--- Testing: "${test}" ---`);
  const result = findMatchingFood(test, data);
  if (result) {
    console.log(`✅ FOUND: ${result.foodName}`);
    console.log(`   Energy: ${result.energyKcal || 'N/A'} kcal`);
  } else {
    console.log(`❌ NOT FOUND`);
    
    // Show what entries exist
    if (test.toLowerCase() === 'milk') {
      const milkEntries = data.filter(f => {
        const name = (f.foodName || f.foodNameLower || '').toLowerCase();
        return name.includes('milk');
      });
      console.log(`   Found ${milkEntries.length} entries containing "milk"`);
      if (milkEntries.length > 0) {
        console.log(`   First 10:`);
        milkEntries.slice(0, 10).forEach((f, i) => {
          console.log(`     ${i+1}. "${f.foodName}" (foodNameLower: "${f.foodNameLower}")`);
        });
      }
    }
  }
}
















