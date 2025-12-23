/**
 * Comprehensive Database Testing Script
 * Tests each database individually to verify which return results
 * 
 * Usage: npx ts-node scripts/testAllDatabases.ts
 */

import { checkFDARecalls } from '../src/services/fdaRecallService';
import { checkComprehensiveUSRecalls } from '../src/services/recallsGovService';
import { checkRASFFAlerts } from '../src/services/rasffService';
import { checkCFIARecalls } from '../src/services/cfiaRecallService';
import { checkCPSCRecalls } from '../src/services/cpscRecallService';
import { checkUKFSARecalls } from '../src/services/ukFsaRecallService';
import { checkDOLViolations } from '../src/services/dolEnforcementService';
import { checkILOViolations } from '../src/services/iloStatisticsService';

interface DatabaseTestResult {
  name: string;
  status: 'working' | 'not_working' | 'partial';
  resultsCount: number;
  error?: string;
  responseTime: number;
  sampleData?: any;
}

const TEST_PRODUCTS = [
  { name: 'Chocolate Bar', brand: 'Hershey', barcode: '034000000000' },
  { name: 'Coffee', brand: 'Starbucks', barcode: '7622210989488' },
  { name: 'Yogurt', brand: 'Yoplait', barcode: '030000011000' },
  { name: 'Cereal', brand: 'Kellogg', barcode: '038000010000' },
  { name: 'Milk', brand: 'Organic Valley', barcode: '041303000000' },
];

async function testDatabase(
  name: string,
  testFn: () => Promise<any[]>
): Promise<DatabaseTestResult> {
  const startTime = Date.now();
  try {
    const results = await testFn();
    const responseTime = Date.now() - startTime;
    
    return {
      name,
      status: results.length > 0 ? 'working' : 'not_working',
      resultsCount: results.length,
      responseTime,
      sampleData: results.length > 0 ? results[0] : undefined,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      name,
      status: 'not_working',
      resultsCount: 0,
      error: errorMessage,
      responseTime,
    };
  }
}

