/**
 * W5-AD-01 founder-authorised E308/E309 source-governance correction (v0.12).
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { S25_CATALOGUE, assertAssetCounts, S25_INGESTION_MANIFEST } from '../../../s25';
import { DISCOVERY_DISPLAY_SEQUENCE } from '../../../s25/discoveryPresentationOrder';

const REPO_ROOT = path.join(__dirname, '../../../..');
const V11_XLSX = path.join(
  REPO_ROOT,
  'docs/development/w5-ad01/Rveel_S25_Broader_Additive_Catalogue_MVP_Implementation_Asset_W5AD01_editorial_v0_11.xlsx'
);
const V12_XLSX = path.join(
  REPO_ROOT,
  'docs/development/w5-ad01/Rveel_S25_Broader_Additive_Catalogue_MVP_Implementation_Asset_W5AD01_editorial_v0_12.xlsx'
);
const V11_SHA = 'e155d47e71078a62d0866d1fe5819dac937bcd5877dbc0e4fc67cae10afa9eb5';
const V12_SHA = 'a70f860fd9a9c4f17deedf506d9e3d4106760973ee03b5c935a1648e72ece638';
const GENERATOR = path.join(REPO_ROOT, 'scripts/generate-s25-asset-runtime.js');

const E308_SP =
  'The Australia New Zealand Food Standards Code lists additive 308 as synthetic gamma-tocopherol, distinct from mixed tocopherols concentrate (307b). The additive number does not establish a particular supplier\'s starting materials or exact manufacturing process.';
const E309_SP =
  'The Australia New Zealand Food Standards Code lists additive 309 as synthetic delta-tocopherol, distinct from mixed tocopherols concentrate (307b). The additive number does not establish a particular supplier\'s starting materials or exact manufacturing process.';

/** Authorised W5-AD-02 CORE-22 map (local implementation). */
const RUNTIME_MAP_AUTHORISED_CORE22 = {
  e120: 1,
  e905b: 2,
  e904: 3,
  e901: 4,
  e542: 5,
  e1105: 6,
  e1101: 7,
  e957: 8,
  e476: 9,
  e445: 10,
  e1522: 11,
  e355: 12,
  e943a: 13,
  e944: 14,
  e955: 15,
  e123: 16,
  e141: 17,
  e415: 18,
  e150c: 19,
  e330: 20,
  e334: 21,
  e300: 22,
} as const;

function sha256File(p: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
}

function ingest(xlsx: string, version: string, outDir: string): Array<Record<string, unknown>> {
  execFileSync(
    process.execPath,
    [GENERATOR, '--xlsx', xlsx, '--asset-version', version, '--out-dir', outDir],
    { cwd: REPO_ROOT, encoding: 'utf8' }
  );
  return JSON.parse(fs.readFileSync(path.join(outDir, 'catalogue_315.json'), 'utf8'));
}

describe('W5-AD-01 E308/E309 authorised source correction (v0.12)', () => {
  it('preserves v0.11 workbook and ships v0.12 runtime', () => {
    expect(assertAssetCounts().catalogue_rows).toBe(315);
    expect(assertAssetCounts().standard_rows).toBe(309);
    expect(assertAssetCounts().body6_rows).toBe(6);
    expect(sha256File(V11_XLSX)).toBe(V11_SHA);
    expect(sha256File(V12_XLSX)).toBe(V12_SHA);
    expect(S25_INGESTION_MANIFEST.asset_version).toBe('v0.12-W5AD01-editorial');
    expect(S25_INGESTION_MANIFEST.source_sha256).toBe(V12_SHA);
  });

  it('mutates only authorised e308/e309 fields vs v0.11', () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 's25-v11-auth-'));
    const before = ingest(V11_XLSX, 'v0.11-W5AD01-editorial', outDir);
    const bb = new Map(before.map((e) => [e.additive_id as string, e]));
    const changed = new Map<string, string[]>();
    for (const entry of S25_CATALOGUE) {
      const prev = bb.get(entry.additive_id)!;
      if (entry.body6_existing) {
        expect(entry).toEqual(prev);
        continue;
      }
      const entryObj = entry as unknown as Record<string, unknown>;
      const fields: string[] = [];
      for (const [k, v] of Object.entries(entryObj)) {
        if (JSON.stringify(prev[k]) !== JSON.stringify(v)) fields.push(k);
      }
      if (fields.length) changed.set(entry.additive_id, fields.sort());
      expect(entry.evidence_copy).toBe(prev.evidence_copy);
      expect(entry.evidence_enabled).toBe(prev.evidence_enabled);
    }
    expect([...changed.keys()].sort()).toEqual(['e308', 'e309']);
    expect(changed.get('e308')).toEqual([
      'source_preparation_copy',
      'source_preparation_profile',
    ]);
    expect(changed.get('e309')).toEqual([
      'expanded_summary',
      'fact_1_copy',
      'fact_1_label',
      'fact_3_copy',
      'fact_3_label',
      'source_preparation_copy',
      'source_preparation_profile',
      'tile_summary',
    ]);
  });

  it('applies authorised SP and E309 editorial wording', () => {
    const e308 = S25_CATALOGUE.find((e) => e.additive_id === 'e308')!;
    const e309 = S25_CATALOGUE.find((e) => e.additive_id === 'e309')!;
    const e472e = S25_CATALOGUE.find((e) => e.additive_id === 'e472e')!;
    expect(e308.source_preparation_profile).toBe('CHEMICAL_SYNTHESIS');
    expect(e308.source_preparation_copy).toBe(E308_SP);
    expect(e308.tile_summary).toContain('Synthetic gamma-tocopherol');
    expect(e309.source_preparation_profile).toBe('CHEMICAL_SYNTHESIS');
    expect(e309.source_preparation_copy).toBe(E309_SP);
    expect(e309.tile_summary).toBe(
      'Synthetic delta-tocopherol is a manufactured form of one of the tocopherols in the vitamin E family.'
    );
    expect(e309.fact_1_label).toBe('Listing');
    expect(e309.fact_3_label).toBe('Decode note');
    expect(e309.fact_2_copy).toBe('Used as an antioxidant in fat-containing foods.');
    expect(e472e.source_preparation_copy).toContain('plant or animal');
  });

  it('reproduces committed catalogue from v0.12 XLSX ingest', () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 's25-v12-'));
    const generated = ingest(V12_XLSX, 'v0.12-W5AD01-editorial', outDir);
    expect(generated).toEqual(S25_CATALOGUE);
  });

  it('pins the authorised W5-AD-02 CORE-22 discovery map', () => {
    expect(DISCOVERY_DISPLAY_SEQUENCE).toEqual(RUNTIME_MAP_AUTHORISED_CORE22);
  });
});

