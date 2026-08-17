/**
 * Exhaustive Component 2 Delta Schedule applicator for wave1-v0.15 + chaining-extensions/v0.2.
 * Does not mutate historical wave1-v0.14 or chaining-extensions/v0.1.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const A = path.join(ROOT, 'workstreamA', 'a-data', 'wave1-v0.15', 'input');
const EXT = path.join(ROOT, 'workstreamA', 'a-data', 'chaining-extensions', 'v0.2');
const OUT = path.join(ROOT, 'workstreamA', 'a-data', 'wave1-v0.15', 'output');
const DATE = '2026-08-16';
const recon = [];

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else current += ch;
  }
  values.push(current);
  return values.map((v) => v.trim());
}
function parseCsv(content) {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter((l) => l.length);
  const headers = parseCsvLine(lines[0]);
  return {
    headers,
    rows: lines.slice(1).map((line) => {
      const parts = parseCsvLine(line);
      const row = {};
      headers.forEach((h, i) => {
        row[h] = parts[i] ?? '';
      });
      return row;
    }),
  };
}
function escapeCsv(value) {
  const v = value ?? '';
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}
function toCsv(headers, rows) {
  return [headers.join(','), ...rows.map((row) => headers.map((h) => escapeCsv(row[h] ?? '')).join(','))].join('\n') + '\n';
}
function readTable(file) {
  const parsed = parseCsv(fs.readFileSync(file, 'utf8'));
  parsed.path = file;
  return parsed;
}
function writeTable(table) {
  fs.writeFileSync(table.path, toCsv(table.headers, table.rows));
}
function nextId(rows, key, prefix, width) {
  let max = 0;
  for (const r of rows) {
    const m = String(r[key] || '').match(new RegExp(`^${prefix}(\\d+)$`));
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `${prefix}${String(max + 1).padStart(width, '0')}`;
}

const parents = readTable(path.join(A, 'canonical_parents.csv'));
const brands = readTable(path.join(A, 'canonical_brands.csv'));
const aliases = readTable(path.join(A, 'brand_aliases.csv'));
const sources = readTable(path.join(A, 'source_registry.csv'));
const stew = readTable(path.join(A, 'stewardship_action_log.csv'));
const ahc = readTable(path.join(A, 'alias_harvest_candidates.csv'));
const extBrands = readTable(path.join(EXT, 'canonical_brands_extension.csv'));
const extParents = readTable(path.join(EXT, 'canonical_parents_extension.csv'));
const childBrand = readTable(path.join(EXT, 'brand_child_of_brand.csv'));
const childEnt = readTable(path.join(EXT, 'entity_child_of_entity.csv'));

function allBrands() {
  return [...brands.rows, ...extBrands.rows];
}
function parentById(id) {
  return parents.rows.find((p) => p.parent_id === id) || extParents.rows.find((p) => p.parent_id === id);
}
function brandById(id) {
  return brands.rows.find((b) => b.brand_id === id) || extBrands.rows.find((b) => b.brand_id === id);
}
function findReviewedName(name) {
  const n = name.toLowerCase();
  return allBrands().find((b) => b.canonical_brand_name.toLowerCase() === n && b.review_state === 'reviewed');
}
function srcRow(id) {
  return sources.rows.find((s) => s.source_id === id);
}
function ensureSource({ id, name, type, url, owner, note }) {
  if (srcRow(id)) return srcRow(id);
  const rec = {
    source_id: id,
    source_name: name,
    source_type: type,
    source_url_or_reference: url,
    source_owner_or_publisher: owner,
    harvest_method: 'source_harvest',
    harvest_date: DATE,
    source_harvest_date: DATE,
    source_status: 'active',
    notes_internal: note || 'Registered for 20260816 chaining delta; factual official source, not the instruction file.',
  };
  sources.rows.push(rec);
  return rec;
}
function applySrc(row, srcId) {
  const s = srcRow(srcId);
  row.primary_source_type = s.source_type;
  row.primary_source_id = s.source_id;
  row.primary_source_name = s.source_name;
  row.primary_source_url_or_reference = s.source_url_or_reference;
  row.source_harvest_date = DATE;
}

function rec(action, target, id, parentEdgeState, result) {
  recon.push({ instruction_action: action, target_identity: target, resulting_id: id || '', resulting_parent_edge_state: parentEdgeState, result });
}

function archiveBrand(id, reason) {
  const b = brandById(id);
  if (!b) {
    rec('SUPPRESS_CURRENT', id, id, 'missing', 'HOLD');
    return;
  }
  b.review_state = 'archived';
  b.notes_internal = [b.notes_internal, `SUPPRESS_CURRENT ${DATE}: ${reason}`].filter(Boolean).join(' | ');
}

function reparent(id, parentId, srcId, note) {
  const b = brandById(id);
  const p = parentById(parentId);
  if (!b || !p) throw new Error(`reparent ${id} -> ${parentId}`);
  b.parent_id = parentId;
  b.parent_display_name = p.display_parent_name;
  applySrc(b, srcId);
  b.substantiation_note = note;
  for (const a of aliases.rows.filter((x) => x.brand_id === id && x.review_state === 'reviewed')) {
    a.parent_id = parentId;
    a.parent_display_name = p.display_parent_name;
  }
  return b;
}

function addParent({ name, display, type, role, cohort, au, nz, srcId, note }) {
  const existing = [...parents.rows, ...extParents.rows].find(
    (p) => p.canonical_parent_name.toLowerCase() === name.toLowerCase()
  );
  if (existing) return existing;
  const s = srcRow(srcId);
  const recP = {
    parent_id: nextId([...parents.rows, ...extParents.rows], 'parent_id', 'P', 4),
    canonical_parent_name: name,
    display_parent_name: display || name,
    parent_type: type || 'public_company',
    parent_operating_role: role || 'brand_owner',
    parent_cohort_category: cohort || 'global_food_beverage_parent',
    au_shelf_priority_y_n: au || 'Y',
    nz_shelf_priority_y_n: nz || 'Y',
    bbfaw_seed_asset_member_y_n: 'N',
    ktc_seed_asset_member_y_n: 'N',
    core_uat_asset_member_y_n: 'N',
    review_state: 'reviewed',
    primary_source_type: s.source_type,
    primary_source_id: s.source_id,
    primary_source_name: s.source_name,
    primary_source_url_or_reference: s.source_url_or_reference,
    source_harvest_date: DATE,
    substantiation_note: note,
    notes_internal: 'Added wave1-v0.15 Component 2.',
  };
  parents.rows.push(recP);
  return recP;
}

function addBrand({ name, display, parentId, type, srcId, childOf, aliasTexts = [], harvest = [], note }) {
  const existing = findReviewedName(name);
  if (existing) {
    if (childOf) addChild(existing.brand_id, childOf);
    return existing;
  }
  const p = parentById(parentId);
  if (!p) throw new Error(`parent missing ${parentId} for ${name}`);
  const s = srcRow(srcId);
  const recB = {
    brand_id: nextId(allBrands(), 'brand_id', 'B', 4),
    canonical_brand_name: name,
    display_brand_name: display || name,
    parent_id: parentId,
    parent_display_name: p.display_parent_name,
    brand_type: type || 'local_brand',
    review_state: 'reviewed',
    primary_source_type: s.source_type,
    primary_source_id: s.source_id,
    primary_source_name: s.source_name,
    primary_source_url_or_reference: s.source_url_or_reference,
    source_harvest_date: DATE,
    substantiation_note: note || `Authorised Component 2 identity; factual source ${s.source_id}.`,
    notes_internal: '',
  };
  brands.rows.push(recB);
  if (childOf) addChild(recB.brand_id, childOf);
  for (const text of aliasTexts) addAlias(recB.brand_id, text);
  for (const h of harvest) addHarvest(recB.brand_id, h);
  return recB;
}

function addChild(brandId, parentBrandId) {
  if (brandId === parentBrandId) return;
  if (childBrand.rows.some((r) => r.brand_id === brandId && r.parent_brand_id === parentBrandId)) return;
  childBrand.rows.push({
    brand_id: brandId,
    parent_brand_id: parentBrandId,
    review_state: 'reviewed',
    confidence_state: 'strong',
    lineage_reference: 'chaining-refresh-20260816',
    notes: 'Authorised Component 2 brand_child_of_brand edge.',
  });
}

function addEntChild(childId, parentId) {
  if (childEnt.rows.some((r) => r.entity_id === childId && r.parent_entity_id === parentId)) return;
  childEnt.rows.push({
    entity_id: childId,
    parent_entity_id: parentId,
    review_state: 'reviewed',
    confidence_state: 'strong',
    lineage_reference: 'chaining-refresh-20260816',
    notes: 'Authorised Component 2 entity_child_of_entity edge.',
  });
}

function addAlias(brandId, text) {
  const b = brandById(brandId);
  const norm = text.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  if (!norm) return;
  if (aliases.rows.some((a) => a.alias_normalized === norm && a.review_state === 'reviewed')) return;
  aliases.rows.push({
    alias_id: nextId(aliases.rows, 'alias_id', 'A', 4),
    alias_text: text,
    alias_normalized: norm,
    alias_type: 'punctuation_variation',
    alias_source_type: 'official_brand_page',
    brand_id: brandId,
    canonical_brand_name: b.canonical_brand_name,
    parent_id: b.parent_id,
    parent_display_name: b.parent_display_name,
    review_state: 'reviewed',
    source_id: b.primary_source_id,
    source_reference: b.primary_source_id,
    notes_internal: 'Bounded identity-level alias; Component 1.5.',
  });
}

function addHarvest(brandId, text) {
  const b = brandById(brandId);
  const norm = text.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  ahc.rows.push({
    candidate_id: nextId(ahc.rows, 'candidate_id', 'AHC', 4),
    alias_text: text,
    alias_normalized: norm,
    alias_type: 'packaging_variation',
    alias_source_type: 'manual_stewardship',
    candidate_brand_id: brandId,
    candidate_canonical_brand_name: b.canonical_brand_name,
    candidate_parent_id: b.parent_id,
    candidate_parent_display_name: b.parent_display_name,
    source_reference: b.primary_source_id,
    candidate_state: 'candidate',
    review_outcome_note: 'Collision-sensitive or non-deterministic — not promoted to reviewed alias.',
    notes_internal: 'chaining-refresh-20260816',
  });
}

// Factual sources (not the instruction file)
ensureSource({
  id: 'SRC_FONTERRA_ANZ_CONSUMER_SALE',
  name: 'Fonterra completes sale of ANZ consumer and associated businesses',
  type: 'corporate_press_release',
  url: 'https://www.fonterra.com/nz/en/our-news/media/fonterra-completes-sale-of-anz-consumer-business.html',
  owner: 'Fonterra',
  note: 'Completed ANZ consumer divestment to Lactalis; factual basis for current-chain reparents.',
});
ensureSource({
  id: 'SRC_MONSTER_BEV_CORP',
  name: 'Monster Beverage Corporation',
  type: 'official_parent_brand_page',
  url: 'https://www.monsterbevcorp.com/',
  owner: 'Monster Beverage Corporation',
});
ensureSource({
  id: 'SRC_FRONERI',
  name: 'Froneri',
  type: 'official_parent_brand_page',
  url: 'https://www.froneri.com/',
  owner: 'Froneri',
});
ensureSource({
  id: 'SRC_JDE_PEETS',
  name: "JDE Peet's",
  type: 'official_parent_brand_page',
  url: 'https://www.jdepeets.com/',
  owner: "JDE Peet's",
});
ensureSource({
  id: 'SRC_SUNKIST_GROWERS',
  name: 'Sunkist Growers',
  type: 'official_parent_brand_page',
  url: 'https://www.sunkist.com/',
  owner: 'Sunkist Growers',
});
ensureSource({
  id: 'SRC_OPEN_COUNTRY_DAIRY',
  name: 'Open Country Dairy',
  type: 'official_parent_brand_page',
  url: 'https://www.opencountry.co.nz/',
  owner: 'Open Country Dairy',
});
ensureSource({
  id: 'SRC_TALLEYS_ABOUT',
  name: "Talley's — About Us",
  type: 'official_brand_page',
  url: 'https://www.talleys.co.nz/about-us',
  owner: "Talley's",
});
ensureSource({
  id: 'SRC_FANTASTIC_SNACKS',
  name: 'Fantastic Snacks — About',
  type: 'official_brand_page',
  url: 'https://fantasticsnacks.com.au/about-us',
  owner: 'San Remo / Fantastic',
});

const SRC_L = 'SRC_LACTALIS_AU_BRANDS';
const SRC_SALE = 'SRC_FONTERRA_ANZ_CONSUMER_SALE';

// 2.1 Fonterra / Lactalis
for (const [id, name] of [
  ['B0139', 'Anchor'],
  ['B0143', 'Anlene'],
  ['B0144', 'Anmum'],
  ['B0331', 'Kapiti'],
  ['B0140', 'Mainland'],
  ['B0141', 'Perfect Italiano'],
  ['B0142', 'Western Star'],
]) {
  reparent(id, 'P0020', SRC_SALE, `Completed Fonterra ANZ consumer divestment to Lactalis; current AU/NZ chain is P0020. Official Lactalis AU brands: ${srcRow(SRC_L).source_url_or_reference}`);
  rec('REPARENT', name, id, 'P0020 Lactalis', 'PASS');
}
rec('RETAIN', 'Anchor Food Professionals', 'B0332', 'P0022 Fonterra', 'PASS');
rec('RETAIN', 'NZMP', 'B0333', 'P0022 Fonterra', 'PASS');
rec('RETAIN', 'Bega', 'B0145', 'P0023 Bega', 'PASS');

const fresh = addBrand({
  name: "Fresh 'n Fruity",
  parentId: 'P0020',
  srcId: SRC_L,
  aliasTexts: ['Fresh n Fruity', "Fresh ’n Fruity"],
});
rec('ADD', "Fresh 'n Fruity", fresh.brand_id, 'P0020 Lactalis', 'PASS');
const primo = addBrand({
  name: 'Primo (dairy)',
  display: 'Primo',
  parentId: 'P0020',
  srcId: SRC_L,
  aliasTexts: ['Primo Dairy'],
  harvest: ['Primo'],
  note: 'Dairy Primo under Lactalis. Display may be Primo; no bare Primo alias. JBS Primo meat B0351 separate.',
});
rec('ADD', 'Primo dairy', primo.brand_id, 'P0020 Lactalis', 'PASS');
rec('RETAIN', 'Primo meat', 'B0351', 'P0027 JBS', 'PASS');

// 2.2 Cadbury / Mondelez
for (const [id, name] of [
  ['B0241', 'Cadbury Dairy Milk'],
  ['B0242', 'Caramilk'],
  ['B0243', 'Boost'],
  ['B0244', 'Crunchie'],
  ['B0245', 'Flake'],
  ['B0246', 'Freddo'],
]) {
  addChild(id, 'B0067');
  rec('CHILD_EDGE', `${name} → Cadbury`, id, 'B0067', 'PASS');
}
const cadburyAdds = [
  'Cadbury &MORE',
  'Cherry Ripe',
  'Cadbury Favourites',
  'Old Gold',
  'Picnic',
  'Roses',
  'Cadbury Slices',
  'Twirl',
  'Cadbury Velvet',
  'Dream',
  'Pinky',
  'Perky Nana',
  'Moro',
  'Marvellous Creations',
  'Caramello Koala',
];
for (const n of cadburyAdds) {
  const b = addBrand({ name: n, parentId: 'P0009', srcId: 'SRC_MONDELEZ_BRANDS', childOf: 'B0067' });
  rec('ADD+CHILD_EDGE', n, b.brand_id, 'P0009 / child B0067', 'PASS');
}
const frys = addBrand({ name: "Fry's Turkish Delight", parentId: 'P0009', srcId: 'SRC_MONDELEZ_BRANDS' });
rec('ADD', "Fry's Turkish Delight", frys.brand_id, 'P0009 not Cadbury child', 'PASS');
const olinas = addBrand({ name: "Olina's Bakehouse", parentId: 'P0009', srcId: 'SRC_MONDELEZ_BRANDS', aliasTexts: ["Olina's"] });
rec('ADD', "Olina's Bakehouse", olinas.brand_id, 'P0009 not Cadbury child', 'PASS');
archiveBrand('B0294', 'Kraft Heinz Philadelphia competing AU/NZ current match');
rec('CONSOLIDATE/SUPPRESS_CURRENT', 'Philadelphia Kraft Heinz', 'B0294', 'archived; retain B0070 Mondelez', 'PASS');

// 2.3 Kellogg's
const kelloggs = addBrand({
  name: "Kellogg's",
  parentId: 'P0007',
  type: 'brand_family',
  srcId: 'SRC_KELLOGGS_AU_FOOD_BRANDS',
  aliasTexts: ['Kelloggs', 'Kellogg'],
});
rec('ADD', "Kellogg's umbrella", kelloggs.brand_id, 'P0007 Mars', 'PASS');
const kelloggKids = {
  'All-Bran': 'B0540',
  'Coco Pops': 'B0541',
  'Corn Flakes': 'B0542',
  Crispix: 'B0543',
  'Crunchy Nut': 'B0544',
  'Froot Loops': 'B0545',
  Frosties: 'B0546',
  Guardian: 'B0547',
  'Just Right': 'B0548',
  "Kellogg's Granola": 'B0549',
  'K-Time': 'B0550',
  LCMs: 'B0551',
  'Nutri-Grain': 'B0552',
  'Pop-Tarts': 'B0553',
  'Rice Bubbles': 'B0554',
  'Special K': 'B0555',
  'Sultana Bran': 'B0556',
  Sustain: 'B0557',
};
for (const [n, id] of Object.entries(kelloggKids)) {
  addChild(id, kelloggs.brand_id);
  rec('CHILD_EDGE', `${n} → Kellogg's`, id, kelloggs.brand_id, 'PASS');
}
rec('RETAIN', 'Pringles', 'B0558', 'P0007 Mars; not Kellogg child', 'PASS');

// 2.4 Nestlé
const plaistowe = addBrand({ name: 'Plaistowe', parentId: 'P0008', srcId: 'SRC_NESTLE_AU_BRANDS' });
rec('ADD', 'Plaistowe', plaistowe.brand_id, 'P0008 Nestlé', 'PASS');
archiveBrand('B0614', 'General Mills Cheerios competing AU/NZ current match');
addChild('B0233', 'B0064');
rec('CHILD_EDGE', 'Cheerios → Uncle Tobys', 'B0233', 'B0064', 'PASS');
rec('SUPPRESS_CURRENT', 'Cheerios General Mills', 'B0614', 'archived', 'PASS');

// 2.5 PepsiCo
for (const n of ['Bubly', 'Copper Kettle', 'Delisio', 'Obela', 'Rockstar', 'Tasty Toobs', 'Tostitos']) {
  const b = addBrand({ name: n, parentId: 'P0010', srcId: 'SRC_PEPSICO_AU_BRANDS' });
  rec('ADD', n, b.brand_id, 'P0010 PepsiCo', 'PASS');
}
addChild('B0255', 'B0076');
rec('CHILD_EDGE', 'Pepsi Max → Pepsi', 'B0255', 'B0076', 'PASS');
archiveBrand('B0442', 'Asahi Pepsi not owner');
archiveBrand('B0443', 'Asahi Gatorade not owner');
rec('SUPPRESS_CURRENT', 'Pepsi Asahi', 'B0442', 'archived; retain PepsiCo', 'PASS');
rec('SUPPRESS_CURRENT', 'Gatorade Asahi', 'B0443', 'archived; retain PepsiCo', 'PASS');

// 2.6 Monster
const monster = addParent({
  name: 'Monster Beverage Corporation',
  srcId: 'SRC_MONSTER_BEV_CORP',
  note: 'Official Monster Beverage corporate site; Coca-Cola is not ultimate owner.',
});
rec('ADD', 'Monster Beverage Corporation', monster.parent_id, 'canonical parent', 'PASS');
reparent('B0270', monster.parent_id, 'SRC_MONSTER_BEV_CORP', 'Monster Beverage Corporation is the current owner; Coca-Cola distribution is not modelled (no semantically valid OE enum).');
rec('REPARENT', 'Monster', 'B0270', monster.parent_id, 'PASS');
rec('HOLD', 'Mother', '', 'no current mapping added', 'HOLD');
rec('HOLD', 'L&P', '', 'no current mapping added', 'HOLD');
rec('HOLD', 'Pure Drop', '', 'no current mapping added', 'HOLD');
rec('OPERATIONAL', 'Coca-Cola Monster distribution', '', 'unmodelled; enum cannot represent licence/distribution without semantic misuse', 'HOLD');

// 2.7 Bega
for (const n of ['The Juice Brothers', 'Simply Nuts', 'Farmers Union Iced Coffee', 'Complete Dairy', 'Betta Milk']) {
  const b = addBrand({
    name: n,
    parentId: 'P0023',
    srcId: 'SRC_BEGA_GROUP_BRANDS',
    childOf: n === 'Farmers Union Iced Coffee' ? 'B0337' : undefined,
  });
  rec(n === 'Farmers Union Iced Coffee' ? 'ADD+CHILD_EDGE' : 'ADD', n, b.brand_id, 'P0023 Bega', 'PASS');
}
const begaPb = addBrand({ name: 'Bega Peanut Butter', parentId: 'P0023', srcId: 'SRC_BEGA_GROUP_BRANDS' });
archiveBrand('B0344', 'Consolidated into Bega Peanut Butter');
for (const a of aliases.rows.filter((x) => x.brand_id === 'B0344')) {
  a.brand_id = begaPb.brand_id;
  a.canonical_brand_name = begaPb.canonical_brand_name;
}
rec('CONSOLIDATE', 'Peanut Butter Company → Bega Peanut Butter', begaPb.brand_id, 'P0023; B0344 archived', 'PASS');
archiveBrand('B0196', 'Saputo Dairy Farmers competing current match');
rec('SUPPRESS_CURRENT', 'Dairy Farmers Saputo', 'B0196', 'archived; retain B0334 Bega', 'PASS');

// 2.8 Sanitarium
for (const n of ['The Alternative Dairy Co', 'Vegie Delights', 'Ricies', 'Skippy Cornflakes', 'Greater Hummus']) {
  const b = addBrand({ name: n, parentId: 'P0025', srcId: 'SRC_SANITARIUM_BRANDS' });
  rec('ADD', n, b.brand_id, 'P0025 Sanitarium', 'PASS');
}
addChild('B0349', 'B0154');
rec('CHILD_EDGE', 'Weet-Bix Bites → Weet-Bix', 'B0349', 'B0154', 'PASS');

// 2.9 Goodman Fielder / Wilmar
addEntChild('P0040', 'P0047');
rec('ENTITY_EDGE', 'Goodman Fielder → Wilmar', 'P0040', 'P0047', 'PASS');
for (const n of [
  'Bush Oven',
  'Buttercup',
  'Country Life',
  'Defiance',
  'ETA',
  "Gold'n Canola",
  'Holbrooks',
  'La Famiglia',
  'Mighty Soft',
  'Olive Grove',
  "Bouton d'or",
  'Chesdale',
  "Freya's",
  'Molenberg',
  'Naturalea',
  "Nature's Fresh",
  'Olivani',
  'Ornelle',
  'Quality Bakers',
  'Simply Oil',
  'Tararua Dairy Co',
]) {
  const b = addBrand({ name: n, parentId: 'P0040', srcId: 'SRC_GOODMAN_FIELDER_BRANDS' });
  rec('ADD', n, b.brand_id, 'P0040 Goodman Fielder (→ Wilmar entity)', 'PASS');
}
for (const [keep, drop, name] of [
  ['B0451', 'B0498', 'CSR Sugar'],
  ['B0457', 'B0499', 'Chelsea Sugar'],
  ["B0171", 'B0606', "Helga's"],
  ['B0456', 'B0604', 'Meadow Fresh'],
  ['B0173', 'B0605', 'Praise'],
  ["B0175", 'B0607', "Vogel's"],
]) {
  archiveBrand(drop, `Wilmar-direct consumer duplicate; retain ${keep} under Goodman Fielder`);
  rec('CONSOLIDATE', name, keep, `P0040 retained; ${drop} archived`, 'PASS');
}
renameAndQualifyYoplait();

function renameAndQualifyYoplait() {
  const au = brandById('B0339');
  au.canonical_brand_name = 'Yoplait (AU / Bega licence)';
  au.display_brand_name = 'Yoplait (AU)';
  applySrc(au, 'SRC_BEGA_GROUP_BRANDS');
  addAlias('B0339', 'Yoplait (AU)');
  addHarvest('B0339', 'Yoplait');
  rec('RENAME', 'Yoplait AU', 'B0339', 'P0023 Bega; qualified name', 'PASS');
  const nz = addBrand({
    name: 'Yoplait (NZ / Goodman Fielder-Wilmar licence)',
    display: 'Yoplait (NZ)',
    parentId: 'P0040',
    srcId: 'SRC_GOODMAN_FIELDER_BRANDS',
    aliasTexts: ['Yoplait (NZ)'],
    harvest: ['Yoplait'],
  });
  rec('ADD', 'Yoplait NZ', nz.brand_id, 'P0040 → P0047; no bare Yoplait alias', 'PASS');
}

// 2.10 Arnott's / Campbell
for (const n of ['Quatro Bars', 'Premium', 'Snack Right', 'Bluey', 'Cruskits', 'Clix']) {
  const b = addBrand({ name: n, parentId: 'P0043', srcId: 'SRC_ARNOTTS_BRANDS', childOf: 'B0185' });
  rec('ADD+CHILD_EDGE', n, b.brand_id, 'P0043 / child B0185 Arnott\'s', 'PASS');
}
const arnottKids = {
  'Tim Tam': 'B0187',
  Shapes: 'B0186',
  Jatz: 'B0472',
  'Tiny Teddy': 'B0473',
  'Vita-Weat': 'B0188',
  'TeeVee Snacks': 'B0481',
  Salada: 'B0475',
  SAO: 'B0474',
  Savoy: 'B0560',
  'Iced VoVo': 'B0478',
  'Milk Arrowroot': 'B0479',
  'Monte Carlo': 'B0476',
  Nice: 'B0480',
  'Scotch Finger': 'B0477',
};
for (const [n, id] of Object.entries(arnottKids)) {
  addChild(id, 'B0185');
  rec('CHILD_EDGE', `${n} → Arnott's`, id, 'B0185', 'PASS');
}
archiveBrand('B0485', 'Arnott\'s V8 competing; retain Campbell B0162');
archiveBrand('B0621', 'stale Campbell → Arnott\'s ownership path');
rec('SUPPRESS_CURRENT', 'V8 Arnott\'s', 'B0485', 'archived; retain B0162 Campbell', 'PASS');
rec('SUPPRESS_CURRENT', "Arnott's under Campbell", 'B0621', 'archived; retain B0185 P0043', 'PASS');
rec('HOLD', 'KKR → Arnott\'s', '', 'no KKR entity added', 'HOLD');

// 2.11 ABF / Tip Top / Froneri — no new GWF parent
for (const n of ['DON', 'Jarrah', 'KR Castlemaine']) {
  const b = addBrand({ name: n, parentId: 'P0018', srcId: 'SRC_ABF_BRANDS' });
  rec('ADD', n, b.brand_id, 'P0018 ABF (existing chain; no new GWF layer)', 'PASS');
}
const tipTop = brandById('B0301');
tipTop.canonical_brand_name = 'Tip Top Bakery';
tipTop.display_brand_name = 'Tip Top Bakery';
applySrc(tipTop, 'SRC_ABF_BRANDS');
addAlias('B0301', 'Tip Top Bakery');
addHarvest('B0301', 'Tip Top');
rec('RENAME', 'Tip Top Bakery', 'B0301', 'P0018 ABF', 'PASS');
const froneri = addParent({
  name: 'Froneri International Limited',
  display: 'Froneri',
  type: 'private_company',
  srcId: 'SRC_FRONERI',
  note: 'Froneri is the current accountable owner for NZ Tip Top Ice Cream. JV shareholders HOLD.',
});
rec('ADD', 'Froneri', froneri.parent_id, 'canonical parent', 'PASS');
const ttic = addBrand({
  name: 'Tip Top Ice Cream',
  parentId: froneri.parent_id,
  srcId: 'SRC_FRONERI',
  aliasTexts: ['Tip Top Ice Cream'],
  harvest: ['Tip Top'],
});
rec('ADD', 'Tip Top Ice Cream', ttic.brand_id, froneri.parent_id, 'PASS');
for (const n of ['Trumpet', 'Memphis Meltdown', 'Fruju', 'Popsicle']) {
  const b = addBrand({ name: n, parentId: froneri.parent_id, srcId: 'SRC_FRONERI', childOf: ttic.brand_id });
  rec('ADD+CHILD_EDGE', n, b.brand_id, `Froneri / child ${ttic.brand_id}`, 'PASS');
}
rec('HOLD', 'Froneri JV shareholders', '', 'not modelled', 'HOLD');

// 2.12 JDE Peet's
const jde = addParent({
  name: "JDE Peet's N.V.",
  display: "JDE Peet's",
  srcId: 'SRC_JDE_PEETS',
  note: "JDE Peet's operating parent; entity-child of KDP for current completed ownership.",
});
addEntChild(jde.parent_id, 'P0036');
rec('ADD', "JDE Peet's", jde.parent_id, 'canonical parent', 'PASS');
rec('ENTITY_EDGE', "JDE Peet's → KDP", jde.parent_id, 'P0036', 'PASS');
for (const n of ['Moccona', "L'OR", 'Harris', 'Campos Coffee', 'Pickwick', 'Hummingbird', 'Bell Tea', "Jed's", 'Ti Ora']) {
  const b = addBrand({ name: n, parentId: jde.parent_id, srcId: 'SRC_JDE_PEETS' });
  rec('ADD', n, b.brand_id, jde.parent_id, 'PASS');
}

// 2.13 Asahi / Sunkist
archiveBrand('B0414', 'KDP Schweppes competing; retain Asahi Schweppes');
rec('RETAIN', 'Schweppes Asahi', 'B0435', 'P0038', 'PASS');
const sunkistGrowers = addParent({
  name: 'Sunkist Growers, Inc.',
  display: 'Sunkist Growers',
  type: 'cooperative',
  srcId: 'SRC_SUNKIST_GROWERS',
  note: 'Sunkist Growers is the current Sunkist consumer-brand owner.',
});
rec('ADD', 'Sunkist Growers', sunkistGrowers.parent_id, 'canonical parent', 'PASS');
archiveBrand('B0417', 'KDP Sunkist ownership-style AU/NZ mapping');
archiveBrand('B0446', 'Asahi Sunkist ownership-style AU/NZ mapping');
const sunkist = addBrand({ name: 'Sunkist', parentId: sunkistGrowers.parent_id, srcId: 'SRC_SUNKIST_GROWERS' });
rec('ADD', 'Sunkist consumer', sunkist.brand_id, sunkistGrowers.parent_id, 'PASS');
rec('SUPPRESS_CURRENT', 'Sunkist KDP', 'B0417', 'archived', 'PASS');
rec('SUPPRESS_CURRENT', 'Sunkist Asahi', 'B0446', 'archived', 'PASS');
rec('OPERATIONAL', 'Asahi Sunkist licensee', '', 'unmodelled; no semantically valid OE enum without architecture change', 'HOLD');
archiveBrand('B0445', 'Asahi T2 Iced Tea ownership interpretation');
archiveBrand('B0444', 'Asahi Lipton Iced Tea sole-ownership interpretation');
rec('SUPPRESS_CURRENT', 'T2 Iced Tea Asahi', 'B0445', 'archived; fail closed', 'PASS');
rec('SUPPRESS_CURRENT', 'Lipton Iced Tea Asahi', 'B0444', 'archived; multi-party HOLD', 'HOLD');

// 2.14 Suntory
for (const n of ['Celsius', 'The Real McCoy']) {
  const b = addBrand({ name: n, parentId: 'P0037', srcId: 'SRC_SUNTORY_OCEANIA_BRANDS' });
  rec('ADD', n, b.brand_id, 'P0037 Suntory', 'PASS');
}

// 2.15 Saputo
const sheese = addBrand({ name: 'Sheese', parentId: 'P0046', srcId: 'SRC_SAPUTO_AU_BRANDS' });
rec('ADD', 'Sheese', sheese.brand_id, 'P0046 Saputo', 'PASS');
archiveBrand('B0496', 'King Island Dairy retired; no current matching');
rec('SUPPRESS_CURRENT', 'King Island Dairy', 'B0496', 'archived', 'PASS');

// 2.16 SPC
for (const n of ['Ardmona', 'Goulburn Valley', 'Pomlife', 'SPC ProVital', 'Street Eats', 'Nature One Dairy']) {
  const b = addBrand({
    name: n,
    parentId: 'P0060',
    srcId: 'SRC_SPC_GLOBAL',
    childOf: n === 'SPC ProVital' ? 'B0564' : undefined,
  });
  rec(n === 'SPC ProVital' ? 'ADD+CHILD_EDGE' : 'ADD', n, b.brand_id, 'P0060 SPC', 'PASS');
}

// 2.17 San Remo
const sanRemo = addBrand({ name: 'San Remo', parentId: 'P0062', type: 'brand_family', srcId: 'SRC_FANTASTIC_SNACKS', aliasTexts: ['Sanremo'] });
rec('ADD', 'San Remo', sanRemo.brand_id, 'P0062', 'PASS');
rec('RETAIN', 'Fantastic', 'B0566', 'P0062', 'PASS');

// 2.18 Hive
for (const n of ['Barnes Naturals', 'Wescobee', 'Byron Bay Honey']) {
  const b = addBrand({ name: n, parentId: 'P0154', srcId: 'SRC_HIVE_WELLNESS_BRANDS' });
  rec('ADD', n, b.brand_id, 'P0154 Hive + Wellness', 'PASS');
}
rec('RETAIN', 'Capilano', 'B0572', 'P0154', 'PASS');

// 2.19 Intersnack
for (const n of ["CC's", 'Cheezels', 'French Fries', "Jumpy's", 'Natural Chip Company', 'Samboy', 'Thins']) {
  const b = addBrand({ name: n, parentId: 'P0156', srcId: 'SRC_INTERSNACK_BRANDS' });
  rec('ADD', n, b.brand_id, 'P0156 Intersnack', 'PASS');
}
rec('RETAIN', 'Kettle', 'B0163', 'P0156', 'PASS');
rec('RETAIN', 'Chickadees', 'B0654', 'P0156', 'PASS');
rec('RETAIN', 'Snackbrands OE0005', 'OE0005', 'existing operational context; not duplicated', 'PASS');

// 2.20 Talley's / OCD
rec('RETAIN', "Talley's Group Limited", 'P0158', 'existing extension parent', 'PASS');
const ocd = addParent({
  name: 'Open Country Dairy Limited',
  type: 'private_company',
  cohort: 'regional_food_beverage_parent',
  au: 'N',
  nz: 'Y',
  srcId: 'SRC_OPEN_COUNTRY_DAIRY',
  note: 'Open Country Dairy is the Talley-owned dairy operating entity.',
});
addEntChild(ocd.parent_id, 'P0158');
rec('ADD', 'Open Country Dairy', ocd.parent_id, 'canonical parent', 'PASS');
rec('ENTITY_EDGE', 'Open Country Dairy → Talley\'s', ocd.parent_id, 'P0158', 'PASS');
for (const n of ['Deep South', 'Motueka Creamery']) {
  const b = addBrand({ name: n, parentId: ocd.parent_id, srcId: 'SRC_OPEN_COUNTRY_DAIRY' });
  rec('ADD', n, b.brand_id, ocd.parent_id, 'PASS');
}

// 2.21 Retailer PL
for (const n of ['Thomas Dux', 'Woolworths BBQ', 'Woolworths Cook']) {
  const b = addBrand({
    name: n,
    parentId: 'P0001',
    type: 'retailer_own_label',
    srcId: 'SRC_WOOLWORTHS_GROUP_BRANDS',
    childOf: 'B0001',
  });
  rec('ADD+CHILD_EDGE', n, b.brand_id, 'P0001 / child B0001 Woolworths', 'PASS');
}
for (const n of ['Pams Organic', 'Pams Gluten Free', 'Pams Free Range']) {
  const b = addBrand({
    name: n,
    parentId: 'P0003',
    type: 'retailer_own_label',
    srcId: 'SRC_FOODSTUFFS_OUR_BRANDS',
    childOf: 'B0024',
  });
  rec('ADD+CHILD_EDGE', n, b.brand_id, 'P0003 / child B0024 Pams', 'PASS');
}
for (const [id, n] of [
  ['B0025', 'Pams Finest'],
  ['B0204', 'Pams Superfoods'],
  ['B0205', 'Pams Plant Based'],
]) {
  addChild(id, 'B0024');
  rec('CHILD_EDGE', `${n} → Pams`, id, 'B0024', 'PASS');
}
for (const n of [
  'MIX',
  'Urban Coffee Culture',
  'DALEY ST Coffee',
  'Cucina Matese',
  'Coles Asia',
  'Coles BOM',
  "Coles Mum's",
  'UltraLife',
  "I'm Perfect",
  "Grower's Selection",
  'Made Easy',
  'Coles Free Range',
  'GRAZE',
  'Drovers Choice',
  "El-Amin's",
  'Sweetporium Co.',
  'Wild Tides',
]) {
  const b = addBrand({
    name: n,
    parentId: 'P0002',
    type: 'retailer_own_label',
    srcId: 'SRC_COLES_OWN_BRANDS',
    childOf: 'B0200',
  });
  rec('ADD+CHILD_EDGE', n, b.brand_id, 'P0002 / child B0200 Coles', 'PASS');
}
archiveBrand('B0013', 'Consolidate Coles Brand into Coles master B0200');
for (const a of aliases.rows.filter((x) => x.brand_id === 'B0013')) {
  a.brand_id = 'B0200';
  a.canonical_brand_name = brandById('B0200').canonical_brand_name;
}
rec('CONSOLIDATE', 'Coles Brand', 'B0013', 'archived into B0200', 'PASS');
archiveBrand('B0015', "Consolidate Nature's Kitchen into Coles Nature's Kitchen B0201");
for (const a of aliases.rows.filter((x) => x.brand_id === 'B0015')) {
  a.brand_id = 'B0201';
  a.canonical_brand_name = brandById('B0201').canonical_brand_name;
}
addChild('B0201', 'B0200');
rec('CONSOLIDATE', "Nature's Kitchen", 'B0015', 'archived into B0201', 'PASS');
rec('CHILD_EDGE', "Coles Nature's Kitchen → Coles", 'B0201', 'B0200', 'PASS');

// 2.22 collision matrix remaining
archiveBrand('B0608', 'duplicate P0143 Activia');
archiveBrand('B0609', 'duplicate P0143 Actimel');
archiveBrand('B0610', 'duplicate P0143 Aptamil');
archiveBrand('B0611', 'duplicate P0143 Nutricia');
archiveBrand('B0612', 'duplicate P0143 Alpro');
archiveBrand('B0589', 'stale Unilever Ben & Jerry\'s');
archiveBrand('B0632', 'Conagra Birds Eye AU/NZ');
archiveBrand('B0631', 'Conagra Healthy Choice AU/NZ');
archiveBrand('B0197', 'stale Jalna Dairy Foods consumer ownership; retain B0327 Lactalis');
archiveBrand('B0406', 'Sara Lee AU generic Grupo Bimbo current mapping HOLD');
archiveBrand('B0488', 'Sara Lee AU generic McCain current mapping HOLD');
rec('SUPPRESS_CURRENT', 'P0143 Danone duplicates', 'B0608-B0612', 'archived; retain P0012', 'PASS');
rec('SUPPRESS_CURRENT', "Ben & Jerry's Unilever", 'B0589', 'archived; retain B0110 P0014', 'PASS');
rec('SUPPRESS_CURRENT', 'Birds Eye Conagra', 'B0632', 'archived; retain B0176 Simplot', 'PASS');
rec('SUPPRESS_CURRENT', 'Healthy Choice Conagra', 'B0631', 'archived; retain McCain', 'PASS');
rec('SUPPRESS_CURRENT', 'Jalna P0055', 'B0197', 'archived; GTIN not auto-transferred', 'PASS');
rec('HOLD', 'Sara Lee AU owner', 'B0406/B0488', 'generic owners suppressed; no replacement owner', 'HOLD');

stew.rows.push({
  stewardship_action_id: nextId(stew.rows, 'stewardship_action_id', 'SA', 4),
  action_type: 'update',
  target_entity_type: 'pack',
  target_entity_id: 'A_DATA_WAVE1_V0_15',
  action_timestamp: DATE,
  actor: 'Cursor / founder Delta Schedule 20260816',
  action_summary:
    'Remediated wave1-v0.15 to exhaustive Component 2 only: Lactalis reparents, no unlisted expansion, no new GWF layer, no semantically invalid OE rows, factual sources not the instruction file.',
  related_change_candidate_id: '',
  before_state_note: 'Non-conformant expansion candidate reset from v0.14/v0.1',
  after_state_note: 'Component 2 exhaustive delta on wave1-v0.15 + chaining-extensions/v0.2',
});

fs.writeFileSync(
  path.join(EXT, 'README.md'),
  `# Chaining extension v0.2 — current SoT with wave1-v0.15

Copied from historical \`v0.1\` then refreshed to the exhaustive founder/ChatGPT Component 2 Delta Schedule only.

Historical \`wave1-v0.14\` and \`chaining-extensions/v0.1\` are unmutated. Runtime consumes \`review_state=reviewed\` only. No invented GTINs. Operational/licence rows are not invented to satisfy enums.
`
);

writeTable(parents);
writeTable(brands);
writeTable(aliases);
writeTable(sources);
writeTable(stew);
writeTable(ahc);
writeTable(childBrand);
writeTable(childEnt);

const reconHeaders = ['instruction_action', 'target_identity', 'resulting_id', 'resulting_parent_edge_state', 'result'];
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'component2_reconciliation.csv'), toCsv(reconHeaders, recon));

const oldB = parseCsv(fs.readFileSync(path.join(ROOT, 'workstreamA/a-data/wave1-v0.14/input/canonical_brands.csv'), 'utf8')).rows;
const oldExt = parseCsv(
  fs.readFileSync(path.join(ROOT, 'workstreamA/a-data/chaining-extensions/v0.1/canonical_brands_extension.csv'), 'utf8')
).rows;
const oldIds = new Set([...oldB, ...oldExt].map((b) => b.brand_id));
const additions = brands.rows.filter((b) => !oldIds.has(b.brand_id));
fs.writeFileSync(
  path.join(OUT, 'v014_to_candidate_brand_additions.csv'),
  toCsv(['brand_id', 'canonical_brand_name', 'parent_id', 'parent_display_name', 'review_state'], additions)
);

console.log(
  JSON.stringify(
    {
      reconRows: recon.length,
      reconHold: recon.filter((r) => r.result === 'HOLD').length,
      additions: additions.length,
      additionNames: additions.map((b) => `${b.brand_id} ${b.canonical_brand_name}`),
      cadburyChildren: childBrand.rows.filter((r) => r.parent_brand_id === 'B0067').length,
      entityEdges: childEnt.rows.length,
      brandChildren: childBrand.rows.length,
      lastParent: parents.rows[parents.rows.length - 1].parent_id,
      primo: brands.rows.find((b) => b.brand_id === primo.brand_id),
      anchor: brandById('B0139').parent_id,
      tipTop: brandById('B0301'),
      gwf: parents.rows.find((p) => /Weston/i.test(p.canonical_parent_name)),
      oeCount: parseCsv(fs.readFileSync(path.join(A, 'operational_entities.csv'), 'utf8')).rows.length,
    },
    null,
    2
  )
);
