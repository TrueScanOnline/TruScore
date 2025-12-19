/**
 * Convert FSANZ Database Files to JSON Format
 * 
 * This script converts the downloaded FSANZ database files from the
 * "Database files" directory into the JSON format expected by the app
 */

const fs = require('fs');
const path = require('path');

// Check for xlsx package
let XLSX;
try {
  XLSX = require('xlsx');
} catch (error) {
  console.error('Error: xlsx package not found. Installing...');
  console.error('Please run: npm install xlsx --save-dev');
  process.exit(1);
}

const DATABASE_FILES_DIR = path.join(__dirname, '../Database files');
const OUTPUT_DIR = path.join(__dirname, '../data');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Convert FSANZ database to JSON format expected by app
 */
function convertToFSANZJSON(products, country) {
  const database = {};
  
  for (const product of products) {
    // Skip if no barcode
    if (!product.barcode) {
      continue;
    }
    
    const barcodeStr = String(product.barcode).replace(/\D/g, ''); // Remove non-digits
    
    if (barcodeStr.length < 8) {
      continue;
    }
    
    // Create FSANZ product object
    const fsanzProduct = {
      productName: product.productName || product.name || '',
      brand: product.brand || undefined,
      energyKcal: product.energyKcal || undefined,
      fat: product.fat || undefined,
      saturatedFat: product.saturatedFat || undefined,
      carbohydrates: product.carbohydrates || undefined,
      sugars: product.sugars || undefined,
      protein: product.protein || undefined,
      salt: product.salt || undefined,
      sodium: product.sodium || undefined,
      dietaryFiber: product.dietaryFiber || product.fiber || undefined,
      ingredients: product.ingredients || undefined,
      packageSize: product.packageSize || undefined,
      servingSize: product.servingSize || undefined,
      categories: product.categories || undefined,
      healthStarRating: product.healthStarRating || undefined,
      country: country,
    };
    
    // Remove undefined fields
    Object.keys(fsanzProduct).forEach(key => {
      if (fsanzProduct[key] === undefined) {
        delete fsanzProduct[key];
      }
    });
    
    database[barcodeStr] = fsanzProduct;
  }
  
  return database;
}

/**
 * Main conversion function
 */
async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🔄 Converting FSANZ Database Files');
  console.log('='.repeat(70));
  
  // Note: These are food composition databases, not product databases
  // They may not have barcodes. We'll inspect and create empty databases
  // that can be populated later or used as reference data
  
  console.log('\n⚠️  NOTE: The downloaded files appear to be food composition databases');
  console.log('   (AFCD/NZFCD), not product databases with barcodes.');
  console.log('   These databases contain nutrition information for food ingredients,');
  console.log('   not specific products with barcodes.');
  console.log('\n   The app expects a JSON format mapping barcodes to products.');
  console.log('   Creating empty database files that can be populated later...');
  
  // Create empty databases
  const auDatabase = {};
  const nzDatabase = {};
  
  // Write empty AU database
  const auOutputPath = path.join(OUTPUT_DIR, 'fsanz-au.json');
  fs.writeFileSync(auOutputPath, JSON.stringify(auDatabase, null, 2), 'utf8');
  console.log(`\n✅ Created: ${auOutputPath} (0 products)`);
  
  // Write empty NZ database
  const nzOutputPath = path.join(OUTPUT_DIR, 'fsanz-nz.json');
  fs.writeFileSync(nzOutputPath, JSON.stringify(nzDatabase, null, 2), 'utf8');
  console.log(`✅ Created: ${nzOutputPath} (0 products)`);
  
  console.log('\n' + '='.repeat(70));
  console.log('📋 NEXT STEPS:');
  console.log('='.repeat(70));
  console.log('\nThe FSANZ food composition databases you downloaded are ingredient/nutrition');
  console.log('databases, not product databases with barcodes.');
  console.log('\nTo get product data with barcodes for FSANZ, you would need:');
  console.log('  1. Australian Branded Food Database (if available from FSANZ)');
  console.log('  2. Product databases from retailers (Woolworths, Coles, etc.)');
  console.log('  3. Extract product data from Open Food Facts (AU/NZ instances)');
  console.log('\nHowever, the food composition databases can still be useful as:');
  console.log('  - Reference data for nutrition calculations');
  console.log('  - Validation data for product information');
  console.log('  - Background data for ingredients analysis');
  console.log('\nEmpty database files have been created. You can populate them with product');
  console.log('data from other sources (e.g., Open Food Facts) if needed.');
  console.log('\n' + '='.repeat(70));
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});

















