/**
 * Test FSANZ API with live HTTP requests (after deployment)
 */

const https = require('https');

const API_URL = 'https://truscoreapi.vercel.app/api/fsanz-query';

function testQuery(country, productName) {
  return new Promise((resolve, reject) => {
    const url = `${API_URL}?country=${country}&productName=${encodeURIComponent(productName)}`;
    console.log(`Testing: ${url}`);
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ status: res.statusCode, result });
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('========================================');
  console.log('FSANZ Live API Test');
  console.log('========================================');
  console.log('');

  const testCases = [
    { country: 'nz', productName: 'Baked Beans' },
    { country: 'nz', productName: 'Milk' },
    { country: 'nz', productName: 'Apple' },
    { country: 'nz', productName: 'Pams Fresh Milk 2L' },
    { country: 'au', productName: 'Milk' },
    { country: 'au', productName: 'Apple' },
  ];

  let successCount = 0;
  let failCount = 0;

  for (const test of testCases) {
    try {
      const { status, result } = await testQuery(test.country, test.productName);
      if (result.found) {
        successCount++;
        console.log(`✅ "${test.productName}" (${test.country.toUpperCase()})`);
        console.log(`   → "${result.product.productName}"`);
        console.log(`   Energy: ${result.product.energyKcal || 'N/A'} kcal`);
      } else {
        failCount++;
        console.log(`❌ "${test.productName}" (${test.country.toUpperCase()}) → Not found`);
      }
    } catch (error) {
      failCount++;
      console.log(`❌ "${test.productName}" (${test.country.toUpperCase()}) → Error: ${error.message}`);
    }
    console.log('');
  }

  console.log('========================================');
  console.log(`Results: ${successCount} matches, ${failCount} failures`);
  console.log('========================================');
}

runTests().catch(console.error);
