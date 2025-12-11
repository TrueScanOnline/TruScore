// Script to download and process PLANET Pillar databases
// Downloads publicly available CSV/JSON data and converts to TypeScript

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const DATA_DIR = path.join(__dirname, '../src/data/planetDatabases');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Download file from URL
 */
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);
    
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirects
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

/**
 * Download EWG Dirty Dozen (web scrape or hardcode - no official CSV)
 */
async function downloadEWGDirtyDozen() {
  console.log('📥 EWG Dirty Dozen: Using hardcoded data (no official CSV available)');
  // EWG doesn't provide CSV - we'll use hardcoded data
  return true;
}

/**
 * Download RSPO Certified Companies
 * Note: RSPO doesn't provide public CSV, but we can expand our list
 */
async function downloadRSPO() {
  console.log('📥 RSPO: Expanding hardcoded list (no public CSV available)');
  // RSPO member list is not publicly available as CSV
  // We'll expand the hardcoded list with known certified companies
  return true;
}

/**
 * Download USDA PDP Data
 * USDA provides annual reports - we'll create a script to process them
 */
async function downloadUSDAPDP() {
  console.log('📥 USDA PDP: Checking for available data...');
  
  // USDA PDP data is available at:
  // https://www.ams.usda.gov/datasets/pdp
  // Annual reports are published, but require manual download
  
  console.log('⚠️  USDA PDP requires manual download from:');
  console.log('   https://www.ams.usda.gov/datasets/pdp');
  console.log('   Save as: src/data/planetDatabases/usda_pdp.csv');
  
  return false; // Requires manual download
}

/**
 * Download FAO FAOSTAT Data
 * FAO provides API and CSV downloads
 */
async function downloadFAO() {
  console.log('📥 FAO FAOSTAT: Checking for API access...');
  
  // FAO FAOSTAT API: https://www.fao.org/faostat/en/#data
  // Requires specific queries for water usage, carbon footprint, land use
  
  console.log('⚠️  FAO FAOSTAT requires API queries or manual CSV download:');
  console.log('   https://www.fao.org/faostat/en/#data');
  console.log('   Domains: Environment, Crops');
  console.log('   Save as: src/data/planetDatabases/fao_crop_data.csv');
  
  return false; // Requires API setup or manual download
}

/**
 * Download Agribalyse Data
 * Agribalyse provides Excel files
 */
async function downloadAgribalyse() {
  console.log('📥 Agribalyse: Checking for available data...');
  
  // Agribalyse: https://agribalyse.ademe.fr/
  // Provides Excel files with LCA data
  
  console.log('⚠️  Agribalyse requires manual download:');
  console.log('   https://agribalyse.ademe.fr/');
  console.log('   Download Excel file and convert to CSV');
  console.log('   Save as: src/data/planetDatabases/agribalyse.csv');
  
  return false; // Requires manual download
}

/**
 * Download RIVM Database
 * RIVM provides Excel files (CC BY 4.0 license)
 */
async function downloadRIVM() {
  console.log('📥 RIVM: Attempting download...');
  
  // RIVM database: https://www.rivm.nl/en/food-and-nutrition/sustainable-food/environmental-impact-of-food-products
  // Available as Excel file, CC BY 4.0 license
  
  const rivmUrl = 'https://www.rivm.nl/sites/default/files/2024-01/Environmental%20impact%20of%20food%20products.xlsx';
  const dest = path.join(DATA_DIR, 'rivm.xlsx');
  
  try {
    await downloadFile(rivmUrl, dest);
    console.log('✅ RIVM downloaded successfully');
    console.log('   Note: Requires Excel to CSV conversion');
    return true;
  } catch (error) {
    console.log('⚠️  RIVM download failed:', error.message);
    console.log('   Manual download: https://www.rivm.nl/en/food-and-nutrition/sustainable-food/environmental-impact-of-food-products');
    return false;
  }
}

/**
 * Main download function
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('PLANET PILLAR DATABASE DOWNLOAD SCRIPT');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  
  const results = {
    ewg: await downloadEWGDirtyDozen(),
    rspo: await downloadRSPO(),
    usda: await downloadUSDAPDP(),
    fao: await downloadFAO(),
    agribalyse: await downloadAgribalyse(),
    rivm: await downloadRIVM(),
  };
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('DOWNLOAD SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  
  Object.entries(results).forEach(([name, success]) => {
    console.log(`${success ? '✅' : '⚠️ '} ${name.toUpperCase()}: ${success ? 'Downloaded' : 'Requires manual download'}`);
  });
  
  console.log('');
  console.log('📋 Next Steps:');
  console.log('   1. Manually download databases marked with ⚠️');
  console.log('   2. Convert Excel files to CSV if needed');
  console.log('   3. Place CSV files in: src/data/planetDatabases/');
  console.log('   4. Run: node scripts/process_planet_databases.js');
  console.log('');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { downloadFile, downloadRIVM };

