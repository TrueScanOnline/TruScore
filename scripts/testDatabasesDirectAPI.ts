/**
 * Direct API Testing Script
 * Tests each database API directly to verify endpoints and responses
 * 
 * Usage: npx ts-node scripts/testDatabasesDirectAPI.ts
 */

interface APITestResult {
  name: string;
  endpoint: string;
  status: 'working' | 'not_working' | 'error';
  httpStatus?: number;
  responseTime: number;
  hasData: boolean;
  responseSize: number;
  error?: string;
  sampleResponse?: any;
}

// Known products with recalls for testing
const TEST_CASES = {
  fda: { productName: 'peanut butter', brand: 'Jif', barcode: '5150024024' },
  usda: { productName: 'chicken', brand: 'Tyson', barcode: '034000000000' },
  rasff: { productName: 'chocolate', brand: 'Ferrero', barcode: '7622210989488' },
  cfia: { productName: 'milk', brand: 'Natrel', barcode: '041303000000' },
  cpsc: { productName: 'product', brand: 'Brand', barcode: '034000000000' },
  ukfsa: { productName: 'chocolate', brand: 'Cadbury', barcode: '034000000000' },
  dol: { companyName: 'Nestle', brand: 'Nestle' },
  ilo: { countryCode: 'US', companyName: 'Nestle' },
};

