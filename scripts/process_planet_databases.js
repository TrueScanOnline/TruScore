// Script to process downloaded CSV files and convert to TypeScript
// Processes CSV files in src/data/planetDatabases/ and generates TypeScript files

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const DATA_DIR = path.join(__dirname, '../src/data/planetDatabases');
const OUTPUT_DIR = path.join(__dirname, '../src/data/planetDatabases');

/**
 * Process CSV file and convert to TypeScript
 */
function processCSV(csvPath, outputName, processor) {
  if (!fs.existsSync(csvPath)) {
    console.log(`⚠️  ${outputName}: File not found: ${csvPath}`);
    return null;
  }

  try {
    const workbook = XLSX.readFile(csvPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const processed = processor(data);
    
    // Generate TypeScript file
    const tsContent = `// ${outputName} Database
// Generated from: ${path.basename(csvPath)}
// Generated: ${new Date().toISOString()}

export interface ${outputName}Entry {
  [key: string]: string | number | undefined;
}

export const ${outputName.toUpperCase()}_DATABASE: ${outputName}Entry[] = ${JSON.stringify(processed, null, 2)};
`;

    const outputPath = path.join(OUTPUT_DIR, `${outputName}.ts`);
    fs.writeFileSync(outputPath, tsContent, 'utf8');
    
    console.log(`✅ ${outputName}: Processed ${processed.length} entries`);
    return processed;
  } catch (error) {
    console.log(`❌ ${outputName}: Error processing - ${error.message}`);
    return null;
  }
}

/**
 * Process RIVM database
 */
function processRIVM(data) {
  // RIVM Excel structure varies - adapt based on actual file
  return data.map(row => ({
    product: row['Product'] || row['product'] || row['Food product'],
    co2: row['CO2'] || row['CO2eq'] || row['GHG emissions'],
    water: row['Water'] || row['Water use'] || row['Water consumption'],
    land: row['Land'] || row['Land use'] || row['Land use (m2)'],
  })).filter(entry => entry.product);
}

/**
 * Process USDA PDP database
 */
function processUSDAPDP(data) {
  return data.map(row => ({
    crop: row['Commodity'] || row['Crop'] || row['crop'],
    residueLevel: row['Residue Level'] || row['residueLevel'] || 'unknown',
    pesticideCount: row['Pesticide Count'] || row['pesticideCount'] || 0,
  })).filter(entry => entry.crop);
}

/**
 * Process FAO FAOSTAT database
 */
function processFAO(data) {
  return data.map(row => ({
    crop: row['Item'] || row['Crop'] || row['crop'],
    waterUsage: row['Water Use'] || row['Water Usage'] || row['waterUsage'],
    carbonFootprint: row['CO2'] || row['Carbon'] || row['carbonFootprint'],
    landUse: row['Land Use'] || row['Land'] || row['landUse'],
    category: row['Category'] || row['category'] || 'medium',
  })).filter(entry => entry.crop);
}

/**
 * Process Agribalyse database
 */
function processAgribalyse(data) {
  return data.map(row => ({
    product: row['Product'] || row['product'] || row['Food product'],
    co2: row['CO2'] || row['CO2eq'] || row['GHG emissions'],
    water: row['Water'] || row['Water use'] || row['Water consumption'],
    category: row['Category'] || row['category'] || 'unknown',
  })).filter(entry => entry.product);
}

/**
 * Main processing function
 */
function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('PLANET PILLAR DATABASE PROCESSING');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  const results = {
    rivm: processCSV(path.join(DATA_DIR, 'rivm.csv'), 'rivm', processRIVM),
    usdaPDP: processCSV(path.join(DATA_DIR, 'usda_pdp.csv'), 'usdaPDP', processUSDAPDP),
    fao: processCSV(path.join(DATA_DIR, 'fao_crop_data.csv'), 'fao', processFAO),
    agribalyse: processCSV(path.join(DATA_DIR, 'agribalyse.csv'), 'agribalyse', processAgribalyse),
  };

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('PROCESSING SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  Object.entries(results).forEach(([name, result]) => {
    if (result) {
      console.log(`✅ ${name}: ${result.length} entries processed`);
    } else {
      console.log(`⚠️  ${name}: Not processed (file not found)`);
    }
  });

  console.log('');
  console.log('📋 Note: Processed files are in: src/data/planetDatabases/');
  console.log('   Import and use in csvDatabaseService.ts');
  console.log('');
}

if (require.main === module) {
  main();
}

module.exports = { processCSV, processRIVM, processUSDAPDP, processFAO, processAgribalyse };

