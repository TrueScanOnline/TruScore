const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const DATABASE_DIR = path.join(__dirname, '..', 'Database files');
const OUTPUT_FILE = path.join(__dirname, '..', 'FSANZ_EXCEL_ANALYSIS.txt');
const JSON_OUTPUT = path.join(__dirname, '..', 'FSANZ_EXCEL_ANALYSIS.json');

let output = '';

function log(message) {
  const msg = typeof message === 'string' ? message : JSON.stringify(message, null, 2);
  output += msg + '\n';
  console.log(msg);
}

/**
 * Analyze all Excel files in the Database files directory
 */
function analyzeExcelFile(filePath) {
  try {
    log(`\n${'='.repeat(80)}`);
    log(`Analyzing: ${path.basename(filePath)}`);
    log('='.repeat(80));
    
    const workbook = XLSX.readFile(filePath, { cellDates: true, cellNF: false, cellText: false });
    const sheetNames = workbook.SheetNames;
    
    log(`\nTotal Sheets: ${sheetNames.length}`);
    
    const analysis = {
      fileName: path.basename(filePath),
      filePath: filePath,
      sheets: []
    };
    
    sheetNames.forEach((sheetName, index) => {
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { defval: null, raw: false });
      
      const rowCount = data.length;
      const columnCount = Object.keys(data[0] || {}).length;
      const columnNames = Object.keys(data[0] || []);
      
      // Get sample rows (first 3)
      const sampleRows = data.slice(0, 3);
      
      // Check for key columns
      const hasFoodName = columnNames.some(col => 
        col && (col.toLowerCase().includes('food') || 
                col.toLowerCase().includes('name') || 
                col.toLowerCase().includes('description'))
      );
      const hasBarcode = columnNames.some(col => 
        col && col.toLowerCase().includes('barcode')
      );
      const hasNutrients = columnNames.some(col => 
        col && (col.toLowerCase().includes('nutrient') || 
                col.toLowerCase().includes('protein') || 
                col.toLowerCase().includes('fat') || 
                col.toLowerCase().includes('carbohydrate'))
      );
      const hasEnergy = columnNames.some(col => 
        col && col.toLowerCase().includes('energy')
      );
      
      const sheetInfo = {
        sheetName: sheetName,
        rowCount: rowCount,
        columnCount: columnCount,
        columnNames: columnNames.slice(0, 50),
        allColumnNames: columnNames,
        hasFoodName: hasFoodName,
        hasBarcode: hasBarcode,
        hasNutrients: hasNutrients,
        hasEnergy: hasEnergy,
        sampleRows: sampleRows,
        isLargeDataset: rowCount > 1000
      };
      
      analysis.sheets.push(sheetInfo);
      
      log(`\n  Sheet ${index + 1}: "${sheetName}"`);
      log(`    Rows: ${rowCount.toLocaleString()}`);
      log(`    Columns: ${columnCount}`);
      log(`    Has Food Name: ${hasFoodName ? '✓' : '✗'}`);
      log(`    Has Barcode: ${hasBarcode ? '✓' : '✗'}`);
      log(`    Has Nutrients: ${hasNutrients ? '✓' : '✗'}`);
      log(`    Has Energy: ${hasEnergy ? '✓' : '✗'}`);
      log(`    Large Dataset (>1000 rows): ${isLargeDataset ? '✓ YES' : '✗'}`);
      
      if (columnNames.length > 0) {
        log(`    First 15 Columns: ${columnNames.slice(0, 15).join(', ')}`);
      }
    });
    
    const totalRows = analysis.sheets.reduce((sum, sheet) => sum + sheet.rowCount, 0);
    analysis.totalRows = totalRows;
    
    log(`\n  TOTAL ROWS ACROSS ALL SHEETS: ${totalRows.toLocaleString()}`);
    
    return analysis;
  } catch (error) {
    log(`\n❌ Error analyzing ${filePath}: ${error.message}`);
    log(`Stack: ${error.stack}`);
    return {
      fileName: path.basename(filePath),
      error: error.message
    };
  }
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

