/**
 * FSANZ Database Import Script
 * 
 * This script helps convert FSANZ database exports (Excel/CSV) into
 * a format that can be imported into the TrueScan app.
 * 
 * Usage:
 * 1. Download FSANZ database exports from:
 *    - AU: https://www.foodstandards.gov.au/science/monitoringnutrients/afcd/Pages/default.aspx
 *    - NZ: https://www.mpi.govt.nz/food-safety/food-monitoring-and-surveillance/food-composition-database/
 * 
 * 2. Convert Excel/CSV to JSON:
 *    node scripts/importFSANZDatabase.js --input path/to/fsanz-export.xlsx --output fsanz-au.json --country AU
 * 
 * 3. The output JSON can then be imported into the app
 */

const fs = require('fs');
const path = require('path');

// For Excel files, you'll need: npm install xlsx
// For CSV files, native Node.js is sufficient

/**
 * Convert FSANZ Excel/CSV export to app-compatible JSON format
 */
function convertFSANZToJSON(inputPath, outputPath, country) {
  try {
    console.log(`Converting FSANZ ${country} database from ${inputPath}...`);
    
    let data;
    const ext = path.extname(inputPath).toLowerCase();
    
    if (ext === '.xlsx' || ext === '.xls') {
      // Excel file - requires xlsx package
      try {
        const XLSX = require('xlsx');
        const workbook = XLSX.readFile(inputPath);
        const sheetName = workbook.SheetNames[0]; // Use first sheet
        const worksheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(worksheet);
      } catch (error) {
        console.error('Error reading Excel file. Install xlsx: npm install xlsx');
        console.error('Or convert Excel to CSV first and use CSV import.');
        throw error;
      }
    } else if (ext === '.csv') {
      // CSV file
      const csvContent = fs.readFileSync(inputPath, 'utf-8');
      data = parseCSV(csvContent);
    } else {
      throw new Error(`Unsupported file format: ${ext}. Use .xlsx, .xls, or .csv`);
    }
    
    // Convert to app-compatible format
    // FSANZ database structure varies, so we'll map common fields
    const convertedData = {};
    
    for (const row of data) {
      // Try to find barcode/GTIN field (common names: GTIN, Barcode, EAN, UPC, Code)
      const barcode = row.GTIN || row.Barcode || row.EAN || row.UPC || row.Code || 
                     row['GTIN-14'] || row['Product Code'] || row['Item Code'];
      
      if (!barcode) {
        console.warn('Skipping row without barcode:', row);
        continue;
      }
      
      // Normalize barcode (remove leading zeros, ensure string)
      const normalizedBarcode = String(barcode).replace(/^0+/, '');
      
      // Map FSANZ fields to our Product format
      convertedData[normalizedBarcode] = {
        productName: row['Product Name'] || row.Product || row.Name || row['Brand Name'] || '',
        brand: row.Brand || row['Brand Name'] || row.Manufacturer || '',
        // Nutrition data (per 100g)
        energyKcal: parseFloat(row['Energy (kcal)'] || row.Energy || row['Energy (kJ)'] ? parseFloat(row['Energy (kJ)']) / 4.184 : 0) || 0,
        fat: parseFloat(row.Fat || row['Total Fat'] || 0) || 0,
        saturatedFat: parseFloat(row['Saturated Fat'] || row['Saturated Fatty Acids'] || 0) || 0,
        carbohydrates: parseFloat(row.Carbohydrates || row['Total Carbohydrates'] || 0) || 0,
        sugars: parseFloat(row.Sugars || row['Total Sugars'] || 0) || 0,
        protein: parseFloat(row.Protein || row['Total Protein'] || 0) || 0,
        salt: parseFloat(row.Salt || 0) || 0,
        sodium: parseFloat(row.Sodium || 0) || 0,
        dietaryFiber: parseFloat(row.Fiber || row['Dietary Fiber'] || row['Total Dietary Fiber'] || 0) || 0,
        // Additional fields
        ingredients: row.Ingredients || row['Ingredient List'] || row['Ingredient Statement'] || '',
        packageSize: row['Package Size'] || row.Size || row.Quantity || '',
        servingSize: row['Serving Size'] || row['Serving'] || '',
        categories: row.Category ? (Array.isArray(row.Category) ? row.Category : [row.Category]) : undefined,
        // Health Star Rating (if available)
        healthStarRating: row['Health Star Rating'] || row.HSR || undefined,
      };
    }
    
    // Write converted data to JSON file
    fs.writeFileSync(outputPath, JSON.stringify(convertedData, null, 2));
    
    console.log(`✅ Converted ${Object.keys(convertedData).length} products`);
    console.log(`📁 Output saved to: ${outputPath}`);
    console.log(`📦 File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
    
    return convertedData;
  } catch (error) {
    console.error('Error converting FSANZ database:', error);
    throw error;
  }
}

/**
 * Simple CSV parser (handles quoted fields, commas)
 */
function parseCSV(csvContent) {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  // Parse header
  const headers = parseCSVLine(lines[0]);
  const data = [];
  
  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length !== headers.length) {
      console.warn(`Row ${i + 1} has ${values.length} columns, expected ${headers.length}. Skipping.`);
      continue;
    }
    
    const row = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || '';
    });
    data.push(row);
  }
  
  return data;
}

/**
 * Parse a single CSV line, handling quoted fields
 */
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add last field
  values.push(current);
  
  return values;
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const inputIndex = args.indexOf('--input');
  const outputIndex = args.indexOf('--output');
  const countryIndex = args.indexOf('--country');
  
  if (inputIndex === -1 || outputIndex === -1 || countryIndex === -1) {
    console.log(`
FSANZ Database Import Script

Usage:
  node scripts/importFSANZDatabase.js --input <input-file> --output <output-file> --country <AU|NZ>

Arguments:
  --input    Path to FSANZ database export (Excel or CSV)
  --output   Path to output JSON file
  --country  Country code: AU or NZ

Example:
  node scripts/importFSANZDatabase.js --input ./downloads/fsanz-au-export.xlsx --output ./data/fsanz-au.json --country AU

Note: For Excel files, install xlsx: npm install xlsx
    `);
    process.exit(1);
  }
  
  const inputPath = args[inputIndex + 1];
  const outputPath = args[outputIndex + 1];
  const country = args[countryIndex + 1].toUpperCase();
  
  if (country !== 'AU' && country !== 'NZ') {
    console.error('Country must be AU or NZ');
    process.exit(1);
  }
  
  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }
  
  try {
    convertFSANZToJSON(inputPath, outputPath, country);
    console.log('\n✅ Conversion complete!');
    console.log(`\nNext step: Import the JSON file into the app using the import function.`);
  } catch (error) {
    console.error('\n❌ Conversion failed:', error.message);
    process.exit(1);
  }
}

module.exports = { convertFSANZToJSON, parseCSV };
