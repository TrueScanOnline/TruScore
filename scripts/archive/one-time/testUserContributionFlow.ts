/**
 * User Contribution Flow Test
 * 
 * Tests the complete end-to-end flow:
 * 1. User scans a barcode (partial data returned)
 * 2. User enters additional data (photo, ingredients, packaging, country of origin)
 * 3. Data is stored (local SQLite, AsyncStorage, Vercel backend, Open Food Facts)
 * 4. Data is immediately retrievable for subsequent users scanning the same barcode
 * 
 * Usage: npx ts-node scripts/testUserContributionFlow.ts [barcode]
 */

/// <reference path="../global.d.ts" />

// Initialize Expo/React Native globals BEFORE anything else
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
        (global as any).ErrorUtils.reportFatalError(e);
        throw e;
      }
    },
    applyWithGuardIfNeeded: (fn: any, context: any, args: any[]) => {
      return (global as any).ErrorUtils.applyWithGuard(fn, context, args);
    },
    inGuard: () => false,
    guard: (fn: any) => {
      return (global as any).ErrorUtils.applyWithGuard(fn, null, []);
    },
  };
}

if (typeof globalThis !== 'undefined' && !globalThis.expo) {
  class MockNativeModule {
    addListener() { return { remove: () => {} } as any; }
    removeListener() { return this; }
    removeAllListeners() { return this; }
    emit() { return false; }
    listenerCount() { return 0; }
  }
  globalThis.expo = {
    NativeModule: MockNativeModule as any,
    ExpoModulesCore: {},
  };
}

// Mock modules
const Module = require('module');
const originalRequireModule = Module._load;