function main() {
  log('\n' + '='.repeat(80));
  log('FSANZ EXCEL FILES DEEP ANALYSIS');
  log('Finding all Excel files and analyzing their tabs...');
  log('='.repeat(80));
  
  if (!fs.existsSync(DATABASE_DIR)) {
    log(`\n❌ Directory not found: ${DATABASE_DIR}`);
    process.exit(1);
  }
  
  const excelFiles = findExcelFiles(DATABASE_DIR);
  log(`\nFound ${excelFiles.length} Excel files to analyze\n`);
  
  const allAnalyses = [];
  const largeDatasets = [];
  
  excelFiles.forEach((filePath, index) => {
    log(`\n[${index + 1}/${excelFiles.length}] Processing...`);
    const analysis = analyzeExcelFile(filePath);
    allAnalyses.push(analysis);
    
    if (analysis.sheets) {
      analysis.sheets.forEach(sheet => {
        if (sheet.rowCount > 1000) {
          largeDatasets.push({
            file: analysis.fileName,
            sheet: sheet.sheetName,
            rows: sheet.rowCount,
            hasFoodName: sheet.hasFoodName,
            hasNutrients: sheet.hasNutrients,
            columnNames: sheet.columnNames
          });
        }
      });
    }
  });
  
  // Summary Report
  log('\n\n' + '='.repeat(80));
  log('SUMMARY REPORT');
  log('='.repeat(80));
  
  log(`\nTotal Excel Files Analyzed: ${allAnalyses.length}`);
  
  const totalRowsAllFiles = allAnalyses
    .filter(a => a.totalRows)
    .reduce((sum, a) => sum + (a.totalRows || 0), 0);
  log(`Total Rows Across All Files: ${totalRowsAllFiles.toLocaleString()}`);
  
  log(`\n\nLarge Datasets (>1000 rows): ${largeDatasets.length}`);
  largeDatasets
    .sort((a, b) => b.rows - a.rows)
    .forEach((ds, index) => {
      log(`\n  ${index + 1}. ${ds.file} → "${ds.sheet}"`);
      log(`     Rows: ${ds.rows.toLocaleString()}`);
      log(`     Has Food Name: ${ds.hasFoodName ? '✓' : '✗'}`);
      log(`     Has Nutrients: ${ds.hasNutrients ? '✓' : '✗'}`);
      if (ds.columnNames && ds.columnNames.length > 0) {
        log(`     Sample Columns: ${ds.columnNames.slice(0, 10).join(', ')}`);
      }
    });
  
  // Find files that might contain the 21,000+ products
  log('\n\n' + '='.repeat(80));
  log('POTENTIAL SOURCES FOR 21,000+ PRODUCTS');
  log('='.repeat(80));
  
  const candidates = largeDatasets
    .filter(ds => ds.rows >= 10000 && (ds.hasFoodName || ds.hasNutrients))
    .sort((a, b) => b.rows - a.rows);
  
  if (candidates.length > 0) {
    candidates.forEach((candidate, index) => {
      log(`\n  ${index + 1}. ${candidate.file} → "${candidate.sheet}"`);
      log(`     Rows: ${candidate.rows.toLocaleString()}`);
      log(`     This could be the source of the 21,000+ products!`);
    });
  } else {
    log('\n  No single sheet found with 10,000+ rows.');
    log('  The 21,000+ products might be distributed across multiple files/sheets.');
    log('  Or they might be in the .FT or .AP text files instead.');
    
    // Show top 10 largest datasets
    log('\n  Top 10 Largest Datasets:');
    largeDatasets
      .sort((a, b) => b.rows - a.rows)
      .slice(0, 10)
      .forEach((ds, index) => {
        log(`    ${index + 1}. ${ds.file} → "${ds.sheet}": ${ds.rows.toLocaleString()} rows`);
      });
  }
  
  // Save outputs
  fs.writeFileSync(OUTPUT_FILE, output);
  fs.writeFileSync(JSON_OUTPUT, JSON.stringify(allAnalyses, null, 2));
  
  log(`\n\n✅ Detailed analysis saved to: ${OUTPUT_FILE}`);
  log(`✅ JSON analysis saved to: ${JSON_OUTPUT}`);
  
  log('\n' + '='.repeat(80));
  log('ANALYSIS COMPLETE');
  log('='.repeat(80) + '\n');
}

main();

