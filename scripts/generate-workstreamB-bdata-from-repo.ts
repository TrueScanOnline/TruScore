/**
 * One-way export of existing repo benchmark JSON assets into B-Data CSV rows.
 * Does not modify scoring methodology — field mapping only.
 *
 * Sources:
 * - src/data/ethics/bbfaw2024Canonical.json + brandAliasMap.json (BBFAW)
 * - src/data/ethics/ktcParents.json + ktcBrandAliasMap.json (KTC)
 *
 * Run: npx ts-node --project scripts/tsconfig.json scripts/generate-workstreamB-bdata-from-repo.ts
 */

import fs from 'fs';
import path from 'path';
import { toCsv, type CsvRecord } from '../src/identity/workstreamA/csv';
import {
  WORKSTREAM_B_REQUIRED_COLUMNS,
} from '../src/workstreamB/frozenBenchmarkHardening/bDataTemplates';
import { WORKSTREAM_B_FILES } from '../src/workstreamB/frozenBenchmarkHardening/bDataFiles';

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'workstreamB', 'b-data', 'populated-from-repo-v0', 'input');

type BBFAWCanonical = {
  companies: Array<{
    companyName: string;
    tier: number;
    impactRating?: string;
    referenceUrl?: string;
    reportSection?: string;
    year?: number;
  }>;
};

type BrandAliasRow = {
  parent_entity_exact: string;
  canonical_brand: string;
  aliases_csv: string;
  brand_type?: string;
  au_nz_relevance?: string;
  mapping_confidence: string;
  seed_status: string;
  tier_2024?: number;
  impact_2024?: string;
  notes?: string;
};

type KTCRow = {
  company_id: number;
  benchmark_year_parent_company: string;
  country: string;
  region: string;
  subindustry: string;
  total_benchmark_score: number;
  rank_2025: number;
};

type KTCAliasRow = {
  benchmark_year_parent_company: string;
  canonical_brand: string;
  aliases_csv: string;
  current_parent_company?: string;
  ownership_alignment_status?: string;
  notes?: string;
};

