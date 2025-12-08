/**
 * Process FoodAtlas Database v3.2.0 - COMPLETE VERSION
 * 
 * Gets ALL foods with nutrition data, not just those with FDC IDs
 * Uses multiple linking strategies to maximize coverage
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const FOODATLAS_DIR = path.join(__dirname, '..', 'Database files', 'FoodAtlas v3.2.0', 'v3.2_20250211');
const OUTPUT_FILE = path.join(__dirname, '..', 'backend', 'vercel', 'data', 'foodatlas.json');

// USDA FDC Nutrient ID to standard nutrient name mapping
const FDC_NUTRIENT_MAP = {
  '1008': 'energy-kcal_100g',
  '1062': 'energy-kj_100g',
  '1003': 'proteins_100g',
  '1004': 'fat_100g',
  '1258': 'fatty-acids-total-saturated_100g',
  '1257': 'fatty-acids-total-monounsaturated_100g',
  '1253': 'fatty-acids-total-polyunsaturated_100g',
  '1005': 'carbohydrates_100g',
  '2000': 'sugars_100g',
  '1079': 'fiber_100g',
  '1087': 'calcium_100g',
  '1089': 'iron_100g',
  '1090': 'magnesium_100g',
  '1091': 'phosphorus_100g',
  '1092': 'potassium_100g',
  '1093': 'sodium_100g',
  '1095': 'zinc_100g',
  '1106': 'copper_100g',
  '1109': 'manganese_100g',
  '1103': 'selenium_100g',
  '1104': 'vitamin-a_100g',
  '1162': 'vitamin-c_100g',
  '1114': 'vitamin-d_100g',
  '1109': 'vitamin-e_100g',
  '1185': 'vitamin-k_100g',
  '1165': 'thiamin_100g',
  '1166': 'riboflavin_100g',
  '1167': 'niacin_100g',
  '1175': 'vitamin-b6_100g',
  '1177': 'folate_100g',
  '1178': 'vitamin-b12_100g',
  '1253': 'cholesterol_100g',
  '1057': 'caffeine_100g',
  '1018': 'alcohol_100g',
};

function extractFDCID(chemicalName) {
  if (!chemicalName) return null;
  const match = chemicalName.match(/FDC_NUTRIENT:(\d+)/);
  return match ? match[1] : null;
}

function mapToNutrientName(chemicalName) {
  if (!chemicalName) return null;
  
  const fdcId = extractFDCID(chemicalName);
  if (fdcId && FDC_NUTRIENT_MAP[fdcId]) {
    return FDC_NUTRIENT_MAP[fdcId];
  }
  
  const nameLower = chemicalName.toLowerCase();
  if (nameLower.includes('energy') || nameLower.includes('calorie')) {
    if (nameLower.includes('kj') || nameLower.includes('kilojoule')) return 'energy-kj_100g';
    return 'energy-kcal_100g';
  }
  if (nameLower.includes('protein')) return 'proteins_100g';
  if (nameLower.includes('fat') && nameLower.includes('saturated')) return 'fatty-acids-total-saturated_100g';
  if (nameLower.includes('fat') || nameLower.includes('lipid')) return 'fat_100g';
  if (nameLower.includes('carbohydrate')) return 'carbohydrates_100g';
  if (nameLower.includes('sugar')) return 'sugars_100g';
  if (nameLower.includes('fiber') || nameLower.includes('fibre')) return 'fiber_100g';
  if (nameLower.includes('sodium')) return 'sodium_100g';
  if (nameLower.includes('calcium')) return 'calcium_100g';
  if (nameLower.includes('iron')) return 'iron_100g';
  if (nameLower.includes('vitamin c') || nameLower.includes('ascorbic')) return 'vitamin-c_100g';
  
  return null;
}

function convertToGramsPer100g(value, unit) {
  if (!value || isNaN(value)) return null;
  
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return null;
  
  const unitLower = (unit || '').toLowerCase();
  
  if (unitLower.includes('kcal')) return numValue;
  if (unitLower.includes('kj')) return numValue;
  if (unitLower.includes('g/100g') || unitLower === 'g') return numValue;
  if (unitLower.includes('mg/100g') || unitLower === 'mg') return numValue / 1000;
  if (unitLower.includes('mcg/100g') || unitLower === 'mcg' || unitLower === 'µg') return numValue / 1000000;
  if (unitLower.includes('kg/100g')) return numValue * 1000;
  
  return numValue;
}

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
      lineCount++;
      
      if (lineCount % 10000 === 0) {
        process.stdout.write(`\r   Processed ${lineCount} records...`);
      }
    }
  }

  console.log(`\r   Processed ${lineCount} records`);
  return lines;
}

async function main() {
  try {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('PROCESSING FOODATLAS DATABASE v3.2.0 - COMPLETE VERSION');
    console.log('═══════════════════════════════════════════════════════════');
    
    // Strategy 1: Use entities.tsv common_name directly (most complete)
    console.log('\n📖 Step 1: Reading entities.tsv (food entities)...');
    const entities = await parseTSV(path.join(FOODATLAS_DIR, 'entities.tsv'));
    console.log(`   Found ${entities.length} total entities`);
    
    // Filter food entities
    const foodEntities = entities.filter(e => e.entity_type === 'food');
    console.log(`   Found ${foodEntities.length} food entities`);
    
    // Build entity ID to common_name mapping
    const entityIdToName = new Map();
    foodEntities.forEach(entity => {
      if (entity.foodatlas_id && entity.common_name) {
        entityIdToName.set(entity.foodatlas_id, entity.common_name);
      }
    });
    console.log(`   Mapped ${entityIdToName.size} food entities to names`);
    
    // Strategy 2: Read nutrition data and group by _food_name
    console.log('\n📖 Step 2: Reading nutrition data (metadata_contains)...');
    const contains = await parseTSV(path.join(FOODATLAS_DIR, 'metadata_contains.tsv'));
    console.log(`   Found ${contains.length} nutrition records`);
    
    // Build nutrition index: _food_name -> nutrients
    console.log('\n🔨 Step 3: Building nutrition index...');
    const nutritionIndex = new Map(); // _food_name -> nutrients
    
    let processedCount = 0;
    let mappedCount = 0;
    let skippedCount = 0;
    
    contains.forEach(record => {
      const foodIdentifier = record._food_name || '';
      const chemicalName = record._chemical_name || '';
      const value = record.conc_value;
      const unit = record.conc_unit || 'mg/100g';
      const isOutlier = record._is_outlier === 'True';
      
      if (!foodIdentifier || !chemicalName || !value || isOutlier) {
        skippedCount++;
        return;
      }
      
      const nutrientName = mapToNutrientName(chemicalName);
      if (!nutrientName) {
        skippedCount++;
        return;
      }
      
      const convertedValue = convertToGramsPer100g(value, unit);
      if (convertedValue === null) {
        skippedCount++;
        return;
      }
      
      if (!nutritionIndex.has(foodIdentifier)) {
        nutritionIndex.set(foodIdentifier, {});
      }
      
      const nutrients = nutritionIndex.get(foodIdentifier);
      if (!nutrients[nutrientName] || convertedValue > nutrients[nutrientName]) {
        nutrients[nutrientName] = convertedValue;
        mappedCount++;
      }
      
      processedCount++;
      if (processedCount % 10000 === 0) {
        process.stdout.write(`\r   Processed ${processedCount} records, mapped ${mappedCount} nutrients...`);
      }
    });
    
    console.log(`\r   Indexed ${nutritionIndex.size} unique food identifiers with nutrition data`);
    console.log(`   Mapped ${mappedCount} nutrients, skipped ${skippedCount} unmapped`);
    
    // Strategy 3: Link _food_name to food names
    console.log('\n🔨 Step 4: Linking food identifiers to food names...');
    
    // Build FDC ID to entity ID mapping
    const fdcToEntityId = new Map();
    foodEntities.forEach(entity => {
      if (entity.external_ids) {
        try {
          let externalIds;
          if (typeof entity.external_ids === 'string') {
            externalIds = JSON.parse(entity.external_ids.replace(/'/g, '"'));
          } else {
            externalIds = entity.external_ids;
          }
          
          if (externalIds && externalIds.fdc) {
            const fdcIds = Array.isArray(externalIds.fdc) ? externalIds.fdc : [externalIds.fdc];
            fdcIds.forEach(fdcId => {
              const fdcKey = `FDC:${fdcId}`;
              if (!fdcToEntityId.has(fdcKey)) {
                fdcToEntityId.set(fdcKey, []);
              }
              fdcToEntityId.get(fdcKey).push(entity.foodatlas_id);
            });
          }
        } catch (e) {}
      }
    });
    console.log(`   Mapped ${fdcToEntityId.size} FDC IDs to entity IDs`);
    
    // Also check lookup_table_food for additional food names
    console.log('\n📖 Step 5: Reading food lookup table...');
    const foodLookup = await parseTSV(path.join(FOODATLAS_DIR, 'lookup_table_food.tsv'));
    console.log(`   Found ${foodLookup.length} foods in lookup table`);
    
    // Build foodatlas_id to food name mapping from lookup table
    const entityIdToLookupName = new Map();
    foodLookup.forEach(food => {
      if (food.foodatlas_id && food.name) {
        const ids = Array.isArray(food.foodatlas_id) ? food.foodatlas_id : [food.foodatlas_id];
        ids.forEach(id => {
          if (!entityIdToLookupName.has(id)) {
            entityIdToLookupName.set(id, []);
          }
          entityIdToLookupName.get(id).push(food.name);
        });
      }
    });
    console.log(`   Mapped ${entityIdToLookupName.size} entity IDs to lookup names`);
    
    // Build final database
    console.log('\n🔨 Step 6: Building complete database...');
    const database = [];
    const processedFoods = new Set();
    
    // Process all food identifiers that have nutrition data
    nutritionIndex.forEach((nutriments, foodIdentifier) => {
      if (Object.keys(nutriments).length === 0) return;
      
      // Try to find food name for this identifier
      let foodName = null;
      let foundName = false;
      
      // Strategy A: If it's an FDC ID, find entity via FDC mapping
      if (foodIdentifier.startsWith('FDC:')) {
        const entityIds = fdcToEntityId.get(foodIdentifier) || [];
        for (const entityId of entityIds) {
          // Try common_name from entities
          if (entityIdToName.has(entityId)) {
            foodName = entityIdToName.get(entityId);
            foundName = true;
            break;
          }
          // Try lookup table name
          if (entityIdToLookupName.has(entityId)) {
            const names = entityIdToLookupName.get(entityId);
            foodName = names[0]; // Use first name
            foundName = true;
            break;
          }
        }
      }
      
      // Strategy B: If identifier is an entity ID directly
      if (!foundName && entityIdToName.has(foodIdentifier)) {
        foodName = entityIdToName.get(foodIdentifier);
        foundName = true;
      }
      
      // Strategy C: Try lookup table
      if (!foundName && entityIdToLookupName.has(foodIdentifier)) {
        const names = entityIdToLookupName.get(foodIdentifier);
        foodName = names[0];
        foundName = true;
      }
      
      // Strategy D: Use identifier as name if it looks like a food name
      if (!foundName && !foodIdentifier.startsWith('FDC:') && !foodIdentifier.startsWith('mc')) {
        foodName = foodIdentifier;
        foundName = true;
      }
      
      // If we still don't have a name, skip (but log for debugging)
      if (!foundName) {
        // Skip foods without names - we can't search by them
        return;
      }
      
      // Avoid duplicates
      const key = foodName.toLowerCase();
      if (processedFoods.has(key)) {
        // Merge nutrients if duplicate (prefer more complete)
        const existing = database.find(f => f.name.toLowerCase() === key);
        if (existing && Object.keys(nutriments).length > existing.nutrient_count) {
          existing.nutriments = nutriments;
          existing.nutrient_count = Object.keys(nutriments).length;
        }
        return;
      }
      processedFoods.add(key);
      
      // Calculate energy in both kcal and kJ if available
      if (nutriments['energy-kcal_100g'] && !nutriments['energy-kj_100g']) {
        nutriments['energy-kj_100g'] = nutriments['energy-kcal_100g'] * 4.184;
      }
      if (nutriments['energy-kj_100g'] && !nutriments['energy-kcal_100g']) {
        nutriments['energy-kcal_100g'] = nutriments['energy-kj_100g'] / 4.184;
      }
      
      // Calculate salt from sodium if available
      if (nutriments['sodium_100g'] && !nutriments['salt_100g']) {
        nutriments['salt_100g'] = nutriments['sodium_100g'] * 2.54;
      }
      
      database.push({
        name: foodName,
        nutriments: nutriments,
        nutrient_count: Object.keys(nutriments).length,
      });
      
      if (database.length % 100 === 0) {
        process.stdout.write(`\r   Built ${database.length} foods...`);
      }
    });
    
    console.log(`\r   Built database with ${database.length} foods`);
    
    // Sort by nutrient count (most complete first)
    database.sort((a, b) => b.nutrient_count - a.nutrient_count);
    
    console.log('\n💾 Step 7: Writing database to JSON...');
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(database, null, 2));
    
    const stats = fs.statSync(OUTPUT_FILE);
    console.log(`   ✅ Written: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   📁 File: ${OUTPUT_FILE}`);
    
    // Show sample
    console.log('\n📊 Sample foods:');
    database.slice(0, 10).forEach((food, index) => {
      console.log(`   ${index + 1}. ${food.name} (${food.nutrient_count} nutrients)`);
    });
    
    console.log('\n✅ FoodAtlas database processed successfully!');
    console.log(`   Total foods: ${database.length}`);
    console.log('   Ready for integration into the app.');
    
  } catch (error) {
    console.error('\n❌ Error processing FoodAtlas database:');
    console.error(error);
    process.exit(1);
  }
}

main();

