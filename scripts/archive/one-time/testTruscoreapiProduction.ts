/**
 * Test truscoreapi.vercel.app (production URL from screenshots)
 */

const PRODUCTION_URL = 'https://truscoreapi.vercel.app';
const testBarcode = `9999999999999`;
const timestamp = Date.now();

async function test() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 END-TO-END TEST: User Contribution System');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📦 Test Barcode: ${testBarcode}`);
  console.log(`🌐 Production URL: ${PRODUCTION_URL}`);
  console.log(`⏰ Timestamp: ${new Date(timestamp).toISOString()}`);
  console.log('');
  
  // Step 1: Submit data
  console.log('─'.repeat(63));
  console.log('STEP 1: Submit user data (simulating User A entering data)');
  console.log('─'.repeat(63));
  
  const testData = {
    product_name: `E2E_TEST ${timestamp}`,
    brands: `TEST_BRAND ${timestamp}`,
    ingredients_text: `Water, Sugar, Salt - E2E_TEST ${timestamp}`,
    nutriments: {
      'energy-kcal': 100 + (timestamp % 1000),
      proteins: 5.5,
      fat: 2.3,
      carbohydrates: 15.7,
    },
    manufacturing_places: `TEST_COUNTRY ${timestamp}`,
    countries: `TEST_ORIGIN ${timestamp}`,
  };
  
  try {
    const submitResponse = await fetch(`${PRODUCTION_URL}/api/manual-products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        barcode: testBarcode,
        productData: testData,
      }),
    });
    
    if (!submitResponse.ok) {
      const text = await submitResponse.text();
      console.log('❌ Submit failed:', submitResponse.status, submitResponse.statusText);
      console.log('Response:', text.substring(0, 200));
      return;
    }
    
    const submitResult = await submitResponse.json();
    console.log('✅ Data submitted successfully');
    console.log('   Response:', submitResult);
  } catch (error: any) {
    console.log('❌ Submit error:', error.message);
    return;
  }
  
  // Step 2: Wait for propagation
  console.log('');
  console.log('─'.repeat(63));
  console.log('STEP 2: Waiting for data propagation (2 seconds)');
  console.log('─'.repeat(63));
  await new Promise(r => setTimeout(r, 2000));
  console.log('✅ Wait completed');
  
  // Step 3: Retrieve data (simulating User B scanning)
  console.log('');
  console.log('─'.repeat(63));
  console.log('STEP 3: Retrieve data (simulating User B scanning barcode)');
  console.log('─'.repeat(63));
  
  try {
    const getResponse = await fetch(`${PRODUCTION_URL}/api/manual-products?barcode=${testBarcode}`);
    
    if (!getResponse.ok) {
      const text = await getResponse.text();
      console.log('❌ Retrieve failed:', getResponse.status, getResponse.statusText);
      console.log('Response:', text.substring(0, 200));
      return;
    }
    
    const getResult = await getResponse.json();
    
    if (!getResult.success || !getResult.product) {
      console.log('❌ Product not found');
      console.log('Response:', JSON.stringify(getResult, null, 2));
      return;
    }
    
    const product = getResult.product;
    console.log('✅ Product retrieved successfully');
    console.log('');
    
    // Step 4: Verify data integrity
    console.log('─'.repeat(63));
    console.log('STEP 4: Verify data integrity (PROOF)');
    console.log('─'.repeat(63));
    
    const verifications = [
      { field: 'product_name', expected: testData.product_name, actual: product.product_name },
      { field: 'brands', expected: testData.brands, actual: product.brands },
      { field: 'ingredients_text', expected: testData.ingredients_text, actual: product.ingredients_text },
      { field: 'manufacturing_places', expected: testData.manufacturing_places, actual: product.manufacturing_places },
      { field: 'countries', expected: testData.countries, actual: product.countries },
      { field: 'nutriments.energy-kcal', expected: testData.nutriments['energy-kcal'], actual: product.nutriments?.['energy-kcal'] },
      { field: 'nutriments.proteins', expected: testData.nutriments.proteins, actual: product.nutriments?.proteins },
    ];
    
    let allMatch = true;
    verifications.forEach(v => {
      const match = v.expected === v.actual;
      const icon = match ? '✅' : '❌';
      console.log(`   ${icon} ${v.field}: ${match ? 'MATCH' : 'MISMATCH'}`);
      if (!match) {
        console.log(`      Expected: ${v.expected}`);
        console.log(`      Actual: ${v.actual || 'undefined'}`);
        allMatch = false;
      }
    });
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    
    if (allMatch) {
      console.log('🎉 SUCCESS! All tests passed!');
      console.log('');
      console.log('✅ User contribution system is FULLY FUNCTIONAL:');
      console.log('   ✅ Data submission works');
      console.log('   ✅ Data storage works');
      console.log('   ✅ Data retrieval works');
      console.log('   ✅ All fields match exactly');
      console.log('   ✅ System is ready for production use!');
    } else {
      console.log('❌ FAILED - Some tests did not pass');
      console.log('   Check the mismatched fields above');
    }
    console.log('═══════════════════════════════════════════════════════════');
    
  } catch (error: any) {
    console.log('❌ Retrieve error:', error.message);
  }
}

test().catch(console.error);

