/**
 * Convert FSANZ Excel files to JSON for server-side querying
 * This creates searchable JSON files that can be queried by product name
 * 
 * Usage: node scripts/convertFSANZToJSON.js
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const NZFCD_EXCEL = path.join(__dirname, '..', 'Database files', 'Principal files', 'Excel files', 'Standard', 'Standard DATA.FT.xlsx');
const AFCD_EXCEL = path.join(__dirname, '..', 'Database files', 'AU Release 2 - Nutrient file.xlsx');

const NZFCD_JSON = path.join(__dirname, '..', 'backend', 'vercel', 'data', 'nzfcd.json');
const AFCD_JSON = path.join(__dirname, '..', 'backend', 'vercel', 'data', 'afcd.json');

console.log('========================================');
console.log('Convert FSANZ Excel to JSON');
console.log('========================================');
console.log('');

function convertExcelToJSON(excelPath, outputPath, databaseName) {
  if (!fs.existsSync(excelPath)) {
    console.error(`❌ Excel file not found: ${excelPath}`);
    return false;
  }

  console.log(`Reading ${databaseName} Excel file...`);
  const workbook = XLSX.readFile(excelPath);
  
  // For AFCD, find the correct sheet (not Index)
  let sheetName = workbook.SheetNames[0];
  if (databaseName === 'AFCD') {
    // AFCD has sheets like "All solids & liquids per 100g", "Index", "Liquids only per 100mL"
    const dataSheet = workbook.SheetNames.find(name => 
      name.toLowerCase().includes('100g') || 
      (name.toLowerCase().includes('solids') && name.toLowerCase().includes('liquids'))
    ) || workbook.SheetNames.find(name => 
      !name.toLowerCase().includes('index') && 
      !name.toLowerCase().includes('readme')
    );
    if (dataSheet) {
      sheetName = dataSheet;
      console.log(`Using sheet: ${sheetName} (from ${workbook.SheetNames.length} available)`);
    }
  }
  
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { defval: null });

  console.log(`Found ${data.length} foods`);
  
  // Debug for AFCD
  if (databaseName === 'AFCD' && data.length > 0) {
    console.log(`Columns: ${Object.keys(data[0]).length}`);
    const foodNameCols = Object.keys(data[0]).filter(k => 
      k.toLowerCase().includes('food') || k.toLowerCase().includes('name')
    );
    if (foodNameCols.length > 0) {
      console.log(`Food name columns: ${foodNameCols.join(', ')}`);
    }
  }

  // Normalize data structure
  const normalized = data.map((row, index) => {
    // Try to find food name in various column formats
    const foodName = row['Food Name'] || row['Food name'] || row['FoodName'] || 
                     row['FOOD_NAME'] || row['food_name'] || 
                     row['Description'] || row['description'] ||
                     `Food ${index + 1}`;

    // Extract nutrition values (handle various formats)
    const getValue = (keys) => {
      for (const key of keys) {
        const value = row[key];
        if (value !== undefined && value !== null && value !== '' && !isNaN(value)) {
          return parseFloat(value);
        }
      }
      return undefined;
    };

    return {
      foodName: String(foodName).trim(),
      foodNameLower: String(foodName).toLowerCase().trim(),
      foodGroup: row['Food Group'] || row['Food group'] || row['FoodGroup'] || row['FOOD_GROUP'] || undefined,
      foodSubgroup: row['Food Subgroup'] || row['Food subgroup'] || row['FoodSubgroup'] || undefined,
      // Nutrition per 100g
      energyKcal: getValue(['Energy (kcal)', 'Energy kcal', 'energy_kcal', 'EnergyKcal', 'ENERGY_KCAL']),
      energyKj: getValue(['Energy (kJ)', 'Energy kj', 'energy_kj', 'EnergyKj', 'ENERGY_KJ']),
      protein: getValue(['Protein', 'Protein (g)', 'protein', 'PROTEIN']),
      fat: getValue(['Fat', 'Fat (g)', 'fat', 'FAT', 'Fat total', 'Fat Total']),
      saturatedFat: getValue(['Saturated Fat', 'Saturated fat', 'saturated_fat', 'SaturatedFat', 'SATURATED_FAT']),
      carbohydrates: getValue(['Carbohydrates', 'Carbohydrates (g)', 'carbohydrates', 'CARBOHYDRATES', 'Carbohydrate total']),
      sugars: getValue(['Sugars', 'Sugars (g)', 'sugars', 'SUGARS']),
      dietaryFiber: getValue(['Fiber', 'Dietary Fiber', 'Dietary fiber', 'dietary_fiber', 'DietaryFiber', 'FIBER']),
      salt: getValue(['Salt', 'Salt (g)', 'salt', 'SALT']),
      sodium: getValue(['Sodium', 'Sodium (g)', 'Sodium (mg)', 'sodium', 'SODIUM']) || 
              (getValue(['Sodium (mg)']) ? getValue(['Sodium (mg)']) / 1000 : undefined),
      calcium: getValue(['Calcium', 'Calcium (mg)', 'calcium', 'CALCIUM']) || 
               (getValue(['Calcium (mg)']) ? getValue(['Calcium (mg)']) / 1000 : undefined),
      iron: getValue(['Iron', 'Iron (mg)', 'iron', 'IRON']) || 
            (getValue(['Iron (mg)']) ? getValue(['Iron (mg)']) / 1000 : undefined),
      // Store raw row for additional nutrients
      rawData: row,
    };
  }).filter(food => food.foodName && food.foodName !== 'Food');

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write JSON file
  fs.writeFileSync(outputPath, JSON.stringify(normalized, null, 2), 'utf8');
  
  const fileSize = fs.statSync(outputPath).size;
  
  console.log(`✅ Converted ${normalized.length} foods`);
  console.log(`   Output: ${outputPath}`);
  console.log(`   Size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
  console.log('');

  return true;
}

// Convert NZFCD
const nzfcdSuccess = convertExcelToJSON(NZFCD_EXCEL, NZFCD_JSON, 'NZFCD');

// Convert AFCD
const afcdSuccess = convertExcelToJSON(AFCD_EXCEL, AFCD_JSON, 'AFCD');

console.log('========================================');
if (nzfcdSuccess && afcdSuccess) {
  console.log('✅ Conversion Complete!');
  console.log('========================================');
  console.log('');
  console.log('Next steps:');
  console.log('1. Deploy to Vercel: cd backend\\vercel && vercel --prod');
  console.log('2. App will query FSANZ by product name automatically');
  console.log('');
} else {
  console.log('⚠️  Conversion completed with errors');
  console.log('========================================');
  if (!nzfcdSuccess) {
    console.log('❌ NZFCD conversion failed');
  }
  if (!afcdSuccess) {
    console.log('❌ AFCD conversion failed');
  }
  process.exit(1);
}
