/**
 * Phase 1 exhaustive naming inventory (machine-readable).
 * Run from repo root: node scripts/export-phase1-name-audit.mjs
 * Writes docs/phase1/name-readiness-audit-full.csv
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outPath = path.join(root, 'docs', 'phase1', 'name-readiness-audit-full.csv');

const INCLUDE_EXT = new Set(['.ts', '.tsx', '.js', '.json', '.xml']);
const SKIP_DIR = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.expo',
  '.gradle',
  'Pods',
]);

const PATTERNS = [
  { name: 'TrueScan', re: /TrueScan/ },
  { name: 'TruScan', re: /TruScan/ },
  { name: 'TruScore', re: /TruScore/ },
  { name: 'TrueScore', re: /TrueScore/ },
  { name: 'Trust Score', re: /Trust Score/ },
  { name: 'TrueScan-FoodScanner', re: /TrueScan-FoodScanner/ },
  { name: 'TrueScan-Mobile', re: /TrueScan-Mobile/ },
];

function* walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIR.has(e.name)) continue;
      yield* walk(full);
    } else {
      const ext = path.extname(e.name);
      if (!INCLUDE_EXT.has(ext)) continue;
      yield full;
    }
  }
}

function classify(relPathUnified, line) {
  const rel = relPathUnified.replace(/\\/g, '/');
  const t = line.trim();
  if (rel.includes('/__tests__/') || rel.includes('.test.')) return 'test_or_spec';
  if (rel.endsWith('.md')) return 'markdown_doc';
  if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return 'comment';
  if (/logger\.(info|warn|error|debug)/.test(line)) return 'server_or_app_log';
  if (rel.startsWith('backend/vercel')) return 'backend_vercel';
  if (rel.startsWith('src/i18n')) return 'locale_json';
  if (rel === 'android/app/src/main/res/values/strings.xml') return 'android_native';
  if (rel === 'app.config.js') return 'expo_config';
  if (rel === 'eas.json') return 'eas_config';
  return 'review_default';
}

function csvEscape(s) {
  const x = String(s).replace(/"/g, '""');
  return `"${x}"`;
}

const roots = [
  path.join(root, 'app'),
  path.join(root, 'src'),
  path.join(root, 'backend', 'vercel'),
  path.join(root, 'android', 'app', 'src', 'main', 'res', 'values'),
];
const singleFiles = [path.join(root, 'app.config.js'), path.join(root, 'eas.json')];

const rows = [
  'file_path,line_number,matched_term,line_classification,raw_line_excerpt',
];

const allFiles = new Set();
for (const start of roots) {
  if (!fs.existsSync(start)) continue;
  const stat = fs.statSync(start);
  const files = stat.isDirectory() ? [...walk(start)] : [start];
  for (const f of files) allFiles.add(f);
}
for (const f of singleFiles) {
  if (fs.existsSync(f)) allFiles.add(f);
}

for (const file of allFiles) {
    const rel = path.relative(root, file).split(path.sep).join('/');
    if (rel.includes('node_modules')) continue;
    const text = fs.readFileSync(file, 'utf8');
    const lines = text.split(/\r?\n/);
    lines.forEach((line, idx) => {
      for (const { name, re } of PATTERNS) {
        if (!re.test(line)) continue;
        const excerpt = line.trim().slice(0, 240);
        rows.push(
          [
            csvEscape(rel),
            idx + 1,
            csvEscape(name),
            csvEscape(classify(rel, line)),
            csvEscape(excerpt),
          ].join(',')
        );
      }
    });
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, rows.join('\n'), 'utf8');
console.log('Wrote', rows.length - 1, 'matches to', path.relative(root, outPath));
