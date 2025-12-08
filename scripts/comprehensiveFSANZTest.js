const fs = require('fs');
const path = require('path');

const outputFile = path.join(__dirname, '..', 'FSANZ_REAL_TEST_RESULTS.txt');
fs.writeFileSync(outputFile, 'FSANZ REAL BARCODE TEST RESULTS\n');
fs.appendFileSync(outputFile, '='.repeat(80) + '\n\n');

function log(msg) {
  const message = String(msg);
  console.log(message);
  fs.appendFileSync(outputFile, message + '\n');
}

const barcodes = ['9313958005890', '9310047207180', '9310645467740'];
const nzfcdPath = path.join(__dirname, '..', 'backend', 'vercel', 'data', 'nzfcd.json');
const afcdPath = path.join(__dirname, '..', 'backend', 'vercel', 'data', 'afcd.json');

log('Testing FSANZ Integration with Real Barcodes\n');

// Get product names
log('STEP 1: Getting product names from Open Food Facts\n');
const products = [];

(async () => {
  for (const barcode of barcodes) {
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();
      
      if (data.status === 1 && data.product) {
        const productName = data.product.product_name || data.product.product_name_en || 'N/A';
        products.push({ barcode, productName });
        log(`  ✅ ${barcode}: "${productName}"`);
      } else {
        products.push({ barcode, productName: null });
        log(`  ❌ ${barcode}: Not found in Open Food Facts`);
      }
    } catch (error) {
      products.push({ barcode, productName: null, error: error.message });
      log(`  ❌ ${barcode}: Error - ${error.message}`);
    }
  }
  
  // Check databases
  log('\n' + '='.repeat(80));
  log('STEP 2: Checking FSANZ Databases');
  log('='.repeat(80) + '\n');
  
  let nzfcd = [];
  let afcd = [];
  
  if (fs.existsSync(nzfcdPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(nzfcdPath, 'utf8'));
      const valid = raw.filter(e => {
        const n = e.foodName || e['Food Name'] || '';
        return n && !n.match(/^Food \d+$/) && n.length > 2;
      });
      log(`NZFCD: ${raw.length} total entries`);
      log(`       ${valid.length} valid entries (${((valid.length/raw.length)*100).toFixed(1)}%)`);
      
      if (valid.length < 100) {
        log('  ⚠️  CRITICAL: Database is broken! Most entries are invalid!');
        log('  ⚠️  FSANZ queries will FAIL because database has no valid food names!');
      } else {
        log('  ✅ Database has valid entries');
        nzfcd = valid;
      }
      
      if (valid.length > 0) {
        log(`  Sample valid entry: "${valid[0].foodName || valid[0]['Food Name']}"`);
      }
    } catch (error) {
      log(`  ❌ Error reading NZFCD: ${error.message}`);
    }
  } else {
    log('  ❌ NZFCD file not found!');
  }
  
  if (fs.existsSync(afcdPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(afcdPath, 'utf8'));
      const valid = raw.filter(e => {
        const n = e.foodName || e['Food Name'] || '';
        return n && !n.match(/^Food \d+$/) && n.length > 2;
      });
      log(`\nAFCD: ${raw.length} total entries`);
      log(`      ${valid.length} valid entries (${((valid.length/raw.length)*100).toFixed(1)}%)`);
      
      if (valid.length > 1000) {
        log('  ✅ Database looks good');
        afcd = valid;
      }
    } catch (error) {
      log(`  ❌ Error reading AFCD: ${error.message}`);
    }
  } else {
    log('  ❌ AFCD file not found!');
  }
  
  // Test matching
  log('\n' + '='.repeat(80));
  log('STEP 3: Testing Product Name Matching (Will FSANZ Return Data?)');
  log('='.repeat(80) + '\n');
  
  let totalTests = 0;
  let successfulMatches = 0;
  
  for (const product of products) {
    if (!product.productName) {
      log(`\n${product.barcode}: ❌ No product name`);
      log('  RESULT: FSANZ query will FAIL - no product name to search with');
      continue;
    }
    
    totalTests++;
    log(`\n${'='.repeat(60)}`);
    log(`Testing: "${product.productName}"`);
    log(`Barcode: ${product.barcode}`);
    log(`${'='.repeat(60)}`);
    
    const searchName = product.productName.toLowerCase().trim();
    const keywords = searchName.split(/\s+/).filter(w => w.length > 2).slice(0, 5);
    log(`Search term: "${searchName}"`);
    log(`Keywords: ${keywords.join(', ')}`);
    
    // Test NZFCD
    log(`\n  NZFCD Search (${nzfcd.length} foods):`);
    let nzfcdMatches = [];
    let checked = 0;
    
    for (const food of nzfcd) {
      checked++;
      if (checked > 5000) break; // Limit for speed
      
      const foodName = (food.foodName || food['Food Name'] || '').toLowerCase();
      if (!foodName) continue;
      
      // Contains match
      if (foodName.includes(searchName) || searchName.includes(foodName)) {
        nzfcdMatches.push({ 
          name: food.foodName || food['Food Name'], 
          score: 100,
          match: 'contains'
        });
      } else {
        // Keyword match
        let matched = 0;
        for (const keyword of keywords) {
          if (foodName.includes(keyword)) matched++;
        }
        if (matched >= Math.max(1, Math.ceil(keywords.length * 0.4))) {
          nzfcdMatches.push({ 
            name: food.foodName || food['Food Name'], 
            score: matched * 20,
            match: 'keywords'
          });
        }
      }
    }
    
    if (nzfcdMatches.length > 0) {
      nzfcdMatches.sort((a, b) => b.score - a.score);
      log(`    ✅ FOUND ${nzfcdMatches.length} MATCHES`);
      log(`    ✅ FSANZ query WILL RETURN DATA`);
      log(`    ✅ TruScore WILL get FSANZ nutrition data`);
      nzfcdMatches.slice(0, 3).forEach((m, i) => {
        log(`       ${i+1}. "${m.name}" (${m.match}, score: ${m.score})`);
      });
      successfulMatches++;
    } else {
      log(`    ❌ NO MATCHES FOUND`);
      log(`    ❌ FSANZ query will return NOTHING`);
      log(`    ❌ TruScore will NOT get FSANZ data for this product`);
    }
    
    // Test AFCD
    log(`\n  AFCD Search (${afcd.length} foods):`);
    let afcdMatches = [];
    checked = 0;
    
    for (const food of afcd) {
      checked++;
      if (checked > 5000) break;
      
      const foodName = (food.foodName || food['Food Name'] || '').toLowerCase();
      if (!foodName) continue;
      
      if (foodName.includes(searchName) || searchName.includes(foodName)) {
        afcdMatches.push({ 
          name: food.foodName || food['Food Name'], 
          score: 100,
          match: 'contains'
        });
      } else {
        let matched = 0;
        for (const keyword of keywords) {
          if (foodName.includes(keyword)) matched++;
        }
        if (matched >= Math.max(1, Math.ceil(keywords.length * 0.4))) {
          afcdMatches.push({ 
            name: food.foodName || food['Food Name'], 
            score: matched * 20,
            match: 'keywords'
          });
        }
      }
    }
    
    if (afcdMatches.length > 0) {
      afcdMatches.sort((a, b) => b.score - a.score);
      log(`    ✅ FOUND ${afcdMatches.length} MATCHES`);
      log(`    ✅ FSANZ query WILL RETURN DATA`);
      log(`    ✅ TruScore WILL get FSANZ nutrition data`);
      afcdMatches.slice(0, 3).forEach((m, i) => {
        log(`       ${i+1}. "${m.name}" (${m.match}, score: ${m.score})`);
      });
      successfulMatches++;
    } else {
      log(`    ❌ NO MATCHES FOUND`);
      log(`    ❌ FSANZ query will return NOTHING`);
      log(`    ❌ TruScore will NOT get FSANZ data for this product`);
    }
  }
  
  // Final summary
  log('\n' + '='.repeat(80));
  log('FINAL SUMMARY');
  log('='.repeat(80));
  log(`\nTests run: ${totalTests}`);
  log(`Successful matches: ${successfulMatches} / ${totalTests * 2} (NZFCD + AFCD)`);
  
  if (successfulMatches === 0) {
    log('\n❌ CRITICAL: NO MATCHES FOUND FOR ANY PRODUCT');
    log('❌ FSANZ integration is NOT WORKING');
    log('❌ TruScore will NOT get FSANZ data for these products');
  } else if (successfulMatches < totalTests) {
    log('\n⚠️  PARTIAL: Some products will get FSANZ data, some will not');
  } else {
    log('\n✅ SUCCESS: All products would get FSANZ data');
  }
  
  log(`\nFull results saved to: ${outputFile}`);
  log('\n' + '='.repeat(80));
})();

