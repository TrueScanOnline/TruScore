/**
 * Test APIs directly to see actual response structures
 */

async function testAPI(name: string, url: string, options?: RequestInit) {
  console.log(`\n${name}:`);
  console.log(`  URL: ${url}`);
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch(url, { ...options, signal: controller.signal });
    const text = await response.text();
    
    console.log(`  Status: ${response.status}`);
    console.log(`  Size: ${text.length} bytes`);
    
    if (response.ok) {
      try {
        const json = JSON.parse(text);
        if (Array.isArray(json)) {
          console.log(`  ✅ Array with ${json.length} items`);
          if (json.length > 0) {
            console.log(`  First item keys: ${Object.keys(json[0]).slice(0, 15).join(', ')}`);
            console.log(`  Sample: ${JSON.stringify(json[0]).substring(0, 300)}`);
          }
        } else {
          console.log(`  ✅ Object with keys: ${Object.keys(json).slice(0, 10).join(', ')}`);
          if (json.Recalls && Array.isArray(json.Recalls)) {
            console.log(`  Recalls array: ${json.Recalls.length} items`);
            if (json.Recalls.length > 0) {
              console.log(`  First recall keys: ${Object.keys(json.Recalls[0]).slice(0, 15).join(', ')}`);
            }
          }
        }
      } catch {
        console.log(`  ⚠️  Not JSON (HTML or other)`);
      }
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function run() {
  // Test CPSC
  await testAPI('CPSC', 'https://www.saferproducts.gov/RestWebServices/Recall?format=json&ProductName=Hershey&limit=5');
  
  // Test USDA FSIS with actual search
  await testAPI('USDA FSIS', 'https://www.fsis.usda.gov/fsis/api/recall/v/1');
  
  // Test DOL
  await testAPI('DOL', 'https://dataportal.dol.gov/api/v1/enforcement?search=Nestle&limit=5&format=json');
}

run().catch(console.error);

