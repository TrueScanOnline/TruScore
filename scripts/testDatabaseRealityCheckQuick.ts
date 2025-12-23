/**
 * Quick Database Reality Check - Tests subset for immediate results
 * 
 * Tests 5 barcodes against Tier 1 databases only (fastest test)
 */

/// <reference path="../global.d.ts" />

if (typeof (global as any).__DEV__ === 'undefined') {
  (global as any).__DEV__ = process.env.NODE_ENV !== 'production';
}

import * as fs from 'fs';
import * as path from 'path';

// Quick test - 5 barcodes, Tier 1 only
const QUICK_TEST_BARCODES = [
  '3017620422003', // Nutella (common)
  '5449000000996', // Coca-Cola
  '7622300992675', // Milka chocolate
  '9310354982466', // User barcode
  '9300694335947', // User barcode
];

// Tier 1 databases only (fastest)
const QUICK_TEST_DATABASES = [
  { name: 'Open Food Facts', importPath: '../src/services/openFoodFacts', function: 'fetchProductFromOFF', tier: 1 },
  { name: 'Open Beauty Facts', importPath: '../src/services/openBeautyFacts', function: 'fetchProductFromOBF', tier: 1 },
  { name: 'Open Pet Food Facts', importPath: '../src/services/openPetFoodFacts', function: 'fetchProductFromOPFF', tier: 1 },
  { name: 'Open Products Facts', importPath: '../src/services/openProductsFacts', function: 'fetchProductFromOPF', tier: 1 },
  { name: 'UPCitemdb', importPath: '../src/services/upcitemdb', function: 'fetchProductFromUPCitemdb', tier: 4 },
];

interface QuickResult {
  database: string;
  barcode: string;
  success: boolean;
  hasData: boolean;
  hasName: boolean;
  hasNutrition: boolean;
  hasIngredients: boolean;
  responseTime: number;
  error?: string;
}

const quickResults: QuickResult[] = [];

async function quickTest() {
  console.log('🚀 Quick Database Reality Check\n');
  console.log(`Testing ${QUICK_TEST_DATABASES.length} databases with ${QUICK_TEST_BARCODES.length} barcodes\n`);

  for (const dbInfo of QUICK_TEST_DATABASES) {
    console.log(`Testing ${dbInfo.name}...`);
    
    for (const barcode of QUICK_TEST_BARCODES) {
      const startTime = Date.now();
      const result: QuickResult = {
        database: dbInfo.name,
        barcode,
        success: false,
        hasData: false,
        hasName: false,
        hasNutrition: false,
        hasIngredients: false,
        responseTime: 0,
      };

      try {
        const serviceModule = await import(dbInfo.importPath);
        const fetchFunction = serviceModule[dbInfo.function];

        if (!fetchFunction) {
          result.error = 'Function not found';
          result.responseTime = Date.now() - startTime;
          quickResults.push(result);
          continue;
        }

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 10000)
        );

        const product = await Promise.race([
          fetchFunction(barcode),
          timeoutPromise
        ]) as any;

        result.success = true;
        result.responseTime = Date.now() - startTime;

        if (product && typeof product === 'object') {
          result.hasData = true;
          result.hasName = !!(product.product_name || product.name || product.title);
          result.hasNutrition = !!(product.nutriments || product.nutrition || product.nutrients);
          result.hasIngredients = !!(product.ingredients_text || product.ingredients);
        }

      } catch (error: any) {
        result.success = false;
        result.responseTime = Date.now() - startTime;
        result.error = error.message || String(error);
      }

      quickResults.push(result);
      
      const status = result.success 
        ? (result.hasData ? '✅' : '⚠️')
        : '❌';
      console.log(`  ${barcode}: ${status} ${result.responseTime}ms ${result.error || ''}`);
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('');
  }

  // Generate quick report
  let report = '# Quick Database Reality Check Results\n\n';
  report += `**Generated:** ${new Date().toISOString()}\n\n`;
  report += `**Barcodes Tested:** ${QUICK_TEST_BARCODES.join(', ')}\n\n`;
  report += `**Databases Tested:** ${QUICK_TEST_DATABASES.map(d => d.name).join(', ')}\n\n`;

  report += '## Results Summary\n\n';
  report += '| Database | Success Rate | Data Rate | Avg Time | Has Name | Has Nutrition | Has Ingredients |\n';
  report += '|----------|--------------|-----------|----------|----------|---------------|-----------------|\n';

  for (const dbInfo of QUICK_TEST_DATABASES) {
    const dbResults = quickResults.filter(r => r.database === dbInfo.name);
    const successRate = (dbResults.filter(r => r.success).length / dbResults.length * 100).toFixed(0);
    const dataRate = (dbResults.filter(r => r.hasData).length / dbResults.length * 100).toFixed(0);
    const avgTime = (dbResults.reduce((sum, r) => sum + r.responseTime, 0) / dbResults.length).toFixed(0);
    const hasNameRate = (dbResults.filter(r => r.hasName).length / dbResults.length * 100).toFixed(0);
    const hasNutritionRate = (dbResults.filter(r => r.hasNutrition).length / dbResults.length * 100).toFixed(0);
    const hasIngredientsRate = (dbResults.filter(r => r.hasIngredients).length / dbResults.length * 100).toFixed(0);

    report += `| ${dbInfo.name} | ${successRate}% | ${dataRate}% | ${avgTime}ms | ${hasNameRate}% | ${hasNutritionRate}% | ${hasIngredientsRate}% |\n`;
  }

  report += '\n## Detailed Results\n\n';
  report += '| Database | Barcode | Success | Has Data | Name | Nutrition | Ingredients | Time | Error |\n';
  report += '|----------|---------|---------|----------|------|-----------|-------------|------|-------|\n';

  for (const result of quickResults) {
    report += `| ${result.database} | ${result.barcode} | ${result.success ? '✅' : '❌'} | ${result.hasData ? '✅' : '❌'} | ${result.hasName ? '✅' : '❌'} | ${result.hasNutrition ? '✅' : '❌'} | ${result.hasIngredients ? '✅' : '❌'} | ${result.responseTime}ms | ${result.error || '-'} |\n`;
  }

  const reportPath = path.join(__dirname, '../DATABASE_REALITY_CHECK_QUICK.md');
  fs.writeFileSync(reportPath, report, 'utf-8');

  console.log('✅ Quick test complete!');
  console.log(`📄 Report saved to: ${reportPath}`);
}

quickTest().catch(console.error);