function main(): void {
  const bbfawCanonical = require(path.join(
    ROOT,
    'src/data/ethics/bbfaw2024Canonical.json'
  )) as BBFAWCanonical;
  const brandAliasMap = require(path.join(
    ROOT,
    'src/data/ethics/brandAliasMap.json'
  )) as BrandAliasRow[];
  const ktcParents = require(path.join(ROOT, 'src/data/ethics/ktcParents.json')) as KTCRow[];
  const ktcBrandAliasMap = require(path.join(
    ROOT,
    'src/data/ethics/ktcBrandAliasMap.json'
  )) as KTCAliasRow[];

  const SNAPSHOT_BBFAW = 'bbfaw-2024-v1';
  const SNAPSHOT_KTC = 'ktc-2026-v1';

  const releases: CsvRecord[] = [
    {
      benchmark_name: 'BBFAW',
      benchmark_cycle: '2024',
      snapshot_version: SNAPSHOT_BBFAW,
      ownership_cutoff_date: '2024-06-30',
      freeze_status: 'frozen',
      methodology_ref: 'bbfaw-2024-method',
      seed_ref: 'bbfaw2024Canonical',
    },
    {
      benchmark_name: 'KTC',
      benchmark_cycle: '2026',
      snapshot_version: SNAPSHOT_KTC,
      ownership_cutoff_date: '2026-06-30',
      freeze_status: 'frozen',
      methodology_ref: 'ktc-2026-method',
      seed_ref: 'ktcParents',
    },
  ];

  /** BBFAW entities from canonical companies + any brand-map parents not already covered */
  const bbfawDisplaySet = new Set<string>();
  const entities: CsvRecord[] = [];

  bbfawCanonical.companies.forEach((c, idx) => {
    const id = `BBFAW-C-${String(idx).padStart(4, '0')}`;
    bbfawDisplaySet.add(c.companyName);
    entities.push({
      entity_id: id,
      benchmark_name: 'BBFAW',
      entity_kind: 'parent_company',
      display_name: c.companyName,
      benchmark_owner_entity_id: `frozen:bbfaw:${id}`,
      benchmark_owner_legal_name: c.companyName,
      notes: 'from_bbfaw2024Canonical.json',
    });
  });

  let bbfawMapOnly = 0;
  for (const row of brandAliasMap) {
    const d = row.parent_entity_exact.trim();
    if (!bbfawDisplaySet.has(d)) {
      bbfawDisplaySet.add(d);
      const id = `BBFAW-MAP-${String(bbfawMapOnly++).padStart(4, '0')}`;
      entities.push({
        entity_id: id,
        benchmark_name: 'BBFAW',
        entity_kind: 'parent_company',
        display_name: d,
        benchmark_owner_entity_id: `frozen:bbfaw:${id}`,
        benchmark_owner_legal_name: d,
        notes: 'from_brandAliasMap_only',
      });
    }
  }

  const ktcDisplaySet = new Set<string>();
  ktcParents.forEach((r, idx) => {
    const id = `KTC-C-${String(idx).padStart(4, '0')}`;
    ktcDisplaySet.add(r.benchmark_year_parent_company);
    entities.push({
      entity_id: id,
      benchmark_name: 'KTC',
      entity_kind: 'parent_company',
      display_name: r.benchmark_year_parent_company,
      benchmark_owner_entity_id: `frozen:ktc:${id}`,
      benchmark_owner_legal_name: r.benchmark_year_parent_company,
      notes: 'from_ktcParents.json',
    });
  });

  let ktcMapOnly = 0;
  for (const row of ktcBrandAliasMap) {
    const d = row.benchmark_year_parent_company.trim();
    if (!ktcDisplaySet.has(d)) {
      ktcDisplaySet.add(d);
      const id = `KTC-MAP-${String(ktcMapOnly++).padStart(4, '0')}`;
      entities.push({
        entity_id: id,
        benchmark_name: 'KTC',
        entity_kind: 'parent_company',
        display_name: d,
        benchmark_owner_entity_id: `frozen:ktc:${id}`,
        benchmark_owner_legal_name: d,
        notes: 'from_ktcBrandAliasMap_only',
      });
    }
  }

  const scores: CsvRecord[] = [];
  bbfawCanonical.companies.forEach((c, idx) => {
    const id = `BBFAW-C-${String(idx).padStart(4, '0')}`;
    scores.push({
      entity_id: id,
      benchmark_name: 'BBFAW',
      snapshot_version: SNAPSHOT_BBFAW,
      bbfaw_tier: String(c.tier),
      bbfaw_impact_rating: c.impactRating ?? '',
      ktc_total_benchmark_score: '',
      ktc_rank: '',
      reference_url: c.referenceUrl ?? '',
      year: String(c.year ?? 2024),
      source_lineage: `bbfaw2024Canonical.companies[${idx}]`,
    });
  });

  ktcParents.forEach((r, idx) => {
    const id = `KTC-C-${String(idx).padStart(4, '0')}`;
    scores.push({
      entity_id: id,
      benchmark_name: 'KTC',
      snapshot_version: SNAPSHOT_KTC,
      bbfaw_tier: '',
      bbfaw_impact_rating: '',
      ktc_total_benchmark_score: String(r.total_benchmark_score),
      ktc_rank: String(r.rank_2025),
      reference_url: '',
      year: '2025',
      source_lineage: `ktcParents.json[${idx}]`,
    });
  });

  const brandMaps: CsvRecord[] = brandAliasMap.map((row, i) => ({
    row_index: String(i),
    benchmark_name: 'BBFAW',
    snapshot_version: SNAPSHOT_BBFAW,
    parent_entity_exact: row.parent_entity_exact,
    canonical_brand: row.canonical_brand,
    aliases_csv: row.aliases_csv ?? '',
    brand_type: row.brand_type ?? '',
    au_nz_relevance: row.au_nz_relevance ?? '',
    mapping_confidence: row.mapping_confidence ?? '',
    seed_status: row.seed_status ?? '',
    tier_2024: row.tier_2024 != null ? String(row.tier_2024) : '',
    impact_2024: row.impact_2024 ?? '',
    notes: row.notes ?? '',
  }));

  const aliasMaps: CsvRecord[] = ktcBrandAliasMap.map((row, i) => ({
    row_index: String(i),
    benchmark_name: 'KTC',
    snapshot_version: SNAPSHOT_KTC,
    benchmark_year_parent_company: row.benchmark_year_parent_company,
    canonical_brand: row.canonical_brand,
    aliases_csv: row.aliases_csv ?? '',
    current_parent_company: row.current_parent_company ?? '',
    ownership_alignment_status: row.ownership_alignment_status ?? '',
    notes: row.notes ?? '',
  }));

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const write = (fname: (typeof WORKSTREAM_B_FILES)[keyof typeof WORKSTREAM_B_FILES], rows: CsvRecord[]) => {
    const headers = WORKSTREAM_B_REQUIRED_COLUMNS[fname];
    fs.writeFileSync(path.join(OUT_DIR, fname), toCsv(headers, rows), 'utf8');
  };

  write(WORKSTREAM_B_FILES.BENCHMARK_RELEASES, releases);
  write(WORKSTREAM_B_FILES.BENCHMARK_ENTITIES, entities);
  write(WORKSTREAM_B_FILES.BENCHMARK_SCORES, scores);
  write(WORKSTREAM_B_FILES.BENCHMARK_BRAND_MAPS, brandMaps);
  write(WORKSTREAM_B_FILES.BENCHMARK_ALIAS_MAPS, aliasMaps);

  const conversion_report = {
    generated_at: new Date().toISOString(),
    row_counts: {
      bbfaw2024Canonical_companies: bbfawCanonical.companies.length,
      brandAliasMap_rows: brandAliasMap.length,
      ktcParents_rows: ktcParents.length,
      ktcBrandAliasMap_rows: ktcBrandAliasMap.length,
      benchmark_entities_written: entities.length,
      benchmark_scores_written: scores.length,
    },
    assumptions: [
      'entity_id is synthetic stable slug (BBFAW-C-#### / KTC-C-####) plus MAP-* rows for parents only present in mapping JSON.',
      'Frozen benchmark owner fields mirror display_name from source JSON (no Workstream A inference).',
      'BBFAW score rows map 1:1 with bbfaw2024Canonical.companies order.',
      'KTC score rows map 1:1 with ktcParents order.',
    ],
  };
  fs.writeFileSync(
    path.join(ROOT, 'workstreamB', 'b-data', 'populated-from-repo-v0', 'conversion_report.json'),
    JSON.stringify(conversion_report, null, 2),
    'utf8'
  );

  // eslint-disable-next-line no-console
  console.log('Wrote Workstream B populated pack to', OUT_DIR);
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(conversion_report.row_counts, null, 2));
}

main();
