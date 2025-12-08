/**
 * Diagnostic script to understand FoodAtlas data structure
 * and identify why we're only getting 483 foods
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const FOODATLAS_DIR = path.join(__dirname, '..', 'Database files', 'FoodAtlas v3.2.0', 'v3.2_20250211');

async function parseTSV(filePath) {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const lines = [];
  let headers = null;
  let lineCount = 0;

  for await (const line of rl) {
    if (line.trim() === '') continue;
    
    const values = line.split('\t');
    
    if (!headers) {
      headers = values;
    } else {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      lines.push(obj);
      lineCount++;
      
      if (lineCount % 50000 === 0) {
        process.stdout.write(`\r   Processed ${lineCount} records...`);
      }
    }
  }

  console.log(`\r   Processed ${lineCount} records`);
  return lines;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('FOODATLAS DATA DIAGNOSTICS');
  console.log('═══════════════════════════════════════════════════════════\n');

  // 1. Count food entities
  console.log('📊 Step 1: Analyzing entities.tsv...');
  const entities = await parseTSV(path.join(FOODATLAS_DIR, 'entities.tsv'));
  const foodEntities = entities.filter(e => e.entity_type === 'food');
  const foodEntitiesWithNames = foodEntities.filter(e => e.common_name);
  console.log(`   Total entities: ${entities.length}`);
  console.log(`   Food entities: ${foodEntities.length}`);
  console.log(`   Food entities with names: ${foodEntitiesWithNames.length}\n`);

  // 2. Count triplets
  console.log('📊 Step 2: Analyzing triplets.tsv...');
  const triplets = await parseTSV(path.join(FOODATLAS_DIR, 'triplets.tsv'));
  const foodTriplets = triplets.filter(t => t.head_id && t.head_id.startsWith('e'));
  const foodTripletsWithMetadata = foodTriplets.filter(t => t.metadata_ids);
  
  // Extract unique food entities from triplets
  const foodEntitiesInTriplets = new Set();
  foodTriplets.forEach(t => {
    if (t.head_id && t.head_id.startsWith('e')) {
      foodEntitiesInTriplets.add(t.head_id);
    }
  });
  
  console.log(`   Total triplets: ${triplets.length}`);
  console.log(`   Food triplets: ${foodTriplets.length}`);
  console.log(`   Food triplets with metadata: ${foodTripletsWithMetadata.length}`);
  console.log(`   Unique food entities in triplets: ${foodEntitiesInTriplets.size}\n`);

  // 3. Parse metadata_ids from triplets
  console.log('📊 Step 3: Extracting metadata IDs from triplets...');
  const foodEntityToMetadataIds = new Map();
  let metadataIdCount = 0;
  
  foodTripletsWithMetadata.forEach(triplet => {
    const headId = triplet.head_id;
    const metadataIds = triplet.metadata_ids;
    
    if (!headId || !metadataIds) return;
    
    let ids = [];
    try {
      ids = JSON.parse(metadataIds.replace(/'/g, '"'));
    } catch (e) {
      try {
        ids = metadataIds.split(',').map(id => id.trim().replace(/[\[\]']/g, ''));
      } catch (e2) {
        return;
      }
    }
    
    if (ids.length === 0) return;
    
    if (!foodEntityToMetadataIds.has(headId)) {
      foodEntityToMetadataIds.set(headId, []);
    }
    foodEntityToMetadataIds.get(headId).push(...ids);
    metadataIdCount += ids.length;
  });
  
  const uniqueMetadataIds = new Set();
  foodEntityToMetadataIds.forEach(ids => {
    ids.forEach(id => uniqueMetadataIds.add(id));
  });
  
  console.log(`   Food entities with metadata IDs: ${foodEntityToMetadataIds.size}`);
  console.log(`   Total metadata ID references: ${metadataIdCount}`);
  console.log(`   Unique metadata IDs: ${uniqueMetadataIds.size}\n`);

  // 4. Analyze metadata_contains
  console.log('📊 Step 4: Analyzing metadata_contains.tsv...');
  const contains = await parseTSV(path.join(FOODATLAS_DIR, 'metadata_contains.tsv'));
  const validContains = contains.filter(c => 
    c.foodatlas_id && 
    c._chemical_name && 
    c.conc_value && 
    c._is_outlier !== 'True'
  );
  
  const uniqueMetadataInContains = new Set();
  const fdcNutrients = new Set();
  const nonFdcChemicals = new Set();
  
  validContains.forEach(c => {
    uniqueMetadataInContains.add(c.foodatlas_id);
    if (c._chemical_name.startsWith('FDC_NUTRIENT:')) {
      fdcNutrients.add(c._chemical_name);
    } else {
      nonFdcChemicals.add(c._chemical_name);
    }
  });
  
  console.log(`   Total records: ${contains.length}`);
  console.log(`   Valid records (non-outlier, with values): ${validContains.length}`);
  console.log(`   Unique metadata IDs in contains: ${uniqueMetadataInContains.size}`);
  console.log(`   FDC nutrients: ${fdcNutrients.size}`);
  console.log(`   Non-FDC chemicals: ${nonFdcChemicals.size}\n`);

  // 5. Check overlap
  console.log('📊 Step 5: Checking overlap...');
  const overlap = new Set();
  uniqueMetadataIds.forEach(id => {
    if (uniqueMetadataInContains.has(id)) {
      overlap.add(id);
    }
  });
  
  const inTripletsNotInContains = new Set();
  uniqueMetadataIds.forEach(id => {
    if (!uniqueMetadataInContains.has(id)) {
      inTripletsNotInContains.add(id);
    }
  });
  
  const inContainsNotInTriplets = new Set();
  uniqueMetadataInContains.forEach(id => {
    if (!uniqueMetadataIds.has(id)) {
      inContainsNotInTriplets.add(id);
    }
  });
  
  console.log(`   Metadata IDs in both: ${overlap.size}`);
  console.log(`   In triplets but NOT in contains: ${inTripletsNotInContains.size}`);
  console.log(`   In contains but NOT in triplets: ${inContainsNotInTriplets.size}\n`);

  // 6. Count foods that would have nutrition data
  console.log('📊 Step 6: Counting foods with nutrition data...');
  let foodsWithNutrition = 0;
  let foodsWithoutNutrition = 0;
  
  foodEntitiesWithNames.forEach(food => {
    const foodId = food.foodatlas_id;
    const metadataIds = foodEntityToMetadataIds.get(foodId) || [];
    
    let hasNutrition = false;
    metadataIds.forEach(metadataId => {
      if (overlap.has(metadataId)) {
        hasNutrition = true;
      }
    });
    
    if (hasNutrition) {
      foodsWithNutrition++;
    } else {
      foodsWithoutNutrition++;
    }
  });
  
  console.log(`   Foods WITH nutrition data: ${foodsWithNutrition}`);
  console.log(`   Foods WITHOUT nutrition data: ${foodsWithoutNutrition}\n`);

  // 7. Sample analysis
  console.log('📊 Step 7: Sample analysis...');
  console.log(`   Sample metadata IDs in triplets:`, Array.from(uniqueMetadataIds).slice(0, 10));
  console.log(`   Sample metadata IDs in contains:`, Array.from(uniqueMetadataInContains).slice(0, 10));
  console.log(`   Sample FDC nutrients:`, Array.from(fdcNutrients).slice(0, 10));
  console.log(`   Sample non-FDC chemicals:`, Array.from(nonFdcChemicals).slice(0, 10));
  
  console.log('\n✅ Diagnostics complete!');
}

main().catch(console.error);

