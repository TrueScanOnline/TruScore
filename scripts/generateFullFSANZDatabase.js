/**
 * Generate Full FSANZ Database from Unabridged DATA.AP
 * This script will generate the full 221,000+ foods database
 */

const fs = require('fs');
const path = require('path');

const UNABRIDGED_FILE = path.join(__dirname, '..', 'Database files', 'Principal files', 'ASCII Text Files', 'Unabridged', 'Unabridged DATA.AP');
const STANDARD_FILE = path.join(__dirname, '..', 'Database files', 'Principal files', 'ASCII Text Files', 'Standard', 'Standard DATA.AP');
const OUTPUT_DIR = path.join(__dirname, '..', 'backend', 'vercel', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'nzfcd.json');

console.log('='.repeat(80));
console.log('GENERATE FULL FSANZ DATABASE FROM UNABRIDGED DATA.AP');
console.log('='.repeat(80));
console.log('');

// Step 1: Analyze both files
console.log('Step 1: Analyzing files...');
const standardStats = fs.statSync(STANDARD_FILE);
const unabridgedStats = fs.statSync(UNABRIDGED_FILE);

console.log(`Standard DATA.AP: ${(standardStats.size / 1024 / 1024).toFixed(2)} MB`);
console.log(`Unabridged DATA.AP: ${(unabridgedStats.size / 1024 / 1024).toFixed(2)} MB`);
console.log(`Ratio: ${(unabridgedStats.size / standardStats.size).toFixed(2)}x larger`);
console.log('');

// Step 2: Read and parse Unabridged file
console.log('Step 2: Reading Unabridged DATA.AP...');
console.log('(This may take a minute for large file)');
const content = fs.readFileSync(UNABRIDGED_FILE, 'utf8');
const allLines = content.split(/\r?\n/);
const lines = allLines.map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('©'));

console.log(`Total lines: ${allLines.length.toLocaleString()}`);
console.log(`Filtered lines: ${lines.length.toLocaleString()}`);
console.log('');

if (lines.length < 3) {
  console.error('❌ Invalid file format');
  process.exit(1);
}

// Step 3: Parse structure
const headerRow1 = lines[0].split('~');
const dataLines = lines.slice(2);

console.log(`Header columns: ${headerRow1.length}`);
console.log(`Data lines: ${dataLines.length.toLocaleString()}`);
console.log('');

// Step 4: Find column indices
const findColumnIndex = (searchTerms) => {
  for (let i = 0; i < headerRow1.length; i++) {
    const col = (headerRow1[i] || '').toLowerCase();
    for (const term of searchTerms) {
      if (col.includes(term.toLowerCase())) {
        return i;
      }
    }
  }
  return -1;
};

const colIndices = {
  foodId: 0,
  foodName: 1,
  energyKcal: findColumnIndex(['energy, total metabolisable (kcal)', 'energy (kcal)', 'enerc_kcal']) || 25,
  energyKj: findColumnIndex(['energy, total metabolisable (kj)', 'energy (kj)', 'enerc']) || 27,
  protein: findColumnIndex(['protein, total', 'protein', 'procnt']) || 58,
  fat: findColumnIndex(['fat, total', 'fat']) || 28,
  saturatedFat: findColumnIndex(['fatty acids, total saturated', 'saturated', 'fasat']) || 40,
  carbohydrates: findColumnIndex(['total carbohydrate by difference', 'carbohydrate', 'chocdf']) || 14,
  sugars: findColumnIndex(['sugars, total', 'sugars', 'sugar']) || 70,
  dietaryFiber: findColumnIndex(['fibre, total dietary', 'fiber', 'dietary', 'fibtg']) || 42,
  calcium: findColumnIndex(['calcium', 'ca']) || 13,
  iron: findColumnIndex(['iron', 'fe']) || 50,
  sodium: findColumnIndex(['sodium', 'na']) || 59,
  salt: findColumnIndex(['sodium', 'na']) || 59, // Will calculate from sodium
};

// Step 5: Process all foods
console.log('Step 3: Processing foods...');
console.log('(This will take several minutes for 221,000+ foods)');
console.log('');

const foods = [];
const seenFoodIds = new Set();
let processed = 0;
let skipped = 0;
const startTime = Date.now();

