/**
 * Test with products known to have recalls
 */

import { checkComprehensiveUSRecalls } from '../src/services/recallsGovService';

// Products that should have USDA FSIS recalls (meat/poultry)
const MEAT_PRODUCTS = [
  { productName: 'chicken', brand: 'Tyson', barcode: '034000000000' },
  { productName: 'beef', brand: 'Tyson', barcode: '034000000000' },
  { productName: 'turkey', brand: 'Perdue', barcode: '034000000000' },
];

async function test() {
  console.log('Testing USDA FSIS with meat products...\n');
  
  for (const product of MEAT_PRODUCTS) {
    console.log(`Testing: ${product.productName} (${product.brand})`);
    try {
      const results = await checkComprehensiveUSRecalls(product.productName, product.brand, product.barcode);
      console.log(`  Results: ${results.length}`);
      if (results.length > 0) {
        console.log(`  First result: ${JSON.stringify(results[0]).substring(0, 200)}`);
      }
    } catch (error) {
      console.log(`  Error: ${error}`);
    }
    console.log('');
  }
}

test().catch(console.error);

