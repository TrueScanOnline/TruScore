/**
 * Script to add API keys to .env file
 * 
 * This script will create or update the .env file with the provided API keys.
 * 
 * Usage: npx ts-node scripts/addAPIKeys.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const ENV_FILE_PATH = path.join(__dirname, '../.env');

// API keys provided by user
const API_KEYS = {
  USDA: 'VInbQfGPAI3OiVa9wafFwtseNtBUBk4ILRggbHw7',
  Spoonacular: '268f1a80017d4eda94688ce32b30e79d',
  BarcodeLookup: 'cikvt1vh5gaw7xge4kkn4mtdi8hopk',
};

function addAPIKeysToEnv() {
  let envContent = '';

  // Check if .env file exists
  if (fs.existsSync(ENV_FILE_PATH)) {
    envContent = fs.readFileSync(ENV_FILE_PATH, 'utf-8');
    console.log('📄 Found existing .env file, updating...\n');
  } else {
    console.log('📄 Creating new .env file...\n');
    // Start with basic template
    envContent = `# ============================================
# VERCEL BACKEND URL (REQUIRED)
# ============================================
# After deploying backend with \`vercel --prod\`, update this URL
# EXPO_PUBLIC_BACKEND_URL=https://YOUR-VERCEL-URL.vercel.app

# ============================================
# OPEN FOOD FACTS CREDENTIALS (RECOMMENDED)
# ============================================
# Create account at: https://world.openfoodfacts.org
# Use your username (not email) as user_id
# EXPO_PUBLIC_OFF_USER_ID=your_off_username
# EXPO_PUBLIC_OFF_PASSWORD=your_off_password

`;
  }

  // Update or add API keys
  const updates: string[] = [];

  // USDA
  if (envContent.includes('EXPO_PUBLIC_USDA_API_KEY=')) {
    envContent = envContent.replace(
      /EXPO_PUBLIC_USDA_API_KEY=.*/g,
      `EXPO_PUBLIC_USDA_API_KEY=${API_KEYS.USDA}`
    );
    updates.push('✅ Updated USDA API key');
  } else {
    envContent += `# ============================================
# HIGH PRIORITY API KEYS
# ============================================

# USDA FoodData Central (CONFIGURED ✅)
EXPO_PUBLIC_USDA_API_KEY=${API_KEYS.USDA}

`;
    updates.push('✅ Added USDA API key');
  }

  // Spoonacular
  if (envContent.includes('EXPO_PUBLIC_SPOONACULAR_API_KEY=')) {
    envContent = envContent.replace(
      /EXPO_PUBLIC_SPOONACULAR_API_KEY=.*/g,
      `EXPO_PUBLIC_SPOONACULAR_API_KEY=${API_KEYS.Spoonacular}`
    );
    updates.push('✅ Updated Spoonacular API key');
  } else {
    envContent += `# ============================================
# MEDIUM PRIORITY API KEYS
# ============================================

# Spoonacular API (CONFIGURED ✅)
EXPO_PUBLIC_SPOONACULAR_API_KEY=${API_KEYS.Spoonacular}

`;
    updates.push('✅ Added Spoonacular API key');
  }

  // Barcode Lookup
  if (envContent.includes('EXPO_PUBLIC_BARCODE_LOOKUP_API_KEY=')) {
    envContent = envContent.replace(
      /EXPO_PUBLIC_BARCODE_LOOKUP_API_KEY=.*/g,
      `EXPO_PUBLIC_BARCODE_LOOKUP_API_KEY=${API_KEYS.BarcodeLookup}`
    );
    updates.push('✅ Updated Barcode Lookup API key');
  } else {
    envContent += `# Barcode Lookup API (CONFIGURED ✅)
EXPO_PUBLIC_BARCODE_LOOKUP_API_KEY=${API_KEYS.BarcodeLookup}

`;
    updates.push('✅ Added Barcode Lookup API key');
  }

  // Write to file
  try {
    fs.writeFileSync(ENV_FILE_PATH, envContent, 'utf-8');
    console.log('✅ Successfully updated .env file!\n');
    updates.forEach(update => console.log(`   ${update}`));
    console.log('\n📝 Next step: Run test script to verify keys work:');
    console.log('   npx ts-node scripts/testAllAPIKeys.ts\n');
  } catch (error) {
    console.error('❌ Error writing to .env file:', error);
    console.error('\n⚠️  You may need to manually create the .env file.');
    console.error('   Copy the following to your .env file:\n');
    console.log(`EXPO_PUBLIC_USDA_API_KEY=${API_KEYS.USDA}`);
    console.log(`EXPO_PUBLIC_SPOONACULAR_API_KEY=${API_KEYS.Spoonacular}`);
    console.log(`EXPO_PUBLIC_BARCODE_LOOKUP_API_KEY=${API_KEYS.BarcodeLookup}`);
  }
}

// Run the script
addAPIKeysToEnv();
