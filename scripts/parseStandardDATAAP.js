/**
 * Parse Standard DATA.AP file (tab-delimited format)
 * This file contains ~2,860 foods with all nutrients in columns
 */

const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, '..', 'Database files', 'Principal files', 'ASCII Text Files', 'Standard', 'Standard DATA.AP');
const OUTPUT_DIR = path.join(__dirname, '..', 'backend', 'vercel', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'nzfcd.json');

console.log('========================================');
console.log('Parse Standard DATA.AP to NZFCD JSON');
console.log('========================================');
console.log('');

if (!fs.existsSync(INPUT_FILE)) {
  console.error(`❌ Input file not found: ${INPUT_FILE}`);
  process.exit(1);
}

console.log(`Reading: ${INPUT_FILE}`);

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

console.log(`Found ${dataLines.length} data rows`);
console.log(`Header columns: ${headerRow1.length}`);

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

console.log('\nColumn indices:');
Object.keys(colIndices).forEach(key => {
  if (colIndices[key] >= 0) {
    console.log(`  ${key}: ${colIndices[key]} (${headerRow1[colIndices[key]]})`);
  }
});

const foods = [];
const seenFoodIds = new Set();

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
  
  if ((i + 1) % 500 === 0) {
    console.log(`  Processed ${i + 1}/${dataLines.length} lines...`);
  }
}

console.log(`\n✅ Parsed ${foods.length} unique foods`);

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Write JSON file
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(foods, null, 2), 'utf8');

const fileSize = fs.statSync(OUTPUT_FILE).size;
const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);

console.log(`\n✅ Generated NZFCD database:`);
console.log(`   Foods: ${foods.length.toLocaleString()}`);
console.log(`   Size: ${fileSizeMB} MB`);
console.log(`   Output: ${OUTPUT_FILE}`);
console.log(`\n💡 Expected: ~2,860 foods`);

if (foods.length < 2000) {
  console.log(`\n⚠️  WARNING: Only ${foods.length} foods found. Expected ~2,860.`);
} else if (foods.length >= 2800) {
  console.log(`\n✅ SUCCESS: Found ${foods.length} foods (expected ~2,860)`);
}

console.log(`\n========================================`);
console.log('Next step: Deploy to Vercel');
console.log('  cd backend/vercel && vercel --prod');
console.log('========================================`);

