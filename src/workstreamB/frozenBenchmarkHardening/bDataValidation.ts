import type { CsvRecord } from './bDataCsv';
import {
  WORKSTREAM_B_FILES,
  WORKSTREAM_B_OPTIONAL_FILES,
  WORKSTREAM_B_REQUIRED_FILES,
  type WorkstreamBInputFileName,
} from './bDataFiles';
import { WORKSTREAM_B_REQUIRED_COLUMNS } from './bDataTemplates';
import {
  entityFromRecord,
  releaseFromRecord,
  scoreFromRecord,
} from './bDataTypes';
import { FREEZE_STATUSES } from '../../contracts/phase6/enums';
import { selectBenchmarkSnapshot } from '../../benchmark/snapshotSelect';

export type ValidationIssueLevel = 'error' | 'warning';

export interface ValidationIssue {
  level: ValidationIssueLevel;
  rule: string;
  message: string;
  file?: WorkstreamBInputFileName;
  row?: number;
}

export interface WorkstreamBValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
  missing_required_files: WorkstreamBInputFileName[];
  correction_row_count: number;
  crosswalk_absent: boolean;
}

const BENCHMARK_NAMES = new Set(['BBFAW', 'KTC']);
const ENTITY_KINDS = new Set(['parent_company', 'brand_label', 'other']);

function headerKeys(firstRow: CsvRecord | undefined, file: WorkstreamBInputFileName): string[] {
  if (!firstRow) return [];
  return Object.keys(firstRow);
}

function checkRequiredColumns(
  file: WorkstreamBInputFileName,
  rows: CsvRecord[],
  issues: ValidationIssue[]
): void {
  const required = WORKSTREAM_B_REQUIRED_COLUMNS[file];
  const keysFromData = new Set(headerKeys(rows[0], file));
  if (rows.length === 0) {
    /** Headers-only: parseCsv drops header-only files to 0 rows — cannot infer columns; loader wrote file → assume columns OK if file exists. */
    return;
  }
  for (const col of required) {
    if (!keysFromData.has(col)) {
      issues.push({
        level: 'error',
        rule: 'required_column_presence',
        file,
        message: `Missing column "${col}" (present keys: ${[...keysFromData].join(', ')})`,
      });
    }
  }
}

