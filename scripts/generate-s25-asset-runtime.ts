/**
 * One-shot ingest: S25 v0.7 TSV assets → committed runtime JSON under src/s25/assets/.
 *
 * Usage:
 *   npx ts-node --compiler-options "{\"module\":\"commonjs\"}" scripts/generate-s25-asset-runtime.ts <tsvDir>
 *   # or: node -r ts-node/register/transpile-only ...
 *
 * Default tsvDir: env S25_ASSET_TSV_DIR, else the founder extract folder used for Wave 3 S25.
 */

import * as fs from 'fs';
import * as path from 'path';

const DEFAULT_TSV_DIR =
  process.env.S25_ASSET_TSV_DIR ||
  path.join(process.env.LOCALAPPDATA || '', 'Temp', 'rveel_s25_docs');

const OUT_DIR = path.join(__dirname, '..', 'src', 's25', 'assets');

function parseTsv(text: string): Record<string, string>[] {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return [];
  const headers = lines[0].split('\t');
  return lines.slice(1).map((line) => {
    const cols = line.split('\t');
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = cols[i] ?? '';
    });
    return row;
  });
}

function parseBool(v: string): boolean {
  return String(v).trim().toLowerCase() === 'true';
}

function splitPipe(v: string): string[] {
  return String(v || '')
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);
}

function readTsv(dir: string, name: string): Record<string, string>[] {
  const p = path.join(dir, name);
  if (!fs.existsSync(p)) {
    throw new Error(`Missing TSV: ${p}`);
  }
  return parseTsv(fs.readFileSync(p, 'utf8'));
}

function main(): void {
  const tsvDir = process.argv[2] || DEFAULT_TSV_DIR;
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const catalogueRaw = readTsv(tsvDir, 'asset_Catalogue_315.tsv');
  const classesRaw = readTsv(tsvDir, 'asset_Classes_25.tsv');
  const profilesRaw = readTsv(tsvDir, 'asset_Source_Profiles.tsv');
  const surfaceRaw = readTsv(tsvDir, 'asset_Surface_Copy.tsv');

  const catalogue = catalogueRaw.map((r) => ({
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

  const classes = classesRaw.map((r) => ({
    class_id: r.class_id,
    parser_terms: splitPipe(r.parser_terms),
    consumer_label: r.consumer_label,
    consumer_purpose_copy: r.consumer_purpose_copy || '',
    render_mode: r.render_mode,
  }));

  const sourceProfiles = profilesRaw.map((r) => ({
    profile_id: r.profile_id,
    consumer_label: r.consumer_label,
    glyph_key: r.glyph_key,
    glyph_brief: r.glyph_brief || '',
    consumer_definition: r.consumer_definition || '',
    consumer_examples: r.consumer_examples || '',
  }));

  const surfaceCopy: Record<string, string> = {};
  for (const r of surfaceRaw) {
    surfaceCopy[r.key] = r.value;
  }

  const ids = catalogue.map((c) => c.additive_id);
  const uniqueIds = new Set(ids);
  const body6 = catalogue.filter((c) => c.body6_existing);
  const standard = catalogue.filter((c) => !c.body6_existing);
  const evidence = standard.filter((c) => c.evidence_enabled);
  const dual = evidence.filter((c) => c.evidence_source_count === 2);

  if (catalogue.length !== 315) {
    throw new Error(`Expected 315 catalogue rows, got ${catalogue.length}`);
  }
  if (standard.length !== 309 || body6.length !== 6) {
    throw new Error(`Expected 309 std / 6 body6, got ${standard.length}/${body6.length}`);
  }
  if (evidence.length !== 33) {
    throw new Error(`Expected 33 evidence rows, got ${evidence.length}`);
  }
  if (dual.length !== 7) {
    throw new Error(`Expected 7 dual-source evidence rows, got ${dual.length}`);
  }
  if (uniqueIds.size !== catalogue.length) {
    throw new Error('Duplicate additive_id in catalogue');
  }
  if (classes.length !== 25) {
    throw new Error(`Expected 25 classes, got ${classes.length}`);
  }

  const write = (name: string, data: unknown) => {
    const p = path.join(OUT_DIR, name);
    fs.writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
    console.log(`Wrote ${p}`);
  };

  write('catalogue_315.json', catalogue);
  write('classes_25.json', classes);
  write('source_profiles.json', sourceProfiles);
  write('surface_copy.json', surfaceCopy);
  write('ingestion_manifest.json', {
    asset_version: 'v0.7',
    generated_at: new Date().toISOString(),
    tsv_dir: tsvDir,
    counts: {
      catalogue_rows: catalogue.length,
      standard_rows: standard.length,
      body6_rows: body6.length,
      evidence_enabled: evidence.length,
      evidence_dual_source: dual.length,
      unique_additive_ids: uniqueIds.size,
      classes: classes.length,
      source_profiles: sourceProfiles.length,
      surface_copy_keys: Object.keys(surfaceCopy).length,
    },
  });

  console.log(
    JSON.stringify(
      {
        catalogue_rows: catalogue.length,
        standard_rows: standard.length,
        body6_rows: body6.length,
        evidence_enabled: evidence.length,
        evidence_dual_source: dual.length,
        unique_additive_ids: uniqueIds.size,
      },
      null,
      2
    )
  );
}

main();
