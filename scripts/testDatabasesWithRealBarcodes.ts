/**
 * Aggressive Database Testing with Real-World Barcodes
 * Tests each database service with actual product barcodes
 */

import { checkFDARecalls } from '../src/services/fdaRecallService';
import { checkComprehensiveUSRecalls } from '../src/services/recallsGovService';
import { checkRASFFAlerts } from '../src/services/rasffService';
import { checkCFIARecalls } from '../src/services/cfiaRecallService';
import { checkCPSCRecalls } from '../src/services/cpscRecallService';
import { checkUKFSARecalls } from '../src/services/ukFsaRecallService';
import { checkDOLViolations } from '../src/services/dolEnforcementService';
import { checkILOViolations } from '../src/services/iloStatisticsService';

// Real-world barcodes for testing
const TEST_BARCODES = [
  { barcode: '034000000000', productName: 'Hershey Chocolate Bar', brand: 'Hershey' },
  { barcode: '7622210989488', productName: 'Nutella', brand: 'Ferrero' },
  { barcode: '030000011000', productName: 'Yoplait Yogurt', brand: 'Yoplait' },
  { barcode: '038000010000', productName: 'Kellogg Cereal', brand: 'Kellogg' },
  { barcode: '041303000000', productName: 'Organic Valley Milk', brand: 'Organic Valley' },
  { barcode: '5150024024', productName: 'Jif Peanut Butter', brand: 'Jif' },
  { barcode: '034000000001', productName: 'Tyson Chicken', brand: 'Tyson' },
  { barcode: '034000000002', productName: 'Perdue Chicken', brand: 'Perdue' },
];

interface TestResult {
  database: string;
  status: 'working' | 'not_working' | 'error';
  resultsCount: number;
  responseTime: number;
  error?: string;
  sampleResult?: any;
  testedWith: string[];
}

