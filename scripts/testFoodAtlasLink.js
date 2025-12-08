/**
 * Quick test to verify FoodAtlas linking logic
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const FOODATLAS_DIR = path.join(__dirname, '..', 'Database files', 'FoodAtlas v3.2.0', 'v3.2_20250211');

async function parseTSV(filePath, limit = 100) {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const lines = [];
  let headers = null;
  let count = 0;

  for await (const line of rl) {
    if (line.trim() === '' || count >= limit) break;
    
    const values = line.split('\t');
    
    if (!headers) {
      headers = values;
    } else {
      const obj = {};
      headers.forEach((header, index) => {
        let value = values[index] || '';
        if (value.startsWith('[') && value.endsWith(']')) {
          try {
            value = JSON.parse(value.replace(/'/g, '"'));
            if (Array.isArray(value) && value.length > 0) {
              value = value[0];
            }
          } catch (e) {}
        }
        obj[header] = value;
      });
      lines.push(obj);
      count++;
    }
  }

  return lines;
}

async function test() {
  console.log('Testing FoodAtlas linking...\n');
  
  // Test 1: Check food lookup
  console.log('1. Reading food lookup (first 10)...');
  const foods = await parseTSV(path.join(FOODATLAS_DIR, 'lookup_table_food.tsv'), 10);
  console.log(`   Found ${foods.length} foods`);
  console.log(`   Sample: ${foods[0]?.name} -> ${foods[0]?.foodatlas_id}\n`);
  
  // Test 2: Check nutrition data
  console.log('2. Reading nutrition data (first 10)...');
  const contains = await parseTSV(path.join(FOODATLAS_DIR, 'metadata_contains.tsv'), 10);
  console.log(`   Found ${contains.length} records`);
  console.log(`   Sample: _food_name=${contains[0]?._food_name}, _chemical_name=${contains[0]?._chemical_name}\n`);
  
  // Test 3: Check entities
  console.log('3. Reading entities (first 10 with FDC)...');
  const entities = await parseTSV(path.join(FOODATLAS_DIR, 'entities.tsv'), 100);
  const foodsWithFDC = entities.filter(e => e.entity_type === 'food' && e.external_ids && e.external_ids.includes('fdc'));
  console.log(`   Found ${foodsWithFDC.length} foods with FDC IDs (out of ${entities.length} entities)`);
  if (foodsWithFDC.length > 0) {
    console.log(`   Sample: ${foodsWithFDC[0]?.common_name} -> ${foodsWithFDC[0]?.external_ids}`);
    try {
      const extIds = JSON.parse(foodsWithFDC[0].external_ids.replace(/'/g, '"'));
      console.log(`   Parsed FDC: ${JSON.stringify(extIds.fdc)}`);
    } catch (e) {
      console.log(`   Parse error: ${e.message}`);
    }
  }
  
  console.log('\n✅ Test complete!');
}

test().catch(console.error);

