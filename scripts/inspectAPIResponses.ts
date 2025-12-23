/**
 * Inspect actual API responses to understand data structure
 */

async function inspectResponse(name: string, url: string) {
  console.log(`\n${name}:`);
  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });
    const data = await response.json();
    
    if (Array.isArray(data) && data.length > 0) {
      console.log(`  Array with ${data.length} items`);
      console.log(`  First item keys: ${Object.keys(data[0]).slice(0, 20).join(', ')}`);
      console.log(`  Sample: ${JSON.stringify(data[0]).substring(0, 300)}`);
    } else if (typeof data === 'object') {
      console.log(`  Object keys: ${Object.keys(data).join(', ')}`);
      if (data.results && Array.isArray(data.results) && data.results.length > 0) {
        console.log(`  Results array: ${data.results.length} items`);
        console.log(`  First result keys: ${Object.keys(data.results[0]).slice(0, 20).join(', ')}`);
      }
    }
  } catch (error) {
    console.log(`  Error: ${error}`);
  }
}

async function run() {
  // USDA FSIS - check actual structure
  await inspectResponse('USDA FSIS', 'https://www.fsis.usda.gov/fsis/api/recall/v/1');
  
  // DOL - check actual structure
  await inspectResponse('DOL', 'https://dataportal.dol.gov/api/v1/enforcement?search=Nestle&limit=5&format=json');
}

run().catch(console.error);

