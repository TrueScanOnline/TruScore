/**
 * Import Script for Australian Food Composition Database (AFCD)
 * 
 * This script imports AFCD dataset into SQLite database
 * 
 * Usage:
 * 1. Download AFCD dataset from https://www.foodstandards.govt.nz/science-data/monitoringnutrients/afcd
 * 2. Extract the CSV/Excel file
 * 3. Place it in the project root as 'afcd_data.csv' or 'afcd_data.xlsx'
 * 4. Run: node scripts/importAFCDDatabase.js
 * 
 * Note: The exact format may vary - adjust parsing logic based on actual file structure
 */

const fs = require('fs');
const path = require('path');

// Use better-sqlite3 for Node.js (install with: npm install better-sqlite3)
let Database;
try {
  Database = require('better-sqlite3');
} catch (error) {
  console.error('Error: better-sqlite3 package not found. Please install it first:');
  console.error('  npm install better-sqlite3 --save-dev');
  process.exit(1);
}

// Try to require xlsx for Excel file support
let XLSX;
try {
  XLSX = require('xlsx');
} catch (error) {
  console.error('Error: xlsx package not found. Please install it first:');
  console.error('  npm install xlsx --save-dev');
  process.exit(1);
}

const DB_PATH = path.join(__dirname, '../truescan_afcd.db');
const CSV_PATH = path.join(__dirname, '../afcd_data.csv');
const EXCEL_NUTRIENT_PATH = path.join(__dirname, '../afcd_nutrient_file.xlsx');
const EXCEL_FOOD_PATH = path.join(__dirname, '../afcd_food_details.xlsx');
const TABLE_NAME = 'afcd_foods';

/**
 * Parse CSV file (basic CSV parser - may need adjustment based on actual format)
 */
function parseCSV(csvContent) {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  const foods = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const food = {};
    
    headers.forEach((header, index) => {
      food[header] = values[index] || null;
    });
    
    foods.push(food);
  }
  
  return foods;
}

/**
 * Parse Excel file - AFCD uses wide format (one row per food, nutrients as columns)
 */
function parseExcelFiles() {
  if (!XLSX) {
    throw new Error('xlsx package not installed. Cannot parse Excel files.');
  }
  
  // Read nutrient file (main data)
  const nutrientWorkbook = XLSX.readFile(EXCEL_NUTRIENT_PATH);
  
  // AFCD has sheets: "Index", "All solids & liquids per 100g", "Liquids only per 100mL"
  // Use "All solids & liquids per 100g" sheet (index 1)
  const dataSheetName = nutrientWorkbook.SheetNames[1] || 
                        nutrientWorkbook.SheetNames.find(name => name.toLowerCase().includes('100g')) ||
                        nutrientWorkbook.SheetNames[0];
  
  const dataSheet = nutrientWorkbook.Sheets[dataSheetName];
  const foods = XLSX.utils.sheet_to_json(dataSheet, { defval: null });
  
  // Read food details file (for additional metadata)
  let foodDetailsData = {};
  if (fs.existsSync(EXCEL_FOOD_PATH)) {
    const foodWorkbook = XLSX.readFile(EXCEL_FOOD_PATH);
    const foodSheet = foodWorkbook.Sheets[foodWorkbook.SheetNames[0]];
    const foodData = XLSX.utils.sheet_to_json(foodSheet, { defval: null });
    
    // Create lookup by Key
    foodData.forEach(food => {
      const key = food.Key || food['Public Food Key'];
      if (key) {
        foodDetailsData[key] = food;
      }
    });
  }
  
  // Process foods - each row is a food with all nutrients as columns
  const processedFoods = foods.map(food => {
    const foodKey = food['Public Food Key'] || food.Key;
    if (!foodKey) return null;
    
    // Extract all nutrient columns (everything except metadata columns)
    const metadataColumns = ['Public Food Key', 'Classification', 'Food Name', 'Key', 'Name', 'Description'];
    const nutrients = {};
    
    Object.keys(food).forEach(key => {
      if (!metadataColumns.includes(key) && food[key] !== null && food[key] !== undefined && food[key] !== '') {
        const value = parseFloat(food[key]);
        if (!isNaN(value)) {
          nutrients[key] = {
            name: key,
            value: value,
          };
        }
      }
    });
    
    return {
      food_code: foodKey,
      food_name: food['Food Name'] || food.Name || '',
      food_group: food.Classification || food['Food Group'] || null,
      nutrients: nutrients,
      ...(foodDetailsData[foodKey] || {}),
    };
  }).filter(f => f !== null);
  
  return processedFoods;
}