Module._load = function(request: string, parent: any) {
  if (request === 'expo-modules-core' || request.includes('expo-modules-core')) {
    if (typeof globalThis !== 'undefined' && !globalThis.expo) {
      const MockNativeModule = class {};
      globalThis.expo = {
        NativeModule: MockNativeModule,
        ExpoModulesCore: {},
      } as any;
    }
    const MockNativeModule = class {};
    const mockExpoModulesCore = {
      NativeModule: MockNativeModule,
      default: MockNativeModule,
      requireNativeModule: () => ({}),
      requireOptionalNativeModule: () => ({}),
      Platform: {
        OS: 'node',
        select: (obj: any) => obj.node || obj.default || null,
      },
    };
    return mockExpoModulesCore;
  }
  if (request === 'expo-localization') {
    return {
      getLocales: () => [{ regionCode: 'US', languageTag: 'en-US' }],
      getCalendars: () => [],
    };
  }
  if (request === 'expo-file-system') {
    return {
      cacheDirectory: '/tmp/truescan/',
      documentDirectory: '/tmp/truescan/',
      makeDirectoryAsync: async () => {},
      readAsStringAsync: async () => '',
      writeAsStringAsync: async () => {},
      deleteAsync: async () => {},
      getInfoAsync: async () => ({ exists: false }),
      downloadAsync: async () => ({ uri: '', status: 200, headers: {} }),
    };
  }
  if (request === 'react-native') {
    return {
      Platform: { OS: 'node', select: (obj: any) => obj.node || obj.default || null },
      Dimensions: { get: () => ({ width: 800, height: 600 }) },
      StyleSheet: {
        create: (styles: any) => styles,
        flatten: (style: any) => style,
        compose: (...styles: any[]) => ({}),
        absoluteFill: {},
        absoluteFillObject: {},
        hairlineWidth: 1,
      },
      View: () => null,
      Text: () => null,
      Image: () => null,
      ScrollView: () => null,
      TouchableOpacity: () => null,
      ActivityIndicator: () => null,
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
  if (request === 'react-native-qonversion') {
    return {
      default: {
        checkEntitlements: async () => ({}),
        products: async () => [],
        purchase: async () => ({}),
        restore: async () => {},
      },
    };
  }
  if (request === 'expo-constants') {
    return {
      default: {
        appOwnership: null,
        expoVersion: '49.0.0',
        installationId: 'test-installation-id',
        sessionId: 'test-session-id',
        platform: { ios: {}, android: {} },
        manifest: {},
        nativeAppVersion: null,
        nativeBuildVersion: null,
        systemVersion: null,
      },
    };
  }
  if (request === 'expo-linking') {
    return {
      createURL: () => '',
      parse: () => ({}),
      makeUrl: () => '',
      canOpenURL: async () => false,
      openURL: async () => {},
      openSettings: async () => {},
      getInitialURL: async () => null,
    };
  }
  if (request === 'expo' || request.startsWith('expo/')) {
    return {
      registerRootComponent: () => {},
      requireNativeModule: () => ({}),
      requireOptionalNativeModule: () => ({}),
      Updates: {
        checkForUpdateAsync: async () => ({ isAvailable: false }),
        fetchUpdateAsync: async () => {},
        reloadAsync: async () => {},
      },
    };
  }
  if (request === 'expo-sqlite') {
    const mockDatabase = {
      transaction: async (callback: any) => {},
      executeSql: async () => ({ rows: { _array: [], length: 0 }, insertId: null, rowsAffected: 0 }),
      close: async () => {},
      closeSync: () => {},
      getAllSync: () => [],
      runSync: () => ({ lastInsertRowId: 0, changes: 0 }),
      execSync: () => {},
      withTransactionAsync: async (fn: any) => await fn(),
      withExclusiveTransactionAsync: async (fn: any) => await fn(),
    };
    return {
      default: {
        openDatabase: () => mockDatabase,
        openDatabaseAsync: async () => mockDatabase,
      },
    };
  }
  return originalRequireModule.apply(this, arguments);
};

import { fetchProduct } from '../src/services/productService';
import { saveManualProduct, getManualProduct, ManualProductData } from '../src/services/manualProductService';
import { getUserContributedProduct } from '../src/services/userContributedProductsService';
import { getBackendUrl, BackendEndpoints } from '../src/config/backendConfig';
import { logger } from '../src/utils/logger';

const BACKEND_URL = getBackendUrl();
const MANUAL_PRODUCTS_API = BackendEndpoints.manualProducts(BACKEND_URL);

interface TestResult {
  step: string;
  success: boolean;
  message: string;
  data?: any;
  timestamp: number;
}

async function testUserContributionFlow(barcode: string): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  const logResult = (step: string, success: boolean, message: string, data?: any) => {
    results.push({
      step,
      success,
      message,
      data,
      timestamp: Date.now(),
    });
    const icon = success ? '✅' : '❌';
    console.log(`${icon} [${step}] ${message}`);
    if (data) {
      console.log(`   Data:`, JSON.stringify(data, null, 2));
    }
  };

  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 USER CONTRIBUTION FLOW TEST');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📦 Barcode: ${barcode}`);
  console.log(`🌐 Backend URL: ${BACKEND_URL}`);
  console.log(`🔗 API Endpoint: ${MANUAL_PRODUCTS_API}`);
  console.log('');

  // STEP 1: Initial scan - get partial product data
  console.log('─'.repeat(63));
  console.log('STEP 1: Initial Barcode Scan (Partial Data)');
  console.log('─'.repeat(63));
  
  let initialProduct = null;
  try {
    const startTime = Date.now();
    initialProduct = await fetchProduct(barcode, true, false, false);
    const fetchTime = Date.now() - startTime;
    
    if (initialProduct) {
      logResult(
        '1.1',
        true,
        `Product fetched successfully in ${fetchTime}ms`,
        {
          product_name: initialProduct.product_name,
          source: initialProduct.source,
          hasImage: !!initialProduct.image_url,
          hasIngredients: !!initialProduct.ingredients_text,
          hasNutrition: !!(initialProduct.nutriments && Object.keys(initialProduct.nutriments).length > 0),
          hasOrigin: !!(initialProduct.manufacturing_places || initialProduct.countries),
          hasPackaging: !!(initialProduct.packaging_data || initialProduct.packaging),
        }
      );
    } else {
      logResult('1.1', false, 'No product found in initial scan (this is OK - we can add data)');
    }
  } catch (error: any) {
    logResult('1.1', false, `Error fetching initial product: ${error.message}`);
  }

  // STEP 2: User enters additional data
  console.log('');
  console.log('─'.repeat(63));
  console.log('STEP 2: User Enters Additional Data');
  console.log('─'.repeat(63));
  
  const userData: ManualProductData = {
    barcode,
    product_name: initialProduct?.product_name || `Test Product ${barcode}`,
    brands: 'Test Brand',
    ingredients_text: 'Water, Sugar, Citric Acid, Natural Flavors, Sodium Benzoate',
    image_url: 'https://example.com/test-image.jpg',
    nutriments: {
      'energy-kcal': 100,
      'energy-kj': 418,
      proteins: 0.5,
      fat: 0,
      carbohydrates: 24,
      sugars: 24,
      sodium: 10,
    },
    serving_size: '250ml',
    quantity: '500ml',
    manufacturing_places: 'United States',
    countries: 'United States',
    categories: 'Beverages, Soft Drinks',
    allergens_tags: ['en:gluten'],
    additives_tags: ['en:e211'],
    packaging_data: {
      items: [
        {
          material: 'en:plastic',
          shape: 'en:bottle',
          recycling: 'en:recyclable',
        },
      ],
    },
    timestamp: Date.now(),
  };

  try {
    const saveResult = await saveManualProduct(userData);
    logResult(
      '2.1',
      saveResult,
      saveResult ? 'User data saved successfully (local)' : 'Failed to save user data',
      {
        barcode: userData.barcode,
        product_name: userData.product_name,
        hasImage: !!userData.image_url,
        hasIngredients: !!userData.ingredients_text,
        hasNutrition: !!(userData.nutriments && Object.keys(userData.nutriments).length > 0),
        hasPackaging: !!userData.packaging_data,
      }
    );
  } catch (error: any) {
    logResult('2.1', false, `Error saving user data: ${error.message}`);
  }

  // STEP 3: Verify local storage
  console.log('');
  console.log('─'.repeat(63));
  console.log('STEP 3: Verify Local Storage (SQLite/AsyncStorage)');
  console.log('─'.repeat(63));
  
  try {
    const localProduct = await getManualProduct(barcode);
    if (localProduct) {
      logResult(
        '3.1',
        true,
        'User data retrieved from local storage',
        {
          product_name: localProduct.product_name,
          hasIngredients: !!localProduct.ingredients_text,
          hasNutrition: !!(localProduct.nutriments && Object.keys(localProduct.nutriments).length > 0),
        }
      );
    } else {
      logResult('3.1', false, 'User data NOT found in local storage');
    }
  } catch (error: any) {
    logResult('3.1', false, `Error retrieving local data: ${error.message}`);
  }

  // STEP 4: Verify Vercel backend storage
  console.log('');
  console.log('─'.repeat(63));
  console.log('STEP 4: Verify Vercel Backend Storage');
  console.log('─'.repeat(63));
  
  try {
    const response = await fetch(`${MANUAL_PRODUCTS_API}?barcode=${encodeURIComponent(barcode)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.product) {
        logResult(
          '4.1',
          true,
          'User data retrieved from Vercel backend',
          {
            product_name: data.product.product_name,
            submittedAt: data.product.submittedAt,
            hasIngredients: !!data.product.ingredients_text,
            hasNutrition: !!(data.product.nutriments && Object.keys(data.product.nutriments).length > 0),
          }
        );
      } else {
        logResult('4.1', false, 'User data NOT found in Vercel backend', data);
      }
    } else {
      logResult('4.1', false, `Backend API error: ${response.status} ${response.statusText}`);
    }
  } catch (error: any) {
    logResult('4.1', false, `Error checking Vercel backend: ${error.message}`);
  }

  // STEP 5: Verify getUserContributedProduct retrieval
  console.log('');
  console.log('─'.repeat(63));
  console.log('STEP 5: Verify getUserContributedProduct Retrieval');
  console.log('─'.repeat(63));
  
  try {
    const contributedProduct = await getUserContributedProduct(barcode);
    if (contributedProduct) {
      logResult(
        '5.1',
        true,
        'User-contributed product retrieved via getUserContributedProduct()',
        {
          product_name: contributedProduct.product_name,
          source: contributedProduct.source,
          hasIngredients: !!contributedProduct.ingredients_text,
          hasNutrition: !!(contributedProduct.nutriments && Object.keys(contributedProduct.nutriments).length > 0),
        }
      );
    } else {
      logResult('5.1', false, 'User-contributed product NOT found via getUserContributedProduct()');
    }
  } catch (error: any) {
    logResult('5.1', false, `Error retrieving contributed product: ${error.message}`);
  }

  // STEP 6: Verify mergeUserContributedData in subsequent scan
  console.log('');
  console.log('─'.repeat(63));
  console.log('STEP 6: Verify Data Merging in Subsequent Scan');
  console.log('─'.repeat(63));
  
  try {
    // Wait a bit to ensure data is available
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const subsequentProduct = await fetchProduct(barcode, true, false, false);
    if (subsequentProduct) {
      const hasUserData = subsequentProduct.ingredients_text?.includes('Sugar') ||
                         subsequentProduct.brands === 'Test Brand' ||
                         subsequentProduct.manufacturing_places === 'United States';
      
      logResult(
        '6.1',
        hasUserData,
        hasUserData ? 'User-contributed data merged in subsequent scan' : 'User-contributed data NOT merged in subsequent scan',
        {
          product_name: subsequentProduct.product_name,
          source: subsequentProduct.source,
          hasIngredients: !!subsequentProduct.ingredients_text,
          ingredients_match: subsequentProduct.ingredients_text?.includes('Sugar') || false,
          brands_match: subsequentProduct.brands === 'Test Brand',
          origin_match: subsequentProduct.manufacturing_places === 'United States',
        }
      );
    } else {
      logResult('6.1', false, 'Subsequent scan returned no product');
    }
  } catch (error: any) {
    logResult('6.1', false, `Error in subsequent scan: ${error.message}`);
  }

  // Summary
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const total = results.length;
  
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${failed}/${total}`);
  console.log('');
  
  if (failed > 0) {
    console.log('❌ Failed Steps:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.step}: ${r.message}`);
    });
  }
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  
  return results;
}

// Main execution
const barcode = process.argv[2] || '9300633910198'; // Default test barcode

testUserContributionFlow(barcode)
  .then(results => {
    const exitCode = results.every(r => r.success) ? 0 : 1;
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });


