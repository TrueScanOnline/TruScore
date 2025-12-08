/**
 * Create Comprehensive FSANZ JSON files from ALL Excel files
 * This script processes ALL Excel files and ALL tabs to find the complete 21,000+ product database
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

// Logging function that also writes to file
const logFile = path.join(__dirname, '..', 'FSANZ_COMPREHENSIVE_PROCESSING.log');
function log(message) {
  const msg = typeof message === 'string' ? message : JSON.stringify(message, null, 2);
  console.log(msg);
  fs.appendFileSync(logFile, msg + '\n');
}

// Clear log file
fs.writeFileSync(logFile, 'FSANZ COMPREHENSIVE PROCESSING LOG\n' + '='.repeat(80) + '\n\n');

/**
 * Process a single Excel file and extract all food records from all sheets
 */
function processExcelFile(filePath, fileType = 'unknown') {
  log(`\n${'='.repeat(80)}`);
  log(`Processing: ${path.basename(filePath)} (Type: ${fileType})`);
  log('='.repeat(80));
  
  if (!fs.existsSync(filePath)) {
    log(`  ⚠️  File not found: ${filePath}`);
    return [];
  }
  
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;
    log(`  Found ${sheetNames.length} sheets: ${sheetNames.join(', ')}`);
    
    let allFoods = [];
    
    sheetNames.forEach((sheetName, index) => {
      // Skip metadata sheets
      const lowerName = sheetName.toLowerCase();
      if (lowerName.includes('index') || 
          lowerName.includes('readme') || 
          lowerName.includes('metadata') ||
          lowerName.includes('notes') ||
          lowerName.includes('legend')) {
        log(`  Skipping metadata sheet: ${sheetName}`);
        return;
      }
      
      log(`  Processing sheet ${index + 1}/${sheetNames.length}: "${sheetName}"`);
      
      try {
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { defval: null, raw: false });
        
        log(`    Rows: ${data.length.toLocaleString()}`);
        
        if (data.length > 0) {
          const columns = Object.keys(data[0]);
          log(`    Columns: ${columns.length}`);
          log(`    Sample columns: ${columns.slice(0, 10).join(', ')}`);
          
          // Add source information
          const foodsWithSource = data.map(row => ({
            ...row,
            _sourceFile: path.basename(filePath),
            _sourceSheet: sheetName,
            _sourceType: fileType
          }));
          
          allFoods = allFoods.concat(foodsWithSource);
        }
      } catch (sheetError) {
        log(`    ❌ Error processing sheet "${sheetName}": ${sheetError.message}`);
      }
    });
    
    log(`  ✅ Total foods from this file: ${allFoods.length.toLocaleString()}`);
    return allFoods;
  } catch (error) {
    log(`  ❌ Error reading file: ${error.message}`);
    return [];
  }
}

/**
 * Normalize food data from various sources
 */
function normalizeFood(row, index) {
  // Try multiple possible column names for food name
  let foodName = String(
    row['Food Name'] || 
    row['Food name'] || 
    row['FoodName'] ||
    row['Name'] ||
    row['Description'] ||
    row['Food Description'] ||
    row['FoodDescription'] ||
    row['Product Name'] ||
    row['ProductName'] ||
    row['Public Food Key'] ||
    row['Key'] ||
    row['Food Key'] ||
    (row['Food Code'] ? `Food ${row['Food Code']}` : undefined) ||
    `Food ${index}`
  ).trim();
  
  // If still no name, try to get from any column that might contain a name
  if (!foodName || foodName === 'Food' || foodName.length < 2) {
    const allValues = Object.values(row).filter(v => v && String(v).trim().length > 2);
    if (allValues.length > 0) {
      foodName = String(allValues[0]).trim();
    }
  }
  
  // Helper function to find nutrient value
  const getNutrient = (possibleNames) => {
    for (const name of possibleNames) {
      const value = row[name];
      if (value !== null && value !== undefined && value !== '') {
        const parsed = parseFloat(value);
        if (!isNaN(parsed)) {
          return parsed;
        }
      }
    }
    return undefined;
  };
  
  return {
    foodName: foodName,
    foodNameLower: foodName.toLowerCase().trim(),
    foodGroup: row['Food Group'] || row['Food group'] || row['Classification'] || row['Category'] || row['FoodCategory'] || undefined,
    energyKcal: getNutrient(['Energy (kcal)', 'Energy kcal', 'Energy_kcal', 'EnergyKcal', 'ENERGY_KCAL', 'Energy, kcal', 'Energy kcal per 100g']),
    energyKj: getNutrient(['Energy (kJ)', 'Energy kj', 'Energy_kj', 'EnergyKj', 'ENERGY_KJ', 'Energy, kJ', 'Energy kJ per 100g']),
    protein: getNutrient(['Protein', 'Protein (g)', 'Protein_g', 'PROTEIN', 'Protein, g', 'Protein per 100g']),
    fat: getNutrient(['Fat', 'Fat (g)', 'Fat_g', 'FAT', 'Total fat', 'Fat, g', 'Fat per 100g']),
    saturatedFat: getNutrient(['Saturated Fat', 'Saturated fat', 'Saturated_fat', 'SaturatedFat', 'SATURATED_FAT', 'Saturated fatty acids']),
    carbohydrates: getNutrient(['Carbohydrates', 'Carbohydrates (g)', 'Carbohydrates_g', 'CARBOHYDRATES', 'Carbohydrate', 'Carbohydrate, g']),
    sugars: getNutrient(['Sugars', 'Sugars (g)', 'Sugars_g', 'SUGARS', 'Total sugars', 'Sugars, g']),
    dietaryFiber: getNutrient(['Fiber', 'Dietary Fiber', 'Dietary fiber', 'Dietary_fiber', 'DietaryFiber', 'FIBER', 'Fibre', 'Dietary fibre']),
    salt: getNutrient(['Salt', 'Salt (g)', 'Salt_g', 'SALT', 'Salt, g']),
    sodium: getNutrient(['Sodium', 'Sodium (g)', 'Sodium (mg)', 'Sodium_g', 'Sodium_mg', 'SODIUM']),
    calcium: getNutrient(['Calcium', 'Calcium (mg)', 'Calcium_mg', 'CALCIUM']),
    iron: getNutrient(['Iron', 'Iron (mg)', 'Iron_mg', 'IRON']),
    // Preserve source information for debugging
    _sourceFile: row._sourceFile,
    _sourceSheet: row._sourceSheet,
    _sourceType: row._sourceType
  };
}

