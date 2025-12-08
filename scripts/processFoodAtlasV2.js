/**
 * Process FoodAtlas Database v3.2.0 - Improved Version
 * 
 * Uses FDC Nutrient ID mapping to properly identify nutrients
 * Maps to standard nutrient names used in the app
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const FOODATLAS_DIR = path.join(__dirname, '..', 'Database files', 'FoodAtlas v3.2.0', 'v3.2_20250211');
const OUTPUT_FILE = path.join(__dirname, '..', 'backend', 'vercel', 'data', 'foodatlas.json');

// USDA FDC Nutrient ID to standard nutrient name mapping
// Based on USDA FoodData Central standard nutrient IDs
const FDC_NUTRIENT_MAP = {
  '1008': 'energy-kcal_100g',      // Energy (kcal)
  '1062': 'energy-kj_100g',       // Energy (kJ)
  '1003': 'proteins_100g',         // Protein
  '1004': 'fat_100g',              // Total lipid (fat)
  '1258': 'fatty-acids-total-saturated_100g', // Fatty acids, total saturated
  '1257': 'fatty-acids-total-monounsaturated_100g', // Fatty acids, total monounsaturated
  '1253': 'fatty-acids-total-polyunsaturated_100g', // Fatty acids, total polyunsaturated
  '1005': 'carbohydrates_100g',    // Carbohydrate, by difference
  '2000': 'sugars_100g',           // Sugars, total including NLEA
  '1079': 'fiber_100g',            // Fiber, total dietary
  '1087': 'calcium_100g',          // Calcium, Ca
  '1089': 'iron_100g',             // Iron, Fe
  '1090': 'magnesium_100g',        // Magnesium, Mg
  '1091': 'phosphorus_100g',       // Phosphorus, P
  '1092': 'potassium_100g',        // Potassium, K
  '1093': 'sodium_100g',           // Sodium, Na
  '1095': 'zinc_100g',             // Zinc, Zn
  '1106': 'copper_100g',           // Copper, Cu
  '1109': 'manganese_100g',        // Manganese, Mn
  '1103': 'selenium_100g',         // Selenium, Se
  '1104': 'vitamin-a_100g',        // Vitamin A, RAE
  '1162': 'vitamin-c_100g',        // Vitamin C, total ascorbic acid
  '1114': 'vitamin-d_100g',        // Vitamin D (D2 + D3)
  '1109': 'vitamin-e_100g',        // Vitamin E (alpha-tocopherol)
  '1185': 'vitamin-k_100g',        // Vitamin K (phylloquinone)
  '1165': 'thiamin_100g',          // Thiamin
  '1166': 'riboflavin_100g',       // Riboflavin
  '1167': 'niacin_100g',           // Niacin
  '1175': 'vitamin-b6_100g',       // Vitamin B-6
  '1177': 'folate_100g',           // Folate, total
  '1178': 'vitamin-b12_100g',      // Vitamin B-12
  '1253': 'cholesterol_100g',      // Cholesterol
  '1057': 'caffeine_100g',         // Caffeine
  '1018': 'alcohol_100g',          // Alcohol, ethyl
};

// Additional mappings for common nutrient names
const NUTRIENT_NAME_MAP = {
  'energy': 'energy-kcal_100g',
  'calories': 'energy-kcal_100g',
  'protein': 'proteins_100g',
  'fat': 'fat_100g',
  'saturated fat': 'fatty-acids-total-saturated_100g',
  'carbohydrate': 'carbohydrates_100g',
  'sugar': 'sugars_100g',
  'fiber': 'fiber_100g',
  'sodium': 'sodium_100g',
  'calcium': 'calcium_100g',
  'iron': 'iron_100g',
};

/**
 * Extract FDC Nutrient ID from string like "FDC_NUTRIENT:1089"
 */
function extractFDCID(chemicalName) {
  if (!chemicalName) return null;
  const match = chemicalName.match(/FDC_NUTRIENT:(\d+)/);
  return match ? match[1] : null;
}

/**
 * Map FDC Nutrient ID or name to standard nutrient name
 */
function mapToNutrientName(chemicalName) {
  if (!chemicalName) return null;
  
  // Try FDC ID first
  const fdcId = extractFDCID(chemicalName);
  if (fdcId && FDC_NUTRIENT_MAP[fdcId]) {
    return FDC_NUTRIENT_MAP[fdcId];
  }
  
  // Try name mapping
  const nameLower = chemicalName.toLowerCase();
  for (const [key, value] of Object.entries(NUTRIENT_NAME_MAP)) {
    if (nameLower.includes(key)) {
      return value;
    }
  }
  
  return null;
}

/**
 * Convert value to grams per 100g
 */
