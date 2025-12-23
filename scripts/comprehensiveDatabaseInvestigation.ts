/**
 * COMPREHENSIVE DATABASE INVESTIGATION
 * 
 * This script performs an aggressive, real-world investigation of ALL databases
 * integrated into TrueScan to determine:
 * 1. Which databases are ACTUALLY returning useful data
 * 2. Which databases are queried but returning empty/null results
 * 3. Which databases are failing completely
 * 4. Solutions for non-functional databases
 * 
 * Uses real-world barcodes from different product categories to ensure
 * comprehensive coverage testing.
 */

/// <reference path="../global.d.ts" />

// Initialize Expo/React Native globals
if (typeof (global as any).__DEV__ === 'undefined') {
  (global as any).__DEV__ = process.env.NODE_ENV !== 'production';
}

if (!process.env.EXPO_OS) {
  process.env.EXPO_OS = 'node';
}

// Initialize React Native globals
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

// Mock Expo modules
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

import * as fs from 'fs';
import * as path from 'path';

// REAL-WORLD TEST BARCODES - Diverse product categories
const TEST_BARCODES = [
  // Food & Beverages
  '9300675001113', // Coca-Cola (AU/NZ)
  '9310645244839', // Tuna (from test files)
  '3017620422003', // Nutella (global)
  '7622210969472', // Oreo cookies (global)
  '5000159461125', // Coca-Cola (UK)
  '8001090311027', // Barilla pasta (global)
  '8712561735036', // Heineken beer (global)
  '4008400000000', // Generic test
  '5010024000000', // Common UK product
  '5901234123457', // Common EU product
];

