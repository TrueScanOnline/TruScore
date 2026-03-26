/// <reference path="../global.d.ts" />

// Initialize Expo/React Native globals BEFORE anything else
// MUST be done before any imports that use them
if (typeof (global as any).__DEV__ === 'undefined') {
  (global as any).__DEV__ = process.env.NODE_ENV !== 'production';
}

// Set Expo environment variables
if (!process.env.EXPO_OS) {
  process.env.EXPO_OS = 'node';
}

// Initialize React Native globals (required by Expo)
// ErrorUtils is a React Native global used by Expo
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

// Initialize globalThis.expo for Expo modules
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

// Mock Expo/React Native modules before importing anything that uses them
// This is ONLY for Node.js test environment - does NOT affect Android/iOS builds
const Module = require('module');
const originalRequireModule = Module._load;

Module._load = function(request: string, parent: any) {
  // CRITICAL: Mock expo-modules-core FIRST (before anything else that might import it)
  if (request === 'expo-modules-core' || request.includes('expo-modules-core')) {
    // Ensure globalThis.expo exists before returning the mock
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
        select: (obj: any) => {
          // Platform.select - returns the value for the current platform or default
          return obj.node || obj.default || obj.native || obj.web || null;
        },
      },
      // Add all common expo-modules-core exports
      EventEmitter: class EventEmitter {
        addListener() { return this; }
        removeListener() { return this; }
        emit() { return false; }
      },
      SyntheticPlatformEmitter: {
        addListener: () => ({}),
        removeListener: () => {},
        emit: () => {},
      },
    };
    return mockExpoModulesCore;
  }
  
  // Mock expo-linking (uses expo-modules-core)
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
  
  // Mock expo package itself (prevents loading Expo components)
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
  
  // Mock expo-sqlite (uses expo requireNativeModule)
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
  
  // Mock expo-constants (uses expo-modules-core)
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
  
  // Mock expo-localization
  if (request === 'expo-localization') {
    const testRegion = (process.env.TEST_REGION || 'US').toUpperCase();
    const langTag = `en-${testRegion}`;
    return {
      getLocales: () => [{ regionCode: testRegion, languageTag: langTag }],
      getCalendars: () => [],
    };
  }
  // Mock expo-file-system
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
  // Mock react-native (only for Node.js environment)
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
  // Mock @react-native-async-storage/async-storage
  if (request === '@react-native-async-storage/async-storage') {
    const AsyncStorage = {
      getItem: async () => null,
      setItem: async () => {},
      removeItem: async () => {},
      clear: async () => {},
      getAllKeys: async () => [],
      multiGet: async () => [],
      multiSet: async () => {},
      multiRemove: async () => {},
    };
    return AsyncStorage;
  }
  // Mock react-native-qonversion
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
  return originalRequireModule.apply(this, arguments);
};

/**
 * TrueScan Barcode Performance Test Script
 * 
 * Tests barcode lookup performance and generates detailed logs showing:
 * - Performance metrics (fetch time, TruScore calculation time)
 * - Data sources for all product information
 * - Detailed breakdown of each of the 4 TruScore pillars
 * - Source attribution for ingredients, nutrition, allergens, etc.
 * 
 * Usage (from PowerShell):
 *   .\scripts\testBarcodePerformance.ps1 -Barcodes "9300633910198","0726684754229"
 * 
 * Or directly with npm:
 *   npm run test:barcode-performance -- 9300633910198 0726684754229
 */

import { fetchProduct } from '../src/services/productService';
import { fetchProductOptimized } from '../src/services/productServiceOptimized';
import { calculateTruScore } from '../src/lib/truscoreEngine';
import { Product, ProductWithTrustScore } from '../src/types/product';
import { logger } from '../src/utils/logger';