function convertToGramsPer100g(value, unit) {
  if (!value || isNaN(value)) return null;
  
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return null;
  
  const unitLower = (unit || '').toLowerCase();
  
  // Energy units
  if (unitLower.includes('kcal')) {
    return numValue; // Keep as kcal
  }
  if (unitLower.includes('kj')) {
    return numValue; // Keep as kJ
  }
  
  // Mass units
  if (unitLower.includes('g/100g') || unitLower === 'g') {
    return numValue;
  }
  if (unitLower.includes('mg/100g') || unitLower === 'mg') {
    return numValue / 1000;
  }
  if (unitLower.includes('mcg/100g') || unitLower === 'mcg' || unitLower === 'µg') {
    return numValue / 1000000;
  }
  if (unitLower.includes('kg/100g')) {
    return numValue * 1000;
  }
  
  // Default: assume g/100g
  return numValue;
}

/**
 * Parse TSV file
 */
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
        // Parse array-like strings (e.g., "['e1']")
        if (value.startsWith('[') && value.endsWith(']')) {
          try {
            value = JSON.parse(value.replace(/'/g, '"'));
            if (Array.isArray(value) && value.length > 0) {
              value = value[0]; // Take first element
            }
          } catch (e) {
            // Keep as string if parsing fails
          }
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

/**
 * Main processing function
 */
async function main() {
  try {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('PROCESSING FOODATLAS DATABASE v3.2.0');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n📖 Step 1: Reading food lookup table...');
    const foodLookup = await parseTSV(path.join(FOODATLAS_DIR, 'lookup_table_food.tsv'));
    console.log(`   Found ${foodLookup.length} foods`);
    
    // Build food name to ID mapping
    const foodNameToId = new Map();
    foodLookup.forEach(food => {
      const name = food.name;
      const id = food.foodatlas_id;
      if (name && id) {
        const ids = Array.isArray(id) ? id : [id];
        ids.forEach(foodId => {
          if (!foodNameToId.has(name.toLowerCase())) {
            foodNameToId.set(name.toLowerCase(), []);
          }
          foodNameToId.get(name.toLowerCase()).push(foodId);
        });
      }
    });
    
    console.log(`   Mapped ${foodNameToId.size} unique food names`);
    
    console.log('\n📖 Step 2: Reading nutrition data (metadata_contains)...');
    const contains = await parseTSV(path.join(FOODATLAS_DIR, 'metadata_contains.tsv'));
    console.log(`   Found ${contains.length} nutrition records`);
    
    // Build nutrition index: foodatlas_id -> nutrients
    console.log('\n🔨 Step 3: Building nutrition index...');
    const nutritionIndex = new Map();
    
    let processedCount = 0;
    let mappedCount = 0;
    let skippedCount = 0;
    
    contains.forEach(record => {
      // Use _food_name as the key (e.g., "FDC:321358") instead of foodatlas_id (which is just record ID like "mc1")
      const foodIdentifier = record._food_name || '';
      const chemicalName = record._chemical_name || '';
      const value = record.conc_value;
      const unit = record.conc_unit || 'mg/100g';
      const isOutlier = record._is_outlier === 'True';
      
      if (!foodIdentifier || !chemicalName || !value || isOutlier) {
        skippedCount++;
        return;
      }
      
      // Map chemical to nutrient
      const nutrientName = mapToNutrientName(chemicalName);
      if (!nutrientName) {
        skippedCount++;
        return; // Skip unmapped nutrients
      }
      
      // Convert to standard format
      const convertedValue = convertToGramsPer100g(value, unit);
      if (convertedValue === null) {
        skippedCount++;
        return;
      }
      
      if (!nutritionIndex.has(foodIdentifier)) {
        nutritionIndex.set(foodIdentifier, {});
      }
      
      const nutrients = nutritionIndex.get(foodIdentifier);
      
      // Only keep best value if duplicate (prefer higher value or first)
      if (!nutrients[nutrientName] || convertedValue > nutrients[nutrientName]) {
        nutrients[nutrientName] = convertedValue;
        mappedCount++;
      }
      
      processedCount++;
      if (processedCount % 10000 === 0) {
        process.stdout.write(`\r   Processed ${processedCount} records, mapped ${mappedCount} nutrients...`);
      }
    });
    
    console.log(`\r   Indexed ${nutritionIndex.size} foods with nutrition data`);
    console.log(`   Mapped ${mappedCount} nutrients, skipped ${skippedCount} unmapped`);
    
    // Build final database
    // Group nutrition data by food name (since _food_name like "FDC:321358" doesn't directly match food names)
    // We'll create a database keyed by food name from lookup_table_food
    console.log('\n🔨 Step 4: Building searchable database...');
    
    // First, let's see what _food_name values we have
    const foodIdentifiers = new Set();
    nutritionIndex.forEach((nutrients, foodId) => {
      foodIdentifiers.add(foodId);
    });
    console.log(`   Found ${foodIdentifiers.size} unique food identifiers in nutrition data`);
    
    // Since _food_name contains IDs like "FDC:321358" and food names are in lookup_table_food,
    // we need to match them differently. For now, let's create entries directly from nutrition data
    // using a simplified approach: use the food name from lookup_table_food and try to match
    
    // Actually, let's try a different approach: use the food names directly and see if we can
    // find nutrition data. But since we don't have a direct link, we'll need to match by name similarity
    // or create a mapping. For now, let's create a database that uses food names as keys.
    
    const database = [];
    const processedFoods = new Set();
    
    // Since we can't directly link FDC IDs to food names, let's create a reverse index
    // that groups nutrition data and then try to match with food names
    // For now, we'll create entries for each unique food identifier and use it as a searchable name
    
    // Alternative: Use entities.tsv to find food names that match FDC IDs
    // But for simplicity, let's create entries using the food names from lookup_table_food
    // and try to find matching nutrition data by checking if any _food_name might relate
    
    // Actually, the best approach: Since we have nutrition data keyed by _food_name (like "FDC:321358"),
    // and we have food names in lookup_table_food, we need to either:
    // 1. Use entities.tsv to link FDC IDs to food names
    // 2. Or create a simpler database that just uses food names and tries fuzzy matching
    
    // For now, let's use the food names from lookup_table_food and create a database
    // The matching will happen at query time in the service using fuzzy matching
    
    foodLookup.forEach(food => {
      const foodName = food.name;
      if (!foodName) return;
      
      // Try to find nutrition data - since we can't directly link, we'll skip this for now
      // and create a database that the service can search by name
      // The service will do fuzzy matching
      
      // Actually, let's check entities.tsv to see if we can link food names to FDC IDs
      // For now, create empty entries that will be populated if we can find a way to link
    });
    
    // Since direct linking is complex, let's create a simpler approach:
    // Create database entries for each unique food name, and the service will
    // do fuzzy matching at query time. But we still need nutrition data...
    
    // Better approach: Read entities.tsv to find food entities that have FDC IDs
    // Then link those to food names, then to nutrition data
    
    console.log('   Reading entities.tsv to link food names to identifiers...');
    const entities = await parseTSV(path.join(FOODATLAS_DIR, 'entities.tsv'));
    console.log(`   Found ${entities.length} entities`);
    
    // Build mapping: foodatlas_id -> FDC IDs (as "FDC:XXXX" format)
    const entityToFDC = new Map();
    entities.forEach(entity => {
      if (entity.entity_type === 'food' && entity.external_ids) {
        try {
          let externalIds;
          if (typeof entity.external_ids === 'string') {
            // Parse the string representation of dict
            externalIds = JSON.parse(entity.external_ids.replace(/'/g, '"'));
          } else {
            externalIds = entity.external_ids;
          }
          
          if (externalIds && externalIds.fdc) {
            const fdcIds = Array.isArray(externalIds.fdc) ? externalIds.fdc : [externalIds.fdc];
            fdcIds.forEach(fdcId => {
              // Convert FDC ID to "FDC:XXXX" format to match nutrition index
              const fdcKey = `FDC:${fdcId}`;
              if (!entityToFDC.has(entity.foodatlas_id)) {
                entityToFDC.set(entity.foodatlas_id, []);
              }
              entityToFDC.get(entity.foodatlas_id).push(fdcKey);
            });
          }
        } catch (e) {
          // Skip if parsing fails
        }
      }
    });
    
    console.log(`   Mapped ${entityToFDC.size} food entities to FDC IDs`);
    
    // Now build database: food name -> nutrition data
    foodLookup.forEach(food => {
      const foodName = food.name;
      if (!foodName) return;
      
      const foodId = food.foodatlas_id;
      const ids = Array.isArray(foodId) ? foodId : [foodId];
      
      // Find FDC IDs for this food entity
      const fdcIds = [];
      ids.forEach(id => {
        if (entityToFDC.has(id)) {
          const foodFdcIds = entityToFDC.get(id);
          if (Array.isArray(foodFdcIds)) {
            fdcIds.push(...foodFdcIds);
          } else {
            fdcIds.push(foodFdcIds);
          }
        }
      });
      
      if (fdcIds.length === 0) return; // Skip if no FDC ID
      
      // Find nutrition data using any of the FDC IDs (merge all)
      let nutriments = {};
      let foundNutrition = false;
      fdcIds.forEach(fdcId => {
        if (nutritionIndex.has(fdcId)) {
          const foodNutrients = nutritionIndex.get(fdcId);
          nutriments = { ...nutriments, ...foodNutrients };
          foundNutrition = true;
        }
      });
      
      if (!foundNutrition) return;
      if (Object.keys(nutriments).length === 0) return;
      
      // Avoid duplicates
      const key = foodName.toLowerCase();
      if (processedFoods.has(key)) return;
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
    database.slice(0, 5).forEach((food, index) => {
      console.log(`   ${index + 1}. ${food.name} (${food.nutrient_count} nutrients)`);
      const sampleNutrients = Object.keys(food.nutriments).slice(0, 5);
      console.log(`      Nutrients: ${sampleNutrients.join(', ')}`);
    });
    
    console.log('\n✅ FoodAtlas database processed successfully!');
    console.log('   Ready for integration into the app.');
    
  } catch (error) {
    console.error('\n❌ Error processing FoodAtlas database:');
    console.error(error);
    process.exit(1);
  }
}

main();

