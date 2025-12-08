const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const DATABASE_DIR = path.join(__dirname, '..', 'Database files');

// Test reading one Excel file first
const testFile = path.join(DATABASE_DIR, 'Standard DATA.AP.xlsx');

console.log('Testing Excel file read...');
console.log('File exists:', fs.existsSync(testFile));

if (fs.existsSync(testFile)) {
  try {
    const workbook = XLSX.readFile(testFile);
    console.log('Sheets:', workbook.SheetNames);
    
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      console.log(`Sheet "${sheetName}": ${data.length} rows`);
      if (data.length > 0) {
        console.log('Columns:', Object.keys(data[0]).slice(0, 10));
      }
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