interface TestResult {
  barcode: string;
  timestamp: string;
  performance: {
    fetchTime: number;
    fetchTimeFormatted: string;
    truScoreTime: number;
    truScoreTimeFormatted: string;
    totalTime: number;
    totalTimeFormatted: string;
  };
  product: {
    barcode: string;
    product_name: string;
    source: string;
    quality: number;
    completion: number;
    hasNutrition: boolean;
    hasIngredients: boolean;
    hasImage: boolean;
    hasAllergens: boolean;
    hasAdditives: boolean;
    hasOrigin: boolean;
    hasCertifications: boolean;
  } | null;
  truScore: {
    overall: number;
    breakdown: {
      Body: number;
      Planet: number;
      Ethics: number;
      Open: number;
    };
    hasNutriScore: boolean;
    hasEcoScore: boolean;
    hasOrigin: boolean;
    insights: string[];
  } | null;
  dataSources: {
    primarySource: string | null;
    allSources: string[]; // All databases that contributed data
    databasesQueried: string[]; // All databases that were queried
    nutrition: {
      source: string | null;
      sources: string[]; // All sources that provided nutrition data
      fieldsCount: number;
      hasEnergy: boolean;
      hasMacros: boolean;
    };
    ingredients: {
      source: string | null;
      sources: string[]; // All sources that provided ingredients
      length: number;
      hasHiddenTerms: boolean;
    };
    allergensAdditives: {
      allergensSource: string | null;
      allergensSources: string[]; // All sources that provided allergens
      allergensCount: number;
      additivesSource: string | null;
      additivesSources: string[]; // All sources that provided additives
      additivesCount: number;
      allergensTags: string[];
      additivesTags: string[];
    };
    countryOfOrigin: {
      source: string | null;
      sources: string[]; // All sources that provided origin data
      origins: string[];
      originsTags: string[];
      manufacturingPlaces: string[];
      manufacturingPlacesTags: string[];
    };
    scoreHighlights: {
      source: string;
      insights: string[];
      insightsCount: number;
    };
  };
  pillarBreakdown: {
    body: {
      score: number;
      base: number;
      adjustments: Array<{
        description: string;
        value: number;
        type: 'positive' | 'negative' | 'neutral';
      }>;
      details: any;
      dataSources: {
        nutrition: string | null;
        nutriScore: string | null;
        additives: string | null;
        nova: string | null;
      };
    };
    planet: {
      score: number;
      base: number;
      adjustments: Array<{
        description: string;
        value: number;
        type: 'positive' | 'negative' | 'neutral';
      }>;
      details: any;
      dataSources: {
        ecoscore: string | null;
        palmOil: string | null;
        packaging: string | null;
      };
    };
    ethics: {
      score: number;
      base: number;
      adjustments: Array<{
        description: string;
        value: number;
        type: 'positive' | 'negative' | 'neutral';
      }>;
      details: any;
      dataSources: {
        certifications: string | null;
        recalls: string | null;
        brandData: string | null;
      };
    };
    open: {
      score: number;
      base: number;
      adjustments: Array<{
        description: string;
        value: number;
        type: 'positive' | 'negative' | 'neutral';
      }>;
      details: any;
      dataSources: {
        ingredients: string | null;
        origin: string | null;
        brandOwner: string | null;
      };
    };
  } | null;
  errors: Array<{
    message: string;
    stack?: string;
  }>;
}

