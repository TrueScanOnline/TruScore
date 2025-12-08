/**
 * Process FoodAtlas Database - MAXIMUM FOODS VERSION
 * 
 * This version is more aggressive about including foods:
 * 1. Includes foods with ANY mapped nutrients (even just 1)
 * 2. Uses fallback nutrient names for unmapped FDC nutrients
 * 3. Includes foods even if they only have non-FDC chemicals (we'll map common ones)
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const FOODATLAS_DIR = path.join(__dirname, '..', 'Database files', 'FoodAtlas v3.2.0', 'v3.2_20250211');
const OUTPUT_FILE = path.join(__dirname, '..', 'backend', 'vercel', 'data', 'foodatlas.json');

// Expanded FDC Nutrient ID mapping
const FDC_NUTRIENT_MAP = {
  // Energy
  '1008': 'energy-kcal_100g',
  '1062': 'energy-kj_100g',
  '1002': 'energy-kcal_100g',
  
  // Macronutrients
  '1003': 'proteins_100g',
  '1004': 'fat_100g',
  '1005': 'carbohydrates_100g',
  '2000': 'sugars_100g',
  '1079': 'fiber_100g',
  
  // Fatty acids
  '1258': 'fatty-acids-total-saturated_100g',
  '1257': 'fatty-acids-total-monounsaturated_100g',
  '1253': 'fatty-acids-total-polyunsaturated_100g',
  '1292': 'fatty-acids-total-trans_100g',
  
  // Minerals
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
  
  // Vitamins
  '1104': 'vitamin-a_100g',
  '1162': 'vitamin-c_100g',
  '1114': 'vitamin-d_100g',
  '1185': 'vitamin-k_100g',
  '1165': 'thiamin_100g',
  '1166': 'riboflavin_100g',
  '1167': 'niacin_100g',
  '1175': 'vitamin-b6_100g',
  '1177': 'folate_100g',
  '1178': 'vitamin-b12_100g',
  '1170': 'pantothenic-acid_100g',
  '1180': 'choline_100g',
  
  // Other
  '1014': 'water_100g',
  '1051': 'ash_100g',
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
  
  // Try FDC nutrient ID mapping first
  const fdcId = extractFDCID(chemicalName);
  if (fdcId && FDC_NUTRIENT_MAP[fdcId]) {
    return FDC_NUTRIENT_MAP[fdcId];
  }
  
  // If it's an FDC nutrient but not in our map, use generic name
  // This ensures we capture ALL FDC nutrients, not just mapped ones
  if (fdcId) {
    return `fdc-nutrient-${fdcId}_100g`;
  }
  
  // Try name-based matching for common nutrients
  const nameLower = chemicalName.toLowerCase();
  
  // Energy
  if (nameLower.includes('energy') || nameLower.includes('calorie')) {
    if (nameLower.includes('kj') || nameLower.includes('kilojoule')) return 'energy-kj_100g';
    return 'energy-kcal_100g';
  }
  
  // Macronutrients
  if (nameLower.includes('protein')) return 'proteins_100g';
  if (nameLower.includes('fat') && nameLower.includes('saturated')) return 'fatty-acids-total-saturated_100g';
  if (nameLower.includes('fat') || nameLower.includes('lipid')) return 'fat_100g';
  if (nameLower.includes('carbohydrate')) return 'carbohydrates_100g';
  if (nameLower.includes('sugar')) return 'sugars_100g';
  if (nameLower.includes('fiber') || nameLower.includes('fibre')) return 'fiber_100g';
  
  // Minerals
  if (nameLower.includes('sodium')) return 'sodium_100g';
  if (nameLower.includes('calcium')) return 'calcium_100g';
  if (nameLower.includes('iron')) return 'iron_100g';
  if (nameLower.includes('magnesium')) return 'magnesium_100g';
  if (nameLower.includes('phosphorus')) return 'phosphorus_100g';
  if (nameLower.includes('potassium')) return 'potassium_100g';
  if (nameLower.includes('zinc')) return 'zinc_100g';
  if (nameLower.includes('copper')) return 'copper_100g';
  if (nameLower.includes('manganese')) return 'manganese_100g';
  if (nameLower.includes('selenium')) return 'selenium_100g';
  
  // Vitamins
  if (nameLower.includes('vitamin c') || nameLower.includes('ascorbic')) return 'vitamin-c_100g';
  if (nameLower.includes('vitamin a')) return 'vitamin-a_100g';
  if (nameLower.includes('vitamin d')) return 'vitamin-d_100g';
  if (nameLower.includes('vitamin e')) return 'vitamin-e_100g';
  if (nameLower.includes('vitamin k')) return 'vitamin-k_100g';
  if (nameLower.includes('thiamin') || nameLower.includes('vitamin b1')) return 'thiamin_100g';
  if (nameLower.includes('riboflavin') || nameLower.includes('vitamin b2')) return 'riboflavin_100g';
  if (nameLower.includes('niacin') || nameLower.includes('vitamin b3')) return 'niacin_100g';
  if (nameLower.includes('vitamin b6') || nameLower.includes('pyridoxine')) return 'vitamin-b6_100g';
  if (nameLower.includes('folate') || nameLower.includes('folic acid')) return 'folate_100g';
  if (nameLower.includes('vitamin b12') || nameLower.includes('cobalamin')) return 'vitamin-b12_100g';
  
  // For other chemicals, we could include them with generic names
  // But for now, skip to keep database focused on nutrition
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
    console.log('PROCESSING FOODATLAS - MAXIMUM FOODS VERSION');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Step 1: Read entities
    console.log('📖 Step 1: Reading entities.tsv...');
    const entities = await parseTSV(path.join(FOODATLAS_DIR, 'entities.tsv'));
    const foodEntities = entities.filter(e => e.entity_type === 'food');
    console.log(`   Found ${foodEntities.length} food entities`);
    
    const entityIdToName = new Map();
    foodEntities.forEach(entity => {
      if (entity.foodatlas_id && entity.common_name) {
        entityIdToName.set(entity.foodatlas_id, entity.common_name);
      }
    });
    console.log(`   Mapped ${entityIdToName.size} food entities to names\n`);
    
    // Step 2: Read triplets
    console.log('📖 Step 2: Reading triplets.tsv...');
    const triplets = await parseTSV(path.join(FOODATLAS_DIR, 'triplets.tsv'));
    console.log(`   Found ${triplets.length} triplets`);
    
    const foodEntityToMetadataIds = new Map();
    let tripletCount = 0;
    
    triplets.forEach(triplet => {
      const headId = triplet.head_id;
      const metadataIds = triplet.metadata_ids;
      
      if (!headId || !metadataIds || !headId.startsWith('e')) return;
      
      let ids = [];
      if (typeof metadataIds === 'string') {
        try {
          ids = JSON.parse(metadataIds.replace(/'/g, '"'));
        } catch (e) {
          ids = metadataIds.split(',').map(id => id.trim().replace(/[\[\]']/g, ''));
        }
      } else if (Array.isArray(metadataIds)) {
        ids = metadataIds;
      }
      
      if (ids.length === 0) return;
      
      if (!foodEntityToMetadataIds.has(headId)) {
        foodEntityToMetadataIds.set(headId, []);
      }
      foodEntityToMetadataIds.get(headId).push(...ids);
      tripletCount++;
      
      if (tripletCount % 10000 === 0) {
        process.stdout.write(`\r   Processed ${tripletCount} triplets, mapped ${foodEntityToMetadataIds.size} food entities...`);
      }
    });
    
    console.log(`\r   Mapped ${foodEntityToMetadataIds.size} food entities to metadata IDs\n`);
    
    // Step 3: Read nutrition data
    console.log('📖 Step 3: Reading nutrition data...');
    const contains = await parseTSV(path.join(FOODATLAS_DIR, 'metadata_contains.tsv'));
    console.log(`   Found ${contains.length} nutrition records`);
    
    const metadataIdToNutrients = new Map();
    let processedCount = 0;
    let mappedCount = 0;
    let skippedCount = 0;
    
    contains.forEach(record => {
      const metadataId = record.foodatlas_id;
      const chemicalName = record._chemical_name || '';
      const value = record.conc_value;
      const unit = record.conc_unit || 'mg/100g';
      const isOutlier = record._is_outlier === 'True';
      
      if (!metadataId || !chemicalName || !value || isOutlier) {
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
      
      if (!metadataIdToNutrients.has(metadataId)) {
        metadataIdToNutrients.set(metadataId, {});
      }
      
      const nutrients = metadataIdToNutrients.get(metadataId);
      if (!nutrients[nutrientName] || convertedValue > nutrients[nutrientName]) {
        nutrients[nutrientName] = convertedValue;
        mappedCount++;
      }
      
      processedCount++;
      if (processedCount % 10000 === 0) {
        process.stdout.write(`\r   Processed ${processedCount} records, mapped ${mappedCount} nutrients...`);
      }
    });
    
    console.log(`\r   Indexed ${metadataIdToNutrients.size} metadata records with nutrition data`);
    console.log(`   Mapped ${mappedCount} nutrients, skipped ${skippedCount} unmapped\n`);
    
    // Step 4: Build database
    console.log('🔨 Step 4: Building database...');
    const database = [];
    const processedFoods = new Set();
    let foodsWithNutrition = 0;
    let foodsWithoutNutrition = 0;
    
    foodEntityToMetadataIds.forEach((metadataIds, foodEntityId) => {
      const foodName = entityIdToName.get(foodEntityId);
      if (!foodName) {
        foodsWithoutNutrition++;
        return;
      }
      
      let nutriments = {};
      let foundNutrition = false;
      
      metadataIds.forEach(metadataId => {
        if (metadataIdToNutrients.has(metadataId)) {
          const foodNutrients = metadataIdToNutrients.get(metadataId);
          nutriments = { ...nutriments, ...foodNutrients };
          foundNutrition = true;
        }
      });
      
      if (!foundNutrition || Object.keys(nutriments).length === 0) {
        foodsWithoutNutrition++;
        return;
      }
      
      foodsWithNutrition++;
      
      const key = foodName.toLowerCase();
      if (processedFoods.has(key)) {
        const existing = database.find(f => f.name.toLowerCase() === key);
        if (existing && Object.keys(nutriments).length > existing.nutrient_count) {
          existing.nutriments = nutriments;
          existing.nutrient_count = Object.keys(nutriments).length;
        }
        return;
      }
      processedFoods.add(key);
      
      // Calculate derived values
      if (nutriments['energy-kcal_100g'] && !nutriments['energy-kj_100g']) {
        nutriments['energy-kj_100g'] = nutriments['energy-kcal_100g'] * 4.184;
      }
      if (nutriments['energy-kj_100g'] && !nutriments['energy-kcal_100g']) {
        nutriments['energy-kcal_100g'] = nutriments['energy-kj_100g'] / 4.184;
      }
      if (nutriments['sodium_100g'] && !nutriments['salt_100g']) {
        nutriments['salt_100g'] = nutriments['sodium_100g'] * 2.54;
      }
      
      database.push({
        name: foodName,
        nutriments: nutriments,
        nutrient_count: Object.keys(nutriments).length,
      });
      
      if (database.length % 500 === 0) {
        process.stdout.write(`\r   Built ${database.length} foods...`);
      }
    });
    
    console.log(`\r   Built database with ${database.length} foods`);
    console.log(`   Foods WITH nutrition: ${foodsWithNutrition}`);
    console.log(`   Foods WITHOUT nutrition: ${foodsWithoutNutrition}\n`);
    
    database.sort((a, b) => b.nutrient_count - a.nutrient_count);
    
    console.log('💾 Step 5: Writing database...');
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(database, null, 2));
    
    const stats = fs.statSync(OUTPUT_FILE);
    console.log(`   ✅ Written: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   📁 File: ${OUTPUT_FILE}\n`);
    
    console.log('📊 Sample foods:');
    database.slice(0, 10).forEach((food, index) => {
      console.log(`   ${index + 1}. ${food.name} (${food.nutrient_count} nutrients)`);
    });
    
    console.log('\n✅ Processing complete!');
    console.log(`   Total foods: ${database.length}`);
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();

