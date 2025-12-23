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

import * as fs from 'fs';
import * as path from 'path';

// Test barcodes - real-world products from different categories
const TEST_BARCODES = [
  '9300675001113', // Real barcode from your test files (Coca-Cola)
  '9310645244839', // Real barcode from your test files (Tuna)
  '3017620422003', // Nutella (common product)
  '7622210969472', // Oreo cookies (common product)
  '5000159461125', // Coca-Cola (common product)
  '8001090311027', // Barilla pasta (common product)
];

// Database services mapped to their actual import paths and function names
const DATABASE_SERVICES = [
  // Tier 1: Gold Standard
  { name: 'Open Food Facts', importPath: '../src/services/openFoodFacts', function: 'fetchProductFromOFF', tier: 1 },
  { name: 'USDA FoodData Central', importPath: '../src/services/usdaFoodData', function: 'fetchProductFromUSDA', tier: 1, requiresKey: true },
  { name: 'Health Canada', importPath: '../src/services/healthCanadaDatabase', function: 'fetchProductFromHealthCanada', tier: 1 },
  { name: 'UK FSA', importPath: '../src/services/ukFsaDatabase', function: 'fetchProductFromUKFSA', tier: 1 },
  { name: 'EFSA', importPath: '../src/services/efsaDatabase', function: 'fetchProductFromEFSA', tier: 1 },
  { name: 'Open Beauty Facts', importPath: '../src/services/openBeautyFacts', function: 'fetchProductFromOBF', tier: 1 },
  { name: 'Open Pet Food Facts', importPath: '../src/services/openPetFoodFacts', function: 'fetchProductFromOPFF', tier: 1 },
  { name: 'Open Products Facts', importPath: '../src/services/openProductsFacts', function: 'fetchProductFromOPF', tier: 1 },
  
  // Tier 2: Enhancements
  { name: 'NZFCD', importPath: '../src/services/nzfcdDatabase', function: 'enhanceProductWithNZFCD', tier: 2, isEnhancement: true },
  { name: 'AFCD', importPath: '../src/services/afcdDatabase', function: 'enhanceProductWithAFCD', tier: 2, isEnhancement: true },
  { name: 'FoodAtlas', importPath: '../src/services/foodAtlasQueryService', function: 'queryFoodAtlasByProductName', tier: 2, requiresName: true },
  
  // Tier 3: Fallbacks
  { name: 'UPCitemdb', importPath: '../src/services/upcitemdb', function: 'fetchProductFromUPCitemdb', tier: 3 },
  { name: 'EAN-Search', importPath: '../src/services/eanSearchApi', function: 'fetchProductFromEANSearch', tier: 3 },
  { name: 'Barcode Spider', importPath: '../src/services/barcodeSpider', function: 'fetchProductFromBarcodeSpider', tier: 3 },
  { name: 'GoUPC', importPath: '../src/services/goUpcApi', function: 'fetchProductFromGoUpc', tier: 3 },
  { name: 'Barcode Monster', importPath: '../src/services/barcodeMonsterApi', function: 'fetchProductFromBarcodeMonster', tier: 3 },
  { name: 'UPC Database', importPath: '../src/services/upcDatabaseApi', function: 'fetchProductFromUPCDatabase', tier: 3 },
  { name: 'Barcode Lookup', importPath: '../src/services/barcodeLookupApi', function: 'fetchProductFromBarcodeLookup', tier: 3 },
  { name: 'EAN Data', importPath: '../src/services/eanDataApi', function: 'fetchProductFromEANData', tier: 3 },
  { name: 'Open GTIN DB', importPath: '../src/services/openGtindbApi', function: 'fetchProductFromOpenGtin', tier: 3 },
  { name: 'Open EAN', importPath: '../src/services/openEanApi', function: 'fetchProductFromOpenEAN', tier: 3 },
  { name: 'Buycott', importPath: '../src/services/buycottApi', function: 'fetchProductFromBuycott', tier: 3 },
  { name: 'Datakick', importPath: '../src/services/datakickApi', function: 'fetchProductFromDatakick', tier: 3 },
  { name: 'Product Open Data', importPath: '../src/services/productOpenDataApi', function: 'fetchProductFromProductOpenData', tier: 3 },
  { name: 'Barcode Lookup Com', importPath: '../src/services/barcodeLookupComApi', function: 'fetchProductFromBarcodeLookupCom', tier: 3 },
  { name: 'Food Repo', importPath: '../src/services/foodRepoApi', function: 'fetchProductFromFoodRepo', tier: 3 },
  { name: 'World Food Database', importPath: '../src/services/worldFoodDatabaseApi', function: 'enhanceProductWithWorldFoodDatabase', tier: 3, isEnhancement: true },
  { name: 'FoodB', importPath: '../src/services/foodbApi', function: 'enhanceProductWithFooDB', tier: 3, isEnhancement: true },
  
  // Nutrition APIs (require API keys)
  { name: 'Edamam', importPath: '../src/services/edamamApi', function: 'fetchProductFromEdamam', tier: 3, requiresKey: true },
  { name: 'Nutritionix', importPath: '../src/services/nutritionixApi', function: 'fetchProductFromNutritionix', tier: 3, requiresKey: true },
  { name: 'Spoonacular', importPath: '../src/services/spoonacularApi', function: 'fetchProductFromSpoonacular', tier: 3, requiresKey: true },
  
  // Retail APIs
  { name: 'Tesco Labs', importPath: '../src/services/tescoLabsApi', function: 'fetchProductFromTesco', tier: 3, requiresKey: true },
  { name: 'Walmart Open API', importPath: '../src/services/walmartOpenApi', function: 'fetchProductFromWalmart', tier: 3, requiresKey: true },
  
  // Regional
  { name: 'NZ Stores', importPath: '../src/services/nzStoreApi', function: 'fetchProductFromNZStores', tier: 2 },
  { name: 'AU Retailers', importPath: '../src/services/auRetailerScraping', function: 'fetchProductFromAURetailers', tier: 2 },
  
  // GS1 (requires subscription)
  { name: 'GS1 Data Source', importPath: '../src/services/gs1DataSource', function: 'fetchProductFromGS1', tier: 1, requiresKey: true },
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
    } else if (dbInfo.requiresName) {
      // Name-based queries need product name
      const productName = baseProduct?.product_name || baseProduct?.name || 'Test Product';
      product = await Promise.race([
        fetchFunction(productName, 'AU'),
        timeoutPromise


