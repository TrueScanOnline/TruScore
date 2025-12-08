/**
 * Final FSANZ Test with Real Barcodes
 */

const fs = require('fs');
const path = require('path');

const NZFCD_FILE = path.join(__dirname, '..', 'backend', 'vercel', 'data', 'nzfcd.json');
const TEST_LOG = path.join(__dirname, '..', 'FSANZ_FINAL_TEST.txt');

fs.writeFileSync(TEST_LOG, 'FSANZ FINAL TEST WITH REAL BARCODES\n');
fs.writeFileSync(TEST_LOG, '='.repeat(80) + '\n\n', { flag: 'a' });

function log(msg) {
  const m = String(msg);
  console.log(m);
  fs.appendFileSync(TEST_LOG, m + '\n');
}

log('Testing FSANZ with Real Barcodes\n');

// Load database
let nzfcd = [];
if (fs.existsSync(NZFCD_FILE)) {
  try {
    const raw = JSON.parse(fs.readFileSync(NZFCD_FILE, 'utf8'));
    const valid = raw.filter(f => {
      const n = f.foodName || f['Food Name'] || '';
      return n && !n.match(/^Food \d+$/) && n.length > 2 && !f.rawData;
    });
    nzfcd = valid;
    log(`NZFCD: ${raw.length} total, ${valid.length} valid`);
    
    if (valid.length > 0) {
      log(`  Sample: "${valid[0].foodName}"`);
    }
    
    if (valid.length < 100) {
      log('  ⚠️  WARNING: Database appears broken!');
    }
  } catch (error) {
    log(`  ❌ Error: ${error.message}`);
  }
} else {
  log('  ❌ NZFCD file not found!');
}

if (nzfcd.length < 100) {
  log('\n❌ CRITICAL: Database is broken or empty!');
  log('❌ FSANZ queries will return NOTHING');
  log('❌ TruScore will NOT get FSANZ data');
  process.exit(1);
}

// Test with real barcodes
const barcodes = ['9313958005890', '9310047207180', '9310645467740'];
let totalTests = 0;
let successfulMatches = 0;

(async () => {
  for (const barcode of barcodes) {
    log(`\n${'='.repeat(60)}`);
    log(`Barcode: ${barcode}`);
    log(`${'='.repeat(60)}`);
    
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();
      
      if (data.status !== 1 || !data.product) {
        log(`  ❌ Product not found in Open Food Facts`);
        continue;
      }
      
      const productName = data.product.product_name || data.product.product_name_en || null;
      if (!productName) {
        log(`  ❌ No product name`);
        continue;
      }
      
      totalTests++;
      log(`  Product: "${productName}"`);
      
      const searchName = productName.toLowerCase().trim();
      const keywords = searchName.split(/\s+/).filter(w => w.length > 2).slice(0, 5);
      
      // Search database
      let matches = [];
      for (const food of nzfcd) {
        const foodName = (food.foodName || food['Food Name'] || '').toLowerCase();
        if (!foodName) continue;
        
        if (foodName === searchName) {
          matches.push({ name: food.foodName || food['Food Name'], score: 1000, type: 'exact' });
        } else if (foodName.includes(searchName) || searchName.includes(foodName)) {
          matches.push({ name: food.foodName || food['Food Name'], score: 500, type: 'contains' });
        } else {
          let matched = 0;
          for (const keyword of keywords) {
            if (foodName.includes(keyword)) matched++;
          }
          if (matched >= Math.max(1, Math.ceil(keywords.length * 0.4))) {
            matches.push({ name: food.foodName || food['Food Name'], score: matched * 50, type: 'keywords' });
          }
        }
      }
      
      if (matches.length > 0) {
        matches.sort((a, b) => b.score - a.score);
        const best = matches[0];
        log(`  ✅ FOUND ${matches.length} MATCHES`);
        log(`  ✅ Best: "${best.name}" (${best.type}, score: ${best.score})`);
        log(`  ✅ FSANZ query WILL RETURN DATA`);
        log(`  ✅ TruScore WILL get FSANZ nutrition data`);
        successfulMatches++;
      } else {
        log(`  ❌ NO MATCHES FOUND`);
        log(`  ❌ FSANZ query will return NOTHING`);
        log(`  ❌ TruScore will NOT get FSANZ data`);
      }
    } catch (error) {
      log(`  ❌ Error: ${error.message}`);
    }
  }
  
  // Final summary
  log('\n' + '='.repeat(80));
  log('FINAL SUMMARY');
  log('='.repeat(80));
  log(`\nDatabase: ${nzfcd.length} valid foods`);
  log(`Tests: ${totalTests}`);
  log(`Successful matches: ${successfulMatches}/${totalTests}`);
  
  if (successfulMatches === 0 && totalTests > 0) {
    log('\n❌ CRITICAL: NO MATCHES FOUND FOR ANY PRODUCT');
    log('❌ FSANZ integration is NOT WORKING');
    log('❌ TruScore will NOT get FSANZ data');
  } else if (successfulMatches === totalTests && totalTests > 0) {
    log('\n✅ SUCCESS: All products will get FSANZ data');
    log('✅ FSANZ integration is WORKING');
    log('✅ TruScore WILL get FSANZ nutrition data');
  } else if (successfulMatches > 0) {
    log('\n⚠️  PARTIAL: Some products will get FSANZ data');
  }
  
  log(`\nFull log: ${TEST_LOG}`);
  log('='.repeat(80));
})();

