/**
 * Read and analyze Cross-Pillar Score and Commentary Table Word document
 * Extracts all data from the Word document for analysis
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const docPath = path.join(__dirname, '..', 'TruScore logic', 'Cross-Pillar_Score_and Commentary_Table_20251222.docx');

console.log('Reading Cross-Pillar Score and Commentary Table Word document...');
console.log(`Path: ${docPath}`);

if (!fs.existsSync(docPath)) {
  console.error(`File not found: ${docPath}`);
  process.exit(1);
}

async function extractDocument() {
  try {
    // Try using pandoc if available (best for .docx to text)
    try {
      const text = execSync(`pandoc "${docPath}" -t plain`, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
      console.log('\n' + '='.repeat(80));
      console.log('DOCUMENT CONTENT (via pandoc):');
      console.log('='.repeat(80) + '\n');
      console.log(text);
      
      // Save to text file for easier analysis
      const textPath = path.join(__dirname, '..', 'CROSS_PILLAR_DOC_EXTRACTED.txt');
      fs.writeFileSync(textPath, text);
      console.log(`\n✅ Content also saved to: ${textPath}`);
    } catch (pandocError: any) {
      console.log('Pandoc not available, trying mammoth...');
      
      // Alternative: Try using docx library
      try {
        const mammoth = require('mammoth');
        const result = await mammoth.extractRawText({ path: docPath });
        console.log('\n' + '='.repeat(80));
        console.log('DOCUMENT CONTENT (via mammoth):');
        console.log('='.repeat(80) + '\n');
        console.log(result.value);
        
        const textPath = path.join(__dirname, '..', 'CROSS_PILLAR_DOC_EXTRACTED.txt');
        fs.writeFileSync(textPath, result.value);
        console.log(`\n✅ Content also saved to: ${textPath}`);
      } catch (mammothError: any) {
        console.error('Error reading Word document:', mammothError.message);
        console.log('\nTrying to read as binary and extract text...');
        
        // Last resort: Read file and try to extract text manually
        const fileBuffer = fs.readFileSync(docPath);
        console.log(`File size: ${fileBuffer.length} bytes`);
        console.log('File is a .docx (ZIP archive). Please install pandoc or mammoth to extract text.');
        console.log('\nTo install pandoc: https://pandoc.org/installing.html');
        console.log('To install mammoth: npm install mammoth');
      }
    }
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

extractDocument();