async function testAllDatabases() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔍 COMPREHENSIVE DATABASE TESTING');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  const results: DatabaseTestResult[] = [];

  // Test Recall Databases
  console.log('📋 TESTING RECALL DATABASES');
  console.log('───────────────────────────────────────────────────────────────');

  // 1. FDA Recalls
  console.log('Testing FDA Recalls...');
  const fdaResult = await testDatabase('FDA Recalls', async () => {
    return await checkFDARecalls('Chocolate', 'Hershey', '034000000000');
  });
  results.push(fdaResult);
  console.log(`  ✅ FDA: ${fdaResult.resultsCount} results, ${fdaResult.responseTime}ms`);
  if (fdaResult.error) console.log(`     Error: ${fdaResult.error}`);

  // 2. USDA FSIS Recalls (via Comprehensive US Recalls)
  console.log('Testing USDA FSIS Recalls...');
  const usdaResult = await testDatabase('USDA FSIS Recalls', async () => {
    return await checkComprehensiveUSRecalls('Chicken', 'Tyson', '034000000000');
  });
  results.push(usdaResult);
  console.log(`  ✅ USDA FSIS: ${usdaResult.resultsCount} results, ${usdaResult.responseTime}ms`);
  if (usdaResult.error) console.log(`     Error: ${usdaResult.error}`);

  // 3. RASFF Alerts
  console.log('Testing RASFF Alerts...');
  const rasffResult = await testDatabase('RASFF Alerts', async () => {
    return await checkRASFFAlerts('Chocolate', 'Ferrero', '7622210989488');
  });
  results.push(rasffResult);
  console.log(`  ✅ RASFF: ${rasffResult.resultsCount} results, ${rasffResult.responseTime}ms`);
  if (rasffResult.error) console.log(`     Error: ${rasffResult.error}`);

  // 4. CFIA Recalls
  console.log('Testing CFIA Recalls...');
  const cfiaResult = await testDatabase('CFIA Recalls', async () => {
    return await checkCFIARecalls('Milk', 'Natrel', '041303000000');
  });
  results.push(cfiaResult);
  console.log(`  ✅ CFIA: ${cfiaResult.resultsCount} results, ${cfiaResult.responseTime}ms`);
  if (cfiaResult.error) console.log(`     Error: ${cfiaResult.error}`);

  // 5. CPSC Recalls
  console.log('Testing CPSC Recalls...');
  const cpscResult = await testDatabase('CPSC Recalls', async () => {
    return await checkCPSCRecalls('Product', 'Brand', '034000000000');
  });
  results.push(cpscResult);
  console.log(`  ✅ CPSC: ${cpscResult.resultsCount} results, ${cpscResult.responseTime}ms`);
  if (cpscResult.error) console.log(`     Error: ${cpscResult.error}`);

  // 6. UK FSA Recalls
  console.log('Testing UK FSA Recalls...');
  const ukFsaResult = await testDatabase('UK FSA Recalls', async () => {
    return await checkUKFSARecalls('Chocolate', 'Cadbury', '034000000000');
  });
  results.push(ukFsaResult);
  console.log(`  ✅ UK FSA: ${ukFsaResult.resultsCount} results, ${ukFsaResult.responseTime}ms`);
  if (ukFsaResult.error) console.log(`     Error: ${ukFsaResult.error}`);

  console.log('');
  console.log('📋 TESTING LABOR VIOLATION DATABASES');
  console.log('───────────────────────────────────────────────────────────────');

  // 7. DOL Enforcement
  console.log('Testing DOL Enforcement...');
  const dolResult = await testDatabase('DOL Enforcement', async () => {
    return await checkDOLViolations('Nestle', 'Nestle');
  });
  results.push(dolResult);
  console.log(`  ✅ DOL: ${dolResult.resultsCount} results, ${dolResult.responseTime}ms`);
  if (dolResult.error) console.log(`     Error: ${dolResult.error}`);

  // 8. ILO Statistics
  console.log('Testing ILO Statistics...');
  const iloResult = await testDatabase('ILO Statistics', async () => {
    return await checkILOViolations('US', 'Nestle');
  });
  results.push(iloResult);
  console.log(`  ✅ ILO: ${iloResult.resultsCount} results, ${iloResult.responseTime}ms`);
  if (iloResult.error) console.log(`     Error: ${iloResult.error}`);

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  const working = results.filter(r => r.status === 'working');
  const notWorking = results.filter(r => r.status === 'not_working');
  const partial = results.filter(r => r.status === 'partial');

  console.log(`✅ Working Databases (${working.length}):`);
  working.forEach(r => {
    console.log(`   - ${r.name}: ${r.resultsCount} results (${r.responseTime}ms)`);
  });

  console.log('');
  console.log(`❌ Not Working Databases (${notWorking.length}):`);
  notWorking.forEach(r => {
    console.log(`   - ${r.name}: ${r.error || 'No results returned'}`);
  });

  if (partial.length > 0) {
    console.log('');
    console.log(`⚠️  Partial Databases (${partial.length}):`);
    partial.forEach(r => {
      console.log(`   - ${r.name}: ${r.resultsCount} results (${r.responseTime}ms)`);
    });
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');

  // Write detailed results to file
  const fs = require('fs');
  const path = require('path');
  const outputPath = path.join(__dirname, '..', 'DATABASE_TEST_RESULTS.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`📄 Detailed results saved to: ${outputPath}`);

  return results;
}

// Run tests
testAllDatabases()
  .then(results => {
    const notWorking = results.filter(r => r.status === 'not_working');
    if (notWorking.length > 0) {
      console.log('');
      console.log('⚠️  Databases requiring fixes:');
      notWorking.forEach(r => {
        console.log(`   - ${r.name}`);
      });
      process.exit(1);
    } else {
      console.log('');
      console.log('✅ All databases are working!');
      process.exit(0);
    }
  })
  .catch(error => {
    console.error('❌ Test script error:', error);
    process.exit(1);
  });

