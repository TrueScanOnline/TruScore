/**
 * Create AFCD JSON file from Excel
 * This script converts the AFCD Excel file to JSON format for deployment
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

try {
  console.log('Reading AFCD Excel files...');
  const nutrientPath = path.join(__dirname, '..', 'Database files', 'AU Release 2 - Nutrient file.xlsx');
  const foodDetailsPath = path.join(__dirname, '..', 'Database files', 'AU Release 2 - Food Details.xlsx');
  
  if (!fs.existsSync(nutrientPath)) {
    throw new Error(`Nutrient file not found: ${nutrientPath}`);
  }
  
  const nutrientWorkbook = XLSX.readFile(nutrientPath);
  console.log(`Nutrient file sheets: ${nutrientWorkbook.SheetNames.join(', ')}`);
  
  // Collect data from ALL relevant sheets in Nutrient file
  let allFoods = [];
  
  // Process "All solids & liquids per 100g" sheet
  const solidsSheet = nutrientWorkbook.SheetNames.find(name => 
    name.toLowerCase().includes('100g') || 
    (name.toLowerCase().includes('solids') && name.toLowerCase().includes('liquids'))
  );
  
  if (solidsSheet) {
    console.log(`Processing sheet: ${solidsSheet}`);
    const solidsData = XLSX.utils.sheet_to_json(nutrientWorkbook.Sheets[solidsSheet], { defval: null });
    console.log(`  Found ${solidsData.length} foods in solids & liquids sheet`);
    allFoods = allFoods.concat(solidsData);
  }
  
  // Process "Liquids only per 100mL" sheet
  const liquidsSheet = nutrientWorkbook.SheetNames.find(name => 
    name.toLowerCase().includes('100ml') || 
    (name.toLowerCase().includes('liquids') && name.toLowerCase().includes('only'))
  );
  
  if (liquidsSheet) {
    console.log(`Processing sheet: ${liquidsSheet}`);
    const liquidsData = XLSX.utils.sheet_to_json(nutrientWorkbook.Sheets[liquidsSheet], { defval: null });
    console.log(`  Found ${liquidsData.length} foods in liquids only sheet`);
    allFoods = allFoods.concat(liquidsData);
  }
  
  // If no specific sheets found, use all non-index sheets
  if (allFoods.length === 0) {
    nutrientWorkbook.SheetNames.forEach(name => {
      if (!name.toLowerCase().includes('index') && !name.toLowerCase().includes('readme')) {
        const data = XLSX.utils.sheet_to_json(nutrientWorkbook.Sheets[name], { defval: null });
        console.log(`Processing sheet: ${name} (${data.length} rows)`);
        allFoods = allFoods.concat(data);
      }
    });
  }
  
  console.log(`Total foods from Nutrient file: ${allFoods.length}`);
  
  // Load Food Details file - include ALL foods as separate entries (same as NZFCD)
  let foodDetailsFoods = [];
  let foodDetailsMap = {};
  if (fs.existsSync(foodDetailsPath)) {
    console.log(`\nReading Food Details file (ALL foods will be included)...`);
    const foodDetailsWorkbook = XLSX.readFile(foodDetailsPath);
    console.log(`Food Details sheets: ${foodDetailsWorkbook.SheetNames.join(', ')}`);
    
    // Process ALL sheets in Food Details file
    foodDetailsWorkbook.SheetNames.forEach(sheetName => {
      // Skip index/readme sheets
      if (sheetName.toLowerCase().includes('index') || sheetName.toLowerCase().includes('readme')) {
        console.log(`  Skipping metadata sheet: ${sheetName}`);
        return;
      }
      
      const detailsData = XLSX.utils.sheet_to_json(foodDetailsWorkbook.Sheets[sheetName], { defval: null });
      console.log(`  Processing sheet ${sheetName}: ${detailsData.length} rows`);
      
      // Add ALL foods from Food Details as separate entries
      foodDetailsFoods = foodDetailsFoods.concat(detailsData);
      
      // Also create lookup map for merging metadata
      detailsData.forEach(row => {
        const key = row['Public Food Key'] || row['Key'] || row['Food Name'] || row['Food name'];
        if (key) {
          foodDetailsMap[key] = row;
        }
      });
    });
    console.log(`  ✅ Loaded ${foodDetailsFoods.length} foods from Food Details file`);
    console.log(`  ✅ Total unique food details for metadata: ${Object.keys(foodDetailsMap).length}`);
  } else {
    console.log(`\n⚠️  Food Details file not found: ${foodDetailsPath}`);
  }
  
  // Combine Nutrient file foods with Food Details foods
  const data = allFoods.concat(foodDetailsFoods);
  console.log(`\nTotal foods combined (Nutrient + Food Details): ${data.length}`);
  
  // Debug: Show first row structure
  if (data.length > 0) {
    console.log(`\nColumns found: ${Object.keys(data[0]).length}`);
    console.log(`First 10 columns: ${Object.keys(data[0]).slice(0, 10).join(', ')}`);
  }
  
  // Normalize data - AFCD uses various column name formats
  // Track processed keys to avoid duplicates when merging Nutrient + Food Details
  const processedKeys = new Set();
  const normalized = data.map((row, index) => {
    // Get Public Food Key for merging with Food Details
    const foodKey = row['Public Food Key'] || row['Key'] || row['Food Key'] || row['PublicFoodKey'];
    
    // Try multiple possible column names for food name - be very flexible for Food Details
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
      foodKey ||
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
    
    // Merge with Food Details if available (for metadata enrichment)
    if (foodKey && foodDetailsMap[foodKey]) {
      const details = foodDetailsMap[foodKey];
      // Use Food Details name if it's better
      if (details['Food Name'] || details['Food name'] || details['Name']) {
        foodName = String(details['Food Name'] || details['Food name'] || details['Name']).trim();
      }
    }
    
    // Mark this key as processed (for duplicate detection)
    if (foodKey) {
      processedKeys.add(foodKey);
    }
    
    // Helper function to find nutrient value by multiple possible column names
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
      energyKcal: getNutrient(['Energy (kcal)', 'Energy kcal', 'Energy_kcal', 'EnergyKcal', 'ENERGY_KCAL', 'Energy, kcal']),
      energyKj: getNutrient(['Energy (kJ)', 'Energy kj', 'Energy_kj', 'EnergyKj', 'ENERGY_KJ', 'Energy, kJ']),
      protein: getNutrient(['Protein', 'Protein (g)', 'Protein_g', 'PROTEIN', 'Protein, g']),
      fat: getNutrient(['Fat', 'Fat (g)', 'Fat_g', 'FAT', 'Total fat', 'Fat, g']),
      saturatedFat: getNutrient(['Saturated Fat', 'Saturated fat', 'Saturated_fat', 'SaturatedFat', 'SATURATED_FAT', 'Saturated fatty acids']),
      carbohydrates: getNutrient(['Carbohydrates', 'Carbohydrates (g)', 'Carbohydrates_g', 'CARBOHYDRATES', 'Carbohydrate', 'Carbohydrate, g']),
      sugars: getNutrient(['Sugars', 'Sugars (g)', 'Sugars_g', 'SUGARS', 'Total sugars', 'Sugars, g']),
      dietaryFiber: getNutrient(['Fiber', 'Dietary Fiber', 'Dietary fiber', 'Dietary_fiber', 'DietaryFiber', 'FIBER', 'Fibre', 'Dietary fibre']),
      salt: getNutrient(['Salt', 'Salt (g)', 'Salt_g', 'SALT', 'Salt, g']),
      sodium: getNutrient(['Sodium', 'Sodium (g)', 'Sodium (mg)', 'Sodium_g', 'Sodium_mg', 'SODIUM']),
      calcium: getNutrient(['Calcium', 'Calcium (mg)', 'Calcium_mg', 'CALCIUM']),
      iron: getNutrient(['Iron', 'Iron (mg)', 'Iron_mg', 'IRON']),
    };
  }).filter(food => {
    // More lenient filter - include entries even if they only have a name
    // Food Details entries might not have nutrients, but they're still valid foods
    return food.foodName && 
           food.foodName !== 'Food' && 
           food.foodName.length > 1 &&
           !food.foodName.match(/^Food \d+$/); // Exclude generic "Food 123" entries without real names
  });
  
  // Create output directory
  const outputDir = path.join(__dirname, '..', 'backend', 'vercel', 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Write JSON file
  const outputPath = path.join(outputDir, 'afcd.json');
  fs.writeFileSync(outputPath, JSON.stringify(normalized, null, 2));
  
  const fileSizeMB = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2);
  console.log(`✅ Created: ${normalized.length} foods, ${fileSizeMB} MB`);
  console.log(`   Output: ${outputPath}`);
  
} catch (error) {
  console.error('Error creating AFCD:', error.message);
  process.exit(1);
}
