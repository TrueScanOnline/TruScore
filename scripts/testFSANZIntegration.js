/**
 * Test FSANZ Integration with Real Barcodes
 * This script tests if the integration actually works end-to-end
 */

const fs = require('fs');
const path = require('path');

const barcodes = ['9313958005890', '9310047207180', '9310645467740'];
const nzfcdPath = path.join(__dirname, '..', 'backend', 'vercel', 'data', 'nzfcd.json');
const afcdPath = path.join(__dirname, '..', 'backend', 'vercel', 'data', 'afcd.json');

console.log('='.repeat(80));
console.log('FSANZ INTEGRATION TEST - Real Barcode Testing');
console.log('='.repeat(80));
console.log('');

// Step 1: Get product names from barcodes
async function getProductNames() {
  console.log('Step 1: Getting product names from Open Food Facts...\n');
  const products = [];
  
  for (const barcode of barcodes) {
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();
      
      if (data.status === 1 && data.product) {
        const productName = data.product.product_name || data.product.product_name_en || 'N/A';
        products.push({ barcode, productName });
        console.log(`  ✅ ${barcode}: "${productName}"`);
      } else {
        products.push({ barcode, productName: null });
        console.log(`  ❌ ${barcode}: Not found in Open Food Facts`);
      }
    } catch (error) {
      products.push({ barcode, productName: null, error: error.message });
      console.log(`  ❌ ${barcode}: Error - ${error.message}`);
    }
  }
  
  return products;
}

// Step 2: Check database structure
function checkDatabaseStructure() {
  console.log('\n' + '='.repeat(80));
  console.log('Step 2: Checking Database Structure');
  console.log('='.repeat(80));
  console.log('');
  
  // Check NZFCD
  if (fs.existsSync(nzfcdPath)) {
    try {
      const nzfcd = JSON.parse(fs.readFileSync(nzfcdPath, 'utf8'));
      console.log(`NZFCD: ${nzfcd.length} entries`);
      
      // Check first 10 entries
      const sample = nzfcd.slice(0, 10);
      console.log('\nFirst 10 entries:');
      sample.forEach((entry, idx) => {
        const name = entry.foodName || entry['Food Name'] || entry.name || 'NO NAME FIELD';
        const hasValidName = name && !name.match(/^Food \d+$/);
        console.log(`  ${idx + 1}. "${name}" ${hasValidName ? '✅' : '❌ BROKEN'}`);
      });
      
      // Count valid entries
      const valid = nzfcd.filter(e => {
        const name = e.foodName || e['Food Name'] || e.name || '';
        return name && !name.match(/^Food \d+$/) && name.length > 2;
      });
      console.log(`\nValid entries: ${valid.length} / ${nzfcd.length} (${((valid.length/nzfcd.length)*100).toFixed(1)}%)`);
      
      if (valid.length < nzfcd.length * 0.5) {
        console.log('  ⚠️  WARNING: Database is mostly broken!');
      }
    } catch (error) {
      console.log(`  ❌ Error reading NZFCD: ${error.message}`);
    }
  } else {
    console.log('  ❌ NZFCD file not found!');
  }
  
  // Check AFCD
  if (fs.existsSync(afcdPath)) {
    try {
      const afcd = JSON.parse(fs.readFileSync(afcdPath, 'utf8'));
      console.log(`\nAFCD: ${afcd.length} entries`);
      
      const sample = afcd.slice(0, 10);
      console.log('\nFirst 10 entries:');
      sample.forEach((entry, idx) => {
        const name = entry.foodName || entry['Food Name'] || entry.name || 'NO NAME FIELD';
        const hasValidName = name && !name.match(/^Food \d+$/);
        console.log(`  ${idx + 1}. "${name}" ${hasValidName ? '✅' : '❌ BROKEN'}`);
      });
      
      const valid = afcd.filter(e => {
        const name = e.foodName || e['Food Name'] || e.name || '';
        return name && !name.match(/^Food \d+$/) && name.length > 2;
      });
      console.log(`\nValid entries: ${valid.length} / ${afcd.length} (${((valid.length/afcd.length)*100).toFixed(1)}%)`);
    } catch (error) {
      console.log(`  ❌ Error reading AFCD: ${error.message}`);
    }
  } else {
    console.log('  ❌ AFCD file not found!');
  }
}

// Step 3: Test matching
async function testMatching(products) {
  console.log('\n' + '='.repeat(80));
  console.log('Step 3: Testing Product Name Matching');
  console.log('='.repeat(80));
  console.log('');
  
  if (!fs.existsSync(nzfcdPath)) {
    console.log('❌ Cannot test - NZFCD file not found');
    return;
  }
  
  try {
    const nzfcd = JSON.parse(fs.readFileSync(nzfcdPath, 'utf8'));
    
    for (const product of products) {
      if (!product.productName) {
        console.log(`\n${product.barcode}: No product name - skipping`);
        continue;
      }
      
      console.log(`\nTesting: "${product.productName}"`);
      console.log(`  Barcode: ${product.barcode}`);
      
      // Extract keywords
      const searchName = product.productName.toLowerCase().trim();
      const keywords = searchName.split(/\s+/).filter(w => w.length > 2).slice(0, 5);
      console.log(`  Keywords: ${keywords.join(', ')}`);
      
      // Try to find matches
      const matches = [];
      let checked = 0;
      
      for (const food of nzfcd) {
        checked++;
        if (checked > 10000) break; // Limit search for speed
        
        // Get food name - try multiple fields
        let foodName = '';
        if (food.foodName && !food.foodName.match(/^Food \d+$/)) {
          foodName = food.foodName.toLowerCase();
        } else if (food['Food Name']) {
          foodName = food['Food Name'].toLowerCase();
        } else if (food.name) {
          foodName = food.name.toLowerCase();
        } else {
          continue;
        }
        
        // Check for matches
        if (foodName.includes(searchName) || searchName.includes(foodName)) {
          matches.push({ foodName: food.foodName || food['Food Name'] || food.name, score: 100 });
        } else {
          // Check keyword matches
          let keywordMatches = 0;
          for (const keyword of keywords) {
            if (foodName.includes(keyword)) {
              keywordMatches++;
            }
          }
          if (keywordMatches >= keywords.length * 0.5) {
            matches.push({ foodName: food.foodName || food['Food Name'] || food.name, score: keywordMatches * 20 });
          }
        }
      }
      
      if (matches.length > 0) {
        matches.sort((a, b) => b.score - a.score);
        console.log(`  ✅ Found ${matches.length} potential matches:`);
        matches.slice(0, 5).forEach((match, idx) => {
          console.log(`     ${idx + 1}. "${match.foodName}" (score: ${match.score})`);
        });
      } else {
        console.log(`  ❌ NO MATCHES FOUND`);
        console.log(`     This product will NOT get FSANZ data for TruScore!`);
      }
    }
  } catch (error) {
    console.log(`  ❌ Error testing: ${error.message}`);
  }
}

// Main execution
(async () => {
  const products = await getProductNames();
  checkDatabaseStructure();
  await testMatching(products);
  
  console.log('\n' + '='.repeat(80));
  console.log('TEST COMPLETE');
  console.log('='.repeat(80));
})();

