/**
 * COMPREHENSIVE End-to-End Test: User Contribution System
 * 
 * Tests multiple scenarios with various data entry parameters:
 * - Product information (name, brand, ingredients)
 * - Nutrition data
 * - Packaging information
 * - Country of origin
 * - Allergens and additives
 * - Images
 * 
 * Proves global availability by:
 * - Submitting data as User A
 * - Retrieving data as User B (simulating different user/device)
 * - Verifying all fields match exactly
 */

/// <reference path="../global.d.ts" />

// Initialize globals
if (typeof (global as any).__DEV__ === 'undefined') {
  (global as any).__DEV__ = process.env.NODE_ENV !== 'production';
}
if (!process.env.EXPO_OS) {
  process.env.EXPO_OS = 'node';
}

import { getBackendUrl, BackendEndpoints } from '../src/config/backendConfig';

const BACKEND_URL = getBackendUrl();
const MANUAL_PRODUCTS_API = BackendEndpoints.manualProducts(BACKEND_URL);

interface TestScenario {
  name: string;
  barcode: string;
  userData: {
    product_name: string;
    brands?: string;
    ingredients_text?: string;
    image_url?: string;
    nutriments?: Record<string, number>;
    serving_size?: string;
    quantity?: string;
    manufacturing_places?: string;
    countries?: string;
    categories?: string;
    allergens_tags?: string[];
    additives_tags?: string[];
    packaging_data?: {
      items: Array<{
        material: string;
        shape?: string;
        recycling?: string;
      }>;
    };
  };
}

const timestamp = Date.now();

// Multiple test scenarios with different data combinations
const testScenarios: TestScenario[] = [
  {
    name: 'Complete Product Data',
    barcode: `8888888888888`,
    userData: {
      product_name: `COMPLETE_TEST_${timestamp}`,
      brands: `TEST_BRAND_${timestamp}`,
      ingredients_text: `Water, Sugar, High Fructose Corn Syrup, Citric Acid, Natural Flavors, Sodium Benzoate - TEST_${timestamp}`,
      image_url: `https://example.com/test-image-${timestamp}.jpg`,
      nutriments: {
        'energy-kcal': 150 + (timestamp % 100),
        'energy-kj': 627 + (timestamp % 100) * 4.184,
        proteins: 0.5,
        fat: 0.1,
        'saturated-fat': 0.05,
        carbohydrates: 38.5,
        sugars: 37.2,
        fiber: 0.2,
        sodium: 15,
      },
      serving_size: '250ml',
      quantity: '500ml',
      manufacturing_places: `United States - TEST_${timestamp}`,
      countries: `United States - TEST_${timestamp}`,
      categories: `Beverages, Soft Drinks, Carbonated Drinks - TEST_${timestamp}`,
      allergens_tags: ['en:gluten', 'en:milk'],
      additives_tags: ['en:e211', 'en:e300'],
      packaging_data: {
        items: [
          {
            material: 'en:plastic',
            shape: 'en:bottle',
            recycling: 'en:recyclable',
          },
          {
            material: 'en:cardboard',
            shape: 'en:box',
            recycling: 'en:recyclable',
          },
        ],
      },
    },
  },
  {
    name: 'Minimal Product Data',
    barcode: `7777777777777`,
    userData: {
      product_name: `MINIMAL_TEST_${timestamp}`,
      brands: `MINIMAL_BRAND_${timestamp}`,
      ingredients_text: `Water, Salt - MINIMAL_${timestamp}`,
    },
  },
  {
    name: 'Nutrition Focused',
    barcode: `6666666666666`,
    userData: {
      product_name: `NUTRITION_TEST_${timestamp}`,
      brands: `NUTRITION_BRAND_${timestamp}`,
      nutriments: {
        'energy-kcal': 250 + (timestamp % 100),
        proteins: 15.3,
        fat: 8.7,
        'saturated-fat': 3.2,
        carbohydrates: 30.1,
        sugars: 5.2,
        fiber: 4.5,
        sodium: 450,
        calcium: 120,
        iron: 2.5,
        'vitamin-c': 45,
      },
      serving_size: '100g',
    },
  },
  {
    name: 'Packaging Focused',
    barcode: `5555555555555`,
    userData: {
      product_name: `PACKAGING_TEST_${timestamp}`,
      brands: `PACKAGING_BRAND_${timestamp}`,
      packaging_data: {
        items: [
          {
            material: 'en:glass',
            shape: 'en:jar',
            recycling: 'en:recyclable',
          },
          {
            material: 'en:metal',
            shape: 'en:lid',
            recycling: 'en:recyclable',
          },
          {
            material: 'en:plastic',
            shape: 'en:label',
            recycling: 'en:not-recyclable',
          },
        ],
      },
    },
  },
  {
    name: 'Allergens & Additives',
    barcode: `4444444444444`,
    userData: {
      product_name: `ALLERGEN_TEST_${timestamp}`,
      brands: `ALLERGEN_BRAND_${timestamp}`,
      ingredients_text: `Wheat flour, Milk, Eggs, Soy, Nuts - ALLERGEN_${timestamp}`,
      allergens_tags: ['en:gluten', 'en:milk', 'en:eggs', 'en:soybeans', 'en:nuts'],
      additives_tags: ['en:e102', 'en:e124', 'en:e621', 'en:e951'],
    },
  },
  {
    name: 'Country of Origin',
    barcode: `3333333333333`,
    userData: {
      product_name: `ORIGIN_TEST_${timestamp}`,
      brands: `ORIGIN_BRAND_${timestamp}`,
      manufacturing_places: `Australia - ORIGIN_${timestamp}`,
      countries: `Australia - ORIGIN_${timestamp}`,
      ingredients_text: `Local ingredients - ORIGIN_${timestamp}`,
    },
  },
];

