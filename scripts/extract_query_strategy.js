const fs = require('fs');
const lines = fs.readFileSync('real_barcode_batch_results_full.txt','utf16le').split(/\r?\n/);

const entries = [];
let i = 0;
while (i < lines.length) {
  if (lines[i].includes('[QUERY_STRATEGY]')) {
    let j = i+1;
    while (j < lines.length && !lines[j].trim().startsWith('{')) j++;
    if (j >= lines.length) break;
    let depth = 0;
    let block = [];
    for (; j < lines.length; j++) {
      const line = lines[j];
      for (const ch of line) {
        if (ch === '{') depth++;
        if (ch === '}') depth--;
      }
      block.push(line);
      if (depth === 0 && block.length > 0) break;
    }
    const text = block.join('\n');
    try {
      const obj = JSON.parse(text);
      if (obj && obj.barcode && Array.isArray(obj.databases)) {
        entries.push(obj);
      }
    } catch {}
    i = j + 1;
    continue;
  }
  i++;
}

const dbCounts = new Map();
for (const entry of entries) {
  for (const db of entry.databases) {
    dbCounts.set(db, (dbCounts.get(db) || 0) + 1);
  }
}
const rows = Array.from(dbCounts.entries()).sort((a,b)=>b[1]-a[1]);
const out = {
  totalBarcodes: entries.length,
  databaseCounts: rows.map(([db,count])=>({db,count}))
};
fs.writeFileSync('real_barcode_query_strategy_counts.json', JSON.stringify(out, null, 2));
console.log(`Query strategy entries: ${entries.length}`);
