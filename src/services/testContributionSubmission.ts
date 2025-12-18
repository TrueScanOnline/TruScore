/**
 * TEST: Direct Contribution Submission Test
 * 
 * This file tests if the contribution submission actually works
 * Run this to verify the entire flow from submission to retrieval
 */

import { saveManualProduct } from './manualProductService';
import { ManualProductData } from '../types/manualProduct';
import { getUserContributedProduct } from './userContributedProductsService';
import { logger } from '../utils/logger';

/**
 * Test the complete submission and retrieval flow
 */
export async function testContributionSubmission(barcode: string): Promise<{
  submissionSuccess: boolean;
  retrievalSuccess: boolean;
  submissionError?: string;
  retrievalError?: string;
  submittedData?: any;
  retrievedData?: any;
}> {
  console.log(`\n🧪 TESTING CONTRIBUTION SUBMISSION FOR BARCODE: ${barcode}\n`);
  
  const result = {
    submissionSuccess: false,
    retrievalSuccess: false,
    submissionError: undefined as string | undefined,
    retrievalError: undefined as string | undefined,
    submittedData: undefined as any,
    retrievedData: undefined as any,
  };
  
  // Step 1: Submit test data
  console.log(`[TEST] Step 1: Submitting test data...`);
  try {
    const testData: ManualProductData = {
      barcode,
      product_name: `TEST PRODUCT ${Date.now()}`,
      brands: 'Test Brand',
      ingredients_text: 'Test ingredients: water, sugar, test',
      image_url: 'https://example.com/test-image.jpg',
      nutriments: {
        energy: 250,
        fat: 10,
        protein: 5,
        carbohydrates: 30,
      },
      timestamp: Date.now(),
    };
    
    console.log(`[TEST] Test data:`, testData);
    
    const submissionResult = await saveManualProduct(testData);
    result.submissionSuccess = submissionResult;
    result.submittedData = testData;
    
    if (submissionResult) {
      console.log(`[TEST] ✅ Submission successful!`);
    } else {
      console.error(`[TEST] ❌ Submission failed!`);
      result.submissionError = 'saveManualProduct returned false';
    }
  } catch (error) {
    console.error(`[TEST] ❌ Submission error:`, error);
    result.submissionError = error instanceof Error ? error.message : String(error);
  }
  
  // Wait a bit for backend to process
  console.log(`[TEST] Waiting 2 seconds for backend to process...`);
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Step 2: Retrieve the data
  console.log(`[TEST] Step 2: Retrieving submitted data...`);
  try {
    const retrievedProduct = await getUserContributedProduct(barcode);
    
    if (retrievedProduct) {
      result.retrievalSuccess = true;
      result.retrievedData = retrievedProduct;
      console.log(`[TEST] ✅ Retrieval successful!`);
      console.log(`[TEST] Retrieved product:`, {
        barcode: retrievedProduct.barcode,
        product_name: retrievedProduct.product_name,
        hasPhoto: !!retrievedProduct.image_url,
        hasIngredients: !!retrievedProduct.ingredients_text,
        hasNutrition: !!retrievedProduct.nutriments,
      });
    } else {
      console.error(`[TEST] ❌ Retrieval failed - product not found!`);
      result.retrievalError = 'Product not found in backend';
    }
  } catch (error) {
    console.error(`[TEST] ❌ Retrieval error:`, error);
    result.retrievalError = error instanceof Error ? error.message : String(error);
  }
  
  // Step 3: Compare submitted vs retrieved
  if (result.submissionSuccess && result.retrievalSuccess) {
    console.log(`[TEST] ✅ COMPLETE SUCCESS: Data submitted and retrieved!`);
    
    // Verify data matches
    const dataMatches = 
      result.submittedData?.product_name === result.retrievedData?.product_name &&
      result.submittedData?.barcode === result.retrievedData?.barcode;
    
    if (dataMatches) {
      console.log(`[TEST] ✅ Data integrity verified!`);
    } else {
      console.warn(`[TEST] ⚠️  Data mismatch detected!`);
    }
  } else {
    console.error(`[TEST] ❌ TEST FAILED:`);
    if (!result.submissionSuccess) {
      console.error(`[TEST]   - Submission failed: ${result.submissionError}`);
    }
    if (!result.retrievalSuccess) {
      console.error(`[TEST]   - Retrieval failed: ${result.retrievalError}`);
    }
  }
  
  console.log(`\n🧪 TEST COMPLETE\n`);
  
  return result;
}

