/**
 * Force Fix NZFCD - Direct parsing from text file
 */

const fs = require('fs');
const path = require('path');

const TEXT_FILE = path.join(__dirname, '..', 'Database files', 'Principal files', 'ASCII Text Files', 'Standard', 'Standard DATA.AP');
const OUTPUT_FILE = path.join(__dirname, '..', 'backend', 'vercel', 'data', 'nzfcd.json');

console.log('FORCE FIXING NZFCD DATABASE');
console.log('='.repeat(80));
console.log(`Input: ${TEXT_FILE}`);
console.log(`Output: ${OUTPUT_FILE}\n`);

if (!fs.existsSync(TEXT_FILE)) {
  console.error(`❌ File not found: ${TEXT_FILE}`);
  process.exit(1);
}

// Read and parse
const content = fs.readFileSync(TEXT_FILE, 'utf8');
const allLines = content.split('\n');
const lines = allLines.map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('©'));

console.log(`Total lines: ${allLines.length}`);
console.log(`Filtered lines: ${lines.length}`);

if (lines.length < 4) {
  console.error('❌ Invalid file');
  process.exit(1);
}

// Verify first data line
const firstData = lines[3];
const firstParts = firstData.split('~');
console.log(`\nFirst data line:`);
console.log(`  Food ID: ${firstParts[0]}`);
console.log(`  Food Name: ${firstParts[1]}`);

if (!firstParts[1] || firstParts[1].match(/^Food \d+$/)) {
  console.error('❌ First food name is invalid!');
  process.exit(1);
}

const headerRow1 = lines[1].split('~');
const dataLines = lines.slice(3);

console.log(`\nHeader columns: ${headerRow1.length}`);
console.log(`Data rows: ${dataLines.length}`);

// Column indices
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

console.log('\nProcessing...');

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
    console.log(`  ${i + 1}/${dataLines.length}...`);
  }
}

console.log(`\n✅ Parsed ${foods.length} foods`);

// Verify
const valid = foods.filter(f => f.foodName && !f.foodName.match(/^Food \d+$/));
console.log(`Valid: ${valid.length}`);

if (valid.length < 100) {
  console.error('❌ Not enough valid foods!');
  process.exit(1);
}

console.log('\nFirst 5 foods:');
valid.slice(0, 5).forEach((f, i) => {
  console.log(`  ${i+1}. "${f.foodName}"`);
});

// Write
const outputDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Delete old file first
if (fs.existsSync(OUTPUT_FILE)) {
  fs.unlinkSync(OUTPUT_FILE);
  console.log('\nDeleted old database');
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(valid, null, 2), 'utf8');

const fileSize = (fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(2);
console.log(`\n✅ Database written: ${valid.length} foods, ${fileSize} MB`);
console.log(`   File: ${OUTPUT_FILE}`);

// Verify it was written correctly
const verify = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
console.log(`\n✅ Verification: ${verify.length} entries`);
console.log(`   First entry: "${verify[0].foodName}"`);

if (verify[0].foodName.match(/^Food \d+$/)) {
  console.error('\n❌ ERROR: Database still broken!');
  process.exit(1);
}

console.log('\n✅ SUCCESS: Database fixed!');

