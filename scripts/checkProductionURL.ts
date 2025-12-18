/**
 * Check if the production URL was updated with our fix
 */

const PRODUCTION_URL = 'https://vercel-murex-alpha.vercel.app';
const testBarcode = '9999999999999';
const timestamp = Date.now();

async function check() {
  console.log('Testing production URL:', PRODUCTION_URL);
  console.log('');
  
  // First, submit fresh data
  console.log('1. Submitting fresh test data...');
  const submitResponse = await fetch(`${PRODUCTION_URL}/api/manual-products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      barcode: testBarcode,
      productData: {
        product_name: `PROOF TEST ${timestamp}`,
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
  console.log('   Result:', submitData.success ? '✅ Success' : '❌ Failed');
  if (!submitData.success) {
    console.log('   Error:', submitData);
    return;
  }
  
  // Wait for propagation
  console.log('2. Waiting 2 seconds for data propagation...');
  await new Promise(r => setTimeout(r, 2000));
  
  // Retrieve data
  console.log('3. Retrieving data...');
  const getResponse = await fetch(`${PRODUCTION_URL}/api/manual-products?barcode=${testBarcode}`);
  const getData = await getResponse.json();
  
  if (!getData.success) {
    console.log('   ❌ Product not found');
    console.log('   Response:', getData);
    return;
  }
  
  const product = getData.product;
  console.log('   ✅ Product found!');
  console.log('');
  console.log('4. Verifying data fields...');
  
  const checks = [
    { field: 'product_name', expected: `PROOF TEST ${timestamp}`, actual: product.product_name },
    { field: 'brands', expected: `TEST BRAND ${timestamp}`, actual: product.brands },
    { field: 'ingredients_text', expected: `Water, Sugar, Salt - TEST ${timestamp}`, actual: product.ingredients_text },
    { field: 'nutriments.energy-kcal', expected: 100 + (timestamp % 1000), actual: product.nutriments?.['energy-kcal'] },
  ];
  
  let allMatch = true;
  checks.forEach(check => {
    const match = check.expected === check.actual;
    const icon = match ? '✅' : '❌';
    console.log(`   ${icon} ${check.field}: ${match ? 'MATCH' : 'MISMATCH'}`);
    if (!match) {
      console.log(`      Expected: ${check.expected}`);
      console.log(`      Actual: ${check.actual}`);
      allMatch = false;
    }
  });
  
  console.log('');
  if (allMatch) {
    console.log('🎉 SUCCESS! All fields match - the fix is working!');
  } else {
    console.log('❌ FAILED - Some fields do not match');
  }
}

check().catch(console.error);

