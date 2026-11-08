/**
 * W5-AD-01 Stage 2 — four-entry STANDARD commentary pilot integrity gates.
 * Compares working catalogue against approved baseline blob at 855f45b.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';
import {
  S25_CATALOGUE,
  assertAssetCounts,
  buildRenderList,
  mergeRenderedAdditives,
} from '../../../s25';
import {
  ALL_GOVERNED_BODY_ADDITIVE_IDS,
  COLOUR_CLUSTER_EVIDENCE_STORY,
  E171_SECTION,
  E250_SECTION,
  E951_SECTION,
} from '../../../config/bodyAdditivesL3Content';

const BASELINE_SHA = '855f45bca3873629811c30542a01ef7f7af617ff';
const PILOT_IDS = ['e120', 'e170', 'e471', 'e211'] as const;

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

type CatalogueEntry = (typeof S25_CATALOGUE)[number];

function loadBaselineCatalogue(): CatalogueEntry[] {
  // Decode as UTF-8 from the raw buffer so Windows code-page stdout cannot mojibake primes/dashes.
  const raw = execFileSync('git', ['show', `${BASELINE_SHA}:src/s25/assets/catalogue_315.json`], {
    maxBuffer: 20 * 1024 * 1024,
  });
  return JSON.parse(Buffer.from(raw).toString('utf8')) as CatalogueEntry[];
}

function protectedSnapshot(entry: CatalogueEntry): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(entry)) {
    if ((EDITORIAL_FIELDS as readonly string[]).includes(k)) continue;
    out[k] = v;
  }
  return out;
}

describe('W5-AD-01 Stage 2 commentary pilot integrity', () => {
  const baseline = loadBaselineCatalogue();
  const baselineById = new Map(baseline.map((e) => [e.additive_id, e]));
  const workingById = new Map(S25_CATALOGUE.map((e) => [e.additive_id, e]));

  it('preserves catalogue counts and unique IDs', () => {
    expect(assertAssetCounts()).toEqual({
      catalogue_rows: 315,
      standard_rows: 309,
      body6_rows: 6,
      evidence_enabled: 33,
      evidence_dual_source: 7,
      unique_additive_ids: 315,
      duplicate_additive_ids: 0,
    });
    expect(S25_CATALOGUE).toHaveLength(315);
    expect(baseline).toHaveLength(315);
  });

  it('targets exactly four STANDARD pilot IDs', () => {
    for (const id of PILOT_IDS) {
      const entry = workingById.get(id);
      expect(entry).toBeDefined();
      expect(entry!.presentation_treatment).toBe('STANDARD');
      expect(entry!.body6_existing).toBe(false);
    }
  });

  it('changes editorial fields only on the four pilot records', () => {
    const changedIds = new Set<string>();
    for (const entry of S25_CATALOGUE) {
      const base = baselineById.get(entry.additive_id);
      expect(base).toBeDefined();
      for (const field of EDITORIAL_FIELDS) {
        if (entry[field] !== base![field]) {
          changedIds.add(entry.additive_id);
        }
      }
    }
    expect([...changedIds].sort()).toEqual([...PILOT_IDS].sort());
  });

  it('leaves all protected fields unchanged on every record', () => {
    for (const entry of S25_CATALOGUE) {
      const base = baselineById.get(entry.additive_id)!;
      expect(protectedSnapshot(entry)).toEqual(protectedSnapshot(base));
    }
  });

  it('leaves the other 311 records value-identical to baseline', () => {
    for (const entry of S25_CATALOGUE) {
      if ((PILOT_IDS as readonly string[]).includes(entry.additive_id)) continue;
      const base = baselineById.get(entry.additive_id)!;
      expect(entry).toEqual(base);
    }
  });

  it('does not populate previously empty fact_3 slots on pilot rows', () => {
    for (const id of PILOT_IDS) {
      const base = baselineById.get(id)!;
      const entry = workingById.get(id)!;
      const baseEmpty =
        !(base.fact_3_label || '').trim() && !(base.fact_3_copy || '').trim();
      if (baseEmpty) {
        expect((entry.fact_3_label || '').trim()).toBe('');
        expect((entry.fact_3_copy || '').trim()).toBe('');
      }
    }
  });

  it('preserves Body-6 catalogue rows and locked L3 modules', () => {
    const body6 = S25_CATALOGUE.filter((e) => e.body6_existing);
    expect(body6).toHaveLength(6);
    for (const entry of body6) {
      expect(entry).toEqual(baselineById.get(entry.additive_id));
      expect(entry.presentation_treatment).toBe('BODY6_EXISTING');
    }
    expect(ALL_GOVERNED_BODY_ADDITIVE_IDS).toHaveLength(6);
    expect(COLOUR_CLUSTER_EVIDENCE_STORY.length).toBeGreaterThan(40);
    expect(E171_SECTION.title).toContain('E171');
    expect(E250_SECTION.title).toContain('E250');
    expect(E951_SECTION.title).toContain('E951');
  });

  it('preserves evidence metadata and URLs on pilot rows', () => {
    for (const id of PILOT_IDS) {
      const base = baselineById.get(id)!;
      const entry = workingById.get(id)!;
      expect(entry.evidence_enabled).toBe(base.evidence_enabled);
      expect(entry.evidence_source_count).toBe(base.evidence_source_count);
      expect(entry.evidence_source_1_link_label).toBe(base.evidence_source_1_link_label);
      expect(entry.evidence_source_1_url).toBe(base.evidence_source_1_url);
      expect(entry.evidence_source_2_link_label).toBe(base.evidence_source_2_link_label);
      expect(entry.evidence_source_2_url).toBe(base.evidence_source_2_url);
    }
  });

  it('keeps modal-facing object structure for pilot rows', () => {
    const merged = mergeRenderedAdditives({
      firedBodyLedgerIds: [],
      ingredientsText: 'Colour (120), acidity regulator (170), emulsifier (471), preservative (211)',
      additivesTags: ['en:e120', 'en:e170', 'en:e471', 'en:e211'],
    });
    const items = buildRenderList(merged);
    const ids = items.map((i) => i.additiveId).sort();
    expect(ids).toEqual([...PILOT_IDS].sort());
    for (const item of items) {
      expect(item.entry).toEqual(workingById.get(item.additiveId));
      expect(Object.keys(item.entry).sort()).toEqual(
        Object.keys(baselineById.get(item.additiveId)!).sort()
      );
    }
  });

  it('does not alter sibling S25 data assets on disk vs baseline', () => {
    // Data sheets remain baseline-identical. ingestion_manifest.json may carry
    // accurate v0.8 provenance after governed regeneration (asserted separately).
    const siblings = ['classes_25.json', 'source_profiles.json', 'surface_copy.json'];
    const assetsDir = path.join(__dirname, '../../../s25/assets');
    const normalize = (text: string) => text.replace(/\r\n/g, '\n');
    for (const name of siblings) {
      const working = fs.readFileSync(path.join(assetsDir, name), 'utf8');
      const baseBuf = execFileSync('git', ['show', `${BASELINE_SHA}:src/s25/assets/${name}`]);
      const base = Buffer.from(baseBuf).toString('utf8');
      // Compare semantic JSON identity; tolerate CRLF/LF checkout differences only.
      expect(JSON.parse(normalize(working))).toEqual(JSON.parse(normalize(base)));
    }
  });

  it('records accurate v0.8 ingestion provenance without claiming v0.7', () => {
    const assetsDir = path.join(__dirname, '../../../s25/assets');
    const manifest = JSON.parse(
      fs.readFileSync(path.join(assetsDir, 'ingestion_manifest.json'), 'utf8')
    ) as {
      asset_version: string;
      source_format: string;
      source_sha256?: string;
      source_path?: string;
      generator?: string;
      counts: Record<string, number>;
    };
    expect(manifest.asset_version).toBe('v0.8-W5AD01-editorial');
    expect(manifest.asset_version).not.toBe('v0.7');
    expect(manifest.source_format).toBe('xlsx');
    expect(manifest.source_sha256).toBe(
      '88cec7188385ec364f67ddc5742f45555f649defac430a5e80f7479902214fa2'
    );
    expect(manifest.source_path).toContain(
      'Rveel_S25_Broader_Additive_Catalogue_MVP_Implementation_Asset_W5AD01_editorial_v0_8.xlsx'
    );
    expect(manifest.generator).toMatch(/generate-s25-asset-runtime\.(ts|js)$/);
    expect(manifest.counts.catalogue_rows).toBe(315);
    expect(manifest.counts.standard_rows).toBe(309);
    expect(manifest.counts.body6_rows).toBe(6);
    expect(manifest.counts.evidence_enabled).toBe(33);
    expect(manifest.counts.evidence_dual_source).toBe(7);
  });
});
