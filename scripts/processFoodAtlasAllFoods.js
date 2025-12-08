/**
 * Process FoodAtlas Database v3.2.0 - GET ALL FOODS
 * 
 * Uses triplets.tsv to link food entities to nutrition data
 * This should capture ALL foods with nutrition data, not just those with FDC IDs
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const FOODATLAS_DIR = path.join(__dirname, '..', 'Database files', 'FoodAtlas v3.2.0', 'v3.2_20250211');
const OUTPUT_FILE = path.join(__dirname, '..', 'backend', 'vercel', 'data', 'foodatlas.json');

// USDA FDC Nutrient ID to standard nutrient name mapping
// Expanded mapping based on common FDC nutrient IDs
const FDC_NUTRIENT_MAP = {
  // Energy
  '1008': 'energy-kcal_100g',
  '1062': 'energy-kj_100g',
  '1002': 'energy-kcal_100g', // Energy (Atwater General Factors)
  
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
  '1085': 'chlorine_100g',
  '1012': 'fluoride_100g',
  
  // Vitamins
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
  '1170': 'pantothenic-acid_100g',
  '1180': 'choline_100g',
  '1126': 'biotin_100g',
  
  // Other
  '1253': 'cholesterol_100g',
  '1057': 'caffeine_100g',
  '1018': 'alcohol_100g',
  '1014': 'water_100g',
  '1051': 'ash_100g',
  
  // Additional common FDC nutrients found in FoodAtlas
  '1262': 'fatty-acids-saturated-4-0_100g',
  '1265': 'fatty-acids-saturated-6-0_100g',
  '1278': 'fatty-acids-saturated-8-0_100g',
  '1127': 'fatty-acids-saturated-10-0_100g',
  '1075': 'fatty-acids-saturated-12-0_100g',
  '1313': 'fatty-acids-saturated-14-0_100g',
  '1330': 'fatty-acids-saturated-16-0_100g',
  '1404': 'fatty-acids-saturated-18-0_100g',
  '1197': 'fatty-acids-monounsaturated-16-1_100g',
  '1259': 'fatty-acids-monounsaturated-18-1_100g',
  '1194': 'fatty-acids-polyunsaturated-18-2_100g',
  '1123': 'fatty-acids-polyunsaturated-18-3_100g',
  '1299': 'fatty-acids-polyunsaturated-20-4_100g',
  '1273': 'fatty-acids-polyunsaturated-20-5_100g',
  '1011': 'fatty-acids-polyunsaturated-22-6_100g',
  '1108': 'vitamin-a-iu_100g',
  '1128': 'vitamin-e-alpha-tocopherol_100g',
  '1333': 'vitamin-k-phylloquinone_100g',
  '2014': 'vitamin-k-menaquinone-4_100g',
  '1334': 'vitamin-k-dihydrophylloquinone_100g',
  '1198': 'vitamin-b12-added_100g',
  '1315': 'folate-dfe_100g',
  '1131': 'folate-food_100g',
  '1050': 'carbohydrate-by-difference_100g',
  '1306': 'fiber-insoluble_100g',
  '2026': 'fiber-soluble_100g',
  '1129': 'sugar-alcohols_100g',
  '1264': 'sucrose_100g',
  '1184': 'lycopene_100g',
  '2012': 'lutein-zeaxanthin_100g',
};

function extractFDCID(chemicalName) {
  if (!chemicalName) return null;
  const match = chemicalName.match(/FDC_NUTRIENT:(\d+)/);
  return match ? match[1] : null;
}

function mapToNutrientName(chemicalName) {
  if (!chemicalName) return null;
  
  // First try FDC nutrient ID mapping
  const fdcId = extractFDCID(chemicalName);
  if (fdcId && FDC_NUTRIENT_MAP[fdcId]) {
    return FDC_NUTRIENT_MAP[fdcId];
  }
  
  // If it's an FDC nutrient but not in our map, try to infer from ID ranges
  // This is a fallback for unmapped FDC nutrients
  if (fdcId) {
    const idNum = parseInt(fdcId);
    // Energy range: 1000-1099
    if (idNum >= 1008 && idNum <= 1009) return 'energy-kcal_100g';
    if (idNum >= 1062 && idNum <= 1063) return 'energy-kj_100g';
    // Protein: 1003
    if (idNum === 1003) return 'proteins_100g';
    // Fat: 1004
    if (idNum === 1004) return 'fat_100g';
    // Carbs: 1005
    if (idNum === 1005) return 'carbohydrates_100g';
    // Minerals: 1087-1109
    if (idNum >= 1087 && idNum <= 1109) {
      if (idNum === 1087) return 'calcium_100g';
      if (idNum === 1089) return 'iron_100g';
      if (idNum === 1090) return 'magnesium_100g';
      if (idNum === 1091) return 'phosphorus_100g';
      if (idNum === 1092) return 'potassium_100g';
      if (idNum === 1093) return 'sodium_100g';
      if (idNum === 1095) return 'zinc_100g';
      if (idNum === 1106) return 'copper_100g';
      if (idNum === 1109) return 'manganese_100g';
      if (idNum === 1103) return 'selenium_100g';
    }
    // Vitamins: 1104-1185
    if (idNum >= 1104 && idNum <= 1185) {
      if (idNum === 1104) return 'vitamin-a_100g';
      if (idNum === 1162) return 'vitamin-c_100g';
      if (idNum === 1114) return 'vitamin-d_100g';
      if (idNum === 1185) return 'vitamin-k_100g';
      if (idNum === 1165) return 'thiamin_100g';
      if (idNum === 1166) return 'riboflavin_100g';
      if (idNum === 1167) return 'niacin_100g';
      if (idNum === 1175) return 'vitamin-b6_100g';
      if (idNum === 1177) return 'folate_100g';
      if (idNum === 1178) return 'vitamin-b12_100g';
    }
    // Fatty acids: 1250-1400
    if (idNum >= 1250 && idNum <= 1400) {
      if (idNum === 1258) return 'fatty-acids-total-saturated_100g';
      if (idNum === 1257) return 'fatty-acids-total-monounsaturated_100g';
      if (idNum === 1253) return 'fatty-acids-total-polyunsaturated_100g';
    }
  }
  
  // Fallback to name-based matching
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
  
  // If it's an FDC nutrient but we can't map it, store it with a generic name
  // This ensures we don't lose data
  if (fdcId) {
    return `fdc-nutrient-${fdcId}_100g`;
  }
  
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
    console.log('PROCESSING FOODATLAS DATABASE - GET ALL FOODS');
    console.log('═══════════════════════════════════════════════════════════');
    
    // Step 1: Read entities.tsv to get food names
    console.log('\n📖 Step 1: Reading entities.tsv...');
    const entities = await parseTSV(path.join(FOODATLAS_DIR, 'entities.tsv'));
    console.log(`   Found ${entities.length} total entities`);
    
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
    
    // Step 2: Read triplets.tsv to link food entities to metadata_contains
    console.log('\n📖 Step 2: Reading triplets.tsv...');
    const triplets = await parseTSV(path.join(FOODATLAS_DIR, 'triplets.tsv'));
    console.log(`   Found ${triplets.length} triplets`);
    
    // Build mapping: food entity ID -> metadata_contains IDs
    // triplets link: head_id (food) -> metadata_ids (['mc1', 'mc2']) -> metadata_contains
    const foodEntityToMetadataIds = new Map();
    let tripletCount = 0;
    
    triplets.forEach(triplet => {
      const headId = triplet.head_id; // Food entity ID
      const metadataIds = triplet.metadata_ids; // Array of metadata_contains IDs like ['mc1', 'mc2']
      
      if (!headId || !metadataIds) return;
      
      // Parse metadata_ids (array format)
      let ids = [];
      if (typeof metadataIds === 'string') {
        try {
          ids = JSON.parse(metadataIds.replace(/'/g, '"'));
        } catch (e) {
          // If not JSON, try splitting
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
    
    console.log(`\r   Mapped ${foodEntityToMetadataIds.size} food entities to metadata IDs`);
    console.log(`   Total triplets processed: ${tripletCount}`);
    
    // Step 3: Read metadata_contains.tsv and index by foodatlas_id (mc1, mc2, etc.)
    console.log('\n📖 Step 3: Reading nutrition data (metadata_contains)...');
    const contains = await parseTSV(path.join(FOODATLAS_DIR, 'metadata_contains.tsv'));
    console.log(`   Found ${contains.length} nutrition records`);
    
    // Build nutrition index: metadata_id (mc1) -> nutrients
    const metadataIdToNutrients = new Map();
    
    let processedCount = 0;
    let mappedCount = 0;
    let skippedCount = 0;
    
    contains.forEach(record => {
      const metadataId = record.foodatlas_id; // mc1, mc2, etc.
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
        // Don't skip - try to use a generic name for unmapped nutrients
        // This ensures we capture more foods even with partial data
        skippedCount++;
        // For now, skip unmapped nutrients but continue processing
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
    console.log(`   Mapped ${mappedCount} nutrients, skipped ${skippedCount} unmapped`);
    
    // Step 4: Link food entities to nutrition data via triplets
    console.log('\n🔨 Step 4: Linking food entities to nutrition data...');
    const database = [];
    const processedFoods = new Set();
    
    foodEntityToMetadataIds.forEach((metadataIds, foodEntityId) => {
      // Get food name
      const foodName = entityIdToName.get(foodEntityId);
      if (!foodName) return; // Skip if no name
      
      // Collect nutrition data from all metadata IDs
      let nutriments = {};
      let foundNutrition = false;
      
      metadataIds.forEach(metadataId => {
        if (metadataIdToNutrients.has(metadataId)) {
          const foodNutrients = metadataIdToNutrients.get(metadataId);
          nutriments = { ...nutriments, ...foodNutrients };
          foundNutrition = true;
        }
      });
      
      // Include foods even with just a few nutrients (at least 1)
      // But be more lenient - include foods with ANY mapped nutrients
      if (!foundNutrition || Object.keys(nutriments).length === 0) {
        return;
      }
      
      // Log progress for debugging
      if (database.length % 500 === 0) {
        process.stdout.write(`\r   Built ${database.length} foods (processing ${foodName})...`);
      }
      
      // Avoid duplicates
      const key = foodName.toLowerCase();
      if (processedFoods.has(key)) {
        // Merge if duplicate (prefer more complete)
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
    
    console.log('\n💾 Step 5: Writing database to JSON...');
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

