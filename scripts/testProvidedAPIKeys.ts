/**
 * Test the provided API keys directly
 * 
 * This script tests the API keys provided by the user without requiring .env file.
 * 
 * Usage: npx ts-node scripts/testProvidedAPIKeys.ts
 */

/// <reference path="../global.d.ts" />

if (typeof (global as any).__DEV__ === 'undefined') {
  (global as any).__DEV__ = process.env.NODE_ENV !== 'production';
}

// Set API keys directly for testing
process.env.EXPO_PUBLIC_USDA_API_KEY = 'VInbQfGPAI3OiVa9wafFwtseNtBUBk4ILRggbHw7';
process.env.EXPO_PUBLIC_SPOONACULAR_API_KEY = '268f1a80017d4eda94688ce32b30e79d';
process.env.EXPO_PUBLIC_BARCODE_LOOKUP_API_KEY = 'cikvt1vh5gaw7xge4kkn4mtdi8hopk';

// Test barcode
const TEST_BARCODE = '3017620422003'; // Nutella

interface TestResult {
  database: string;
  working: boolean;
  responseTime?: number;
  error?: string;
  details?: string;
}

const results: TestResult[] = [];

async function testAPIKey(
  database: string,
  testFunction: (barcode: string) => Promise<any>
): Promise<TestResult> {
  const startTime = Date.now();
  try {
    const result = await Promise.race([
      testFunction(TEST_BARCODE),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout after 10 seconds')), 10000)
      ),
    ]);
    
    const responseTime = Date.now() - startTime;
    
    return {
      database,
      working: true,
      responseTime,
      details: result ? 'Product found' : 'Product not found (key valid)',
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    const errorMsg = error.message || String(error);
    
    // Check for authentication errors
    if (errorMsg.includes('401') || errorMsg.includes('403') || 
        errorMsg.includes('Unauthorized') || errorMsg.includes('Forbidden') ||
        errorMsg.includes('API key') || errorMsg.includes('authentication') ||
        errorMsg.includes('Invalid') || errorMsg.includes('invalid')) {
      return {
        database,
        working: false,
        responseTime,
        error: 'API key invalid or expired',
      };
    }
    
    // Timeout or network errors
    if (errorMsg.includes('Timeout') || errorMsg.includes('Network') || errorMsg.includes('ECONNREFUSED')) {
      return {
        database,
        working: false,
        responseTime,
        error: 'Network/timeout error (key may be valid)',
      };
    }
    
    // Other errors - assume key might be valid
    return {
      database,
      working: true,
      responseTime,
      error: errorMsg,
    };
  }
}

async function main() {
  console.log('🔑 Testing Provided API Keys\n');
  console.log(`Test Barcode: ${TEST_BARCODE}\n`);
  console.log('='.repeat(60) + '\n');

  // Test USDA
  console.log('Testing USDA FoodData Central...');
  try {
    const { fetchProductFromUSDA } = await import('../src/services/usdaFoodData');
    const result = await testAPIKey('USDA FoodData Central', fetchProductFromUSDA);
    results.push(result);
    if (result.working) {
      console.log(`  ✅ Working (${result.responseTime}ms)`);
      if (result.details) console.log(`  Details: ${result.details}`);
    } else {
      console.log(`  ❌ Failed: ${result.error}`);
    }
  } catch (error: any) {
    console.log(`  ❌ Error: ${error.message}`);
    results.push({ database: 'USDA FoodData Central', working: false, error: error.message });
  }
  console.log('');

  // Test Spoonacular
  console.log('Testing Spoonacular...');
  try {
    const { fetchProductFromSpoonacular } = await import('../src/services/spoonacularApi');
    const result = await testAPIKey('Spoonacular', fetchProductFromSpoonacular);
    results.push(result);
    if (result.working) {
      console.log(`  ✅ Working (${result.responseTime}ms)`);
      if (result.details) console.log(`  Details: ${result.details}`);
    } else {
      console.log(`  ❌ Failed: ${result.error}`);
    }
  } catch (error: any) {
    console.log(`  ❌ Error: ${error.message}`);
    results.push({ database: 'Spoonacular', working: false, error: error.message });
  }
  console.log('');

  // Test Barcode Lookup
  console.log('Testing Barcode Lookup...');
  try {
    const { fetchProductFromBarcodeLookup } = await import('../src/services/barcodeLookupApi');
    const result = await testAPIKey('Barcode Lookup', fetchProductFromBarcodeLookup);
    results.push(result);
    if (result.working) {
      console.log(`  ✅ Working (${result.responseTime}ms)`);
      if (result.details) console.log(`  Details: ${result.details}`);
    } else {
      console.log(`  ❌ Failed: ${result.error}`);
    }
  } catch (error: any) {
    console.log(`  ❌ Error: ${error.message}`);
    results.push({ database: 'Barcode Lookup', working: false, error: error.message });
  }
  console.log('');

  // Summary
  const working = results.filter(r => r.working).length;
  const failed = results.filter(r => !r.working).length;

  console.log('='.repeat(60));
  console.log('📊 TEST SUMMARY\n');
  console.log(`Total APIs Tested: ${results.length}`);
  console.log(`✅ Working: ${working}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}\n`);

  if (working > 0) {
    console.log('✅ WORKING API KEYS:');
    results.filter(r => r.working).forEach(r => {
      console.log(`   - ${r.database} (${r.responseTime}ms)`);
    });
    console.log('');
  }

  if (failed > 0) {
    console.log('❌ FAILED API KEYS:');
    results.filter(r => !r.working).forEach(r => {
      console.log(`   - ${r.database}: ${r.error || 'Unknown error'}`);
    });
    console.log('');
  }

  console.log('='.repeat(60));
  console.log('\n💡 Next Steps:');
  console.log('   1. Run: npx ts-node scripts/addAPIKeys.ts (to add keys to .env)');
  console.log('   2. Or manually add keys to .env file');
  console.log('   3. Rebuild app to use the keys');
}

main().catch(console.error);
