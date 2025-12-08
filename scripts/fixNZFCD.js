/**
 * Fix NZFCD Database - Properly parse Standard DATA.AP
 */

const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, '..', 'Database files', 'Principal files', 'ASCII Text Files', 'Standard', 'Standard DATA.AP');
const OUTPUT_FILE = path.join(__dirname, '..', 'backend', 'vercel', 'data', 'nzfcd.json');

console.log('Fixing NZFCD database...');
console.log(`Input: ${INPUT_FILE}`);
console.log(`Output: ${OUTPUT_FILE}\n`);

if (!fs.existsSync(INPUT_FILE)) {
  console.error(`❌ Input file not found: ${INPUT_FILE}`);
  process.exit(1);
}

const content = fs.readFileSync(INPUT_FILE, 'utf8');
const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('©'));

console.log(`Total lines: ${lines.length}`);

// Line 0: Copyright (skipped)
// Line 1: Header row 1 (column names)
// Line 2: Header row 2 (units)
// Line 3+: Data rows

if (lines.length < 3) {
  console.error('❌ Invalid file format');
  process.exit(1);
}

const headerRow1 = lines[1].split('~');
const headerRow2 = lines[2].split('~');
const dataLines = lines.slice(3);

console.log(`Header columns: ${headerRow1.length}`);
console.log(`Data rows: ${dataLines.length}`);

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

console.log('\nColumn indices:');
Object.keys(colIndices).forEach(key => {
  if (colIndices[key] >= 0) {
    console.log(`  ${key}: ${colIndices[key]} (${headerRow1[colIndices[key]]})`);
  }
});

const foods = [];
const seenFoodIds = new Set();

console.log('\nProcessing data...');

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
  
  const parseVal = (idx) => {
    if (idx < 0 || idx >= parts.length) return undefined;
    const val = parts[idx]?.trim();
    if (!val || val === '' || val === '~~') return undefined;
    const num = parseFloat(val);
    return isNaN(num) ? undefined : num;
  };
  
  const food = {
    foodName: foodName,
    foodNameLower: foodName.toLowerCase().trim(),
    foodGroup: undefined,
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
  };
  
  foods.push(food);
  
  if ((i + 1) % 500 === 0) {
    console.log(`  Processed ${i + 1}/${dataLines.length}...`);
  }
}

console.log(`\n✅ Parsed ${foods.length} unique foods`);

// Ensure output directory exists
const outputDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write JSON file
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(foods, null, 2), 'utf8');

const fileSize = fs.statSync(OUTPUT_FILE).size;
const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);

console.log(`\n✅ Generated NZFCD database:`);
console.log(`   Foods: ${foods.length.toLocaleString()}`);
console.log(`   Size: ${fileSizeMB} MB`);
console.log(`   Output: ${OUTPUT_FILE}`);

if (foods.length < 2000) {
  console.log(`\n⚠️  WARNING: Only ${foods.length} foods found. Expected ~2,860.`);
} else if (foods.length >= 2800) {
  console.log(`\n✅ SUCCESS: Found ${foods.length} foods (expected ~2,860)`);
}

// Verify first few entries
console.log('\nFirst 5 entries:');
foods.slice(0, 5).forEach((f, i) => {
  console.log(`  ${i+1}. "${f.foodName}"`);
});

console.log('\n✅ Database fixed and ready!');

