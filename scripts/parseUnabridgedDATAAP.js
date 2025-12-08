/**
 * Parse Unabridged DATA.AP file (tab-delimited format)
 * This file contains ~221,000+ foods with all nutrients in columns
 * This is the FULL database, not the Standard subset
 */

const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, '..', 'Database files', 'Principal files', 'ASCII Text Files', 'Unabridged', 'Unabridged DATA.AP');
const OUTPUT_DIR = path.join(__dirname, '..', 'backend', 'vercel', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'nzfcd.json');

console.log('========================================');
console.log('Parse Unabridged DATA.AP to NZFCD JSON');
console.log('========================================');
console.log('');
console.log('⚠️  This is the FULL database (~221,000+ foods)');
console.log('   Processing may take several minutes...');
console.log('');

if (!fs.existsSync(INPUT_FILE)) {
  console.error(`❌ Input file not found: ${INPUT_FILE}`);
  process.exit(1);
}

console.log(`Reading: ${INPUT_FILE}`);

const fileStats = fs.statSync(INPUT_FILE);
console.log(`File size: ${(fileStats.size / 1024 / 1024).toFixed(2)} MB`);
console.log('');

const content = fs.readFileSync(INPUT_FILE, 'utf8');
// Handle both \r\n and \n line endings
const lines = content.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0 && !line.startsWith('©'));

// Line 0: Copyright
// Line 1: Header row 1 (column names)
// Line 2: Header row 2 (units)
// Line 3+: Data rows

if (lines.length < 3) {
  console.error('❌ Invalid file format');
  process.exit(1);
}

// File structure: Line 0 = Copyright, Line 1 = Header 1, Line 2 = Header 2, Line 3+ = Data
// After filtering copyright, lines[0] should be Header 1, lines[1] should be Header 2, lines[2+] should be data
const headerRow1 = lines[0].split('~');
const headerRow2 = lines[1]?.split('~') || [];
const dataLines = lines.slice(2);

console.log(`Found ${dataLines.length.toLocaleString()} data rows`);
console.log(`Header columns: ${headerRow1.length}`);
console.log('');

// Find column indices for key nutrients
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

// Map column names to indices
// Based on Standard DATA.AP format: FoodID~Food Name~Alcohol~Alpha-carotene~...~Energy (kcal)~...
// Energy (kcal) is at index 25, Energy (kJ) is at index 27, Protein is at index 58, etc.
const colIndices = {
  foodId: 0,
  foodName: 1,
  // Energy columns (from header analysis)
  energyKcal: findColumnIndex(['energy, total metabolisable (kcal)', 'energy (kcal)', 'enerc_kcal']) || 25,
  energyKj: findColumnIndex(['energy, total metabolisable (kj)', 'energy (kj)', 'enerc']) || 27,
  // Macronutrients
  protein: findColumnIndex(['protein, total', 'protein', 'procnt']) || 58,
  fat: findColumnIndex(['fat, total', 'fat']) || 28,
  saturatedFat: findColumnIndex(['fatty acids, total saturated', 'saturated', 'fasat']) || 40,
  carbohydrates: findColumnIndex(['total carbohydrate by difference', 'carbohydrate', 'chocdf']) || 14,
  sugars: findColumnIndex(['sugars, total', 'sugars', 'sugar']) || 70,
  dietaryFiber: findColumnIndex(['fibre, total dietary', 'fiber', 'dietary', 'fibtg']) || 42,
  // Minerals
  calcium: findColumnIndex(['calcium', 'ca']) || 13,
  iron: findColumnIndex(['iron', 'fe']) || 50,
  sodium: findColumnIndex(['sodium', 'na']) || 59,
  magnesium: findColumnIndex(['magnesium', 'mg']) || 52,
  phosphorus: findColumnIndex(['phosphorus', 'p']) || 55,
  potassium: findColumnIndex(['potassium', 'k']) || 56,
  zinc: findColumnIndex(['zinc', 'zn']) || 80,
  copper: findColumnIndex(['copper', 'cu']) || 17,
  manganese: findColumnIndex(['manganese', 'mn']) || 53,
  selenium: findColumnIndex(['selenium', 'se']) || 60,
  // Vitamins
  vitaminA: findColumnIndex(['vitamin a, retinol activity equivalents', 'vitamin a', 'vita_rae']) || 77,
  vitaminC: findColumnIndex(['vitamin c', 'vitc']) || 79,
  vitaminD: findColumnIndex(['vitamin d', 'vitd']) || 78,
  vitaminE: findColumnIndex(['vitamin e, alpha-tocopherol equivalents', 'vitamin e', 'tocpha']) || 80,
  thiamin: findColumnIndex(['thiamin', 'vitamin b1', 'thia']) || 71,
  riboflavin: findColumnIndex(['riboflavin', 'vitamin b2', 'ribf']) || 61,
  niacin: findColumnIndex(['niacin equivalents, total', 'niacin', 'nia']) || 54,
  vitaminB6: findColumnIndex(['vitamin b6', 'vitb6a']) || 80,
  folate: findColumnIndex(['dietary folate equivalents', 'folate', 'foldfe']) || 19,
  vitaminB12: findColumnIndex(['vitamin b12', 'vitb12']) || 78,
};

