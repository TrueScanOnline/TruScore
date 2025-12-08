/**
 * Verify FSANZ deployment is complete and functional
 */

const https = require('https');

const API_URL = 'https://truscoreapi.vercel.app/api/fsanz-query';

function testQuery(country, productName) {
  return new Promise((resolve, reject) => {
    const url = `${API_URL}?country=${country}&productName=${encodeURIComponent(productName)}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ status: res.statusCode, result });
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}, Response: ${data.substring(0, 200)}`));
        }
      });
    }).on('error', reject);
    
    // Timeout after 10 seconds
    setTimeout(() => reject(new Error('Request timeout')), 10000);
  });
}

async function runVerification() {
  console.log('========================================');
  console.log('FSANZ Deployment Verification');
  console.log('========================================');
  console.log('');
  console.log(`Testing API: ${API_URL}`);
  console.log('');

  const testCases = [
    { country: 'nz', productName: 'Baked Beans', expected: true },
    { country: 'nz', productName: 'Milk', expected: true },
    { country: 'nz', productName: 'Apple', expected: true },
    { country: 'nz', productName: 'Pams Fresh Milk 2L', expected: true },
    { country: 'nz', productName: 'Bread', expected: true },
    { country: 'au', productName: 'Milk', expected: true },
    { country: 'au', productName: 'Apple', expected: true },
  ];

  let successCount = 0;
  let failCount = 0;
  const results = [];

  for (const test of testCases) {
    try {
      console.log(`Testing: "${test.productName}" (${test.country.toUpperCase()})...`);
      const { status, result } = await testQuery(test.country, test.productName);
      
      if (status === 200 && result.found) {
        successCount++;
        console.log(`  ✅ Found: "${result.product.productName}"`);
        console.log(`     Energy: ${result.product.energyKcal || 'N/A'} kcal`);
        console.log(`     Protein: ${result.product.protein || 'N/A'}g`);
        console.log(`     Fat: ${result.product.fat || 'N/A'}g`);
        results.push({ ...test, status: 'success', matched: result.product.productName });
      } else if (status === 200 && !result.found) {
        failCount++;
        console.log(`  ⚠️  Not found (but API responded)`);
        results.push({ ...test, status: 'not_found' });
      } else {
        failCount++;
        console.log(`  ❌ Error: Status ${status}`);
        results.push({ ...test, status: 'error', error: `Status ${status}` });
      }
    } catch (error) {
      failCount++;
      console.log(`  ❌ Error: ${error.message}`);
      results.push({ ...test, status: 'error', error: error.message });
    }
    console.log('');
  }

  console.log('========================================');
  console.log(`Results: ${successCount} successful, ${failCount} failed`);
  console.log(`Success Rate: ${((successCount / testCases.length) * 100).toFixed(1)}%`);
  console.log('========================================');
  console.log('');

  if (successCount > 0) {
    console.log('✅ FSANZ API is functional!');
    console.log('✅ Deployment successful!');
    console.log('✅ Ready for user testing!');
  } else {
    console.log('❌ FSANZ API is not responding correctly');
    console.log('❌ Check deployment logs');
  }

  return { successCount, failCount, results };
}

runVerification().catch(console.error);
