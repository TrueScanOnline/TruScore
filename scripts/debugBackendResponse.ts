/**
 * Debug: Check what the backend actually returns
 */

import { getBackendUrl, BackendEndpoints } from '../src/config/backendConfig';

const BACKEND_URL = getBackendUrl();
const MANUAL_PRODUCTS_API = BackendEndpoints.manualProducts(BACKEND_URL);
const testBarcode = '9999999999999';

async function debugBackend() {
  console.log('Fetching from:', `${MANUAL_PRODUCTS_API}?barcode=${testBarcode}`);
  
  const response = await fetch(`${MANUAL_PRODUCTS_API}?barcode=${encodeURIComponent(testBarcode)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  console.log('Full response:', JSON.stringify(data, null, 2));
  
  if (data.product) {
    console.log('\nProduct keys:', Object.keys(data.product));
    console.log('productData?', data.product.productData ? 'YES' : 'NO');
    if (data.product.productData) {
      console.log('productData keys:', Object.keys(data.product.productData));
    }
  }
}

debugBackend().catch(console.error);

