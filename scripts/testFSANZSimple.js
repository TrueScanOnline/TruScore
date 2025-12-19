/**
 * Simple FSANZ API Test
 */

const https = require('https');

const baseUrl = 'https://truscoreapi.vercel.app/api/fsanz-query';

const testCases = [
  { country: 'nz', product: 'Milk' },
  { country: 'nz', product: 'Tomato Sauce' },
  { country: 'nz', product: 'Bread' },
  { country: 'au', product: 'Milk' },
  { country: 'au', product: 'Apple' }
];

function testAPI(country, product) {
  return new Promise((resolve, reject) => {
    const url = `${baseUrl}?country=${country}&productName=${encodeURIComponent(product)}`;
    console.log(`\nTesting: ${country.toUpperCase()} - "${product}"`);
    console.log(`URL: ${url}`);
    
    https.get(url, { timeout: 30000 }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            if (json.found) {
              console.log(`✅ FOUND: ${json.product.productName}`);
              console.log(`   Energy: ${json.product.energyKcal} kcal | Source: ${json.source}`);
              if (json.fallback) {
                console.log(`   ⚠️  Used NZFCD fallback`);
              }
              resolve({ success: true, found: true });
            } else {
              console.log(`⚠️  Not found (but API works)`);
              resolve({ success: true, found: false });
            }
          } catch (e) {
            console.log(`❌ Parse error: ${e.message}`);
            console.log(`Response: ${data.substring(0, 200)}`);
            resolve({ success: false, error: 'Parse error' });
          }
        } else {
          console.log(`❌ Status: ${res.statusCode}`);
          console.log(`Response: ${data.substring(0, 200)}`);
          resolve({ success: false, error: `Status ${res.statusCode}` });
        }
      });
    }).on('error', (e) => {
      console.log(`❌ Request error: ${e.message}`);
      resolve({ success: false, error: e.message });
    });
  });
}

async function runTests() {
  console.log('========================================');
  console.log('FSANZ API Simple Test');
  console.log('========================================');
  
  let successCount = 0;
  let foundCount = 0;
  let failCount = 0;
  
  for (const test of testCases) {
    const result = await testAPI(test.country, test.product);
    if (result.success) {
      successCount++;
      if (result.found) {
        foundCount++;
      }
    } else {
      failCount++;
    }
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n========================================');
  console.log('Test Results');
  console.log('========================================');
  console.log(`Total: ${testCases.length}`);
  console.log(`✅ API Successful: ${successCount}`);
  console.log(`✅ Products Found: ${foundCount}`);
  console.log(`❌ Failed: ${failCount}`);
  
  if (successCount === testCases.length && foundCount > 0) {
    console.log('\n✅ FSANZ API is WORKING!');
    process.exit(0);
  } else if (successCount === testCases.length) {
    console.log('\n⚠️  API works but no products found');
    process.exit(1);
  } else {
    console.log('\n❌ API has issues');
    process.exit(1);
  }
}

runTests().catch(e => {
  console.error('Test error:', e);
  process.exit(1);
});
















