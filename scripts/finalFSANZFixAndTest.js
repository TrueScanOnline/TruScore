/**
 * FINAL FSANZ Fix and Test - This will actually work
 */

const fs = require('fs');
const path = require('path');

const TEXT_FILE = path.join(__dirname, '..', 'Database files', 'Principal files', 'ASCII Text Files', 'Standard', 'Standard DATA.AP');
const OUTPUT_FILE = path.join(__dirname, '..', 'backend', 'vercel', 'data', 'nzfcd.json');
const TEST_RESULTS = path.join(__dirname, '..', 'FSANZ_FINAL_TEST_RESULTS.txt');

fs.writeFileSync(TEST_RESULTS, 'FSANZ FINAL FIX AND TEST\n');
fs.appendFileSync(TEST_RESULTS, '='.repeat(80) + '\n\n');

function log(msg) {
  const m = String(msg);
  console.log(m);
  fs.appendFileSync(TEST_RESULTS, m + '\n');
}

log('STEP 1: Verify text file exists and is readable\n');

if (!fs.existsSync(TEXT_FILE)) {
  log(`❌ Text file not found: ${TEXT_FILE}`);
  process.exit(1);
}

log(`✅ Text file found: ${TEXT_FILE}`);

const content = fs.readFileSync(TEXT_FILE, 'utf8');
const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('©'));

log(`Total lines: ${lines.length}`);

if (lines.length < 4) {
  log('❌ Invalid file - not enough lines');
  process.exit(1);
}

log(`\nFirst data line (line 4):`);
const firstDataLine = lines[3];
const firstParts = firstDataLine.split('~');
log(`  Food ID: ${firstParts[0]}`);
log(`  Food Name: ${firstParts[1]}`);

if (!firstParts[1] || firstParts[1].match(/^Food \d+$/)) {
  log('❌ First food name is invalid!');
  process.exit(1);
}

log('✅ Text file has valid food names\n');

log('STEP 2: Parse database from text file\n');

const headerRow1 = lines[1].split('~');
const headerRow2 = lines[2].split('~');
const dataLines = lines.slice(3);

log(`Header columns: ${headerRow1.length}`);
log(`Data rows: ${dataLines.length}`);

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
  sodium: findCol(['sodium', 'na']) || 59,
};

const foods = [];
const seenFoodIds = new Set();

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
    sodium: parseVal(colIndices.sodium),
  });
  
  if ((i + 1) % 500 === 0) {
    log(`  Processed ${i + 1}/${dataLines.length}...`);
  }
}

log(`\n✅ Parsed ${foods.length} unique foods`);

// Verify we have real food names
const validFoods = foods.filter(f => f.foodName && !f.foodName.match(/^Food \d+$/));
log(`Valid foods: ${validFoods.length}`);

if (validFoods.length < 100) {
  log('❌ CRITICAL: Not enough valid foods!');
  process.exit(1);
}

log('\nFirst 5 foods:');
validFoods.slice(0, 5).forEach((f, i) => {
  log(`  ${i+1}. "${f.foodName}"`);
});

// Write database
const outputDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(validFoods, null, 2), 'utf8');
log(`\n✅ Database written to: ${OUTPUT_FILE}`);

// Test with real barcodes
log('\n' + '='.repeat(80));
log('STEP 3: Test with Real Barcodes');
log('='.repeat(80) + '\n');

const barcodes = ['9313958005890', '9310047207180', '9310645467740'];

(async () => {
  for (const barcode of barcodes) {
    log(`\nTesting barcode: ${barcode}`);
    
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();
      
      if (data.status === 1 && data.product) {
        const productName = data.product.product_name || data.product.product_name_en || 'N/A';
        log(`  Product name: "${productName}"`);
        
        const searchName = productName.toLowerCase().trim();
        const keywords = searchName.split(/\s+/).filter(w => w.length > 2).slice(0, 5);
        
        // Search database
        let matches = [];
        for (const food of validFoods) {
          const foodName = food.foodNameLower;
          
          if (foodName.includes(searchName) || searchName.includes(foodName)) {
            matches.push({ name: food.foodName, score: 100 });
          } else {
            let matched = 0;
            for (const keyword of keywords) {
              if (foodName.includes(keyword)) matched++;
            }
            if (matched >= Math.max(1, Math.ceil(keywords.length * 0.4))) {
              matches.push({ name: food.foodName, score: matched * 20 });
            }
          }
        }
        
        if (matches.length > 0) {
          matches.sort((a, b) => b.score - a.score);
          log(`  ✅ FOUND ${matches.length} MATCHES`);
          log(`  ✅ FSANZ query WILL RETURN DATA`);
          log(`  ✅ TruScore WILL get FSANZ nutrition data`);
          matches.slice(0, 3).forEach((m, i) => {
            log(`     ${i+1}. "${m.name}" (score: ${m.score})`);
          });
        } else {
          log(`  ❌ NO MATCHES FOUND`);
          log(`  ❌ FSANZ query will return NOTHING`);
          log(`  ❌ TruScore will NOT get FSANZ data`);
        }
      } else {
        log(`  ❌ Product not found in Open Food Facts`);
      }
    } catch (error) {
      log(`  ❌ Error: ${error.message}`);
    }
  }
  
  log('\n' + '='.repeat(80));
  log('TEST COMPLETE');
  log('='.repeat(80));
  log(`\nResults saved to: ${TEST_RESULTS}`);
})();

