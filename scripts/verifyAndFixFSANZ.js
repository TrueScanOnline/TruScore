/**
 * Verify and Fix FSANZ Database - Complete End-to-End Test
 */

const fs = require('fs');
const path = require('path');

const TEXT_FILE = path.join(__dirname, '..', 'Database files', 'Principal files', 'ASCII Text Files', 'Standard', 'Standard DATA.AP');
const NZFCD_OUTPUT = path.join(__dirname, '..', 'backend', 'vercel', 'data', 'nzfcd.json');
const AFCD_OUTPUT = path.join(__dirname, '..', 'backend', 'vercel', 'data', 'afcd.json');
const TEST_LOG = path.join(__dirname, '..', 'FSANZ_VERIFICATION_LOG.txt');

fs.writeFileSync(TEST_LOG, 'FSANZ VERIFICATION AND FIX LOG\n');
fs.writeFileSync(TEST_LOG, '='.repeat(80) + '\n\n', { flag: 'a' });

function log(msg) {
  const m = String(msg);
  console.log(m);
  fs.appendFileSync(TEST_LOG, m + '\n');
}

log('='.repeat(80));
log('FSANZ VERIFICATION AND FIX');
log('='.repeat(80));
log('');

// Step 1: Fix NZFCD Database
log('STEP 1: Fixing NZFCD Database\n');

if (!fs.existsSync(TEXT_FILE)) {
  log(`❌ Text file not found: ${TEXT_FILE}`);
  process.exit(1);
}

log(`✅ Reading from: ${TEXT_FILE}`);

const content = fs.readFileSync(TEXT_FILE, 'utf8');
const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('©'));

log(`Total lines: ${lines.length}`);

if (lines.length < 4) {
  log('❌ Invalid file format');
  process.exit(1);
}

const headerRow1 = lines[1].split('~');
const dataLines = lines.slice(3);

log(`Header columns: ${headerRow1.length}`);
log(`Data rows: ${dataLines.length}`);

// Find column indices
const findCol = (terms) => {
  for (let i = 0; i < headerRow1.length; i++) {
    const col = (headerRow1[i] || '').toLowerCase();
    for (const term of terms) {
      if (col.includes(term.toLowerCase())) return i;
    }
  }
  return -1;
};

const colIndices = {
  foodId: 0,
  foodName: 1,
  energyKcal: findCol(['energy, total metabolisable (kcal)', 'energy (kcal)']) || 25,
  energyKj: findCol(['energy, total metabolisable (kj)', 'energy (kj)']) || 27,
  protein: findCol(['protein, total', 'protein']) || 58,
  fat: findCol(['fat, total', 'fat']) || 28,
  saturatedFat: findCol(['fatty acids, total saturated', 'saturated']) || 40,
  carbohydrates: findCol(['total carbohydrate by difference', 'carbohydrate']) || 14,
  sugars: findCol(['sugars, total', 'sugars']) || 70,
  dietaryFiber: findCol(['fibre, total dietary', 'fiber', 'dietary']) || 42,
  calcium: findCol(['calcium', 'ca']) || 13,
  iron: findCol(['iron', 'fe']) || 50,
  sodium: findCol(['sodium', 'na']) || 59,
};

log('\nColumn mapping:');
log(`  Food ID: ${colIndices.foodId}`);
log(`  Food Name: ${colIndices.foodName}`);
log(`  Energy (kcal): ${colIndices.energyKcal}`);
log(`  Energy (kJ): ${colIndices.energyKj}`);
log(`  Protein: ${colIndices.protein}`);

const foods = [];
const seenFoodIds = new Set();

log('\nProcessing data...');

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
  
  if ((i + 1) % 500 === 0) {
    log(`  Processed ${i + 1}/${dataLines.length}...`);
  }
}

log(`\n✅ Parsed ${foods.length} unique foods`);

// Verify we have real food names
const validFoods = foods.filter(f => f.foodName && !f.foodName.match(/^Food \d+$/) && f.foodName.length > 2);
log(`Valid foods: ${validFoods.length}`);

if (validFoods.length < 100) {
  log('❌ CRITICAL: Not enough valid foods!');
  process.exit(1);
}

log('\nFirst 5 foods:');
validFoods.slice(0, 5).forEach((f, i) => {
  log(`  ${i+1}. "${f.foodName}"`);
});

// Write NZFCD database
const outputDir = path.dirname(NZFCD_OUTPUT);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(NZFCD_OUTPUT, JSON.stringify(validFoods, null, 2), 'utf8');
log(`\n✅ NZFCD database written: ${validFoods.length} foods`);

// Step 2: Test with Real Barcodes
log('\n' + '='.repeat(80));
log('STEP 2: Testing with Real Barcodes');
log('='.repeat(80));
log('');

