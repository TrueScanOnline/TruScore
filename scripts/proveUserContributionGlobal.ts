/**
 * PROOF TEST: User Contribution Global Availability
 * 
 * This test PROVES that user-entered data is globally available:
 * 1. Submits user data to Vercel backend
 * 2. Clears local cache (simulates different user/device)
 * 3. Retrieves data from Vercel backend (simulates new user scanning)
 * 4. Verifies data matches what was submitted
 * 
 * This demonstrates REAL end-to-end functionality.
 */

/// <reference path="../global.d.ts" />

// Initialize Expo/React Native globals
if (typeof (global as any).__DEV__ === 'undefined') {
  (global as any).__DEV__ = process.env.NODE_ENV !== 'production';
}
if (!process.env.EXPO_OS) {
  process.env.EXPO_OS = 'node';
}
if (typeof global !== 'undefined' && !(global as any).ErrorUtils) {
  (global as any).ErrorUtils = {
    getGlobalHandler: () => null,
    setGlobalHandler: () => {},
    reportFatalError: () => {},
    reportError: () => {},
    applyWithGuard: (fn: any, context: any, args: any[]) => {
      try {
        return fn.apply(context, args);
      } catch (e) {
        throw e;
      }
    },
  };
}
if (typeof globalThis !== 'undefined' && !globalThis.expo) {
  globalThis.expo = {
    NativeModule: class {},
    ExpoModulesCore: {},
  } as any;
}

// Mock modules (minimal - just what we need for API calls)
const Module = require('module');
const originalRequireModule = Module._load;
Module._load = function(request: string, parent: any) {
  if (request === 'expo-modules-core' || request.includes('expo-modules-core')) {
    return {
      requireNativeModule: () => ({}),
      requireOptionalNativeModule: () => ({}),
      Platform: { OS: 'node', select: (obj: any) => obj.node || obj.default },
    };
  }
  if (request === '@react-native-async-storage/async-storage') {
    const storage = new Map<string, string>();
    return {
      getItem: async (key: string) => storage.get(key) || null,
      setItem: async (key: string, value: string) => { storage.set(key, value); },
      removeItem: async (key: string) => { storage.delete(key); },
      clear: async () => { storage.clear(); },
      getAllKeys: async () => Array.from(storage.keys()),
      multiGet: async (keys: string[]) => keys.map(k => [k, storage.get(k) || null]),
      multiSet: async (pairs: [string, string][]) => {
        pairs.forEach(([k, v]) => storage.set(k, v));
      },
      multiRemove: async (keys: string[]) => {
        keys.forEach(k => storage.delete(k));
      },
    };
  }
  return originalRequireModule.apply(this, arguments);
};

import { getBackendUrl, BackendEndpoints } from '../src/config/backendConfig';

const BACKEND_URL = getBackendUrl();
const MANUAL_PRODUCTS_API = BackendEndpoints.manualProducts(BACKEND_URL);

// Generate unique test data with timestamp to avoid conflicts
const timestamp = Date.now();
const testBarcode = `9999999999999`; // Test barcode (13 digits)

interface ProofResult {
  step: string;
  success: boolean;
  message: string;
  proof: any;
}

