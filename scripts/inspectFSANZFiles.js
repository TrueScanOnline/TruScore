/**
 * Inspect FSANZ Database Files
 * 
 * This script examines the downloaded FSANZ database files to understand their structure
 * and identify what columns/data are available
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const DATABASE_FILES_DIR = path.join(__dirname, '../Database files');

function inspectExcelFile(filePath, name) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📄 Inspecting: ${name}`);
  console.log(`   File: ${filePath}`);
  console.log('='.repeat(70));

  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    return null;
  }

  try {
    const workbook = XLSX.readFile(filePath);
    console.log(`\n📊 Workbook Info:`);
    console.log(`   Sheets: ${workbook.SheetNames.length}`);
    
    workbook.SheetNames.forEach((sheetName, index) => {
      console.log(`   ${index + 1}. ${sheetName}`);
    });

    // Inspect first sheet
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { defval: null });
    
    console.log(`\n📋 Sheet: "${firstSheetName}"`);
    console.log(`   Rows: ${data.length}`);

    if (data.length === 0) {
      console.log(`   ⚠️  Sheet is empty`);
      return null;
    }

    // Get column names from first row
    const firstRow = data[0];
    const columns = Object.keys(firstRow);
    
    console.log(`\n📝 Columns (${columns.length}):`);
    columns.forEach((col, index) => {
      const sampleValue = firstRow[col];
      const sampleType = sampleValue !== null && sampleValue !== undefined 
        ? typeof sampleValue 
        : 'null';
      console.log(`   ${(index + 1).toString().padStart(3)}. ${col.padEnd(40)} [${sampleType}] ${sampleValue !== null && sampleValue !== undefined ? String(sampleValue).substring(0, 50) : ''}`);
    });

    // Look for barcode-related columns
    const barcodeColumns = columns.filter(col => 
      /barcode|gtin|upc|ean|product.*code|item.*code/i.test(col)
    );

    if (barcodeColumns.length > 0) {
      console.log(`\n✅ Barcode-related columns found:`);
      barcodeColumns.forEach(col => {
        console.log(`   - ${col}`);
        // Count non-null values
        const nonNullCount = data.filter(row => row[col] !== null && row[col] !== undefined && String(row[col]).trim() !== '').length;
        console.log(`     Non-null values: ${nonNullCount}/${data.length}`);
      });
    } else {
      console.log(`\n⚠️  No barcode-related columns found`);
      console.log(`   This appears to be a food composition database, not a product database`);
    }

    // Look for product name columns
    const nameColumns = columns.filter(col => 
      /product.*name|food.*name|name|description/i.test(col)
    );

    if (nameColumns.length > 0) {
      console.log(`\n📦 Product/Food name columns:`);
      nameColumns.forEach(col => {
        console.log(`   - ${col}`);
      });
    }

    // Show first few rows as sample
    console.log(`\n📄 Sample Data (first 3 rows):`);
    data.slice(0, 3).forEach((row, index) => {
      console.log(`\n   Row ${index + 1}:`);
      Object.keys(row).slice(0, 10).forEach(key => {
        const value = row[key];
        if (value !== null && value !== undefined && String(value).trim() !== '') {
          console.log(`      ${key}: ${String(value).substring(0, 60)}`);
        }
      });
    });

    return {
      filePath,
      name,
      sheets: workbook.SheetNames,
      columns,
      rowCount: data.length,
      hasBarcodes: barcodeColumns.length > 0,
      barcodeColumns,
      nameColumns,
      sampleRows: data.slice(0, 3),
    };
  } catch (error) {
    console.error(`❌ Error reading file: ${error.message}`);
    return null;
  }
}

function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 FSANZ Database Files Inspection');
  console.log('='.repeat(70));

  const results = [];

  // Check AU files
  const auFiles = [
    {
      path: path.join(DATABASE_FILES_DIR, 'AU Release 2 - Food Details.xlsx'),
      name: 'AU Release 2 - Food Details',
    },
    {
      path: path.join(DATABASE_FILES_DIR, 'AU Release 2 - Nutrient file.xlsx'),
      name: 'AU Release 2 - Nutrient file',
    },
  ];

  // Check NZ files
  const nzFiles = [
    {
      path: path.join(DATABASE_FILES_DIR, 'Principal files', 'Excel files', 'Standard', 'Standard DATA.FT.xlsx'),
      name: 'NZ Standard DATA.FT',
    },
    {
      path: path.join(DATABASE_FILES_DIR, 'Principal files', 'Excel files', 'Standard', 'Standard DATA.AP.xlsx'),
      name: 'NZ Standard DATA.AP',
    },
  ];

  console.log('\n🇦🇺 AUSTRALIA FILES:');
  auFiles.forEach(file => {
    const result = inspectExcelFile(file.path, file.name);
    if (result) {
      results.push({ ...result, country: 'AU' });
    }
  });

  console.log('\n🇳🇿 NEW ZEALAND FILES:');
  nzFiles.forEach(file => {
    const result = inspectExcelFile(file.path, file.name);
    if (result) {
      results.push({ ...result, country: 'NZ' });
    }
  });

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 SUMMARY');
  console.log('='.repeat(70));

  results.forEach(result => {
    console.log(`\n${result.country} - ${result.name}:`);
    console.log(`   Rows: ${result.rowCount}`);
    console.log(`   Columns: ${result.columns.length}`);
    console.log(`   Has Barcodes: ${result.hasBarcodes ? '✅ YES' : '❌ NO'}`);
    if (result.barcodeColumns.length > 0) {
      console.log(`   Barcode Columns: ${result.barcodeColumns.join(', ')}`);
    }
  });

  console.log('\n' + '='.repeat(70));
  console.log('✅ Inspection Complete');
  console.log('='.repeat(70));
}

main();












