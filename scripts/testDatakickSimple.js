// Simple test for Datakick API
const https = require('https');

const testBarcode = '9346321000475'; // Hommus Classic
const url = `https://api.gtinsearch.org/v1/products/${testBarcode}`;

console.log(`Testing Datakick API with barcode: ${testBarcode}`);
console.log(`URL: ${url}\n`);

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      if (result.name || result.brand) {
        console.log('✅ SUCCESS: Product found!');
        console.log(`   Name: ${result.name || 'N/A'}`);
        console.log(`   Brand: ${result.brand || 'N/A'}`);
        console.log(`   Has image: ${result.image ? 'Yes' : 'No'}`);
        console.log(`   Has nutrition: ${result.nutrition ? 'Yes' : 'No'}`);
      } else {
        console.log('❌ Product not found or no data');
      }
    } catch (e) {
      console.log('❌ Error parsing response:', e.message);
      console.log('Response:', data.substring(0, 200));
    }
  });
}).on('error', (err) => {
  console.log('❌ Error:', err.message);
});