async function testBarcode(barcode: string): Promise<TestResult> {
  const startTime = Date.now();
  const results: TestResult = {
    barcode: barcode,
    timestamp: new Date().toISOString(),
    performance: {
      fetchTime: 0,
      fetchTimeFormatted: '',
      truScoreTime: 0,
      truScoreTimeFormatted: '',
      totalTime: 0,
      totalTimeFormatted: '',
    },
    product: null,
    truScore: null,
    dataSources: {
      primarySource: null,
      allSources: [],
      databasesQueried: [],
      nutrition: {
        source: null,
        sources: [],
        fieldsCount: 0,
        hasEnergy: false,
        hasMacros: false,
      },
      ingredients: {
        source: null,
        sources: [],
        length: 0,
        hasHiddenTerms: false,
      },
      allergensAdditives: {
        allergensSource: null,
        allergensSources: [],
        allergensCount: 0,
        additivesSource: null,
        additivesSources: [],
        additivesCount: 0,
        allergensTags: [],
        additivesTags: [],
      },
      countryOfOrigin: {
        source: null,
        sources: [],
        origins: [],
        originsTags: [],
        manufacturingPlaces: [],
        manufacturingPlacesTags: [],
      },
      scoreHighlights: {
        source: 'truScore_engine',
        insights: [],
        insightsCount: 0,
      },
    },
    pillarBreakdown: null,
    errors: [],
  };

  try {
    // Test product fetch performance
    const fetchStart = Date.now();
    console.log(`[TEST] Testing barcode: ${barcode}`);
    
    // Use regular fetchProduct for better database tracking
    // fetchProductOptimized is faster but doesn't track all databases as well
    const product = await fetchProduct(
      barcode,
      true, // useCache
      false, // isPremium
      false  // isOffline
    );
    
    const fetchTime = Date.now() - fetchStart;
    results.performance.fetchTime = fetchTime;
    results.performance.fetchTimeFormatted = `${fetchTime}ms`;
    
    if (!product) {
      results.errors.push({ message: 'Product not found' });
      return results;
    }
    
    results.product = {
      barcode: product.barcode,
      product_name: product.product_name || 'Unknown',
      source: product.source || 'unknown',
      quality: product.quality || 0,
      completion: product.completion || 0,
      hasNutrition: !!(product.nutriments && Object.keys(product.nutriments).length > 0),
      hasIngredients: !!(product.ingredients_text && product.ingredients_text.length > 0),
      hasImage: !!(product.image_url),
      hasAllergens: !!(product.allergens && product.allergens.length > 0),
      hasAdditives: !!(product.additives && product.additives.length > 0),
      hasOrigin: !!(product.origins && product.origins.length > 0),
      hasCertifications: !!(product.labels_tags && product.labels_tags.length > 0),
    };
    
    // Extract all sources from product.source (can be comma-separated or +-separated)
    const primarySource = product.source || null;
    const allSources = primarySource 
      ? primarySource.split(/[+,]/).map(s => s.trim()).filter(Boolean)
      : [];
    
    results.dataSources.primarySource = primarySource;
    results.dataSources.allSources = allSources;
    results.dataSources.databasesQueried = allSources; // In a full implementation, this would track all queried DBs
    
    // Nutrition data source - check which sources typically provide nutrition
    const nutritionSources: string[] = [];
    if (product.nutriments && Object.keys(product.nutriments).length > 0) {
      // Open Food Facts, USDA, Health Canada, UK FSA, EFSA, FSANZ provide nutrition
      if (allSources.some(s => ['openfoodfacts', 'usda', 'healthcanada', 'ukfsa', 'efsa', 'nzfcd', 'afcd', 'fsanz'].includes(s.toLowerCase()))) {
        nutritionSources.push(...allSources.filter(s => ['openfoodfacts', 'usda', 'healthcanada', 'ukfsa', 'efsa', 'nzfcd', 'afcd', 'fsanz'].includes(s.toLowerCase())));
      } else {
        nutritionSources.push(allSources[0] || 'unknown');
      }
    }
    
    results.dataSources.nutrition = {
      source: nutritionSources[0] || null,
      sources: nutritionSources,
      fieldsCount: product.nutriments ? Object.keys(product.nutriments).length : 0,
      hasEnergy: !!(product.nutriments && (product.nutriments['energy-kcal_100g'] || product.nutriments['energy-kcal'] || product.nutriments['energy-kj_100g'])),
      hasMacros: !!(product.nutriments && (
        product.nutriments.proteins_100g || product.nutriments.proteins ||
        product.nutriments.carbohydrates_100g || product.nutriments.carbohydrates || 
        product.nutriments.fat_100g || product.nutriments.fat
      )),
    };
    
    // Ingredients data source
    const ingredientsSources: string[] = [];
    if (product.ingredients_text && product.ingredients_text.length > 0) {
      // Most sources can provide ingredients, but OFF is primary
      if (allSources.some(s => ['openfoodfacts', 'openbeautyfacts', 'web_search'].includes(s.toLowerCase()))) {
        ingredientsSources.push(...allSources.filter(s => ['openfoodfacts', 'openbeautyfacts', 'web_search'].includes(s.toLowerCase())));
      } else {
        ingredientsSources.push(allSources[0] || 'unknown');
      }
    }
    
    results.dataSources.ingredients = {
      source: ingredientsSources[0] || null,
      sources: ingredientsSources,
      length: product.ingredients_text ? product.ingredients_text.length : 0,
      hasHiddenTerms: product.ingredients_text ? (
        /parfum|fragrance|aroma|flavor|flavour|proprietary blend|secret formula|essence|spice|extract/i.test(product.ingredients_text)
      ) : false,
    };
    
    // Allergens & Additives data source
    const allergensSources: string[] = [];
    const additivesSources: string[] = [];
    
    if (product.allergens || (product.allergens_tags && product.allergens_tags.length > 0)) {
      // Open Food Facts, Open Beauty Facts, government databases provide allergen info
      if (allSources.some(s => ['openfoodfacts', 'openbeautyfacts', 'usda', 'healthcanada', 'ukfsa', 'efsa'].includes(s.toLowerCase()))) {
        allergensSources.push(...allSources.filter(s => ['openfoodfacts', 'openbeautyfacts', 'usda', 'healthcanada', 'ukfsa', 'efsa'].includes(s.toLowerCase())));
      } else {
        allergensSources.push(allSources[0] || 'unknown');
      }
    }
    
    if (product.additives || (product.additives_tags && product.additives_tags.length > 0)) {
      // Open Food Facts is primary for additives
      if (allSources.some(s => ['openfoodfacts', 'openbeautyfacts'].includes(s.toLowerCase()))) {
        additivesSources.push(...allSources.filter(s => ['openfoodfacts', 'openbeautyfacts'].includes(s.toLowerCase())));
      } else {
        additivesSources.push(allSources[0] || 'unknown');
      }
    }
    
    results.dataSources.allergensAdditives = {
      allergensSource: allergensSources[0] || null,
      allergensSources: allergensSources,
      allergensCount: product.allergens_tags ? product.allergens_tags.length : (product.allergens ? 1 : 0),
      additivesSource: additivesSources[0] || null,
      additivesSources: additivesSources,
      additivesCount: product.additives_tags ? product.additives_tags.length : (product.additives ? product.additives.length : 0),
      allergensTags: product.allergens_tags || [],
      additivesTags: product.additives_tags || [],
    };
    
    // Country of origin data source
    const originSources: string[] = [];
    const hasOrigin = !!(product.origins || (product.origins_tags && product.origins_tags.length > 0) ||
                        product.manufacturing_places || (product.manufacturing_places_tags && product.manufacturing_places_tags.length > 0));
    
    if (hasOrigin) {
      // Open Food Facts, user contributions, web search can provide origin
      if (allSources.some(s => ['openfoodfacts', 'openbeautyfacts', 'web_search', 'user_contributed'].includes(s.toLowerCase()))) {
        originSources.push(...allSources.filter(s => ['openfoodfacts', 'openbeautyfacts', 'web_search', 'user_contributed'].includes(s.toLowerCase())));
      } else {
        originSources.push(allSources[0] || 'unknown');
      }
    }
    
    results.dataSources.countryOfOrigin = {
      source: originSources[0] || null,
      sources: originSources,
      origins: typeof product.origins === 'string' ? [product.origins] : (product.origins || []),
      originsTags: product.origins_tags || [],
      manufacturingPlaces: typeof product.manufacturing_places === 'string' ? [product.manufacturing_places] : (product.manufacturing_places || []),
      manufacturingPlacesTags: product.manufacturing_places_tags || [],
    };
    
    // Test TruScore calculation performance
    const truScoreStart = Date.now();
    const truScoreResult = calculateTruScore(product);
    const truScoreTime = Date.now() - truScoreStart;
    
    results.performance.truScoreTime = truScoreTime;
    results.performance.truScoreTimeFormatted = `${truScoreTime}ms`;
    results.performance.totalTime = fetchTime + truScoreTime;
    results.performance.totalTimeFormatted = `${fetchTime + truScoreTime}ms`;
    
    // TruScore results
    // Convert Insight[] to string[] by extracting the reason property
    const insightsAsStrings = truScoreResult.insights 
      ? truScoreResult.insights.map(insight => insight.reason || String(insight))
      : [];
    
    results.truScore = {
      overall: truScoreResult.truscore,
      breakdown: truScoreResult.breakdown,
      hasNutriScore: truScoreResult.hasNutriScore || false,
      hasEcoScore: truScoreResult.hasEcoScore || false,
      hasOrigin: truScoreResult.hasOrigin || false,
      insights: insightsAsStrings,
    };
    
    // Detailed pillar breakdown
    if (truScoreResult.pillarDetails) {
      results.pillarBreakdown = {
        body: {
          score: truScoreResult.pillarDetails.body.score,
          base: truScoreResult.pillarDetails.body.base,
          adjustments: truScoreResult.pillarDetails.body.adjustments || [],
          details: truScoreResult.pillarDetails.body.details || {},
          dataSources: {
            nutrition: product.nutriments ? (product.source || null) : null,
            nutriScore: product.nutriscore_grade ? (product.source || null) : null,
            additives: product.additives ? (product.source || null) : null,
            nova: product.nova_group ? (product.source || null) : null,
          },
        },
        planet: {
          score: truScoreResult.pillarDetails.planet.score,
          base: truScoreResult.pillarDetails.planet.base,
          adjustments: truScoreResult.pillarDetails.planet.adjustments || [],
          details: truScoreResult.pillarDetails.planet.details || {},
          dataSources: {
            ecoscore: product.ecoscore_grade ? (product.source || null) : null,
            palmOil: product.ingredients_text ? (product.source || null) : null,
            packaging: product.packaging_data ? (product.source || null) : null,
          },
        },
        ethics: {
          score: truScoreResult.pillarDetails.ethics.score,
          base: truScoreResult.pillarDetails.ethics.base,
          adjustments: truScoreResult.pillarDetails.ethics.adjustments || [],
          details: truScoreResult.pillarDetails.ethics.details || {},
          dataSources: {
            certifications: product.labels_tags ? (product.source || null) : null,
            recalls: product.recalls ? (product.source || null) : null,
            brandData: product.brands ? 'internal_brand_database' : null,
          },
        },
        open: {
          score: truScoreResult.pillarDetails.open.score,
          base: truScoreResult.pillarDetails.open.base,
          adjustments: truScoreResult.pillarDetails.open.adjustments || [],
          details: truScoreResult.pillarDetails.open.details || {},
          dataSources: {
            ingredients: product.ingredients_text ? (product.source || null) : null,
            origin: product.origins ? (product.source || null) : null,
            brandOwner: product.brand_owner ? (product.source || null) : null,
          },
        },
      };
    }
    
    // Score highlights (insights)
    // Convert Insight[] to string[] by extracting the reason property
    const insightsForHighlights = truScoreResult.insights 
      ? truScoreResult.insights.map(insight => insight.reason || String(insight))
      : [];
    
    results.dataSources.scoreHighlights = {
      source: 'truScore_engine',
      insights: insightsForHighlights,
      insightsCount: insightsForHighlights.length,
    };
    
    console.log(`[TEST] ✅ Completed: ${barcode} - ${fetchTime + truScoreTime}ms`);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    results.errors.push({
      message: errorMessage,
      stack: errorStack,
    });
    console.error(`[TEST] ❌ Error testing ${barcode}:`, errorMessage);
  }
  
  return results;
}