// ALL DATABASES FROM truScoreOptimizedDatabase.ts
// Organized by tier and query type
const DATABASE_SERVICES = [
  // ===== TIER 1: GOLD STANDARD (Always queried) =====
  {
    name: 'Open Food Facts',
    importPath: '../src/services/openFoodFacts',
    function: 'fetchProductFromOFF',
    tier: 1,
    requiresKey: false,
    queryType: 'barcode',
    description: 'Primary food database - global coverage',
  },
  {
    name: 'Open Beauty Facts',
    importPath: '../src/services/openBeautyFacts',
    function: 'fetchProductFromOBF',
    tier: 1,
    requiresKey: false,
    queryType: 'barcode',
    description: 'Cosmetics database',
  },
  {
    name: 'Open Pet Food Facts',
    importPath: '../src/services/openPetFoodFacts',
    function: 'fetchProductFromOPFF',
    tier: 1,
    requiresKey: false,
    queryType: 'barcode',
    description: 'Pet food database',
  },
  {
    name: 'Open Products Facts',
    importPath: '../src/services/openProductsFacts',
    function: 'fetchProductFromOPF',
    tier: 1,
    requiresKey: false,
    queryType: 'barcode',
    description: 'General products database',
  },
  {
    name: 'GS1 Data Source',
    importPath: '../src/services/gs1DataSource',
    function: 'fetchProductFromGS1',
    tier: 1,
    requiresKey: true,
    queryType: 'barcode',
    description: 'GS1 official database (requires subscription)',
  },
  
  // ===== TIER 1: LOCATION-SPECIFIC (Country-dependent) =====
  {
    name: 'USDA FoodData Central',
    importPath: '../src/services/usdaFoodData',
    function: 'fetchProductFromUSDA',
    tier: 1,
    requiresKey: true,
    queryType: 'barcode',
    description: 'US government nutrition database (US users only)',
    countryFilter: 'US',
  },
  {
    name: 'Health Canada',
    importPath: '../src/services/healthCanadaDatabase',
    function: 'fetchProductFromHealthCanada',
    tier: 1,
    requiresKey: false,
    queryType: 'barcode',
    description: 'Canadian government database (CA users only)',
    countryFilter: 'CA',
  },
  {
    name: 'UK FSA',
    importPath: '../src/services/ukFsaDatabase',
    function: 'fetchProductFromUKFSA',
    tier: 1,
    requiresKey: false,
    queryType: 'barcode',
    description: 'UK Food Standards Agency (GB users only)',
    countryFilter: 'GB',
  },
  {
    name: 'EFSA',
    importPath: '../src/services/efsaDatabase',
    function: 'fetchProductFromEFSA',
    tier: 1,
    requiresKey: false,
    queryType: 'barcode',
    description: 'European Food Safety Authority (EU users only)',
    countryFilter: 'EU',
  },
  
  // ===== TIER 2: ENHANCEMENTS (Name-based queries) =====
  {
    name: 'FSANZ (AU)',
    importPath: '../src/services/fsanzQueryService',
    function: 'queryFSANZByProductName',
    tier: 2,
    requiresKey: false,
    queryType: 'name',
    description: 'Australian Food Standards database (AU users, name-based)',
    countryFilter: 'AU',
    needsProductName: true,
  },
  {
    name: 'FSANZ (NZ)',
    importPath: '../src/services/fsanzQueryService',
    function: 'queryFSANZByProductName',
    tier: 2,
    requiresKey: false,
    queryType: 'name',
    description: 'New Zealand Food Standards database (NZ users, name-based)',
    countryFilter: 'NZ',
    needsProductName: true,
  },
  {
    name: 'NZFCD Enhancement',
    importPath: '../src/services/nzfcdDatabase',
    function: 'enhanceProductWithNZFCD',
    tier: 2,
    requiresKey: false,
    queryType: 'enhancement',
    description: 'NZ Food Composition Database (enhancement, NZ users)',
    countryFilter: 'NZ',
    isEnhancement: true,
  },
  {
    name: 'AFCD Enhancement',
    importPath: '../src/services/afcdDatabase',
    function: 'enhanceProductWithAFCD',
    tier: 2,
    requiresKey: false,
    queryType: 'enhancement',
    description: 'Australian Food Composition Database (enhancement, AU users)',
    countryFilter: 'AU',
    isEnhancement: true,
  },
  {
    name: 'FoodAtlas',
    importPath: '../src/services/foodAtlasQueryService',
    function: 'queryFoodAtlasByProductName',
    tier: 2,
    requiresKey: false,
    queryType: 'name',
    description: 'FoodAtlas nutrition database (name-based, global)',
    needsProductName: true,
  },
  {
    name: 'FooDB Enhancement',
    importPath: '../src/services/foodbApi',
    function: 'enhanceProductWithFooDB',
    tier: 2,
    requiresKey: false,
    queryType: 'enhancement',
    description: 'FooDB nutrition enhancement (global)',
    isEnhancement: true,
  },
  {
    name: 'World Food Database',
    importPath: '../src/services/worldFoodDatabaseApi',
    function: 'enhanceProductWithWorldFoodDatabase',
    tier: 2,
    requiresKey: false,
    queryType: 'enhancement',
    description: 'World Food Database nutrition enhancement (global)',
    isEnhancement: true,
  },
  
  // ===== TIER 2: STORE APIs (Location-specific) =====
  {
    name: 'NZ Stores',
    importPath: '../src/services/nzStoreApi',
    function: 'fetchProductFromNZStores',
    tier: 2,
    requiresKey: false,
    queryType: 'barcode',
    description: 'New Zealand store APIs (NZ users only)',
    countryFilter: 'NZ',
  },
  {
    name: 'AU Retailers',
    importPath: '../src/services/auRetailerScraping',
    function: 'fetchProductFromAURetailers',
    tier: 2,
    requiresKey: false,
    queryType: 'barcode',
    description: 'Australian retailer scraping (AU users only)',
    countryFilter: 'AU',
  },
  {
    name: 'Tesco Labs',
    importPath: '../src/services/tescoLabsApi',
    function: 'fetchProductFromTesco',
    tier: 2,
    requiresKey: true,
    queryType: 'barcode',
    description: 'Tesco Labs API (GB users only)',
    countryFilter: 'GB',
  },
  {
    name: 'Walmart Open API',
    importPath: '../src/services/walmartOpenApi',
    function: 'fetchProductFromWalmart',
    tier: 2,
    requiresKey: true,
    queryType: 'barcode',
    description: 'Walmart Open API (US users)',
    countryFilter: 'US',
  },
  {
    name: 'Food Repo',
    importPath: '../src/services/foodRepoApi',
    function: 'fetchProductFromFoodRepo',
    tier: 2,
    requiresKey: false,
    queryType: 'barcode',
    description: 'Food Repo database (global)',
  },
  
  // ===== TIER 3: NUTRITION APIs (Require API keys) =====
  {
    name: 'Edamam',
    importPath: '../src/services/edamamApi',
    function: 'fetchProductFromEdamam',
    tier: 3,
    requiresKey: true,
    queryType: 'barcode',
    description: 'Edamam nutrition API (requires API key)',
  },
  {
    name: 'Nutritionix',
    importPath: '../src/services/nutritionixApi',
    function: 'fetchProductFromNutritionix',
    tier: 3,
    requiresKey: true,
    queryType: 'barcode',
    description: 'Nutritionix API (requires API key)',
  },
  {
    name: 'Spoonacular',
    importPath: '../src/services/spoonacularApi',
    function: 'fetchProductFromSpoonacular',
    tier: 3,
    requiresKey: true,
    queryType: 'barcode',
    description: 'Spoonacular API (requires API key)',
  },
  
  // ===== TIER 3: FALLBACK DATABASES =====
  {
    name: 'Datakick',
    importPath: '../src/services/datakickApi',
    function: 'fetchProductFromDatakick',
    tier: 3,
    requiresKey: false,
    queryType: 'barcode',
    description: 'Datakick community database',
  },
  {
    name: 'UPCitemdb',
    importPath: '../src/services/upcitemdb',
    function: 'fetchProductFromUPCitemdb',
    tier: 3,
    requiresKey: false,
    queryType: 'barcode',
    description: 'UPCitemdb free database',
  },
  {
    name: 'EAN-Search',
    importPath: '../src/services/eanSearchApi',
    function: 'fetchProductFromEANSearch',
    tier: 3,
    requiresKey: true,
    queryType: 'barcode',
    description: 'EAN-Search API (requires API key)',
  },
  {
    name: 'Barcode Spider',
    importPath: '../src/services/barcodeSpider',
    function: 'fetchProductFromBarcodeSpider',
    tier: 3,
    requiresKey: false,
    queryType: 'barcode',
    description: 'Barcode Spider free API',
  },
  {
    name: 'GoUPC',
    importPath: '../src/services/goUpcApi',
    function: 'fetchProductFromGoUpc',
    tier: 3,
    requiresKey: false,
    queryType: 'barcode',
    description: 'GoUPC free database',
  },
  {
    name: 'Buycott',
    importPath: '../src/services/buycottApi',
    function: 'fetchProductFromBuycott',
    tier: 3,
    requiresKey: false,
    queryType: 'barcode',
    description: 'Buycott database',
  },
  {
    name: 'Open GTIN DB',
    importPath: '../src/services/openGtindbApi',
    function: 'fetchProductFromOpenGtin',
    tier: 3,
    requiresKey: false,
    queryType: 'barcode',
    description: 'Open GTIN database',
  },
  {
    name: 'Open EAN',
    importPath: '../src/services/openEanApi',
    function: 'fetchProductFromOpenEAN',
    tier: 3,
    requiresKey: false,
    queryType: 'barcode',
    description: 'Open EAN database',
  },
  {
    name: 'Barcode Monster',
    importPath: '../src/services/barcodeMonsterApi',
    function: 'fetchProductFromBarcodeMonster',
    tier: 3,
    requiresKey: false,
    queryType: 'barcode',
    description: 'Barcode Monster API',
  },
  {
    name: 'UPC Database',
    importPath: '../src/services/upcDatabaseApi',
    function: 'fetchProductFromUPCDatabase',
    tier: 3,
    requiresKey: true,
    queryType: 'barcode',
    description: 'UPC Database API (requires API key)',
  },
  {
    name: 'Barcode Lookup',
    importPath: '../src/services/barcodeLookupApi',
    function: 'fetchProductFromBarcodeLookup',
    tier: 3,
    requiresKey: true,
    queryType: 'barcode',
    description: 'Barcode Lookup API (requires API key)',
  },
  {
    name: 'EAN Data',
    importPath: '../src/services/eanDataApi',
    function: 'fetchProductFromEANData',
    tier: 3,
    requiresKey: true,
    queryType: 'barcode',
    description: 'EAN Data API (requires API key)',
  },
  {
    name: 'Barcode Lookup Com',
    importPath: '../src/services/barcodeLookupComApi',
    function: 'fetchProductFromBarcodeLookupCom',
    tier: 3,
    requiresKey: true,
    queryType: 'barcode',
    description: 'Barcode Lookup (barcodelookup.com) - free tier requires API key',
  },
  {
    name: 'Product Open Data',
    importPath: '../src/services/productOpenDataApi',
    function: 'fetchProductFromProductOpenData',
    tier: 3,
    requiresKey: false,
    queryType: 'barcode',
    description: 'Product Open Data database',
  },
  {
    name: 'Best Buy',
    importPath: '../src/services/bestBuyApi',
    function: 'fetchProductFromBestBuy',
    tier: 3,
    requiresKey: true,
    queryType: 'barcode',
    description: 'Best Buy API (electronics only, requires API key)',
  },
];

