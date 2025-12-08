/**
 * Populate FSANZ Database from Open Food Facts - Node.js version
 * Uses Node.js built-in modules for reliability
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Parse arguments
const args = process.argv.slice(2);
let country = null;
let limit = 2000;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--country' && args[i + 1]) {
    country = args[i + 1].toUpperCase();
    i++;
  } else if (args[i] === '--limit' && args[i + 1]) {
    limit = parseInt(args[i + 1], 10);
    i++;
  }
}

if (!country || (country !== 'AU' && country !== 'NZ')) {
  console.error('Usage: node populateFSANZNode.js --country <NZ|AU> [--limit <number>]');
  process.exit(1);
}

const outputFile = path.join(__dirname, '..', 'backend', 'vercel', 'data', `fsanz-${country.toLowerCase()}.json`);
const countryTag = country === 'NZ' ? 'en:new-zealand' : 'en:australia';

function fetchPage(page, pageSize) {
  return new Promise((resolve, reject) => {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?action=process&countries_tags=${countryTag}&page_size=${pageSize}&page=${page}&json=1&fields=code,product_name,product_name_en,brands,categories_tags,nutriments,ingredients_text`;
    
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
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function main() {
  console.log('========================================');
  console.log(`Populate FSANZ ${country} Database`);
  console.log('========================================');
  console.log(`Target: ${limit} products\n`);

  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const database = {};
  let page = 1;
  let fetched = 0;
  const pageSize = 100;

  while (fetched < limit) {
    try {
      console.log(`Fetching page ${page}... (${fetched}/${limit} products)`);
      
      const data = await fetchPage(page, pageSize);
      
      if (!data.products || data.products.length === 0) {
        console.log('No more products found');
        break;
      }

      for (const product of data.products) {
        if (fetched >= limit) break;
        
        const barcode = product.code;
        if (!barcode || barcode.length < 8) continue;

        const productName = product.product_name || product.product_name_en || `Product ${barcode}`;
        if (!productName) continue;

        const nutriments = product.nutriments || {};
        const fsanzProduct = {
          productName,
          country,
        };

        if (product.brands) {
          fsanzProduct.brand = product.brands.split(',')[0].trim();
        }

        if (nutriments['energy-kcal_100g']) {
          fsanzProduct.energyKcal = nutriments['energy-kcal_100g'];
        } else if (nutriments['energy-kj_100g']) {
          fsanzProduct.energyKcal = Math.round((nutriments['energy-kj_100g'] / 4.184) * 100) / 100;
        }

        const nutrientMap = {
          'fat_100g': 'fat',
          'saturated-fat_100g': 'saturatedFat',
          'carbohydrates_100g': 'carbohydrates',
          'sugars_100g': 'sugars',
          'proteins_100g': 'protein',
          'salt_100g': 'salt',
          'sodium_100g': 'sodium',
          'fiber_100g': 'dietaryFiber',
        };

        for (const [key, prop] of Object.entries(nutrientMap)) {
          if (nutriments[key]) {
            fsanzProduct[prop] = nutriments[key];
          }
        }

        if (product.ingredients_text) {
          fsanzProduct.ingredients = product.ingredients_text;
        }

        if (product.categories_tags && product.categories_tags.length > 0) {
          fsanzProduct.categories = product.categories_tags.slice(0, 3);
        }

        database[barcode] = fsanzProduct;
        fetched++;
      }

      console.log(`  ✅ Fetched ${data.products.length} products (total: ${fetched})`);
      
      if (data.products.length < pageSize) {
        console.log('Reached end of available products');
        break;
      }

      page++;
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`Error fetching page ${page}: ${error.message}`);
      break;
    }
  }

  if (Object.keys(database).length === 0) {
    console.error('No products found!');
    process.exit(1);
  }

  fs.writeFileSync(outputFile, JSON.stringify(database, null, 2), 'utf8');
  const fileSize = fs.statSync(outputFile).size;

  console.log('');
  console.log('========================================');
  console.log('✅ Conversion Complete!');
  console.log('========================================');
  console.log(`   Country: ${country}`);
  console.log(`   Products: ${Object.keys(database).length.toLocaleString()}`);
  console.log(`   Output: ${outputFile}`);
  console.log(`   Size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
  console.log('');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
