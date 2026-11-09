/**
 * S25 development-time ingest → committed runtime JSON under src/s25/assets/.
 * CommonJS entry — keep field mapping identical to generate-s25-asset-runtime.ts.
 *
 *   node scripts/generate-s25-asset-runtime.js --xlsx <path.xlsx> --asset-version <id> [--out-dir <dir>]
 *   node scripts/generate-s25-asset-runtime.js --tsv-dir <dir> --asset-version v0.7 [--out-dir <dir>]
 *   node scripts/generate-s25-asset-runtime.js <tsvDir>   # legacy; implies --asset-version v0.7
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const DEFAULT_TSV_DIR =
  process.env.S25_ASSET_TSV_DIR ||
  path.join(process.env.LOCALAPPDATA || '', 'Temp', 'rveel_s25_docs');

const DEFAULT_OUT_DIR = path.join(__dirname, '..', 'src', 's25', 'assets');

const ALLOWED_ASSET_VERSIONS = [
  'v0.7',
  'v0.8-W5AD01-editorial',
  'v0.9-W5AD01-editorial',
  'v0.10-W5AD01-editorial',
  'v0.11-W5AD01-editorial',
  'v0.12-W5AD01-editorial',
];

const XLSX_SHEETS = {
  catalogue: 'Catalogue_315',
  classes: 'Classes_25',
  profiles: 'Source_Profiles',
  surface: 'Surface_Copy',
};

const TSV_FILES = {
  catalogue: 'asset_Catalogue_315.tsv',
  classes: 'asset_Classes_25.tsv',
  profiles: 'asset_Source_Profiles.tsv',
  surface: 'asset_Surface_Copy.tsv',
};

function parseBool(v) {
  return String(v).trim().toLowerCase() === 'true';
}

function splitPipe(v) {
  return String(v || '')
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);
}

function cell(v) {
  if (v == null) return '';
  return String(v);
}

function parseTsv(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return [];
  const headers = lines[0].split('\t');
  return lines.slice(1).map((line) => {
    const cols = line.split('\t');
    const row = {};
    headers.forEach((h, i) => {
      row[h] = cols[i] ?? '';
    });
    return row;
  });
}

function readTsv(dir, name) {
  const p = path.join(dir, name);
  if (!fs.existsSync(p)) {
    throw new Error(`Missing TSV: ${p}`);
  }
  return parseTsv(fs.readFileSync(p, 'utf8'));
}

function sheetToRawRows(sheet) {
  const json = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
  return json.map((r) => {
    const out = {};
    for (const [k, v] of Object.entries(r)) {
      out[k] = cell(v);
    }
    return out;
  });
}

function readXlsxSheets(xlsxPath) {
  if (!fs.existsSync(xlsxPath)) {
    throw new Error(`Missing XLSX: ${xlsxPath}`);
  }
  const wb = XLSX.readFile(xlsxPath, { cellDates: false, raw: false });
  for (const name of Object.values(XLSX_SHEETS)) {
    if (!wb.Sheets[name]) {
      throw new Error(`XLSX missing required sheet "${name}" in ${xlsxPath}`);
    }
  }
  return {
    catalogueRaw: sheetToRawRows(wb.Sheets[XLSX_SHEETS.catalogue]),
    classesRaw: sheetToRawRows(wb.Sheets[XLSX_SHEETS.classes]),
    profilesRaw: sheetToRawRows(wb.Sheets[XLSX_SHEETS.profiles]),
    surfaceRaw: sheetToRawRows(wb.Sheets[XLSX_SHEETS.surface]),
  };
}

function mapCatalogue(catalogueRaw) {
  return catalogueRaw.map((r) => ({
    additive_id: r.additive_id,
    schedule8_code: r.schedule8_code || null,
    schedule8_names: r.schedule8_names || '',
    consumer_display_name: r.consumer_display_name,
    entry_title: r.entry_title,
    body6_existing: parseBool(r.body6_existing),
    presentation_treatment: r.presentation_treatment,
    tile_summary: r.tile_summary || '',
    expanded_summary: r.expanded_summary || '',
    source_preparation_profile: r.source_preparation_profile || '',
    source_preparation_render_mode: r.source_preparation_render_mode || '',
    source_preparation_copy: r.source_preparation_copy || '',
    fact_1_label: r.fact_1_label || '',
    fact_1_copy: r.fact_1_copy || '',
    fact_2_label: r.fact_2_label || '',
    fact_2_copy: r.fact_2_copy || '',
    fact_3_label: r.fact_3_label || '',
    fact_3_copy: r.fact_3_copy || '',
    name_aliases: splitPipe(r.name_aliases),
    code_aliases: splitPipe(r.code_aliases),
    code_detection_enabled: parseBool(r.code_detection_enabled),
    code_detection_scope: r.code_detection_scope || '',
    bare_numeric_requires_declared_additive_context: parseBool(
      r.bare_numeric_requires_declared_additive_context
    ),
    name_detection_enabled: parseBool(r.name_detection_enabled),
    name_detection_scope: r.name_detection_scope || '',
    evidence_enabled: parseBool(r.evidence_enabled),
    evidence_copy: r.evidence_copy || '',
    evidence_source_count: Number(r.evidence_source_count || 0),
    evidence_source_1_link_label: r.evidence_source_1_link_label || '',
    evidence_source_1_url: r.evidence_source_1_url || '',
    evidence_source_2_link_label: r.evidence_source_2_link_label || '',
    evidence_source_2_url: r.evidence_source_2_url || '',
  }));
}

function mapClasses(classesRaw) {
  return classesRaw.map((r) => ({
    class_id: r.class_id,
    parser_terms: splitPipe(r.parser_terms),
    consumer_label: r.consumer_label,
    consumer_purpose_copy: r.consumer_purpose_copy || '',
    render_mode: r.render_mode,
  }));
}

function mapSourceProfiles(profilesRaw) {
  return profilesRaw.map((r) => ({
    profile_id: r.profile_id,
    consumer_label: r.consumer_label,
    glyph_key: r.glyph_key,
    glyph_brief: r.glyph_brief || '',
    consumer_definition: r.consumer_definition || '',
    consumer_examples: r.consumer_examples || '',
  }));
}

function mapSurfaceCopy(surfaceRaw) {
  const surfaceCopy = {};
  for (const r of surfaceRaw) {
    surfaceCopy[r.key] = r.value;
  }
  return surfaceCopy;
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function parseArgs(argv) {
  const out = { outDir: DEFAULT_OUT_DIR };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--xlsx') out.xlsxPath = argv[++i];
    else if (a === '--tsv-dir') out.tsvDir = argv[++i];
    else if (a === '--asset-version') out.assetVersion = argv[++i];
    else if (a === '--out-dir') out.outDir = argv[++i];
    else if (a.startsWith('-')) throw new Error(`Unknown flag: ${a}`);
    else rest.push(a);
  }
  if (!out.xlsxPath && !out.tsvDir && rest[0]) out.tsvDir = rest[0];
  if (!out.xlsxPath && !out.tsvDir) out.tsvDir = DEFAULT_TSV_DIR;
  if (out.xlsxPath) out.tsvDir = undefined;
  return out;
}

function generate(args) {
  const usingXlsx = Boolean(args.xlsxPath);
  let assetVersion = args.assetVersion;
  if (!assetVersion) {
    if (usingXlsx) {
      throw new Error(
        `--asset-version is required for XLSX ingest (allowed: ${ALLOWED_ASSET_VERSIONS.join(', ')})`
      );
    }
    assetVersion = 'v0.7';
  }
  if (!ALLOWED_ASSET_VERSIONS.includes(assetVersion)) {
    throw new Error(
      `Invalid --asset-version "${assetVersion}". Allowed: ${ALLOWED_ASSET_VERSIONS.join(', ')}`
    );
  }

  let catalogueRaw;
  let classesRaw;
  let profilesRaw;
  let surfaceRaw;
  let sourceFormat;
  let sourcePath;
  let sourceSha256;
  const repoRoot = path.join(__dirname, '..');

  function toProvenancePath(absPath) {
    const resolved = path.resolve(absPath);
    const rel = path.relative(repoRoot, resolved);
    if (rel && !rel.startsWith('..') && !path.isAbsolute(rel)) {
      return rel.split(path.sep).join('/');
    }
    return resolved;
  }

  if (usingXlsx) {
    const xlsxPath = path.resolve(args.xlsxPath);
    const sheets = readXlsxSheets(xlsxPath);
    catalogueRaw = sheets.catalogueRaw;
    classesRaw = sheets.classesRaw;
    profilesRaw = sheets.profilesRaw;
    surfaceRaw = sheets.surfaceRaw;
    sourceFormat = 'xlsx';
    sourcePath = toProvenancePath(xlsxPath);
    sourceSha256 = sha256File(xlsxPath);
  } else {
    const tsvDir = path.resolve(args.tsvDir);
    catalogueRaw = readTsv(tsvDir, TSV_FILES.catalogue);
    classesRaw = readTsv(tsvDir, TSV_FILES.classes);
    profilesRaw = readTsv(tsvDir, TSV_FILES.profiles);
    surfaceRaw = readTsv(tsvDir, TSV_FILES.surface);
    sourceFormat = 'tsv_dir';
    sourcePath = toProvenancePath(tsvDir);
  }

  const catalogue = mapCatalogue(catalogueRaw);
  const classes = mapClasses(classesRaw);
  const sourceProfiles = mapSourceProfiles(profilesRaw);
  const surfaceCopy = mapSurfaceCopy(surfaceRaw);

  const ids = catalogue.map((c) => c.additive_id);
  const uniqueIds = new Set(ids);
  const body6 = catalogue.filter((c) => c.body6_existing);
  const standard = catalogue.filter((c) => !c.body6_existing);
  const evidence = standard.filter((c) => c.evidence_enabled);
  const dual = evidence.filter((c) => c.evidence_source_count === 2);

  if (catalogue.length !== 315) throw new Error(`Expected 315 catalogue rows, got ${catalogue.length}`);
  if (standard.length !== 309 || body6.length !== 6) {
    throw new Error(`Expected 309 std / 6 body6, got ${standard.length}/${body6.length}`);
  }
  if (evidence.length !== 33) throw new Error(`Expected 33 evidence rows, got ${evidence.length}`);
  if (dual.length !== 7) throw new Error(`Expected 7 dual-source evidence rows, got ${dual.length}`);
  if (uniqueIds.size !== catalogue.length) throw new Error('Duplicate additive_id in catalogue');
  if (classes.length !== 25) throw new Error(`Expected 25 classes, got ${classes.length}`);
  if (sourceProfiles.length !== 11) {
    throw new Error(`Expected 11 source profiles, got ${sourceProfiles.length}`);
  }
  if (Object.keys(surfaceCopy).length !== 7) {
    throw new Error(`Expected 7 surface_copy keys, got ${Object.keys(surfaceCopy).length}`);
  }

  fs.mkdirSync(args.outDir, { recursive: true });
  const write = (name, data) => {
    const p = path.join(args.outDir, name);
    fs.writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
    console.log(`Wrote ${p}`);
  };

  const counts = {
    catalogue_rows: catalogue.length,
    standard_rows: standard.length,
    body6_rows: body6.length,
    evidence_enabled: evidence.length,
    evidence_dual_source: dual.length,
    unique_additive_ids: uniqueIds.size,
    classes: classes.length,
    source_profiles: sourceProfiles.length,
    surface_copy_keys: Object.keys(surfaceCopy).length,
  };

  const manifest = {
    asset_version: assetVersion,
    generated_at: new Date().toISOString(),
    source_format: sourceFormat,
    source_path: sourcePath,
    generator: 'scripts/generate-s25-asset-runtime.js',
    counts,
  };
  if (sourceSha256) manifest.source_sha256 = sourceSha256;
  if (sourceFormat === 'tsv_dir') manifest.tsv_dir = sourcePath;

  write('catalogue_315.json', catalogue);
  write('classes_25.json', classes);
  write('source_profiles.json', sourceProfiles);
  write('surface_copy.json', surfaceCopy);
  write('ingestion_manifest.json', manifest);

  console.log(JSON.stringify({ asset_version: assetVersion, source_format: sourceFormat, ...counts }, null, 2));
}

generate(parseArgs(process.argv.slice(2)));
