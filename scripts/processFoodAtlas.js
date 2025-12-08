/**
 * Process FoodAtlas Database Bundle
 * 
 * Converts FoodAtlas TSV files to JSON format for app use
 * Creates a searchable nutrition database
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const DATA_DIR = path.join(__dirname, '..', 'backend', 'vercel', 'data');
const FOODATLAS_DIR = path.join(DATA_DIR, 'foodatlas');
const OUTPUT_FILE = path.join(DATA_DIR, 'foodatlas.json');

console.log('═══════════════════════════════════════════════════════════');
console.log('PROCESSING FOODATLAS DATABASE');
console.log('═══════════════════════════════════════════════════════════');

// Check if FoodAtlas directory exists
if (!fs.existsSync(FOODATLAS_DIR)) {
  console.error(`\n❌ FoodAtlas directory not found: ${FOODATLAS_DIR}`);
  console.error('   Please download FoodAtlas database first.');
  console.error('   Run: node scripts/downloadFoodAtlas.js');
  process.exit(1);
}

// Check for required files
const requiredFiles = [
  'metadata_food.tsv',
  'metadata_contains.tsv',
];

const missingFiles = requiredFiles.filter(file => 
  !fs.existsSync(path.join(FOODATLAS_DIR, file))
);

if (missingFiles.length > 0) {
  console.error(`\n❌ Missing required files:`);
  missingFiles.forEach(file => console.error(`   - ${file}`));
  console.error('\n   Please download FoodAtlas database first.');
  console.error('   Visit: https://www.foodatlas.ai/food-composition-downloads');
  process.exit(1);
}

console.log('\n📊 Processing FoodAtlas database...');
console.log('───────────────────────────────────────────────────────────');

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
        obj[header] = values[index] || '';
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
 * Build nutrition database
 */
async function buildNutritionDatabase() {
  console.log('\n📖 Reading food metadata...');
  const foods = await parseTSV(path.join(FOODATLAS_DIR, 'metadata_food.tsv'));
  
  console.log(`   Found ${foods.length} foods`);
  
  console.log('\n📖 Reading nutrition data (contains)...');
  const contains = await parseTSV(path.join(FOODATLAS_DIR, 'metadata_contains.tsv'));
  
  console.log(`   Found ${contains.length} nutrition records`);
  
  // Build index: food_id -> nutrients
  console.log('\n🔨 Building nutrition index...');
  const nutritionIndex = {};
  
  contains.forEach(record => {
    const foodId = record.food_id || record.Food_ID;
    if (!foodId) return;
    
    if (!nutritionIndex[foodId]) {
      nutritionIndex[foodId] = [];
    }
    
    nutritionIndex[foodId].push({
      chemical_id: record.chemical_id || record.Chemical_ID,
      value: parseFloat(record.value || record.Value || 0),
      unit: record.unit || record.Unit || 'g',
      source: record.source || record.Source || '',
    });
  });
  
  console.log(`   Indexed ${Object.keys(nutritionIndex).length} foods with nutrition data`);
  
  // Build searchable database
  console.log('\n🔨 Building searchable database...');
  const database = [];
  
  foods.forEach(food => {
    const foodId = food.food_id || food.Food_ID;
    if (!foodId) return;
    
    const foodName = food.name || food.Name || food.food_name || '';
    if (!foodName) return;
    
    const nutrients = nutritionIndex[foodId] || [];
    if (nutrients.length === 0) return; // Skip foods without nutrition data
    
    // Convert nutrients to our format
    const nutriments = {};
    nutrients.forEach(nutrient => {
      // Map chemical IDs to nutrient names
      // This is simplified - FoodAtlas uses chemical IDs that need mapping
      const value = nutrient.value;
      const unit = nutrient.unit.toLowerCase();
      
      // Basic mapping (would need full chemical ID mapping for complete conversion)
      if (unit === 'g' || unit === 'mg' || unit === 'mcg') {
        // Store raw data - will be processed by the service
        nutriments[`chemical_${nutrient.chemical_id}`] = {
          value: unit === 'g' ? value : unit === 'mg' ? value / 1000 : value / 1000000,
          unit: 'g',
          source: nutrient.source,
        };
      }
    });
    
    database.push({
      food_id: foodId,
      name: foodName,
      description: food.description || food.Description || '',
      food_group: food.food_group || food.Food_Group || '',
      nutriments: nutriments,
      nutrient_count: nutrients.length,
    });
  });
  
  console.log(`   Built database with ${database.length} foods`);
  
  return database;
}

/**
 * Main processing function
 */
async function main() {
  try {
    const database = await buildNutritionDatabase();
    
    console.log('\n💾 Writing database to JSON...');
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(database, null, 2));
    
    const stats = fs.statSync(OUTPUT_FILE);
    console.log(`   ✅ Written: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   📁 File: ${OUTPUT_FILE}`);
    
    console.log('\n✅ FoodAtlas database processed successfully!');
    console.log('   Ready for integration into the app.');
    
  } catch (error) {
    console.error('\n❌ Error processing FoodAtlas database:');
    console.error(error);
    process.exit(1);
  }
}

main();

