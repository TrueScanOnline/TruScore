/**
 * Direct NZFCD Generation - Bypass all other scripts
 * This generates the database directly from text file and writes it
 */

const fs = require('fs');
const path = require('path');

const TEXT_FILE = path.join(__dirname, '..', 'Database files', 'Principal files', 'ASCII Text Files', 'Standard', 'Standard DATA.AP');
const OUTPUT_FILE = path.join(__dirname, '..', 'backend', 'vercel', 'data', 'nzfcd.json');

console.log('DIRECT NZFCD GENERATION');
console.log('='.repeat(80));

// Delete old file
if (fs.existsSync(OUTPUT_FILE)) {
  fs.unlinkSync(OUTPUT_FILE);
  console.log('Deleted old file\n');
}

// Read text file
const content = fs.readFileSync(TEXT_FILE, 'utf8');
const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('©'));

console.log(`Lines: ${lines.length}`);

const headerRow1 = lines[1].split('~');
const dataLines = lines.slice(3);

console.log(`Data rows: ${dataLines.length}\n`);

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
}

const valid = foods.filter(f => f.foodName && !f.foodName.match(/^Food \d+$/) && f.foodName.length > 2);

console.log(`Valid foods: ${valid.length}\n`);

if (valid.length < 100) {
  console.error('❌ Not enough valid foods!');
  process.exit(1);
}

console.log('First 3:');
valid.slice(0, 3).forEach((f, i) => console.log(`  ${i+1}. "${f.foodName}"`));

// Write
const dir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(valid, null, 2), 'utf8');

console.log(`\n✅ Written: ${valid.length} foods`);
console.log(`   File: ${OUTPUT_FILE}`);

// Verify
const check = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
if (check[0].foodName.match(/^Food \d+$/)) {
  console.error('\n❌ Still broken!');
  process.exit(1);
}

console.log(`✅ Verified: "${check[0].foodName}"`);
console.log('\n✅ SUCCESS!');

