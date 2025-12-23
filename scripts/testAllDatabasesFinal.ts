/**
 * Final Comprehensive Database Test
 * Tests each database service individually with real queries
 */

import { checkFDARecalls } from '../src/services/fdaRecallService';
import { checkComprehensiveUSRecalls } from '../src/services/recallsGovService';
import { checkRASFFAlerts } from '../src/services/rasffService';
import { checkCFIARecalls } from '../src/services/cfiaRecallService';
import { checkCPSCRecalls } from '../src/services/cpscRecallService';
import { checkUKFSARecalls } from '../src/services/ukFsaRecallService';
import { checkDOLViolations } from '../src/services/dolEnforcementService';
import { checkILOViolations } from '../src/services/iloStatisticsService';

interface TestResult {
  name: string;
  status: 'working' | 'not_working' | 'error';
  resultsCount: number;
  responseTime: number;
  error?: string;
  note?: string;
}

async function testService(
  name: string,
  testFn: () => Promise<any[]>
): Promise<TestResult> {
  const startTime = Date.now();
  try {
    const results = await testFn();
    const responseTime = Date.now() - startTime;
    
    return {
      name,
      status: results.length > 0 ? 'working' : 'not_working',
      resultsCount: results.length,
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      name,
      status: 'error',
      resultsCount: 0,
      responseTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function runFinalTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔍 FINAL DATABASE TESTING - Individual Service Tests');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  const results: TestResult[] = [];

  // Test with known products that might have recalls
  console.log('📋 RECALL DATABASES');
  console.log('───────────────────────────────────────────────────────────────');

  // 1. FDA
  const fdaResult = await testService('FDA Recalls', async () => {
    return await checkFDARecalls('peanut butter', 'Jif', '034000000000');
  });
  results.push(fdaResult);
  console.log(`  ${fdaResult.status === 'working' ? '✅' : '❌'} FDA: ${fdaResult.resultsCount} results (${fdaResult.responseTime}ms)`);
  if (fdaResult.error) console.log(`     Error: ${fdaResult.error}`);

  // 2. USDA FSIS
  const usdaResult = await testService('USDA FSIS Recalls', async () => {
    return await checkComprehensiveUSRecalls('chicken', 'Tyson', '034000000000');
  });
  results.push(usdaResult);
  console.log(`  ${usdaResult.status === 'working' ? '✅' : '❌'} USDA FSIS: ${usdaResult.resultsCount} results (${usdaResult.responseTime}ms)`);
  if (usdaResult.error) console.log(`     Error: ${usdaResult.error}`);

  // 3. RASFF
  const rasffResult = await testService('RASFF Alerts', async () => {
    return await checkRASFFAlerts('chocolate', 'Ferrero', '7622210989488');
  });
  results.push(rasffResult);
  console.log(`  ${rasffResult.status === 'working' ? '✅' : '❌'} RASFF: ${rasffResult.resultsCount} results (${rasffResult.responseTime}ms)`);
  if (rasffResult.error) console.log(`     Error: ${rasffResult.error}`);
  if (rasffResult.status === 'not_working') console.log(`     Note: Web scraping may need HTML structure updates`);

  // 4. CFIA
  const cfiaResult = await testService('CFIA Recalls', async () => {
    return await checkCFIARecalls('milk', 'Natrel', '041303000000');
  });
  results.push(cfiaResult);
  console.log(`  ${cfiaResult.status === 'working' ? '✅' : '❌'} CFIA: ${cfiaResult.resultsCount} results (${cfiaResult.responseTime}ms)`);
  if (cfiaResult.error) console.log(`     Error: ${cfiaResult.error}`);

  // 5. CPSC
  const cpscResult = await testService('CPSC Recalls', async () => {
    return await checkCPSCRecalls('product', 'Brand', '034000000000');
  });
  results.push(cpscResult);
  console.log(`  ${cpscResult.status === 'working' ? '✅' : '❌'} CPSC: ${cpscResult.resultsCount} results (${cpscResult.responseTime}ms)`);
  if (cpscResult.error) console.log(`     Error: ${cpscResult.error}`);

  // 6. UK FSA
  const ukFsaResult = await testService('UK FSA Recalls', async () => {
    return await checkUKFSARecalls('chocolate', 'Cadbury', '034000000000');
  });
  results.push(ukFsaResult);
  console.log(`  ${ukFsaResult.status === 'working' ? '✅' : '❌'} UK FSA: ${ukFsaResult.resultsCount} results (${ukFsaResult.responseTime}ms)`);
  if (ukFsaResult.error) console.log(`     Error: ${ukFsaResult.error}`);
  if (ukFsaResult.status === 'not_working' || ukFsaResult.status === 'error') {
    console.log(`     Note: API endpoint may need verification or API may have changed`);
  }

  console.log('');
  console.log('📋 LABOR VIOLATION DATABASES');
  console.log('───────────────────────────────────────────────────────────────');

  // 7. DOL
  const dolResult = await testService('DOL Enforcement', async () => {
    return await checkDOLViolations('Nestle', 'Nestle');
  });
  results.push(dolResult);
  console.log(`  ${dolResult.status === 'working' ? '✅' : '❌'} DOL: ${dolResult.resultsCount} results (${dolResult.responseTime}ms)`);
  if (dolResult.error) console.log(`     Error: ${dolResult.error}`);

  // 8. ILO
  const iloResult = await testService('ILO Statistics', async () => {
    return await checkILOViolations('US', 'Nestle');
  });
  results.push(iloResult);
  console.log(`  ${iloResult.status === 'working' ? '✅' : '❌'} ILO: ${iloResult.resultsCount} results (${iloResult.responseTime}ms)`);
  if (iloResult.error) console.log(`     Error: ${iloResult.error}`);
  if (iloResult.status === 'not_working') {
    console.log(`     Note: ILO SDMX API requires proper dataflow IDs - currently disabled`);
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 FINAL RESULTS SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  const working = results.filter(r => r.status === 'working');
  const notWorking = results.filter(r => r.status === 'not_working');
  const errors = results.filter(r => r.status === 'error');

  console.log(`✅ Working Databases (${working.length}):`);
  working.forEach(r => {
    console.log(`   - ${r.name}: ${r.resultsCount} results (${r.responseTime}ms)`);
  });

  if (notWorking.length > 0) {
    console.log('');
    console.log(`⚠️  Databases Not Returning Results (${notWorking.length}):`);
    notWorking.forEach(r => {
      console.log(`   - ${r.name}: No results (${r.responseTime}ms)`);
      if (r.note) console.log(`     ${r.note}`);
    });
  }

  if (errors.length > 0) {
    console.log('');
    console.log(`❌ Databases With Errors (${errors.length}):`);
    errors.forEach(r => {
      console.log(`   - ${r.name}: ${r.error}`);
    });
  }

  // Save results
  const fs = require('fs');
  const path = require('path');
  const outputPath = path.join(__dirname, '..', 'DATABASE_TEST_FINAL_RESULTS.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log('');
  console.log(`📄 Results saved to: ${outputPath}`);

  return results;
}

runFinalTests().catch(console.error);