interface TestResult {
  database: string;
  barcode: string;
  success: boolean;
  hasData: boolean;
  dataFields: string[];
  criticalFields: {
    hasName: boolean;
    hasNutrition: boolean;
    hasIngredients: boolean;
    hasBrand: boolean;
  };
  error?: string;
  responseTime: number;
  requiresKey?: boolean;
  tier: number;
  queryType: string;
  dataQuality: 'excellent' | 'good' | 'minimal' | 'none';
}

interface DatabaseSummary {
  database: string;
  tier: number;
  queryType: string;
  totalTests: number;
  successes: number;
  failures: number;
  dataReturns: number;
  noDataReturns: number;
  averageResponseTime: number;
  requiresKey: boolean;
  status: 'working' | 'not_working' | 'requires_key' | 'partial' | 'enhancement_only';
  issues: string[];
  recommendations: string[];
  dataQuality: {
    excellent: number;
    good: number;
    minimal: number;
    none: number;
  };
}

const results: TestResult[] = [];
const summaries: Map<string, DatabaseSummary> = new Map();

/**
 * Get a base product for enhancement testing
 */
async function getBaseProduct(barcode: string): Promise<any> {
  try {
    const { fetchProductFromOFF } = await import('../src/services/openFoodFacts');
    const product = await fetchProductFromOFF(barcode);
    return product || {
      barcode,
      product_name: 'Test Product',
      nutriments: {},
    };
  } catch (error) {
    return {
      barcode,
      product_name: 'Test Product',
      nutriments: {},
    };
  }
}

