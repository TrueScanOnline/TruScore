// Script to identify all gaps in the additive database
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../src/services/additiveDatabase.ts');
const content = fs.readFileSync(dbPath, 'utf8');

// Extract all E-numbers from the database
const eNumberRegex = /'e(\d+[a-z]*)':/g;
const found = [];
let match;

while ((match = eNumberRegex.exec(content)) !== null) {
  found.push(match[1].toLowerCase());
}

// Generate all possible E-numbers (100-1521)
const allPossible = [];
for (let i = 100; i <= 1521; i++) {
  allPossible.push(i.toString());
}

// Also include common letter variants
const letterVariants = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];
const variants = ['150a', '150b', '150c', '150d', '407a', '440a', '440b', '553a', '553b'];
variants.forEach(v => {
  if (!found.includes(v)) {
    allPossible.push(v);
  }
});

// Find missing ones
const missing = allPossible.filter(num => {
  // Check if this exact number exists or if there's a variant
  const hasExact = found.includes(num);
  const hasVariant = found.some(f => f.startsWith(num) && f.length > num.length);
  return !hasExact && !hasVariant;
});

console.log(`\n=== ADDITIVE DATABASE GAP ANALYSIS ===\n`);
console.log(`Total E-numbers in database: ${found.length}`);
console.log(`Total possible E-numbers (100-1521): ${allPossible.length}`);
console.log(`Missing E-numbers: ${missing.length}\n`);

// Group missing by range
const ranges = {
  'E100-E199 (Colors)': missing.filter(n => parseInt(n) >= 100 && parseInt(n) < 200),
  'E200-E299 (Preservatives)': missing.filter(n => parseInt(n) >= 200 && parseInt(n) < 300),
  'E300-E399 (Antioxidants)': missing.filter(n => parseInt(n) >= 300 && parseInt(n) < 400),
  'E400-E499 (Thickeners)': missing.filter(n => parseInt(n) >= 400 && parseInt(n) < 500),
  'E500-E599 (Acidity Regulators)': missing.filter(n => parseInt(n) >= 500 && parseInt(n) < 600),
  'E600-E699 (Flavor Enhancers)': missing.filter(n => parseInt(n) >= 600 && parseInt(n) < 700),
  'E700-E799 (Antibiotics - typically not used)': missing.filter(n => parseInt(n) >= 700 && parseInt(n) < 800),
  'E900-E999 (Glazing/Sweeteners)': missing.filter(n => parseInt(n) >= 900 && parseInt(n) < 1000),
  'E1000-E1521 (Others)': missing.filter(n => parseInt(n) >= 1000 && parseInt(n) <= 1521),
};

Object.keys(ranges).forEach(range => {
  const nums = ranges[range];
  if (nums.length > 0) {
    console.log(`${range}: ${nums.length} missing`);
    console.log(`  ${nums.slice(0, 20).join(', ')}${nums.length > 20 ? '...' : ''}`);
  }
});

// Write missing list to file
fs.writeFileSync(
  path.join(__dirname, '../MISSING_ADDITIVES_LIST.txt'),
  missing.join('\n')
);

console.log(`\n✅ Missing list saved to MISSING_ADDITIVES_LIST.txt`);