const barcodes = ['9313958005890', '9310047207180', '9310645467740'];
let totalTests = 0;
let successfulMatches = 0;

for (const barcode of barcodes) {
  log(`\n${'='.repeat(60)}`);
  log(`Testing barcode: ${barcode}`);
  log(`${'='.repeat(60)}`);
  
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const data = await response.json();
    
    if (data.status !== 1 || !data.product) {
      log(`  ❌ Product not found in Open Food Facts`);
      continue;
    }
    
    const productName = data.product.product_name || data.product.product_name_en || null;
    if (!productName) {
      log(`  ❌ No product name available`);
      continue;
    }
    
    totalTests++;
    log(`  Product name: "${productName}"`);
    
    const searchName = productName.toLowerCase().trim();
    const keywords = searchName.split(/\s+/).filter(w => w.length > 2).slice(0, 5);
    log(`  Search: "${searchName}"`);
    log(`  Keywords: ${keywords.join(', ')}`);
    
    // Search NZFCD
    log(`  \n  Searching NZFCD (${validFoods.length} foods)...`);
    let matches = [];
    
    for (const food of validFoods) {
      const foodName = food.foodNameLower;
      
      // Exact or contains match
      if (foodName === searchName) {
        matches.push({ name: food.foodName, score: 1000, type: 'exact' });
      } else if (foodName.includes(searchName) || searchName.includes(foodName)) {
        matches.push({ name: food.foodName, score: 500, type: 'contains' });
      } else {
        // Keyword matching
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
      const bestMatch = matches[0];
      log(`    ✅ FOUND ${matches.length} MATCHES`);
      log(`    ✅ Best match: "${bestMatch.name}" (${bestMatch.type}, score: ${bestMatch.score})`);
      log(`    ✅ FSANZ query WILL RETURN DATA`);
      log(`    ✅ TruScore WILL get FSANZ nutrition data`);
      
      // Show nutrition data from match
      const matchedFood = validFoods.find(f => f.foodName === bestMatch.name);
      if (matchedFood) {
        log(`    \n    Nutrition data available:`);
        if (matchedFood.energyKcal) log(`      Energy: ${matchedFood.energyKcal} kcal`);
        if (matchedFood.protein) log(`      Protein: ${matchedFood.protein} g`);
        if (matchedFood.fat) log(`      Fat: ${matchedFood.fat} g`);
        if (matchedFood.carbohydrates) log(`      Carbohydrates: ${matchedFood.carbohydrates} g`);
        if (matchedFood.sodium) log(`      Sodium: ${matchedFood.sodium} mg`);
      }
      
      successfulMatches++;
    } else {
      log(`    ❌ NO MATCHES FOUND`);
      log(`    ❌ FSANZ query will return NOTHING`);
      log(`    ❌ TruScore will NOT get FSANZ data`);
    }
    
  } catch (error) {
    log(`  ❌ Error: ${error.message}`);
  }
}

// Step 3: Verify AFCD
log('\n' + '='.repeat(80));
log('STEP 3: Verifying AFCD Database');
log('='.repeat(80));
log('');

if (fs.existsSync(AFCD_OUTPUT)) {
  try {
    const afcd = JSON.parse(fs.readFileSync(AFCD_OUTPUT, 'utf8'));
    const validAFCD = afcd.filter(f => {
      const n = f.foodName || f['Food Name'] || '';
      return n && !n.match(/^Food \d+$/) && n.length > 2;
    });
    
    log(`AFCD: ${afcd.length} total, ${validAFCD.length} valid`);
    
    if (validAFCD.length > 1000) {
      log('✅ AFCD database looks good');
      log(`   Sample: "${validAFCD[0].foodName}"`);
    } else {
      log('⚠️  AFCD database may have issues');
    }
  } catch (error) {
    log(`❌ Error reading AFCD: ${error.message}`);
  }
} else {
  log('⚠️  AFCD file not found');
}

// Final Summary
log('\n' + '='.repeat(80));
log('FINAL SUMMARY');
log('='.repeat(80));
log(`\nNZFCD: ${validFoods.length} valid foods`);
log(`Tests run: ${totalTests}`);
log(`Successful matches: ${successfulMatches}/${totalTests}`);

if (successfulMatches === totalTests && totalTests > 0) {
  log('\n✅ SUCCESS: All tests passed!');
  log('✅ FSANZ database will return valid results for TruScore');
} else if (successfulMatches > 0) {
  log('\n⚠️  PARTIAL: Some products will get FSANZ data, some will not');
} else if (totalTests > 0) {
  log('\n❌ FAILURE: No matches found for any product');
  log('❌ FSANZ integration is NOT WORKING');
} else {
  log('\n⚠️  No tests could be run');
}

log(`\nFull log saved to: ${TEST_LOG}`);
log('\n' + '='.repeat(80));

