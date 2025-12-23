/**
 * Read and analyze ETHICS Pillar Excel spec
 */

import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

const specPath = path.join(__dirname, '..', 'TruScore logic', 'ETHICS Pillar.xlsx');

async function readSpec() {
  console.log('Reading ETHICS Pillar spec from:', specPath);
  
  if (!fs.existsSync(specPath)) {
    console.error('File not found:', specPath);
    return;
  }
  
  const workbook = XLSX.readFile(specPath);
  const sheetNames = workbook.SheetNames;
  
  console.log('\nSheet names:', sheetNames);
  
  for (const sheetName of sheetNames) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`SHEET: ${sheetName}`);
    console.log('='.repeat(80));
    
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    
    // Display all rows and columns
    console.log(`\nTotal rows: ${data.length}`);
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any[];
      if (row && row.length > 0 && row.some(cell => cell !== '')) {
        console.log(`\nRow ${i + 1}:`);
        row.forEach((cell, colIndex) => {
          if (cell !== '') {
            console.log(`  Column ${colIndex + 1}: ${cell}`);
          }
        });
      }
    }
  }
}

readSpec().catch(console.error);