/**
 * Test a single database with a barcode
 */
async function testDatabase(
  dbInfo: typeof DATABASE_SERVICES[0],
  barcode: string,
  baseProduct?: any
): Promise<TestResult> {
  const startTime = Date.now();
  const result: TestResult = {
    database: dbInfo.name,
    barcode,
    success: false,
    hasData: false,
    dataFields: [],
    criticalFields: {
      hasName: false,
      hasNutrition: false,
      hasIngredients: false,
      hasBrand: false,
    },
    responseTime: 0,
    requiresKey: dbInfo.requiresKey,
    tier: dbInfo.tier,
    queryType: dbInfo.queryType,
    dataQuality: 'none',
  };

  try {
    // Dynamically import the service
    const serviceModule = await import(dbInfo.importPath);
    const fetchFunction = serviceModule[dbInfo.function];

    if (!fetchFunction || typeof fetchFunction !== 'function') {
      result.error = `Function ${dbInfo.function} not found`;
      result.responseTime = Date.now() - startTime;
      return result;
    }

    // Call the function with timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout after 15 seconds')), 15000)
    );

    let product: any;
    
    // Handle different function signatures
    if (dbInfo.isEnhancement && baseProduct) {
      // Enhancement functions take a product as parameter
      product = await Promise.race([
        fetchFunction(baseProduct),
        timeoutPromise
      ]);
    } else if (dbInfo.queryType === 'name' && baseProduct?.product_name) {
      // Name-based queries
      if (dbInfo.name.includes('FSANZ')) {
        const country = dbInfo.name.includes('AU') ? 'AU' : 'NZ';
        product = await Promise.race([
          fetchFunction(baseProduct.product_name, country),
          timeoutPromise
        ]);
      } else {
        product = await Promise.race([
          fetchFunction(baseProduct.product_name),
          timeoutPromise
        ]);
      }
    } else {
      // Standard barcode-based queries
      product = await Promise.race([
        fetchFunction(barcode),
        timeoutPromise
      ]);
    }

    result.success = true;
    result.responseTime = Date.now() - startTime;

    // Check if product has useful data
    if (product && typeof product === 'object') {
      // Extract data fields
      const fields = Object.keys(product).filter(key => {
        const value = product[key];
        return value !== null && 
               value !== undefined && 
               value !== '' && 
               !(Array.isArray(value) && value.length === 0) &&
               !(typeof value === 'object' && Object.keys(value).length === 0);
      });
      
      result.dataFields = fields;
      
      // Check for critical fields
      result.criticalFields.hasName = !!(product.product_name || product.name || product.title);
      result.criticalFields.hasNutrition = !!(product.nutriments || product.nutrition || product.nutrients);
      result.criticalFields.hasIngredients = !!(product.ingredients_text || product.ingredients);
      result.criticalFields.hasBrand = !!(product.brands || product.brand);
      
      // Determine data quality
      const criticalCount = Object.values(result.criticalFields).filter(Boolean).length;
      if (criticalCount >= 3 && fields.length > 10) {
        result.dataQuality = 'excellent';
      } else if (criticalCount >= 2 && fields.length > 5) {
        result.dataQuality = 'good';
      } else if (criticalCount >= 1 || fields.length > 0) {
        result.dataQuality = 'minimal';
      } else {
        result.dataQuality = 'none';
      }
      
      // Determine if has useful data
      if (result.criticalFields.hasName || result.criticalFields.hasNutrition || result.criticalFields.hasIngredients) {
        result.hasData = true;
      } else {
        result.hasData = false;
        result.error = 'Product returned but has no useful data fields';
      }
    } else {
      result.hasData = false;
      result.error = 'Function returned null or invalid data';
    }

  } catch (error: any) {
    result.success = false;
    result.responseTime = Date.now() - startTime;
    result.error = error.message || String(error);
    
    // Check for common error types
    if (result.error.includes('API key') || result.error.includes('authentication') || 
        result.error.includes('not configured') || result.error.includes('401') || 
        result.error.includes('403')) {
      result.requiresKey = true;
    }
  }

  return result;
}

