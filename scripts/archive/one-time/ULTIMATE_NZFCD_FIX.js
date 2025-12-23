/**
 * ULTIMATE NZFCD FIX
 * This will definitely work - writes directly and prevents overwrites
 */

const fs = require('fs');
const path = require('path');

const TEXT_FILE = path.join(__dirname, '..', 'Database files', 'Principal files', 'ASCII Text Files', 'Standard', 'Standard DATA.AP');
const OUTPUT_FILE = path.join(__dirname, '..', 'backend', 'vercel', 'data', 'nzfcd.json');

console.log('ULTIMATE NZFCD FIX');
console.log('='.repeat(80));

// Step 1: Verify text file
if (!fs.existsSync(TEXT_FILE)) {
  console.error(`❌ Text file not found: ${TEXT_FILE}`);
  process.exit(1);
}

console.log(`✅ Text file found\n`);

// Step 2: Read and parse
const content = fs.readFileSync(TEXT_FILE, 'utf8');
const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('©'));

console.log(`Lines: ${lines.length}`);

if (lines.length < 4) {
  console.error('❌ Invalid file');
  process.exit(1);
}

// Verify first data line
const firstData = lines[3];
const firstParts = firstData.split('~');
console.log(`\nFirst food: "${firstParts[1]}"`);

if (!firstParts[1] || firstParts[1].match(/^Food \d+$/)) {
  console.error('❌ Invalid food name!');
  process.exit(1);
}

console.log('✅ First food name is valid\n');

// Step 3: Parse
const dataLines = lines.slice(3);
const foods = [];
const seen = new Set();

console.log(`Processing ${dataLines.length} data rows...`);

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
}

const valid = foods.filter(f => f.foodName && !f.foodName.match(/^Food \d+$/) && f.foodName.length > 2);

console.log(`\n✅ Parsed ${valid.length} valid foods\n`);

if (valid.length < 100) {
  console.error('❌ Not enough valid foods!');
  process.exit(1);
}

console.log('First 5 foods:');
valid.slice(0, 5).forEach((f, i) => {
  console.log(`  ${i+1}. "${f.foodName}"`);
});

// Step 4: Delete and write
if (fs.existsSync(OUTPUT_FILE)) {
  fs.unlinkSync(OUTPUT_FILE);
  console.log('\n✅ Deleted old database');
}

const dir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const jsonContent = JSON.stringify(valid, null, 2);
fs.writeFileSync(OUTPUT_FILE, jsonContent, 'utf8');

console.log(`✅ Written: ${valid.length} foods`);
console.log(`   File: ${OUTPUT_FILE}`);

// Step 5: Immediate verification
const verify = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
console.log(`\nVerification:`);
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

