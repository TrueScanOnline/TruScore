/**
 * Test Real Barcodes - End-to-End FSANZ Integration Test
 */

const fs = require('fs');
const path = require('path');

const barcodes = ['9313958005890', '9310047207180', '9310645467740'];
const nzfcdPath = path.join(__dirname, '..', 'backend', 'vercel', 'data', 'nzfcd.json');
const afcdPath = path.join(__dirname, '..', 'backend', 'vercel', 'data', 'afcd.json');

console.log('='.repeat(80));
console.log('REAL BARCODE TEST - FSANZ Integration Verification');
console.log('='.repeat(80));
console.log('');

async function testBarcodes() {
  // Step 1: Get product names
  console.log('STEP 1: Getting product names from Open Food Facts\n');
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
        console.log(`  ❌ ${barcode}: Not found`);
      }
    } catch (error) {
      products.push({ barcode, productName: null, error: error.message });
      console.log(`  ❌ ${barcode}: Error - ${error.message}`);
    }
  }
  
  // Step 2: Check databases
  console.log('\n' + '='.repeat(80));
  console.log('STEP 2: Checking FSANZ Databases');
  console.log('='.repeat(80));
  console.log('');
  
  let nzfcd = [];
  let afcd = [];
  
  if (fs.existsSync(nzfcdPath)) {
    try {
      nzfcd = JSON.parse(fs.readFileSync(nzfcdPath, 'utf8'));
      const valid = nzfcd.filter(e => {
        const n = e.foodName || e['Food Name'] || '';
        return n && !n.match(/^Food \d+$/) && n.length > 2;
      });
      console.log(`NZFCD: ${nzfcd.length} total, ${valid.length} valid (${((valid.length/nzfcd.length)*100).toFixed(1)}%)`);
      if (valid.length < 100) {
        console.log('  ⚠️  WARNING: Database is broken!');
      } else {
        console.log('  ✅ Database looks good');
        nzfcd = valid; // Use only valid entries
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
  } else {
    console.log('  ❌ NZFCD file not found!');
  }
  
  if (fs.existsSync(afcdPath)) {
    try {
      afcd = JSON.parse(fs.readFileSync(afcdPath, 'utf8'));
      const valid = afcd.filter(e => {
        const n = e.foodName || e['Food Name'] || '';
        return n && !n.match(/^Food \d+$/) && n.length > 2;
      });
      console.log(`AFCD: ${afcd.length} total, ${valid.length} valid (${((valid.length/afcd.length)*100).toFixed(1)}%)`);
      if (valid.length > 1000) {
        console.log('  ✅ Database looks good');
        afcd = valid;
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
  } else {
    console.log('  ❌ AFCD file not found!');
  }
  
  // Step 3: Test matching
  console.log('\n' + '='.repeat(80));
  console.log('STEP 3: Testing Product Name Matching');
  console.log('='.repeat(80));
  console.log('');
  
  for (const product of products) {
    if (!product.productName) {
      console.log(`\n${product.barcode}: ❌ No product name - FSANZ query will fail`);
      continue;
    }
    
    console.log(`\nTesting: "${product.productName}"`);
    console.log(`  Barcode: ${product.barcode}`);
    
    const searchName = product.productName.toLowerCase().trim();
    const keywords = searchName.split(/\s+/).filter(w => w.length > 2).slice(0, 5);
    console.log(`  Search: "${searchName}"`);
    console.log(`  Keywords: ${keywords.join(', ')}`);
    
    // Test NZFCD
    console.log(`  \n  Testing NZFCD (${nzfcd.length} foods)...`);
    let nzfcdMatches = [];
    
    for (const food of nzfcd) {
      const foodName = (food.foodName || food['Food Name'] || '').toLowerCase();
      if (!foodName) continue;
      
      // Exact or contains match
      if (foodName.includes(searchName) || searchName.includes(foodName)) {
        nzfcdMatches.push({ name: food.foodName || food['Food Name'], score: 100, type: 'contains' });
      } else {
        // Keyword matching
        let matchedKeywords = 0;
        for (const keyword of keywords) {
          if (foodName.includes(keyword)) {
            matchedKeywords++;
          }
        }
        if (matchedKeywords >= Math.ceil(keywords.length * 0.4)) {
          nzfcdMatches.push({ 
            name: food.foodName || food['Food Name'], 
            score: matchedKeywords * 20,
            type: 'keywords'
          });
        }
      }
    }
    
    if (nzfcdMatches.length > 0) {
      nzfcdMatches.sort((a, b) => b.score - a.score);
      console.log(`    ✅ Found ${nzfcdMatches.length} matches:`);
      nzfcdMatches.slice(0, 3).forEach((m, i) => {
        console.log(`       ${i+1}. "${m.name}" (${m.type}, score: ${m.score})`);
      });
      console.log(`    ✅ FSANZ query WOULD RETURN DATA for TruScore`);
    } else {
      console.log(`    ❌ NO MATCHES FOUND`);
      console.log(`    ❌ FSANZ query will return NOTHING - TruScore will NOT get FSANZ data`);
    }
    
    // Test AFCD
    console.log(`  \n  Testing AFCD (${afcd.length} foods)...`);
    let afcdMatches = [];
    
    for (const food of afcd) {
      const foodName = (food.foodName || food['Food Name'] || '').toLowerCase();
      if (!foodName) continue;
      
      if (foodName.includes(searchName) || searchName.includes(foodName)) {
        afcdMatches.push({ name: food.foodName || food['Food Name'], score: 100, type: 'contains' });
      } else {
        let matchedKeywords = 0;
        for (const keyword of keywords) {
          if (foodName.includes(keyword)) {
            matchedKeywords++;
          }
        }
        if (matchedKeywords >= Math.ceil(keywords.length * 0.4)) {
          afcdMatches.push({ 
            name: food.foodName || food['Food Name'], 
            score: matchedKeywords * 20,
            type: 'keywords'
          });
        }
      }
    }
    
    if (afcdMatches.length > 0) {
      afcdMatches.sort((a, b) => b.score - a.score);
      console.log(`    ✅ Found ${afcdMatches.length} matches:`);
      afcdMatches.slice(0, 3).forEach((m, i) => {
        console.log(`       ${i+1}. "${m.name}" (${m.type}, score: ${m.score})`);
      });
      console.log(`    ✅ FSANZ query WOULD RETURN DATA for TruScore`);
    } else {
      console.log(`    ❌ NO MATCHES FOUND`);
      console.log(`    ❌ FSANZ query will return NOTHING - TruScore will NOT get FSANZ data`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('TEST COMPLETE');
  console.log('='.repeat(80));
}

testBarcodes().catch(console.error);

