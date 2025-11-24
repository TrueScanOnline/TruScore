/**
 * FSANZ Database Import Script
 * 
 * This script helps convert FSANZ database exports (Excel/CSV) into
 * a format that can be imported into the TrueScan app.
 * 
 * Usage:
 * 1. Download FSANZ database from:
 *    - AU: https://www.foodstandards.gov.au/science/monitoringnutrients/afcd/Pages/default.aspx
 *    - NZ: https://www.mpi.govt.nz/food-safety/food-monitoring-and-surveillance/food-composition-database/
 * 
 * 2. Convert to JSON:
 *    npm run import-fsanz -- --input downloads/fsanz-au-export.xlsx --output data/fsanz-au.json --country AU
 *    npm run import-fsanz -- --input downloads/fsanz-nz-export.xlsx --output data/fsanz-nz.json --country NZ
 * 
 * 3. Import JSON into app via Settings → Data → FSANZ Database Import
 */

const fs = require('fs');
const path = require('path');

// Try to require xlsx, but handle gracefully if not installed
let XLSX;
try {
  XLSX = require('xlsx');
} catch (error) {
  console.error('Error: xlsx package not found. Please install it first:');
  console.error('  npm install xlsx --save');
  process.exit(1);
}

// Parse command line arguments
const args = process.argv.slice(2);
let inputFile = null;
let outputFile = null;
let country = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--input' && args[i + 1]) {
    inputFile = args[i + 1];
    i++;
  } else if (args[i] === '--output' && args[i + 1]) {
    outputFile = args[i + 1];
    i++;
  } else if (args[i] === '--country' && args[i + 1]) {
    country = args[i + 1].toUpperCase();
    i++;
  }
}

// Validate arguments
if (!inputFile || !outputFile || !country) {
  console.error('Usage: node importFSANZDatabase.js --input <input-file> --output <output-file> --country <AU|NZ>');
  console.error('');
  console.error('Example:');
  console.error('  node importFSANZDatabase.js --input downloads/fsanz-au.xlsx --output data/fsanz-au.json --country AU');
  process.exit(1);
}

if (country !== 'AU' && country !== 'NZ') {
  console.error('Error: Country must be AU or NZ');
  process.exit(1);
}

// Check if input file exists
if (!fs.existsSync(inputFile)) {
  console.error(`Error: Input file not found: ${inputFile}`);
  process.exit(1);
}

// Ensure output directory exists
const outputDir = path.dirname(outputFile);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`Created output directory: ${outputDir}`);
}

console.log(`Converting FSANZ ${country} database...`);
console.log(`Input: ${inputFile}`);
console.log(`Output: ${outputFile}`);

