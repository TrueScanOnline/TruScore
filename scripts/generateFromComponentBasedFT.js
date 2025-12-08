/**
 * Generate FSANZ Database from Component-Based DATA.FT File
 * DATA.FT files have one row per nutrient component (not one row per food)
 * This script aggregates components by FoodID to create food records
 */

const fs = require('fs');
const path = require('path');

const UNABRIDGED_FT = path.join(__dirname, '..', 'Database files', 'Principal files', 'ASCII Text Files', 'Unabridged', 'Unabridged DATA.FT');
const OUTPUT_DIR = path.join(__dirname, '..', 'backend', 'vercel', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'nzfcd.json');

console.log('='.repeat(80));
console.log('GENERATE FSANZ DATABASE FROM COMPONENT-BASED DATA.FT');
console.log('='.repeat(80));
console.log('');

if (!fs.existsSync(UNABRIDGED_FT)) {
  console.error(`❌ File not found: ${UNABRIDGED_FT}`);
  process.exit(1);
}

const stats = fs.statSync(UNABRIDGED_FT);
console.log(`File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
console.log('');

console.log('Reading file...');
const content = fs.readFileSync(UNABRIDGED_FT, 'utf8');
const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('©'));

if (lines.length < 3) {
  console.error('❌ Invalid file format');
  process.exit(1);
}

const header = lines[0].split('~');
const dataLines = lines.slice(2);

console.log(`Header columns: ${header.length}`);
console.log(`Data lines: ${dataLines.length.toLocaleString()}`);
console.log('');

// Find column indices
const findCol = (searchTerms) => {
  for (let i = 0; i < header.length; i++) {
    const col = (header[i] || '').toLowerCase();
    for (const term of searchTerms) {
      if (col.includes(term.toLowerCase())) {
        return i;
      }
    }
  }
  return -1;
};

const colIndices = {
  foodId: findCol(['foodid', 'food id']) || 0,
  foodName: findCol(['food name', 'foodname', 'name']) || 1,
  componentId: findCol(['component', 'componentid', 'component id', 'nutrient']) || 2,
  value: findCol(['value', 'amount']) || 3,
  unit: findCol(['unit', 'unit code']) || 4,
};

console.log('Column indices:');
Object.keys(colIndices).forEach(key => {
  if (colIndices[key] >= 0) {
    console.log(`  ${key}: ${colIndices[key]} (${header[colIndices[key]]})`);
  }
});
console.log('');

// Aggregate components by FoodID
console.log('Aggregating components by FoodID...');
console.log('(This will take several minutes for 221,000+ component records)');
console.log('');

const foodsMap = new Map(); // FoodID -> food object
let processed = 0;
const startTime = Date.now();

// Component name mappings (common nutrient names)
const componentMap = {
  'ENERC': 'energyKj',
  'ENERC_KCAL': 'energyKcal',
  'PROCNT': 'protein',
  'FAT': 'fat',
  'FASAT': 'saturatedFat',
  'CHOCDF': 'carbohydrates',
  'SUGAR': 'sugars',
  'FIBTG': 'dietaryFiber',
  'CA': 'calcium',
  'FE': 'iron',
  'NA': 'sodium',
};

for (let i = 0; i < dataLines.length; i++) {
  const line = dataLines[i];
  const parts = line.split('~');
  
  if (parts.length < 3) continue;
  
  const foodId = parts[colIndices.foodId]?.trim();
  const foodName = parts[colIndices.foodName]?.trim();
  const componentId = parts[colIndices.componentId]?.trim();
  const valueStr = parts[colIndices.value]?.trim();
  
  if (!foodId || !foodName || !componentId) continue;
  
  // Get or create food record
  if (!foodsMap.has(foodId)) {
    foodsMap.set(foodId, {
      foodId: foodId,
      foodName: foodName,
      foodNameLower: foodName.toLowerCase().trim(),
      energyKcal: undefined,
      energyKj: undefined,
      protein: undefined,
      fat: undefined,
      saturatedFat: undefined,
      carbohydrates: undefined,
      sugars: undefined,
      dietaryFiber: undefined,
      calcium: undefined,
      iron: undefined,
      sodium: undefined,
      salt: undefined,
    });
  }
  
  const food = foodsMap.get(foodId);
  
  // Parse value
  const value = parseFloat(valueStr);
  if (isNaN(value)) continue;
  
  // Map component to field
  const componentUpper = componentId.toUpperCase();
  const fieldName = componentMap[componentUpper];
  
  if (fieldName) {
    food[fieldName] = value;
  }
  
  // Special handling for sodium -> salt
  if (componentUpper === 'NA' && food.sodium !== undefined) {
    food.salt = food.sodium * 2.54;
  }
  
  processed++;
  
  if (processed % 10000 === 0) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const rate = (processed / elapsed).toFixed(0);
    const remaining = dataLines.length - processed;
    const eta = remaining > 0 ? ((remaining / rate) / 60).toFixed(1) : 0;
    process.stdout.write(`\r  Processed ${processed.toLocaleString()}/${dataLines.length.toLocaleString()} components (${rate} components/sec, ~${eta} min remaining, ${foodsMap.size.toLocaleString()} foods)...`);
  }
}

console.log(`\n\n✅ Aggregation complete:`);
console.log(`   Components processed: ${processed.toLocaleString()}`);
console.log(`   Unique foods: ${foodsMap.size.toLocaleString()}`);
console.log(`   Processing time: ${((Date.now() - startTime) / 1000).toFixed(1)} seconds`);
console.log('');

// Convert map to array
const foods = Array.from(foodsMap.values());

// Filter valid foods
const valid = foods.filter(f => f.foodName && !f.foodName.match(/^Food \d+$/) && f.foodName.length > 2);

console.log(`Valid foods: ${valid.length.toLocaleString()}`);
console.log('');

console.log('First 5 foods:');
valid.slice(0, 5).forEach((f, i) => {
  console.log(`  ${i+1}. ${f.foodName.substring(0, 70)}`);
});
console.log('');

// Write database
console.log('Writing database...');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

if (fs.existsSync(OUTPUT_FILE)) {
  fs.unlinkSync(OUTPUT_FILE);
}

const writeStartTime = Date.now();
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

// Verify
console.log('Verifying database...');
const verify = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
console.log(`  Total: ${verify.length.toLocaleString()}`);
console.log(`  First: "${verify[0].foodName}"`);
console.log(`  Has rawData: ${!!verify[0].rawData}`);

if (verify[0].foodName.match(/^Food \d+$/) || verify[0].rawData) {
  console.error('\n❌ ERROR: Database still broken!');
  process.exit(1);
}

console.log('\n✅ SUCCESS: Database generated correctly!');
console.log(`   Ready for TruScore integration with ${verify.length.toLocaleString()} foods`);
console.log('');
console.log('='.repeat(80));

