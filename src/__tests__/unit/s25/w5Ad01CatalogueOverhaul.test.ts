/**
 * W5-AD-01 catalogue-wide three-pass overhaul integrity (v0.10).
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { S25_CATALOGUE, assertAssetCounts, S25_INGESTION_MANIFEST } from '../../../s25';

const REPO_ROOT = path.join(__dirname, '../../../..');
const V09_XLSX = path.join(
  REPO_ROOT,
  'docs/development/w5-ad01/Rveel_S25_Broader_Additive_Catalogue_MVP_Implementation_Asset_W5AD01_editorial_v0_9.xlsx'
);
const V10_XLSX = path.join(
  REPO_ROOT,
  'docs/development/w5-ad01/Rveel_S25_Broader_Additive_Catalogue_MVP_Implementation_Asset_W5AD01_editorial_v0_10.xlsx'
);
const V11_XLSX = path.join(
  REPO_ROOT,
  'docs/development/w5-ad01/Rveel_S25_Broader_Additive_Catalogue_MVP_Implementation_Asset_W5AD01_editorial_v0_11.xlsx'
);
const V12_XLSX = path.join(
  REPO_ROOT,
  'docs/development/w5-ad01/Rveel_S25_Broader_Additive_Catalogue_MVP_Implementation_Asset_W5AD01_editorial_v0_12.xlsx'
);
const V09_SHA = 'c49a4af1ed22a3ff57ef6a3f67d2909b97dce005ee76eb23c80baab26a0dd79d';
const V10_SHA = '5a8e8fb5be0b4a70832fa8e0d6c46bc42e281ddba3ab29bc06b5c1e8e9dc25b6';
const V11_SHA = 'e155d47e71078a62d0866d1fe5819dac937bcd5877dbc0e4fc67cae10afa9eb5';
const V12_SHA = 'a70f860fd9a9c4f17deedf506d9e3d4106760973ee03b5c935a1648e72ece638';
const V08_XLSX = path.join(
  REPO_ROOT,
  'docs/development/w5-ad01/Rveel_S25_Broader_Additive_Catalogue_MVP_Implementation_Asset_W5AD01_editorial_v0_8.xlsx'
);
const V08_SHA = '88cec7188385ec364f67ddc5742f45555f649defac430a5e80f7479902214fa2';
const GENERATOR = path.join(REPO_ROOT, 'scripts/generate-s25-asset-runtime.js');
const REGISTER = path.join(
  REPO_ROOT,
  'docs/development/w5-ad01/overhaul-20261109/REVIEW_REGISTER_309.json'
);

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

describe('W5-AD-01 catalogue-wide overhaul (lineage through v0.12)', () => {
  it('preserves catalogue counts and workbook lineage through authorised E308/E309', () => {
    expect(assertAssetCounts().catalogue_rows).toBe(315);
    expect(assertAssetCounts().standard_rows).toBe(309);
    expect(assertAssetCounts().body6_rows).toBe(6);
    expect(sha256File(V08_XLSX)).toBe(V08_SHA);
    expect(sha256File(V09_XLSX)).toBe(V09_SHA);
    expect(sha256File(V10_XLSX)).toBe(V10_SHA);
    expect(sha256File(V11_XLSX)).toBe(V11_SHA);
    expect(sha256File(V12_XLSX)).toBe(V12_SHA);
    expect(S25_INGESTION_MANIFEST.asset_version).toBe('v0.12-W5AD01-editorial');
    expect(S25_INGESTION_MANIFEST.source_sha256).toBe(V12_SHA);
  });

  it('has a complete 309-entry review register', () => {
    const reg = JSON.parse(fs.readFileSync(REGISTER, 'utf8')) as {
      expected_count: number;
      received_count: number;
      absent_ids: string[];
      status_counts: Record<string, number>;
    };
    expect(reg.expected_count).toBe(309);
    expect(reg.received_count).toBe(309);
    expect(reg.absent_ids).toEqual([]);
    expect(
      (reg.status_counts['ACCEPT EXISTING'] || 0) +
        (reg.status_counts['EDITORIALLY IMPROVED'] || 0) +
        (reg.status_counts['SOURCE REVIEW REQUIRED'] || 0)
    ).toBe(309);
  });

  it('overhaul-era changes vs v0.9 were editorial-only before authorised SP corrections', () => {
    const out09 = fs.mkdtempSync(path.join(os.tmpdir(), 's25-v09-base-'));
    const out11 = fs.mkdtempSync(path.join(os.tmpdir(), 's25-v11-overhaul-'));
    const before = ingest(V09_XLSX, 'v0.9-W5AD01-editorial', out09) as Array<
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
    expect(changed.size).toBeGreaterThan(100);
  });

  it('still regenerates the frozen v0.10 catalogue from the v0.10 workbook', () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 's25-v10-'));
    const generated = ingest(V10_XLSX, 'v0.10-W5AD01-editorial', outDir) as Array<{
      additive_id: string;
    }>;
    expect(generated).toHaveLength(315);
    expect(sha256File(V10_XLSX)).toBe(V10_SHA);
  });

  it('reproduces committed catalogue from v0.12 XLSX ingest', () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 's25-v12-overhaul-'));
    const generated = ingest(V12_XLSX, 'v0.12-W5AD01-editorial', outDir);
    expect(generated).toEqual(S25_CATALOGUE);
  });
});
