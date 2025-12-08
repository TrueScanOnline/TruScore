const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

console.log('='.repeat(80));
console.log('FSANZ COMPREHENSIVE PROCESSING');
console.log('='.repeat(80));

const DB_DIR = path.join(__dirname, '..', 'Database files');
const OUTPUT_DIR = path.join(__dirname, '..', 'backend', 'vercel', 'data');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Process file function
function processExcelFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠️  Not found: ${path.basename(filePath)}`);
    return [];
  }
  
  try {
    const workbook = XLSX.readFile(filePath);
    let allData = [];
    
    workbook.SheetNames.forEach(sheetName => {
      const lower = sheetName.toLowerCase();
      if (lower.includes('index') || lower.includes('readme') || lower.includes('metadata')) {
        return;
      }
      
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { defval: null });
      allData = allData.concat(data);
    });
    
    console.log(`  ✅ ${path.basename(filePath)}: ${allData.length} rows`);
    return allData;
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return [];
  }
}

// Normalize function
function normalize(row, index) {
  const name = String(
    row['Food Name'] || row['Food name'] || row['Name'] || 
    row['Description'] || row['Public Food Key'] || `Food ${index}`
  ).trim();
  
  const get = (names) => {
    for (const n of names) {
      const v = row[n];
      if (v != null && v !== '') {
        const p = parseFloat(v);
        if (!isNaN(p)) return p;
      }
    }
    return undefined;
  };
  
  return {
    foodName: name,
    foodNameLower: name.toLowerCase().trim(),
    energyKcal: get(['Energy (kcal)', 'Energy kcal']),
    energyKj: get(['Energy (kJ)', 'Energy kj']),
    protein: get(['Protein', 'Protein (g)']),
    fat: get(['Fat', 'Fat (g)']),
    carbohydrates: get(['Carbohydrates', 'Carbohydrates (g)']),
    sodium: get(['Sodium', 'Sodium (mg)', 'Sodium (g)']),
  };
}

// Process AFCD
console.log('\nProcessing AFCD (Australia)...');
const afcdFiles = [
  'AU Release 2 - Nutrient file.xlsx',
  'AU Release 2 - Food Details.xlsx',
  'Food Records archived from latest version of FOODfiles.xlsx',
  'New Food Records replacing old Food Records in latest version of FOODfiles.xlsx',
  'Data added to or updated in the Food Records in the latest version of FOODfiles.xlsx',
];

let afcdData = [];
afcdFiles.forEach(file => {
  const data = processExcelFile(path.join(DB_DIR, file));
  afcdData = afcdData.concat(data);
});

console.log(`Total AFCD rows: ${afcdData.length}`);

const afcdNormalized = afcdData.map((r, i) => normalize(r, i))
  .filter(f => f.foodName && f.foodName.length > 1 && !f.foodName.match(/^Food \d+$/));

const afcdUnique = [];
const seenAFCD = new Set();
afcdNormalized.forEach(f => {
  if (!seenAFCD.has(f.foodNameLower)) {
    seenAFCD.add(f.foodNameLower);
    afcdUnique.push(f);
  }
});

console.log(`AFCD unique foods: ${afcdUnique.length}`);

// Process NZFCD - Use text file parser for Standard DATA.AP
console.log('\nProcessing NZFCD (New Zealand)...');

// Try Excel files first
const nzfcdFiles = [
  'Standard DATA.AP.xlsx',
  'Standard DATA.FT.xlsx',
  'Unabridged DATA.AP.xlsx',
  'Unabridged DATA.FT.xlsx',
];

let nzfcdData = [];
nzfcdFiles.forEach(file => {
  const data = processExcelFile(path.join(DB_DIR, file));
  nzfcdData = nzfcdData.concat(data);
});

// Also try text file if Excel parsing fails
if (nzfcdData.length < 1000) {
  console.log('  Trying text file parser for Standard DATA.AP...');
  const textPath = path.join(DB_DIR, 'Standard DATA.AP');
  if (fs.existsSync(textPath)) {
    const content = fs.readFileSync(textPath, 'utf8');
    const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('©'));
    const dataLines = lines.slice(2); // Skip header
    
    dataLines.forEach(line => {
      const parts = line.split('~');
      if (parts.length >= 2) {
        const foodId = parts[0].trim();
        const foodName = parts[1].trim();
        if (foodName && foodName.length > 1) {
          nzfcdData.push({
            'Food ID': foodId,
            'Food Name': foodName,
          });
        }
      }
    });
    console.log(`  Added ${dataLines.length} foods from text file`);
  }
}

console.log(`Total NZFCD rows: ${nzfcdData.length}`);

const nzfcdNormalized = nzfcdData.map((r, i) => normalize(r, i))
  .filter(f => f.foodName && f.foodName.length > 1 && !f.foodName.match(/^Food \d+$/));

const nzfcdUnique = [];
const seenNZFCD = new Set();
nzfcdNormalized.forEach(f => {
  if (!seenNZFCD.has(f.foodNameLower)) {
    seenNZFCD.add(f.foodNameLower);
    nzfcdUnique.push(f);
  }
});

console.log(`NZFCD unique foods: ${nzfcdUnique.length}`);

// Write files
const afcdPath = path.join(OUTPUT_DIR, 'afcd.json');
const nzfcdPath = path.join(OUTPUT_DIR, 'nzfcd.json');

fs.writeFileSync(afcdPath, JSON.stringify(afcdUnique, null, 2));
fs.writeFileSync(nzfcdPath, JSON.stringify(nzfcdUnique, null, 2));

const total = afcdUnique.length + nzfcdUnique.length;

console.log('\n' + '='.repeat(80));
console.log('RESULTS');
console.log('='.repeat(80));
console.log(`AFCD: ${afcdUnique.length.toLocaleString()} foods`);
console.log(`NZFCD: ${nzfcdUnique.length.toLocaleString()} foods`);
console.log(`TOTAL: ${total.toLocaleString()} foods`);

if (total >= 21000) {
  console.log(`\n✅ SUCCESS: Found ${total.toLocaleString()} foods (meets 21,000+ requirement!)`);
} else {
  console.log(`\n⚠️  Found ${total.toLocaleString()} foods (target was 21,000+)`);
}

console.log(`\nFiles written:`);
console.log(`  - ${afcdPath}`);
console.log(`  - ${nzfcdPath}`);
console.log('\n' + '='.repeat(80));

