/**
 * Targeted Shared Identity resolution proofs for wave1-v0.16 + chaining-extensions/v0.3.
 * Run: node scripts/_local_validate_si_v016_resolution.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const A = path.join(ROOT, 'workstreamA/a-data/wave1-v0.16/input');
const EXT = path.join(ROOT, 'workstreamA/a-data/chaining-extensions/v0.3');

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.length);
  if (!lines.length) return [];
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cols = splitCsvLine(line);
    const row = {};
    headers.forEach((h, i) => (row[h] = cols[i] ?? ''));
    return row;
  });
}
function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQ = !inQ;
    } else if (c === ',' && !inQ) {
      out.push(cur);
      cur = '';
    } else cur += c;
  }
  out.push(cur);
  return out;
}

function load(p) {
  return parseCsv(fs.readFileSync(p, 'utf8'));
}

const brands = [
  ...load(path.join(A, 'canonical_brands.csv')),
  ...load(path.join(EXT, 'canonical_brands_extension.csv')),
];
const parents = [
  ...load(path.join(A, 'canonical_parents.csv')),
  ...load(path.join(EXT, 'canonical_parents_extension.csv')),
];
const aliases = [
  ...load(path.join(A, 'brand_aliases.csv')),
  ...load(path.join(EXT, 'brand_aliases_extension.csv')),
];
const entityEdges = load(path.join(EXT, 'entity_child_of_entity.csv'));

const parentById = new Map(parents.map((p) => [p.parent_id, p]));
const brandByName = new Map();
for (const b of brands) {
  const key = (b.canonical_brand_name || b.brand_name || '').toLowerCase();
  if (!key) continue;
  if (!brandByName.has(key)) brandByName.set(key, []);
  brandByName.get(key).push(b);
}
const aliasToBrand = new Map();
for (const a of aliases) {
  const key = (a.alias_normalized || a.alias_text || '').toLowerCase();
  if (key) aliasToBrand.set(key, a.brand_id);
}

function resolveBrand(name) {
  const key = name.toLowerCase();
  const direct = brandByName.get(key);
  if (direct?.length) return direct[0];
  const viaAlias = aliasToBrand.get(key);
  if (viaAlias) return brands.find((b) => b.brand_id === viaAlias) || null;
  return null;
}

const expectations = [
  { brand: 'Musashi', parentId: 'P0164', parentName: 'Vitaco Holdings Limited' },
  { brand: 'SunRice', parentId: 'P0165', parentName: 'Ricegrowers Limited' },
  { brand: 'Hubbards', parentId: 'P0166', parentName: 'Walter & Wild Limited' },
  { brand: 'Original Foods Baking Co', parentId: 'P0167', parentName: 'Original Foods N.Z. Limited' },
  { brand: 'Blue Frog', parentId: 'P0168', parentName: 'Blue Frog Breakfast Limited' },
  { brand: 'Back Country Cuisine', parentId: 'P0170', parentName: 'Back Country Foods Limited' },
  { brand: 'CORN THINS', parentId: 'P0171', parentName: 'Real Foods Pty Ltd' },
  { brand: 'Corn Thins', parentId: 'P0171', parentName: 'Real Foods Pty Ltd' },
  { brand: 'Baker Boys', parentId: 'P0172', parentName: 'Baker Boys Limited' },
  { brand: "Carman's", parentId: 'P0173', parentName: "Carman's Fine Foods Pty Ltd" },
  { brand: 'Leaning Tower', parentId: 'P0174', parentName: 'Mommas Foods Group Limited' },
  { brand: "Mr Chen's", parentId: 'P0175', parentName: 'Chen Foods' },
  { brand: 'Mr Chens', parentId: 'P0175', parentName: 'Chen Foods' },
];

const regressions = ['Pams', "Vogel's", 'Chickadees'];
const prohibited = ["Bellamy's", 'Bellamys', 'Tasti'];

const failures = [];
for (const exp of expectations) {
  const b = resolveBrand(exp.brand);
  if (!b) {
    failures.push(`MISSING brand ${exp.brand}`);
    continue;
  }
  if (b.parent_id !== exp.parentId) {
    failures.push(`${exp.brand} parent ${b.parent_id} != ${exp.parentId}`);
  }
  const p = parentById.get(b.parent_id);
  if (!p || !(p.canonical_parent_name || p.parent_name || '').includes(exp.parentName.split(' ')[0])) {
    // soft name check — exact preferred
    const pname = p?.canonical_parent_name || p?.parent_name || '';
    if (pname !== exp.parentName) failures.push(`${exp.brand} parent name '${pname}' != '${exp.parentName}'`);
  }
  const dups = brandByName.get(exp.brand.toLowerCase()) || [];
  if (dups.length > 1) failures.push(`DUPLICATE canonical rows for ${exp.brand}: ${dups.map((x) => x.brand_id)}`);
}

// Back Country entity edge
const edge = entityEdges.find((e) => e.entity_id === 'P0170' && e.parent_entity_id === 'P0169');
if (!edge) failures.push('Missing ENTITY_EDGE P0170 → P0169');

for (const name of regressions) {
  const b = resolveBrand(name);
  if (!b) failures.push(`REGRESSION missing ${name}`);
}

for (const name of prohibited) {
  const b = resolveBrand(name);
  if (b && String(b.notes_internal || '').includes('wave1-v0.16 shelf')) {
    failures.push(`PROHIBITED promoted in v0.16: ${name}`);
  }
}

// Real Foods must not be auto-created as consumer brand
const realFoodsBrand = brandByName.get('real foods');
if (realFoodsBrand?.length) {
  failures.push('Unexpected Real Foods consumer brand row(s): ' + realFoodsBrand.map((b) => b.brand_id));
}

const report = {
  ok: failures.length === 0,
  failures,
  brand_count: brands.length,
  parent_count: parents.length,
  alias_count: aliases.length,
  entity_edges: entityEdges.length,
};
fs.writeFileSync(
  path.join(ROOT, 'reports/si_v016_resolution_validation.json'),
  JSON.stringify(report, null, 2)
);
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exit(1);
