const fs = require('fs');

const inputPath = process.env.INPUT_JSON || 'real_barcode_batch_results_clean.json';
const outputPath = process.env.OUTPUT_REPORT || 'REAL_BARCODE_BATCH_REPORT.md';
const data = JSON.parse(fs.readFileSync(inputPath,'utf8'));
const results = data.results || [];

const total = results.length;
const found = results.filter(r => r.product);
const notFound = results.filter(r => !r.product);

const primaryCounts = new Map();
const queriedCounts = new Map();
const allSourceCounts = new Map();

const nutriSourceCounts = new Map();
const ingredSourceCounts = new Map();
const additiveSourceCounts = new Map();
const originSourceCounts = new Map();

const errorMessages = new Map();
let errorsCount = 0;

let ethicsAdjusted = 0;
let hasCerts = 0;

const scores = new Map();

function inc(map, key, by = 1) {
  if (!key) return;
  map.set(key, (map.get(key) || 0) + by);
}

for (const r of results) {
  const ds = r.dataSources || {};
  inc(primaryCounts, ds.primarySource);
  for (const db of ds.databasesQueried || []) inc(queriedCounts, db);
  for (const db of ds.allSources || []) inc(allSourceCounts, db);

  const nutrition = ds.nutrition || {};
  for (const s of nutrition.sources || []) inc(nutriSourceCounts, s);

  const ingredients = ds.ingredients || {};
  for (const s of ingredients.sources || []) inc(ingredSourceCounts, s);

  const additives = ds.allergensAdditives || {};
  for (const s of additives.additivesSources || []) inc(additiveSourceCounts, s);

  const origin = ds.countryOfOrigin || {};
  for (const s of origin.sources || []) inc(originSourceCounts, s);

  const errs = r.errors || [];
  if (errs.length) {
    errorsCount += 1;
    for (const e of errs) {
      const msg = e.message || 'unknown';
      inc(errorMessages, msg);
    }
  }

  const ts = r.truScore || {};
  const breakdown = ts.breakdown || {};
  for (const [k, v] of Object.entries(breakdown)) {
    if (typeof v === 'number') {
      if (!scores.has(k)) scores.set(k, []);
      scores.get(k).push(v);
    }
  }

  if (typeof breakdown.Ethics === 'number' && breakdown.Ethics !== 15) {
    ethicsAdjusted += 1;
  }

  if ((r.product || {}).hasCertifications) hasCerts += 1;
}

function rate(n) {
  if (!total) return '0/0 (0%)';
  return `${n}/${total} (${(n/total*100).toFixed(1)}%)`;
}

function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a,b) => a + b, 0) / arr.length;
}

function mapToRows(map) {
  return Array.from(map.entries()).sort((a,b) => b[1]-a[1]);
}

const lines = [];
lines.push('# Real Barcode Batch Test Report');
lines.push('');
lines.push(`**Generated:** ${data.testRun?.timestamp || 'N/A'}`);
lines.push(`**Barcodes Tested:** ${total}`);
lines.push(`**Products Found:** ${found.length}`);
lines.push(`**Not Found:** ${notFound.length}`);
lines.push('');

lines.push('## Overall Success');
lines.push(`- Product found rate: ${rate(found.length)}`);
lines.push(`- Errors logged: ${errorsCount}`);
lines.push('');

lines.push('## Primary Source Hit Rates');
lines.push('| Database | Primary Hits | Rate |');
lines.push('|---|---:|---:|');
for (const [db, cnt] of mapToRows(primaryCounts)) {
  lines.push(`| ${db} | ${cnt} | ${(cnt/total*100).toFixed(1)}% |`);
}
lines.push('');

lines.push('## Databases Queried (Actual)');
lines.push('| Database | Queries | Rate |');
lines.push('|---|---:|---:|');
for (const [db, cnt] of mapToRows(queriedCounts)) {
  lines.push(`| ${db} | ${cnt} | ${(cnt/total*100).toFixed(1)}% |`);
}
lines.push('');

lines.push('## Per-Pillar Data Availability (Proxy)');
lines.push('These are based on actual data source fields present in results.');
lines.push('');

lines.push('### Body Pillar Data Sources');
lines.push('| Source | Nutrition | Ingredients | Additives |');
lines.push('|---|---:|---:|---:|');
const bodySources = new Set([
  ...nutriSourceCounts.keys(),
  ...ingredSourceCounts.keys(),
  ...additiveSourceCounts.keys()
]);
for (const s of Array.from(bodySources).sort()) {
  lines.push(`| ${s} | ${nutriSourceCounts.get(s)||0} | ${ingredSourceCounts.get(s)||0} | ${additiveSourceCounts.get(s)||0} |`);
}
lines.push('');

lines.push('### Open Pillar Data Sources');
lines.push('| Source | Ingredients | Origin |');
lines.push('|---|---:|---:|');
const openSources = new Set([
  ...ingredSourceCounts.keys(),
  ...originSourceCounts.keys()
]);
for (const s of Array.from(openSources).sort()) {
  lines.push(`| ${s} | ${ingredSourceCounts.get(s)||0} | ${originSourceCounts.get(s)||0} |`);
}
lines.push('');

lines.push('### Ethics Pillar Signals');
lines.push(`- Products with certifications: ${hasCerts}/${total} (${(hasCerts/total*100).toFixed(1)}%)`);
lines.push(`- Ethics score adjusted (!=15): ${ethicsAdjusted}/${total} (${(ethicsAdjusted/total*100).toFixed(1)}%)`);
lines.push('');

lines.push('## Pillar Score Summary (Found Products Only)');
lines.push('| Pillar | Count | Avg | Min | Max |');
lines.push('|---|---:|---:|---:|---:|');
for (const [pillar, vals] of scores.entries()) {
  if (!vals.length) continue;
  lines.push(`| ${pillar} | ${vals.length} | ${mean(vals).toFixed(1)} | ${Math.min(...vals)} | ${Math.max(...vals)} |`);
}
lines.push('');

lines.push('## Errors Observed');
lines.push('| Error | Count |');
lines.push('|---|---:|');
for (const [msg, cnt] of mapToRows(errorMessages)) {
  lines.push(`| ${msg} | ${cnt} |`);
}
lines.push('');

fs.writeFileSync(outputPath, lines.join('\n'));
console.log(`Report written: ${outputPath}`);
console.log(`Products found: ${found.length}/${total}`);
