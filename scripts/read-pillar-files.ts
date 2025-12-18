import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Script to read Excel files for pillar logic and display their contents
 */

const pillarFiles = [
  'BODY Pillar.xlsx',
  'OPEN Pillar.xlsx',
  'PLANET Pillar.xlsx',
];

const basePath = path.join(__dirname, '..', 'TruScore logic');

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
        console.log('\nFirst 10 rows:');
        console.log(JSON.stringify(jsonData.slice(0, 10), null, 2));
        
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
console.log('Reading Pillar Excel Files...\n');
console.log('='.repeat(60));

const allResults: Record<string, any[]> = {};

pillarFiles.forEach((fileName) => {
  const filePath = path.join(basePath, fileName);
  const results = readExcelFile(filePath);
  allResults[fileName] = results;
});

console.log('\n' + '='.repeat(60));
console.log('\nSummary:');
Object.entries(allResults).forEach(([fileName, results]) => {
  console.log(`\n${fileName}:`);
  results.forEach((result) => {
    console.log(`  - ${result.sheetName}: ${result.data.length} rows`);
  });
});

// Write results to JSON file for easier analysis
const outputPath = path.join(basePath, 'pillar-data-extracted.json');
fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2));
console.log(`\n\nFull data extracted to: ${outputPath}`);
