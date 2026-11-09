/**
 * W5-AD-01 Stage 5 — duplicate-expanded + SRR editorial closure (v0.11).
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { S25_CATALOGUE, assertAssetCounts, S25_INGESTION_MANIFEST } from '../../../s25';
import { DISCOVERY_DISPLAY_SEQUENCE } from '../../../s25/discoveryPresentationOrder';

const REPO_ROOT = path.join(__dirname, '../../../..');
const V10_XLSX = path.join(
  REPO_ROOT,
  'docs/development/w5-ad01/Rveel_S25_Broader_Additive_Catalogue_MVP_Implementation_Asset_W5AD01_editorial_v0_10.xlsx'
);
const V11_XLSX = path.join(
  REPO_ROOT,
  'docs/development/w5-ad01/Rveel_S25_Broader_Additive_Catalogue_MVP_Implementation_Asset_W5AD01_editorial_v0_11.xlsx'
);
const V10_SHA = '5a8e8fb5be0b4a70832fa8e0d6c46bc42e281ddba3ab29bc06b5c1e8e9dc25b6';
const V11_SHA = 'e155d47e71078a62d0866d1fe5819dac937bcd5877dbc0e4fc67cae10afa9eb5';
const GENERATOR = path.join(REPO_ROOT, 'scripts/generate-s25-asset-runtime.js');
const STAGE5 = path.join(REPO_ROOT, 'docs/development/w5-ad01/overhaul-20261109/stage5-20261109');

const EDITORIAL = new Set([
  'tile_summary',
  'expanded_summary',
  'fact_1_label',
  'fact_1_copy',
  'fact_2_label',
  'fact_2_copy',
  'fact_3_label',
  'fact_3_copy',
]);

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

function ingest(xlsx: string, version: string, outDir: string): unknown[] {
  execFileSync(
    process.execPath,
    [GENERATOR, '--xlsx', xlsx, '--asset-version', version, '--out-dir', outDir],
    { cwd: REPO_ROOT, encoding: 'utf8' }
  );
  return JSON.parse(fs.readFileSync(path.join(outDir, 'catalogue_315.json'), 'utf8'));
}

describe('W5-AD-01 Stage 5 closure (v0.11 lineage preserved)', () => {
  it('preserves v0.10 and v0.11 workbook hashes after later successors', () => {
    expect(assertAssetCounts().catalogue_rows).toBe(315);
    expect(assertAssetCounts().standard_rows).toBe(309);
    expect(assertAssetCounts().body6_rows).toBe(6);
    expect(sha256File(V10_XLSX)).toBe(V10_SHA);
    expect(sha256File(V11_XLSX)).toBe(V11_SHA);
    expect(S25_INGESTION_MANIFEST.asset_version).not.toBe('v0.7');
  });

  it('has zero STANDARD tile==expanded duplicates on current catalogue', () => {
    const dups = S25_CATALOGUE.filter((e) => {
      if (e.body6_existing) return false;
      const tile = (e.tile_summary || '').trim();
      const exp = (e.expanded_summary || '').trim();
      return tile.length > 0 && tile === exp;
    });
    expect(dups.map((e) => e.additive_id)).toEqual([]);
  });

  it('v0.11 vs v0.10 changed only editorial fields (Stage 5 frozen lineage)', () => {
    const out10 = fs.mkdtempSync(path.join(os.tmpdir(), 's25-v10-stage5-'));
    const out11 = fs.mkdtempSync(path.join(os.tmpdir(), 's25-v11-stage5-'));
    const before = ingest(V10_XLSX, 'v0.10-W5AD01-editorial', out10) as Array<
      Record<string, unknown>
    >;
    const after = ingest(V11_XLSX, 'v0.11-W5AD01-editorial', out11) as Array<
      Record<string, unknown>
    >;
    const bb = new Map(before.map((e) => [e.additive_id as string, e]));
    const changed = new Set<string>();
    for (const entry of after) {
      const prev = bb.get(entry.additive_id as string)!;
      if (entry.body6_existing) {
        expect(entry).toEqual(prev);
        continue;
      }
      for (const [k, v] of Object.entries(entry)) {
        if (JSON.stringify(prev[k]) !== JSON.stringify(v)) {
          expect(EDITORIAL.has(k)).toBe(true);
          changed.add(entry.additive_id as string);
        }
      }
      expect(entry.evidence_copy).toBe(prev.evidence_copy);
      expect(entry.evidence_enabled).toBe(prev.evidence_enabled);
      expect(entry.source_preparation_copy).toBe(prev.source_preparation_copy);
      expect(entry.source_preparation_profile).toBe(prev.source_preparation_profile);
    }
    expect(changed.size).toBe(29);
  });

  it('still regenerates the frozen v0.11 catalogue from the v0.11 workbook', () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 's25-v11-'));
    const generated = ingest(V11_XLSX, 'v0.11-W5AD01-editorial', outDir) as Array<{
      additive_id: string;
    }>;
    expect(generated).toHaveLength(315);
    expect(sha256File(V11_XLSX)).toBe(V11_SHA);
  });

  it('pins the authorised W5-AD-02 CORE-22 discovery map', () => {
    expect(DISCOVERY_DISPLAY_SEQUENCE).toEqual(RUNTIME_MAP_AUTHORISED_CORE22);
  });

  it('records Stage 5 SRR dispositions and AD-02 Favourites verified IDs', () => {
    const srr = JSON.parse(
      fs.readFileSync(path.join(STAGE5, 'SRR14_DISPOSITIONS.json'), 'utf8')
    ) as Array<{ additive_id: string; recommendation: string }>;
    expect(srr).toHaveLength(14);
    const fav = JSON.parse(
      fs.readFileSync(
        path.join(
          REPO_ROOT,
          'docs/development/w5-ad01/overhaul-20261109/stage5_favourites_verified.json'
        ),
        'utf8'
      )
    ) as { barcode: string; verified_rendered_additive_ids: string[] };
    expect(fav.barcode).toBe('9300617308324');
    expect(fav.verified_rendered_additive_ids).toEqual([
      'e120',
      'e471',
      'e476',
      'e150c',
      'e330',
      'e322',
      'e422',
      'e575',
      'e223',
    ]);
    expect(srr.filter((r) => r.recommendation === 'RETAIN FAIL-CLOSED').length).toBe(5);
  });
});
