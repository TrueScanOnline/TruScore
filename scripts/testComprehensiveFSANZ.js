const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const DB_DIR = path.join(__dirname, '..', 'Database files');
const testOutput = path.join(__dirname, '..', 'test_fsanz_output.txt');

fs.writeFileSync(testOutput, 'Starting test...\n');

function log(msg) {
  const message = typeof msg === 'string' ? msg : JSON.stringify(msg, null, 2);
  fs.appendFileSync(testOutput, message + '\n');
  console.log(message);
}

log('Test script starting...');
log(`Database directory: ${DB_DIR}`);
log(`Directory exists: ${fs.existsSync(DB_DIR)}`);

// Test reading one file
const testFile = path.join(DB_DIR, 'AU Release 2 - Nutrient file.xlsx');
log(`\nTesting file: ${path.basename(testFile)}`);
log(`File exists: ${fs.existsSync(testFile)}`);

if (fs.existsSync(testFile)) {
  try {
    const workbook = XLSX.readFile(testFile);
    log(`Sheets found: ${workbook.SheetNames.length}`);
    log(`Sheet names: ${workbook.SheetNames.join(', ')}`);
    
    workbook.SheetNames.forEach((sheetName, index) => {
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { defval: null });
      log(`  Sheet ${index + 1} "${sheetName}": ${data.length} rows`);
    });
  } catch (error) {
    log(`Error: ${error.message}`);
  }
}

log('\nTest complete!');
log(`Output written to: ${testOutput}`);

