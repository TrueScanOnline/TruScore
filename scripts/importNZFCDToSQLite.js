/**
 * Import NZFCD (New Zealand Food Composition Database) Excel files into SQLite
 * This enables the app to query FSANZ by product name (not barcode)
 * 
 * Usage: node scripts/importNZFCDToSQLite.js
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const Database = require('better-sqlite3');

const EXCEL_FILE = path.join(__dirname, '..', 'Database files', 'Principal files', 'Excel files', 'Standard', 'Standard DATA.FT.xlsx');
const DB_PATH = path.join(__dirname, '..', 'src', 'data', 'nzfcd.db');

console.log('========================================');
console.log('Import NZFCD to SQLite');
console.log('========================================');
console.log('');

// Ensure data directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log(`Created directory: ${dbDir}`);
}

// Check if Excel file exists
if (!fs.existsSync(EXCEL_FILE)) {
  console.error(`❌ Excel file not found: ${EXCEL_FILE}`);
  console.error('Please ensure the NZFCD Excel file is in the correct location.');
  process.exit(1);
}

console.log(`Reading Excel file: ${EXCEL_FILE}`);

try {
  // Read Excel file
  const workbook = XLSX.readFile(EXCEL_FILE);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  console.log(`Found ${data.length} rows in spreadsheet`);
  console.log('');

  // Open SQLite database
  const db = new Database(DB_PATH);

  // Create table
  db.exec(`
    CREATE TABLE IF NOT EXISTS nzfcd_foods (
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
    
    CREATE INDEX IF NOT EXISTS idx_food_name ON nzfcd_foods(food_name);
    CREATE INDEX IF NOT EXISTS idx_food_group ON nzfcd_foods(food_group);
    
    DELETE FROM nzfcd_foods;
  `);

  const insert = db.prepare(`
    INSERT INTO nzfcd_foods (
      food_code, food_name, food_name_alt, food_group, food_subgroup,
      edible_portion, energy_kcal, energy_kj, protein, fat_total,
      fat_saturated, carbohydrate_total, carbohydrate_sugars, dietary_fiber,
      calcium, iron, sodium, vitamin_c, raw_data, last_updated
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      insert.run(
        row.food_code || null,
        row.food_name || row['Food Name'] || row['Food name'] || null,
        row.food_name_alt || row['Food Name Alt'] || null,
        row.food_group || row['Food Group'] || row['Food group'] || null,
        row.food_subgroup || row['Food Subgroup'] || row['Food subgroup'] || null,
        row.edible_portion || row['Edible Portion'] || null,
        row.energy_kcal || row['Energy (kcal)'] || row['Energy kcal'] || null,
        row.energy_kj || row['Energy (kJ)'] || row['Energy kj'] || null,
        row.protein || row['Protein'] || null,
        row.fat_total || row['Fat'] || row['Fat (g)'] || null,
        row.fat_saturated || row['Saturated Fat'] || row['Saturated fat'] || null,
        row.carbohydrate_total || row['Carbohydrates'] || row['Carbohydrates (g)'] || null,
        row.carbohydrate_sugars || row['Sugars'] || row['Sugars (g)'] || null,
        row.dietary_fiber || row['Fiber'] || row['Dietary Fiber'] || null,
        row.calcium || row['Calcium'] || null,
        row.iron || row['Iron'] || null,
        row.sodium || row['Sodium'] || null,
        row.vitamin_c || row['Vitamin C'] || null,
        JSON.stringify(row), // Store raw data
        Date.now()
      );
    }
  });

  let processed = 0;
  let skipped = 0;
  const batchSize = 100;
  const batches = [];

  for (let i = 0; i < data.length; i += batchSize) {
    batches.push(data.slice(i, i + batchSize));
  }

  console.log(`Processing ${batches.length} batches...`);

  for (const batch of batches) {
    try {
      insertMany(batch);
      processed += batch.length;
      if (processed % 500 === 0) {
        console.log(`  Processed ${processed}/${data.length} rows...`);
      }
    } catch (error) {
      skipped += batch.length;
      console.warn(`  Skipped batch: ${error.message}`);
    }
  }

  db.close();

  console.log('');
  console.log('========================================');
  console.log('✅ Import Complete!');
  console.log('========================================');
  console.log(`   Processed: ${processed} foods`);
  console.log(`   Skipped: ${skipped} rows`);
  console.log(`   Database: ${DB_PATH}`);
  console.log(`   Size: ${(fs.statSync(DB_PATH).size / 1024 / 1024).toFixed(2)} MB`);
  console.log('');
  console.log('Next step: Copy database to app assets or bundle with app');
  console.log('');

} catch (error) {
  console.error('Error importing NZFCD:', error.message);
  console.error(error.stack);
  process.exit(1);
}
