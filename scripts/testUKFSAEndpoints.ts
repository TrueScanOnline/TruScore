/**
 * Test UK FSA API endpoints
 */

async function testEndpoint(name: string, url: string) {
  console.log(`\nTesting ${name}:`);
  console.log(`  ${url}`);
  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });
    console.log(`  Status: ${response.status}`);
    const text = await response.text();
    console.log(`  Size: ${text.length} bytes`);
    if (response.ok && text.length < 500) {
      console.log(`  Response: ${text.substring(0, 200)}`);
    }
  } catch (error) {
    console.log(`  Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function runTests() {
  await testEndpoint('UK FSA Base', 'https://data.food.gov.uk/food-alerts');
  await testEndpoint('UK FSA with .json', 'https://data.food.gov.uk/food-alerts.json');
  await testEndpoint('UK FSA with Accept header', 'https://data.food.gov.uk/food-alerts', {
    headers: { 'Accept': 'application/ld+json' },
  });
  await testEndpoint('UK FSA items', 'https://data.food.gov.uk/food-alerts/items');
  await testEndpoint('UK FSA @graph', 'https://data.food.gov.uk/food-alerts/@graph');
}

runTests().catch(console.error);