/**
 * Map AFCD data to database schema
 */
function mapAFCDToSchema(foodData) {
  // Extract nutrient values from nutrients object
  const nutrients = foodData.nutrients || {};
  
  // Map common nutrients - AFCD uses descriptive column names
  const getNutrient = (names) => {
    for (const name of names) {
      // Try exact match first
      if (nutrients[name]) {
        return nutrients[name].value;
      }
      // Try case-insensitive partial match
      const matchingKey = Object.keys(nutrients).find(key => 
        key.toLowerCase().includes(name.toLowerCase())
      );
      if (matchingKey) {
        return nutrients[matchingKey].value;
      }
    }
    return 0;
  };
  
  // Energy (kJ - AFCD provides kJ, convert to kcal)
  const energyKj = getNutrient([
    'Energy with dietary fibre, equated (kJ)',
    'Energy, without dietary fibre, equated (kJ)',
    'Energy (kJ)',
    'Energy kJ'
  ]);
  const energyKcal = energyKj ? energyKj / 4.184 : 0;
  
  return {
    food_code: foodData.food_code || foodData.Key || foodData['Food Code'] || null,
    food_name: foodData.Name || foodData['Food Name'] || foodData['food_name'] || foodData['Description'] || '',
    food_name_alt: foodData['Common Names'] || foodData['Alternative Name'] || foodData['food_name_alt'] || null,
    food_group: foodData['Food Group'] || foodData['food_group'] || foodData['Group'] || null,
    food_subgroup: foodData['Food Subgroup'] || foodData['food_subgroup'] || foodData['Subgroup'] || null,
    edible_portion: 100, // AFCD data is per 100g
    
    // Macronutrients (AFCD column names)
    energy_kcal: energyKcal || 0,
    energy_kj: energyKj || 0,
    protein: getNutrient(['Protein (g)', 'Protein']) || 0,
    fat_total: getNutrient(['Fat, total (g)', 'Fat total', 'Total Fat']) || 0,
    fat_saturated: getNutrient(['Total saturated fatty acids, equated (g)', 'Saturated Fat', 'SFA']) || 0,
    fat_monounsaturated: getNutrient(['Total monounsaturated fatty acids, equated (g)', 'Monounsaturated Fat', 'MUFA']) || 0,
    fat_polyunsaturated: getNutrient(['Total polyunsaturated fatty acids, equated (g)', 'Polyunsaturated Fat', 'PUFA']) || 0,
    carbohydrate_total: getNutrient(['Available carbohydrate, with sugar alcohols (g)', 'Total Carbohydrate', 'Carbohydrate']) || 0,
    carbohydrate_available: getNutrient(['Available carbohydrate, with sugar alcohols (g)', 'Available Carbohydrate']) || 0,
    carbohydrate_sugars: getNutrient(['Total sugars (g)', 'Sugars', 'Total Sugars']) || 0,
    dietary_fiber: getNutrient(['Total dietary fibre (g)', 'Dietary Fiber', 'Fiber', 'Fibre']) || 0,
    
    // Micronutrients (AFCD uses mg/ug units)
    calcium: getNutrient(['Calcium (Ca) (mg)', 'Calcium']) || 0,
    iron: getNutrient(['Iron (Fe) (mg)', 'Iron']) || 0,
    magnesium: getNutrient(['Magnesium (Mg) (mg)', 'Magnesium']) || 0,
    phosphorus: getNutrient(['Phosphorus (P) (mg)', 'Phosphorus']) || 0,
    potassium: getNutrient(['Potassium (K) (mg)', 'Potassium']) || 0,
    sodium: getNutrient(['Sodium (Na) (mg)', 'Sodium']) || 0,
    zinc: getNutrient(['Zinc (Zn) (mg)', 'Zinc']) || 0,
    copper: getNutrient(['Copper (Cu) (mg)', 'Copper']) || 0,
    manganese: getNutrient(['Manganese (Mn) (mg)', 'Manganese']) || 0,
    selenium: getNutrient(['Selenium (Se) (ug)', 'Selenium']) || 0,
    
    // Vitamins (AFCD column names)
    vitamin_a: getNutrient(['Vitamin A retinol equivalents (ug)', 'Vitamin A']) || 0,
    vitamin_c: getNutrient(['Vitamin C (mg)', 'Vitamin C']) || 0,
    vitamin_d: getNutrient(['Vitamin D3 equivalents (ug)', 'Vitamin D']) || 0,
    vitamin_e: getNutrient(['Vitamin E (mg)', 'Vitamin E']) || 0,
    vitamin_k: 0, // AFCD may not have Vitamin K in this format
    thiamin: getNutrient(['Thiamin (B1) (mg)', 'Thiamin', 'Vitamin B1']) || 0,
    riboflavin: getNutrient(['Riboflavin (B2) (mg)', 'Riboflavin', 'Vitamin B2']) || 0,
    niacin: getNutrient(['Niacin derived equivalents (mg)', 'Niacin (B3) (mg)', 'Niacin', 'Vitamin B3']) || 0,
    vitamin_b6: getNutrient(['Pyridoxine (B6) (mg)', 'Vitamin B6']) || 0,
    folate: getNutrient(['Total folates (ug)', 'Folate', 'Folic Acid']) || 0,
    vitamin_b12: getNutrient(['Cobalamin (B12) (ug)', 'Vitamin B12']) || 0,
    
    // Store all additional nutrients (up to 256) as JSON
    raw_data: JSON.stringify(nutrients),
    last_updated: Date.now(),
    source: 'afcd',
  };
}