/**
 * Generate summary for each database
 */
function generateSummaries() {
  for (const dbInfo of DATABASE_SERVICES) {
    const dbResults = results.filter(r => r.database === dbInfo.name);
    
    if (dbResults.length === 0) continue;

    const summary: DatabaseSummary = {
      database: dbInfo.name,
      tier: dbInfo.tier,
      queryType: dbInfo.queryType,
      totalTests: dbResults.length,
      successes: dbResults.filter(r => r.success).length,
      failures: dbResults.filter(r => !r.success).length,
      dataReturns: dbResults.filter(r => r.hasData).length,
      noDataReturns: dbResults.filter(r => r.success && !r.hasData).length,
      averageResponseTime: dbResults.reduce((sum, r) => sum + r.responseTime, 0) / dbResults.length,
      requiresKey: dbInfo.requiresKey || false,
      status: 'not_working',
      issues: [],
      recommendations: [],
      dataQuality: {
        excellent: dbResults.filter(r => r.dataQuality === 'excellent').length,
        good: dbResults.filter(r => r.dataQuality === 'good').length,
        minimal: dbResults.filter(r => r.dataQuality === 'minimal').length,
        none: dbResults.filter(r => r.dataQuality === 'none').length,
      },
    };

    // Determine status
    if (summary.dataReturns > 0) {
      if (summary.dataReturns === summary.totalTests) {
        summary.status = 'working';
      } else {
        summary.status = 'partial';
        summary.issues.push(`Returns data for ${summary.dataReturns}/${summary.totalTests} barcodes`);
      }
    } else if (summary.requiresKey || dbResults.some(r => r.requiresKey)) {
      summary.status = 'requires_key';
      summary.issues.push('API key required but not configured');
    } else if (summary.successes > 0 && summary.noDataReturns === summary.successes) {
      summary.status = 'not_working';
      summary.issues.push('Returns empty/null data for all test barcodes');
    } else if (summary.failures === summary.totalTests) {
      summary.status = 'not_working';
      summary.issues.push('All queries failed');
    }

    // Generate recommendations
    if (summary.status === 'not_working') {
      summary.recommendations.push('❌ REMOVE from query list - not returning useful data');
      summary.recommendations.push('Check if API endpoint has changed or requires authentication');
      summary.recommendations.push('Verify API is still operational');
    } else if (summary.status === 'requires_key') {
      summary.recommendations.push('🔑 Add API key to .env file if free tier available');
      summary.recommendations.push('Consider removing if no free tier available');
    } else if (summary.status === 'partial') {
      summary.recommendations.push('⚠️ Keep in fallback tier - works for some products');
      summary.recommendations.push('May have limited product coverage');
    } else if (summary.status === 'working') {
      summary.recommendations.push('✅ Database is working correctly - keep in query list');
    }

    summaries.set(dbInfo.name, summary);
  }
}

