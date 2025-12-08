const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'test_simple.txt');
fs.writeFileSync(file, 'Test output\n');
console.log('File written to:', file);
console.log('File exists:', fs.existsSync(file));

try {
  const XLSX = require('xlsx');
  console.log('XLSX module loaded successfully');
  
  const testFile = path.join(__dirname, '..', 'Database files', 'Standard DATA.AP.xlsx');
  console.log('Test file exists:', fs.existsSync(testFile));
  
  if (fs.existsSync(testFile)) {
    const workbook = XLSX.readFile(testFile);
    console.log('Workbook loaded. Sheets:', workbook.SheetNames.length);
    console.log('Sheet names:', workbook.SheetNames);
  }
} catch (error) {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
}

