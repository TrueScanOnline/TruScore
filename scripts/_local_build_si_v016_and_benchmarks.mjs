/**
 * One-shot builder: wave1-v0.16 + chaining-extensions/v0.3 + KTC 2026-v2 score asset.
 * Run from worktree root: node scripts/_local_build_si_v016_and_benchmarks.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

function readCsv(file) {
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.length > 0);
  const headers = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map((l) => {
    const cells = parseCsvLine(l);
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = cells[i] ?? '';
    });
    return obj;
  });
  return { headers, rows, text };
}

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') inQ = false;
      else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') {
      out.push(cur);
      cur = '';
    } else cur += c;
  }
  out.push(cur);
  return out;
}

function csvEscape(v) {
  const s = String(v ?? '');
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function writeCsv(file, headers, rows) {
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(headers.map((h) => csvEscape(r[h] ?? '')).join(','));
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, lines.join('\n') + '\n', 'utf8');
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dest, ent.name);
    if (ent.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

const TODAY = '2026-09-18';
const SRC_ID = 'SRC_SI_V016_SHELF_REFRESH';
const SRC_NAME = 'Rveel AU/NZ Chaining shelf refresh v0.16';
const SRC_REF = 'founder-authorised shelf candidates 20260918';

// --- 1) Copy packs ---
const v15 = path.join(ROOT, 'workstreamA/a-data/wave1-v0.15');
const v16 = path.join(ROOT, 'workstreamA/a-data/wave1-v0.16');
const ext02 = path.join(ROOT, 'workstreamA/a-data/chaining-extensions/v0.2');
const ext03 = path.join(ROOT, 'workstreamA/a-data/chaining-extensions/v0.3');

if (fs.existsSync(v16)) fs.rmSync(v16, { recursive: true, force: true });
if (fs.existsSync(ext03)) fs.rmSync(ext03, { recursive: true, force: true });
copyDir(v15, v16);
copyDir(ext02, ext03);

const parentsFile = path.join(v16, 'input/canonical_parents.csv');
const brandsFile = path.join(v16, 'input/canonical_brands.csv');
const aliasesFile = path.join(v16, 'input/brand_aliases.csv');
const parentsExtFile = path.join(ext03, 'canonical_parents_extension.csv');
const brandsExtFile = path.join(ext03, 'canonical_brands_extension.csv');
const aliasesExtFile = path.join(ext03, 'brand_aliases_extension.csv');
const entityChildFile = path.join(ext03, 'entity_child_of_entity.csv');

const parents = readCsv(parentsFile);
const brands = readCsv(brandsFile);
const aliases = readCsv(aliasesFile);
const parentsExt = readCsv(parentsExtFile);
const brandsExt = readCsv(brandsExtFile);
const aliasesExt = readCsv(aliasesExtFile);
const entityChild = readCsv(entityChildFile);

function maxId(rows, col, prefix) {
  let m = 0;
  for (const r of rows) {
    const v = String(r[col] || '');
    if (!v.startsWith(prefix)) continue;
    const n = parseInt(v.slice(prefix.length), 10);
    if (n > m) m = n;
  }
  return m;
}

let nextP = Math.max(
  maxId(parents.rows, 'parent_id', 'P'),
  maxId(parentsExt.rows, 'parent_id', 'P')
);
let nextB = Math.max(
  maxId(brands.rows, 'brand_id', 'B'),
  maxId(brandsExt.rows, 'brand_id', 'B')
);
let nextA = Math.max(
  maxId(aliases.rows, 'alias_id', 'A'),
  maxId(
    aliasesExt.rows.map((r) => ({
      alias_id: String(r.alias_id || '').replace(/^A_EXT_/, 'A').replace(/_/g, ''),
    })),
    'alias_id',
    'A'
  )
);
// Prefer sequential A0xxx for core aliases
nextA = Math.max(nextA, maxId(aliases.rows, 'alias_id', 'A'));

function allocP() {
  nextP += 1;
  return `P${String(nextP).padStart(4, '0')}`;
}
function allocB() {
  nextB += 1;
  return `B${String(nextB).padStart(4, '0')}`;
}
function allocA() {
  nextA += 1;
  return `A${String(nextA).padStart(4, '0')}`;
}

function findParentByName(name) {
  const n = name.toLowerCase();
  return (
    parents.rows.find((r) => r.canonical_parent_name.toLowerCase() === n) ||
    parentsExt.rows.find((r) => r.canonical_parent_name.toLowerCase() === n) ||
    null
  );
}

function findBrandByName(name) {
  const n = name.toLowerCase();
  return (
    brands.rows.find(
      (r) => r.canonical_brand_name.toLowerCase() === n && r.review_state === 'reviewed'
    ) ||
    brandsExt.rows.find(
      (r) => r.canonical_brand_name.toLowerCase() === n && r.review_state === 'reviewed'
    ) ||
    null
  );
}

function addParent({
  canonical,
  display,
  parent_type = 'private_company',
  role = 'brand_owner',
  cohort = 'regional_food_beverage_parent',
  au = 'Y',
  nz = 'Y',
  note,
}) {
  const existing = findParentByName(canonical);
  if (existing) return existing.parent_id;
  const id = allocP();
  parents.rows.push({
    parent_id: id,
    canonical_parent_name: canonical,
    display_parent_name: display || canonical,
    parent_type,
    parent_operating_role: role,
    parent_cohort_category: cohort,
    au_shelf_priority_y_n: au,
    nz_shelf_priority_y_n: nz,
    bbfaw_seed_asset_member_y_n: 'N',
    ktc_seed_asset_member_y_n: 'N',
    core_uat_asset_member_y_n: 'N',
    review_state: 'reviewed',
    primary_source_type: 'official_brand_page',
    primary_source_id: SRC_ID,
    primary_source_name: SRC_NAME,
    primary_source_url_or_reference: SRC_REF,
    source_harvest_date: TODAY,
    substantiation_note: note || `Authorised SI v0.16 shelf addition: ${canonical}`,
    notes_internal: 'wave1-v0.16 shelf refresh 20260918',
  });
  return id;
}

function addBrand({ name, display, parentId, parentDisplay, brand_type = 'local_brand', note }) {
  const existing = findBrandByName(name);
  if (existing) return existing.brand_id;
  const id = allocB();
  brands.rows.push({
    brand_id: id,
    canonical_brand_name: name,
    display_brand_name: display || name,
    parent_id: parentId,
    parent_display_name: parentDisplay,
    brand_type,
    review_state: 'reviewed',
    primary_source_type: 'official_brand_page',
    primary_source_id: SRC_ID,
    primary_source_name: SRC_NAME,
    primary_source_url_or_reference: SRC_REF,
    source_harvest_date: TODAY,
    substantiation_note: note || `Authorised SI v0.16 shelf brand: ${name}`,
    notes_internal: 'wave1-v0.16 shelf refresh 20260918',
  });
  return id;
}

function addAlias({ text, brandId, brandName, parentId, parentDisplay, type = 'spelling_variation' }) {
  const norm = text.toLowerCase().replace(/['’]/g, '');
  const exists = aliases.rows.some(
    (r) => r.alias_normalized === norm && r.brand_id === brandId
  );
  if (exists) return;
  aliases.rows.push({
    alias_id: allocA(),
    alias_text: text,
    alias_normalized: norm,
    alias_type: type,
    alias_source_type: 'manual_stewardship',
    brand_id: brandId,
    canonical_brand_name: brandName,
    parent_id: parentId,
    parent_display_name: parentDisplay,
    review_state: 'reviewed',
    source_id: SRC_ID,
    source_reference: SRC_REF,
    notes_internal: 'wave1-v0.16 shelf refresh 20260918',
  });
}

const created = { parents: [], brands: [], aliases: [], entity_edges: [], held: [] };

// --- Authorised additions ---
{
  const pVitaco = addParent({
    canonical: 'Vitaco Holdings Limited',
    display: 'Vitaco Holdings Limited',
    nz: 'Y',
    au: 'Y',
    note: 'Authorised SI v0.16: Musashi current accountable group Vitaco Holdings Limited.',
  });
  created.parents.push({ id: pVitaco, name: 'Vitaco Holdings Limited' });
  const bMusashi = addBrand({
    name: 'Musashi',
    parentId: pVitaco,
    parentDisplay: 'Vitaco Holdings Limited',
    note: 'Authorised SI v0.16 shelf: Musashi → Vitaco Holdings Limited.',
  });
  created.brands.push({ id: bMusashi, name: 'Musashi', parent: pVitaco });
}

{
  const pRice = addParent({
    canonical: 'Ricegrowers Limited',
    display: 'SunRice Group',
    au: 'Y',
    nz: 'Y',
    note: 'Authorised SI v0.16: SunRice parent Ricegrowers Limited; display SunRice Group.',
  });
  created.parents.push({ id: pRice, name: 'Ricegrowers Limited' });
  const bSun = addBrand({
    name: 'SunRice',
    parentId: pRice,
    parentDisplay: 'SunRice Group',
    note: 'Authorised SI v0.16 shelf: SunRice → Ricegrowers Limited / SunRice Group.',
  });
  created.brands.push({ id: bSun, name: 'SunRice', parent: pRice });
}

{
  const pWW = addParent({
    canonical: 'Walter & Wild Limited',
    display: 'Walter & Wild Limited',
    nz: 'Y',
    au: 'N',
    note: 'Authorised SI v0.16: Hubbards parent only; do not broaden Walter & Wild portfolio.',
  });
  created.parents.push({ id: pWW, name: 'Walter & Wild Limited' });
  const bHub = addBrand({
    name: 'Hubbards',
    parentId: pWW,
    parentDisplay: 'Walter & Wild Limited',
  });
  created.brands.push({ id: bHub, name: 'Hubbards', parent: pWW });
}

{
  const pOF = addParent({
    canonical: 'Original Foods N.Z. Limited',
    display: 'Original Foods N.Z. Limited',
    nz: 'Y',
    au: 'N',
    note: 'Authorised SI v0.16: Original Foods Baking Co operating company; no upstream investment hierarchy.',
  });
  created.parents.push({ id: pOF, name: 'Original Foods N.Z. Limited' });
  const bOF = addBrand({
    name: 'Original Foods Baking Co',
    parentId: pOF,
    parentDisplay: 'Original Foods N.Z. Limited',
  });
  created.brands.push({ id: bOF, name: 'Original Foods Baking Co', parent: pOF });
}

{
  const pBF = addParent({
    canonical: 'Blue Frog Breakfast Limited',
    display: 'Blue Frog Breakfast Limited',
    nz: 'Y',
    au: 'N',
  });
  created.parents.push({ id: pBF, name: 'Blue Frog Breakfast Limited' });
  const bBF = addBrand({
    name: 'Blue Frog',
    parentId: pBF,
    parentDisplay: 'Blue Frog Breakfast Limited',
  });
  created.brands.push({ id: bBF, name: 'Blue Frog', parent: pBF });
}

{
  const pGW = addParent({
    canonical: 'George Wilson Group Limited',
    display: 'George Wilson Group Limited',
    nz: 'Y',
    au: 'N',
    note: 'Authorised SI v0.16: parent of Back Country Foods Limited (entity_child edge).',
  });
  created.parents.push({ id: pGW, name: 'George Wilson Group Limited' });
  const pBCF = addParent({
    canonical: 'Back Country Foods Limited',
    display: 'Back Country Foods Limited',
    nz: 'Y',
    au: 'N',
  });
  created.parents.push({ id: pBCF, name: 'Back Country Foods Limited' });
  const bBC = addBrand({
    name: 'Back Country Cuisine',
    parentId: pBCF,
    parentDisplay: 'Back Country Foods Limited',
  });
  created.brands.push({ id: bBC, name: 'Back Country Cuisine', parent: pBCF });
  entityChild.rows.push({
    entity_id: pBCF,
    parent_entity_id: pGW,
    review_state: 'reviewed',
    confidence_state: 'strong',
    lineage_reference: 'si-v016-shelf-refresh-20260918',
    notes: 'Authorised: Back Country Foods Limited → George Wilson Group Limited.',
  });
  created.entity_edges.push({ child: pBCF, parent: pGW });
}

{
  const pRF = addParent({
    canonical: 'Real Foods Pty Ltd',
    display: 'Real Foods Pty Ltd',
    au: 'Y',
    nz: 'Y',
    note: 'Authorised SI v0.16: CORN THINS parent. Real Foods not auto-created as consumer brand.',
  });
  created.parents.push({ id: pRF, name: 'Real Foods Pty Ltd' });
  const bCT = addBrand({
    name: 'CORN THINS',
    parentId: pRF,
    parentDisplay: 'Real Foods Pty Ltd',
  });
  created.brands.push({ id: bCT, name: 'CORN THINS', parent: pRF });
  addAlias({
    text: 'Corn Thins',
    brandId: bCT,
    brandName: 'CORN THINS',
    parentId: pRF,
    parentDisplay: 'Real Foods Pty Ltd',
    type: 'capitalisation_variation',
  });
  created.aliases.push('Corn Thins → CORN THINS');
}

{
  const pBB = addParent({
    canonical: 'Baker Boys Limited',
    display: 'Baker Boys Limited',
    nz: 'Y',
    au: 'N',
  });
  created.parents.push({ id: pBB, name: 'Baker Boys Limited' });
  const bBB = addBrand({
    name: 'Baker Boys',
    parentId: pBB,
    parentDisplay: 'Baker Boys Limited',
  });
  created.brands.push({ id: bBB, name: 'Baker Boys', parent: pBB });
}

{
  const pCar = addParent({
    canonical: "Carman's Fine Foods Pty Ltd",
    display: "Carman's Fine Foods Pty Ltd",
    au: 'Y',
    nz: 'Y',
  });
  created.parents.push({ id: pCar, name: "Carman's Fine Foods Pty Ltd" });
  const bCar = addBrand({
    name: "Carman's",
    parentId: pCar,
    parentDisplay: "Carman's Fine Foods Pty Ltd",
  });
  created.brands.push({ id: bCar, name: "Carman's", parent: pCar });
  addAlias({
    text: 'Carmans',
    brandId: bCar,
    brandName: "Carman's",
    parentId: pCar,
    parentDisplay: "Carman's Fine Foods Pty Ltd",
    type: 'spelling_variation',
  });
  created.aliases.push("Carmans → Carman's");
}

{
  const pMom = addParent({
    canonical: 'Mommas Foods Group Limited',
    display: 'Mommas Foods Group Limited',
    nz: 'Y',
    au: 'N',
  });
  created.parents.push({ id: pMom, name: 'Mommas Foods Group Limited' });
  const bLT = addBrand({
    name: 'Leaning Tower',
    parentId: pMom,
    parentDisplay: 'Mommas Foods Group Limited',
  });
  created.brands.push({ id: bLT, name: 'Leaning Tower', parent: pMom });
}

{
  const pChen = addParent({
    canonical: 'Chen Foods',
    display: 'Chen Foods',
    au: 'Y',
    nz: 'Y',
    note: 'Authorised SI v0.16: Mr Chen\'s current parent/accountable entity Chen Foods only; no brand-family broaden.',
  });
  created.parents.push({ id: pChen, name: 'Chen Foods' });
  const bMr = addBrand({
    name: "Mr Chen's",
    parentId: pChen,
    parentDisplay: 'Chen Foods',
  });
  created.brands.push({ id: bMr, name: "Mr Chen's", parent: pChen });
  addAlias({
    text: 'Mr Chens',
    brandId: bMr,
    brandName: "Mr Chen's",
    parentId: pChen,
    parentDisplay: 'Chen Foods',
    type: 'spelling_variation',
  });
  created.aliases.push("Mr Chens → Mr Chen's");
}

// Confirm existing Signal-led brands (no duplicates)
const confirm = ['Pams', "Vogel's", 'Chickadees'];
for (const name of confirm) {
  const b = findBrandByName(name);
  if (!b) created.held.push({ row: name, why: 'Expected existing reviewed brand not found' });
}

writeCsv(parentsFile, parents.headers, parents.rows);
writeCsv(brandsFile, brands.headers, brands.rows);
writeCsv(aliasesFile, aliases.headers, aliases.rows);
writeCsv(entityChildFile, entityChild.headers, entityChild.rows);

// Update ext README
fs.writeFileSync(
  path.join(ext03, 'README.md'),
  `# Chaining extension v0.3 — current SoT with wave1-v0.16

Copied from historical \`v0.2\` then extended with authorised SI v0.16 shelf entity_child edge (Back Country Foods → George Wilson Group).

Historical \`wave1-v0.15\` / \`chaining-extensions/v0.2\` are unmutated. Runtime consumes \`review_state=reviewed\` only.
`,
  'utf8'
);

// Control surface note in wave1-v0.16
fs.writeFileSync(
  path.join(v16, 'README.md'),
  `# Wave 1 A-Data pack v0.16

Successor to \`wave1-v0.15\` (unmutated). Adds founder-authorised AU/NZ shelf consumer brands/parents for September 2026 SI refresh. Same schema. Runtime + DSA embed consume this pack with \`chaining-extensions/v0.3\`.
`,
  'utf8'
);

// --- 2) KTC 2026-v2 official 45 ---
const ktcXlsx = path.join(
  ROOT,
  'Database files/ETHICS Pillar/KTC folder/KTC_2026_FB_benchmark_data.xlsx'
);
// xlsx readFile fails on Windows paths with spaces — read buffer first
const wb = XLSX.read(fs.readFileSync(ktcXlsx), { type: 'buffer' });
const sheet = wb.Sheets['1) Scoring'];
const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
const ktcParents = [];
for (let i = 3; i < raw.length; i++) {
  const r = raw[i];
  if (!r || !r[0] || !r[1]) continue;
  const id = Number(r[0]);
  if (!Number.isFinite(id)) continue;
  ktcParents.push({
    company_id: id,
    benchmark_year_parent_company: String(r[1]).trim(),
    country: r[3] || '',
    region: r[4] || '',
    subindustry: r[5] || '',
    total_benchmark_score: Number(r[52]),
    rank_2025: Number(r[53]),
  });
}
if (ktcParents.length !== 45) {
  throw new Error(`Expected 45 KTC companies, got ${ktcParents.length}`);
}

const ktcDir = path.join(ROOT, 'Database files/ETHICS Pillar/KTC folder');
const ethicsDir = path.join(ROOT, 'src/data/ethics');
// Preserve v1 historically as dated copy if not already
const v1Archive = path.join(ktcDir, 'ktcParents.ktc-2026-v1.json');
if (!fs.existsSync(v1Archive)) {
  fs.copyFileSync(path.join(ktcDir, 'ktcParents.json'), v1Archive);
  fs.copyFileSync(
    path.join(ethicsDir, 'ktcParents.json'),
    path.join(ethicsDir, 'ktcParents.ktc-2026-v1.json')
  );
}
fs.writeFileSync(path.join(ktcDir, 'ktcParents.json'), JSON.stringify(ktcParents, null, 2) + '\n');
fs.writeFileSync(
  path.join(ktcDir, 'ktcParents.ktc-2026-v2.json'),
  JSON.stringify(ktcParents, null, 2) + '\n'
);
fs.writeFileSync(path.join(ethicsDir, 'ktcParents.json'), JSON.stringify(ktcParents, null, 2) + '\n');
fs.writeFileSync(
  path.join(ethicsDir, 'ktcParents.ktc-2026-v2.json'),
  JSON.stringify(ktcParents, null, 2) + '\n'
);

// BBFAW 2025 canonical sync into ethics
const bbfaw2025 = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'Database files/ETHICS Pillar/BBFAW folder/bbfaw-2025-data.json'), 'utf8')
);
fs.writeFileSync(
  path.join(ethicsDir, 'bbfaw2025Canonical.json'),
  JSON.stringify(bbfaw2025, null, 2) + '\n'
);
// Keep 2024 twin historically (already present as bbfaw2024Canonical.json)

fs.writeFileSync(
  path.join(ROOT, 'reports/si_v016_ktc_bbfaw_refresh_created.json'),
  JSON.stringify(
    {
      created,
      ktc_count: ktcParents.length,
      bbfaw_2025_count: bbfaw2025.companies.length,
      next_ids: { parent: nextP, brand: nextB, alias: nextA },
    },
    null,
    2
  )
);

console.log(JSON.stringify({ ok: true, parents: created.parents.length, brands: created.brands.length, ktc: ktcParents.length, bbfaw: bbfaw2025.companies.length }, null, 2));
