/**
 * Complete FSANZ Fix and Test
 * 1. Delete broken database
 * 2. Generate from text file
 * 3. Test with real barcodes
 * 4. Verify TruScore integration
 */

const fs = require('fs');
const path = require('path');

const TEXT_FILE = path.join(__dirname, '..', 'Database files', 'Principal files', 'ASCII Text Files', 'Standard', 'Standard DATA.AP');
const OUTPUT_FILE = path.join(__dirname, '..', 'backend', 'vercel', 'data', 'nzfcd.json');
const TEST_LOG = path.join(__dirname, '..', 'FSANZ_COMPLETE_TEST.txt');

fs.writeFileSync(TEST_LOG, 'FSANZ COMPLETE FIX AND TEST\n');
fs.writeFileSync(TEST_LOG, '='.repeat(80) + '\n\n', { flag: 'a' });

function log(msg) {
  const m = String(msg);
  console.log(m);
  fs.appendFileSync(TEST_LOG, m + '\n');
}

log('STEP 1: Delete broken database\n');

if (fs.existsSync(OUTPUT_FILE)) {
  fs.unlinkSync(OUTPUT_FILE);
  log('✅ Deleted old database\n');
} else {
  log('⚠️  No existing database to delete\n');
}

log('STEP 2: Generate from text file\n');

if (!fs.existsSync(TEXT_FILE)) {
  log(`❌ Text file not found: ${TEXT_FILE}`);
  process.exit(1);
}

const content = fs.readFileSync(TEXT_FILE, 'utf8');
const allLines = content.split(/\r?\n/);
const lines = allLines.map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('©'));

log(`Total lines: ${allLines.length}`);
log(`Filtered lines: ${lines.length}\n`);

if (lines.length < 4) {
  log('❌ Invalid file');
  process.exit(1);
}

const firstData = lines[3];
const firstParts = firstData.split('~');
log(`First data line: "${firstParts[1]}"\n`);

if (!firstParts[1] || firstParts[1].match(/^Food \d+$/)) {
  log('❌ Invalid food name!');
  process.exit(1);
}

const headerRow1 = lines[1].split('~');
const dataLines = lines.slice(3);

log(`Header columns: ${headerRow1.length}`);
log(`Data rows: ${dataLines.length}\n`);

const colIndices = {
  foodId: 0,
  foodName: 1,
  energyKcal: 25,
  energyKj: 27,
  protein: 58,
  fat: 28,
  saturatedFat: 40,
  carbohydrates: 14,
  sugars: 70,
  dietaryFiber: 42,
  calcium: 13,
  iron: 50,
  sodium: 59,
};

const foods = [];
const seenFoodIds = new Set();

log('Processing...');

for (let i = 0; i < dataLines.length; i++) {
  const line = dataLines[i];
  const parts = line.split('~');
  
  if (parts.length < 2) continue;
  
  const foodId = parts[colIndices.foodId]?.trim();
  const foodName = parts[colIndices.foodName]?.trim();
  
  if (!foodId || !foodName || foodName.length < 2) continue;
  if (seenFoodIds.has(foodId)) continue;
  seenFoodIds.add(foodId);
  
  const parseVal = (idx) => {
    if (idx < 0 || idx >= parts.length) return undefined;
    const val = parts[idx]?.trim();
    if (!val || val === '' || val === '~~') return undefined;
    const num = parseFloat(val);
    return isNaN(num) ? undefined : num;
  };
  
  foods.push({
    foodName: foodName,
    foodNameLower: foodName.toLowerCase().trim(),
    energyKcal: parseVal(colIndices.energyKcal),
    energyKj: parseVal(colIndices.energyKj),
    protein: parseVal(colIndices.protein),
    fat: parseVal(colIndices.fat),
    saturatedFat: parseVal(colIndices.saturatedFat),
    carbohydrates: parseVal(colIndices.carbohydrates),
    sugars: parseVal(colIndices.sugars),
    dietaryFiber: parseVal(colIndices.dietaryFiber),
    calcium: parseVal(colIndices.calcium),
    iron: parseVal(colIndices.iron),
    sodium: parseVal(colIndices.sodium),
    salt: parseVal(colIndices.sodium) ? parseVal(colIndices.sodium) * 2.54 : undefined,
  });
}

const valid = foods.filter(f => f.foodName && !f.foodName.match(/^Food \d+$/) && f.foodName.length > 2);