/**
 * Process all Australian (AFCD) files
 */
function processAFCD() {
  log('\n\n' + '='.repeat(80));
  log('PROCESSING AUSTRALIAN FOOD COMPOSITION DATABASE (AFCD)');
  log('='.repeat(80));
  
  const afcdFiles = [
    { path: path.join(DB_DIR, 'AU Release 2 - Nutrient file.xlsx'), type: 'nutrient' },
    { path: path.join(DB_DIR, 'AU Release 2 - Food Details.xlsx'), type: 'food-details' },
    { path: path.join(DB_DIR, 'Food Records archived from latest version of FOODfiles.xlsx'), type: 'archived' },
    { path: path.join(DB_DIR, 'New Food Records replacing old Food Records in latest version of FOODfiles.xlsx'), type: 'new-records' },
    { path: path.join(DB_DIR, 'Data added to or updated in the Food Records in the latest version of FOODfiles.xlsx'), type: 'updated' },
  ];
  
  let allAFCDFoods = [];
  const processedKeys = new Set();
  
  afcdFiles.forEach(fileInfo => {
    const foods = processExcelFile(fileInfo.path, fileInfo.type);
    
    foods.forEach(food => {
      // Use food name as key to avoid duplicates
      const key = (food['Public Food Key'] || food['Key'] || food['Food Name'] || food['Food name'] || '').toString().toLowerCase().trim();
      
      if (key && !processedKeys.has(key)) {
        processedKeys.add(key);
        allAFCDFoods.push(food);
      } else if (!key) {
        // Include foods without keys (they'll be filtered later if invalid)
        allAFCDFoods.push(food);
      }
    });
  });
  
  log(`\nTotal AFCD foods collected: ${allAFCDFoods.length.toLocaleString()}`);
  
  // Normalize and filter
  const normalized = allAFCDFoods
    .map((row, index) => normalizeFood(row, index))
    .filter(food => {
      return food.foodName && 
             food.foodName !== 'Food' && 
             food.foodName.length > 1 &&
             !food.foodName.match(/^Food \d+$/);
    });
  
  // Remove duplicates by foodNameLower
  const uniqueFoods = [];
  const seenNames = new Set();
  normalized.forEach(food => {
    if (!seenNames.has(food.foodNameLower)) {
      seenNames.add(food.foodNameLower);
      uniqueFoods.push(food);
    }
  });
  
  log(`After normalization and deduplication: ${uniqueFoods.length.toLocaleString()} unique foods`);
  
  // Write AFCD JSON
  const afcdPath = path.join(OUTPUT_DIR, 'afcd.json');
  fs.writeFileSync(afcdPath, JSON.stringify(uniqueFoods, null, 2));
  const fileSizeMB = (fs.statSync(afcdPath).size / 1024 / 1024).toFixed(2);
  log(`✅ Created AFCD: ${uniqueFoods.length.toLocaleString()} foods, ${fileSizeMB} MB`);
  log(`   Output: ${afcdPath}`);
  
  return uniqueFoods;
}

/**
 * Process all New Zealand (NZFCD) files
 */
