/**
 * Quick test of the new deployment URL
 */

const NEW_DEPLOYMENT_URL = 'https://vercel-n4cpoxann-leightons-projects-d328c774.vercel.app';
const testBarcode = `9999999999999`;
const timestamp = Date.now();

async function test() {
  console.log('Testing new deployment:', NEW_DEPLOYMENT_URL);
  
  // Submit data
  const submitResponse = await fetch(`${NEW_DEPLOYMENT_URL}/api/manual-products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      barcode: testBarcode,
      productData: {
        product_name: `TEST ${timestamp}`,
        brands: `TEST BRAND ${timestamp}`,
        ingredients_text: `TEST INGREDIENTS ${timestamp}`,
        nutriments: { 'energy-kcal': 100 },
      },
    }),
  });
  
  const submitData = await submitResponse.json();
  console.log('Submit result:', submitData);
  
  // Wait a moment
  await new Promise(r => setTimeout(r, 1000));
  
  // Retrieve data
  const getResponse = await fetch(`${NEW_DEPLOYMENT_URL}/api/manual-products?barcode=${testBarcode}`);
  const getData = await getResponse.json();
  console.log('\nRetrieve result:', JSON.stringify(getData, null, 2));
  
  if (getData.product?.product_name) {
    console.log('\n✅ SUCCESS! Product data retrieved correctly!');
    console.log('Product name:', getData.product.product_name);
  } else {
    console.log('\n❌ FAILED - Product data not found');
  }
}

test().catch(console.error);

