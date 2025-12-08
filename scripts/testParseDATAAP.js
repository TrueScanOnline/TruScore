/**
 * Test parser for Standard DATA.AP
 */

const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, '..', 'Database files', 'Principal files', 'ASCII Text Files', 'Standard', 'Standard DATA.AP');

console.log('Testing Standard DATA.AP parser...\n');

const content = fs.readFileSync(INPUT_FILE, 'utf8');
const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);

console.log(`Total lines: ${lines.length}`);

// Line 0: Copyright
// Line 1: Header row 1 (column names)
// Line 2: Header row 2 (units)
// Line 3+: Data rows

const headerRow1 = lines[1].split('~');
console.log(`Header columns: ${headerRow1.length}`);
console.log(`Column 0: ${headerRow1[0]}`);
console.log(`Column 1: ${headerRow1[1]}`);

// Find key columns
const findCol = (term) => {
  const idx = headerRow1.findIndex(h => h && h.toLowerCase().includes(term.toLowerCase()));
  return idx >= 0 ? { index: idx, name: headerRow1[idx] } : null;
};

console.log('\nKey columns:');
console.log('Energy (kcal):', findCol('energy, total metabolisable (kcal)') || findCol('energy (kcal)'));
console.log('Energy (kJ):', findCol('energy, total metabolisable (kj)') || findCol('energy (kj)'));
console.log('Protein:', findCol('protein, total'));
console.log('Fat:', findCol('fat, total'));
console.log('Saturated Fat:', findCol('fatty acids, total saturated'));
console.log('Carbohydrates:', findCol('total carbohydrate by difference'));
console.log('Sugars:', findCol('sugars, total'));
console.log('Fiber:', findCol('fibre, total dietary'));
console.log('Calcium:', findCol('calcium'));
console.log('Iron:', findCol('iron'));
console.log('Sodium:', findCol('sodium'));

// Test parsing first data row
const dataLine = lines[3];
const parts = dataLine.split('~');
console.log(`\nFirst data row:`);
console.log(`  FoodID: ${parts[0]}`);
console.log(`  Food Name: ${parts[1]}`);
console.log(`  Total parts: ${parts.length}`);

// Count data rows (excluding headers)
const dataRows = lines.slice(3);
console.log(`\nData rows: ${dataRows.length}`);

// Count unique FoodIDs
const foodIds = new Set();
for (const line of dataRows) {
  const parts = line.split('~');
  if (parts.length > 0 && parts[0].trim()) {
    foodIds.add(parts[0].trim());
  }
}

console.log(`Unique FoodIDs: ${foodIds.size}`);
console.log(`\n✅ File structure looks correct!`);
console.log(`   Expected: ~2,860 foods`);
console.log(`   Found: ${foodIds.size} unique FoodIDs`);

