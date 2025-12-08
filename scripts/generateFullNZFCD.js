/**
 * Generate Full NZFCD JSON from Standard DATA.AP
 * This script properly parses the FOODfiles database to create the full ~2,860 food database
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const OUTPUT_DIR = path.join(__dirname, '..', 'backend', 'vercel', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'nzfcd.json');

// Try multiple source file locations
const SOURCE_FILES = [
  path.join(__dirname, '..', 'Database files', 'Standard DATA.AP.xlsx'),
  path.join(__dirname, '..', 'Database files', 'Principal files', 'ASCII Text Files', 'Standard', 'Standard DATA.AP'),
];

console.log('========================================');
console.log('Generate Full NZFCD Database');
console.log('========================================');
console.log('');

let sourceFile = null;
let sourceType = null;

// Find source file
for (const filePath of SOURCE_FILES) {
  if (fs.existsSync(filePath)) {
    sourceFile = filePath;
    sourceType = filePath.endsWith('.xlsx') ? 'excel' : 'text';
    console.log(`✅ Found source file: ${sourceFile}`);
    break;
  }
}

if (!sourceFile) {
  console.error('❌ No source file found!');
  console.error('   Tried:');
  SOURCE_FILES.forEach(f => console.error(`     - ${f}`));
  process.exit(1);
}

let foods = [];

if (sourceType === 'excel') {
  console.log('Reading Excel file...');
  const workbook = XLSX.readFile(sourceFile);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { defval: null });
  
  console.log(`Found ${data.length} rows`);
  
  if (data.length > 0) {
    console.log(`Columns: ${Object.keys(data[0]).length}`);
    console.log(`Sample columns: ${Object.keys(data[0]).slice(0, 15).join(', ')}`);
  }
  
  // Parse each row
  foods = data.map((row, index) => {
    // Extract food name - try multiple column name variations
    const foodName = String(
      row['Food Name'] || 
      row['Food name'] || 
      row['FoodName'] ||
      row['NAME'] ||
      row['Name'] ||
      `Food ${index + 1}`
    ).trim();
    
    if (!foodName || foodName === 'Food' || foodName.length < 2) {
      return null; // Skip invalid entries
    }
    
    // Helper to extract numeric value from various column name formats
    const getValue = (columnVariations) => {
      for (const col of columnVariations) {
        const val = row[col];
        if (val !== null && val !== undefined && val !== '') {
          const num = parseFloat(val);
          if (!isNaN(num)) {
            return num;
          }
        }
      }
      return undefined;
    };
    
    return {
      foodName: foodName,
      foodNameLower: foodName.toLowerCase().trim(),
      foodGroup: row['Food Group'] || row['Food group'] || row['FoodGroup'] || undefined,
      foodSubgroup: row['Food Subgroup'] || row['Food subgroup'] || row['FoodSubgroup'] || undefined,
      // Energy
      energyKcal: getValue(['Energy, total metabolisable (kcal)', 'Energy (kcal)', 'Energy kcal', 'ENERC_KCAL', 'Energy']),
      energyKj: getValue(['Energy, total metabolisable (kJ)', 'Energy (kJ)', 'Energy kj', 'ENERC', 'ENERC1']),
      // Macronutrients
      protein: getValue(['Protein, total; calculated from total nitrogen', 'Protein', 'PROCNT', 'Protein (g)']),
      fat: getValue(['Fat, total', 'Fat', 'FAT', 'Fat (g)', 'FATRN']),
      saturatedFat: getValue(['Fatty acids, total saturated', 'Saturated Fat', 'Saturated fat', 'FASAT', 'Saturated Fat (g)']),
      fatMonounsaturated: getValue(['Fatty acids, total monounsaturated', 'FAMS']),
      fatPolyunsaturated: getValue(['Fatty acids, total polyunsaturated', 'FAPU']),
      carbohydrates: getValue(['Total carbohydrate by difference', 'Carbohydrates', 'CHOCDF', 'Carbohydrates (g)', 'CHOAVL']),
      sugars: getValue(['Sugars, total', 'Sugars', 'SUGAR', 'Sugars (g)']),
      dietaryFiber: getValue(['Fibre, total dietary', 'Dietary Fiber', 'Dietary fiber', 'FIBTG', 'Fiber', 'Fiber (g)']),
      // Minerals
      calcium: getValue(['Calcium', 'CA', 'Calcium (mg)']),
      iron: getValue(['Iron', 'FE', 'Iron (mg)']),
      magnesium: getValue(['Magnesium', 'MG', 'Magnesium (mg)']),
      phosphorus: getValue(['Phosphorus', 'P', 'Phosphorus (mg)']),
      potassium: getValue(['Potassium', 'K', 'Potassium (mg)']),
      sodium: getValue(['Sodium', 'NA', 'Sodium (mg)', 'Sodium (g)']) || 
              (getValue(['Sodium (mg)']) ? getValue(['Sodium (mg)']) / 1000 : undefined),
      salt: getValue(['Salt', 'Salt (g)']) || 
            (getValue(['Sodium (g)']) ? getValue(['Sodium (g)']) * 2.54 : undefined),
      zinc: getValue(['Zinc', 'ZN', 'Zinc (mg)']),
      copper: getValue(['Copper', 'CU', 'Copper (mg)']),
      manganese: getValue(['Manganese', 'MN', 'Manganese (mg)']),
      selenium: getValue(['Selenium', 'SE', 'Selenium (µg)']) || 
                (getValue(['Selenium (µg)']) ? getValue(['Selenium (µg)']) / 1000 : undefined),
      // Vitamins
      vitaminA: getValue(['Vitamin A, retinol activity equivalents', 'Vitamin A', 'VITA_RAE', 'VITARA']),
      vitaminC: getValue(['Vitamin C', 'VITC', 'Vitamin C (mg)']),
      vitaminD: getValue(['Vitamin D; calculated by summation', 'Vitamin D', 'VITD']),
      vitaminE: getValue(['Vitamin E, alpha-tocopherol equivalents', 'Vitamin E', 'TOCPHA']),
      vitaminK: getValue(['Vitamin K', 'VITK1']),
      thiamin: getValue(['Thiamin', 'THIA', 'Vitamin B1', 'Thiamin (mg)']),
      riboflavin: getValue(['Riboflavin', 'RIBF', 'Vitamin B2', 'Riboflavin (mg)']),
      niacin: getValue(['Niacin equivalents, total', 'Niacin', 'NIA', 'Niacin (mg)']),
      vitaminB6: getValue(['Vitamin B6', 'VITB6A', 'Vitamin B6 (mg)']),
      folate: getValue(['Dietary folate equivalents', 'Folate', 'FOLDFE', 'Folate (µg)']) ||
              (getValue(['Folate (µg)']) ? getValue(['Folate (µg)']) / 1000 : undefined),
      vitaminB12: getValue(['Vitamin B12', 'VITB12', 'Vitamin B12 (µg)']) ||
                   (getValue(['Vitamin B12 (µg)']) ? getValue(['Vitamin B12 (µg)']) / 1000 : undefined),
      // Store raw data for additional nutrients
      rawData: row, // Keep all original data for future use
    };
  }).filter(f => f !== null);
  
} else {
  // Parse from text file
  console.log('Reading text file...');
  const content = fs.readFileSync(sourceFile, 'utf8');
  const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('©'));
  
  // First 2 lines are headers
  if (lines.length < 3) {
    console.error('❌ Invalid text file format');
    process.exit(1);
  }
  
  const headerLine1 = lines[0].split('~');
  const headerLine2 = lines[1].split('~');
  const dataLines = lines.slice(2);
  
  console.log(`Found ${dataLines.length} data lines`);
  console.log(`Header 1: ${headerLine1.slice(0, 10).join(', ')}...`);
  console.log(`Header 2: ${headerLine2.slice(0, 10).join(', ')}...`);
  
  // Find column indices for key nutrients
  const findColumnIndex = (searchTerms) => {
    for (let i = 0; i < headerLine1.length; i++) {
      const col = (headerLine1[i] || '').toLowerCase();
      for (const term of searchTerms) {
        if (col.includes(term.toLowerCase())) {
          return i;
        }
      }
    }
    return -1;
  };
  
  const colFoodName = 1; // Always column 1
  const colEnergyKcal = findColumnIndex(['energy', 'kcal']) || findColumnIndex(['metabolisable', 'kcal']);
  const colEnergyKj = findColumnIndex(['energy', 'kj']) || (colEnergyKcal >= 0 ? colEnergyKcal + 1 : -1);
  const colProtein = findColumnIndex(['protein', 'total nitrogen']);
  const colFat = findColumnIndex(['fat', 'total']);
  const colSaturatedFat = findColumnIndex(['saturated']);
  const colCarbohydrates = findColumnIndex(['carbohydrate', 'total']);
  const colSugars = findColumnIndex(['sugars', 'total']);
  const colFiber = findColumnIndex(['fibre', 'fiber', 'dietary']);
  const colCalcium = findColumnIndex(['calcium', 'ca']);
  const colIron = findColumnIndex(['iron', 'fe']);
  const colSodium = findColumnIndex(['sodium', 'na']);
  
  console.log(`Column indices: FoodName=${colFoodName}, EnergyKcal=${colEnergyKcal}, Protein=${colProtein}, Fat=${colFat}`);
  
  const seenFoodIds = new Set();
  
  for (const line of dataLines) {
    const parts = line.split('~');
    if (parts.length < 2) continue;
    
    const foodId = parts[0].trim();
    const foodName = parts[1].trim();
    
    // Skip duplicates (DATA.AP has one row per food)
    if (seenFoodIds.has(foodId) || !foodName || foodName.length < 2) continue;
    seenFoodIds.add(foodId);
    
    const parseValue = (index) => {
      if (index < 0 || index >= parts.length) return undefined;
      const val = parseFloat(parts[index]);
      return isNaN(val) ? undefined : val;
    };
    
    foods.push({
      foodName: foodName,
      foodNameLower: foodName.toLowerCase().trim(),
      foodGroup: undefined, // Not in DATA.AP format
      energyKcal: parseValue(colEnergyKcal),
      energyKj: parseValue(colEnergyKj),
      protein: parseValue(colProtein),
      fat: parseValue(colFat),
      saturatedFat: parseValue(colSaturatedFat),
      carbohydrates: parseValue(colCarbohydrates),
      sugars: parseValue(colSugars),
      dietaryFiber: parseValue(colFiber),
      calcium: parseValue(colCalcium),
      iron: parseValue(colIron),
      sodium: parseValue(colSodium),
      salt: parseValue(colSodium) ? parseValue(colSodium) * 2.54 : undefined,
    });
  }
}

console.log(`\n✅ Parsed ${foods.length} foods`);

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Created output directory: ${OUTPUT_DIR}`);
}

// Write JSON file
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(foods, null, 2), 'utf8');

const fileSize = fs.statSync(OUTPUT_FILE).size;
const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);

console.log(`\n✅ Generated full NZFCD database:`);
console.log(`   Foods: ${foods.length.toLocaleString()}`);
console.log(`   Size: ${fileSizeMB} MB`);
console.log(`   Output: ${OUTPUT_FILE}`);
console.log(`\n💡 Expected: ~2,860 foods (from Standard DATA.AP)`);
if (foods.length < 2000) {
  console.log(`\n⚠️  WARNING: Only ${foods.length} foods found. Expected ~2,860.`);
  console.log(`   This suggests the source file may not be complete or parsing needs adjustment.`);
}

console.log(`\n========================================`);
console.log('Next step: Deploy to Vercel');
console.log('  cd backend/vercel && vercel --prod');
console.log('========================================`);

