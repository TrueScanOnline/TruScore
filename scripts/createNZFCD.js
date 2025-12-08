/**
 * Create NZFCD JSON file from Excel
 * This script converts the NZFCD Excel file to JSON format for deployment
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

try {
  console.log('Reading NZFCD database files...');
  
  // Try multiple possible file locations
  const possibleExcelPaths = [
    path.join(__dirname, '..', 'Database files', 'Standard DATA.AP.xlsx'),
    path.join(__dirname, '..', 'Database files', 'Principal files', 'Excel files', 'Standard', 'Standard DATA.FT.xlsx'),
    path.join(__dirname, '..', 'Database files', 'Principal files', 'Excel files', 'Standard', 'Standard DATA.AP.xlsx'),
  ];
  
  let excelPath = null;
  for (const possiblePath of possibleExcelPaths) {
    if (fs.existsSync(possiblePath)) {
      excelPath = possiblePath;
      break;
    }
  }
  
  if (!excelPath) {
    // Fallback: Try reading from ASCII text file
    const textPath = path.join(__dirname, '..', 'Database files', 'Principal files', 'ASCII Text Files', 'Standard', 'Standard DATA.AP');
    if (fs.existsSync(textPath)) {
      console.log(`Excel file not found, reading from ASCII text file: ${textPath}`);
      return convertFromTextFile(textPath);
    }
    throw new Error(`No NZFCD source file found. Tried:\n${possibleExcelPaths.map(p => `  - ${p}`).join('\n')}\n  - ${textPath}`);
  }
  
  console.log(`Reading from: ${excelPath}`);
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
  
  console.log(`Found ${data.length} rows in Excel file`);
  
  // Normalize data
  const normalized = data.map((row, index) => {
    const foodName = String(row['Food Name'] || row['Food name'] || `Food ${index}`).trim();
    return {
      foodName: foodName,
      foodNameLower: foodName.toLowerCase().trim(),
      foodGroup: row['Food Group'] || row['Food group'] || undefined,
      energyKcal: parseFloat(row['Energy (kcal)'] || row['Energy kcal'] || '') || undefined,
      energyKj: parseFloat(row['Energy (kJ)'] || row['Energy kj'] || '') || undefined,
      protein: parseFloat(row['Protein'] || '') || undefined,
      fat: parseFloat(row['Fat'] || '') || undefined,
      saturatedFat: parseFloat(row['Saturated Fat'] || row['Saturated fat'] || '') || undefined,
      carbohydrates: parseFloat(row['Carbohydrates'] || row['Carbohydrates (g)'] || '') || undefined,
      sugars: parseFloat(row['Sugars'] || row['Sugars (g)'] || '') || undefined,
      dietaryFiber: parseFloat(row['Fiber'] || row['Dietary Fiber'] || row['Dietary fiber'] || '') || undefined,
      salt: parseFloat(row['Salt'] || row['Salt (g)'] || '') || undefined,
      sodium: parseFloat(row['Sodium'] || row['Sodium (g)'] || '') || undefined,
      calcium: parseFloat(row['Calcium'] || row['Calcium (mg)'] || '') || undefined,
      iron: parseFloat(row['Iron'] || row['Iron (mg)'] || '') || undefined,
    };
  });
  
  // Create output directory
  const outputDir = path.join(__dirname, '..', 'backend', 'vercel', 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Write JSON file
  const outputPath = path.join(outputDir, 'nzfcd.json');
  fs.writeFileSync(outputPath, JSON.stringify(normalized, null, 2));
  
  const fileSizeMB = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2);
  console.log(`✅ Created: ${normalized.length} foods, ${fileSizeMB} MB`);
  console.log(`   Output: ${outputPath}`);
  
/**
 * Convert from ASCII text file (fallback if Excel not available)
 */
