/**
 * Import Script for New Zealand Food Composition Database (NZFCD)
 * 
 * This script imports FOODfiles™ 2024 dataset into SQLite database
 * 
 * Usage:
 * 1. Download FOODfiles™ 2024 from https://foodcomposition.co.nz/foodfiles
 * 2. Extract the CSV/Excel file
 * 3. Place it in the project root as 'nzfcd_data.csv' or 'nzfcd_data.xlsx'
 * 4. Run: node scripts/importNZFCDDatabase.js
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
  console.warn('Warning: xlsx package not found. Excel files will not be supported.');
  console.warn('  Install with: npm install xlsx --save-dev');
}

const DB_PATH = path.join(__dirname, '../truescan_nzfcd.db');
const CSV_PATH = path.join(__dirname, '../nzfcd_data.csv');
const EXCEL_PATH = path.join(__dirname, '../nzfcd_data.xlsx');
const MSI_PATH = path.join(__dirname, '../foodfiles-2024-v1.msi');
const TABLE_NAME = 'nzfcd_foods';

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
 * Parse Excel file using xlsx library
 */
function parseExcel(filePath) {
  if (!XLSX) {
    throw new Error('xlsx package not installed. Cannot parse Excel files.');
  }
  
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0]; // Use first sheet
  const worksheet = workbook.Sheets[sheetName];
  const foods = XLSX.utils.sheet_to_json(worksheet);
  
  return foods;
}

/**
 * Map NZFCD data to database schema
 */
function mapNZFCDToSchema(foodData) {
  // This mapping will need to be adjusted based on actual NZFCD file structure
  // Common fields in food composition databases:
  return {
    food_code: foodData['Food Code'] || foodData['food_code'] || foodData['Code'] || null,
    food_name: foodData['Food Name'] || foodData['food_name'] || foodData['Name'] || foodData['Description'] || '',
    food_name_alt: foodData['Alternative Name'] || foodData['food_name_alt'] || foodData['Alt Name'] || null,
    food_group: foodData['Food Group'] || foodData['food_group'] || foodData['Group'] || null,
    food_subgroup: foodData['Food Subgroup'] || foodData['food_subgroup'] || foodData['Subgroup'] || null,
    edible_portion: parseFloat(foodData['Edible Portion'] || foodData['edible_portion'] || foodData['EP'] || '100')),
    
    // Macronutrients
    energy_kcal: parseFloat(foodData['Energy (kcal)'] || foodData['energy_kcal'] || foodData['Energy kcal'] || '0')),
    energy_kj: parseFloat(foodData['Energy (kJ)'] || foodData['energy_kj'] || foodData['Energy kJ'] || '0')),
    protein: parseFloat(foodData['Protein'] || foodData['protein'] || '0')),
    fat_total: parseFloat(foodData['Total Fat'] || foodData['fat_total'] || foodData['Fat'] || '0')),
    fat_saturated: parseFloat(foodData['Saturated Fat'] || foodData['fat_saturated'] || foodData['SFA'] || '0')),
    fat_monounsaturated: parseFloat(foodData['Monounsaturated Fat'] || foodData['fat_monounsaturated'] || foodData['MUFA'] || '0')),
    fat_polyunsaturated: parseFloat(foodData['Polyunsaturated Fat'] || foodData['fat_polyunsaturated'] || foodData['PUFA'] || '0')),
    carbohydrate_total: parseFloat(foodData['Total Carbohydrate'] || foodData['carbohydrate_total'] || foodData['Carbohydrate'] || '0')),
    carbohydrate_available: parseFloat(foodData['Available Carbohydrate'] || foodData['carbohydrate_available'] || '0')),
    carbohydrate_sugars: parseFloat(foodData['Sugars'] || foodData['carbohydrate_sugars'] || foodData['Total Sugars'] || '0')),
    dietary_fiber: parseFloat(foodData['Dietary Fiber'] || foodData['dietary_fiber'] || foodData['Fiber'] || '0')),
    
    // Micronutrients
    calcium: parseFloat(foodData['Calcium'] || foodData['calcium'] || '0')),
    iron: parseFloat(foodData['Iron'] || foodData['iron'] || '0')),
    magnesium: parseFloat(foodData['Magnesium'] || foodData['magnesium'] || '0')),
    phosphorus: parseFloat(foodData['Phosphorus'] || foodData['phosphorus'] || '0')),
    potassium: parseFloat(foodData['Potassium'] || foodData['potassium'] || '0')),
    sodium: parseFloat(foodData['Sodium'] || foodData['sodium'] || '0')),
    zinc: parseFloat(foodData['Zinc'] || foodData['zinc'] || '0')),
    copper: parseFloat(foodData['Copper'] || foodData['copper'] || '0')),
    manganese: parseFloat(foodData['Manganese'] || foodData['manganese'] || '0')),
    selenium: parseFloat(foodData['Selenium'] || foodData['selenium'] || '0')),
    
    // Vitamins
    vitamin_a: parseFloat(foodData['Vitamin A'] || foodData['vitamin_a'] || foodData['Vit A'] || '0')),
    vitamin_c: parseFloat(foodData['Vitamin C'] || foodData['vitamin_c'] || foodData['Vit C'] || '0')),
    vitamin_d: parseFloat(foodData['Vitamin D'] || foodData['vitamin_d'] || foodData['Vit D'] || '0')),
    vitamin_e: parseFloat(foodData['Vitamin E'] || foodData['vitamin_e'] || foodData['Vit E'] || '0')),
    vitamin_k: parseFloat(foodData['Vitamin K'] || foodData['vitamin_k'] || foodData['Vit K'] || '0')),
    thiamin: parseFloat(foodData['Thiamin'] || foodData['thiamin'] || foodData['Vitamin B1'] || '0')),
    riboflavin: parseFloat(foodData['Riboflavin'] || foodData['riboflavin'] || foodData['Vitamin B2'] || '0')),
    niacin: parseFloat(foodData['Niacin'] || foodData['niacin'] || foodData['Vitamin B3'] || '0')),
    vitamin_b6: parseFloat(foodData['Vitamin B6'] || foodData['vitamin_b6'] || foodData['Vit B6'] || '0')),
    folate: parseFloat(foodData['Folate'] || foodData['folate'] || foodData['Folic Acid'] || '0')),
    vitamin_b12: parseFloat(foodData['Vitamin B12'] || foodData['vitamin_b12'] || foodData['Vit B12'] || '0')),
    
    // Store additional nutrients as JSON
    raw_data: JSON.stringify(foodData),
    last_updated: Date.now(),
    source: 'nzfcd',
  };
}

