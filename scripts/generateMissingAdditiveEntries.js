// Script to generate entries for all missing E-numbers
// This will create a comprehensive file with all missing entries

const fs = require('fs');
const path = require('path');

// Read the missing list
const missingFile = path.join(__dirname, '../MISSING_ADDITIVES_LIST.txt');
const missing = fs.readFileSync(missingFile, 'utf8').split('\n').filter(n => n.trim());

console.log(`Generating entries for ${missing.length} missing E-numbers...`);

// Categories for different ranges
function getCategory(eNum) {
  const num = parseInt(eNum);
  if (num >= 100 && num < 200) return 'Color';
  if (num >= 200 && num < 300) return 'Preservative';
  if (num >= 300 && num < 400) return 'Antioxidant / Acidity Regulator';
  if (num >= 400 && num < 500) return 'Thickener / Emulsifier';
  if (num >= 500 && num < 600) return 'Acidity Regulator / Anti-caking Agent';
  if (num >= 600 && num < 700) return 'Flavor Enhancer';
  if (num >= 700 && num < 800) return 'Antibiotic (Not Food Additive)';
  if (num >= 900 && num < 1000) return 'Glazing Agent / Sweetener';
  if (num >= 1000) return 'Modified Starch / Other';
  return 'Other';
}

function getSafety(eNum) {
  const num = parseInt(eNum);
  // Many unused numbers - mark as safe with note
  if (num >= 700 && num < 800) return 'avoid'; // Antibiotics
  // Default to safe with "not commonly used" note
  return 'safe';
}

function generateEntry(eNum) {
  const num = parseInt(eNum);
  const category = getCategory(eNum);
  const safety = getSafety(eNum);
  
  // Special handling for antibiotics range
  if (num >= 700 && num < 800) {
    return `  'e${eNum}': { name: 'E${eNum} (Reserved for Antibiotics)', category: '${category}', description: 'This E-number is reserved for antibiotics and is not used as a food additive. Reserved range E700-E799 for pharmaceutical use only.', safety: '${safety}', concerns: ['Not a food additive', 'Reserved for antibiotics'] },`;
  }
  
  // Default entry for unused/reserved numbers
  return `  'e${eNum}': { name: 'E${eNum}', category: '${category}', description: 'This E-number is not currently assigned or commonly used in food products. Information may be limited.', safety: '${safety}' },`;
}

// Generate entries
const entries = missing.map(eNum => generateEntry(eNum.trim()));

// Write to file
const outputFile = path.join(__dirname, '../GENERATED_MISSING_ENTRIES.txt');
fs.writeFileSync(outputFile, entries.join('\n'), 'utf8');

console.log(`✅ Generated ${entries.length} entries`);
console.log(`📝 Saved to: ${outputFile}`);
console.log(`\nNote: This generates placeholder entries. You may want to replace some with more detailed information for commonly encountered E-numbers.`);


