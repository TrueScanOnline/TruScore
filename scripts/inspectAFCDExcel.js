/**
 * Inspect AFCD Excel file structure
 */

const XLSX = require('xlsx');
const path = require('path');

const EXCEL_NUTRIENT_PATH = path.join(__dirname, '../afcd_nutrient_file.xlsx');

console.log('Inspecting AFCD Excel file structure...\n');

const workbook = XLSX.readFile(EXCEL_NUTRIENT_PATH);

console.log('Sheet Names:');
workbook.SheetNames.forEach((name, index) => {
  console.log(`  ${index + 1}. ${name}`);
});

console.log('\n--- Data Sheet Analysis (All solids & liquids per 100g) ---');
// Use the "All solids & liquids per 100g" sheet (index 1)
const dataSheetName = workbook.SheetNames[1] || workbook.SheetNames.find(name => name.toLowerCase().includes('100g'));
const dataSheet = workbook.Sheets[dataSheetName];
const data = XLSX.utils.sheet_to_json(dataSheet, { defval: null });

console.log(`Total rows: ${data.length}`);
console.log('\nFirst 3 rows:');
data.slice(0, 3).forEach((row, index) => {
  console.log(`\nRow ${index + 1}:`);
  Object.keys(row).slice(0, 10).forEach(key => {
    console.log(`  ${key}: ${row[key]}`);
  });
  if (Object.keys(row).length > 10) {
    console.log(`  ... and ${Object.keys(row).length - 10} more columns`);
  }
});

console.log('\n--- Column Names ---');
if (data.length > 0) {
  const columns = Object.keys(data[0]);
  console.log(`Total columns: ${columns.length}`);
  columns.forEach((col, index) => {
    console.log(`  ${index + 1}. ${col}`);
  });
}

