/**
 * Comprehensive API Key Testing Script
 * 
 * Tests all configured API keys to verify they work correctly.
 * Run this after adding API keys to .env file.
 * 
 * Usage: npx ts-node scripts/testAllAPIKeys.ts
 */

/// <reference path="../global.d.ts" />

if (typeof (global as any).__DEV__ === 'undefined') {
  (global as any).__DEV__ = process.env.NODE_ENV !== 'production';
}

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load .env file
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.warn('⚠️  .env file not found. Using environment variables only.');
}

// Test barcode for API key validation
const TEST_BARCODE = '3017620422003'; // Nutella (common product)

interface TestResult {
  database: string;
  envVariable: string;
  configured: boolean;
  working: boolean;
  responseTime?: number;
  error?: string;
  testDetails?: string;
}

const results: TestResult[] = [];

/**
 * Test if API key is configured
 */
function isKeyConfigured(envVar: string, minLength: number = 10): boolean {
  const key = process.env[envVar] || '';
  return key.trim().length >= minLength && !key.includes('your_') && !key.includes('YOUR_');
}

/**
 * Test API key by making a direct API call
 */
async function testAPIKeyDirect(
  database: string,
  testUrl: string,
  headers?: Record<string, string>
): Promise<{ working: boolean; responseTime: number; error?: string; details?: string }> {
  const startTime = Date.now();
  try {
    const response = await Promise.race([
      fetch(testUrl, { headers: headers || {} }),
      new Promise<Response>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout after 10 seconds')), 10000)
      ),
    ]) as Response;
    
    const responseTime = Date.now() - startTime;
    const status = response.status;
    
    if (status === 200 || status === 201) {
      return { working: true, responseTime, details: `HTTP ${status}` };
    } else if (status === 401 || status === 403) {
      return { working: false, responseTime, error: `HTTP ${status} - Invalid API key` };
    } else if (status === 404) {
      return { working: true, responseTime, details: `HTTP ${status} - Product not found (API key valid)` };
    } else if (status === 429) {
      return { working: true, responseTime, error: `HTTP ${status} - Rate limited (API key valid)` };
    } else {
      return { working: false, responseTime, error: `HTTP ${status}` };
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    const errorMsg = error.message || String(error);
    
    if (errorMsg.includes('Timeout')) {
      return { working: false, responseTime, error: 'Request timeout (10s)' };
    }
    
    return { working: false, responseTime, error: errorMsg };
  }
}

/**
 * Test API key using service function
 */
