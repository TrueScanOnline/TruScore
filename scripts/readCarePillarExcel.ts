/**
 * Read and analyze CARE Pillar Excel file
 * Extracts all data from the Excel file for analysis
 */

import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

const excelPath = path.join(__dirname, '..', 'TruScore logic', 'CARE Pillar.xlsx');

console.log('Reading CARE Pillar Excel file...');
console.log(`Path: ${excelPath}`);

if (!fs.existsSync(excelPath)) {
  console.error(`File not found: ${excelPath}`);
  process.exit(1);
}

try {
  const workbook = XLSX.readFile(excelPath);
  
  console.log(`\nFound ${workbook.SheetNames.length} sheet(s):`);
  workbook.SheetNames.forEach((name, idx) => {
    console.log(`  ${idx + 1}. ${name}`);
  });
  
  // Process each sheet
  workbook.SheetNames.forEach((sheetName) => {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`SHEET: ${sheetName}`);
    console.log('='.repeat(80));
    
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1, 
      defval: '',
      raw: false 
    });
    
    // Print all rows
    data.forEach((row: any, rowIdx: number) => {
      if (Array.isArray(row)) {
        const rowStr = row.map((cell: any) => {
          if (cell === null || cell === undefined) return '';
          return String(cell).trim();
        }).filter((cell: string) => cell.length > 0).join(' | ');
        
        if (rowStr.length > 0) {
          console.log(`Row ${rowIdx + 1}: ${rowStr}`);
        }
      } else {
        console.log(`Row ${rowIdx + 1}:`, JSON.stringify(row, null, 2));
      }
    });
  });
  
  // Also save to JSON for easier analysis
  const jsonPath = path.join(__dirname, '..', 'CARE_PILLAR_EXCEL_DATA.json');
  const allData: Record<string, any> = {};
  
  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    allData[sheetName] = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1, 
      defval: '',
      raw: false 
    });
  });
  
  fs.writeFileSync(jsonPath, JSON.stringify(allData, null, 2));
  console.log(`\n✅ Data also saved to: ${jsonPath}`);
  
} catch (error: any) {
  console.error('Error reading Excel file:', error.message);
  process.exit(1);
}