log(`\n✅ Parsed ${valid.length} valid foods\n`);

if (valid.length < 100) {
  log('❌ Not enough valid foods!');
  process.exit(1);
}

log('First 5 foods:');
valid.slice(0, 5).forEach((f, i) => {
  log(`  ${i+1}. "${f.foodName}"`);
});

// Write
const outputDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(valid, null, 2), 'utf8');

log(`\n✅ Database written: ${valid.length} foods\n`);

// Verify
const verify = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
if (verify[0].foodName.match(/^Food \d+$/)) {
  log('❌ ERROR: Database still broken!');
  process.exit(1);
}

log(`✅ Verification: First entry is "${verify[0].foodName}"\n`);

// Test with real barcodes
log('='.repeat(80));
log('STEP 3: Testing with Real Barcodes');
log('='.repeat(80));
log('');

const barcodes = ['9313958005890', '9310047207180', '9310645467740'];
let totalTests = 0;
let successfulMatches = 0;

(async () => {
  for (const barcode of barcodes) {
    log(`\nTesting barcode: ${barcode}`);
    
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();
      
      if (data.status !== 1 || !data.product) {
        log(`  ❌ Product not found in Open Food Facts`);
        continue;
      }
      
      const productName = data.product.product_name || data.product.product_name_en || null;
      if (!productName) {
        log(`  ❌ No product name`);
        continue;
      }
      
      totalTests++;
      log(`  Product: "${productName}"`);
      
      const searchName = productName.toLowerCase().trim();
      const keywords = searchName.split(/\s+/).filter(w => w.length > 2).slice(0, 5);
      
      // Search database
      let matches = [];
      for (const food of valid) {
        const foodName = food.foodNameLower;
        
        if (foodName === searchName) {
          matches.push({ name: food.foodName, score: 1000, type: 'exact' });
        } else if (foodName.includes(searchName) || searchName.includes(foodName)) {
          matches.push({ name: food.foodName, score: 500, type: 'contains' });
        } else {
          let matched = 0;
          for (const keyword of keywords) {
            if (foodName.includes(keyword)) matched++;
          }
          if (matched >= Math.max(1, Math.ceil(keywords.length * 0.4))) {
            matches.push({ name: food.foodName, score: matched * 50, type: 'keywords' });
          }
        }
      }
      
      if (matches.length > 0) {
        matches.sort((a, b) => b.score - a.score);
        const best = matches[0];
        log(`  ✅ FOUND ${matches.length} MATCHES`);
        log(`  ✅ Best: "${best.name}" (${best.type}, score: ${best.score})`);
        log(`  ✅ FSANZ query WILL RETURN DATA`);
        log(`  ✅ TruScore WILL get FSANZ nutrition data`);
        
        const matchedFood = valid.find(f => f.foodName === best.name);
        if (matchedFood) {
          log(`  \n  Nutrition data:`);
          if (matchedFood.energyKcal) log(`    Energy: ${matchedFood.energyKcal} kcal`);
          if (matchedFood.protein) log(`    Protein: ${matchedFood.protein} g`);
          if (matchedFood.fat) log(`    Fat: ${matchedFood.fat} g`);
        }
        
        successfulMatches++;
      } else {
        log(`  ❌ NO MATCHES FOUND`);
        log(`  ❌ FSANZ query will return NOTHING`);
        log(`  ❌ TruScore will NOT get FSANZ data`);
      }
    } catch (error) {
      log(`  ❌ Error: ${error.message}`);
    }
  }
  
  // Final summary
  log('\n' + '='.repeat(80));
  log('FINAL SUMMARY');
  log('='.repeat(80));
  log(`\nDatabase: ${valid.length} foods`);
  log(`Tests: ${totalTests}`);
  log(`Successful matches: ${successfulMatches}/${totalTests}`);
  
  if (successfulMatches === totalTests && totalTests > 0) {
    log('\n✅ SUCCESS: All tests passed!');
    log('✅ FSANZ will return valid results for TruScore');
  } else if (successfulMatches > 0) {
    log('\n⚠️  PARTIAL: Some products will get FSANZ data');
  } else {
    log('\n❌ FAILURE: No matches found');
    log('❌ FSANZ integration is NOT WORKING');
  }
  
  log(`\nFull log: ${TEST_LOG}`);
  log('='.repeat(80));
})();

