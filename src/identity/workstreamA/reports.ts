import type { CsvRecord } from './csv';
import { buildCatalogueCoverageMetrics } from './catalogueAudit';
import { WORKSTREAM_A_FILES } from './schema';

export interface ValidationSummaryRow {
  report_generated_at: string;
  file_name: string;
  validation_rule: string;
  status: 'pass' | 'warning' | 'fail';
  issue_count: number;
  issue_examples: string;
  blocking_y_n: 'Y' | 'N';
}

export interface WorkstreamAValidationSummary {
  report_generated_at: string;
  rows: ValidationSummaryRow[];
}

export interface ValidationIssueLike {
  file: string;
  rule: string;
  level: 'error' | 'warning';
  message: string;
}

export interface WorkstreamACoverageScorecard {
  report_generated_at: string;
  canonical_parent_count: number;
  canonical_brand_count: number;
  alias_count: number;
  gtin_link_count: number;
  operational_entity_count: number;
  open_change_candidate_count: number;
  review_state_summary: Record<string, number>;
  wave_status_summary: Record<string, number>;
  catalogue_audit_summary: {
    total_rows: number;
    matched_canonical_brand: number;
    matched_alias: number;
    unmatched_rows: number;
  };
  launch_usefulness_note: string;
}

export interface WorkstreamAIdentityGapReport {
  report_generated_at: string;
  unmapped_gtin_count: number;
  high_priority_brand_gap_count: number;
  high_priority_parent_gap_count: number;
  open_dispute_count: number;
  review_backlog_count: number;
  candidate_parent_count: number;
  candidate_alias_count: number;
  top_gap_notes: string[];
}

function countByState(rows: readonly CsvRecord[], key: string): Record<string, number> {
  const summary: Record<string, number> = {};
  for (const row of rows) {
    const state = row[key] ?? '';
    if (!state) {
      continue;
    }
    summary[state] = (summary[state] ?? 0) + 1;
  }
  return summary;
}

export function buildValidationSummary(
  issues: readonly ValidationIssueLike[],
  reportGeneratedAt = new Date().toISOString()
): WorkstreamAValidationSummary {
  const grouped = new Map<string, ValidationIssueLike[]>();
  for (const issue of issues) {
    const key = `${issue.file}::${issue.rule}`;
    const bucket = grouped.get(key) ?? [];
    bucket.push(issue);
    grouped.set(key, bucket);
  }

  const rows: ValidationSummaryRow[] = [];
  for (const [groupKey, bucket] of grouped) {
    const [fileName, rule] = groupKey.split('::');
    const hasError = bucket.some((b) => b.level === 'error');
    rows.push({
      report_generated_at: reportGeneratedAt,
      file_name: fileName,
      validation_rule: rule,
      status: hasError ? 'fail' : 'warning',
      issue_count: bucket.length,
      issue_examples: bucket.slice(0, 3).map((b) => b.message).join(' | '),
      blocking_y_n: hasError ? 'Y' : 'N',
    });
  }

  if (rows.length === 0) {
    rows.push({
      report_generated_at: reportGeneratedAt,
      file_name: 'all',
      validation_rule: 'no_issues',
      status: 'pass',
      issue_count: 0,
      issue_examples: '',
      blocking_y_n: 'N',
    });
  }

  return { report_generated_at: reportGeneratedAt, rows };
}

