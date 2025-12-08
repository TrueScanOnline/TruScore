/**
 * Simple FSANZ conversion with explicit output
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const NZFCD_EXCEL = path.join(__dirname, '..', 'Database files', 'Principal files', 'Excel files', 'Standard', 'Standard DATA.FT.xlsx');
const AFCD_EXCEL = path.join(__dirname, '..', 'Database files', 'AU Release 2 - Nutrient file.xlsx');
const NZFCD_JSON = path.join(__dirname, '..', 'backend', 'vercel', 'data', 'nzfcd.json');
const AFCD_JSON = path.join(__dirname, '..', 'backend', 'vercel', 'data', 'afcd.json');

console.log('========================================');
console.log('FSANZ Conversion');
console.log('========================================');
console.log('');

// Ensure output directory exists
const outputDir = path.dirname(NZFCD_JSON);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`Created directory: ${outputDir}`);
}

// Convert NZFCD
if (fs.existsSync(NZFCD_EXCEL)) {
  console.log('Reading NZFCD Excel...');
  const wb = XLSX.readFile(NZFCD_EXCEL);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws);
  console.log(`Found ${data.length} rows`);
  
  const normalized = data.map((row, index) => {
    const foodName = row['Food Name'] || row['Food name'] || row['Description'] || `Food ${index + 1}`;
    return {
      foodName: String(foodName).trim(),
      foodNameLower: String(foodName).toLowerCase().trim(),
      foodGroup: row['Food Group'] || row['Food group'] || undefined,
      energyKcal: parseFloat(row['Energy (kcal)'] || row['Energy kcal'] || row['EnergyKcal'] || '') || undefined,
      energyKj: parseFloat(row['Energy (kJ)'] || row['Energy kj'] || row['EnergyKj'] || '') || undefined,
      protein: parseFloat(row['Protein'] || row['Protein (g)'] || '') || undefined,
      fat: parseFloat(row['Fat'] || row['Fat (g)'] || '') || undefined,
      saturatedFat: parseFloat(row['Saturated Fat'] || row['Saturated fat'] || '') || undefined,
      carbohydrates: parseFloat(row['Carbohydrates'] || row['Carbohydrates (g)'] || '') || undefined,
      sugars: parseFloat(row['Sugars'] || row['Sugars (g)'] || '') || undefined,
      dietaryFiber: parseFloat(row['Fiber'] || row['Dietary Fiber'] || row['Dietary fiber'] || '') || undefined,
      salt: parseFloat(row['Salt'] || row['Salt (g)'] || '') || undefined,
      sodium: parseFloat(row['Sodium'] || row['Sodium (g)'] || '') || undefined,
      calcium: parseFloat(row['Calcium'] || row['Calcium (mg)'] || '') || undefined,
      iron: parseFloat(row['Iron'] || row['Iron (mg)'] || '') || undefined,
    };
  }).filter(food => food.foodName && food.foodName !== 'Food');
  
  fs.writeFileSync(NZFCD_JSON, JSON.stringify(normalized, null, 2));
  const size = fs.statSync(NZFCD_JSON).size;
  console.log(`✅ NZFCD: ${normalized.length} foods, ${(size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Sample: ${normalized[0]?.foodName}`);
} else {
  console.log(`❌ NZFCD Excel not found: ${NZFCD_EXCEL}`);
}

console.log('');

// Convert AFCD
if (fs.existsSync(AFCD_EXCEL)) {
  console.log('Reading AFCD Excel...');
  const wb = XLSX.readFile(AFCD_EXCEL);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws);
  console.log(`Found ${data.length} rows`);
  
  const normalized = data.map((row, index) => {
    const foodName = row['Food Name'] || row['Food name'] || row['Description'] || `Food ${index + 1}`;
    return {
      foodName: String(foodName).trim(),
      foodNameLower: String(foodName).toLowerCase().trim(),
      foodGroup: row['Food Group'] || row['Food group'] || undefined,
      energyKcal: parseFloat(row['Energy (kcal)'] || row['Energy kcal'] || row['EnergyKcal'] || '') || undefined,
      energyKj: parseFloat(row['Energy (kJ)'] || row['Energy kj'] || row['EnergyKj'] || '') || undefined,
      protein: parseFloat(row['Protein'] || row['Protein (g)'] || '') || undefined,
      fat: parseFloat(row['Fat'] || row['Fat (g)'] || '') || undefined,
      saturatedFat: parseFloat(row['Saturated Fat'] || row['Saturated fat'] || '') || undefined,
      carbohydrates: parseFloat(row['Carbohydrates'] || row['Carbohydrates (g)'] || '') || undefined,
      sugars: parseFloat(row['Sugars'] || row['Sugars (g)'] || '') || undefined,
      dietaryFiber: parseFloat(row['Fiber'] || row['Dietary Fiber'] || row['Dietary fiber'] || '') || undefined,
      salt: parseFloat(row['Salt'] || row['Salt (g)'] || '') || undefined,
      sodium: parseFloat(row['Sodium'] || row['Sodium (g)'] || '') || undefined,
      calcium: parseFloat(row['Calcium'] || row['Calcium (mg)'] || '') || undefined,
      iron: parseFloat(row['Iron'] || row['Iron (mg)'] || '') || undefined,
    };
  }).filter(food => food.foodName && food.foodName !== 'Food');
  
  fs.writeFileSync(AFCD_JSON, JSON.stringify(normalized, null, 2));
  const size = fs.statSync(AFCD_JSON).size;
  console.log(`✅ AFCD: ${normalized.length} foods, ${(size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Sample: ${normalized[0]?.foodName}`);
} else {
  console.log(`❌ AFCD Excel not found: ${AFCD_EXCEL}`);
}

console.log('');
console.log('========================================');
console.log('✅ Conversion Complete!');
console.log('========================================');