/**
 * Main import function
 */
async function importAFCDDatabase() {
  console.log('Starting AFCD database import...');
  
  let foods = [];
  let dataSource = '';
  
  // Check for Excel files first (preferred - direct download)
  if (fs.existsSync(EXCEL_NUTRIENT_PATH)) {
    console.log('Reading Excel files...');
    foods = parseExcelFiles();
    dataSource = 'Excel';
  }
  // Check for CSV file
  else if (fs.existsSync(CSV_PATH)) {
    console.log('Reading CSV file...');
    const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
    foods = parseCSV(csvContent);
    dataSource = 'CSV';
  }
  else {
    console.error(`Error: No data file found.`);
    console.error('Please download AFCD dataset from:');
    console.error('  https://www.foodstandards.govt.nz/science-data/food-nutrient-databases/afcd/australian-food-composition-database-download-excel-files');
    console.error('Download "Release 2 - Nutrient file (Excel)" and place as "afcd_nutrient_file.xlsx"');
    console.error('Optionally download "Release 2 - Food Details (Excel)" and place as "afcd_food_details.xlsx"');
    process.exit(1);
  }
  
  console.log(`Found ${foods.length} foods in ${dataSource} file`);
  
  // Open database
  console.log('Opening database...');
  const db = new Database(DB_PATH);
  
  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL');
  
  // Initialize database (create table)
  db.exec(`
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      food_code TEXT UNIQUE,
      food_name TEXT NOT NULL,
      food_name_alt TEXT,
      food_group TEXT,
      food_subgroup TEXT,
      edible_portion REAL,
      energy_kcal REAL,
      energy_kj REAL,
      protein REAL,
      fat_total REAL,
      fat_saturated REAL,
      fat_monounsaturated REAL,
      fat_polyunsaturated REAL,
      carbohydrate_total REAL,
      carbohydrate_available REAL,
      carbohydrate_sugars REAL,
      dietary_fiber REAL,
      calcium REAL,
      iron REAL,
      magnesium REAL,
      phosphorus REAL,
      potassium REAL,
      sodium REAL,
      zinc REAL,
      copper REAL,
      manganese REAL,
      selenium REAL,
      vitamin_a REAL,
      vitamin_c REAL,
      vitamin_d REAL,
      vitamin_e REAL,
      vitamin_k REAL,
      thiamin REAL,
      riboflavin REAL,
      niacin REAL,
      vitamin_b6 REAL,
      folate REAL,
      vitamin_b12 REAL,
      raw_data TEXT,
      last_updated INTEGER,
      source TEXT DEFAULT 'afcd'
    );
    
    CREATE INDEX IF NOT EXISTS idx_food_name ON ${TABLE_NAME}(food_name);
    CREATE INDEX IF NOT EXISTS idx_food_group ON ${TABLE_NAME}(food_group);
  `);
  
  // Clear existing data
  console.log('Clearing existing data...');
  db.exec(`DELETE FROM ${TABLE_NAME}`);
  
  // Insert foods
  console.log('Inserting foods into database...');
  let inserted = 0;
  let errors = 0;
  
  for (const foodData of foods) {
    try {
      const mapped = mapAFCDToSchema(foodData);
      
      if (!mapped.food_name) {
        errors++;
        continue;
      }
      
      const stmt = db.prepare(
        `INSERT INTO ${TABLE_NAME} (
          food_code, food_name, food_name_alt, food_group, food_subgroup, edible_portion,
          energy_kcal, energy_kj, protein, fat_total, fat_saturated, fat_monounsaturated, fat_polyunsaturated,
          carbohydrate_total, carbohydrate_available, carbohydrate_sugars, dietary_fiber,
          calcium, iron, magnesium, phosphorus, potassium, sodium, zinc, copper, manganese, selenium,
          vitamin_a, vitamin_c, vitamin_d, vitamin_e, vitamin_k,
          thiamin, riboflavin, niacin, vitamin_b6, folate, vitamin_b12,
          raw_data, last_updated, source
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      
      stmt.run(
        mapped.food_code, mapped.food_name, mapped.food_name_alt, mapped.food_group, mapped.food_subgroup, mapped.edible_portion,
        mapped.energy_kcal, mapped.energy_kj, mapped.protein, mapped.fat_total, mapped.fat_saturated, mapped.fat_monounsaturated, mapped.fat_polyunsaturated,
        mapped.carbohydrate_total, mapped.carbohydrate_available, mapped.carbohydrate_sugars, mapped.dietary_fiber,
        mapped.calcium, mapped.iron, mapped.magnesium, mapped.phosphorus, mapped.potassium, mapped.sodium, mapped.zinc, mapped.copper, mapped.manganese, mapped.selenium,
        mapped.vitamin_a, mapped.vitamin_c, mapped.vitamin_d, mapped.vitamin_e, mapped.vitamin_k,
        mapped.thiamin, mapped.riboflavin, mapped.niacin, mapped.vitamin_b6, mapped.folate, mapped.vitamin_b12,
        mapped.raw_data, mapped.last_updated, mapped.source
      );
      
      inserted++;
      if (inserted % 100 === 0) {
        console.log(`Inserted ${inserted} foods...`);
      }
    } catch (error) {
      errors++;
      if (errors <= 10) {
        console.error(`Error inserting food:`, error.message);
      }
    }
  }
  
  console.log(`\nImport complete!`);
  console.log(`- Inserted: ${inserted} foods`);
  console.log(`- Errors: ${errors} foods`);
  console.log(`\nDatabase saved to: ${DB_PATH}`);
  
  db.close();
}

// Run import
importAFCDDatabase().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