function processNZFCD() {
  log('\n\n' + '='.repeat(80));
  log('PROCESSING NEW ZEALAND FOOD COMPOSITION DATABASE (NZFCD)');
  log('='.repeat(80));
  
  const nzfcdFiles = [
    { path: path.join(DB_DIR, 'Standard DATA.AP.xlsx'), type: 'standard-data' },
    { path: path.join(DB_DIR, 'Standard DATA.FT.xlsx'), type: 'standard-ft' },
    { path: path.join(DB_DIR, 'Unabridged DATA.AP.xlsx'), type: 'unabridged-data' },
    { path: path.join(DB_DIR, 'Unabridged DATA.FT.xlsx'), type: 'unabridged-ft' },
    { path: path.join(DB_DIR, 'Food Records archived from latest version of FOODfiles.xlsx'), type: 'archived' },
    { path: path.join(DB_DIR, 'New Food Records replacing old Food Records in latest version of FOODfiles.xlsx'), type: 'new-records' },
    { path: path.join(DB_DIR, 'Data added to or updated in the Food Records in the latest version of FOODfiles.xlsx'), type: 'updated' },
  ];
  
  let allNZFCDFoods = [];
  const processedKeys = new Set();
  
  nzfcdFiles.forEach(fileInfo => {
    const foods = processExcelFile(fileInfo.path, fileInfo.type);
    
    foods.forEach(food => {
      // Use food ID or name as key
      const key = (food['Food ID'] || food['FoodID'] || food['Food Name'] || food['Food name'] || '').toString().toLowerCase().trim();
      
      if (key && !processedKeys.has(key)) {
        processedKeys.add(key);
        allNZFCDFoods.push(food);
      } else if (!key) {
        allNZFCDFoods.push(food);
      }
    });
  });
  
  log(`\nTotal NZFCD foods collected: ${allNZFCDFoods.length.toLocaleString()}`);
  
  // Normalize and filter
  const normalized = allNZFCDFoods
    .map((row, index) => normalizeFood(row, index))
    .filter(food => {
      return food.foodName && 
             food.foodName !== 'Food' && 
             food.foodName.length > 1 &&
             !food.foodName.match(/^Food \d+$/);
    });
  
  // Remove duplicates
  const uniqueFoods = [];
  const seenNames = new Set();
  normalized.forEach(food => {
    if (!seenNames.has(food.foodNameLower)) {
      seenNames.add(food.foodNameLower);
      uniqueFoods.push(food);
    }
  });
  
  log(`After normalization and deduplication: ${uniqueFoods.length.toLocaleString()} unique foods`);
  
  // Write NZFCD JSON
  const nzfcdPath = path.join(OUTPUT_DIR, 'nzfcd.json');
  fs.writeFileSync(nzfcdPath, JSON.stringify(uniqueFoods, null, 2));
  const fileSizeMB = (fs.statSync(nzfcdPath).size / 1024 / 1024).toFixed(2);
  log(`✅ Created NZFCD: ${uniqueFoods.length.toLocaleString()} foods, ${fileSizeMB} MB`);
  log(`   Output: ${nzfcdPath}`);
  
  return uniqueFoods;
}

// Main execution
try {
  log('Starting comprehensive FSANZ processing...');
  log(`Database directory: ${DB_DIR}`);
  log(`Output directory: ${OUTPUT_DIR}\n`);
  
  const afcdFoods = processAFCD();
  const nzfcdFoods = processNZFCD();
  
  const totalFoods = afcdFoods.length + nzfcdFoods.length;
  
  log('\n\n' + '='.repeat(80));
  log('FINAL SUMMARY');
  log('='.repeat(80));
  log(`\nAFCD (Australia): ${afcdFoods.length.toLocaleString()} foods`);
  log(`NZFCD (New Zealand): ${nzfcdFoods.length.toLocaleString()} foods`);
  log(`TOTAL FSANZ: ${totalFoods.toLocaleString()} foods`);
  
  if (totalFoods >= 21000) {
    log(`\n✅ SUCCESS: Found ${totalFoods.toLocaleString()} foods (meets 21,000+ requirement!)`);
  } else {
    log(`\n⚠️  Found ${totalFoods.toLocaleString()} foods (target was 21,000+)`);
    log(`   This might be because:`);
    log(`   - Some Excel files are missing or empty`);
    log(`   - Some data is in text files (.FT, .AP) instead of Excel`);
    log(`   - Some products are in other file formats`);
  }
  
  log(`\nProcessing log saved to: ${logFile}`);
  log('\n' + '='.repeat(80));
  log('PROCESSING COMPLETE');
  log('='.repeat(80) + '\n');
  
} catch (error) {
  log(`\n❌ FATAL ERROR: ${error.message}`);
  log(`Stack: ${error.stack}`);
  process.exit(1);
}