console.log('Column indices:');
Object.keys(colIndices).forEach(key => {
  if (colIndices[key] >= 0) {
    console.log(`  ${key}: ${colIndices[key]} (${headerRow1[colIndices[key]]})`);
  }
});
console.log('');

const foods = [];
const seenFoodIds = new Set();
let processed = 0;
const startTime = Date.now();

console.log('Processing foods...');
console.log('(This may take several minutes for 221,000+ foods)');
console.log('');

for (let i = 0; i < dataLines.length; i++) {
  const line = dataLines[i];
  const parts = line.split('~');
  
  if (parts.length < 2) continue;
  
  const foodId = parts[colIndices.foodId]?.trim();
  const foodName = parts[colIndices.foodName]?.trim();
  
  if (!foodId || !foodName || foodName.length < 2) continue;
  
  // Skip duplicates
  if (seenFoodIds.has(foodId)) continue;
  seenFoodIds.add(foodId);
  
  const parseValue = (colIndex) => {
    if (colIndex < 0 || colIndex >= parts.length) return undefined;
    const val = parts[colIndex]?.trim();
    if (!val || val === '' || val === '~~') return undefined;
    const num = parseFloat(val);
    return isNaN(num) ? undefined : num;
  };
  
  const food = {
    foodName: foodName,
    foodNameLower: foodName.toLowerCase().trim(),
    foodGroup: undefined, // Not in DATA.AP format
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
    sodium: parseValue(colIndices.sodium),
    salt: parseValue(colIndices.sodium) ? parseValue(colIndices.sodium) * 2.54 : undefined,
    magnesium: parseValue(colIndices.magnesium),
    phosphorus: parseValue(colIndices.phosphorus),
    potassium: parseValue(colIndices.potassium),
    zinc: parseValue(colIndices.zinc),
    copper: parseValue(colIndices.copper),
    manganese: parseValue(colIndices.manganese),
    selenium: parseValue(colIndices.selenium),
    vitaminA: parseValue(colIndices.vitaminA),
    vitaminC: parseValue(colIndices.vitaminC),
    vitaminD: parseValue(colIndices.vitaminD),
    vitaminE: parseValue(colIndices.vitaminE),
    thiamin: parseValue(colIndices.thiamin),
    riboflavin: parseValue(colIndices.riboflavin),
    niacin: parseValue(colIndices.niacin),
    vitaminB6: parseValue(colIndices.vitaminB6),
    folate: parseValue(colIndices.folate),
    vitaminB12: parseValue(colIndices.vitaminB12),
  };
  
  foods.push(food);
  processed++;
  
  // Progress update every 10,000 foods
  if (processed % 10000 === 0) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const rate = (processed / elapsed).toFixed(0);
    const remaining = dataLines.length - processed;
    const eta = remaining > 0 ? ((remaining / rate) / 60).toFixed(1) : 0;
    process.stdout.write(`\r  Processed ${processed.toLocaleString()}/${dataLines.length.toLocaleString()} (${rate} foods/sec, ~${eta} min remaining)...`);
  }
}

console.log(`\n\n✅ Parsed ${foods.length.toLocaleString()} unique foods`);
console.log(`   Processing time: ${((Date.now() - startTime) / 1000).toFixed(1)} seconds`);

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('\nWriting JSON file...');
console.log('(This may take a few minutes for large database)');
const writeStartTime = Date.now();

// Write JSON file
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(foods, null, 2), 'utf8');

const writeTime = ((Date.now() - writeStartTime) / 1000).toFixed(1);
const fileSize = fs.statSync(OUTPUT_FILE).size;
const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);

console.log(`\n✅ Generated NZFCD database:`);
console.log(`   Foods: ${foods.length.toLocaleString()}`);
console.log(`   Size: ${fileSizeMB} MB`);
console.log(`   Write time: ${writeTime} seconds`);
console.log(`   Output: ${OUTPUT_FILE}`);
console.log(`\n💡 Expected: ~221,000+ foods`);

if (foods.length < 100000) {
  console.log(`\n⚠️  WARNING: Only ${foods.length.toLocaleString()} foods found. Expected ~221,000+.`);
  console.log(`   This might be correct if the Unabridged file has a different structure.`);
} else if (foods.length >= 200000) {
  console.log(`\n✅ SUCCESS: Found ${foods.length.toLocaleString()} foods (expected ~221,000+)`);
}

console.log(`\n========================================`);
console.log('Next step: Deploy to Vercel');
console.log('  cd backend/vercel && vercel --prod');
console.log('========================================`);

