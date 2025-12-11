const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const specFile = path.join(__dirname, '..', 'TruScore logic', 'CARE Pillar.xlsx');

console.log('Reading CARE Pillar specification...');
console.log('File exists:', fs.existsSync(specFile));

if (!fs.existsSync(specFile)) {
  console.error('File not found:', specFile);
  process.exit(1);
}

try {
  const workbook = XLSX.readFile(specFile);
  console.log('\n=== WORKBOOK INFO ===');
  console.log('Sheets:', workbook.SheetNames.length);
  console.log('Sheet names:', workbook.SheetNames);
  
  // Process each sheet
  workbook.SheetNames.forEach((sheetName, index) => {
    console.log(`\n=== SHEET ${index + 1}: ${sheetName} ===`);
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });
    
    console.log(`Rows: ${jsonData.length}`);
    if (jsonData.length > 0) {
      console.log('Columns:', Object.keys(jsonData[0]));
      console.log('\nFirst 10 rows:');
      jsonData.slice(0, 10).forEach((row, i) => {
        console.log(`\nRow ${i + 1}:`);
        Object.entries(row).forEach(([key, value]) => {
          if (value && value.toString().trim()) {
            console.log(`  ${key}: ${value}`);
          }
        });
      });
      
      // Also output as CSV-like format for easier reading
      console.log('\n--- Full Data (CSV-like) ---');
      const csvData = XLSX.utils.sheet_to_csv(worksheet);
      const lines = csvData.split('\n').slice(0, 50); // First 50 lines
      lines.forEach(line => {
        if (line.trim()) {
          console.log(line);
        }
      });
    }
  });
  
  // Write full data to JSON file for reference
  const outputFile = path.join(__dirname, '..', 'CARE_PILLAR_SPEC_EXTRACTED.json');
  const allData = {};
  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    allData[sheetName] = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });
  });
  fs.writeFileSync(outputFile, JSON.stringify(allData, null, 2));
  console.log(`\n=== Full data written to: ${outputFile} ===`);
  
} catch (error) {
  console.error('Error reading Excel file:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

