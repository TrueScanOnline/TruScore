/**
 * Complete AFCD Analysis - writes detailed output to file
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const excelPath = path.join(__dirname, '..', 'Database files', 'AU Release 2 - Nutrient file.xlsx');
const outputFile = path.join(__dirname, '..', 'afcd-complete-analysis.txt');

let output = '';

function log(msg) {
  console.log(msg);
  output += msg + '\n';
}

log('========================================');
log('COMPLETE AFCD ANALYSIS');
log('========================================');
log('');

if (!fs.existsSync(excelPath)) {
  log(`❌ File not found: ${excelPath}`);
  fs.writeFileSync(outputFile, output);
  process.exit(1);
}

log(`File: ${excelPath}`);
log(`File exists: ${fs.existsSync(excelPath)}`);
log(`File size: ${(fs.statSync(excelPath).size / 1024 / 1024).toFixed(2)} MB`);
log('');

const workbook = XLSX.readFile(excelPath);

log(`Total Sheets: ${workbook.SheetNames.length}`);
log(`Sheet Names: ${workbook.SheetNames.join(', ')}`);
log('');

workbook.SheetNames.forEach((sheetName, index) => {
  log(`\n${'='.repeat(60)}`);
  log(`Sheet ${index + 1}: "${sheetName}"`);
  log('='.repeat(60));
  
  const worksheet = workbook.Sheets[sheetName];
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  
  log(`Physical Range: ${range.e.r + 1} rows × ${range.e.c + 1} columns`);
  
  const data = XLSX.utils.sheet_to_json(worksheet, { defval: null });
  log(`Data Rows (after JSON conversion): ${data.length}`);
  
  if (data.length > 0) {
    const columns = Object.keys(data[0]);
    log(`Columns: ${columns.length}`);
    log(`\nAll Columns:`);
    columns.forEach((col, i) => {
      log(`  ${i + 1}. ${col}`);
    });
    
    // Find food name columns
    const foodNameColumns = columns.filter(col => 
      col.toLowerCase().includes('food') || 
      col.toLowerCase().includes('name') ||
      col.toLowerCase().includes('description')
    );
    
    if (foodNameColumns.length > 0) {
      log(`\n✅ Food Name Columns: ${foodNameColumns.join(', ')}`);
    } else {
      log(`\n⚠️  No food name columns found!`);
      log(`   First column: ${columns[0]}`);
    }
    
    // Find nutrient columns
    const nutrientKeywords = ['energy', 'protein', 'fat', 'carbohydrate', 'sugar', 'fiber', 'salt', 'sodium', 'calcium', 'iron'];
    const nutrientColumns = columns.filter(col => {
      const colLower = col.toLowerCase();
      return nutrientKeywords.some(keyword => colLower.includes(keyword));
    });
    
    log(`\nNutrient Columns Found: ${nutrientColumns.length}`);
    if (nutrientColumns.length > 0) {
      nutrientColumns.forEach(col => log(`  - ${col}`));
    }
    
    // Show sample rows
    log(`\nSample Rows (first 3):`);
    data.slice(0, 3).forEach((row, i) => {
      const foodName = foodNameColumns.length > 0 
        ? row[foodNameColumns[0]] 
        : (row[columns[0]] || `Row ${i + 1}`);
      log(`  Row ${i + 1}: ${foodName}`);
      
      // Show some nutrient values
      if (nutrientColumns.length > 0) {
        const nutrients = nutrientColumns.slice(0, 5).map(col => {
          const val = row[col];
          return `${col}: ${val !== null && val !== undefined ? val : 'N/A'}`;
        });
        log(`    ${nutrients.join(', ')}`);
      }
    });
  } else {
    log('⚠️  No data rows found');
  }
});

// Now test the conversion
log('\n\n' + '='.repeat(60));
log('TESTING CONVERSION');
log('='.repeat(60));

try {
  // Find best sheet
  let bestSheet = workbook.SheetNames[0];
  let maxRows = 0;
  
  workbook.SheetNames.forEach(name => {
    const ws = workbook.Sheets[name];
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    const rowCount = range.e.r + 1;
    
    if (name.toLowerCase().includes('100g') || 
        (name.toLowerCase().includes('solids') && name.toLowerCase().includes('liquids'))) {
      if (rowCount > maxRows) {
        maxRows = rowCount;
        bestSheet = name;
      }
    }
  });
  
  if (maxRows < 100) {
    maxRows = 0;
    workbook.SheetNames.forEach(name => {
      if (!name.toLowerCase().includes('index') && !name.toLowerCase().includes('readme')) {
        const ws = workbook.Sheets[name];
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
        const rowCount = range.e.r + 1;
        if (rowCount > maxRows) {
          maxRows = rowCount;
          bestSheet = name;
        }
      }
    });
  }
  
  log(`\nSelected Sheet: ${bestSheet}`);
  log(`Row Count: ${maxRows}`);
  
  const data = XLSX.utils.sheet_to_json(workbook.Sheets[bestSheet], { defval: null });
  log(`Data Rows: ${data.length}`);
  
  if (data.length > 0) {
    const cols = Object.keys(data[0]);
    log(`Columns: ${cols.length}`);
    
    // Try to extract food names
    const foodNameCol = cols.find(c => c.toLowerCase().includes('food') && c.toLowerCase().includes('name')) ||
                       cols.find(c => c.toLowerCase().includes('name')) ||
                       cols[0];
    
    log(`Food Name Column: ${foodNameCol}`);
    
    const foods = data.map(row => row[foodNameCol] || row[cols[0]]).filter(f => f && f !== '');
    log(`Valid Foods: ${foods.length}`);
    log(`Sample Foods: ${foods.slice(0, 5).join(', ')}`);
  }
  
} catch (error) {
  log(`\n❌ Conversion test error: ${error.message}`);
}

log('\n' + '='.repeat(60));
log('ANALYSIS COMPLETE');
log('='.repeat(60));

fs.writeFileSync(outputFile, output);
log(`\n✅ Analysis saved to: ${outputFile}`);
