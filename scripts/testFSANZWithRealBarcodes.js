/**
 * Test FSANZ with Real Barcodes
 * Tests the actual barcodes the user provided to verify FSANZ integration works
 */

const fs = require('fs');
const path = require('path');

// Load databases
const NZFCD_PATH = path.join(__dirname, '..', 'backend', 'vercel', 'data', 'nzfcd.json');
const AFCD_PATH = path.join(__dirname, '..', 'backend', 'vercel', 'data', 'afcd.json');

console.log('='.repeat(80));
console.log('TESTING FSANZ WITH REAL BARCODES');
console.log('='.repeat(80));
console.log('');

// Test barcodes
const testBarcodes = [
  '9313958005890',
  '9310047207180',
  '9310645467740'
];

// Product names from Open Food Facts (these would come from barcode lookup)
const productNames = {
  '9313958005890': 'Arnott\'s Shapes Original Savoury Biscuits',
  '9310047207180': 'Weet-Bix Original Breakfast Cereal',
  '9310645467740': 'Tip Top Sandwich Bread White'
};

// Load databases
console.log('Loading databases...');
const nzfcd = JSON.parse(fs.readFileSync(NZFCD_PATH, 'utf8'));
const afcd = JSON.parse(fs.readFileSync(AFCD_PATH, 'utf8'));

console.log(`✅ NZFCD: ${nzfcd.length} foods`);
console.log(`✅ AFCD: ${afcd.length} foods`);
console.log('');

// Simple matching function (similar to what the API uses)
function findMatchingFood(productName, database, country) {
  const searchTerms = productName.toLowerCase()
    .split(/[\s,]+/)
    .filter(term => term.length > 2);
  
  let bestMatch = null;
  let bestScore = 0;
  
  for (const food of database) {
    const foodNameLower = food.foodNameLower || food.foodName.toLowerCase();
    let score = 0;
    
    for (const term of searchTerms) {
      if (foodNameLower.includes(term)) {
        score += term.length;
      }
    }
    
    // Bonus for exact matches
    if (foodNameLower.includes(productName.toLowerCase())) {
      score += 50;
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = food;
    }
  }
  
  return bestMatch && bestScore > 5 ? { food: bestMatch, score: bestScore } : null;
}

// Test each barcode
console.log('Testing barcodes...');
console.log('');

for (const barcode of testBarcodes) {
  const productName = productNames[barcode];
  
  console.log(`Barcode: ${barcode}`);
  console.log(`Product: ${productName}`);
  console.log('');
  
  // Test NZ database
  const nzMatch = findMatchingFood(productName, nzfcd, 'NZ');
  if (nzMatch) {
    console.log(`  ✅ NZ Match Found:`);
    console.log(`     Food: ${nzMatch.food.foodName}`);
    console.log(`     Score: ${nzMatch.score}`);
    if (nzMatch.food.protein !== undefined) {
      console.log(`     Protein: ${nzMatch.food.protein}g`);
    }
    if (nzMatch.food.fat !== undefined) {
      console.log(`     Fat: ${nzMatch.food.fat}g`);
    }
    if (nzMatch.food.carbohydrates !== undefined) {
      console.log(`     Carbs: ${nzMatch.food.carbohydrates}g`);
    }
  } else {
    console.log(`  ❌ No NZ match found`);
  }
  
  console.log('');
  
  // Test AU database
  const auMatch = findMatchingFood(productName, afcd, 'AU');
  if (auMatch) {
    console.log(`  ✅ AU Match Found:`);
    console.log(`     Food: ${auMatch.food.foodName}`);
    console.log(`     Score: ${auMatch.score}`);
    if (auMatch.food.protein !== undefined) {
      console.log(`     Protein: ${auMatch.food.protein}g`);
    }
    if (auMatch.food.fat !== undefined) {
      console.log(`     Fat: ${auMatch.food.fat}g`);
    }
    if (auMatch.food.carbohydrates !== undefined) {
      console.log(`     Carbs: ${auMatch.food.carbohydrates}g`);
    }
  } else {
    console.log(`  ❌ No AU match found`);
  }
  
  console.log('');
  console.log('-'.repeat(80));
  console.log('');
}

console.log('='.repeat(80));
console.log('TEST COMPLETE');
console.log('='.repeat(80));

