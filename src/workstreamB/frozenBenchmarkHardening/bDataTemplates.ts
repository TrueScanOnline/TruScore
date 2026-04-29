import type { CsvRecord } from './bDataCsv';
import { toCsv } from './bDataCsv';
import {
  WORKSTREAM_B_FILES,
  WORKSTREAM_B_OPTIONAL_FILES,
  WORKSTREAM_B_REQUIRED_FILES,
  type WorkstreamBInputFileName,
} from './bDataFiles';

/** Columns that must be present for validation (subset of full schema where applicable). */
export const WORKSTREAM_B_REQUIRED_COLUMNS: Record<WorkstreamBInputFileName, readonly string[]> = {
  [WORKSTREAM_B_FILES.BENCHMARK_RELEASES]: [
    'benchmark_name',
    'benchmark_cycle',
    'snapshot_version',
    'ownership_cutoff_date',
    'freeze_status',
    'methodology_ref',
    'seed_ref',
  ],
  [WORKSTREAM_B_FILES.BENCHMARK_ENTITIES]: [
    'entity_id',
    'benchmark_name',
    'entity_kind',
    'display_name',
    'benchmark_owner_entity_id',
    'benchmark_owner_legal_name',
    'notes',
  ],
  [WORKSTREAM_B_FILES.BENCHMARK_SCORES]: [
    'entity_id',
    'benchmark_name',
    'snapshot_version',
    'bbfaw_tier',
    'bbfaw_impact_rating',
    'ktc_total_benchmark_score',
    'ktc_rank',
    'reference_url',
    'year',
    'source_lineage',
  ],
  [WORKSTREAM_B_FILES.BENCHMARK_BRAND_MAPS]: [
    'row_index',
    'benchmark_name',
    'snapshot_version',
    'parent_entity_exact',
    'canonical_brand',
    'aliases_csv',
    'brand_type',
    'au_nz_relevance',
    'mapping_confidence',
    'seed_status',
    'tier_2024',
    'impact_2024',
    'notes',
  ],
  [WORKSTREAM_B_FILES.BENCHMARK_ALIAS_MAPS]: [
    'row_index',
    'benchmark_name',
    'snapshot_version',
    'benchmark_year_parent_company',
    'canonical_brand',
    'aliases_csv',
    'current_parent_company',
    'ownership_alignment_status',
    'notes',
  ],
  [WORKSTREAM_B_FILES.BENCHMARK_TO_A_IDENTITY_CROSSWALK]: [
    'entity_id',
    'a_parent_id',
    'a_brand_id',
    'notes',
  ],
  [WORKSTREAM_B_FILES.BENCHMARK_EXCEPTIONS]: [
    'exception_id',
    'benchmark_name',
    'entity_ref',
    'exception_type',
    'notes',
  ],
  [WORKSTREAM_B_FILES.BENCHMARK_CORRECTION_LOG]: [
    'correction_id',
    'benchmark_name',
    'entity_id',
    'prior_snapshot_version',
    'new_snapshot_version',
    'rationale',
    'approver_ref',
  ],
};

const TEMPLATE_RELEASES: CsvRecord[] = [
  {
    benchmark_name: 'BBFAW',
    benchmark_cycle: '2024',
    snapshot_version: 'bbfaw-2024-v1',
    ownership_cutoff_date: '2024-06-30',
    freeze_status: 'frozen',
    methodology_ref: 'bbfaw-2024-method',
    seed_ref: 'bbfaw2024Canonical',
  },
  {
    benchmark_name: 'KTC',
    benchmark_cycle: '2026',
    snapshot_version: 'ktc-2026-v1',
    ownership_cutoff_date: '2026-06-30',
    freeze_status: 'frozen',
    methodology_ref: 'ktc-2026-method',
    seed_ref: 'ktcParents',
  },
];

const TEMPLATE_ENTITY: CsvRecord[] = [
  {
    entity_id: 'TEMPLATE_BBFAW_ENTITY',
    benchmark_name: 'BBFAW',
    entity_kind: 'parent_company',
    display_name: 'Example Parent PLC',
    benchmark_owner_entity_id: 'frozen_owner:template_bbfaw',
    benchmark_owner_legal_name: 'Example Parent PLC',
    notes: 'template_only',
  },
];

const TEMPLATE_SCORE: CsvRecord[] = [
  {
    entity_id: 'TEMPLATE_BBFAW_ENTITY',
    benchmark_name: 'BBFAW',
    snapshot_version: 'bbfaw-2024-v1',
    bbfaw_tier: '2',
    bbfaw_impact_rating: 'B',
    ktc_total_benchmark_score: '',
    ktc_rank: '',
    reference_url: '',
    year: '2024',
    source_lineage: 'template',
  },
];

/** Minimal CSV map for smoke/template packs. */
export function buildTemplateCsvMap(): Record<WorkstreamBInputFileName, string> {
  const out: Partial<Record<WorkstreamBInputFileName, string>> = {};

  out[WORKSTREAM_B_FILES.BENCHMARK_RELEASES] = toCsv(
    WORKSTREAM_B_REQUIRED_COLUMNS[WORKSTREAM_B_FILES.BENCHMARK_RELEASES],
    TEMPLATE_RELEASES
  );
  out[WORKSTREAM_B_FILES.BENCHMARK_ENTITIES] = toCsv(
    WORKSTREAM_B_REQUIRED_COLUMNS[WORKSTREAM_B_FILES.BENCHMARK_ENTITIES],
    TEMPLATE_ENTITY
  );
  out[WORKSTREAM_B_FILES.BENCHMARK_SCORES] = toCsv(
    WORKSTREAM_B_REQUIRED_COLUMNS[WORKSTREAM_B_FILES.BENCHMARK_SCORES],
    TEMPLATE_SCORE
  );
  out[WORKSTREAM_B_FILES.BENCHMARK_BRAND_MAPS] = toCsv(
    WORKSTREAM_B_REQUIRED_COLUMNS[WORKSTREAM_B_FILES.BENCHMARK_BRAND_MAPS],
    []
  );
  out[WORKSTREAM_B_FILES.BENCHMARK_ALIAS_MAPS] = toCsv(
    WORKSTREAM_B_REQUIRED_COLUMNS[WORKSTREAM_B_FILES.BENCHMARK_ALIAS_MAPS],
    []
  );

  for (const f of WORKSTREAM_B_OPTIONAL_FILES) {
    out[f] = toCsv(WORKSTREAM_B_REQUIRED_COLUMNS[f], []);
  }

  return out as Record<WorkstreamBInputFileName, string>;
}

export function listRequiredTemplateFiles(): readonly WorkstreamBInputFileName[] {
  return WORKSTREAM_B_REQUIRED_FILES;
}
