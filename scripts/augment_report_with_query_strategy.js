const fs = require('fs');
const report = fs.readFileSync('REAL_BARCODE_BATCH_REPORT.md','utf8');
const qs = JSON.parse(fs.readFileSync('real_barcode_query_strategy_counts.json','utf8'));
const data = JSON.parse(fs.readFileSync('real_barcode_batch_results_clean.json','utf8'));
const results = data.results || [];

const total = results.length;
const primaryCounts = new Map();
const allSourceCounts = new Map();
for (const r of results) {
  const ds = r.dataSources || {};
  if (ds.primarySource) primaryCounts.set(ds.primarySource, (primaryCounts.get(ds.primarySource)||0)+1);
  for (const db of ds.allSources || []) {
    allSourceCounts.set(db, (allSourceCounts.get(db)||0)+1);
  }
}

const lines = [report.trimEnd(), '', '## Attempted Queries vs Contributions (Actual)',
  'These are from QUERY_STRATEGY logs (attempted) vs actual data contributions in results.',
  '',
  '| Database | Attempted | Primary Hits | Any Contribution |',
  '|---|---:|---:|---:|'
];

for (const entry of qs.databaseCounts) {
  const name = entry.db;
  const attempted = entry.count;
  const primary = primaryCounts.get(name.toLowerCase().replace(/\s+/g,'')) || primaryCounts.get(name) || 0;
  const contribution = allSourceCounts.get(name.toLowerCase().replace(/\s+/g,'')) || allSourceCounts.get(name) || 0;
  lines.push(`| ${name} | ${attempted} | ${primary} | ${contribution} |`);
}

lines.push('');
lines.push('## Cost vs Contribution Ranking (This Batch)');
lines.push('Sorted by attempted queries with zero contribution.');
lines.push('');
const zeroContribution = qs.databaseCounts.filter(d => {
  const name = d.db;
  const primary = primaryCounts.get(name.toLowerCase().replace(/\s+/g,'')) || primaryCounts.get(name) || 0;
  const contribution = allSourceCounts.get(name.toLowerCase().replace(/\s+/g,'')) || allSourceCounts.get(name) || 0;
  return primary === 0 && contribution === 0;
});
for (const d of zeroContribution) {
  lines.push(`- ${d.db}: attempted ${d.count}, contribution 0`);
}

fs.writeFileSync('REAL_BARCODE_BATCH_REPORT.md', lines.join('\n'));
console.log('Report updated with query strategy data');
