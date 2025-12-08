/**
 * Run Comprehensive FSANZ Processing
 * This script processes ALL Excel files and ALL tabs
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const DB_DIR = path.join(__dirname, '..', 'Database files');
const OUTPUT_DIR = path.join(__dirname, '..', 'backend', 'vercel', 'data');

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Output file for logging
const logPath = path.join(__dirname, '..', 'FSANZ_PROCESSING_RESULTS.txt');
fs.writeFileSync(logPath, 'FSANZ COMPREHENSIVE PROCESSING RESULTS\n');
fs.appendFileSync(logPath, '='.repeat(80) + '\n\n');

function log(message) {
  const msg = String(message);
  console.log(msg);
  fs.appendFileSync(logPath, msg + '\n');
}

log('Starting comprehensive FSANZ processing...\n');

// Process Excel file
function processFile(filePath, fileType) {
  log(`\nProcessing: ${path.basename(filePath)} (${fileType})`);
  
  if (!fs.existsSync(filePath)) {
    log(`  ⚠️  File not found`);
    return [];
  }
  
  try {
    const workbook = XLSX.readFile(filePath);
    log(`  Sheets: ${workbook.SheetNames.length} (${workbook.SheetNames.join(', ')})`);
    
    let allData = [];
    workbook.SheetNames.forEach((sheetName, idx) => {
      const lowerName = sheetName.toLowerCase();
      if (lowerName.includes('index') || lowerName.includes('readme') || lowerName.includes('metadata')) {
        log(`    Skipping: ${sheetName}`);
        return;
      }
      
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { defval: null });
      log(`    Sheet "${sheetName}": ${data.length} rows`);
      allData = allData.concat(data);
    });
    
    log(`  Total rows: ${allData.length}`);
    return allData;
  } catch (error) {
    log(`  ❌ Error: ${error.message}`);
    return [];
  }
}

// Process AFCD files
log('\n' + '='.repeat(80));
log('PROCESSING AFCD (AUSTRALIA)');
log('='.repeat(80));

const afcdFiles = [
  { path: path.join(DB_DIR, 'AU Release 2 - Nutrient file.xlsx'), type: 'nutrient' },
  { path: path.join(DB_DIR, 'AU Release 2 - Food Details.xlsx'), type: 'food-details' },
  { path: path.join(DB_DIR, 'Food Records archived from latest version of FOODfiles.xlsx'), type: 'archived' },
  { path: path.join(DB_DIR, 'New Food Records replacing old Food Records in latest version of FOODfiles.xlsx'), type: 'new' },
  { path: path.join(DB_DIR, 'Data added to or updated in the Food Records in the latest version of FOODfiles.xlsx'), type: 'updated' },
];

let allAFCDFoods = [];
afcdFiles.forEach(fileInfo => {
  const foods = processFile(fileInfo.path, fileInfo.type);
  allAFCDFoods = allAFCDFoods.concat(foods);
});

log(`\nTotal AFCD rows collected: ${allAFCDFoods.length}`);

// Normalize AFCD
function normalizeFood(row, index) {
  const foodName = String(
    row['Food Name'] || 
    row['Food name'] || 
    row['Name'] ||
    row['Description'] ||
    row['Public Food Key'] ||
    `Food ${index}`
  ).trim();
  
  const getNutrient = (names) => {
    for (const name of names) {
      const val = row[name];
      if (val != null && val !== '') {
        const parsed = parseFloat(val);
        if (!isNaN(parsed)) return parsed;
      }
    }
    return undefined;
  };
  
  return {
    foodName: foodName,
    foodNameLower: foodName.toLowerCase().trim(),
    foodGroup: row['Food Group'] || row['Food group'] || undefined,
    energyKcal: getNutrient(['Energy (kcal)', 'Energy kcal', 'Energy_kcal']),
    energyKj: getNutrient(['Energy (kJ)', 'Energy kj', 'Energy_kj']),
    protein: getNutrient(['Protein', 'Protein (g)', 'Protein_g']),
    fat: getNutrient(['Fat', 'Fat (g)', 'Fat_g']),
    saturatedFat: getNutrient(['Saturated Fat', 'Saturated fat']),
    carbohydrates: getNutrient(['Carbohydrates', 'Carbohydrates (g)']),
    sugars: getNutrient(['Sugars', 'Sugars (g)']),
    dietaryFiber: getNutrient(['Fiber', 'Dietary Fiber', 'Fibre']),
    sodium: getNutrient(['Sodium', 'Sodium (mg)', 'Sodium (g)']),
    calcium: getNutrient(['Calcium', 'Calcium (mg)']),
    iron: getNutrient(['Iron', 'Iron (mg)']),
  };
}

const normalizedAFCD = allAFCDFoods
  .map((row, idx) => normalizeFood(row, idx))
  .filter(f => f.foodName && f.foodName !== 'Food' && f.foodName.length > 1 && !f.foodName.match(/^Food \d+$/));

// Deduplicate
const uniqueAFCD = [];
const seenAFCD = new Set();
normalizedAFCD.forEach(food => {
  if (!seenAFCD.has(food.foodNameLower)) {
    seenAFCD.add(food.foodNameLower);
    uniqueAFCD.push(food);
  }
});

log(`After normalization and deduplication: ${uniqueAFCD.length} unique AFCD foods`);

// Process NZFCD files
log('\n' + '='.repeat(80));
log('PROCESSING NZFCD (NEW ZEALAND)');
log('='.repeat(80));

const nzfcdFiles = [
  { path: path.join(DB_DIR, 'Standard DATA.AP.xlsx'), type: 'standard-ap' },
  { path: path.join(DB_DIR, 'Standard DATA.FT.xlsx'), type: 'standard-ft' },
  { path: path.join(DB_DIR, 'Unabridged DATA.AP.xlsx'), type: 'unabridged-ap' },
  { path: path.join(DB_DIR, 'Unabridged DATA.FT.xlsx'), type: 'unabridged-ft' },
];

let allNZFCDFoods = [];
nzfcdFiles.forEach(fileInfo => {
  const foods = processFile(fileInfo.path, fileInfo.type);
  allNZFCDFoods = allNZFCDFoods.concat(foods);
});

log(`\nTotal NZFCD rows collected: ${allNZFCDFoods.length}`);

const normalizedNZFCD = allNZFCDFoods
  .map((row, idx) => normalizeFood(row, idx))
  .filter(f => f.foodName && f.foodName !== 'Food' && f.foodName.length > 1 && !f.foodName.match(/^Food \d+$/));

// Deduplicate
const uniqueNZFCD = [];
const seenNZFCD = new Set();
normalizedNZFCD.forEach(food => {
  if (!seenNZFCD.has(food.foodNameLower)) {
    seenNZFCD.add(food.foodNameLower);
    uniqueNZFCD.push(food);
  }
});

log(`After normalization and deduplication: ${uniqueNZFCD.length} unique NZFCD foods`);

// Write output files
const afcdPath = path.join(OUTPUT_DIR, 'afcd.json');
const nzfcdPath = path.join(OUTPUT_DIR, 'nzfcd.json');

fs.writeFileSync(afcdPath, JSON.stringify(uniqueAFCD, null, 2));
fs.writeFileSync(nzfcdPath, JSON.stringify(uniqueNZFCD, null, 2));

const afcdSize = (fs.statSync(afcdPath).size / 1024 / 1024).toFixed(2);
const nzfcdSize = (fs.statSync(nzfcdPath).size / 1024 / 1024).toFixed(2);

log('\n' + '='.repeat(80));
log('FINAL RESULTS');
log('='.repeat(80));
log(`\nAFCD (Australia): ${uniqueAFCD.length.toLocaleString()} foods (${afcdSize} MB)`);
log(`NZFCD (New Zealand): ${uniqueNZFCD.length.toLocaleString()} foods (${nzfcdSize} MB)`);
log(`TOTAL FSANZ: ${(uniqueAFCD.length + uniqueNZFCD.length).toLocaleString()} foods`);

const total = uniqueAFCD.length + uniqueNZFCD.length;
if (total >= 21000) {
  log(`\n✅ SUCCESS: Found ${total.toLocaleString()} foods (meets 21,000+ requirement!)`);
} else {
  log(`\n⚠️  Found ${total.toLocaleString()} foods (target was 21,000+)`);
}

log(`\nOutput files:`);
log(`  - ${afcdPath}`);
log(`  - ${nzfcdPath}`);
log(`\nProcessing log: ${logPath}`);
log('\n' + '='.repeat(80));
log('PROCESSING COMPLETE');
log('='.repeat(80));