export function validateWorkstreamBPack(input: {
  mode: 'template' | 'populated';
  rowsByFile: Partial<Record<WorkstreamBInputFileName, CsvRecord[]>>;
  missingRequiredFromLoader?: WorkstreamBInputFileName[];
  requireCrosswalk?: boolean;
}): WorkstreamBValidationResult {
  const issues: ValidationIssue[] = [];
  const missing_required_files: WorkstreamBInputFileName[] = [...(input.missingRequiredFromLoader ?? [])];

  for (const f of WORKSTREAM_B_REQUIRED_FILES) {
    if (!input.rowsByFile[f] && !missing_required_files.includes(f)) {
      missing_required_files.push(f);
    }
  }

  if (missing_required_files.length > 0) {
    for (const f of missing_required_files) {
      issues.push({
        level: 'error',
        rule: 'required_file_presence',
        file: f,
        message: `Required file missing: ${f}`,
      });
    }
    return {
      ok: false,
      issues,
      missing_required_files,
      correction_row_count: 0,
      crosswalk_absent: true,
    };
  }

  const rowsByFile = input.rowsByFile;

  for (const f of [...WORKSTREAM_B_REQUIRED_FILES, ...WORKSTREAM_B_OPTIONAL_FILES] as WorkstreamBInputFileName[]) {
    const rows = rowsByFile[f];
    if (!rows) continue;
    checkRequiredColumns(f, rows, issues);
  }

  const releases = (rowsByFile[WORKSTREAM_B_FILES.BENCHMARK_RELEASES] ?? []).map(releaseFromRecord);
  const entities = (rowsByFile[WORKSTREAM_B_FILES.BENCHMARK_ENTITIES] ?? []).map(entityFromRecord);
  const scores = (rowsByFile[WORKSTREAM_B_FILES.BENCHMARK_SCORES] ?? []).map(scoreFromRecord);

  const entityById = new Map(entities.map((e) => [e.entity_id, e]));

  for (let i = 0; i < releases.length; i += 1) {
    const r = releases[i];
    const rowNum = i + 2;
    if (!BENCHMARK_NAMES.has(r.benchmark_name)) {
      issues.push({
        level: 'error',
        rule: 'benchmark_name_enum',
        file: WORKSTREAM_B_FILES.BENCHMARK_RELEASES,
        row: rowNum,
        message: `benchmark_name must be BBFAW or KTC, got "${r.benchmark_name}"`,
      });
    }
    if (!(FREEZE_STATUSES as readonly string[]).includes(r.freeze_status)) {
      issues.push({
        level: 'error',
        rule: 'freeze_status_enum',
        file: WORKSTREAM_B_FILES.BENCHMARK_RELEASES,
        row: rowNum,
        message: `Invalid freeze_status "${r.freeze_status}"`,
      });
    }

    if (r.benchmark_name === 'BBFAW' || r.benchmark_name === 'KTC') {
      try {
        const expected = selectBenchmarkSnapshot(r.benchmark_name as 'BBFAW' | 'KTC');
        if (expected.snapshot_version !== r.snapshot_version) {
          issues.push({
            level: 'warning',
            rule: 'snapshot_registry_coherence',
            file: WORKSTREAM_B_FILES.BENCHMARK_RELEASES,
            row: rowNum,
            message: `snapshot_version "${r.snapshot_version}" differs from in-repo registry "${expected.snapshot_version}" for ${r.benchmark_name}`,
          });
        }
        if (expected.seed_ref !== r.seed_ref) {
          issues.push({
            level: 'warning',
            rule: 'seed_ref_coherence',
            file: WORKSTREAM_B_FILES.BENCHMARK_RELEASES,
            row: rowNum,
            message: `seed_ref "${r.seed_ref}" differs from registry seed_ref "${expected.seed_ref}"`,
          });
        }
      } catch {
        /* ignore */
      }
    }
  }

  const releaseKeys = new Set<string>();
  for (const r of releases) {
    const k = `${r.benchmark_name}|${r.snapshot_version}`;
    if (releaseKeys.has(k)) {
      issues.push({
        level: 'error',
        rule: 'release_uniqueness',
        file: WORKSTREAM_B_FILES.BENCHMARK_RELEASES,
        message: `Duplicate release key ${k}`,
      });
    }
    releaseKeys.add(k);
  }

  const entityIds = new Set<string>();
  for (let i = 0; i < entities.length; i += 1) {
    const e = entities[i];
    const rowNum = i + 2;
    if (!e.entity_id.trim()) {
      issues.push({
        level: 'error',
        rule: 'entity_id_present',
        file: WORKSTREAM_B_FILES.BENCHMARK_ENTITIES,
        row: rowNum,
        message: 'entity_id is empty',
      });
    }
    if (entityIds.has(e.entity_id)) {
      issues.push({
        level: 'error',
        rule: 'entity_id_unique',
        file: WORKSTREAM_B_FILES.BENCHMARK_ENTITIES,
        row: rowNum,
        message: `Duplicate entity_id ${e.entity_id}`,
      });
    }
    entityIds.add(e.entity_id);
    if (!BENCHMARK_NAMES.has(e.benchmark_name)) {
      issues.push({
        level: 'error',
        rule: 'entity_benchmark_name',
        file: WORKSTREAM_B_FILES.BENCHMARK_ENTITIES,
        row: rowNum,
        message: `Invalid benchmark_name "${e.benchmark_name}"`,
      });
    }
    if (!ENTITY_KINDS.has(e.entity_kind)) {
      issues.push({
        level: 'error',
        rule: 'entity_kind_enum',
        file: WORKSTREAM_B_FILES.BENCHMARK_ENTITIES,
        row: rowNum,
        message: `entity_kind must be one of parent_company|brand_label|other`,
      });
    }
    if (!e.benchmark_owner_entity_id.trim() || !e.benchmark_owner_legal_name.trim()) {
      issues.push({
        level: 'error',
        rule: 'frozen_owner_fields',
        file: WORKSTREAM_B_FILES.BENCHMARK_ENTITIES,
        row: rowNum,
        message: 'benchmark_owner_entity_id and benchmark_owner_legal_name are required (frozen benchmark facts)',
      });
    }
  }

  for (let i = 0; i < scores.length; i += 1) {
    const s = scores[i];
    const rowNum = i + 2;
    const ent = entityById.get(s.entity_id);
    if (!ent) {
      issues.push({
        level: 'error',
        rule: 'score_entity_fk',
        file: WORKSTREAM_B_FILES.BENCHMARK_SCORES,
        row: rowNum,
        message: `Unknown entity_id "${s.entity_id}"`,
      });
    } else if (ent.benchmark_name !== s.benchmark_name) {
      issues.push({
        level: 'error',
        rule: 'score_benchmark_alignment',
        file: WORKSTREAM_B_FILES.BENCHMARK_SCORES,
        row: rowNum,
        message: `benchmark_name mismatch entity vs score row`,
      });
    }
    const relKey = `${s.benchmark_name}|${s.snapshot_version}`;
    if (!releaseKeys.has(relKey)) {
      issues.push({
        level: 'error',
        rule: 'score_release_fk',
        file: WORKSTREAM_B_FILES.BENCHMARK_SCORES,
        row: rowNum,
        message: `No benchmark_releases row for ${relKey}`,
      });
    }
  }

  const displayNamesByBench = new Map<string, Set<string>>();
  for (const e of entities) {
    const dn = e.display_name.trim();
    if (!dn) continue;
    if (!displayNamesByBench.has(e.benchmark_name)) displayNamesByBench.set(e.benchmark_name, new Set());
    displayNamesByBench.get(e.benchmark_name)!.add(dn);
  }

  const brandRows = rowsByFile[WORKSTREAM_B_FILES.BENCHMARK_BRAND_MAPS] ?? [];
  for (let i = 0; i < brandRows.length; i += 1) {
    const row = brandRows[i];
    const parent = row.parent_entity_exact?.trim() ?? '';
    const bm = row.benchmark_name ?? '';
    if (bm === 'BBFAW' && parent) {
      const set = displayNamesByBench.get('BBFAW');
      if (set && !set.has(parent)) {
        issues.push({
          level: 'error',
          rule: 'brand_map_parent_entity_fk',
          file: WORKSTREAM_B_FILES.BENCHMARK_BRAND_MAPS,
          row: i + 2,
          message: `parent_entity_exact "${parent}" has no matching benchmark_entities.display_name for BBFAW`,
        });
      }
    }
  }

  const aliasRows = rowsByFile[WORKSTREAM_B_FILES.BENCHMARK_ALIAS_MAPS] ?? [];
  for (let i = 0; i < aliasRows.length; i += 1) {
    const row = aliasRows[i];
    const p = row.benchmark_year_parent_company?.trim() ?? '';
    const bm = row.benchmark_name ?? '';
    if (bm === 'KTC' && p) {
      const set = displayNamesByBench.get('KTC');
      if (set && !set.has(p)) {
        issues.push({
          level: 'error',
          rule: 'alias_map_parent_fk',
          file: WORKSTREAM_B_FILES.BENCHMARK_ALIAS_MAPS,
          row: i + 2,
          message: `benchmark_year_parent_company "${p}" has no matching benchmark_entities.display_name for KTC`,
        });
      }
    }
  }

  const crosswalkRows = rowsByFile[WORKSTREAM_B_FILES.BENCHMARK_TO_A_IDENTITY_CROSSWALK];
  const crosswalk_absent = !crosswalkRows;
  if (crosswalk_absent) {
    issues.push({
      level: input.requireCrosswalk ? 'error' : 'warning',
      rule: 'crosswalk_optional_absent',
      file: WORKSTREAM_B_FILES.BENCHMARK_TO_A_IDENTITY_CROSSWALK,
      message: input.requireCrosswalk
        ? 'crosswalk required for this run but missing'
        : 'benchmark_to_a_identity_crosswalk.csv absent — A-linked checks skipped',
    });
  } else {
    for (let i = 0; i < crosswalkRows!.length; i += 1) {
      const cw = crosswalkRows![i];
      const eid = cw.entity_id?.trim() ?? '';
      if (eid && !entityById.has(eid)) {
        issues.push({
          level: 'error',
          rule: 'crosswalk_entity_fk',
          file: WORKSTREAM_B_FILES.BENCHMARK_TO_A_IDENTITY_CROSSWALK,
          row: i + 2,
          message: `Unknown entity_id "${eid}" in crosswalk`,
        });
      }
    }
  }

  const correctionRows = rowsByFile[WORKSTREAM_B_FILES.BENCHMARK_CORRECTION_LOG] ?? [];
  const correction_row_count = correctionRows.length;
  for (let i = 0; i < correctionRows.length; i += 1) {
    const c = correctionRows[i];
    const prior = c.prior_snapshot_version?.trim() ?? '';
    const next = c.new_snapshot_version?.trim() ?? '';
    if (!c.correction_id?.trim() || !c.benchmark_name?.trim() || !c.entity_id?.trim()) {
      issues.push({
        level: 'error',
        rule: 'correction_required_fields',
        file: WORKSTREAM_B_FILES.BENCHMARK_CORRECTION_LOG,
        row: i + 2,
        message: 'correction_id, benchmark_name, entity_id are required',
      });
    }
    if (prior === next) {
      issues.push({
        level: 'error',
        rule: 'correction_version_distinct',
        file: WORKSTREAM_B_FILES.BENCHMARK_CORRECTION_LOG,
        row: i + 2,
        message: 'new_snapshot_version must differ from prior_snapshot_version',
      });
    }
  }

  const hasError = issues.some((x) => x.level === 'error');
  return {
    ok: !hasError,
    issues,
    missing_required_files,
    correction_row_count,
    crosswalk_absent,
  };
}
