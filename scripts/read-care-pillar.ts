import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Script to read CARE Pillar Excel file and display its contents
 */

const filePath = path.join(__dirname, '..', 'TruScore logic', 'CARE Pillar.xlsx');

function readExcelFile(filePath: string): any[] {
  try {
    console.log(`\n=== Reading ${path.basename(filePath)} ===\n`);
    
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return [];
    }

    const workbook = XLSX.readFile(filePath);
    
    const results: any[] = [];
    
    workbook.SheetNames.forEach((sheetName, index) => {
      console.log(`\n--- Sheet ${index + 1}: ${sheetName} ---`);
      
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        defval: '', 
        raw: false 
      });
      
      if (jsonData.length > 0) {
        console.log(`Rows: ${jsonData.length}`);
        console.log(`Columns: ${Object.keys(jsonData[0] || {}).join(', ')}`);
        console.log('\nAll rows:');
        console.log(JSON.stringify(jsonData, null, 2));
        
        results.push({
          sheetName,
          data: jsonData,
        });
      } else {
        console.log('Sheet is empty');
      }
    });
    
    return results;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
}

// Main execution
console.log('Reading CARE Pillar Excel File...\n');
console.log('='.repeat(60));

const results = readExcelFile(filePath);

console.log('\n' + '='.repeat(60));
console.log('\nSummary:');
results.forEach((result) => {
  console.log(`\n${result.sheetName}:`);
  console.log(`  - ${result.data.length} rows`);
});

// Write results to JSON file for easier analysis
const outputPath = path.join(__dirname, '..', 'TruScore logic', 'care-pillar-data-extracted.json');
fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
console.log(`\n\nFull data extracted to: ${outputPath}`);