// Main execution
(async () => {
  const barcodes = process.argv.slice(2);
  
  if (barcodes.length === 0) {
    console.error('Usage: ts-node scripts/testBarcodePerformance.ts <barcode1> [barcode2] [barcode3] ...');
    console.error('Or: npm run test:barcode-performance -- <barcode1> [barcode2] ...');
    process.exit(1);
  }
  
  const allResults = {
    testRun: {
      timestamp: new Date().toISOString(),
      barcodesTested: barcodes.length,
      totalTime: 0,
      totalTimeFormatted: '',
    },
    results: [] as TestResult[],
  };
  
  const overallStart = Date.now();
  
  for (const barcode of barcodes) {
    const result = await testBarcode(barcode);
    allResults.results.push(result);
  }
  
  const overallTime = Date.now() - overallStart;
  allResults.testRun.totalTime = overallTime;
  allResults.testRun.totalTimeFormatted = `${overallTime}ms`;
  
  // Output JSON
  console.log('\n========================================');
  console.log('TEST RESULTS (JSON)');
  console.log('========================================\n');
  console.log(JSON.stringify(allResults, null, 2));
  
  // Also output human-readable summary
  console.log('\n========================================');
  console.log('TEST SUMMARY');
  console.log('========================================\n');
  
  for (const result of allResults.results) {
    console.log(`\n📦 Barcode: ${result.barcode}`);
    console.log(`   Product: ${result.product?.product_name || 'Not found'}`);
    console.log(`   Source: ${result.product?.source || 'N/A'}`);
    console.log(`\n⏱️  Performance:`);
    console.log(`   Fetch Time: ${result.performance.fetchTimeFormatted}`);
    console.log(`   TruScore Time: ${result.performance.truScoreTimeFormatted}`);
    console.log(`   Total Time: ${result.performance.totalTimeFormatted}`);
    
    if (result.truScore) {
      console.log(`\n🏆 TruScore: ${result.truScore.overall}/100`);
      console.log(`   Body: ${result.truScore.breakdown.Body}/25`);
      console.log(`   Planet: ${result.truScore.breakdown.Planet}/25`);
      console.log(`   Ethics: ${result.truScore.breakdown.Ethics}/25`);
      console.log(`   Open: ${result.truScore.breakdown.Open}/25`);
    }
    
    if (result.pillarBreakdown) {
      console.log(`\n📊 Pillar Breakdown:`);
      
      console.log(`\n   BODY Pillar (${result.pillarBreakdown.body.score}/25):`);
      console.log(`      Base Score: ${result.pillarBreakdown.body.base}/25 (starting point)`);
      console.log(`      Final Score: ${result.pillarBreakdown.body.score}/25`);
      console.log(`      Calculation:`);
      console.log(`        1. Start with base score: ${result.pillarBreakdown.body.base}`);
      result.pillarBreakdown.body.adjustments.forEach((adj, idx) => {
        const sign = adj.type === 'positive' ? '+' : (adj.value < 0 ? '' : '-');
        const value = Math.abs(adj.value);
        console.log(`        ${idx + 2}. ${sign}${value} points: ${adj.description}`);
      });
      console.log(`      Data Sources Used:`);
      console.log(`        - Nutrition Data: ${result.pillarBreakdown.body.dataSources.nutrition || 'N/A'}`);
      console.log(`        - Nutri-Score Grade: ${result.pillarBreakdown.body.dataSources.nutriScore || 'N/A'}`);
      console.log(`        - Additives Information: ${result.pillarBreakdown.body.dataSources.additives || 'N/A'}`);
      console.log(`        - NOVA Processing Level: ${result.pillarBreakdown.body.dataSources.nova || 'N/A'}`);
      if (result.pillarBreakdown.body.details) {
        console.log(`      Details:`);
        if (result.pillarBreakdown.body.details.nutriscoreGrade) {
          console.log(`        - Nutri-Score: ${result.pillarBreakdown.body.details.nutriscoreGrade.toUpperCase()} (value: ${result.pillarBreakdown.body.details.nutriscoreValue || 'N/A'})`);
        }
        if (result.pillarBreakdown.body.details.additiveElementDeduction !== undefined) {
          console.log(`        - Additive element (MVP): -${result.pillarBreakdown.body.details.additiveElementDeduction} points`);
        }
        if (result.pillarBreakdown.body.details.novaAdjustment !== undefined && result.pillarBreakdown.body.details.novaAdjustment !== 0) {
          console.log(`        - NOVA Adjustment: ${result.pillarBreakdown.body.details.novaAdjustment > 0 ? '+' : ''}${result.pillarBreakdown.body.details.novaAdjustment} points`);
        }
      }
      
      console.log(`\n   PLANET Pillar (${result.pillarBreakdown.planet.score}/25):`);
      console.log(`      Base Score: ${result.pillarBreakdown.planet.base}/25 (starting point)`);
      console.log(`      Final Score: ${result.pillarBreakdown.planet.score}/25`);
      console.log(`      Calculation:`);
      console.log(`        1. Start with base score: ${result.pillarBreakdown.planet.base}`);
      result.pillarBreakdown.planet.adjustments.forEach((adj, idx) => {
        const sign = adj.type === 'positive' ? '+' : (adj.value < 0 ? '' : '-');
        const value = Math.abs(adj.value);
        console.log(`        ${idx + 2}. ${sign}${value} points: ${adj.description}`);
      });
      console.log(`      Data Sources Used:`);
      console.log(`        - Eco-Score Grade: ${result.pillarBreakdown.planet.dataSources.ecoscore || 'N/A'}`);
      console.log(`        - Palm Oil Analysis: ${result.pillarBreakdown.planet.dataSources.palmOil || 'N/A'}`);
      console.log(`        - Packaging Information: ${result.pillarBreakdown.planet.dataSources.packaging || 'N/A'}`);
      if (result.pillarBreakdown.planet.details) {
        console.log(`      Details:`);
        if (result.pillarBreakdown.planet.details.ecoscoreGrade) {
          console.log(`        - Eco-Score: ${result.pillarBreakdown.planet.details.ecoscoreGrade.toUpperCase()} (value: ${result.pillarBreakdown.planet.details.ecoscoreValue || 'N/A'})`);
        }
        if (result.pillarBreakdown.planet.details.palmOilPenalty !== undefined && result.pillarBreakdown.planet.details.palmOilPenalty > 0) {
          console.log(`        - Palm Oil Penalty: -${result.pillarBreakdown.planet.details.palmOilPenalty} points`);
        }
        if (result.pillarBreakdown.planet.details.recyclableBonus !== undefined && result.pillarBreakdown.planet.details.recyclableBonus > 0) {
          console.log(`        - Recyclable Bonus: +${result.pillarBreakdown.planet.details.recyclableBonus} points`);
        }
      }
      
      console.log(`\n   ETHICS Pillar (${result.pillarBreakdown.ethics.score}/25):`);
      console.log(`      Base Score: ${result.pillarBreakdown.ethics.base}/25 (starting point)`);
      console.log(`      Final Score: ${result.pillarBreakdown.ethics.score}/25`);
      console.log(`      Calculation:`);
      console.log(`        1. Start with base score: ${result.pillarBreakdown.ethics.base}`);
      result.pillarBreakdown.ethics.adjustments.forEach((adj, idx) => {
        const sign = adj.type === 'positive' ? '+' : (adj.value < 0 ? '' : '-');
        const value = Math.abs(adj.value);
        console.log(`        ${idx + 2}. ${sign}${value} points: ${adj.description}`);
      });
      console.log(`      Data Sources Used:`);
      console.log(`        - Certifications: ${result.pillarBreakdown.ethics.dataSources.certifications || 'N/A'}`);
      console.log(`        - Product Recalls: ${result.pillarBreakdown.ethics.dataSources.recalls || 'N/A'}`);
      console.log(`        - Brand/Parent Company Data: ${result.pillarBreakdown.ethics.dataSources.brandData || 'N/A'}`);
      if (result.pillarBreakdown.ethics.details) {
        console.log(`      Details:`);
        if (result.pillarBreakdown.ethics.details.certificationBonus !== undefined && result.pillarBreakdown.ethics.details.certificationBonus > 0) {
          console.log(`        - Certification Bonus: +${result.pillarBreakdown.ethics.details.certificationBonus} points`);
        }
        if (result.pillarBreakdown.ethics.details.animalCrueltyPenalty !== undefined && result.pillarBreakdown.ethics.details.animalCrueltyPenalty > 0) {
          console.log(`        - Animal Cruelty Penalty: -${result.pillarBreakdown.ethics.details.animalCrueltyPenalty} points`);
        }
        if (result.pillarBreakdown.ethics.details.laborViolationPenalty !== undefined && result.pillarBreakdown.ethics.details.laborViolationPenalty > 0) {
          console.log(`        - Labor Violation Penalty: -${result.pillarBreakdown.ethics.details.laborViolationPenalty} points`);
        }
        if (result.pillarBreakdown.ethics.details.recallPenalty !== undefined && result.pillarBreakdown.ethics.details.recallPenalty > 0) {
          console.log(`        - Recall Penalty: -${result.pillarBreakdown.ethics.details.recallPenalty} points`);
        }
      }
      
      console.log(`\n   OPEN Pillar (${result.pillarBreakdown.open.score}/25):`);
      console.log(`      Base Score: ${result.pillarBreakdown.open.base}/25 (starting point)`);
      console.log(`      Final Score: ${result.pillarBreakdown.open.score}/25`);
      console.log(`      Calculation:`);
      console.log(`        1. Start with base score: ${result.pillarBreakdown.open.base}`);
      result.pillarBreakdown.open.adjustments.forEach((adj, idx) => {
        const sign = adj.type === 'positive' ? '+' : (adj.value < 0 ? '' : '-');
        const value = Math.abs(adj.value);
        console.log(`        ${idx + 2}. ${sign}${value} points: ${adj.description}`);
      });
      console.log(`      Data Sources Used:`);
      console.log(`        - Ingredients List: ${result.pillarBreakdown.open.dataSources.ingredients || 'N/A'}`);
      console.log(`        - Country of Origin: ${result.pillarBreakdown.open.dataSources.origin || 'N/A'}`);
      console.log(`        - Brand Owner/Parent Company: ${result.pillarBreakdown.open.dataSources.brandOwner || 'N/A'}`);
      if (result.pillarBreakdown.open.details) {
        console.log(`      Details:`);
        if (result.pillarBreakdown.open.details.ingredientsLength !== undefined) {
          console.log(`        - Ingredients Length: ${result.pillarBreakdown.open.details.ingredientsLength} characters`);
          console.log(`        - Ingredients Score: ${result.pillarBreakdown.open.details.ingredientsScore || 0} points`);
        }
        if (result.pillarBreakdown.open.details.hiddenTermsCount !== undefined && result.pillarBreakdown.open.details.hiddenTermsCount > 0) {
          console.log(`        - Hidden Terms Found: ${result.pillarBreakdown.open.details.hiddenTermsCount}`);
          console.log(`        - Hidden Terms Penalty: -${result.pillarBreakdown.open.details.hiddenTermsPenalty || 0} points`);
        }
        if (result.pillarBreakdown.open.details.listingClarityBonus !== undefined && result.pillarBreakdown.open.details.listingClarityBonus > 0) {
          console.log(`        - Listing clarity bonus: +${result.pillarBreakdown.open.details.listingClarityBonus} points`);
        }
        if (result.pillarBreakdown.open.details.originPenalty !== undefined && result.pillarBreakdown.open.details.originPenalty > 0) {
          console.log(`        - Origin Penalty: -${result.pillarBreakdown.open.details.originPenalty} points`);
        }
      }
    }
    
    console.log(`\n📋 Data Sources:`);
    console.log(`   Primary Source: ${result.dataSources.primarySource || 'N/A'}`);
    console.log(`   All Sources: ${result.dataSources.allSources.length > 0 ? result.dataSources.allSources.join(', ') : 'N/A'}`);
    console.log(`   Databases Queried: ${result.dataSources.databasesQueried.length > 0 ? result.dataSources.databasesQueried.join(', ') : 'N/A'}`);
    console.log(`\n   Ingredients:`);
    console.log(`      Source(s): ${result.dataSources.ingredients.sources.length > 0 ? result.dataSources.ingredients.sources.join(', ') : 'N/A'}`);
    console.log(`      Length: ${result.dataSources.ingredients.length} characters`);
    console.log(`      Has Hidden Terms: ${result.dataSources.ingredients.hasHiddenTerms ? 'Yes' : 'No'}`);
    console.log(`\n   Nutrition:`);
    console.log(`      Source(s): ${result.dataSources.nutrition.sources.length > 0 ? result.dataSources.nutrition.sources.join(', ') : 'N/A'}`);
    console.log(`      Fields: ${result.dataSources.nutrition.fieldsCount}`);
    console.log(`      Has Energy: ${result.dataSources.nutrition.hasEnergy ? 'Yes' : 'No'}`);
    console.log(`      Has Macros: ${result.dataSources.nutrition.hasMacros ? 'Yes' : 'No'}`);
    console.log(`\n   Allergens & Additives:`);
    console.log(`      Allergens Source(s): ${result.dataSources.allergensAdditives.allergensSources.length > 0 ? result.dataSources.allergensAdditives.allergensSources.join(', ') : 'N/A'}`);
    console.log(`      Allergens Count: ${result.dataSources.allergensAdditives.allergensCount}`);
    console.log(`      Allergens Tags: ${result.dataSources.allergensAdditives.allergensTags.length > 0 ? result.dataSources.allergensAdditives.allergensTags.join(', ') : 'None'}`);
    console.log(`      Additives Source(s): ${result.dataSources.allergensAdditives.additivesSources.length > 0 ? result.dataSources.allergensAdditives.additivesSources.join(', ') : 'N/A'}`);
    console.log(`      Additives Count: ${result.dataSources.allergensAdditives.additivesCount}`);
    console.log(`      Additives Tags: ${result.dataSources.allergensAdditives.additivesTags.slice(0, 10).join(', ')}${result.dataSources.allergensAdditives.additivesTags.length > 10 ? '...' : ''}`);
    console.log(`\n   Country of Origin:`);
    console.log(`      Source(s): ${result.dataSources.countryOfOrigin.sources.length > 0 ? result.dataSources.countryOfOrigin.sources.join(', ') : 'N/A'}`);
    console.log(`      Origins: ${result.dataSources.countryOfOrigin.origins.length > 0 ? result.dataSources.countryOfOrigin.origins.join(', ') : 'N/A'}`);
    console.log(`      Origins Tags: ${result.dataSources.countryOfOrigin.originsTags.length > 0 ? result.dataSources.countryOfOrigin.originsTags.join(', ') : 'None'}`);
    console.log(`      Manufacturing Places: ${result.dataSources.countryOfOrigin.manufacturingPlaces.length > 0 ? result.dataSources.countryOfOrigin.manufacturingPlaces.join(', ') : 'N/A'}`);
    console.log(`      Manufacturing Places Tags: ${result.dataSources.countryOfOrigin.manufacturingPlacesTags.length > 0 ? result.dataSources.countryOfOrigin.manufacturingPlacesTags.join(', ') : 'None'}`);
    console.log(`\n   Score Highlights:`);
    console.log(`      Source: ${result.dataSources.scoreHighlights.source}`);
    console.log(`      Insights Count: ${result.dataSources.scoreHighlights.insightsCount}`);
    if (result.dataSources.scoreHighlights.insights.length > 0) {
      result.dataSources.scoreHighlights.insights.forEach((insight, idx) => {
        console.log(`      ${idx + 1}. ${insight}`);
      });
    }
    
    if (result.errors.length > 0) {
      console.log(`\n❌ Errors: ${result.errors.length}`);
      result.errors.forEach(err => {
        console.log(`   - ${err.message}`);
      });
    }
  }
  
  console.log(`\n\n⏱️  Total Test Time: ${allResults.testRun.totalTimeFormatted}`);
  console.log(`📊 Barcodes Tested: ${allResults.testRun.barcodesTested}`);
  console.log('');
  
})().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

