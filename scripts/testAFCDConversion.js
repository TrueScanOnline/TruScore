/**
 * Test AFCD conversion to see what's happening
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const excelPath = path.join(__dirname, '..', 'Database files', 'AU Release 2 - Nutrient file.xlsx');

console.log('Testing AFCD Conversion...\n');

if (!fs.existsSync(excelPath)) {
  console.error('File not found:', excelPath);
  process.exit(1);
}

const workbook = XLSX.readFile(excelPath);
console.log('Sheets:', workbook.SheetNames.join(', '));
console.log('');

workbook.SheetNames.forEach((sheetName, i) => {
  console.log(`\n=== Sheet ${i + 1}: ${sheetName} ===`);
  const ws = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(ws, { defval: null });
  console.log(`Rows: ${data.length}`);
  
  if (data.length > 0) {
    const cols = Object.keys(data[0]);
    console.log(`Columns: ${cols.length}`);
    console.log(`First 10 columns: ${cols.slice(0, 10).join(', ')}`);
    
    // Find food name column
    const foodCols = cols.filter(c => 
      c.toLowerCase().includes('food') || 
      c.toLowerCase().includes('name') ||
      c.toLowerCase().includes('description')
    );
    console.log(`Food name columns: ${foodCols.length > 0 ? foodCols.join(', ') : 'NONE FOUND'}`);
    
    // Show first few rows
    if (data.length <= 5) {
      data.forEach((row, j) => {
        const name = foodCols.length > 0 ? row[foodCols[0]] : row[cols[0]] || 'N/A';
        console.log(`  Row ${j + 1}: ${name}`);
      });
    } else {
      console.log(`  First row: ${foodCols.length > 0 ? data[0][foodCols[0]] : data[0][cols[0]] || 'N/A'}`);
      console.log(`  ... and ${data.length - 1} more rows`);
    }
  }
});

// Now try conversion
console.log('\n\n=== Attempting Conversion ===');
const convertScript = require('./convertFSANZToJSON.js');
