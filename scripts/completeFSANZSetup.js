/**
 * Complete FSANZ Database Setup Script
 * 
 * This script automates the complete setup process:
 * 1. Guides through downloading databases
 * 2. Converts Excel to JSON
 * 3. Sets up hosting configuration
 * 4. Updates environment variables
 * 
 * Usage:
 *   node scripts/completeFSANZSetup.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const DOWNLOAD_DIR = path.join(__dirname, '../downloads');
const DATA_DIR = path.join(__dirname, '../data');
const ENV_FILE = path.join(__dirname, '../.env');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🌏 FSANZ Database Complete Setup');
  console.log('='.repeat(70));
  console.log('\nThis script will guide you through:');
  console.log('  1. Downloading FSANZ databases');
  console.log('  2. Converting Excel → JSON');
  console.log('  3. Setting up hosting');
  console.log('  4. Configuring app URLs');
  console.log('');

  // Step 1: Check if files already exist
  console.log('📋 Step 1: Checking existing files...');
  
  const auExcel = path.join(DOWNLOAD_DIR, 'fsanz-au.xlsx');
  const nzExcel = path.join(DOWNLOAD_DIR, 'fsanz-nz.xlsx');
  const auJson = path.join(DATA_DIR, 'fsanz-au.json');
  const nzJson = path.join(DATA_DIR, 'fsanz-nz.json');

  const filesStatus = {
    au: { excel: fs.existsSync(auExcel), json: fs.existsSync(auJson) },
    nz: { excel: fs.existsSync(nzExcel), json: fs.existsSync(nzJson) },
  };

  console.log(`   AU Excel: ${filesStatus.au.excel ? '✅ Found' : '❌ Not found'}`);
  console.log(`   AU JSON:  ${filesStatus.au.json ? '✅ Found' : '❌ Not found'}`);
  console.log(`   NZ Excel: ${filesStatus.nz.excel ? '✅ Found' : '❌ Not found'}`);
  console.log(`   NZ JSON:  ${filesStatus.nz.json ? '✅ Found' : '❌ Not found'}`);

  // Step 2: Download instructions
  if (!filesStatus.au.excel || !filesStatus.nz.excel) {
    console.log('\n📥 Step 2: Download FSANZ Databases');
    console.log('');
    
    if (!filesStatus.au.excel) {
      console.log('   🇦🇺 AU Database:');
      console.log('      1. Visit: https://www.foodstandards.gov.au/science-data/food-nutrient-databases/afcd');
      console.log(`      2. Download Excel file`);
      console.log(`      3. Save as: ${auExcel}`);
    }
    
    if (!filesStatus.nz.excel) {
      console.log('   🇳🇿 NZ Database:');
      console.log('      1. Visit: https://foodcomposition.co.nz/foodfiles');
      console.log(`      2. Download Excel file`);
      console.log(`      3. Save as: ${nzExcel}`);
    }

    const continueDownload = await question('\n   Have you downloaded the files? (y/n): ');
    if (continueDownload.toLowerCase() !== 'y') {
      console.log('\n   ⏸️  Please download the files and run this script again.');
      rl.close();
      return;
    }
  }

  // Step 3: Convert Excel to JSON
  console.log('\n🔄 Step 3: Convert Excel → JSON');
  
  for (const country of ['au', 'nz']) {
    const countryUpper = country.toUpperCase();
    const excelFile = path.join(DOWNLOAD_DIR, `fsanz-${country}.xlsx`);
    const jsonFile = path.join(DATA_DIR, `fsanz-${country}.json`);

    if (filesStatus[country].json) {
      console.log(`   ${countryUpper}: JSON already exists, skipping conversion`);
      continue;
    }

    if (!filesStatus[country].excel) {
      console.log(`   ${countryUpper}: Excel file not found, skipping`);
      continue;
    }

    console.log(`   Converting ${countryUpper} database...`);
    
    try {
      const { execSync } = require('child_process');
      execSync(`node scripts/importFSANZDatabase.js --input "${excelFile}" --output "${jsonFile}" --country ${countryUpper}`, {
        stdio: 'inherit',
      });
      console.log(`   ✅ ${countryUpper} conversion complete!`);
    } catch (error) {
      console.error(`   ❌ ${countryUpper} conversion failed: ${error.message}`);
    }
  }

  // Step 4: Hosting setup
  console.log('\n🌐 Step 4: Set Up Hosting');
  console.log('');
  console.log('   Choose a hosting provider:');
  console.log('     1. Vercel (Recommended - FREE, already set up)');
  console.log('     2. AWS S3 + CloudFront');
  console.log('     3. GitHub Releases');
  console.log('     4. Manual (I will configure later)');

  const hostingChoice = await question('\n   Enter choice (1-4): ');

  let baseUrl = '';
  
  if (hostingChoice === '1') {
    console.log('\n   📦 Vercel Setup:');
    console.log('      1. Deploy backend to Vercel: cd backend/vercel && vercel --prod');
    console.log('      2. Upload JSON files to Vercel (or deploy from repo)');
    console.log('      3. Get your Vercel deployment URL');
    baseUrl = await question('\n      Enter your Vercel deployment URL (e.g., https://truescan-backend.vercel.app): ');
    if (!baseUrl.startsWith('http')) {
      baseUrl = `https://${baseUrl}`;
    }
    baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  } else if (hostingChoice === '2') {
    console.log('\n   ☁️  AWS S3 Setup:');
    console.log('      Follow instructions in: npm run setup-fsanz-hosting -- --provider aws');
    baseUrl = await question('\n      Enter your CloudFront/S3 URL: ');
  } else if (hostingChoice === '3') {
    console.log('\n   📦 GitHub Releases Setup:');
    console.log('      Follow instructions in: npm run setup-fsanz-hosting -- --provider github');
    baseUrl = await question('\n      Enter your GitHub Releases URL: ');
  } else {
    console.log('\n   ⏸️  Manual setup - you can configure URLs later in .env file');
    rl.close();
    return;
  }

  // Step 5: Update .env file
  console.log('\n⚙️  Step 5: Update Configuration');
  
  let envContent = '';
  if (fs.existsSync(ENV_FILE)) {
    envContent = fs.readFileSync(ENV_FILE, 'utf8');
  }

  // Remove existing FSANZ URLs
  envContent = envContent.replace(/EXPO_PUBLIC_FSANZ_AU_URL=.*\n/g, '');
  envContent = envContent.replace(/EXPO_PUBLIC_FSANZ_NZ_URL=.*\n/g, '');

  // Add new URLs
  const auUrl = hostingChoice === '1' 
    ? `${baseUrl}/api/fsanz/au.json`
    : await question('\n   Enter FSANZ AU database URL: ');
    
  const nzUrl = hostingChoice === '1'
    ? `${baseUrl}/api/fsanz/nz.json`
    : await question('\n   Enter FSANZ NZ database URL: ');

  envContent += `\n# FSANZ Database URLs (auto-configured)\n`;
  envContent += `EXPO_PUBLIC_FSANZ_AU_URL=${auUrl}\n`;
  envContent += `EXPO_PUBLIC_FSANZ_NZ_URL=${nzUrl}\n`;

  fs.writeFileSync(ENV_FILE, envContent, 'utf8');
  console.log(`   ✅ Configuration saved to .env file`);

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('✅ Setup Complete!');
  console.log('='.repeat(70));
  console.log('\nSummary:');
  console.log(`   AU Database URL: ${auUrl}`);
  console.log(`   NZ Database URL: ${nzUrl}`);
  console.log('\nNext steps:');
  console.log('   1. Restart your development server to load new environment variables');
  console.log('   2. Launch app as NZ or AU user');
  console.log('   3. Check logs for automatic database download');
  console.log('   4. Test by scanning a product');
  console.log('');

  rl.close();
}

main().catch((error) => {
  console.error('Error:', error);
  rl.close();
  process.exit(1);
});

