/**
 * Main import function
 */
async function importNZFCDDatabase() {
  console.log('Starting NZFCD database import...');
  
  let foods = [];
  let dataSource = '';
  
  // Check for Excel file first
  if (fs.existsSync(EXCEL_PATH)) {
    console.log('Reading Excel file...');
    foods = parseExcel(EXCEL_PATH);
    dataSource = 'Excel';
  }
  // Check for CSV file
  else if (fs.existsSync(CSV_PATH)) {
    console.log('Reading CSV file...');
    const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
    foods = parseCSV(csvContent);
    dataSource = 'CSV';
  }
  // Check for MSI installer (note: requires manual extraction)
  else if (fs.existsSync(MSI_PATH)) {
    console.error('MSI installer found, but data files need to be extracted manually.');
    console.error('Please install the MSI file and extract the Excel/CSV files from:');
    console.error('  C:\\FOODfiles\\ (default installation location)');
    console.error('Look for files like "Standard DATA.AP" or "Unabridged DATA.AP"');
    console.error('Then convert to CSV or Excel format and place as "nzfcd_data.csv" or "nzfcd_data.xlsx"');
    process.exit(1);
  }
  else {
    console.error(`Error: No data file found.`);
    console.error('Please download FOODfiles™ 2024 from https://foodcomposition.co.nz/foodfiles');
    console.error('Options:');
    console.error('  1. Download MSI installer, install it, extract Excel files, convert to CSV/Excel');
    console.error('  2. Place as "nzfcd_data.csv" or "nzfcd_data.xlsx" in the project root');
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
      source TEXT DEFAULT 'nzfcd'
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
      const mapped = mapNZFCDToSchema(foodData);
      
      if (!mapped.food_name) {
        errors++;
        continue;
      }
      
      db.prepare(
        `INSERT INTO ${TABLE_NAME} (
          food_code, food_name, food_name_alt, food_group, food_subgroup, edible_portion,
          energy_kcal, energy_kj, protein, fat_total, fat_saturated, fat_monounsaturated, fat_polyunsaturated,
          carbohydrate_total, carbohydrate_available, carbohydrate_sugars, dietary_fiber,
          calcium, iron, magnesium, phosphorus, potassium, sodium, zinc, copper, manganese, selenium,
          vitamin_a, vitamin_c, vitamin_d, vitamin_e, vitamin_k,
          thiamin, riboflavin, niacin, vitamin_b6, folate, vitamin_b12,
          raw_data, last_updated, source
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          mapped.food_code, mapped.food_name, mapped.food_name_alt, mapped.food_group, mapped.food_subgroup, mapped.edible_portion,
          mapped.energy_kcal, mapped.energy_kj, mapped.protein, mapped.fat_total, mapped.fat_saturated, mapped.fat_monounsaturated, mapped.fat_polyunsaturated,
          mapped.carbohydrate_total, mapped.carbohydrate_available, mapped.carbohydrate_sugars, mapped.dietary_fiber,
          mapped.calcium, mapped.iron, mapped.magnesium, mapped.phosphorus, mapped.potassium, mapped.sodium, mapped.zinc, mapped.copper, mapped.manganese, mapped.selenium,
          mapped.vitamin_a, mapped.vitamin_c, mapped.vitamin_d, mapped.vitamin_e, mapped.vitamin_k,
          mapped.thiamin, mapped.riboflavin, mapped.niacin, mapped.vitamin_b6, mapped.folate, mapped.vitamin_b12,
          mapped.raw_data, mapped.last_updated, mapped.source,
        ]
      ).run();
      
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
importNZFCDDatabase().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