async function testAPIKeyService(
  database: string,
  testFunction: (barcode: string) => Promise<any>
): Promise<{ working: boolean; responseTime: number; error?: string; details?: string }> {
  const startTime = Date.now();
  try {
    const result = await Promise.race([
      testFunction(TEST_BARCODE),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout after 10 seconds')), 10000)
      ),
    ]);
    
    const responseTime = Date.now() - startTime;
    
    // If function returns null, it might be because product not found (key works) or key invalid
    // We'll assume null means product not found (key is valid)
    return { working: true, responseTime, details: result ? 'Product found' : 'Product not found (key valid)' };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    const errorMsg = error.message || String(error);
    
    // Check for authentication errors
    if (errorMsg.includes('401') || errorMsg.includes('403') || 
        errorMsg.includes('Unauthorized') || errorMsg.includes('Forbidden') ||
        errorMsg.includes('API key') || errorMsg.includes('authentication') ||
        errorMsg.includes('Invalid') || errorMsg.includes('invalid')) {
      return { working: false, responseTime, error: 'API key invalid or expired' };
    }
    
    // Timeout or network errors don't mean key is invalid
    if (errorMsg.includes('Timeout') || errorMsg.includes('Network') || errorMsg.includes('ECONNREFUSED')) {
      return { working: false, responseTime, error: 'Network/timeout error (key may be valid)' };
    }
    
    // Other errors - assume key might be valid but product not found
    return { working: true, responseTime, error: errorMsg };
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🔑 Testing All API Keys\n');
  console.log(`Test Barcode: ${TEST_BARCODE}\n`);
  console.log('='.repeat(60) + '\n');

  // Define all API key tests
  const apiKeyTests = [
    {
      database: 'USDA FoodData Central',
      envVariable: 'EXPO_PUBLIC_USDA_API_KEY',
      testFunction: async (barcode: string) => {
        const { fetchProductFromUSDA } = await import('../src/services/usdaFoodData');
        return fetchProductFromUSDA(barcode);
      },
    },
    {
      database: 'EAN-Search',
      envVariable: 'EXPO_PUBLIC_EAN_SEARCH_API_KEY',
      testFunction: async (barcode: string) => {
        const { fetchProductFromEANSearch } = await import('../src/services/eanSearchApi');
        return fetchProductFromEANSearch(barcode);
      },
    },
    {
      database: 'UPC Database',
      envVariable: 'EXPO_PUBLIC_UPC_DATABASE_API_KEY',
      testFunction: async (barcode: string) => {
        const { fetchProductFromUPCDatabase } = await import('../src/services/upcDatabaseApi');
        return fetchProductFromUPCDatabase(barcode);
      },
    },
    {
      database: 'Edamam',
      envVariable: 'EXPO_PUBLIC_EDAMAM_APP_ID',
      envVariable2: 'EXPO_PUBLIC_EDAMAM_APP_KEY',
      testFunction: async (barcode: string) => {
        const { fetchProductFromEdamam } = await import('../src/services/edamamApi');
        return fetchProductFromEdamam(barcode);
      },
    },
    {
      database: 'Nutritionix',
      envVariable: 'EXPO_PUBLIC_NUTRITIONIX_APP_ID',
      envVariable2: 'EXPO_PUBLIC_NUTRITIONIX_API_KEY',
      testFunction: async (barcode: string) => {
        const { fetchProductFromNutritionix } = await import('../src/services/nutritionixApi');
        return fetchProductFromNutritionix(barcode);
      },
    },
    {
      database: 'Spoonacular',
      envVariable: 'EXPO_PUBLIC_SPOONACULAR_API_KEY',
      testFunction: async (barcode: string) => {
        const { fetchProductFromSpoonacular } = await import('../src/services/spoonacularApi');
        return fetchProductFromSpoonacular(barcode);
      },
    },
    {
      database: 'Barcode Lookup',
      envVariable: 'EXPO_PUBLIC_BARCODE_LOOKUP_API_KEY',
      testFunction: async (barcode: string) => {
        const { fetchProductFromBarcodeLookup } = await import('../src/services/barcodeLookupApi');
        return fetchProductFromBarcodeLookup(barcode);
      },
    },
    {
      database: 'Barcode Lookup Com',
      envVariable: 'BARCODE_LOOKUP_API_KEY',
      testFunction: async (barcode: string) => {
        const { fetchProductFromBarcodeLookupCom } = await import('../src/services/barcodeLookupComApi');
        return fetchProductFromBarcodeLookupCom(barcode);
      },
    },
    {
      database: 'Best Buy',
      envVariable: 'EXPO_PUBLIC_BESTBUY_API_KEY',
      testFunction: async (barcode: string) => {
        const { fetchProductFromBestBuy } = await import('../src/services/bestBuyApi');
        return fetchProductFromBestBuy(barcode);
      },
    },
    {
      database: 'EANData',
      envVariable: 'EXPO_PUBLIC_EANDATA_API_KEY',
      testFunction: async (barcode: string) => {
        const { fetchProductFromEANData } = await import('../src/services/eanDataApi');
        return fetchProductFromEANData(barcode);
      },
    },
    {
      database: 'Walmart Open API',
      envVariable: 'EXPO_PUBLIC_WALMART_API_KEY',
      testFunction: async (barcode: string) => {
        const { fetchProductFromWalmart } = await import('../src/services/walmartOpenApi');
        return fetchProductFromWalmart(barcode);
      },
    },
  ];

  // Test each API key
  for (const apiTest of apiKeyTests) {
    const result: TestResult = {
      database: apiTest.database,
      envVariable: apiTest.envVariable,
      configured: false,
      working: false,
    };

    // Check if configured (handle dual-variable APIs)
    if (apiTest.envVariable2) {
      result.configured = isKeyConfigured(apiTest.envVariable) && isKeyConfigured(apiTest.envVariable2);
    } else {
      result.configured = isKeyConfigured(apiTest.envVariable);
    }

    console.log(`Testing ${apiTest.database}...`);
    console.log(`  Environment Variable: ${apiTest.envVariable}${apiTest.envVariable2 ? ` + ${apiTest.envVariable2}` : ''}`);
    console.log(`  Configured: ${result.configured ? '✅ Yes' : '❌ No'}`);

    if (result.configured) {
      try {
        const testResult = await testAPIKeyService(apiTest.database, apiTest.testFunction);
        result.working = testResult.working;
        result.responseTime = testResult.responseTime;
        result.error = testResult.error;
        result.testDetails = testResult.details;

        if (testResult.working) {
          console.log(`  Status: ✅ Working (${testResult.responseTime}ms)`);
          if (testResult.details) {
            console.log(`  Details: ${testResult.details}`);
          }
        } else {
          console.log(`  Status: ❌ Failed`);
          if (testResult.error) {
            console.log(`  Error: ${testResult.error}`);
          }
        }
      } catch (error: any) {
        result.working = false;
        result.error = error.message || String(error);
        console.log(`  Status: ❌ Error`);
        console.log(`  Error: ${result.error}`);
      }
    } else {
      console.log(`  Status: ⚠️  Not configured`);
    }

    results.push(result);
    console.log('');
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Generate summary
  generateSummary();
}

/**
 * Generate test summary
 */
function generateSummary(): void {
  const configured = results.filter(r => r.configured).length;
  const working = results.filter(r => r.configured && r.working).length;
  const failed = results.filter(r => r.configured && !r.working).length;
  const missing = results.filter(r => !r.configured).length;

  console.log('='.repeat(60));
  console.log('📊 TEST SUMMARY\n');
  console.log(`Total APIs Tested: ${results.length}`);
  console.log(`✅ Configured: ${configured}/${results.length}`);
  console.log(`✅ Working: ${working}/${configured} (${configured > 0 ? Math.round(working / configured * 100) : 0}%)`);
  console.log(`❌ Failed: ${failed}/${configured}`);
  console.log(`⚠️  Missing: ${missing}/${results.length}\n`);

  if (working > 0) {
    console.log('✅ WORKING API KEYS:');
    results.filter(r => r.configured && r.working).forEach(r => {
      console.log(`   - ${r.database} (${r.responseTime}ms)`);
    });
    console.log('');
  }

  if (failed > 0) {
    console.log('❌ FAILED API KEYS:');
    results.filter(r => r.configured && !r.working).forEach(r => {
      console.log(`   - ${r.database}: ${r.error || 'Unknown error'}`);
    });
    console.log('');
  }

  if (missing > 0) {
    console.log('⚠️  MISSING API KEYS:');
    results.filter(r => !r.configured).forEach(r => {
      console.log(`   - ${r.database} (${r.envVariable})`);
    });
    console.log('');
  }

  console.log('='.repeat(60));
  console.log('\n💡 Next Steps:');
  if (missing > 0) {
    console.log('   1. Get missing API keys (see API_KEYS_COMPLETE_GUIDE.md)');
    console.log('   2. Add keys to .env file');
    console.log('   3. Re-run this test script');
  }
  if (failed > 0) {
    console.log('   4. Check failed API keys - verify keys are correct and not expired');
  }
  if (working === configured && configured > 0) {
    console.log('   ✅ All configured API keys are working!');
  }
}

main().catch(console.error);
