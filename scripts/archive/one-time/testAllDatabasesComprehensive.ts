/**
 * Comprehensive Database Investigation Script
 * Tests ALL databases/APIs used by TrueScan with real-world barcodes
 * 
 * This script will:
 * 1. Test each database with real-world barcodes
 * 2. Document which databases return useful data
 * 3. Identify databases that are queried but return no data
 * 4. Provide solutions for non-working databases
 */

/// <reference path="../global.d.ts" />

// Initialize Expo/React Native globals BEFORE anything else
if (typeof (global as any).__DEV__ === 'undefined') {
  (global as any).__DEV__ = process.env.NODE_ENV !== 'production';
}

// Set Expo environment variables
if (!process.env.EXPO_OS) {
  process.env.EXPO_OS = 'node';
}

// Initialize React Native globals (required by Expo)
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

// Test barcodes - real-world products from different categories
const TEST_BARCODES = [
  '9300675001113', // Real barcode from test files (Coca-Cola)
  '9310645244839', // Real barcode from test files (Tuna)
  '3017620422003', // Nutella (common product)
  '7622210969472', // Oreo cookies (common product)
  '5000159461125', // Coca-Cola (common product)
];

// Database services mapped to their actual import paths and function names
// Based on truScoreOptimizedDatabase.ts
const DATABASE_SERVICES = [
  // Tier 1: Gold Standard
  { name: 'Open Food Facts', importPath: '../src/services/openFoodFacts', function: 'fetchProductFromOFF', tier: 1, requiresKey: false },
  { name: 'Open Beauty Facts', importPath: '../src/services/openBeautyFacts', function: 'fetchProductFromOBF', tier: 1, requiresKey: false },
  { name: 'Open Pet Food Facts', importPath: '../src/services/openPetFoodFacts', function: 'fetchProductFromOPFF', tier: 1, requiresKey: false },
  { name: 'Open Products Facts', importPath: '../src/services/openProductsFacts', function: 'fetchProductFromOPF', tier: 1, requiresKey: false },
  { name: 'USDA FoodData Central', importPath: '../src/services/usdaFoodData', function: 'fetchProductFromUSDA', tier: 1, requiresKey: true },
  { name: 'Health Canada', importPath: '../src/services/healthCanadaDatabase', function: 'fetchProductFromHealthCanada', tier: 1, requiresKey: false },
  { name: 'UK FSA', importPath: '../src/services/ukFsaDatabase', function: 'fetchProductFromUKFSA', tier: 1, requiresKey: false },
  { name: 'EFSA', importPath: '../src/services/efsaDatabase', function: 'fetchProductFromEFSA', tier: 1, requiresKey: false },
  { name: 'GS1 Data Source', importPath: '../src/services/gs1DataSource', function: 'fetchProductFromGS1', tier: 1, requiresKey: true },
  
  // Tier 3: Fallbacks
  { name: 'UPCitemdb', importPath: '../src/services/upcitemdb', function: 'fetchProductFromUPCitemdb', tier: 3, requiresKey: false },
  { name: 'EAN-Search', importPath: '../src/services/eanSearchApi', function: 'fetchProductFromEANSearch', tier: 3, requiresKey: true },
  { name: 'Barcode Spider', importPath: '../src/services/barcodeSpider', function: 'fetchProductFromBarcodeSpider', tier: 3, requiresKey: false },
  { name: 'GoUPC', importPath: '../src/services/goUpcApi', function: 'fetchProductFromGoUpc', tier: 3, requiresKey: false },
  { name: 'Barcode Monster', importPath: '../src/services/barcodeMonsterApi', function: 'fetchProductFromBarcodeMonster', tier: 3, requiresKey: false },
  { name: 'UPC Database', importPath: '../src/services/upcDatabaseApi', function: 'fetchProductFromUPCDatabase', tier: 3, requiresKey: true },
  { name: 'Barcode Lookup', importPath: '../src/services/barcodeLookupApi', function: 'fetchProductFromBarcodeLookup', tier: 3, requiresKey: true },
  { name: 'EAN Data', importPath: '../src/services/eanDataApi', function: 'fetchProductFromEANData', tier: 3, requiresKey: true },
  { name: 'Open GTIN DB', importPath: '../src/services/openGtindbApi', function: 'fetchProductFromOpenGtin', tier: 3, requiresKey: false },
  { name: 'Open EAN', importPath: '../src/services/openEanApi', function: 'fetchProductFromOpenEAN', tier: 3, requiresKey: false },
  { name: 'Buycott', importPath: '../src/services/buycottApi', function: 'fetchProductFromBuycott', tier: 3, requiresKey: false },
  { name: 'Datakick', importPath: '../src/services/datakickApi', function: 'fetchProductFromDatakick', tier: 3, requiresKey: false },
  { name: 'Product Open Data', importPath: '../src/services/productOpenDataApi', function: 'fetchProductFromProductOpenData', tier: 3, requiresKey: false },
  { name: 'Barcode Lookup Com', importPath: '../src/services/barcodeLookupComApi', function: 'fetchProductFromBarcodeLookupCom', tier: 3, requiresKey: true },
  { name: 'Food Repo', importPath: '../src/services/foodRepoApi', function: 'fetchProductFromFoodRepo', tier: 3, requiresKey: false },
  { name: 'World Food Database', importPath: '../src/services/worldFoodDatabaseApi', function: 'enhanceProductWithWorldFoodDatabase', tier: 3, requiresKey: false, isEnhancement: true },
  { name: 'FoodB', importPath: '../src/services/foodbApi', function: 'enhanceProductWithFooDB', tier: 3, requiresKey: false, isEnhancement: true },
  
  // Nutrition APIs (require API keys)
  { name: 'Edamam', importPath: '../src/services/edamamApi', function: 'fetchProductFromEdamam', tier: 3, requiresKey: true },
  { name: 'Nutritionix', importPath: '../src/services/nutritionixApi', function: 'fetchProductFromNutritionix', tier: 3, requiresKey: true },
  { name: 'Spoonacular', importPath: '../src/services/spoonacularApi', function: 'fetchProductFromSpoonacular', tier: 3, requiresKey: true },
  
  // Retail APIs
  { name: 'Tesco Labs', importPath: '../src/services/tescoLabsApi', function: 'fetchProductFromTesco', tier: 3, requiresKey: true },
  { name: 'Walmart Open API', importPath: '../src/services/walmartOpenApi', function: 'fetchProductFromWalmart', tier: 3, requiresKey: true },
  { name: 'Best Buy', importPath: '../src/services/bestBuyApi', function: 'fetchProductFromBestBuy', tier: 3, requiresKey: true },
  
  // Regional
  { name: 'NZ Stores', importPath: '../src/services/nzStoreApi', function: 'fetchProductFromNZStores', tier: 2, requiresKey: false },
  { name: 'AU Retailers', importPath: '../src/services/auRetailerScraping', function: 'fetchProductFromAURetailers', tier: 2, requiresKey: false },
];

