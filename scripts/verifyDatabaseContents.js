/**
 * Verify FSANZ Database Contents
 * Checks if databases have expected foods and tests matching
 */

const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log('FSANZ Database Content Verification');
console.log('========================================\n');

// Check NZFCD
const nzfcdPath = path.join(__dirname, '..', 'backend', 'vercel', 'data', 'nzfcd.json');
if (fs.existsSync(nzfcdPath)) {
  const nzData = JSON.parse(fs.readFileSync(nzfcdPath, 'utf8'));
  console.log(`✅ NZFCD: ${nzData.length.toLocaleString()} foods`);
  
  // Test common foods
  const testFoods = ['milk', 'tomato', 'bread', 'coconut', 'cranberry', 'apple', 'sauce'];
  console.log('\nTesting common foods:');
  testFoods.forEach(test => {
    const matches = nzData.filter(f => {
      const name = (f.foodNameLower || (f.foodName || '').toLowerCase());
      return name.includes(test);
    });
    if (matches.length > 0) {
      console.log(`  ✅ "${test}": ${matches.length} matches (e.g., "${matches[0].foodName}")`);
    } else {
      console.log(`  ❌ "${test}": NO MATCHES`);
    }
  });
  
  // Check structure
  if (nzData.length > 0) {
    const sample = nzData[0];
    console.log('\nSample food structure:');
    console.log(`  foodName: ${sample.foodName || 'MISSING'}`);
    console.log(`  foodNameLower: ${sample.foodNameLower || 'MISSING'}`);
    console.log(`  energyKcal: ${sample.energyKcal || 'MISSING'}`);
    console.log(`  protein: ${sample.protein || 'MISSING'}`);
  }
} else {
  console.log('❌ NZFCD file not found');
}

console.log('');

// Check AFCD
const afcdPath = path.join(__dirname, '..', 'backend', 'vercel', 'data', 'afcd.json');
if (fs.existsSync(afcdPath)) {
  const auData = JSON.parse(fs.readFileSync(afcdPath, 'utf8'));
  console.log(`✅ AFCD: ${auData.length.toLocaleString()} foods`);
  
  // Test common foods
  const testFoods = ['milk', 'tomato', 'bread', 'coconut', 'apple'];
  console.log('\nTesting common foods:');
  testFoods.forEach(test => {
    const matches = auData.filter(f => {
      const name = (f.foodNameLower || (f.foodName || '').toLowerCase());
      return name.includes(test);
    });
    if (matches.length > 0) {
      console.log(`  ✅ "${test}": ${matches.length} matches (e.g., "${matches[0].foodName}")`);
    } else {
      console.log(`  ❌ "${test}": NO MATCHES`);
    }
  });
  
  // Check structure
  if (auData.length > 0) {
    const sample = auData[0];
    console.log('\nSample food structure:');
    console.log(`  foodName: ${sample.foodName || 'MISSING'}`);
    console.log(`  foodNameLower: ${sample.foodNameLower || 'MISSING'}`);
    console.log(`  energyKcal: ${sample.energyKcal || 'MISSING'}`);
  }
} else {
  console.log('❌ AFCD file not found');
}

console.log('\n========================================');