export function buildCoverageScorecard(input: {
  rowsByFile: Partial<Record<string, CsvRecord[]>>;
  launchUsefulnessNote?: string;
  reportGeneratedAt?: string;
}): WorkstreamACoverageScorecard {
  const generatedAt = input.reportGeneratedAt ?? new Date().toISOString();
  const parents = input.rowsByFile[WORKSTREAM_A_FILES.CANONICAL_PARENTS] ?? [];
  const brands = input.rowsByFile[WORKSTREAM_A_FILES.CANONICAL_BRANDS] ?? [];
  const aliases = input.rowsByFile[WORKSTREAM_A_FILES.BRAND_ALIASES] ?? [];
  const gtinLinks = input.rowsByFile[WORKSTREAM_A_FILES.GTIN_BRAND_LINKS] ?? [];
  const operationalEntities = input.rowsByFile[WORKSTREAM_A_FILES.OPERATIONAL_ENTITIES] ?? [];
  const changes = input.rowsByFile[WORKSTREAM_A_FILES.OWNERSHIP_CHANGE_CANDIDATES] ?? [];
  const controlSurface = input.rowsByFile[WORKSTREAM_A_FILES.WAVE1_CONTROL_SURFACE] ?? [];
  const catalogue = input.rowsByFile[WORKSTREAM_A_FILES.CATALOGUE_AUDIT_OBSERVATIONS] ?? [];

  return {
    report_generated_at: generatedAt,
    canonical_parent_count: parents.length,
    canonical_brand_count: brands.length,
    alias_count: aliases.length,
    gtin_link_count: gtinLinks.length,
    operational_entity_count: operationalEntities.length,
    open_change_candidate_count: changes.filter((row) => row.candidate_state !== 'approved').length,
    review_state_summary: {
      ...countByState(parents, 'review_state'),
      ...countByState(brands, 'review_state'),
    },
    wave_status_summary: countByState(controlSurface, 'brand_population_status'),
    catalogue_audit_summary: buildCatalogueCoverageMetrics(catalogue as any),
    launch_usefulness_note: input.launchUsefulnessNote ?? 'Scaffold coverage report generated from supplied pack.',
  };
}

export function buildIdentityGapReport(input: {
  rowsByFile: Partial<Record<string, CsvRecord[]>>;
  topGapNotes?: string[];
  reportGeneratedAt?: string;
}): WorkstreamAIdentityGapReport {
  const generatedAt = input.reportGeneratedAt ?? new Date().toISOString();
  const gtinLinks = input.rowsByFile[WORKSTREAM_A_FILES.GTIN_BRAND_LINKS] ?? [];
  const controlSurface = input.rowsByFile[WORKSTREAM_A_FILES.WAVE1_CONTROL_SURFACE] ?? [];
  const changes = input.rowsByFile[WORKSTREAM_A_FILES.OWNERSHIP_CHANGE_CANDIDATES] ?? [];
  const aliasCandidates = input.rowsByFile[WORKSTREAM_A_FILES.ALIAS_HARVEST_CANDIDATES] ?? [];
  const parentCandidates = input.rowsByFile[WORKSTREAM_A_FILES.PARENT_EXTENSION_CANDIDATES] ?? [];

  return {
    report_generated_at: generatedAt,
    unmapped_gtin_count: gtinLinks.filter((row) => !row.brand_id).length,
    high_priority_brand_gap_count: controlSurface.filter((row) => row.gap_status === 'missing_brand').length,
    high_priority_parent_gap_count: controlSurface.filter((row) => row.gap_status === 'missing_parent').length,
    open_dispute_count: controlSurface.filter((row) => row.review_state === 'disputed').length,
    review_backlog_count: changes.filter(
      (row) => row.candidate_state === 'detected' || row.candidate_state === 'under_review'
    ).length,
    candidate_parent_count: parentCandidates.length,
    candidate_alias_count: aliasCandidates.length,
    top_gap_notes: input.topGapNotes ?? [],
  };
}

export function buildCandidateQueueSummary(rowsByFile: Partial<Record<string, CsvRecord[]>>): Record<string, number> {
  return {
    alias_harvest_candidates: (rowsByFile[WORKSTREAM_A_FILES.ALIAS_HARVEST_CANDIDATES] ?? []).length,
    parent_extension_candidates: (rowsByFile[WORKSTREAM_A_FILES.PARENT_EXTENSION_CANDIDATES] ?? []).length,
    ownership_change_candidates: (rowsByFile[WORKSTREAM_A_FILES.OWNERSHIP_CHANGE_CANDIDATES] ?? []).length,
  };
}