interface TestResult {
  database: string;
  barcode: string;
  success: boolean;
  hasData: boolean;
  dataFields: string[];
  error?: string;
  responseTime: number;
  requiresKey?: boolean;
  tier: number;
  isEnhancement?: boolean;
}

interface DatabaseSummary {
  database: string;
  tier: number;
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
}

const results: TestResult[] = [];
const summaries: Map<string, DatabaseSummary> = new Map();

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
    responseTime: 0,
    requiresKey: dbInfo.requiresKey,
    tier: dbInfo.tier,
    isEnhancement: dbInfo.isEnhancement,
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
      setTimeout(() => reject(new Error('Timeout after 10 seconds')), 10000)
    );

    let product: any;
    
    // Handle different function signatures
    if (dbInfo.isEnhancement && baseProduct) {
      // Enhancement functions take a product as parameter
      product = await Promise.race([
        fetchFunction(baseProduct),
        timeoutPromise
      ]);
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
      result.hasData = true;
      
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
      const hasName = product.product_name || product.name || product.title;
      const hasNutrition = product.nutriments || product.nutrition || product.nutrients;
      const hasIngredients = product.ingredients_text || product.ingredients;
      
      if (!hasName && !hasNutrition && !hasIngredients) {
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
    if (result.error.includes('API key') || result.error.includes('authentication') || result.error.includes('not configured')) {
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
    };

    // Determine status
    if (summary.dataReturns > 0) {
      summary.status = summary.dataReturns === summary.totalTests ? 'working' : 'partial';
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
      summary.recommendations.push('Consider removing from query list or fixing API integration');
      summary.recommendations.push('Check if API endpoint has changed or requires authentication');
      summary.recommendations.push('Verify API is still operational');
    } else if (summary.status === 'requires_key') {
      summary.recommendations.push('API key required - add to .env file');
      summary.recommendations.push('Check if free tier is available');
      summary.recommendations.push('Consider removing if no free tier available');
    } else if (summary.status === 'partial') {
      summary.recommendations.push('Works for some barcodes but not all - keep in fallback tier');
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
  let report = '# Database Investigation Report\n\n';
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

  // Detailed results by tier
  report += '## Results by Tier\n\n';

  for (let tier = 1; tier <= 3; tier++) {
    const tierDbs = Array.from(summaries.values()).filter(s => s.tier === tier);
    if (tierDbs.length === 0) continue;

    report += `### Tier ${tier} Databases\n\n`;
    report += '| Database | Status | Success Rate | Data Returns | Avg Response | Issues |\n';
    report += '|----------|--------|--------------|--------------|--------------|--------|\n';

    for (const summary of tierDbs) {
      const successRate = `${((summary.successes / summary.totalTests) * 100).toFixed(0)}%`;
      const dataRate = `${summary.dataReturns}/${summary.totalTests}`;
      const avgTime = `${summary.averageResponseTime.toFixed(0)}ms`;
      const statusEmoji = 
        summary.status === 'working' ? '✅' :
        summary.status === 'partial' ? '⚠️' :
        summary.status === 'requires_key' ? '🔑' :
        '❌';
      
      report += `| ${summary.database} | ${statusEmoji} ${summary.status} | ${successRate} | ${dataRate} | ${avgTime} | ${summary.issues.join('; ') || 'None'} |\n`;
    }
    report += '\n';
  }

  // Detailed results for each database
  report += '## Detailed Results\n\n';

  for (const summary of Array.from(summaries.values()).sort((a, b) => a.tier - b.tier)) {
    report += `### ${summary.database} (Tier ${summary.tier})\n\n`;
    report += `**Status:** ${summary.status}\n\n`;
    report += `**Statistics:**\n`;
    report += `- Total Tests: ${summary.totalTests}\n`;
    report += `- Successes: ${summary.successes}\n`;
    report += `- Failures: ${summary.failures}\n`;
    report += `- Data Returns: ${summary.dataReturns}\n`;
    report += `- No Data Returns: ${summary.noDataReturns}\n`;
    report += `- Average Response Time: ${summary.averageResponseTime.toFixed(0)}ms\n`;
    report += `- Requires API Key: ${summary.requiresKey ? 'Yes' : 'No'}\n\n`;

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
    report += '| Barcode | Success | Has Data | Response Time | Error |\n';
    report += '|---------|---------|----------|----------------|------|\n';
    
    for (const result of dbResults) {
      const successEmoji = result.success ? '✅' : '❌';
      const dataEmoji = result.hasData ? '✅' : '❌';
      report += `| ${result.barcode} | ${successEmoji} | ${dataEmoji} | ${result.responseTime}ms | ${result.error || 'None'} |\n`;
    }
    report += '\n';
  }

  // Recommendations section
  report += '## Overall Recommendations\n\n';

  // Databases to remove
  const toRemove = byStatus.not_working.filter(s => !s.requiresKey);
  if (toRemove.length > 0) {
    report += '### Databases to Remove or Fix\n\n';
    for (const db of toRemove) {
      report += `- **${db.database}**: ${db.issues.join(', ')}\n`;
    }
    report += '\n';
  }

  // Databases needing API keys
  if (byStatus.requires_key.length > 0) {
    report += '### Databases Requiring API Keys\n\n';
    for (const db of byStatus.requires_key) {
      report += `- **${db.database}**: Add API key to .env file or remove from query list\n`;
    }
    report += '\n';
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
  console.log('🔍 Starting comprehensive database investigation...\n');
  console.log(`Testing ${DATABASE_SERVICES.length} databases with ${TEST_BARCODES.length} barcodes\n`);

  // First, get a base product from Open Food Facts for enhancement functions
  let baseProduct: any = null;
  try {
    const { fetchProductFromOFF } = await import('../src/services/openFoodFacts');
    baseProduct = await fetchProductFromOFF(TEST_BARCODES[0]);
    if (baseProduct) {
      console.log(`✅ Got base product for enhancement testing: ${baseProduct.product_name || 'Unknown'}\n`);
    }
  } catch (error) {
    console.log('⚠️  Could not get base product for enhancement testing\n');
  }

  // Test each database with each barcode
  for (const dbInfo of DATABASE_SERVICES) {
    console.log(`Testing ${dbInfo.name} (Tier ${dbInfo.tier})...`);
    
    for (const barcode of TEST_BARCODES) {
      const result = await testDatabase(dbInfo, barcode, baseProduct);
      results.push(result);
      
      const status = result.success 
        ? (result.hasData ? '✅ Data' : '⚠️ No Data')
        : '❌ Failed';
      console.log(`  ${barcode}: ${status} (${result.responseTime}ms)`);
      
      if (result.error && !result.error.includes('Timeout')) {
        console.log(`    Error: ${result.error.substring(0, 100)}`);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
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



