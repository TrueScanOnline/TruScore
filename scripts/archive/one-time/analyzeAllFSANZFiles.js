const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const DATABASE_DIR = path.join(__dirname, '..', 'Database files');
const OUTPUT_FILE = path.join(__dirname, '..', 'FSANZ_DEEP_ANALYSIS.txt');

// Write header immediately
fs.writeFileSync(OUTPUT_FILE, 'FSANZ DEEP ANALYSIS - ALL EXCEL FILES AND TABS\n');
fs.appendFileSync(OUTPUT_FILE, '='.repeat(80) + '\n\n');

function log(message) {
  const msg = typeof message === 'string' ? message : JSON.stringify(message, null, 2);
  fs.appendFileSync(OUTPUT_FILE, msg + '\n');
  console.log(msg);
}

function findExcelFiles(dir) {
  const files = [];
  function walkDir(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.xlsx')) {
        files.push(fullPath);
      }
    }
  }
  walkDir(dir);
  return files;
}

function analyzeExcelFile(filePath) {
  try {
    log(`\n${'='.repeat(80)}`);
    log(`File: ${path.basename(filePath)}`);
    log(`Path: ${filePath}`);
    log('='.repeat(80));
    
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;
    
    log(`\nTotal Sheets: ${sheetNames.length}`);
    log(`Sheet Names: ${sheetNames.join(', ')}`);
    
    const analysis = {
      fileName: path.basename(filePath),
      filePath: filePath,
      sheets: []
    };
    
    sheetNames.forEach((sheetName, index) => {
      log(`\n  --- Sheet ${index + 1}/${sheetNames.length}: "${sheetName}" ---`);
      
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { defval: null, raw: false });
      
      const rowCount = data.length;
      const columnCount = data.length > 0 ? Object.keys(data[0]).length : 0;
      const columnNames = data.length > 0 ? Object.keys(data[0]) : [];
      
      log(`    Rows: ${rowCount.toLocaleString()}`);
      log(`    Columns: ${columnCount}`);
      
      if (columnNames.length > 0) {
        log(`    All Columns (${columnNames.length}): ${columnNames.join(', ')}`);
      }
      
      // Check for key indicators
      const hasFoodName = columnNames.some(col => 
        col && (col.toLowerCase().includes('food') || 
                col.toLowerCase().includes('name') || 
                col.toLowerCase().includes('description') ||
                col.toLowerCase().includes('product'))
      );
      const hasBarcode = columnNames.some(col => 
        col && col.toLowerCase().includes('barcode')
      );
      const hasNutrients = columnNames.some(col => 
        col && (col.toLowerCase().includes('nutrient') || 
                col.toLowerCase().includes('protein') || 
                col.toLowerCase().includes('fat') || 
                col.toLowerCase().includes('carbohydrate') ||
                col.toLowerCase().includes('energy'))
      );
      
      log(`    Has Food Name: ${hasFoodName ? '✓ YES' : '✗'}`);
      log(`    Has Barcode: ${hasBarcode ? '✓ YES' : '✗'}`);
      log(`    Has Nutrients: ${hasNutrients ? '✓ YES' : '✗'}`);
      
      // Show sample data
      if (data.length > 0) {
        log(`    Sample Row 1 (first 10 fields):`);
        const firstRow = data[0];
        const first10Keys = Object.keys(firstRow).slice(0, 10);
        first10Keys.forEach(key => {
          const value = firstRow[key];
          const displayValue = value !== null && value !== undefined ? String(value).substring(0, 50) : 'null';
          log(`      ${key}: ${displayValue}`);
        });
      }
      
      analysis.sheets.push({
        sheetName: sheetName,
        rowCount: rowCount,
        columnCount: columnCount,
        columnNames: columnNames,
        hasFoodName: hasFoodName,
        hasBarcode: hasBarcode,
        hasNutrients: hasNutrients
      });
    });
    
    const totalRows = analysis.sheets.reduce((sum, sheet) => sum + sheet.rowCount, 0);
    analysis.totalRows = totalRows;
    
    log(`\n  TOTAL ROWS IN THIS FILE: ${totalRows.toLocaleString()}`);
    
    return analysis;
  } catch (error) {
    log(`\n❌ ERROR: ${error.message}`);
    log(`Stack: ${error.stack}`);
    return {
      fileName: path.basename(filePath),
      error: error.message
    };
  }
}

// Main execution
log('Starting analysis...\n');
log(`Database Directory: ${DATABASE_DIR}`);
log(`Directory exists: ${fs.existsSync(DATABASE_DIR)}\n`);

const excelFiles = findExcelFiles(DATABASE_DIR);
log(`Found ${excelFiles.length} Excel files\n`);

const allAnalyses = [];
const largeDatasets = [];

excelFiles.forEach((filePath, index) => {
  log(`\n\n[${index + 1}/${excelFiles.length}] Processing: ${path.basename(filePath)}`);
  const analysis = analyzeExcelFile(filePath);
  allAnalyses.push(analysis);
  
  if (analysis.sheets) {
    analysis.sheets.forEach(sheet => {
      if (sheet.rowCount > 100) {
        largeDatasets.push({
          file: analysis.fileName,
          sheet: sheet.sheetName,
          rows: sheet.rowCount,
          hasFoodName: sheet.hasFoodName,
          hasNutrients: sheet.hasNutrients
        });
      }
    });
  }
});

// Final Summary
log('\n\n' + '='.repeat(80));
log('FINAL SUMMARY');
log('='.repeat(80));

const totalRowsAllFiles = allAnalyses
  .filter(a => a.totalRows)
  .reduce((sum, a) => sum + (a.totalRows || 0), 0);

log(`\nTotal Excel Files: ${allAnalyses.length}`);
log(`Total Rows Across All Files: ${totalRowsAllFiles.toLocaleString()}`);

log(`\n\nLarge Datasets (>100 rows): ${largeDatasets.length}`);
largeDatasets
  .sort((a, b) => b.rows - a.rows)
  .forEach((ds, index) => {
    log(`\n  ${index + 1}. ${ds.file} → "${ds.sheet}"`);
    log(`     Rows: ${ds.rows.toLocaleString()}`);
    log(`     Has Food Name: ${ds.hasFoodName ? '✓' : '✗'}`);
    log(`     Has Nutrients: ${ds.hasNutrients ? '✓' : '✗'}`);
  });

// Find potential sources for 21,000+ products
log('\n\n' + '='.repeat(80));
log('POTENTIAL SOURCES FOR 21,000+ PRODUCTS');
log('='.repeat(80));

const candidates = largeDatasets
  .filter(ds => ds.rows >= 5000 && (ds.hasFoodName || ds.hasNutrients))
  .sort((a, b) => b.rows - a.rows);

if (candidates.length > 0) {
  log(`\nFound ${candidates.length} candidate files/sheets with 5,000+ rows:`);
  candidates.forEach((candidate, index) => {
    log(`\n  ${index + 1}. ${candidate.file} → "${candidate.sheet}"`);
    log(`     Rows: ${candidate.rows.toLocaleString()}`);
    log(`     ⭐ This could be a source of the 21,000+ products!`);
  });
} else {
  log('\n  No single sheet found with 5,000+ rows.');
  log('  The 21,000+ products might be:');
  log('    1. Distributed across multiple files/sheets');
  log('    2. In the .FT or .AP text files');
  log('    3. In a combination of files that need to be merged');
}

log('\n\n' + '='.repeat(80));
log('ANALYSIS COMPLETE');
log('='.repeat(80));
log(`\nFull analysis saved to: ${OUTPUT_FILE}\n`);