async function testAPIDirect(
  name: string,
  endpoint: string,
  options?: RequestInit
): Promise<APITestResult> {
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(endpoint, {
      ...options,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    const responseText = await response.text();
    const responseSize = responseText.length;
    let hasData = false;
    let sampleResponse: any = null;
    
    try {
      const json = JSON.parse(responseText);
      hasData = json && (
        (Array.isArray(json) && json.length > 0) ||
        (json.results && Array.isArray(json.results) && json.results.length > 0) ||
        (json.data && Array.isArray(json.data) && json.data.length > 0) ||
        (json.items && Array.isArray(json.items) && json.items.length > 0) ||
        Object.keys(json).length > 0
      );
      sampleResponse = hasData ? json : null;
    } catch {
      // Not JSON, check if HTML/text has content
      hasData = responseText.length > 100 && !responseText.includes('404') && !responseText.includes('Not Found');
      sampleResponse = responseText.substring(0, 200);
    }
    
    return {
      name,
      endpoint,
      status: response.ok && hasData ? 'working' : response.ok ? 'not_working' : 'error',
      httpStatus: response.status,
      responseTime,
      hasData,
      responseSize,
      sampleResponse: hasData ? sampleResponse : undefined,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      name,
      endpoint,
      status: 'error',
      responseTime,
      hasData: false,
      responseSize: 0,
      error: errorMessage,
    };
  }
}

async function testAllAPIs() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔍 DIRECT API TESTING');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  const results: APITestResult[] = [];

  // 1. FDA API
  console.log('Testing FDA API...');
  const fdaEndpoint = `https://api.fda.gov/food/enforcement.json?search=product_description:"peanut butter"&limit=5`;
  const fdaResult = await testAPIDirect('FDA Recalls', fdaEndpoint, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'TrueScan-FoodScanner/1.0.0',
    },
  });
  results.push(fdaResult);
  console.log(`  Status: ${fdaResult.status}, HTTP: ${fdaResult.httpStatus}, Data: ${fdaResult.hasData}, Time: ${fdaResult.responseTime}ms`);
  if (fdaResult.error) console.log(`  Error: ${fdaResult.error}`);
  if (fdaResult.hasData && fdaResult.sampleResponse) {
    console.log(`  Sample: ${JSON.stringify(fdaResult.sampleResponse).substring(0, 100)}...`);
  }

  // 2. USDA FSIS API (corrected endpoint)
  console.log('Testing USDA FSIS API...');
  const usdaEndpoint = `https://www.fsis.usda.gov/fsis/api/recall/v/1?search=chicken&limit=5`;
  const usdaResult = await testAPIDirect('USDA FSIS Recalls', usdaEndpoint, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'TrueScan-FoodScanner/1.0.0',
    },
  });
  results.push(usdaResult);
  console.log(`  Status: ${usdaResult.status}, HTTP: ${usdaResult.httpStatus}, Data: ${usdaResult.hasData}, Time: ${usdaResult.responseTime}ms`);
  if (usdaResult.error) console.log(`  Error: ${usdaResult.error}`);

  // 3. RASFF (Web scraping test)
  console.log('Testing RASFF (Web scraping)...');
  const rasffEndpoint = `https://food.ec.europa.eu/safety/rasff_en`;
  const rasffResult = await testAPIDirect('RASFF Alerts', rasffEndpoint, {
    headers: {
      'Accept': 'text/html',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });
  results.push(rasffResult);
  console.log(`  Status: ${rasffResult.status}, HTTP: ${rasffResult.httpStatus}, Data: ${rasffResult.hasData}, Time: ${rasffResult.responseTime}ms`);
  if (rasffResult.error) console.log(`  Error: ${rasffResult.error}`);

  // 4. CFIA (Web scraping test)
  console.log('Testing CFIA (Web scraping)...');
  const cfiaEndpoint = `https://recalls-rappels.canada.ca/en`;
  const cfiaResult = await testAPIDirect('CFIA Recalls', cfiaEndpoint, {
    headers: {
      'Accept': 'text/html',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });
  results.push(cfiaResult);
  console.log(`  Status: ${cfiaResult.status}, HTTP: ${cfiaResult.httpStatus}, Data: ${cfiaResult.hasData}, Time: ${cfiaResult.responseTime}ms`);
  if (cfiaResult.error) console.log(`  Error: ${cfiaResult.error}`);

  // 5. CPSC API (corrected endpoint - SaferProducts.gov)
  console.log('Testing CPSC API...');
  const cpscEndpoint = `https://www.saferproducts.gov/RestWebServices/Recall?format=json&ProductName=product&limit=5`;
  const cpscResult = await testAPIDirect('CPSC Recalls', cpscEndpoint, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'TrueScan-FoodScanner/1.0.0',
    },
  });
  results.push(cpscResult);
  console.log(`  Status: ${cpscResult.status}, HTTP: ${cpscResult.httpStatus}, Data: ${cpscResult.hasData}, Time: ${cpscResult.responseTime}ms`);
  if (cpscResult.error) console.log(`  Error: ${cpscResult.error}`);

  // 6. UK FSA API (corrected endpoint)
  console.log('Testing UK FSA API...');
  const ukFsaEndpoint = `https://data.food.gov.uk/food-alerts`;
  const ukFsaResult = await testAPIDirect('UK FSA Recalls', ukFsaEndpoint, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'TrueScan-FoodScanner/1.0.0',
    },
  });
  results.push(ukFsaResult);
  console.log(`  Status: ${ukFsaResult.status}, HTTP: ${ukFsaResult.httpStatus}, Data: ${ukFsaResult.hasData}, Time: ${ukFsaResult.responseTime}ms`);
  if (ukFsaResult.error) console.log(`  Error: ${ukFsaResult.error}`);

  // 7. DOL Enforcement API (corrected endpoint)
  console.log('Testing DOL Enforcement API...');
  const dolEndpoint = `https://dataportal.dol.gov/api/v1/enforcement?search=Nestle&limit=5&format=json`;
  const dolResult = await testAPIDirect('DOL Enforcement', dolEndpoint, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'TrueScan-FoodScanner/1.0.0',
    },
  });
  results.push(dolResult);
  console.log(`  Status: ${dolResult.status}, HTTP: ${dolResult.httpStatus}, Data: ${dolResult.hasData}, Time: ${dolResult.responseTime}ms`);
  if (dolResult.error) console.log(`  Error: ${dolResult.error}`);

  // 8. ILO Statistics API (corrected endpoint)
  console.log('Testing ILO Statistics API...');
  const iloEndpoint = `https://sdmx.ilo.org/rest/dataflow`;
  const iloResult = await testAPIDirect('ILO Statistics', iloEndpoint, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'TrueScan-FoodScanner/1.0.0',
    },
  });
  results.push(iloResult);
  console.log(`  Status: ${iloResult.status}, HTTP: ${iloResult.httpStatus}, Data: ${iloResult.hasData}, Time: ${iloResult.responseTime}ms`);
  if (iloResult.error) console.log(`  Error: ${iloResult.error}`);

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 API TEST RESULTS SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  const working = results.filter(r => r.status === 'working');
  const notWorking = results.filter(r => r.status === 'not_working');
  const errors = results.filter(r => r.status === 'error');

  console.log(`✅ Working APIs (${working.length}):`);
  working.forEach(r => {
    console.log(`   - ${r.name}: HTTP ${r.httpStatus}, ${r.responseSize} bytes, ${r.responseTime}ms`);
  });

  console.log('');
  console.log(`⚠️  APIs with Issues (${notWorking.length}):`);
  notWorking.forEach(r => {
    console.log(`   - ${r.name}: HTTP ${r.httpStatus}, No data returned`);
    console.log(`     Endpoint: ${r.endpoint}`);
  });

  console.log('');
  console.log(`❌ APIs with Errors (${errors.length}):`);
  errors.forEach(r => {
    console.log(`   - ${r.name}: ${r.error}`);
    console.log(`     Endpoint: ${r.endpoint}`);
  });

  // Write detailed results
  const fs = require('fs');
  const path = require('path');
  const outputPath = path.join(__dirname, '..', 'API_TEST_RESULTS.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log('');
  console.log(`📄 Detailed results saved to: ${outputPath}`);

  return results;
}

// Run tests
testAllAPIs()
  .then(results => {
    const needsFixing = results.filter(r => r.status !== 'working');
    if (needsFixing.length > 0) {
      console.log('');
      console.log('⚠️  APIs requiring fixes:');
      needsFixing.forEach(r => {
        console.log(`   - ${r.name} (${r.status})`);
      });
    } else {
      console.log('');
      console.log('✅ All APIs are working!');
    }
  })
  .catch(error => {
    console.error('❌ Test script error:', error);
  });
