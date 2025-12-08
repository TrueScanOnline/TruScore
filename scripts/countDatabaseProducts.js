/**
 * Count products in NZFCD and AFCD databases
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

console.log('========================================');
console.log('DATABASE PRODUCT COUNT');
console.log('========================================\n');

// Check NZFCD
const nzfcdPath = path.join(__dirname, '..', 'backend', 'vercel', 'data', 'nzfcd.json');
if (fs.existsSync(nzfcdPath)) {
  const nzData = JSON.parse(fs.readFileSync(nzfcdPath, 'utf8'));
  const nzSize = fs.statSync(nzfcdPath).size / 1024 / 1024;
  console.log('🇳🇿 NEW ZEALAND (NZFCD):');
  console.log(`   Products: ${nzData.length.toLocaleString()}`);
  console.log(`   Size: ${nzSize.toFixed(2)} MB`);
} else {
  console.log('🇳🇿 NEW ZEALAND (NZFCD):');
  console.log('   ❌ File not found');
}

console.log('');

// Check AFCD
const afcdPath = path.join(__dirname, '..', 'backend', 'vercel', 'data', 'afcd.json');
if (fs.existsSync(afcdPath)) {
  const auData = JSON.parse(fs.readFileSync(afcdPath, 'utf8'));
  const auSize = fs.statSync(afcdPath).size / 1024 / 1024;
  console.log('🇦🇺 AUSTRALIA (AFCD):');
  console.log(`   Products: ${auData.length.toLocaleString()}`);
  console.log(`   Size: ${auSize.toFixed(2)} MB`);
} else {
  console.log('🇦🇺 AUSTRALIA (AFCD):');
  console.log('   ❌ File not found');
}

console.log('');

// Analyze source files
console.log('========================================');
console.log('SOURCE FILE ANALYSIS');
console.log('========================================\n');

// NZFCD Source
try {
  const nzSourcePath = path.join(__dirname, '..', 'Database files', 'Principal files', 'Excel files', 'Standard', 'Standard DATA.FT.xlsx');
  if (fs.existsSync(nzSourcePath)) {
    const nzWb = XLSX.readFile(nzSourcePath);
    const nzData = XLSX.utils.sheet_to_json(nzWb.Sheets[nzWb.SheetNames[0]], { defval: null });
    console.log('🇳🇿 NZFCD Source File:');
    console.log(`   Sheet: ${nzWb.SheetNames[0]}`);
    console.log(`   Rows: ${nzData.length.toLocaleString()}`);
  }
} catch (e) {
  console.log('🇳🇿 NZFCD Source: Error reading file');
}

console.log('');

// AFCD Source Files
try {
  const nutrientPath = path.join(__dirname, '..', 'Database files', 'AU Release 2 - Nutrient file.xlsx');
  const detailsPath = path.join(__dirname, '..', 'Database files', 'AU Release 2 - Food Details.xlsx');
  
  let nutrientTotal = 0;
  let detailsTotal = 0;
  
  if (fs.existsSync(nutrientPath)) {
    const nutrientWb = XLSX.readFile(nutrientPath);
    console.log('🇦🇺 AFCD Nutrient File:');
    nutrientWb.SheetNames.forEach(name => {
      if (!name.toLowerCase().includes('index') && !name.toLowerCase().includes('readme')) {
        const data = XLSX.utils.sheet_to_json(nutrientWb.Sheets[name], { defval: null });
        nutrientTotal += data.length;
        console.log(`   ${name}: ${data.length.toLocaleString()} rows`);
      }
    });
    console.log(`   TOTAL: ${nutrientTotal.toLocaleString()} rows`);
  }
  
  console.log('');
  
  if (fs.existsSync(detailsPath)) {
    const detailsWb = XLSX.readFile(detailsPath);
    console.log('🇦🇺 AFCD Food Details File:');
    detailsWb.SheetNames.forEach(name => {
      if (!name.toLowerCase().includes('index') && !name.toLowerCase().includes('readme')) {
        const data = XLSX.utils.sheet_to_json(detailsWb.Sheets[name], { defval: null });
        detailsTotal += data.length;
        console.log(`   ${name}: ${data.length.toLocaleString()} rows`);
      }
    });
    console.log(`   TOTAL: ${detailsTotal.toLocaleString()} rows`);
  }
  
  console.log('');
  console.log('🇦🇺 AFCD COMBINED (Nutrient + Food Details):');
  console.log(`   Expected Total: ${(nutrientTotal + detailsTotal).toLocaleString()} products`);
  
} catch (e) {
  console.log('🇦🇺 AFCD Source: Error reading files -', e.message);
}

console.log('');
console.log('========================================');
