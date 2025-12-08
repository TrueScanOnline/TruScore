/**
 * Test Datakick and FooDB APIs with real barcodes
 * This script tests the new free databases to verify they work correctly
 */

// Use built-in fetch (Node.js 18+) or node-fetch for older versions
let fetch;
try {
  fetch = globalThis.fetch;
  if (!fetch) {
    fetch = require('node-fetch');
  }
} catch (e) {
  // Fallback to https module if fetch not available
  const https = require('https');
  const http = require('http');
  fetch = (url, options) => {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;
      const req = client.request(url, options || {}, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: () => Promise.resolve(JSON.parse(data)),
            text: () => Promise.resolve(data),
          });
        });
      });
      req.on('error', reject);
      req.end();
    });
  };
}

// Test barcodes (real products from previous testing)
const TEST_BARCODES = [
  '9346321000475', // Hommus Classic (found in Open Food Facts)
  '9310645467740', // Oats product (found in FSANZ)
  '9313958005890', // Test barcode
  '9310047207180', // Test barcode
  '9400547019939', // Test barcode
];

const TEST_PRODUCT_NAMES = [
  'Hommus Classic',
  'Oats, grains rolled, raw',
  'Bread, white',
  'Milk, whole',
  'Apple, raw',
];

/**
 * Test Datakick API
 */
async function testDatakick(barcode) {
  try {
    console.log(`\n[Datakick] Testing barcode: ${barcode}`);
    const url = `https://api.gtinsearch.org/v1/products/${barcode}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TrueScan-FoodScanner/1.0.0',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`  ❌ Product not found (404)`);
        return null;
      }
      console.log(`  ⚠️  API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (!data.name && !data.brand) {
      console.log(`  ❌ No product data`);
      return null;
    }

    console.log(`  ✅ Product found: ${data.name || 'N/A'}`);
    console.log(`     Brand: ${data.brand || 'N/A'}`);
    console.log(`     Has image: ${data.image ? 'Yes' : 'No'}`);
    console.log(`     Has nutrition: ${data.nutrition ? 'Yes' : 'No'}`);
    console.log(`     Has ingredients: ${data.ingredients ? 'Yes' : 'No'}`);
    
    return data;
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return null;
  }
}

/**
 * Test FooDB API
 */
async function testFooDB(productName) {
  try {
    console.log(`\n[FooDB] Testing product: ${productName}`);
    
    // Extract main food name
    const searchName = productName
      .split(',')[0]
      .split(/\s+/)
      .slice(0, 3)
      .join(' ');

    const url = `http://foodb.ca/api/v1/food/search?q=${encodeURIComponent(searchName)}&limit=1`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TrueScan-FoodScanner/1.0.0',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`  ❌ No nutrition data found (404)`);
        return null;
      }
      console.log(`  ⚠️  API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (!data.foods || data.foods.length === 0) {
      console.log(`  ❌ No food data found`);
      return null;
    }

    const food = data.foods[0];
    console.log(`  ✅ Food found: ${food.name || 'N/A'}`);
    console.log(`     Description: ${food.description ? food.description.substring(0, 60) + '...' : 'N/A'}`);
    console.log(`     Nutrients: ${food.nutrients ? food.nutrients.length : 0}`);
    
    if (food.nutrients && food.nutrients.length > 0) {
      console.log(`     Sample nutrients:`);
      food.nutrients.slice(0, 5).forEach(nutrient => {
        console.log(`       - ${nutrient.name}: ${nutrient.value} ${nutrient.unit || ''}`);
      });
    }
    
    return food;
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return null;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('TESTING NEW FREE DATABASES');
  console.log('═══════════════════════════════════════════════════════════');
  
  console.log('\n📊 Testing Datakick API (Barcode-based queries)');
  console.log('───────────────────────────────────────────────────────────');
  
  let datakickSuccess = 0;
  let datakickTotal = 0;
  
  for (const barcode of TEST_BARCODES) {
    datakickTotal++;
    const result = await testDatakick(barcode);
    if (result) {
      datakickSuccess++;
    }
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n📊 Testing FooDB API (Product name-based queries)');
  console.log('───────────────────────────────────────────────────────────');
  
  let foodbSuccess = 0;
  let foodbTotal = 0;
  
  for (const productName of TEST_PRODUCT_NAMES) {
    foodbTotal++;
    const result = await testFooDB(productName);
    if (result) {
      foodbSuccess++;
    }
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('TEST RESULTS SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`\n[Datakick] Success Rate: ${datakickSuccess}/${datakickTotal} (${Math.round(datakickSuccess/datakickTotal*100)}%)`);
  console.log(`[FooDB] Success Rate: ${foodbSuccess}/${foodbTotal} (${Math.round(foodbSuccess/foodbTotal*100)}%)`);
  
  if (datakickSuccess > 0 || foodbSuccess > 0) {
    console.log('\n✅ At least one database is working!');
  } else {
    console.log('\n⚠️  No results found - may need to check API endpoints or test with different products');
  }
  
  console.log('\n═══════════════════════════════════════════════════════════');
}

// Run tests
runTests().catch(console.error);

