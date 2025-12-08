/**
 * Test Combined FSANZ Databases
 * Tests that both NZFCD and AFCD are accessible and can be queried
 */

const fs = require('fs');
const path = require('path');

const NZFCD_PATH = path.join(__dirname, '..', 'backend', 'vercel', 'data', 'nzfcd.json');
const AFCD_PATH = path.join(__dirname, '..', 'backend', 'vercel', 'data', 'afcd.json');

console.log('='.repeat(80));
console.log('TEST COMBINED FSANZ DATABASES');
console.log('='.repeat(80));
console.log('');

// Test barcodes and product names
const testCases = [
  {
    barcode: '9313958005890',
    productName: 'Arnott\'s Shapes Original Savoury Biscuits',
    description: 'Australian product'
  },
  {
    barcode: '9310047207180',
    productName: 'Weet-Bix Original Breakfast Cereal',
    description: 'New Zealand/Australian product'
  },
  {
    barcode: '9310645467740',
    productName: 'Tip Top Sandwich Bread White',
    description: 'New Zealand product'
  }
];

// Load databases
console.log('Loading databases...');
const nzfcd = JSON.parse(fs.readFileSync(NZFCD_PATH, 'utf8'));
const afcd = JSON.parse(fs.readFileSync(AFCD_PATH, 'utf8'));

console.log(`✅ NZFCD: ${nzfcd.length.toLocaleString()} foods`);
console.log(`✅ AFCD: ${afcd.length.toLocaleString()} foods`);
console.log(`✅ Combined: ${(nzfcd.length + afcd.length).toLocaleString()} foods`);
console.log('');

// Simple matching function
function findMatch(productName, database, dbName) {
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

// Test each case
console.log('Testing product matches...');
console.log('');

for (const testCase of testCases) {
  console.log(`Barcode: ${testCase.barcode}`);
  console.log(`Product: ${testCase.productName}`);
  console.log(`Description: ${testCase.description}`);
  console.log('');
  
  // Test NZ database
  const nzMatch = findMatch(testCase.productName, nzfcd, 'NZFCD');
  if (nzMatch) {
    console.log(`  ✅ NZFCD Match Found:`);
    console.log(`     Food: ${nzMatch.food.foodName}`);
    console.log(`     Score: ${nzMatch.score}`);
    if (nzMatch.food.protein !== undefined) {
      console.log(`     Protein: ${nzMatch.food.protein}g`);
    }
  } else {
    console.log(`  ❌ No NZFCD match found`);
  }
  
  console.log('');
  
  // Test AU database
  const auMatch = findMatch(testCase.productName, afcd, 'AFCD');
  if (auMatch) {
    console.log(`  ✅ AFCD Match Found:`);
    console.log(`     Food: ${auMatch.food.foodName}`);
    console.log(`     Score: ${auMatch.score}`);
    if (auMatch.food.protein !== undefined) {
      console.log(`     Protein: ${auMatch.food.protein}g`);
    }
  } else {
    console.log(`  ❌ No AFCD match found`);
  }
  
  // Best match
  let bestMatch = null;
  if (nzMatch && auMatch) {
    bestMatch = nzMatch.score > auMatch.score ? { ...nzMatch, source: 'NZFCD' } : { ...auMatch, source: 'AFCD' };
  } else if (nzMatch) {
    bestMatch = { ...nzMatch, source: 'NZFCD' };
  } else if (auMatch) {
    bestMatch = { ...auMatch, source: 'AFCD' };
  }
  
  if (bestMatch) {
    console.log(`  🎯 Best Match: ${bestMatch.source} (score: ${bestMatch.score})`);
  } else {
    console.log(`  ⚠️  No match found in either database`);
  }
  
  console.log('');
  console.log('-'.repeat(80));
  console.log('');
}

console.log('='.repeat(80));
console.log('COMBINED DATABASE TEST COMPLETE');
console.log('='.repeat(80));
console.log('');
console.log('Summary:');
console.log(`  NZFCD: ${nzfcd.length.toLocaleString()} foods`);
console.log(`  AFCD: ${afcd.length.toLocaleString()} foods`);
console.log(`  Total: ${(nzfcd.length + afcd.length).toLocaleString()} foods available`);
console.log('');
console.log('✅ Both databases are accessible and can be queried');
console.log('✅ Users in both NZ and AU will have access to both databases');

