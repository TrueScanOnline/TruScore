/**
 * Populate FSANZ Database from Open Food Facts
 * 
 * This script fetches NZ/AU products from Open Food Facts and converts them
 * to FSANZ database format with barcodes.
 * 
 * Usage:
 *   node scripts/populateFSANZFromOpenFoodFacts.js --country NZ --limit 1000
 *   node scripts/populateFSANZFromOpenFoodFacts.js --country AU --limit 1000
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Parse command line arguments
const args = process.argv.slice(2);
let country = null;
let limit = 1000; // Default limit

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
  console.error('Usage: node populateFSANZFromOpenFoodFacts.js --country <NZ|AU> [--limit <number>]');
  console.error('');
  console.error('Example:');
  console.error('  node populateFSANZFromOpenFoodFacts.js --country NZ --limit 5000');
  process.exit(1);
}

const outputFile = path.join(__dirname, '..', 'backend', 'vercel', 'data', `fsanz-${country.toLowerCase()}.json`);

/**
 * Fetch products from Open Food Facts for a specific country
 */
async function fetchProductsFromOFF(countryCode, limit) {
  const database = {};
  let page = 1;
  let fetched = 0;
  const pageSize = 100; // OFF API limit per page
  
  console.log(`Fetching ${countryCode} products from Open Food Facts...`);
  console.log(`Target: ${limit} products`);
  console.log('');

  while (fetched < limit) {
    try {
      // Use world instance with country filter
      const countryTag = countryCode === 'NZ' ? 'en:new-zealand' : 'en:australia';
      const url = `https://world.openfoodfacts.org/cgi/search.pl?action=process&countries_tags=${countryTag}&page_size=${pageSize}&page=${page}&json=1&fields=code,product_name,product_name_en,brands,categories_tags,nutriments,ingredients_text,packaging,ecoscore_grade,nutriscore_grade`;
      
      console.log(`Fetching page ${page}... (${fetched}/${limit} products)`);
      
      // Use Node.js https/http module for compatibility
      const data = await new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const client = urlObj.protocol === 'https:' ? https : http;
        
        const options = {
          hostname: urlObj.hostname,
          port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
          path: urlObj.pathname + urlObj.search,
          method: 'GET',
          headers: {
            'User-Agent': 'TrueScan-FoodScanner/1.0.0',
            'Accept': 'application/json',
          },
        };

        const req = client.request(options, (res) => {
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
            return;
          }

          let body = '';
          res.on('data', (chunk) => {
            body += chunk;
          });
          
          res.on('end', () => {
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              reject(new Error(`Failed to parse JSON: ${e.message}`));
            }
          });
        });

        req.on('error', (error) => {
          reject(error);
        });

        req.setTimeout(30000, () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });

        req.end();
      });
      
      if (!data.products || !Array.isArray(data.products) || data.products.length === 0) {
        console.log('No more products found');
        break;
      }

      for (const product of data.products) {
        if (fetched >= limit) break;
        
        const barcode = product.code;
        if (!barcode || barcode.length < 8) continue;

        // Convert to FSANZ format
        const nutriments = product.nutriments || {};
        const fsanzProduct = {
          productName: product.product_name || product.product_name_en || `Product ${barcode}`,
          brand: product.brands ? product.brands.split(',')[0].trim() : undefined,
          energyKcal: nutriments['energy-kcal_100g'] || (nutriments['energy-kj_100g'] ? nutriments['energy-kj_100g'] / 4.184 : undefined),
          fat: nutriments['fat_100g'],
          saturatedFat: nutriments['saturated-fat_100g'],
          carbohydrates: nutriments['carbohydrates_100g'],
          sugars: nutriments['sugars_100g'],
          protein: nutriments['proteins_100g'],
          salt: nutriments['salt_100g'],
          sodium: nutriments['sodium_100g'],
          dietaryFiber: nutriments['fiber_100g'],
          ingredients: product.ingredients_text,
          categories: product.categories_tags ? product.categories_tags.slice(0, 3) : undefined,
          country: countryCode,
        };

        // Only add if has at least product name
        if (fsanzProduct.productName) {
          database[barcode] = fsanzProduct;
          fetched++;
        }
      }

      console.log(`  Fetched ${data.products.length} products (total: ${fetched})`);
      
      // If we got fewer products than page size, we've reached the end
      if (data.products.length < pageSize) {
        console.log('Reached end of available products');
        break;
      }

      page++;
      
      // Rate limiting - be nice to Open Food Facts
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`Error fetching page ${page}:`, error.message);
      break;
    }
  }

  return database;
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('========================================');
    console.log(`Populate FSANZ ${country} Database`);
    console.log('========================================');
    console.log('');

    // Ensure output directory exists
    const outputDir = path.dirname(outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`Created output directory: ${outputDir}`);
    }

    // Fetch products from Open Food Facts
    const database = await fetchProductsFromOFF(country, limit);

    const productCount = Object.keys(database).length;
    
    if (productCount === 0) {
      console.error('No products found!');
      process.exit(1);
    }

    // Write to file
    fs.writeFileSync(outputFile, JSON.stringify(database, null, 2), 'utf8');
    
    const fileSize = fs.statSync(outputFile).size;
    
    console.log('');
    console.log('========================================');
    console.log('✅ Conversion Complete!');
    console.log('========================================');
    console.log(`   Country: ${country}`);
    console.log(`   Products: ${productCount.toLocaleString()}`);
    console.log(`   Output: ${outputFile}`);
    console.log(`   Size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
    console.log('');
    console.log('Next step: Deploy to Vercel');
    console.log('   cd backend\\vercel');
    console.log('   vercel --prod');
    console.log('');

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