try {
  // Read the Excel/CSV file
  const workbook = XLSX.readFile(inputFile);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  console.log(`Found ${data.length} rows in spreadsheet`);
  
  // Convert to FSANZ database format
  const database = {};
  let processedCount = 0;
  let skippedCount = 0;
  
  for (const row of data) {
    // Extract barcode - try common field names
    const barcode = row.Barcode || row.barcode || row.BARCODE || 
                   row.GTIN || row.gtin || row.Gtin ||
                   row.UPC || row.upc || row.Upc ||
                   row.EAN || row.ean || row.Ean ||
                   row['Product Code'] || row['Product code'] || row['product code'] ||
                   row['Item Code'] || row['Item code'] || row['item code'] ||
                   null;
    
    if (!barcode) {
      skippedCount++;
      continue;
    }
    
    // Convert barcode to string and normalize
    const barcodeStr = String(barcode).replace(/\D/g, ''); // Remove non-digits
    
    if (barcodeStr.length < 8) {
      skippedCount++;
      continue;
    }
    
    // Extract product information
    const productName = row['Product Name'] || row['Product name'] || row['product name'] ||
                       row.Name || row.name || row.NAME ||
                       row['Food Name'] || row['Food name'] || row['food name'] ||
                       row.Product || row.product || row.PRODUCT ||
                       '';
    
    if (!productName) {
      skippedCount++;
      continue;
    }
    
    // Extract brand
    const brand = row.Brand || row.brand || row.BRAND ||
                 row['Brand Name'] || row['Brand name'] || row['brand name'] ||
                 row.Manufacturer || row.manufacturer || row.MANUFACTURER ||
                 '';
    
    // Extract nutrition data
    const energyKcal = parseFloat(row['Energy (kcal)'] || row['Energy kcal'] || row['Energy'] || 
                                 row.Energy || row.ENERGY || row['Energy (kJ)'] ? 
                                 (parseFloat(row['Energy (kJ)']) / 4.184) : 0) || 0;
    
    const fat = parseFloat(row.Fat || row.fat || row['Fat (g)'] || row['Fat g'] || 0) || 0;
    const saturatedFat = parseFloat(row['Saturated Fat'] || row['Saturated fat'] || 
                                   row['Saturated Fat (g)'] || row['Saturated fat (g)'] || 0) || 0;
    const carbohydrates = parseFloat(row.Carbohydrates || row.carbohydrates || 
                                    row['Carbohydrates (g)'] || row['Carbohydrates g'] || 0) || 0;
    const sugars = parseFloat(row.Sugars || row.sugars || row['Sugars (g)'] || row['Sugars g'] || 0) || 0;
    const protein = parseFloat(row.Protein || row.protein || row['Protein (g)'] || row['Protein g'] || 0) || 0;
    const salt = parseFloat(row.Salt || row.salt || row['Salt (g)'] || row['Salt g'] || 0) || 0;
    const sodium = parseFloat(row.Sodium || row.sodium || row['Sodium (g)'] || row['Sodium g'] || 
                              row['Sodium (mg)'] ? (parseFloat(row['Sodium (mg)']) / 1000) : 0) || 0;
    const dietaryFiber = parseFloat(row.Fiber || row.fiber || row['Dietary Fiber'] || 
                                   row['Dietary fiber'] || row['Fiber (g)'] || row['Fiber g'] || 0) || 0;
    
    // Extract ingredients
    const ingredients = row.Ingredients || row.ingredients || row['Ingredients List'] || 
                      row['Ingredients list'] || row['Ingredient List'] || row['Ingredient list'] ||
                      '';
    
    // Extract package/serving size
    const packageSize = row['Package Size'] || row['Package size'] || row['package size'] ||
                       row['Pack Size'] || row['Pack size'] || row['pack size'] ||
                       row.Size || row.size || '';
    
    const servingSize = row['Serving Size'] || row['Serving size'] || row['serving size'] ||
                       row['Serving'] || row.serving || '';
    
    // Extract categories
    const categories = row.Category || row.category || row.Categories || row.categories ||
                      row['Food Category'] || row['Food category'] || row['food category'] ||
                      '';
    
    // Extract health star rating (if available)
    const healthStarRating = parseFloat(row['Health Star Rating'] || row['Health star rating'] || 
                                       row['HSR'] || row.hsr || row.HSR || 0) || undefined;
    
    // Create FSANZ product object
    const fsanzProduct = {
      productName: String(productName).trim(),
      brand: brand ? String(brand).trim() : undefined,
      energyKcal: energyKcal > 0 ? energyKcal : undefined,
      fat: fat > 0 ? fat : undefined,
      saturatedFat: saturatedFat > 0 ? saturatedFat : undefined,
      carbohydrates: carbohydrates > 0 ? carbohydrates : undefined,
      sugars: sugars > 0 ? sugars : undefined,
      protein: protein > 0 ? protein : undefined,
      salt: salt > 0 ? salt : undefined,
      sodium: sodium > 0 ? sodium : undefined,
      dietaryFiber: dietaryFiber > 0 ? dietaryFiber : undefined,
      ingredients: ingredients ? String(ingredients).trim() : undefined,
      packageSize: packageSize ? String(packageSize).trim() : undefined,
      servingSize: servingSize ? String(servingSize).trim() : undefined,
      categories: categories ? (Array.isArray(categories) ? categories : [String(categories).trim()]) : undefined,
      healthStarRating: healthStarRating,
      country: country,
    };
    
    // Store in database (use normalized barcode as key)
    database[barcodeStr] = fsanzProduct;
    processedCount++;
  }
  
  // Write to output file
  fs.writeFileSync(outputFile, JSON.stringify(database, null, 2), 'utf8');
  
  console.log('');
  console.log('✅ Conversion complete!');
  console.log(`   Processed: ${processedCount} products`);
  console.log(`   Skipped: ${skippedCount} rows (missing barcode or product name)`);
  console.log(`   Output: ${outputFile}`);
  console.log(`   Size: ${(fs.statSync(outputFile).size / 1024 / 1024).toFixed(2)} MB`);
  console.log('');
  console.log('Next step: Import the JSON file into the app via Settings → Data → FSANZ Database Import');
  
} catch (error) {
  console.error('Error converting database:', error.message);
  console.error(error.stack);
  process.exit(1);
}


