/**
 * W5-AD-01 Stage 2G — governed S25 ingest compatibility
 * (multiline evidence text + explicit asset-version provenance).
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFileSync } from 'child_process';

const REPO_ROOT = path.join(__dirname, '../../../..');
const GENERATOR = path.join(REPO_ROOT, 'scripts', 'generate-s25-asset-runtime.js');
const V08_XLSX = path.join(
  REPO_ROOT,
  'docs/development/w5-ad01/Rveel_S25_Broader_Additive_Catalogue_MVP_Implementation_Asset_W5AD01_editorial_v0_8.xlsx'
);
const V08_SHA256 = '88cec7188385ec364f67ddc5742f45555f649defac430a5e80f7479902214fa2';
const BASELINE_SHA = '855f45bca3873629811c30542a01ef7f7af617ff';

function sha256File(p: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
}

function gitJson(rel: string): unknown {
  const raw = execFileSync('git', ['show', `${BASELINE_SHA}:${rel}`], {
    cwd: REPO_ROOT,
    maxBuffer: 20 * 1024 * 1024,
  });
  return JSON.parse(Buffer.from(raw).toString('utf8'));
}

describe('S25 asset ingestion compatibility (Stage 2G)', () => {
  it('preserves E211 paragraph breaks and accurate v0.8 provenance via XLSX ingest', () => {
    expect(fs.existsSync(V08_XLSX)).toBe(true);
    expect(sha256File(V08_XLSX)).toBe(V08_SHA256);

    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 's25-ingest-v08-'));
    execFileSync(
      process.execPath,
      [
        GENERATOR,
        '--xlsx',
        V08_XLSX,
        '--asset-version',
        'v0.8-W5AD01-editorial',
        '--out-dir',
        outDir,
      ],
      { cwd: REPO_ROOT, encoding: 'utf8' }
    );

    const catalogue = JSON.parse(
      fs.readFileSync(path.join(outDir, 'catalogue_315.json'), 'utf8')
    ) as Array<{ additive_id: string; evidence_copy: string }>;
    const manifest = JSON.parse(
      fs.readFileSync(path.join(outDir, 'ingestion_manifest.json'), 'utf8')
    ) as {
      asset_version: string;
      source_format: string;
      source_sha256: string;
      source_path: string;
    };

    const e211 = catalogue.find((e) => e.additive_id === 'e211');
    expect(e211).toBeDefined();
    expect(e211!.evidence_copy.includes('\n\n')).toBe(true);
    expect(e211!.evidence_copy.includes('\\n\\n')).toBe(false);
    expect(e211!.evidence_copy.startsWith('An Australian total-diet study published in 2005')).toBe(
      true
    );

    const e120 = catalogue.find((e) => e.additive_id === 'e120');
    expect(e120!.evidence_copy.startsWith('Some people can have allergic reactions')).toBe(true);

    expect(manifest.asset_version).toBe('v0.8-W5AD01-editorial');
    expect(manifest.source_format).toBe('xlsx');
    expect(manifest.source_sha256).toBe(V08_SHA256);
    expect(manifest.source_path.replace(/\\/g, '/')).toContain(
      'Rveel_S25_Broader_Additive_Catalogue_MVP_Implementation_Asset_W5AD01_editorial_v0_8.xlsx'
    );

    for (const name of ['classes_25.json', 'source_profiles.json', 'surface_copy.json'] as const) {
      const generated = JSON.parse(fs.readFileSync(path.join(outDir, name), 'utf8'));
      expect(generated).toEqual(gitJson(`src/s25/assets/${name}`));
    }
  });

  it('refuses XLSX ingest without an explicit allowlisted --asset-version', () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 's25-ingest-reject-'));
    let failed = false;
    try {
      execFileSync(
        process.execPath,
        [GENERATOR, '--xlsx', V08_XLSX, '--out-dir', outDir],
        { cwd: REPO_ROOT, encoding: 'utf8' }
      );
    } catch {
      failed = true;
    }
    expect(failed).toBe(true);
  });
});
