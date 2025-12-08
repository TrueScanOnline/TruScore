/**
 * Analyze AFCD Excel file structure to understand the data format
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const excelPath = path.join(__dirname, '..', 'Database files', 'AU Release 2 - Nutrient file.xlsx');

if (!fs.existsSync(excelPath)) {
  console.error('❌ Excel file not found:', excelPath);
  process.exit(1);
}

console.log('========================================');
console.log('AFCD Excel File Structure Analysis');
console.log('========================================');
console.log('');

const workbook = XLSX.readFile(excelPath);

console.log(`File: ${excelPath}`);
console.log(`Total Sheets: ${workbook.SheetNames.length}`);
console.log(`Sheet Names: ${workbook.SheetNames.join(', ')}`);
console.log('');

workbook.SheetNames.forEach((sheetName, index) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Sheet ${index + 1}: "${sheetName}"`);
  console.log('='.repeat(60));
  
  const worksheet = workbook.Sheets[sheetName];
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  
  console.log(`Physical Range: ${range.e.r + 1} rows × ${range.e.c + 1} columns`);
  
  // Read as JSON
  const data = XLSX.utils.sheet_to_json(worksheet, { defval: null });
  console.log(`Data Rows: ${data.length}`);
  
  if (data.length > 0) {
    const firstRow = data[0];
    const columns = Object.keys(firstRow);
    
    console.log(`\nColumns (${columns.length} total):`);
    columns.forEach((col, i) => {
      const sampleValue = firstRow[col];
      const valueType = sampleValue !== null && sampleValue !== undefined 
        ? (typeof sampleValue === 'number' ? 'number' : 'string')
        : 'null';
      console.log(`  ${i + 1}. ${col} (${valueType})`);
    });
    
    console.log(`\nFirst Row Sample:`);
    const sample = {};
    columns.slice(0, 15).forEach(col => {
      sample[col] = firstRow[col];
    });
    console.log(JSON.stringify(sample, null, 2));
    
    // Check for food name columns
    const foodNameColumns = columns.filter(col => 
      col.toLowerCase().includes('food') || 
      col.toLowerCase().includes('name') ||
      col.toLowerCase().includes('description')
    );
    if (foodNameColumns.length > 0) {
      console.log(`\n✅ Food Name Columns Found: ${foodNameColumns.join(', ')}`);
    }
    
    // Check for nutrient columns
    const nutrientKeywords = ['energy', 'protein', 'fat', 'carbohydrate', 'sugar', 'fiber', 'salt', 'sodium', 'calcium', 'iron'];
    const nutrientColumns = columns.filter(col => {
      const colLower = col.toLowerCase();
      return nutrientKeywords.some(keyword => colLower.includes(keyword));
    });
    if (nutrientColumns.length > 0) {
      console.log(`\n✅ Nutrient Columns Found (${nutrientColumns.length}):`);
      nutrientColumns.slice(0, 10).forEach(col => console.log(`  - ${col}`));
      if (nutrientColumns.length > 10) {
        console.log(`  ... and ${nutrientColumns.length - 10} more`);
      }
    }
    
    // Show a few sample foods
    if (data.length > 1) {
      console.log(`\nSample Foods (first 3):`);
      data.slice(0, 3).forEach((row, i) => {
        const foodName = foodNameColumns.length > 0 
          ? row[foodNameColumns[0]] 
          : `Row ${i + 1}`;
        console.log(`  ${i + 1}. ${foodName}`);
      });
    }
  } else {
    console.log('⚠️  No data rows found in this sheet');
  }
});

console.log('\n' + '='.repeat(60));
console.log('Analysis Complete');
console.log('='.repeat(60));
