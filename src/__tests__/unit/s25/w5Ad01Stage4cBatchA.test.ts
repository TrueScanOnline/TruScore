/**
 * W5-AD-01 Stage 4C Batch A — seven-entry STANDARD editorial integrity gates.
 * Compares working catalogue against pre-Batch-A HEAD blob at 5e9688f.
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFileSync } from 'child_process';
import {
  S25_CATALOGUE,
  assertAssetCounts,
  buildRenderList,
  mergeRenderedAdditives,
} from '../../../s25';

const PRE_BATCH_A_SHA = '5e9688f08b6882ae6fea0a2511eea00dc12c3bdb';
const BATCH_A_IDS = [
  'e476',
  'e150c',
  'e330',
  'e322',
  'e422',
  'e575',
  'e223',
] as const;

const EDITORIAL_FIELDS = [
  'tile_summary',
  'expanded_summary',
  'source_preparation_copy',
  'fact_1_label',
  'fact_1_copy',
  'fact_2_label',
  'fact_2_copy',
  'fact_3_label',
  'fact_3_copy',
  'evidence_copy',
] as const;

const EXPECTED_TILE: Record<(typeof BATCH_A_IDS)[number], string> = {
  e476:
    'Chocolate makers use PGPR (476) to help chocolate flow smoothly. Its fatty-acid building blocks come from castor oil.',
  e150c:
    'This brown colour is made in a controlled factory process — it is not simply the caramel you get by browning sugar in a kitchen.',
  e330:
    'Citric acid sounds like it comes from citrus — and it does occur there — but food-grade citric acid is commonly produced by fermenting sugar.',
  e322:
    'Lecithin helps oil and water mix — but the number 322 alone will not tell you whether it came from soy, sunflower or egg.',
  e422:
    'Glycerol helps hold moisture and carry flavour — and the number 422 alone will not tell you whether it came from plant oil, animal fat or a synthetic route.',
  e575:
    'Glucono delta-lactone (575) gradually turns into an acid in water, allowing acidity to develop over time.',
  e223:
    "Code 223 identifies sodium metabisulphite, a sulphite preservative. That's particularly useful to know for people who are sensitive to sulphites.",
};

const EXPECTED_EXPANDED: Partial<Record<(typeof BATCH_A_IDS)[number], string>> = {
  e476:
    'PGPR (polyglycerol esters of interesterified ricinoleic acid) is a fat-phase emulsifier. Its characteristic fatty acid comes from castor-oil chemistry. Food makers use it especially to manage flow and viscosity in chocolate and other fat-based coatings.',
  e575:
    'Glucono delta-lactone (575) is a cyclic form of gluconic acid made from glucose. In water, it gradually converts to gluconic acid, allowing acidity to develop over time. This makes it useful for controlled acidification and certain food-setting processes.',
  e223:
    'Sodium metabisulphite (223) belongs to the sulphite preservative family. When dissolved, it can provide preservative and anti-browning action through sulphite-related compounds.',
};

const V09_XLSX = path.join(
  __dirname,
  '../../../../docs/development/w5-ad01/Rveel_S25_Broader_Additive_Catalogue_MVP_Implementation_Asset_W5AD01_editorial_v0_9.xlsx'
);
const V09_SHA256 = 'c49a4af1ed22a3ff57ef6a3f67d2909b97dce005ee76eb23c80baab26a0dd79d';
const V08_XLSX = path.join(
  __dirname,
  '../../../../docs/development/w5-ad01/Rveel_S25_Broader_Additive_Catalogue_MVP_Implementation_Asset_W5AD01_editorial_v0_8.xlsx'
);
const V08_SHA256 = '88cec7188385ec364f67ddc5742f45555f649defac430a5e80f7479902214fa2';
const GENERATOR = path.join(__dirname, '../../../../scripts/generate-s25-asset-runtime.js');
const REPO_ROOT = path.join(__dirname, '../../../..');

type CatalogueEntry = (typeof S25_CATALOGUE)[number];

function loadPreBatchCatalogue(): CatalogueEntry[] {
  const raw = execFileSync(
    'git',
    ['show', `${PRE_BATCH_A_SHA}:src/s25/assets/catalogue_315.json`],
    { maxBuffer: 20 * 1024 * 1024 }
  );
  return JSON.parse(Buffer.from(raw).toString('utf8')) as CatalogueEntry[];
}

function sha256File(p: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
}

describe('W5-AD-01 Stage 4C Batch A editorial integrity', () => {
  const before = loadPreBatchCatalogue();
  const beforeById = new Map(before.map((e) => [e.additive_id, e]));
  const workingById = new Map(S25_CATALOGUE.map((e) => [e.additive_id, e]));

  it('preserves catalogue counts', () => {
    expect(assertAssetCounts()).toEqual({
      catalogue_rows: 315,
      standard_rows: 309,
      body6_rows: 6,
      evidence_enabled: 33,
      evidence_dual_source: 7,
      unique_additive_ids: 315,
      duplicate_additive_ids: 0,
    });
  });

  it('keeps Batch A ids among editorial changes after catalogue-wide overhaul', () => {
    const changed = new Set<string>();
    for (const entry of S25_CATALOGUE) {
      const prev = beforeById.get(entry.additive_id)!;
      if (JSON.stringify(entry) !== JSON.stringify(prev)) {
        changed.add(entry.additive_id);
        expect(entry.body6_existing).toBe(false);
      }
    }
    for (const id of BATCH_A_IDS) {
      expect(changed.has(id)).toBe(true);
    }
    expect(changed.size).toBeGreaterThan(BATCH_A_IDS.length);
  });

  it('applies accepted tile wording and keeps evidence/source-prep untouched', () => {
    for (const id of BATCH_A_IDS) {
      const entry = workingById.get(id)!;
      const prev = beforeById.get(id)!;
      expect(entry.presentation_treatment).toBe('STANDARD');
      expect(entry.body6_existing).toBe(false);
      expect(entry.tile_summary).toBe(EXPECTED_TILE[id]);
      expect(entry.tile_summary).not.toBe(prev.tile_summary);
      if (EXPECTED_EXPANDED[id]) {
        expect(entry.expanded_summary).toBe(EXPECTED_EXPANDED[id]);
      }
      expect(entry.evidence_copy).toBe(prev.evidence_copy);
      expect(entry.evidence_enabled).toBe(prev.evidence_enabled);
      expect(entry.evidence_source_count).toBe(prev.evidence_source_count);
      expect(entry.evidence_source_1_url).toBe(prev.evidence_source_1_url);
      expect(entry.evidence_source_2_url).toBe(prev.evidence_source_2_url);
      expect(entry.source_preparation_copy).toBe(prev.source_preparation_copy);
      expect(entry.source_preparation_profile).toBe(prev.source_preparation_profile);
    }
  });

  it('keeps e476 fact_3 empty after Batch A correction and overhaul', () => {
    const e476 = workingById.get('e476')!;
    const prev476 = beforeById.get('e476')!;
    expect((e476.fact_3_label || '').trim()).toBe('');
    expect((e476.fact_3_copy || '').trim()).toBe('');
    expect(e476.fact_3_label).toBe(prev476.fact_3_label);
    expect(e476.fact_3_copy).toBe(prev476.fact_3_copy);
  });

  it('does not put sulphite labelling threshold claims into e223 expanded_summary', () => {
    const e223 = workingById.get('e223')!;
    expect(e223.expanded_summary.toLowerCase()).not.toContain('10 milligram');
    expect(e223.expanded_summary.toLowerCase()).not.toContain('declare');
    expect(e223.evidence_copy).toContain('10 milligrams per kilogram');
  });

  it('preserves all six BODY6 catalogue rows vs pre-Batch-A HEAD', () => {
    const body6 = S25_CATALOGUE.filter((e) => e.body6_existing);
    expect(body6).toHaveLength(6);
    for (const entry of body6) {
      expect(entry).toEqual(beforeById.get(entry.additive_id));
    }
  });

  it('preserves v0.8 and v0.9 workbook bytes under change control', () => {
    expect(fs.existsSync(V08_XLSX)).toBe(true);
    expect(sha256File(V08_XLSX)).toBe(V08_SHA256);
    expect(fs.existsSync(V09_XLSX)).toBe(true);
    expect(sha256File(V09_XLSX)).toBe(V09_SHA256);
    expect(V09_SHA256).not.toBe(V08_SHA256);
  });

  it('reproduces Batch A tiles from v0.9 XLSX ingest independently of later overhaul', () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 's25-ingest-v09-'));
    execFileSync(
      process.execPath,
      [
        GENERATOR,
        '--xlsx',
        V09_XLSX,
        '--asset-version',
        'v0.9-W5AD01-editorial',
        '--out-dir',
        outDir,
      ],
      { cwd: REPO_ROOT, encoding: 'utf8' }
    );
    const generated = JSON.parse(
      fs.readFileSync(path.join(outDir, 'catalogue_315.json'), 'utf8')
    ) as Array<{ additive_id: string; tile_summary: string }>;
    const byId = new Map(generated.map((e) => [e.additive_id, e]));
    for (const id of BATCH_A_IDS) {
      expect(byId.get(id)!.tile_summary).toBe(EXPECTED_TILE[id]);
    }
    const manifest = JSON.parse(
      fs.readFileSync(path.join(outDir, 'ingestion_manifest.json'), 'utf8')
    ) as { asset_version: string; source_sha256: string };
    expect(manifest.asset_version).toBe('v0.9-W5AD01-editorial');
    expect(manifest.source_sha256).toBe(V09_SHA256);
  });

  it('limits Batch A field mutations to editorial commentary fields', () => {
    for (const id of BATCH_A_IDS) {
      const entry = workingById.get(id)!;
      const prev = beforeById.get(id)!;
      for (const [k, v] of Object.entries(entry)) {
        if ((EDITORIAL_FIELDS as readonly string[]).includes(k)) continue;
        expect(v).toEqual((prev as Record<string, unknown>)[k]);
      }
    }
  });

  it('surfaces all seven Batch A tiles via merge/render with coded OFF tags', () => {
    const merged = mergeRenderedAdditives({
      firedBodyLedgerIds: [],
      ingredientsText:
        'Colour (150c), emulsifier (476), emulsifier (322), acidity regulator (330), humectant (422), acidity regulator (575), preservative (223)',
      additivesTags: [
        'en:e150c',
        'en:e476',
        'en:e322',
        'en:e330',
        'en:e422',
        'en:e575',
        'en:e223',
      ],
    });
    const items = buildRenderList(merged);
    const byId = new Map(items.map((i) => [i.additiveId, i]));
    for (const id of BATCH_A_IDS) {
      expect(byId.has(id)).toBe(true);
      expect(byId.get(id)!.entry.tile_summary).toBe(EXPECTED_TILE[id]);
    }
  });
});