/**
 * Generate comprehensive report
 */
function generateReport(): string {
  let report = '# COMPREHENSIVE DATABASE INVESTIGATION REPORT\n\n';
  report += `**Generated:** ${new Date().toISOString()}\n\n`;
  report += `**Test Barcodes:** ${TEST_BARCODES.join(', ')}\n\n`;
  report += `**Total Databases Tested:** ${DATABASE_SERVICES.length}\n\n`;

  // Summary by status
  const byStatus = {
    working: Array.from(summaries.values()).filter(s => s.status === 'working'),
    partial: Array.from(summaries.values()).filter(s => s.status === 'partial'),
    requires_key: Array.from(summaries.values()).filter(s => s.status === 'requires_key'),
    not_working: Array.from(summaries.values()).filter(s => s.status === 'not_working'),
  };

  report += '## Executive Summary\n\n';
  report += `- ✅ **Working:** ${byStatus.working.length} databases\n`;
  report += `- ⚠️ **Partial:** ${byStatus.partial.length} databases\n`;
  report += `- 🔑 **Requires Key:** ${byStatus.requires_key.length} databases\n`;
  report += `- ❌ **Not Working:** ${byStatus.not_working.length} databases\n\n`;

  // Critical findings
  report += '## 🚨 CRITICAL FINDINGS\n\n';
  
  const notWorking = byStatus.not_working.filter(s => !s.requiresKey);
  if (notWorking.length > 0) {
    report += '### Databases NOT Returning Data (Should Be Removed)\n\n';
    for (const db of notWorking) {
      report += `- **${db.database}** (Tier ${db.tier}): ${db.issues.join(', ')}\n`;
    }
    report += '\n';
  }

  const requiresKey = byStatus.requires_key;
  if (requiresKey.length > 0) {
    report += '### Databases Requiring API Keys\n\n';
    for (const db of requiresKey) {
      report += `- **${db.database}** (Tier ${db.tier}): API key not configured\n`;
    }
    report += '\n';
  }

  // Results by tier
  report += '## Results by Tier\n\n';

  for (let tier = 1; tier <= 3; tier++) {
    const tierDbs = Array.from(summaries.values()).filter(s => s.tier === tier);
    if (tierDbs.length === 0) continue;

    report += `### Tier ${tier} Databases\n\n`;
    report += '| Database | Status | Success Rate | Data Returns | Avg Response | Data Quality | Issues |\n';
    report += '|----------|--------|--------------|--------------|--------------|--------------|--------|\n';

    for (const summary of tierDbs) {
      const successRate = `${((summary.successes / summary.totalTests) * 100).toFixed(0)}%`;
      const dataRate = `${summary.dataReturns}/${summary.totalTests}`;
      const avgTime = `${summary.averageResponseTime.toFixed(0)}ms`;
      const statusEmoji = 
        summary.status === 'working' ? '✅' :
        summary.status === 'partial' ? '⚠️' :
        summary.status === 'requires_key' ? '🔑' :
        '❌';
      
      const qualitySummary = `E:${summary.dataQuality.excellent} G:${summary.dataQuality.good} M:${summary.dataQuality.minimal} N:${summary.dataQuality.none}`;
      
      report += `| ${summary.database} | ${statusEmoji} ${summary.status} | ${successRate} | ${dataRate} | ${avgTime} | ${qualitySummary} | ${summary.issues.join('; ') || 'None'} |\n`;
    }
    report += '\n';
  }

  // Detailed results for each database
  report += '## Detailed Results\n\n';

  for (const summary of Array.from(summaries.values()).sort((a, b) => a.tier - b.tier)) {
    report += `### ${summary.database} (Tier ${summary.tier}, ${summary.queryType})\n\n`;
    report += `**Status:** ${summary.status}\n\n`;
    report += `**Statistics:**\n`;
    report += `- Total Tests: ${summary.totalTests}\n`;
    report += `- Successes: ${summary.successes}\n`;
    report += `- Failures: ${summary.failures}\n`;
    report += `- Data Returns: ${summary.dataReturns}\n`;
    report += `- No Data Returns: ${summary.noDataReturns}\n`;
    report += `- Average Response Time: ${summary.averageResponseTime.toFixed(0)}ms\n`;
    report += `- Requires API Key: ${summary.requiresKey ? 'Yes' : 'No'}\n`;
    report += `- Data Quality: Excellent: ${summary.dataQuality.excellent}, Good: ${summary.dataQuality.good}, Minimal: ${summary.dataQuality.minimal}, None: ${summary.dataQuality.none}\n\n`;

    if (summary.issues.length > 0) {
      report += `**Issues:**\n`;
      for (const issue of summary.issues) {
        report += `- ${issue}\n`;
      }
      report += '\n';
    }

    if (summary.recommendations.length > 0) {
      report += `**Recommendations:**\n`;
      for (const rec of summary.recommendations) {
        report += `- ${rec}\n`;
      }
      report += '\n';
    }

    // Show test results
    const dbResults = results.filter(r => r.database === summary.database);
    report += `**Test Results:**\n\n`;
    report += '| Barcode | Success | Has Data | Quality | Response Time | Error |\n';
    report += '|---------|---------|----------|---------|----------------|------|\n';
    
    for (const result of dbResults) {
      const successEmoji = result.success ? '✅' : '❌';
      const dataEmoji = result.hasData ? '✅' : '❌';
      const qualityEmoji = 
        result.dataQuality === 'excellent' ? '🟢' :
        result.dataQuality === 'good' ? '🟡' :
        result.dataQuality === 'minimal' ? '🟠' :
        '🔴';
      report += `| ${result.barcode} | ${successEmoji} | ${dataEmoji} | ${qualityEmoji} ${result.dataQuality} | ${result.responseTime}ms | ${result.error || 'None'} |\n`;
    }
    report += '\n';
  }

  // Action items
  report += '## 🎯 ACTION ITEMS\n\n';

  // Databases to remove
  const toRemove = byStatus.not_working.filter(s => !s.requiresKey);
  if (toRemove.length > 0) {
    report += '### Databases to Remove\n\n';
    report += 'These databases are queried but NOT returning useful data:\n\n';
    for (const db of toRemove) {
      report += `1. **${db.database}** (Tier ${db.tier})\n`;
      report += `   - Issue: ${db.issues.join(', ')}\n`;
      report += `   - Action: Remove from \`truScoreOptimizedDatabase.ts\` query list\n\n`;
    }
  }

  // Databases needing API keys
  if (byStatus.requires_key.length > 0) {
    report += '### Databases Requiring API Keys\n\n';
    report += 'These databases require API keys but keys are not configured:\n\n';
    for (const db of byStatus.requires_key) {
      report += `1. **${db.database}** (Tier ${db.tier})\n`;
      report += `   - Action: Add API key to .env file OR remove from query list\n\n`;
    }
  }

  // Optimization recommendations
  report += '### Optimization Recommendations\n\n';
  report += '1. **Remove non-working databases** from query list to improve performance\n';
  report += '2. **Add API keys** for databases that require them (if free tier available)\n';
  report += '3. **Prioritize working databases** in query order\n';
  report += '4. **Cache results** from working databases to reduce API calls\n';
  report += '5. **Monitor API rate limits** for databases with high success rates\n';
  report += '6. **Use circuit breakers** for databases that frequently fail\n';

  return report;
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Starting COMPREHENSIVE database investigation...\n');
  console.log(`Testing ${DATABASE_SERVICES.length} databases with ${TEST_BARCODES.length} real-world barcodes\n`);

  // Get base product for enhancement/name-based queries
  let baseProduct: any = null;
  try {
    baseProduct = await getBaseProduct(TEST_BARCODES[0]);
    if (baseProduct) {
      console.log(`✅ Got base product for enhancement testing: ${baseProduct.product_name || 'Unknown'}\n`);
    }
  } catch (error) {
    console.log('⚠️  Could not get base product for enhancement testing\n');
  }

  // Test each database with each barcode
  for (const dbInfo of DATABASE_SERVICES) {
    console.log(`Testing ${dbInfo.name} (Tier ${dbInfo.tier}, ${dbInfo.queryType})...`);
    
    for (const barcode of TEST_BARCODES) {
      const result = await testDatabase(dbInfo, barcode, baseProduct);
      results.push(result);
      
      const status = result.success 
        ? (result.hasData ? `✅ Data (${result.dataQuality})` : '⚠️ No Data')
        : '❌ Failed';
      console.log(`  ${barcode}: ${status} (${result.responseTime}ms)`);
      
      if (result.error && !result.error.includes('Timeout')) {
        console.log(`    Error: ${result.error.substring(0, 100)}`);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log('');
  }

  // Generate summaries
  generateSummaries();

  // Generate and save report
  const report = generateReport();
  const reportPath = path.join(__dirname, '../DATABASE_INVESTIGATION_REPORT.md');
  fs.writeFileSync(reportPath, report, 'utf-8');

  console.log('✅ Investigation complete!');
  console.log(`📄 Report saved to: ${reportPath}`);
  console.log('\nSummary:');
  console.log(`- Working: ${Array.from(summaries.values()).filter(s => s.status === 'working').length}`);
  console.log(`- Partial: ${Array.from(summaries.values()).filter(s => s.status === 'partial').length}`);
  console.log(`- Requires Key: ${Array.from(summaries.values()).filter(s => s.status === 'requires_key').length}`);
  console.log(`- Not Working: ${Array.from(summaries.values()).filter(s => s.status === 'not_working').length}`);
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { testDatabase, generateReport, DATABASE_SERVICES, TEST_BARCODES };