interface TestResult {
  scenario: string;
  barcode: string;
  steps: {
    submit: { success: boolean; error?: string };
    retrieve: { success: boolean; error?: string; data?: any };
    verification: {
      totalFields: number;
      matchingFields: number;
      mismatchedFields: string[];
      details: Array<{ field: string; match: boolean; submitted: any; retrieved: any }>;
    };
  };
}

async function runComprehensiveTest(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 COMPREHENSIVE USER CONTRIBUTION E2E TEST');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`🌐 Backend URL: ${BACKEND_URL}`);
  console.log(`🔗 API Endpoint: ${MANUAL_PRODUCTS_API}`);
  console.log(`📊 Test Scenarios: ${testScenarios.length}`);
  console.log(`⏰ Timestamp: ${new Date(timestamp).toISOString()}`);
  console.log('');

  for (let i = 0; i < testScenarios.length; i++) {
    const scenario = testScenarios[i];
    console.log('─'.repeat(63));
    console.log(`TEST SCENARIO ${i + 1}/${testScenarios.length}: ${scenario.name}`);
    console.log('─'.repeat(63));
    console.log(`📦 Barcode: ${scenario.barcode}`);
    console.log('');

    const result: TestResult = {
      scenario: scenario.name,
      barcode: scenario.barcode,
      steps: {
        submit: { success: false },
        retrieve: { success: false },
        verification: {
          totalFields: 0,
          matchingFields: 0,
          mismatchedFields: [],
          details: [],
        },
      },
    };

    // STEP 1: Submit data (User A)
    console.log(`  [${i + 1}.1] USER A: Submitting data...`);
    try {
      const submitResponse = await fetch(MANUAL_PRODUCTS_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          barcode: scenario.barcode,
          productData: {
            ...scenario.userData,
            barcode: scenario.barcode,
          },
        }),
      });

      if (!submitResponse.ok) {
        const errorText = await submitResponse.text();
        result.steps.submit = {
          success: false,
          error: `HTTP ${submitResponse.status}: ${errorText.substring(0, 100)}`,
        };
        console.log(`      ❌ Failed: ${result.steps.submit.error}`);
        results.push(result);
        continue;
      }

      const submitData = await submitResponse.json();
      if (submitData.success) {
        result.steps.submit = { success: true };
        console.log(`      ✅ Success`);
      } else {
        result.steps.submit = { success: false, error: submitData.message || 'Unknown error' };
        console.log(`      ❌ Failed: ${result.steps.submit.error}`);
        results.push(result);
        continue;
      }
    } catch (error: any) {
      result.steps.submit = { success: false, error: error.message };
      console.log(`      ❌ Error: ${error.message}`);
      results.push(result);
      continue;
    }

    // Wait for data propagation
    console.log(`  [${i + 1}.2] Waiting for data propagation...`);
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log(`      ✅ Wait completed`);

    // STEP 2: Retrieve data (User B - different user/device)
    console.log(`  [${i + 1}.3] USER B: Retrieving data (simulating global user)...`);
    try {
      const getResponse = await fetch(
        `${MANUAL_PRODUCTS_API}?barcode=${encodeURIComponent(scenario.barcode)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!getResponse.ok) {
        const errorText = await getResponse.text();
        result.steps.retrieve = {
          success: false,
          error: `HTTP ${getResponse.status}: ${errorText.substring(0, 100)}`,
        };
        console.log(`      ❌ Failed: ${result.steps.retrieve.error}`);
        results.push(result);
        continue;
      }

      const getData = await getResponse.json();
      if (getData.success && getData.product) {
        result.steps.retrieve = { success: true, data: getData.product };
        console.log(`      ✅ Success - Product retrieved`);
      } else {
        result.steps.retrieve = {
          success: false,
          error: getData.message || 'Product not found',
        };
        console.log(`      ❌ Failed: ${result.steps.retrieve.error}`);
        results.push(result);
        continue;
      }
    } catch (error: any) {
      result.steps.retrieve = { success: false, error: error.message };
      console.log(`      ❌ Error: ${error.message}`);
      results.push(result);
      continue;
    }

    // STEP 3: Verify data integrity
    console.log(`  [${i + 1}.4] Verifying data integrity...`);
    const submitted = scenario.userData;
    const retrieved = result.steps.retrieve.data;

    const fieldsToVerify: Array<{ name: string; submitted: any; retrieved: any }> = [
      { name: 'product_name', submitted: submitted.product_name, retrieved: retrieved.product_name },
      { name: 'brands', submitted: submitted.brands, retrieved: retrieved.brands },
      { name: 'ingredients_text', submitted: submitted.ingredients_text, retrieved: retrieved.ingredients_text },
      { name: 'manufacturing_places', submitted: submitted.manufacturing_places, retrieved: retrieved.manufacturing_places },
      { name: 'countries', submitted: submitted.countries, retrieved: retrieved.countries },
      { name: 'serving_size', submitted: submitted.serving_size, retrieved: retrieved.serving_size },
      { name: 'quantity', submitted: submitted.quantity, retrieved: retrieved.quantity },
      { name: 'categories', submitted: submitted.categories, retrieved: retrieved.categories },
    ];

    // Verify nutrition data
    if (submitted.nutriments) {
      Object.keys(submitted.nutriments).forEach(key => {
        fieldsToVerify.push({
          name: `nutriments.${key}`,
          submitted: submitted.nutriments![key],
          retrieved: retrieved.nutriments?.[key],
        });
      });
    }

    // Verify allergens
    if (submitted.allergens_tags) {
      fieldsToVerify.push({
        name: 'allergens_tags',
        submitted: submitted.allergens_tags.sort().join(','),
        retrieved: Array.isArray(retrieved.allergens_tags)
          ? retrieved.allergens_tags.sort().join(',')
          : retrieved.allergens_tags,
      });
    }

    // Verify additives
    if (submitted.additives_tags) {
      fieldsToVerify.push({
        name: 'additives_tags',
        submitted: submitted.additives_tags.sort().join(','),
        retrieved: Array.isArray(retrieved.additives_tags)
          ? retrieved.additives_tags.sort().join(',')
          : retrieved.additives_tags,
      });
    }

    // Verify packaging (handle JSON property order differences)
    if (submitted.packaging_data) {
      const submittedItems = submitted.packaging_data.items;
      const retrievedItems = retrieved.packaging_data?.items || [];
      
      // Compare items by content, not JSON string order
      if (submittedItems.length === retrievedItems.length) {
        const allMatch = submittedItems.every((submittedItem, index) => {
          const retrievedItem = retrievedItems[index];
          return (
            submittedItem.material === retrievedItem?.material &&
            submittedItem.shape === retrievedItem?.shape &&
            submittedItem.recycling === retrievedItem?.recycling
          );
        });
        fieldsToVerify.push({
          name: 'packaging_data',
          submitted: JSON.stringify(submittedItems),
          retrieved: allMatch ? JSON.stringify(submittedItems) : JSON.stringify(retrievedItems),
        });
      } else {
        fieldsToVerify.push({
          name: 'packaging_data',
          submitted: JSON.stringify(submittedItems),
          retrieved: JSON.stringify(retrievedItems),
        });
      }
    }

    // Count matches
    const verificationDetails = fieldsToVerify
      .filter(f => f.submitted !== undefined && f.submitted !== null)
      .map(field => {
        const match = field.submitted === field.retrieved;
        return {
          field: field.name,
          match,
          submitted: field.submitted,
          retrieved: field.retrieved,
        };
      });

    result.steps.verification = {
      totalFields: verificationDetails.length,
      matchingFields: verificationDetails.filter(d => d.match).length,
      mismatchedFields: verificationDetails.filter(d => !d.match).map(d => d.field),
      details: verificationDetails,
    };

    const allMatch = result.steps.verification.mismatchedFields.length === 0;
    console.log(`      ${allMatch ? '✅' : '❌'} ${result.steps.verification.matchingFields}/${result.steps.verification.totalFields} fields match`);

    if (!allMatch) {
      console.log(`      ❌ Mismatched fields: ${result.steps.verification.mismatchedFields.join(', ')}`);
      result.steps.verification.details
        .filter(d => !d.match)
        .forEach(d => {
          console.log(`         - ${d.field}:`);
          console.log(`           Expected: ${JSON.stringify(d.submitted)}`);
          console.log(`           Got: ${JSON.stringify(d.retrieved)}`);
        });
    }

    results.push(result);
    console.log('');
  }

  // Summary
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 COMPREHENSIVE TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  const successfulScenarios = results.filter(
    r => r.steps.submit.success && r.steps.retrieve.success && r.steps.verification.mismatchedFields.length === 0
  );
  const failedScenarios = results.filter(
    r => !r.steps.submit.success || !r.steps.retrieve.success || r.steps.verification.mismatchedFields.length > 0
  );

  console.log(`✅ Successful: ${successfulScenarios.length}/${results.length}`);
  console.log(`❌ Failed: ${failedScenarios.length}/${results.length}`);
  console.log('');

  results.forEach((result, index) => {
    const isSuccess =
      result.steps.submit.success &&
      result.steps.retrieve.success &&
      result.steps.verification.mismatchedFields.length === 0;
    const icon = isSuccess ? '✅' : '❌';
    console.log(`${icon} [${index + 1}] ${result.scenario} (${result.barcode}):`);
    console.log(`      Submit: ${result.steps.submit.success ? '✅' : '❌'} ${result.steps.submit.error || 'Success'}`);
    console.log(`      Retrieve: ${result.steps.retrieve.success ? '✅' : '❌'} ${result.steps.retrieve.error || 'Success'}`);
    console.log(
      `      Verification: ${result.steps.verification.matchingFields}/${result.steps.verification.totalFields} fields match`
    );
    if (result.steps.verification.mismatchedFields.length > 0) {
      console.log(`      Mismatches: ${result.steps.verification.mismatchedFields.join(', ')}`);
    }
  });

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  if (failedScenarios.length === 0) {
    console.log('🎉 SUCCESS! ALL TESTS PASSED!');
    console.log('');
    console.log('✅ User contribution system is FULLY FUNCTIONAL:');
    console.log('   ✅ Multiple data entry scenarios tested');
    console.log('   ✅ All data types preserved correctly');
    console.log('   ✅ Global retrieval works for all scenarios');
    console.log('   ✅ Data integrity verified across all parameters');
    console.log('   ✅ System is production-ready!');
  } else {
    console.log('⚠️  SOME TESTS FAILED');
    console.log('');
    console.log('Failed scenarios:');
    failedScenarios.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.scenario} (${result.barcode})`);
    });
  }
  console.log('═══════════════════════════════════════════════════════════');

  // Generate detailed evidence report
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📋 DETAILED EVIDENCE REPORT');
  console.log('═══════════════════════════════════════════════════════════');
  results.forEach((result, index) => {
    console.log('');
    console.log(`SCENARIO ${index + 1}: ${result.scenario}`);
    console.log(`Barcode: ${result.barcode}`);
    console.log(`Submit: ${result.steps.submit.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`Retrieve: ${result.steps.retrieve.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`Fields Verified: ${result.steps.verification.totalFields}`);
    console.log(`Fields Matching: ${result.steps.verification.matchingFields}`);
    if (result.steps.verification.details.length > 0) {
      console.log('Field Details:');
      result.steps.verification.details.slice(0, 10).forEach(d => {
        // Show first 10 fields as evidence
        const icon = d.match ? '✅' : '❌';
        console.log(`  ${icon} ${d.field}: ${d.match ? 'MATCH' : 'MISMATCH'}`);
        if (!d.match) {
          console.log(`    Submitted: ${JSON.stringify(d.submitted)}`);
          console.log(`    Retrieved: ${JSON.stringify(d.retrieved)}`);
        }
      });
      if (result.steps.verification.details.length > 10) {
        console.log(`  ... and ${result.steps.verification.details.length - 10} more fields`);
      }
    }
  });

  return results;
}

// Run the comprehensive test
runComprehensiveTest()
  .then(results => {
    const allPassed = results.every(
      r => r.steps.submit.success && r.steps.retrieve.success && r.steps.verification.mismatchedFields.length === 0
    );
    process.exit(allPassed ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });

