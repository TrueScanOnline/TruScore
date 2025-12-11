const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

console.log('Analyzing OPEN Pillar Excel file...');

const filePath = path.join(__dirname, '..', 'TruScore logic', 'OPEN Pillar.xlsx');

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

try {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON with headers
  const data = XLSX.utils.sheet_to_json(worksheet, { 
    header: 1, 
    defval: null,
    raw: false 
  });
  
  console.log(`\nSheet: ${sheetName}`);
  console.log(`Total rows: ${data.length}`);
  console.log(`\nFirst 50 rows:`);
  console.log(JSON.stringify(data.slice(0, 50), null, 2));
  
  // Save to JSON file
  const outputPath = path.join(__dirname, '..', 'open_pillar_spec.json');
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`\n✅ Saved to: ${outputPath}`);
  
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}



