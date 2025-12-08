/**
 * Test and Fix NZFCD Database
 * This script will test parsing and then fix the database
 */

const fs = require('fs');
const path = require('path');

const TEXT_FILE = path.join(__dirname, '..', 'Database files', 'Principal files', 'ASCII Text Files', 'Standard', 'Standard DATA.AP');
const OUTPUT_FILE = path.join(__dirname, '..', 'backend', 'vercel', 'data', 'nzfcd.json');

console.log('TESTING AND FIXING NZFCD DATABASE');
console.log('='.repeat(80));

// Step 1: Test parsing
console.log('\nStep 1: Testing text file parsing...');
const content = fs.readFileSync(TEXT_FILE, 'utf8');
const allLines = content.split(/\r?\n/);
const lines = allLines.map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('©'));

console.log(`Total lines: ${allLines.length}`);
console.log(`Filtered lines: ${lines.length}`);

if (lines.length < 3) {
  console.error('❌ Invalid file format');
  process.exit(1);
}

const headerRow1 = lines[0].split('~');
const firstData = lines[2];
const firstParts = firstData.split('~');

console.log(`Header columns: ${headerRow1.length}`);
console.log(`First data Food ID: "${firstParts[0]}"`);
console.log(`First data Food Name: "${firstParts[1]}"`);

if (!firstParts[1] || firstParts[1].match(/^Food \d+$/)) {
  console.error('❌ Invalid food name in first data line!');
  console.error(`   Got: "${firstParts[1]}"`);
  process.exit(1);
}

console.log('✅ Text file parsing successful!');

// Step 2: Delete old database
console.log('\nStep 2: Deleting old database...');
if (fs.existsSync(OUTPUT_FILE)) {
  fs.unlinkSync(OUTPUT_FILE);
  console.log('✅ Deleted old database');
} else {
  console.log('✅ No old database to delete');
}

// Step 3: Generate new database
console.log('\nStep 3: Generating new database from text file...');
const dataLines = lines.slice(2);
const foods = [];
const seen = new Set();

for (let i = 0; i < dataLines.length; i++) {
  const parts = dataLines[i].split('~');
  if (parts.length < 2) continue;
  
  const foodId = parts[0]?.trim();
  const foodName = parts[1]?.trim();
  
  if (!foodId || !foodName || foodName.length < 2) continue;
  if (seen.has(foodId)) continue;
  seen.add(foodId);
  
  const parse = (idx) => {
    if (idx < 0 || idx >= parts.length) return undefined;
    const v = parts[idx]?.trim();
    if (!v || v === '' || v === '~~') return undefined;
    const n = parseFloat(v);
    return isNaN(n) ? undefined : n;
  };
  
  foods.push({
    foodName: foodName,
    foodNameLower: foodName.toLowerCase().trim(),
    energyKcal: parse(25),
    energyKj: parse(27),
    protein: parse(58),
    fat: parse(28),
    saturatedFat: parse(40),
    carbohydrates: parse(14),
    sugars: parse(70),
    dietaryFiber: parse(42),
    calcium: parse(13),
    iron: parse(50),
    sodium: parse(59),
    salt: parse(59) ? parse(59) * 2.54 : undefined,
  });
  
  if ((i + 1) % 1000 === 0) {
    process.stdout.write(`\r  Processed ${i + 1}/${dataLines.length}...`);
  }
}

console.log(`\n✅ Parsed ${foods.length} foods`);

// Step 4: Filter valid
const valid = foods.filter(f => f.foodName && !f.foodName.match(/^Food \d+$/) && f.foodName.length > 2);
console.log(`Valid foods: ${valid.length}`);

if (valid.length < 100) {
  console.error('❌ Not enough valid foods!');
  process.exit(1);
}

console.log('\nFirst 5 foods:');
valid.slice(0, 5).forEach((f, i) => {
  console.log(`  ${i+1}. "${f.foodName}"`);
});

// Step 5: Write new database
console.log('\nStep 5: Writing new database...');
const dir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const jsonContent = JSON.stringify(valid, null, 2);
fs.writeFileSync(OUTPUT_FILE, jsonContent, 'utf8');

console.log(`✅ Written: ${valid.length} foods`);
console.log(`   File: ${OUTPUT_FILE}`);

// Step 6: Verify
console.log('\nStep 6: Verifying database...');
const verify = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
console.log(`  Total: ${verify.length}`);
console.log(`  First: "${verify[0].foodName}"`);

if (verify[0].foodName.match(/^Food \d+$/) || verify[0].rawData) {
  console.error('\n❌ ERROR: Database still broken!');
  console.error(`   Got: "${verify[0].foodName}"`);
  console.error(`   Has rawData: ${!!verify[0].rawData}`);
  process.exit(1);
}

console.log('\n✅ SUCCESS: Database fixed correctly!');
console.log(`   Ready for TruScore integration`);