function convertFromTextFile(textPath) {
  const content = fs.readFileSync(textPath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('©'));
  
  // Skip header lines (first 2-3 lines are usually headers)
  const dataLines = lines.slice(2);
  
  console.log(`Found ${dataLines.length} data lines in text file`);
  
  // Parse tab-delimited format: FoodID~Food Name~[nutrients...]
  const normalized = [];
  const seenFoodIds = new Set();
  
  for (const line of dataLines) {
    const parts = line.split('~');
    if (parts.length < 2) continue;
    
    const foodId = parts[0].trim();
    const foodName = parts[1].trim();
    
    // Skip if we've already processed this FoodID (DATA.AP has one row per food)
    if (seenFoodIds.has(foodId)) continue;
    seenFoodIds.add(foodId);
    
    if (!foodName || foodName.length < 2) continue;
    
    // Extract nutrition values (columns vary, try common positions)
    // Standard DATA.AP format: FoodID~Food Name~Alcohol~Alpha-carotene~...~Energy (kcal)~...
    // Energy (kcal) is typically around column 20-25, Energy (kJ) is next
    // Protein, Fat, Carbohydrates, etc. are in various positions
    
    // Try to find energy (kcal) - look for values around position 20-25
    let energyKcal, energyKj, protein, fat, carbohydrates, sugars, dietaryFiber, salt, sodium, calcium, iron;
    
    // Energy (kcal) - typically around index 20-25
    for (let i = 20; i < Math.min(30, parts.length); i++) {
      const val = parseFloat(parts[i]);
      if (!isNaN(val) && val > 0 && val < 1000) {
        energyKcal = val;
        // Energy (kJ) is usually next
        if (i + 1 < parts.length) {
          const kjVal = parseFloat(parts[i + 1]);
          if (!isNaN(kjVal) && kjVal > energyKcal * 3 && kjVal < energyKcal * 5) {
            energyKj = kjVal;
          }
        }
        break;
      }
    }
    
    // Protein - typically around index 50-60
    for (let i = 50; i < Math.min(70, parts.length); i++) {
      const val = parseFloat(parts[i]);
      if (!isNaN(val) && val > 0 && val < 100) {
        protein = val;
        break;
      }
    }
    
    // Fat - typically around index 28-35
    for (let i = 28; i < Math.min(40, parts.length); i++) {
      const val = parseFloat(parts[i]);
      if (!isNaN(val) && val >= 0 && val < 100) {
        fat = val;
        break;
      }
    }
    
    // Carbohydrates - typically around index 10-15
    for (let i = 10; i < Math.min(20, parts.length); i++) {
      const val = parseFloat(parts[i]);
      if (!isNaN(val) && val > 0 && val < 100) {
        carbohydrates = val;
        break;
      }
    }
    
    normalized.push({
      foodName: foodName,
      foodNameLower: foodName.toLowerCase().trim(),
      foodGroup: undefined, // Not in DATA.AP format
      energyKcal: energyKcal,
      energyKj: energyKj,
      protein: protein,
      fat: fat,
      saturatedFat: undefined, // Would need to parse from different position
      carbohydrates: carbohydrates,
      sugars: undefined, // Would need to parse from different position
      dietaryFiber: undefined, // Would need to parse from different position
      salt: undefined,
      sodium: undefined,
      calcium: undefined,
      iron: undefined,
    });
  }
  
  // Create output directory
  const outputDir = path.join(__dirname, '..', 'backend', 'vercel', 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Write JSON file
  const outputPath = path.join(outputDir, 'nzfcd.json');
  fs.writeFileSync(outputPath, JSON.stringify(normalized, null, 2));
  
  const fileSizeMB = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2);
  console.log(`✅ Created: ${normalized.length} foods, ${fileSizeMB} MB`);
  console.log(`   Output: ${outputPath}`);
  console.log(`   ⚠️  Note: Some nutrition fields may be missing (parsed from text file)`);
  console.log(`   💡 For complete data, use Excel file: Standard DATA.AP.xlsx`);
}

} catch (error) {
  console.error('Error creating NZFCD:', error.message);
  process.exit(1);
}
