const https = require('https');

const url = 'https://nz.openfoodfacts.org/cgi/search.pl?action=process&tagtype_0=countries&tag_contains_0=contains&tag_0=NZ&page_size=10&page=1&json=1&fields=code,product_name';

console.log('Testing Open Food Facts connection...');
console.log('URL:', url);

const urlObj = new URL(url);
const options = {
  hostname: urlObj.hostname,
  port: 443,
  path: urlObj.pathname + urlObj.search,
  method: 'GET',
  headers: {
    'User-Agent': 'TrueScan-FoodScanner/1.0.0',
    'Accept': 'application/json',
  },
};

const req = https.request(options, (res) => {
  console.log('Status:', res.statusCode);
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      console.log('Products found:', data.products ? data.products.length : 0);
      if (data.products && data.products.length > 0) {
        console.log('First product:', data.products[0].code, data.products[0].product_name);
      }
    } catch (e) {
      console.error('Parse error:', e.message);
      console.log('Body preview:', body.substring(0, 200));
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error.message);
});

req.setTimeout(30000, () => {
  req.destroy();
  console.error('Request timeout');
});

req.end();
