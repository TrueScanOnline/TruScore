/**
 * Test the newly deployed URL
 */

const DEPLOYMENT_URL = 'https://vercel-7bytrzpol-leightons-projects-d328c774.vercel.app';
const testBarcode = `9999999999999`;
const timestamp = Date.now();

async function test() {
  console.log('Testing deployment:', DEPLOYMENT_URL);
  console.log('');
  
  // Test 1: Submit data
  console.log('1. Submitting test data...');
  const submitResponse = await fetch(`${DEPLOYMENT_URL}/api/manual-products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      barcode: testBarcode,
      productData: {
        product_name: `END_TO_END_TEST ${timestamp}`,
        brands: `TEST BRAND ${timestamp}`,
        ingredients_text: `Water, Sugar, Salt - TEST ${timestamp}`,
        nutriments: {
          'energy-kcal': 100 + (timestamp % 1000),
          proteins: 5.5,
        },
      },
    }),
  });
  
  const submitData = await submitResponse.json();
  console.log('   Submit result:', submitData.success ? '✅ Success' : '❌ Failed');
  if (!submitData.success) {
    console.log('   Error:', submitData);
    return;
  }
  
  // Wait
  console.log('2. Waiting 2 seconds...');
  await new Promise(r => setTimeout(r, 2000));
  
  // Test 2: Retrieve data
  console.log('3. Retrieving data...');
  const getResponse = await fetch(`${DEPLOYMENT_URL}/api/manual-products?barcode=${testBarcode}`);
  const getData = await getResponse.json();
  
  if (!getData.success || !getData.product) {
    console.log('   ❌ Product not found');
    console.log('   Response:', JSON.stringify(getData, null, 2));
    return;
  }
  
  const product = getData.product;
  console.log('   ✅ Product found!');
  console.log('');
  console.log('4. Verifying data fields...');
  
  const checks = [
    { field: 'product_name', expected: `END_TO_END_TEST ${timestamp}`, actual: product.product_name },
    { field: 'brands', expected: `TEST BRAND ${timestamp}`, actual: product.brands },
    { field: 'ingredients_text', expected: `Water, Sugar, Salt - TEST ${timestamp}`, actual: product.ingredients_text },
  ];
  
  let allMatch = true;
  checks.forEach(check => {
    const match = check.expected === check.actual;
    const icon = match ? '✅' : '❌';
    console.log(`   ${icon} ${check.field}: ${match ? 'MATCH' : 'MISMATCH'}`);
    if (!match) {
      console.log(`      Expected: ${check.expected}`);
      console.log(`      Actual: ${check.actual || 'undefined'}`);
      allMatch = false;
    }
  });
  
  console.log('');
  if (allMatch) {
    console.log('🎉 SUCCESS! All fields match - system is working!');
  } else {
    console.log('❌ FAILED - Some fields do not match');
  }
}

test().catch(console.error);

