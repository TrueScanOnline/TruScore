const fs = require('fs');
const text = fs.readFileSync('real_barcode_batch_results_full.txt','utf8');
const marker = 'TEST RESULTS (JSON)';
const idx = text.indexOf(marker);
if (idx === -1) {
  console.error('Marker not found');
  process.exit(1);
}
const after = text.slice(idx + marker.length);
const start = after.indexOf('{');
if (start === -1) {
  console.error('JSON start not found');
  process.exit(1);
}
let i = start;
let depth = 0;
let inString = false;
let escape = false;
for (; i < after.length; i++) {
  const ch = after[i];
  if (escape) { escape = false; continue; }
  if (ch === '\\') { escape = true; continue; }
  if (ch === '"') { inString = !inString; continue; }
  if (inString) continue;
  if (ch === '{') depth++;
  if (ch === '}') {
    depth--;
    if (depth === 0) {
      const jsonText = after.slice(start, i+1);
      fs.writeFileSync('real_barcode_batch_results_clean.json', jsonText);
      console.log('Clean JSON written');
      process.exit(0);
    }
  }
}
console.error('JSON end not found');
process.exit(1);
