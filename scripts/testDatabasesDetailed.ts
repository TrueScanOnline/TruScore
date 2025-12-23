/**
 * Detailed Database Testing Script
 * Tests each database and shows actual responses for debugging
 */

async function testEndpoint(name: string, url: string, options?: RequestInit) {
  console.log(`\n🔍 Testing ${name}...`);
  console.log(`   URL: ${url}`);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    console.log(`   HTTP Status: ${response.status} ${response.statusText}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);
    
    const text = await response.text();
    console.log(`   Response Size: ${text.length} bytes`);
    
    if (response.ok) {
      try {
        const json = JSON.parse(text);
        console.log(`   ✅ Valid JSON`);
        console.log(`   Structure: ${Object.keys(json).join(', ')}`);
        
        // Check for data arrays
        if (Array.isArray(json)) {
          console.log(`   📊 Array with ${json.length} items`);
          if (json.length > 0) {
            console.log(`   Sample item keys: ${Object.keys(json[0]).join(', ')}`);
          }
        } else if (json.results && Array.isArray(json.results)) {
          console.log(`   📊 Results array with ${json.results.length} items`);
        } else if (json.items && Array.isArray(json.items)) {
          console.log(`   📊 Items array with ${json.items.length} items`);
        } else if (json.data && Array.isArray(json.data)) {
          console.log(`   📊 Data array with ${json.data.length} items`);
        } else {
          console.log(`   ⚠️  No array found in response`);
          console.log(`   First 200 chars: ${JSON.stringify(json).substring(0, 200)}`);
        }
      } catch {
        // Not JSON
        console.log(`   ⚠️  Not JSON (likely HTML)`);
        if (text.length > 0) {
          console.log(`   First 200 chars: ${text.substring(0, 200)}`);
        }
      }
    } else {
      console.log(`   ❌ Error response`);
      console.log(`   First 500 chars: ${text.substring(0, 500)}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔍 DETAILED DATABASE API TESTING');
  console.log('═══════════════════════════════════════════════════════════════');

  // 1. USDA FSIS
  await testEndpoint(
    'USDA FSIS',
    'https://www.fsis.usda.gov/fsis/api/recall/v/1',
    {
      headers: { 'Accept': 'application/json' },
    }
  );

  // 2. UK FSA
  await testEndpoint(
    'UK FSA',
    'https://data.food.gov.uk/food-alerts',
    {
      headers: { 'Accept': 'application/json' },
    }
  );

  // 3. ILO
  await testEndpoint(
    'ILO Dataflows',
    'https://sdmx.ilo.org/rest/dataflow',
    {
      headers: { 'Accept': 'application/json' },
    }
  );

  // 4. RASFF HTML structure
  await testEndpoint(
    'RASFF HTML',
    'https://food.ec.europa.eu/safety/rasff_en',
    {
      headers: { 'Accept': 'text/html' },
    }
  );

  console.log('\n═══════════════════════════════════════════════════════════════');
}

runTests().catch(console.error);