for (let i = 0; i < dataLines.length; i++) {
  const line = dataLines[i];
  const parts = line.split('~');
  
  if (parts.length < 2) {
    skipped++;
    continue;
  }
  
  const foodId = parts[colIndices.foodId]?.trim();
  const foodName = parts[colIndices.foodName]?.trim();
  
  if (!foodId || !foodName || foodName.length < 2) {
    skipped++;
    continue;
  }
  
  // Skip duplicates
  if (seenFoodIds.has(foodId)) {
    skipped++;
    continue;
  }
  seenFoodIds.add(foodId);
  
  const parseValue = (colIndex) => {
    if (colIndex < 0 || colIndex >= parts.length) return undefined;
    const val = parts[colIndex]?.trim();
    if (!val || val === '' || val === '~~') return undefined;
    const num = parseFloat(val);
    return isNaN(num) ? undefined : num;
  };
  
  const sodium = parseValue(colIndices.sodium);
  
  foods.push({
    foodName: foodName,
    foodNameLower: foodName.toLowerCase().trim(),
    energyKcal: parseValue(colIndices.energyKcal),
    energyKj: parseValue(colIndices.energyKj),
    protein: parseValue(colIndices.protein),
    fat: parseValue(colIndices.fat),
    saturatedFat: parseValue(colIndices.saturatedFat),
    carbohydrates: parseValue(colIndices.carbohydrates),
    sugars: parseValue(colIndices.sugars),
    dietaryFiber: parseValue(colIndices.dietaryFiber),
    calcium: parseValue(colIndices.calcium),
    iron: parseValue(colIndices.iron),
    sodium: sodium,
    salt: sodium ? sodium * 2.54 : undefined,
  });
  
  processed++;
  
  // Progress update every 10,000 foods
  if (processed % 10000 === 0) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const rate = (processed / elapsed).toFixed(0);
    const remaining = dataLines.length - processed - skipped;
    const eta = remaining > 0 ? ((remaining / rate) / 60).toFixed(1) : 0;
    process.stdout.write(`\r  Processed ${processed.toLocaleString()}/${dataLines.length.toLocaleString()} (${rate} foods/sec, ~${eta} min remaining, ${seenFoodIds.size.toLocaleString()} unique)...`);
  }
}

console.log(`\n\n✅ Processing complete:`);
console.log(`   Processed: ${processed.toLocaleString()} foods`);
console.log(`   Unique: ${seenFoodIds.size.toLocaleString()} foods`);
console.log(`   Skipped: ${skipped.toLocaleString()} lines`);
console.log(`   Processing time: ${((Date.now() - startTime) / 1000).toFixed(1)} seconds`);
console.log('');

// Step 6: Filter valid foods
const valid = foods.filter(f => f.foodName && !f.foodName.match(/^Food \d+$/) && f.foodName.length > 2);
console.log(`Valid foods: ${valid.length.toLocaleString()}`);
console.log('');

if (valid.length < 100000) {
  console.log(`⚠️  WARNING: Only ${valid.length.toLocaleString()} foods found. Expected ~221,000+.`);
  console.log(`   This might indicate a parsing issue.`);
} else {
  console.log(`✅ SUCCESS: Found ${valid.length.toLocaleString()} foods (expected ~221,000+)`);
}

console.log('\nFirst 5 foods:');
valid.slice(0, 5).forEach((f, i) => {
  console.log(`  ${i+1}. ${f.foodName.substring(0, 70)}`);
});
console.log('');

// Step 7: Write database
console.log('Step 4: Writing database...');
console.log('(This may take a few minutes for large database)');
const writeStartTime = Date.now();

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Delete old database
if (fs.existsSync(OUTPUT_FILE)) {
  fs.unlinkSync(OUTPUT_FILE);
  console.log('✅ Deleted old database');
}

// Write JSON file
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(valid, null, 2), 'utf8');

const writeTime = ((Date.now() - writeStartTime) / 1000).toFixed(1);
const fileSize = fs.statSync(OUTPUT_FILE).size;
const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);

console.log(`✅ Database written:`);
console.log(`   Foods: ${valid.length.toLocaleString()}`);
console.log(`   Size: ${fileSizeMB} MB`);
console.log(`   Write time: ${writeTime} seconds`);
console.log(`   File: ${OUTPUT_FILE}`);
console.log('');

// Step 8: Verify
console.log('Step 5: Verifying database...');
const verify = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
console.log(`  Total: ${verify.length.toLocaleString()}`);
console.log(`  First: "${verify[0].foodName}"`);
console.log(`  Has rawData: ${!!verify[0].rawData}`);

if (verify[0].foodName.match(/^Food \d+$/) || verify[0].rawData) {
  console.error('\n❌ ERROR: Database still broken!');
  process.exit(1);
}

console.log('\n✅ SUCCESS: Full FSANZ database generated correctly!');
console.log(`   Ready for TruScore integration with ${verify.length.toLocaleString()} foods`);
console.log('');
console.log('='.repeat(80));
console.log('Next step: Deploy to Vercel');
console.log('  cd backend/vercel && vercel --prod');
console.log('='.repeat(80));