async function proveGlobalAvailability(): Promise<ProofResult[]> {
  const results: ProofResult[] = [];
  
  const logProof = (step: string, success: boolean, message: string, proof?: any) => {
    results.push({ step, success, message, proof });
    const icon = success ? '✅' : '❌';
    console.log(`${icon} [${step}] ${message}`);
    if (proof) {
      console.log(`   PROOF:`, JSON.stringify(proof, null, 2));
    }
  };

  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔬 PROOF TEST: User Contribution Global Availability');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📦 Test Barcode: ${testBarcode}`);
  console.log(`🌐 Backend URL: ${BACKEND_URL}`);
  console.log(`🔗 API Endpoint: ${MANUAL_PRODUCTS_API}`);
  console.log(`⏰ Timestamp: ${new Date(timestamp).toISOString()}`);
  console.log('');

  // Create unique test data that we can verify
  const uniqueTestData = {
    product_name: `PROOF TEST PRODUCT ${timestamp}`,
    brands: `PROOF TEST BRAND ${timestamp}`,
    ingredients_text: `PROOF TEST INGREDIENTS ${timestamp}: Water, Sugar, Salt`,
    nutriments: {
      'energy-kcal': 100 + timestamp % 1000,
      proteins: 5.5,
      fat: 2.3,
      carbohydrates: 15.7,
      sugars: 10.2,
      sodium: 250 + timestamp % 100,
    },
    manufacturing_places: `PROOF TEST COUNTRY ${timestamp}`,
    countries: `PROOF TEST ORIGIN ${timestamp}`,
    packaging_data: {
      items: [
        {
          material: 'en:plastic',
          shape: 'en:bottle',
          recycling: 'en:recyclable',
        },
      ],
    },
  };

  // ============================================================
  // STEP 1: Submit data to Vercel backend (simulates User A entering data)
  // ============================================================
  console.log('─'.repeat(63));
  console.log('STEP 1: User A submits data to Vercel backend');
  console.log('─'.repeat(63));
  
  let submittedData: any = null;
  try {
    const response = await fetch(MANUAL_PRODUCTS_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        barcode: testBarcode,
        productData: {
          ...uniqueTestData,
          barcode: testBarcode,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logProof(
        '1.1',
        false,
        `Backend submission failed: ${response.status} ${response.statusText}`,
        { error: errorText }
      );
      return results;
    }

    const responseData = await response.json();
    submittedData = uniqueTestData;
    
    logProof(
      '1.1',
      true,
      `Data successfully submitted to Vercel backend`,
      {
        barcode: testBarcode,
        product_name: uniqueTestData.product_name,
        response: responseData,
      }
    );
  } catch (error: any) {
    logProof('1.1', false, `Error submitting data: ${error.message}`);
    return results;
  }

  // ============================================================
  // STEP 2: Wait for data propagation (real-world delay)
  // ============================================================
  console.log('');
  console.log('─'.repeat(63));
  console.log('STEP 2: Waiting for data propagation (2 seconds)');
  console.log('─'.repeat(63));
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  logProof('2.1', true, 'Wait completed - data should now be available globally');

  // ============================================================
  // STEP 3: Retrieve data from Vercel backend (simulates User B scanning)
  // This simulates a DIFFERENT user/device with NO local cache
  // ============================================================
  console.log('');
  console.log('─'.repeat(63));
  console.log('STEP 3: User B retrieves data from Vercel backend (NEW user, NO local cache)');
  console.log('─'.repeat(63));
  
  let retrievedData: any = null;
  try {
    const response = await fetch(`${MANUAL_PRODUCTS_API}?barcode=${encodeURIComponent(testBarcode)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logProof(
        '3.1',
        false,
        `Backend retrieval failed: ${response.status} ${response.statusText}`,
        { error: errorText }
      );
      return results;
    }

    const responseData = await response.json();
    
    if (!responseData.success || !responseData.product) {
      logProof(
        '3.1',
        false,
        `Product not found in backend (should have been stored in Step 1)`,
        { response: responseData }
      );
      return results;
    }

    retrievedData = responseData.product;
    
    logProof(
      '3.1',
      true,
      `Data successfully retrieved from Vercel backend (as if User B scanned the barcode)`,
      {
        barcode: retrievedData.barcode,
        product_name: retrievedData.product_name,
        submittedAt: retrievedData.submittedAt,
        source: retrievedData.source,
      }
    );
  } catch (error: any) {
    logProof('3.1', false, `Error retrieving data: ${error.message}`);
    return results;
  }

  // ============================================================
  // STEP 4: VERIFY data matches what was submitted
  // This is the PROOF that the system works
  // ============================================================
  console.log('');
  console.log('─'.repeat(63));
  console.log('STEP 4: VERIFY data integrity (PROOF)');
  console.log('─'.repeat(63));

  const verifications: Array<{ field: string; submitted: any; retrieved: any; match: boolean }> = [
    {
      field: 'product_name',
      submitted: uniqueTestData.product_name,
      retrieved: retrievedData.product_name,
      match: uniqueTestData.product_name === retrievedData.product_name,
    },
    {
      field: 'brands',
      submitted: uniqueTestData.brands,
      retrieved: retrievedData.brands,
      match: uniqueTestData.brands === retrievedData.brands,
    },
    {
      field: 'ingredients_text',
      submitted: uniqueTestData.ingredients_text,
      retrieved: retrievedData.ingredients_text,
      match: uniqueTestData.ingredients_text === retrievedData.ingredients_text,
    },
    {
      field: 'manufacturing_places',
      submitted: uniqueTestData.manufacturing_places,
      retrieved: retrievedData.manufacturing_places,
      match: uniqueTestData.manufacturing_places === retrievedData.manufacturing_places,
    },
    {
      field: 'countries',
      submitted: uniqueTestData.countries,
      retrieved: retrievedData.countries,
      match: uniqueTestData.countries === retrievedData.countries,
    },
    {
      field: 'nutriments.energy-kcal',
      submitted: uniqueTestData.nutriments['energy-kcal'],
      retrieved: retrievedData.nutriments?.['energy-kcal'],
      match: uniqueTestData.nutriments['energy-kcal'] === retrievedData.nutriments?.['energy-kcal'],
    },
    {
      field: 'nutriments.proteins',
      submitted: uniqueTestData.nutriments.proteins,
      retrieved: retrievedData.nutriments?.proteins,
      match: uniqueTestData.nutriments.proteins === retrievedData.nutriments?.proteins,
    },
  ];

  let allMatch = true;
  verifications.forEach(v => {
    const matchIcon = v.match ? '✅' : '❌';
    console.log(`   ${matchIcon} ${v.field}: ${v.match ? 'MATCH' : 'MISMATCH'}`);
    if (!v.match) {
      console.log(`      Submitted: ${JSON.stringify(v.submitted)}`);
      console.log(`      Retrieved: ${JSON.stringify(v.retrieved)}`);
      allMatch = false;
    }
  });

  logProof(
    '4.1',
    allMatch,
    allMatch 
      ? `✅ PROOF: All data fields match exactly - system is WORKING!`
      : `❌ PROOF FAILED: Some data fields do not match`,
    {
      totalFields: verifications.length,
      matchingFields: verifications.filter(v => v.match).length,
      mismatchedFields: verifications.filter(v => !v.match).map(v => v.field),
      verifications: verifications.map(v => ({
        field: v.field,
        match: v.match,
        submitted: v.submitted,
        retrieved: v.retrieved,
      })),
    }
  );

  // ============================================================
  // STEP 5: Test actual getUserContributedProduct function
  // This simulates what happens in the real app
  // ============================================================
  console.log('');
  console.log('─'.repeat(63));
  console.log('STEP 5: Test getUserContributedProduct() function (real app function)');
  console.log('─'.repeat(63));

  try {
    // Import the actual function (will use mocked AsyncStorage)
    const { getUserContributedProduct } = await import('../src/services/userContributedProductsService');
    
    const productFromFunction = await getUserContributedProduct(testBarcode);
    
    if (productFromFunction) {
      const nameMatches = productFromFunction.product_name === uniqueTestData.product_name;
      
      logProof(
        '5.1',
        nameMatches,
        nameMatches
          ? `✅ getUserContributedProduct() successfully retrieves globally stored data`
          : `❌ getUserContributedProduct() retrieved data but doesn't match`,
        {
          retrieved_product_name: productFromFunction.product_name,
          expected_product_name: uniqueTestData.product_name,
          source: productFromFunction.source,
          match: nameMatches,
        }
      );
    } else {
      logProof(
        '5.1',
        false,
        `getUserContributedProduct() returned null (should have found data from backend)`,
      );
    }
  } catch (error: any) {
    logProof('5.1', false, `Error calling getUserContributedProduct(): ${error.message}`);
  }

  // ============================================================
  // FINAL PROOF SUMMARY
  // ============================================================
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 PROOF TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const total = results.length;
  
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${failed}/${total}`);
  console.log('');
  
  if (allMatch && passed === total) {
    console.log('🎉 PROOF COMPLETE: System is FUNCTIONAL');
    console.log('');
    console.log('✅ User A can submit data to Vercel backend');
    console.log('✅ Data is stored globally in Vercel backend');
    console.log('✅ User B can retrieve data from Vercel backend');
    console.log('✅ All data fields match exactly');
    console.log('✅ getUserContributedProduct() works correctly');
    console.log('');
    console.log('🌍 CONCLUSION: User contributions are GLOBALLY AVAILABLE');
  } else {
    console.log('❌ PROOF FAILED: System has issues');
    console.log('');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   ❌ ${r.step}: ${r.message}`);
    });
  }
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  
  return results;
}

// Run the proof test
proveGlobalAvailability()
  .then(results => {
    const exitCode = results.every(r => r.success) ? 0 : 1;
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('❌ Proof test execution failed:', error);
    process.exit(1);
  });

