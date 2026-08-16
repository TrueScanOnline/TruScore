/**
 * One-shot AU/NZ Chaining identity refresh onto wave1-v0.15 + chaining-extensions/v0.2.
 * Does not mutate historical wave1-v0.14 or chaining-extensions/v0.1.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const A = path.join(ROOT, 'workstreamA', 'a-data', 'wave1-v0.15', 'input');
const EXT = path.join(ROOT, 'workstreamA', 'a-data', 'chaining-extensions', 'v0.2');
const DATE = '2026-08-16';
const SRC = 'SRC_CHAINING_REFRESH_20260816';
const NOTE =
  'AU/NZ current-chain refresh 20260816 from founder governed Chaining instruction; runtime consumes review_state=reviewed only.';

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
const oe = readTable(path.join(A, 'operational_entities.csv'));
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

function addSource() {
  if (sources.rows.some((s) => s.source_id === SRC)) return;
  sources.rows.push({
    source_id: SRC,
    source_name: 'Founder governed AU/NZ Chaining / Shared Identity asset refresh 20260816',
    source_type: 'manual_stewardship',
    source_url_or_reference: 'CHAT_Cursor_Chaining_Asset_Refresh_Instruction_20260816',
    source_owner_or_publisher: 'Rveel founders',
    harvest_method: 'manual_stewardship',
    harvest_date: DATE,
    source_harvest_date: DATE,
    source_status: 'active',
    notes_internal: 'Instruction-governed current-chain identity refresh; no GTIN invention; Dynamic Signals CSVs not mutated.',
  });
}

function addStew(summary) {
  stew.rows.push({
    stewardship_action_id: nextId(stew.rows, 'stewardship_action_id', 'SA', 4),
    action_type: 'update',
    target_entity_type: 'pack',
    target_entity_id: 'A_DATA_WAVE1_V0_15',
    action_timestamp: DATE,
    actor: 'Cursor / founder instruction 20260816',
    action_summary: summary,
    related_change_candidate_id: '',
    before_state_note: 'wave1-v0.14 + chaining-extensions/v0.1 copied then refreshed',
    after_state_note: 'wave1-v0.15 + chaining-extensions/v0.2 current SoT',
  });
}

function archiveBrand(id, reason) {
  const b = brandById(id);
  if (!b) {
    console.warn('skip archive missing', id);
    return;
  }
  if (b.review_state === 'archived') return;
  b.review_state = 'archived';
  b.notes_internal = [b.notes_internal, `SUPPRESS_CURRENT ${DATE}: ${reason}`].filter(Boolean).join(' | ');
}

function reparent(id, parentId) {
  const b = brandById(id);
  const p = parentById(parentId);
  if (!b || !p) throw new Error(`reparent ${id} -> ${parentId}`);
  b.parent_id = parentId;
  b.parent_display_name = p.display_parent_name;
  b.primary_source_id = SRC;
  b.primary_source_name = 'Chaining refresh 20260816';
  b.primary_source_url_or_reference = 'CHAT_Cursor_Chaining_Asset_Refresh_Instruction_20260816';
  b.source_harvest_date = DATE;
  b.substantiation_note = NOTE;
}

function renameBrand(id, canonical, display) {
  const b = brandById(id);
  if (!b) throw new Error(`rename missing ${id}`);
  b.canonical_brand_name = canonical;
  b.display_brand_name = display;
  b.primary_source_id = SRC;
  b.source_harvest_date = DATE;
  b.notes_internal = [b.notes_internal, `RENAME ${DATE} to avoid unqualified alias collision`].filter(Boolean).join(' | ');
}

function addParent(row) {
  const id = nextId([...parents.rows, ...extParents.rows], 'parent_id', 'P', 4);
  const rec = {
    parent_id: id,
    canonical_parent_name: row.name,
    display_parent_name: row.display || row.name,
    parent_type: row.type || 'public_company',
    parent_operating_role: row.role || 'brand_owner',
    parent_cohort_category: row.cohort || 'global_food_beverage_parent',
    au_shelf_priority_y_n: row.au || 'Y',
    nz_shelf_priority_y_n: row.nz || 'Y',
    bbfaw_seed_asset_member_y_n: 'N',
    ktc_seed_asset_member_y_n: 'N',
    core_uat_asset_member_y_n: 'N',
    review_state: 'reviewed',
    primary_source_type: 'official_parent_brand_page',
    primary_source_id: SRC,
    primary_source_name: row.sourceName || 'Official parent / brand evidence 20260816',
    primary_source_url_or_reference: row.url || '',
    source_harvest_date: DATE,
    substantiation_note: row.note || NOTE,
    notes_internal: row.notes || 'Added in wave1-v0.15 chaining refresh.',
  };
  parents.rows.push(rec);
  return rec;
}

function addBrand({ name, display, parentId, type, childOf, skipIfExists = true, aliasTexts = [], harvest = [] }) {
  if (skipIfExists && findReviewedName(name)) {
    const existing = findReviewedName(name);
    if (childOf) addChild(existing.brand_id, childOf);
    return existing;
  }
  const p = parentById(parentId);
  if (!p) throw new Error(`parent missing ${parentId} for ${name}`);
  const id = nextId(allBrands(), 'brand_id', 'B', 4);
  const rec = {
    brand_id: id,
    canonical_brand_name: name,
    display_brand_name: display || name,
    parent_id: parentId,
    parent_display_name: p.display_parent_name,
    brand_type: type || 'local_brand',
    review_state: 'reviewed',
    primary_source_type: 'official_parent_brand_page',
    primary_source_id: SRC,
    primary_source_name: 'Chaining refresh 20260816',
    primary_source_url_or_reference: 'CHAT_Cursor_Chaining_Asset_Refresh_Instruction_20260816',
    source_harvest_date: DATE,
    substantiation_note: NOTE,
    notes_internal: '',
  };
  brands.rows.push(rec);
  if (childOf) addChild(id, childOf);
  for (const text of aliasTexts) addAlias(id, text);
  for (const h of harvest) addHarvest(id, h);
  return rec;
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
    notes: NOTE,
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
    notes: NOTE,
  });
}

function addAlias(brandId, text) {
  const b = brandById(brandId);
  const norm = text
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  if (!norm) return;
  if (aliases.rows.some((a) => a.alias_normalized === norm && a.review_state === 'reviewed')) return;
  aliases.rows.push({
    alias_id: nextId(aliases.rows, 'alias_id', 'A', 4),
    alias_text: text,
    alias_normalized: norm,
    alias_type: 'common_shorthand',
    alias_source_type: 'manual_stewardship',
    brand_id: brandId,
    canonical_brand_name: b.canonical_brand_name,
    parent_id: b.parent_id,
    parent_display_name: b.parent_display_name,
    review_state: 'reviewed',
    source_id: SRC,
    source_reference: SRC,
    notes_internal: 'Bounded alias for 20260816 identity refresh; no unqualified collision aliases.',
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
    source_reference: SRC,
    candidate_state: 'candidate',
    review_outcome_note: 'Harvest only — not promoted to reviewed alias (collision / variant policy).',
    notes_internal: 'chaining-refresh-20260816',
  });
}

function addOE(name, type, parentId, brandId, reason) {
  oe.rows.push({
    operational_entity_id: nextId(oe.rows, 'operational_entity_id', 'OE', 4),
    operational_entity_name: name,
    entity_type: type,
    use_case_reason: reason,
    review_state: 'reviewed',
    source_id: SRC,
    source_reference: SRC,
    linked_parent_id: parentId,
    linked_brand_id: brandId || '',
    notes_internal: 'Operational context only — not current ownership.',
  });
}

addSource();

const monster = addParent({
  name: 'Monster Beverage Corporation',
  type: 'public_company',
  url: 'https://www.monsterbevcorp.com/',
  sourceName: 'Monster Beverage Corporation',
  note: 'AU/NZ Monster consumer brand owner; Coca-Cola remains distribution/operational context only.',
});
const froneri = addParent({
  name: 'Froneri International Limited',
  type: 'private_company',
  url: 'https://www.froneri.com/',
  sourceName: 'Froneri',
  note: 'Current owner for Peters, Tip Top Ice Cream, New Zealand Natural. JV shareholders not modelled as dual owners.',
});
const jde = addParent({
  name: "JDE Peet's N.V.",
  type: 'public_company',
  url: 'https://www.jdepeets.com/',
  sourceName: "JDE Peet's",
});
const sunkistGrowers = addParent({
  name: 'Sunkist Growers, Inc.',
  type: 'cooperative',
  url: 'https://www.sunkist.com/',
  sourceName: 'Sunkist Growers',
  note: 'Sunkist consumer-brand owner. Asahi/KDP mappings are not current AU/NZ ownership.',
});
const ocd = addParent({
  name: 'Open Country Dairy Limited',
  type: 'private_company',
  cohort: 'regional_food_beverage_parent',
  au: 'N',
  nz: 'Y',
  url: 'https://www.opencountry.co.nz/',
  sourceName: 'Open Country Dairy',
  note: 'Talley-owned dairy business; brands Deep South and Motueka Creamery sit under this entity, not as Talley Group consumer-brand siblings without the edge.',
});
const gwf = addParent({
  name: 'George Weston Foods Limited',
  type: 'private_company',
  cohort: 'regional_food_beverage_parent',
  url: 'https://www.gwf.com.au/',
  sourceName: 'George Weston Foods',
  note: 'ABF-owned AU operating company for Tip Top Bakery / DON / Jarrah / KR Castlemaine. Not a dual owner with ABF.',
});

addEntChild(ocd.parent_id, 'P0158');
addEntChild(gwf.parent_id, 'P0018');

for (const id of [
  'B0294',
  'B0196',
  'B0197',
  'B0414',
  'B0442',
  'B0443',
  'B0417',
  'B0446',
  'B0444',
  'B0445',
  'B0621',
  'B0485',
  'B0614',
  'B0589',
  'B0631',
  'B0632',
  'B0608',
  'B0609',
  'B0610',
  'B0611',
  'B0612',
  'B0406',
  'B0488',
  'B0013',
  'B0015',
]) {
  archiveBrand(id, 'competing or stale AU/NZ current-chain mapping; retain reviewed counterpart or fail closed');
}

reparent('B0270', monster.parent_id);
addOE('Coca-Cola Amatil / Coca-Cola Europacific Partners (Monster distribution)', 'distributor', 'P0011', 'B0270', 'safety_regulatory_matching');
addOE('Asahi Beverages (Sunkist licensee / bottler)', 'licensee', 'P0038', '', 'safety_regulatory_matching');
addOE('Snackbrands Australia (Intersnack local ops)', 'manufacturer', 'P0156', 'B0163', 'recall_matching');
addOE('Bega Yoplait AU licence context', 'licensee', 'P0023', 'B0339', 'safety_regulatory_matching');
addOE('Goodman Fielder / Wilmar Yoplait NZ licence context', 'licensee', 'P0040', '', 'safety_regulatory_matching');

renameBrand('B0301', 'Tip Top Bakery', 'Tip Top Bakery');
reparent('B0301', gwf.parent_id);
addAlias('B0301', 'Tip Top Bakery');
addHarvest('B0301', 'Tip Top');

renameBrand('B0339', 'Yoplait (AU / Bega licence)', 'Yoplait (AU)');
addAlias('B0339', 'Yoplait (AU)');
addAlias('B0339', 'Yoplait (AU / Bega licence)');
addHarvest('B0339', 'Yoplait');

const yoplaitNz = addBrand({
  name: 'Yoplait (NZ / Goodman Fielder-Wilmar licence)',
  display: 'Yoplait (NZ)',
  parentId: 'P0040',
  skipIfExists: false,
  aliasTexts: ['Yoplait (NZ)', 'Yoplait (NZ / Goodman Fielder-Wilmar licence)'],
  harvest: ['Yoplait'],
});

const kelloggs = addBrand({
  name: "Kellogg's",
  display: "Kellogg's",
  parentId: 'P0007',
  type: 'brand_family',
  skipIfExists: false,
  aliasTexts: ['Kelloggs', 'Kellogg'],
});
for (const id of [
  'B0540',
  'B0541',
  'B0542',
  'B0543',
  'B0544',
  'B0545',
  'B0546',
  'B0547',
  'B0548',
  'B0549',
  'B0550',
  'B0551',
  'B0552',
  'B0553',
  'B0554',
  'B0555',
  'B0556',
  'B0557',
]) {
  addChild(id, kelloggs.brand_id);
}

for (const id of ['B0241', 'B0242', 'B0243', 'B0244', 'B0245', 'B0246']) addChild(id, 'B0067');

const cadburyKids = [
  'Picnic',
  'Cherry Ripe',
  'Time Out',
  'Twirl',
  'Old Gold',
  'Marvellous Creations',
  'Favourites',
  'Roses',
  'Milk Tray',
  'Dream',
  'Breakaway',
  'Crunchy Dark',
  'Snack',
  'Energy',
  'Pinky',
  'Moro',
  'Peppermint',
  'Cadbury Turkish Delight',
  'Chocolate Fish',
  'Cocoas',
];
for (const n of cadburyKids) addBrand({ name: n, parentId: 'P0009', childOf: 'B0067' });

addBrand({ name: "Fry's Turkish Delight", parentId: 'P0009' });
addBrand({ name: "Olina's", parentId: 'P0009' });
addBrand({ name: 'Cadbury Baking', parentId: 'P0009' });
addBrand({ name: 'The Natural Confectionery Co.', parentId: 'P0009', aliasTexts: ['TNCC'] });
addBrand({ name: 'Sour Patch Kids', parentId: 'P0009' });

addBrand({ name: 'Super 2', parentId: 'P0008' });
addChild('B0233', 'B0064');

for (const n of ['Smarties', 'Milkybar', 'Aero', "Allen's", 'Red Tulip', 'Plaistowe', 'Nesquik', 'Milo']) {
  addBrand({ name: n, parentId: 'P0008' });
}

for (const n of ['Magnum Classic', 'Magnum Almond', 'Magnum Double', 'Magnum White']) {
  addBrand({ name: n, parentId: 'P0014', childOf: 'B0105' });
}
for (const n of ['Cornetto', 'Calippo', 'Paddle Pop', 'Golden Gaytime', 'Maxibon']) {
  addBrand({ name: n, parentId: 'P0014', childOf: 'B0104' });
}

for (const n of [
  'Continental Cup a Soup',
  'Continental Recipe Bases',
  'Continental Gravies',
  'Continental Sides',
  'Continental Stock',
]) {
  addBrand({ name: n, parentId: 'P0013', childOf: 'B0100' });
}

addBrand({ name: 'Yopro', parentId: 'P0012', aliasTexts: ['YoPRO'] });
addBrand({ name: 'Danone Dairy Australia', parentId: 'P0012' });

for (const n of [
  'Pauls Farmhouse Gold',
  'Oak Thickshake',
  'Oak Plus',
  'Ice Break Extra Shot',
  'Vaalia Kids',
  'Tamar Valley No Added Sugar',
  'Président Brie',
  'Galbani Baby Bocconcini',
  'Jindi Camembert',
  'Lemnos Haloumi',
  'Lactalis Professional',
  'Pauls Professional',
  'Galbani Professional',
]) {
  addBrand({ name: n, parentId: 'P0020' });
}

for (const n of [
  'Bega Peanut Butter',
  'Farmers Union Iced Coffee',
  'Dairy Farmers Thick & Creamy',
  'Dairy Farmers Greek Style',
  'Vegemite Cheesybite',
  'Bega Super Slim',
  'Bega Extra Tasty',
  'Bega Stringers',
  'Bega Super Slices',
  'Bega Country Light',
]) {
  addBrand({ name: n, parentId: 'P0023' });
}
addChild('B0344', 'B0145');

const primoDairy = addBrand({
  name: 'Primo (dairy)',
  display: 'Primo Dairy',
  parentId: 'P0020',
  skipIfExists: false,
  aliasTexts: ['Primo Dairy', 'Primo yoghurt'],
  harvest: ['Primo'],
});

addBrand({ name: "Fresh 'n Fruity", parentId: 'P0022', aliasTexts: ['Fresh n Fruity'] });
for (const n of [
  'Anchor Blue',
  'Anchor Calci+',
  'Anchor Mega Joule',
  'Anchor Protein+',
  'Anchor Unsalted',
  'Mainland Special Reserve',
  'Mainland Tasty',
  'Western Star Spreadable',
  'Perfect Italiano Parmesan',
  'Perfect Italiano Ricotta',
  'Kapiti Kikorangi',
  'Kapiti Kahurangi',
]) {
  addBrand({ name: n, parentId: 'P0022' });
}

for (const n of [
  'Birds Eye SteamFresh',
  'Birds Eye Oven Bake',
  'Edgell Chickpeas',
  'Edgell Corn Kernels',
  "Leggo's Pasta Bake",
  'John West Tuna Tempters',
  'John West Salmon',
  'I&J Fish Fillets',
  'Harvest Sliced Beetroot',
  'Chiko Roll',
]) {
  addBrand({ name: n, parentId: 'P0041' });
}

for (const n of [
  'Weet-Bix Bites',
  'Weet-Bix Gluten Free',
  'Weet-Bix Collagen',
  'Up&Go',
  'So Good',
  'So Good Almond Milk',
  'So Good Oat Milk',
  'Marmite',
  'Sanitarium Peanut Butter',
]) {
  addBrand({ name: n, parentId: 'P0025' });
}

for (const n of ['V8 Fusion', 'V8 Storm', "Campbell's Real Stock", "Campbell's Chunky", 'Gravox Traditional', 'Gravox Supreme']) {
  addBrand({ name: n, parentId: 'P0032' });
}

for (const n of [
  'Shapes',
  'Tiny Teddy',
  'Vita-Weat',
  'Sao',
  'Jatz',
  'Scotch Finger',
  'Mint Slice',
  'Wagon Wheels',
  'Cruskits',
  'Salada',
  'Rice Cookies',
  'Cheds',
  'BBQ Shapes',
  'Pizza Shapes',
  'Chicken Crimpys',
  'Tiny Teddy Chocolate',
  'Tim Tam White',
  'Tim Tam Dark',
]) {
  addBrand({ name: n, parentId: 'P0043', childOf: 'B0185' });
}
addChild('B0187', 'B0185');

for (const n of [
  'Pepsi Max',
  'Pepsi Next',
  'Diet Pepsi',
  'Gatorade Fierce',
  'Gatorade Endurance',
  "Smith's Crinkle Cut",
  "Smith's Thinly Cut",
  'Doritos Supreme',
  'Twisties Cheese',
  'Red Rock Deli Sea Salt',
  'Natural Chip Co Crinkle Cut',
]) {
  addBrand({ name: n, parentId: 'P0010' });
}

for (const n of [
  'Coca-Cola No Sugar',
  'Coca-Cola Vanilla',
  'Sprite Zero',
  'Fanta Raspberry',
  'Lift Plus',
  'Kirks Pasito',
  'Kirks Creaming Soda',
  'Pump Alkaline',
  'Mount Franklin Lightly Sparkling',
  'Powerade Mountain Blast',
  'Fuze Tea Peach',
]) {
  addBrand({ name: n, parentId: 'P0011' });
}

for (const n of [
  'Schweppes Agrum',
  'Schweppes Lemonade',
  'Schweppes Mineral Water',
  'Solo Origin',
  'Cool Ridge Still',
  'Waterfords Sparkling',
  'Cascade Ginger Beer',
]) {
  addBrand({ name: n, parentId: 'P0038' });
}

addBrand({ name: 'Sunkist', parentId: sunkistGrowers.parent_id, skipIfExists: false, aliasTexts: ['Sunkist Growers'] });

addBrand({ name: 'Peters', parentId: froneri.parent_id, aliasTexts: ["Peter's Ice Cream"] });
addBrand({
  name: 'Tip Top Ice Cream',
  parentId: froneri.parent_id,
  skipIfExists: false,
  aliasTexts: ['Tip Top Ice Cream'],
  harvest: ['Tip Top'],
});
addBrand({ name: 'New Zealand Natural', parentId: froneri.parent_id });

for (const n of ['Moccona', 'International Roast', 'Harris', 'Casa Master', "Piazza D'Oro", 'Senseo', "L'OR"]) {
  addBrand({ name: n, parentId: jde.parent_id });
}

addBrand({ name: 'San Remo', parentId: 'P0062', type: 'brand_family', aliasTexts: ['Sanremo'] });
const sanRemo = findReviewedName('San Remo');
for (const n of ['San Remo Pasta', 'San Remo Pulse Pasta', 'San Remo Gluten Free', 'San Remo Lasagne Sheets']) {
  addBrand({ name: n, parentId: 'P0062', childOf: sanRemo.brand_id });
}
addChild('B0566', sanRemo.brand_id);

addBrand({ name: 'Deep South', parentId: ocd.parent_id });
addBrand({ name: 'Motueka Creamery', parentId: ocd.parent_id });

for (const n of ['Thursday Plantation', "Bosisto's", 'Natural Instinct', "A'kin", 'Sukin', 'Gaia', 'Health Care']) {
  addBrand({ name: n, parentId: 'P0154' });
}

for (const n of ['DON', 'Jarrah', 'KR Castlemaine']) {
  addBrand({ name: n, parentId: gwf.parent_id });
}

for (const id of ['B0008', 'B0010', 'B0009', 'B0011', 'B0007']) addChild(id, 'B0001');
for (const n of ['Woolworths Odd Bunch', 'Woolworths Organic', 'Woolworths Delicious', 'Woolworths Heart Smart', 'Woolworths Select']) {
  addBrand({ name: n, parentId: 'P0001', type: 'retailer_own_label', childOf: 'B0001' });
}

for (const id of ['B0014', 'B0016', 'B0202', 'B0201', 'B0203', 'B0018', 'B0012', 'B0017']) addChild(id, 'B0200');
for (const n of [
  'Coles Bakehouse',
  'Coles Bakery',
  'Coles Deli',
  'Coles Butcher',
  'Coles Seafood',
  'Coles Dairy',
  'Coles Pantry',
  'Coles Frozen',
  'Coles Drinks',
]) {
  addBrand({ name: n, parentId: 'P0002', type: 'retailer_own_label', childOf: 'B0200' });
}
for (const a of aliases.rows.filter((x) => x.brand_id === 'B0013')) {
  a.brand_id = 'B0200';
  a.canonical_brand_name = brandById('B0200').canonical_brand_name;
  a.notes_internal = [a.notes_internal, 'Retargeted from archived Coles Brand B0013 to Coles master B0200'].filter(Boolean).join(' | ');
}
for (const a of aliases.rows.filter((x) => x.brand_id === 'B0015')) {
  a.brand_id = 'B0201';
  a.canonical_brand_name = brandById('B0201').canonical_brand_name;
  a.notes_internal = [a.notes_internal, "Retargeted from archived Nature's Kitchen B0015 to Coles Nature's Kitchen B0201"].filter(Boolean).join(' | ');
}

for (const id of ['B0025', 'B0204', 'B0205']) addChild(id, 'B0024');
for (const n of ['Pams Organic', 'Pams Gluten Free', 'Pams Free Range']) {
  addBrand({ name: n, parentId: 'P0003', type: 'retailer_own_label', childOf: 'B0024' });
}

addStew(
  'Published wave1-v0.15 + chaining-extensions/v0.2 AU/NZ current-chain refresh: suppress competing mappings, add missing parents/brands/child edges, market-qualify Yoplait/Tip Top/Primo, no GTIN invention.'
);

writeTable(parents);
writeTable(brands);
writeTable(aliases);
writeTable(sources);
writeTable(stew);
writeTable(oe);
writeTable(ahc);
writeTable(childBrand);
writeTable(childEnt);

fs.writeFileSync(
  path.join(EXT, 'README.md'),
  `# Chaining extension v0.2 — current SoT with wave1-v0.15

Copied from \`chaining-extensions/v0.1\` then refreshed under the 20260816 AU/NZ Chaining / Shared Identity instruction.

Historical \`wave1-v0.14\` and \`chaining-extensions/v0.1\` are preserved and not rewritten.

Runtime Asset loaders merge \`*_extension.csv\` rows after wave1-v0.15. Only \`review_state=reviewed\` rows are consumed.

| File | Role |
|------|------|
| \`product_families.csv\` | Canonical family IDs referenced by Signal_Targets (unchanged from v0.1 copy) |
| \`product_family_membership.csv\` | Reviewed GTIN → family membership |
| \`brand_child_of_brand.csv\` | Reviewed brand → parent-brand for brand_descendants |
| \`entity_child_of_entity.csv\` | Reviewed entity → parent-entity (Open Country Dairy → Talley's; GWF → ABF) |
| \`canonical_*_extension.csv\` | Additive Hoyt / Chickadees / Talley's rows from v0.1 |

**Family matching rules:** both the family row and the membership row must be \`review_state=reviewed\`. Fail closed otherwise.

Do not invent GTINs. Cadbury children are Cadbury descendants; Oreo is not. Pringles is Mars, not a Kellogg's child. Yoplait AU/NZ and Tip Top Bakery/Ice Cream and Primo dairy vs meat fail closed on bare aliases.
`
);

console.log(
  JSON.stringify(
    {
      newParents: { monster: monster.parent_id, froneri: froneri.parent_id, jde: jde.parent_id, sunkistGrowers: sunkistGrowers.parent_id, ocd: ocd.parent_id, gwf: gwf.parent_id },
      kelloggs: kelloggs.brand_id,
      yoplaitNz: yoplaitNz.brand_id,
      primoDairy: primoDairy.brand_id,
      brandCount: brands.rows.length,
      parentCount: parents.rows.length,
      childEdges: childBrand.rows.length,
      entityEdges: childEnt.rows.length,
      archived: brands.rows.filter((b) => b.review_state === 'archived').length,
    },
    null,
    2
  )
);