async function testDatabase(
  name: string,
  testFn: (productName: string, brand: string, barcode: string) => Promise<any[]>,
  testCases: typeof TEST_BARCODES
): Promise<TestResult> {
  const startTime = Date.now();
  const testedWith: string[] = [];
  let totalResults = 0;
  let lastError: string | undefined;
  let sampleResult: any = undefined;

  for (const testCase of testCases.slice(0, 3)) { // Test with first 3 barcodes
    try {
      testedWith.push(`${testCase.brand} (${testCase.barcode})`);
      const results = await testFn(testCase.productName, testCase.brand, testCase.barcode);
      totalResults += results.length;
      if (results.length > 0 && !sampleResult) {
        sampleResult = results[0];
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      testedWith.push(`${testCase.brand} (ERROR)`);
    }
  }

  const responseTime = Date.now() - startTime;
  
  return {
    database: name,
    status: lastError ? 'error' : (totalResults > 0 ? 'working' : 'not_working'),
    resultsCount: totalResults,
    responseTime,
    error: lastError,
    sampleResult,
    testedWith,
  };
}

async function runAggressiveTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔍 AGGRESSIVE DATABASE TESTING WITH REAL-WORLD BARCODES');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  const results: TestResult[] = [];

  // Test Recall Databases
  console.log('📋 TESTING RECALL DATABASES');
  console.log('───────────────────────────────────────────────────────────────');

  const fdaResult = await testDatabase('FDA Recalls', checkFDARecalls, TEST_BARCODES);
  results.push(fdaResult);
  console.log(`  ${fdaResult.status === 'working' ? '✅' : fdaResult.status === 'error' ? '❌' : '⚠️'} FDA: ${fdaResult.resultsCount} results (${fdaResult.responseTime}ms)`);
  if (fdaResult.error) console.log(`     Error: ${fdaResult.error}`);
  if (fdaResult.sampleResult) console.log(`     Sample: ${JSON.stringify(fdaResult.sampleResult).substring(0, 100)}...`);

  const usdaResult = await testDatabase('USDA FSIS Recalls', checkComprehensiveUSRecalls, TEST_BARCODES);
  results.push(usdaResult);
  console.log(`  ${usdaResult.status === 'working' ? '✅' : usdaResult.status === 'error' ? '❌' : '⚠️'} USDA FSIS: ${usdaResult.resultsCount} results (${usdaResult.responseTime}ms)`);
  if (usdaResult.error) console.log(`     Error: ${usdaResult.error}`);

  const rasffResult = await testDatabase('RASFF Alerts', checkRASFFAlerts, TEST_BARCODES);
  results.push(rasffResult);
  console.log(`  ${rasffResult.status === 'working' ? '✅' : rasffResult.status === 'error' ? '❌' : '⚠️'} RASFF: ${rasffResult.resultsCount} results (${rasffResult.responseTime}ms)`);
  if (rasffResult.error) console.log(`     Error: ${rasffResult.error}`);

  const cfiaResult = await testDatabase('CFIA Recalls', checkCFIARecalls, TEST_BARCODES);
  results.push(cfiaResult);
  console.log(`  ${cfiaResult.status === 'working' ? '✅' : cfiaResult.status === 'error' ? '❌' : '⚠️'} CFIA: ${cfiaResult.resultsCount} results (${cfiaResult.responseTime}ms)`);
  if (cfiaResult.error) console.log(`     Error: ${cfiaResult.error}`);

  const cpscResult = await testDatabase('CPSC Recalls', checkCPSCRecalls, TEST_BARCODES);
  results.push(cpscResult);
  console.log(`  ${cpscResult.status === 'working' ? '✅' : cpscResult.status === 'error' ? '❌' : '⚠️'} CPSC: ${cpscResult.resultsCount} results (${cpscResult.responseTime}ms)`);
  if (cpscResult.error) console.log(`     Error: ${cpscResult.error}`);

  const ukFsaResult = await testDatabase('UK FSA Recalls', checkUKFSARecalls, TEST_BARCODES);
  results.push(ukFsaResult);
  console.log(`  ${ukFsaResult.status === 'working' ? '✅' : ukFsaResult.status === 'error' ? '❌' : '⚠️'} UK FSA: ${ukFsaResult.resultsCount} results (${ukFsaResult.responseTime}ms)`);
  if (ukFsaResult.error) console.log(`     Error: ${ukFsaResult.error}`);

  console.log('');
  console.log('📋 TESTING LABOR VIOLATION DATABASES');
  console.log('───────────────────────────────────────────────────────────────');

  const dolResult = await testDatabase('DOL Enforcement', async (productName, brand) => {
    return await checkDOLViolations(brand, brand);
  }, TEST_BARCODES);
  results.push(dolResult);
  console.log(`  ${dolResult.status === 'working' ? '✅' : dolResult.status === 'error' ? '❌' : '⚠️'} DOL: ${dolResult.resultsCount} results (${dolResult.responseTime}ms)`);
  if (dolResult.error) console.log(`     Error: ${dolResult.error}`);

  const iloResult = await testDatabase('ILO Statistics', async (productName, brand) => {
    return await checkILOViolations('US', brand);
  }, TEST_BARCODES);
  results.push(iloResult);
  console.log(`  ${iloResult.status === 'working' ? '✅' : iloResult.status === 'error' ? '❌' : '⚠️'} ILO: ${iloResult.resultsCount} results (${iloResult.responseTime}ms)`);
  if (iloResult.error) console.log(`     Error: ${iloResult.error}`);

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 FINAL RESULTS');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  const working = results.filter(r => r.status === 'working');
  const notWorking = results.filter(r => r.status === 'not_working');
  const errors = results.filter(r => r.status === 'error');

  console.log(`✅ WORKING DATABASES (${working.length}):`);
  working.forEach(r => {
    console.log(`   - ${r.database}: ${r.resultsCount} results (${r.responseTime}ms)`);
    console.log(`     Tested with: ${r.testedWith.join(', ')}`);
  });

  if (notWorking.length > 0) {
    console.log('');
    console.log(`⚠️  DATABASES NOT RETURNING RESULTS (${notWorking.length}):`);
    notWorking.forEach(r => {
      console.log(`   - ${r.database}: 0 results (${r.responseTime}ms)`);
      console.log(`     Tested with: ${r.testedWith.join(', ')}`);
    });
  }

  if (errors.length > 0) {
    console.log('');
    console.log(`❌ DATABASES WITH ERRORS (${errors.length}):`);
    errors.forEach(r => {
      console.log(`   - ${r.database}: ${r.error}`);
      console.log(`     Tested with: ${r.testedWith.join(', ')}`);
    });
  }

  // Save results
  const fs = require('fs');
  const path = require('path');
  const outputPath = path.join(__dirname, '..', 'DATABASE_TEST_RESULTS_REAL_BARCODES.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log('');
  console.log(`📄 Detailed results saved to: ${outputPath}`);

  return results;
}

runAggressiveTests().catch(console.error);
