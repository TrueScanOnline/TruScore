/**
 * Test FSANZ conversion with detailed output
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

console.log('========================================');
console.log('FSANZ Conversion Test');
console.log('========================================');
console.log('');

const NZFCD_EXCEL = path.join(__dirname, '..', 'Database files', 'Principal files', 'Excel files', 'Standard', 'Standard DATA.FT.xlsx');
const AFCD_EXCEL = path.join(__dirname, '..', 'Database files', 'AU Release 2 - Nutrient file.xlsx');

// Test NZFCD
if (fs.existsSync(NZFCD_EXCEL)) {
  console.log('✅ NZFCD Excel found');
  const wb = XLSX.readFile(NZFCD_EXCEL);
  console.log('  Sheets:', wb.SheetNames.join(', '));
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws);
  console.log('  Total rows:', data.length);
  if (data.length > 0) {
    console.log('  First row keys:', Object.keys(data[0]).slice(0, 10).join(', '));
    const foodName = data[0]['Food Name'] || data[0]['Food name'] || data[0]['Description'] || Object.values(data[0])[0];
    console.log('  Sample food name:', foodName);
    console.log('  Sample row (first 5 keys):');
    Object.keys(data[0]).slice(0, 5).forEach(key => {
      console.log(`    ${key}: ${data[0][key]}`);
    });
  }
} else {
  console.log('❌ NZFCD Excel not found:', NZFCD_EXCEL);
}

console.log('');

// Test AFCD
if (fs.existsSync(AFCD_EXCEL)) {
  console.log('✅ AFCD Excel found');
  const wb = XLSX.readFile(AFCD_EXCEL);
  console.log('  Sheets:', wb.SheetNames.join(', '));
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws);
  console.log('  Total rows:', data.length);
  if (data.length > 0) {
    console.log('  First row keys:', Object.keys(data[0]).slice(0, 10).join(', '));
    const foodName = data[0]['Food Name'] || data[0]['Food name'] || data[0]['Description'] || Object.values(data[0])[0];
    console.log('  Sample food name:', foodName);
  }
} else {
  console.log('❌ AFCD Excel not found:', AFCD_EXCEL);
}

console.log('');
console.log('========================================');
