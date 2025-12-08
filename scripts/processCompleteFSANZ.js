/**
 * Complete FSANZ Processing - Process ALL files and generate comprehensive databases
 * This script ensures we have the full 21,000+ product database
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const DB_DIR = path.join(__dirname, '..', 'Database files');
const OUTPUT_DIR = path.join(__dirname, '..', 'backend', 'vercel', 'data');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Results file
const resultsFile = path.join(__dirname, '..', 'FSANZ_PROCESSING_RESULTS.txt');
fs.writeFileSync(resultsFile, 'FSANZ COMPLETE PROCESSING RESULTS\n');
fs.appendFileSync(resultsFile, '='.repeat(80) + '\n\n');

function log(message) {
  const msg = String(message);
  console.log(msg);
  fs.appendFileSync(resultsFile, msg + '\n');
}

log('Starting complete FSANZ processing...\n');

// Process Excel file - extract all data from all sheets
function processExcelFile(filePath, fileType) {
  const fileName = path.basename(filePath);
  log(`\nProcessing: ${fileName} (${fileType})`);
  
  if (!fs.existsSync(filePath)) {
    log(`  ⚠️  File not found`);
    return [];
  }
  
  try {
    const workbook = XLSX.readFile(filePath);
    log(`  Sheets: ${workbook.SheetNames.length}`);
    
    let allData = [];
    workbook.SheetNames.forEach((sheetName, idx) => {
      const lower = sheetName.toLowerCase();
      if (lower.includes('index') || lower.includes('readme') || lower.includes('metadata') || lower.includes('notes')) {
        log(`    Skipping: ${sheetName}`);
        return;
      }
      
      try {
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { defval: null, raw: false });
        log(`    Sheet "${sheetName}": ${data.length} rows`);
        allData = allData.concat(data);
      } catch (sheetError) {
        log(`    ❌ Error in sheet "${sheetName}": ${sheetError.message}`);
      }
    });
    
    log(`  ✅ Total: ${allData.length} rows`);
    return allData;
  } catch (error) {
    log(`  ❌ Error: ${error.message}`);
    return [];
  }
}

// Normalize food data
function normalizeFood(row, index) {
  // Try multiple field names for food name
  const foodName = String(
    row['Food Name'] || 
    row['Food name'] || 
    row['FoodName'] ||
    row['Name'] ||
    row['Description'] ||
    row['Food Description'] ||
    row['Public Food Key'] ||
    row['Key'] ||
    row['Food Key'] ||
    `Food ${index}`
  ).trim();
  
  // Helper to get nutrient value
  const get = (names) => {
    for (const n of names) {
      const v = row[n];
      if (v != null && v !== '' && v !== 'null' && v !== 'undefined') {
        const p = parseFloat(v);
        if (!isNaN(p)) return p;
      }
    }
    return undefined;
  };
  
  return {
    foodName: foodName,
    foodNameLower: foodName.toLowerCase().trim(),
    foodGroup: row['Food Group'] || row['Food group'] || row['Classification'] || undefined,
    energyKcal: get(['Energy (kcal)', 'Energy kcal', 'Energy_kcal', 'ENERGY_KCAL', 'Energy, kcal']),
    energyKj: get(['Energy (kJ)', 'Energy kj', 'Energy_kj', 'ENERGY_KJ', 'Energy, kJ']),
    protein: get(['Protein', 'Protein (g)', 'Protein_g', 'PROTEIN', 'Protein, g']),
    fat: get(['Fat', 'Fat (g)', 'Fat_g', 'FAT', 'Total fat', 'Fat, g']),
    saturatedFat: get(['Saturated Fat', 'Saturated fat', 'Saturated_fat', 'SaturatedFat']),
    carbohydrates: get(['Carbohydrates', 'Carbohydrates (g)', 'Carbohydrates_g', 'CARBOHYDRATES', 'Carbohydrate']),
    sugars: get(['Sugars', 'Sugars (g)', 'Sugars_g', 'SUGARS', 'Total sugars']),
    dietaryFiber: get(['Fiber', 'Dietary Fiber', 'Dietary fiber', 'Dietary_fiber', 'Fibre', 'Dietary fibre']),
    salt: get(['Salt', 'Salt (g)', 'Salt_g', 'SALT']),
    sodium: get(['Sodium', 'Sodium (g)', 'Sodium (mg)', 'Sodium_g', 'Sodium_mg', 'SODIUM']),
    calcium: get(['Calcium', 'Calcium (mg)', 'Calcium_mg', 'CALCIUM']),
    iron: get(['Iron', 'Iron (mg)', 'Iron_mg', 'IRON']),
  };
}

// Process AFCD
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
  const foods = processExcelFile(fileInfo.path, fileInfo.type);
  allAFCDFoods = allAFCDFoods.concat(foods);
});

log(`\nTotal AFCD rows collected: ${allAFCDFoods.length.toLocaleString()}`);

// Normalize and filter
const normalizedAFCD = allAFCDFoods
  .map((row, idx) => normalizeFood(row, idx))
  .filter(f => f.foodName && f.foodName.length > 1 && !f.foodName.match(/^Food \d+$/) && f.foodName !== 'Food name');

// Deduplicate
const uniqueAFCD = [];
const seenAFCD = new Set();
normalizedAFCD.forEach(food => {
  if (!seenAFCD.has(food.foodNameLower)) {
    seenAFCD.add(food.foodNameLower);
    uniqueAFCD.push(food);
  }
});

log(`AFCD unique foods: ${uniqueAFCD.length.toLocaleString()}`);

// Process NZFCD - Use text file parser for Standard DATA.AP (most reliable)
log('\n' + '='.repeat(80));
log('PROCESSING NZFCD (NEW ZEALAND)');
log('='.repeat(80));

// First, use the existing text file parser for Standard DATA.AP
const textAPPath = path.join(DB_DIR, 'Principal files', 'ASCII Text Files', 'Standard', 'Standard DATA.AP');
let nzfcdData = [];

if (fs.existsSync(textAPPath)) {
  log(`\nProcessing text file: Standard DATA.AP`);
  try {
    const content = fs.readFileSync(textAPPath, 'utf8');
    const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('©'));
    
    if (lines.length >= 3) {
      const headerRow1 = lines[1].split('~');
      const dataLines = lines.slice(3);
      log(`  Found ${dataLines.length} data rows`);
      
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
        energyKcal: findCol(['energy, total metabolisable (kcal)', 'energy (kcal)', 'enerc_kcal']) || 25,
        energyKj: findCol(['energy, total metabolisable (kj)', 'energy (kj)', 'enerc']) || 27,
        protein: findCol(['protein, total', 'protein', 'procnt']) || 58,
        fat: findCol(['fat, total', 'fat']) || 28,
        saturatedFat: findCol(['fatty acids, total saturated', 'saturated', 'fasat']) || 40,
        carbohydrates: findCol(['total carbohydrate by difference', 'carbohydrate', 'chocdf']) || 14,
        sugars: findCol(['sugars, total', 'sugars', 'sugar']) || 70,
        dietaryFiber: findCol(['fibre, total dietary', 'fiber', 'dietary', 'fibtg']) || 42,
        calcium: findCol(['calcium', 'ca']) || 13,
        iron: findCol(['iron', 'fe']) || 50,
        sodium: findCol(['sodium', 'na']) || 59,
      };
      
      const seenIds = new Set();
      dataLines.forEach(line => {
        const parts = line.split('~');
        if (parts.length < 2) return;
        
        const foodId = parts[colIndices.foodId]?.trim();
        const foodName = parts[colIndices.foodName]?.trim();
        
        if (!foodId || !foodName || foodName.length < 2) return;
        if (seenIds.has(foodId)) return;
        seenIds.add(foodId);
        
        const parseVal = (idx) => {
          if (idx < 0 || idx >= parts.length) return undefined;
          const v = parts[idx]?.trim();
          if (!v || v === '' || v === '~~') return undefined;
          const n = parseFloat(v);
          return isNaN(n) ? undefined : n;
        };
        
        nzfcdData.push({
          'Food ID': foodId,
          'Food Name': foodName,
          'Energy (kcal)': parseVal(colIndices.energyKcal),
          'Energy (kJ)': parseVal(colIndices.energyKj),
          'Protein': parseVal(colIndices.protein),
          'Fat': parseVal(colIndices.fat),
          'Saturated Fat': parseVal(colIndices.saturatedFat),
          'Carbohydrates': parseVal(colIndices.carbohydrates),
          'Sugars': parseVal(colIndices.sugars),
          'Dietary Fiber': parseVal(colIndices.dietaryFiber),
          'Calcium': parseVal(colIndices.calcium),
          'Iron': parseVal(colIndices.iron),
          'Sodium': parseVal(colIndices.sodium),
        });
      });
      
      log(`  ✅ Parsed ${nzfcdData.length} foods from text file`);
    }
  } catch (error) {
    log(`  ❌ Error: ${error.message}`);
  }
}

// Also try Excel files
const nzfcdExcelFiles = [
  { path: path.join(DB_DIR, 'Standard DATA.AP.xlsx'), type: 'standard-ap' },
  { path: path.join(DB_DIR, 'Standard DATA.FT.xlsx'), type: 'standard-ft' },
  { path: path.join(DB_DIR, 'Unabridged DATA.AP.xlsx'), type: 'unabridged-ap' },
  { path: path.join(DB_DIR, 'Unabridged DATA.FT.xlsx'), type: 'unabridged-ft' },
];

nzfcdExcelFiles.forEach(fileInfo => {
  const foods = processExcelFile(fileInfo.path, fileInfo.type);
  nzfcdData = nzfcdData.concat(foods);
});

log(`\nTotal NZFCD rows collected: ${nzfcdData.length.toLocaleString()}`);

const normalizedNZFCD = nzfcdData
  .map((row, idx) => normalizeFood(row, idx))
  .filter(f => f.foodName && f.foodName.length > 1 && !f.foodName.match(/^Food \d+$/) && f.foodName !== 'Food name');

// Deduplicate
const uniqueNZFCD = [];
const seenNZFCD = new Set();
normalizedNZFCD.forEach(food => {
  if (!seenNZFCD.has(food.foodNameLower)) {
    seenNZFCD.add(food.foodNameLower);
    uniqueNZFCD.push(food);
  }
});

log(`NZFCD unique foods: ${uniqueNZFCD.length.toLocaleString()}`);

// Write output files
const afcdPath = path.join(OUTPUT_DIR, 'afcd.json');
const nzfcdPath = path.join(OUTPUT_DIR, 'nzfcd.json');

fs.writeFileSync(afcdPath, JSON.stringify(uniqueAFCD, null, 2), 'utf8');
fs.writeFileSync(nzfcdPath, JSON.stringify(uniqueNZFCD, null, 2), 'utf8');

const afcdSize = (fs.statSync(afcdPath).size / 1024 / 1024).toFixed(2);
const nzfcdSize = (fs.statSync(nzfcdPath).size / 1024 / 1024).toFixed(2);

const total = uniqueAFCD.length + uniqueNZFCD.length;

log('\n' + '='.repeat(80));
log('FINAL RESULTS');
log('='.repeat(80));
log(`\nAFCD (Australia): ${uniqueAFCD.length.toLocaleString()} foods (${afcdSize} MB)`);
log(`NZFCD (New Zealand): ${uniqueNZFCD.length.toLocaleString()} foods (${nzfcdSize} MB)`);
log(`TOTAL FSANZ: ${total.toLocaleString()} foods`);

if (total >= 21000) {
  log(`\n✅ SUCCESS: Found ${total.toLocaleString()} foods (meets 21,000+ requirement!)`);
} else {
  log(`\n⚠️  Found ${total.toLocaleString()} foods (target was 21,000+)`);
  log(`   This may be because:`);
  log(`   - Some Excel files are missing or empty`);
  log(`   - Some data is in formats we haven't processed yet`);
}

log(`\nOutput files:`);
log(`  - ${afcdPath}`);
log(`  - ${nzfcdPath}`);
log(`\nProcessing log: ${resultsFile}`);
log('\n' + '='.repeat(80));
log('PROCESSING COMPLETE');
log('='.repeat(80));

