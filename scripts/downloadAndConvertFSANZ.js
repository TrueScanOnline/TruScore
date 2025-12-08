/**
 * FSANZ Database Download and Conversion Script
 * 
 * Automates the process of:
 * 1. Downloading FSANZ databases from government websites
 * 2. Converting Excel files to JSON format
 * 3. Preparing files for CDN hosting
 * 
 * Usage:
 *   node scripts/downloadAndConvertFSANZ.js --country AU
 *   node scripts/downloadAndConvertFSANZ.js --country NZ
 *   node scripts/downloadAndConvertFSANZ.js --country ALL
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// FSANZ Database Download URLs
const FSANZ_DOWNLOAD_URLS = {
  AU: {
    // Australian Food Composition Database (AFCD)
    name: 'Australian Food Composition Database',
    url: 'https://www.foodstandards.gov.au/science-data/food-nutrient-databases/afcd',
    directDownload: null, // Will need to be updated with actual download link
    instructions: 'Visit https://www.foodstandards.gov.au/science-data/food-nutrient-databases/afcd and download the Excel files manually',
  },
  NZ: {
    // New Zealand Food Composition Database (NZFCD)
    name: 'New Zealand Food Composition Database',
    url: 'https://foodcomposition.co.nz/foodfiles',
    directDownload: null, // Will need to be updated with actual download link
    instructions: 'Visit https://foodcomposition.co.nz/foodfiles and download the Excel files manually',
  },
};

const DOWNLOAD_DIR = path.join(__dirname, '../downloads');
const DATA_DIR = path.join(__dirname, '../data');

/**
 * Download file from URL
 */
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    console.log(`Downloading from: ${url}`);
    console.log(`Saving to: ${filepath}`);
    
    const file = fs.createWriteStream(filepath);
    
    protocol.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirect
        return downloadFile(response.headers.location, filepath)
          .then(resolve)
          .catch(reject);
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(filepath);
        reject(new Error(`Failed to download: ${response.statusCode} ${response.statusMessage}`));
        return;
      }
      
      const totalSize = parseInt(response.headers['content-length'], 10);
      let downloadedSize = 0;
      
      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        if (totalSize) {
          const percent = ((downloadedSize / totalSize) * 100).toFixed(1);
          process.stdout.write(`\rProgress: ${percent}% (${(downloadedSize / 1024 / 1024).toFixed(2)}MB / ${(totalSize / 1024 / 1024).toFixed(2)}MB)`);
        }
      });
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log('\n✅ Download complete!');
        resolve();
      });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      reject(err);
    });
  });
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  let country = null;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--country' && args[i + 1]) {
      country = args[i + 1].toUpperCase();
      i++;
    }
  }
  
  if (!country || (country !== 'AU' && country !== 'NZ' && country !== 'ALL')) {
    console.error('Usage: node scripts/downloadAndConvertFSANZ.js --country <AU|NZ|ALL>');
    console.error('');
    console.error('Examples:');
    console.error('  node scripts/downloadAndConvertFSANZ.js --country AU');
    console.error('  node scripts/downloadAndConvertFSANZ.js --country NZ');
    console.error('  node scripts/downloadAndConvertFSANZ.js --country ALL');
    process.exit(1);
  }
  
  // Ensure directories exist
  if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
    console.log(`Created directory: ${DOWNLOAD_DIR}`);
  }
  
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log(`Created directory: ${DATA_DIR}`);
  }
  
  const countries = country === 'ALL' ? ['AU', 'NZ'] : [country];
  
  for (const countryCode of countries) {
    console.log('\n' + '='.repeat(70));
    console.log(`Processing FSANZ ${countryCode} Database`);
    console.log('='.repeat(70));
    
    const dbInfo = FSANZ_DOWNLOAD_URLS[countryCode];
    
    if (!dbInfo.directDownload) {
      console.log(`\n⚠️  Direct download URL not available for ${dbInfo.name}`);
      console.log(`\n${dbInfo.instructions}`);
      console.log(`\nAfter downloading, save the Excel file to:`);
      console.log(`  ${path.join(DOWNLOAD_DIR, `fsanz-${countryCode.toLowerCase()}.xlsx`)}`);
      console.log(`\nThen run the conversion script:`);
      console.log(`  npm run import-fsanz -- --input ${path.join(DOWNLOAD_DIR, `fsanz-${countryCode.toLowerCase()}.xlsx`)} --output ${path.join(DATA_DIR, `fsanz-${countryCode.toLowerCase()}.json`)} --country ${countryCode}`);
      console.log('\nSkipping to conversion step...');
      continue;
    }
    
    // Download step
    const excelFile = path.join(DOWNLOAD_DIR, `fsanz-${countryCode.toLowerCase()}.xlsx`);
    
    try {
      console.log(`\n📥 Step 1: Downloading ${dbInfo.name}...`);
      await downloadFile(dbInfo.directDownload, excelFile);
    } catch (error) {
      console.error(`\n❌ Download failed: ${error.message}`);
      console.error(`\nPlease download manually from: ${dbInfo.url}`);
      console.error(`Save to: ${excelFile}`);
      continue;
    }
    
    // Conversion step
    console.log(`\n🔄 Step 2: Converting Excel to JSON...`);
    const jsonFile = path.join(DATA_DIR, `fsanz-${countryCode.toLowerCase()}.json`);
    
    try {
      // Use the existing import script
      const { execSync } = require('child_process');
      execSync(`node scripts/importFSANZDatabase.js --input "${excelFile}" --output "${jsonFile}" --country ${countryCode}`, {
        stdio: 'inherit',
      });
      
      console.log(`\n✅ Conversion complete!`);
      console.log(`   JSON file: ${jsonFile}`);
      console.log(`   Size: ${(fs.statSync(jsonFile).size / 1024 / 1024).toFixed(2)} MB`);
      
    } catch (error) {
      console.error(`\n❌ Conversion failed: ${error.message}`);
      continue;
    }
    
    // Compression step (optional)
    console.log(`\n📦 Step 3: Compressing JSON file...`);
    try {
      const { gzipSync } = require('zlib');
      const compressed = gzipSync(fs.readFileSync(jsonFile));
      const compressedFile = jsonFile + '.gz';
      fs.writeFileSync(compressedFile, compressed);
      console.log(`✅ Compressed file created: ${compressedFile}`);
      console.log(`   Original size: ${(fs.statSync(jsonFile).size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   Compressed size: ${(compressed.length / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   Compression ratio: ${((1 - compressed.length / fs.statSync(jsonFile).size) * 100).toFixed(1)}%`);
    } catch (error) {
      console.warn(`⚠️  Compression skipped (zlib not available): ${error.message}`);
    }
    
    console.log(`\n✅ ${dbInfo.name} processing complete!`);
    console.log(`\nNext steps:`);
    console.log(`1. Upload ${jsonFile} to your CDN`);
    console.log(`2. Update EXPO_PUBLIC_FSANZ_${countryCode}_URL in .env file`);
    console.log(`3. App will automatically download on first launch for ${countryCode} users`);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('All processing complete!');
  console.log('='.repeat(70));
}

main().catch(console.error);










