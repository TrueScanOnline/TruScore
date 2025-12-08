/**
 * Download FoodAtlas Database Bundle
 * 
 * FoodAtlas provides downloadable database bundles under Apache-2.0 license
 * Latest version: 3.2.0 (256.8 MB)
 * URL: https://www.foodatlas.ai/food-composition-downloads
 * 
 * This script downloads the latest FoodAtlas database bundle
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FOODATLAS_DOWNLOAD_PAGE = 'https://www.foodatlas.ai/food-composition-downloads';
const DATA_DIR = path.join(__dirname, '..', 'backend', 'vercel', 'data');
const FOODATLAS_DIR = path.join(DATA_DIR, 'foodatlas');

console.log('═══════════════════════════════════════════════════════════');
console.log('FOODATLAS DATABASE DOWNLOAD');
console.log('═══════════════════════════════════════════════════════════');
console.log('\n⚠️  FoodAtlas database must be downloaded manually');
console.log('   The database bundle is large (256.8 MB) and requires');
console.log('   manual download from the official website.\n');
console.log('📥 Download Instructions:');
console.log('───────────────────────────────────────────────────────────');
console.log('1. Visit: https://www.foodatlas.ai/food-composition-downloads');
console.log('2. Download the latest version (3.2.0 recommended)');
console.log('3. Extract the ZIP file');
console.log('4. Place the extracted files in:');
console.log(`   ${FOODATLAS_DIR}`);
console.log('\n📋 Expected Files:');
console.log('───────────────────────────────────────────────────────────');
console.log('- metadata_food.tsv');
console.log('- metadata_chemical.tsv');
console.log('- metadata_contains.tsv');
console.log('- metadata_disease.tsv');
console.log('- metadata_flavor.tsv');
console.log('- (and other TSV files)');
console.log('\n✅ After downloading, run:');
console.log('   node scripts/processFoodAtlas.js');
console.log('\n═══════════════════════════════════════════════════════════');

// Create directory if it doesn't exist
if (!fs.existsSync(FOODATLAS_DIR)) {
  fs.mkdirSync(FOODATLAS_DIR, { recursive: true });
  console.log(`\n✅ Created directory: ${FOODATLAS_DIR}`);
}

// Check if files already exist
const expectedFiles = [
  'metadata_food.tsv',
  'metadata_chemical.tsv',
  'metadata_contains.tsv',
];

const existingFiles = expectedFiles.filter(file => 
  fs.existsSync(path.join(FOODATLAS_DIR, file))
);

if (existingFiles.length > 0) {
  console.log(`\n✅ Found ${existingFiles.length} existing files:`);
  existingFiles.forEach(file => {
    const filePath = path.join(FOODATLAS_DIR, file);
    const stats = fs.statSync(filePath);
    console.log(`   - ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
  });
  console.log('\n💡 If you want to re-download, delete these files first.');
} else {
  console.log('\n⚠️  No FoodAtlas files found. Please download manually.');
}

console.log('\n═══════════════════════════════════════════════════════════');

