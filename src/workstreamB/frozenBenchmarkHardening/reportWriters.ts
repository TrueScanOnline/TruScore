import fs from 'fs';
import type { WorkstreamBValidationResult } from './bDataValidation';
import type { FreezeGuardDiagnosticsResult } from './freezeGuardDiagnostics';
import type { ScoringReadDiagnosticsResult } from './scoringReadDiagnostics';
import { WORKSTREAM_B_OUTPUT_FILES } from './bDataFiles';

export interface ValidationSummaryJson {
  ok: boolean;
  issue_counts: { errors: number; warnings: number };
  correction_row_count: number;
  crosswalk_absent: boolean;
  generated_at: string;
}

export function buildValidationSummary(v: WorkstreamBValidationResult): ValidationSummaryJson {
  const errors = v.issues.filter((i) => i.level === 'error').length;
  const warnings = v.issues.filter((i) => i.level === 'warning').length;
  return {
    ok: v.ok,
    issue_counts: { errors, warnings },
    correction_row_count: v.correction_row_count,
    crosswalk_absent: v.crosswalk_absent,
    generated_at: new Date().toISOString(),
  };
}

export interface FrozenBenchmarkDiagnosticsJson {
  generated_at: string;
  freeze_guards: FreezeGuardDiagnosticsResult;
  scoring_read: ScoringReadDiagnosticsResult;
}

export function writeWorkstreamBReports(
  outputRoot: string,
  input: {
    loadFailure: Record<string, unknown>;
    validation: { validation: WorkstreamBValidationResult; validationSummary: ValidationSummaryJson };
    frozenDiagnostics: FrozenBenchmarkDiagnosticsJson;
  }
): {
  loadFailurePath: string;
  validationPath: string;
  frozenPath: string;
  summaryPath: string;
} {
  const loadFailurePath = `${outputRoot}/${WORKSTREAM_B_OUTPUT_FILES.LOAD_FAILURE_REPORT}`;
  const validationPath = `${outputRoot}/${WORKSTREAM_B_OUTPUT_FILES.VALIDATION_REPORT}`;
  const frozenPath = `${outputRoot}/${WORKSTREAM_B_OUTPUT_FILES.FROZEN_BENCHMARK_DIAGNOSTICS}`;
  const summaryPath = `${outputRoot}/${WORKSTREAM_B_OUTPUT_FILES.VALIDATION_SUMMARY}`;

  fs.writeFileSync(loadFailurePath, JSON.stringify(input.loadFailure, null, 2), 'utf8');
  fs.writeFileSync(validationPath, JSON.stringify(input.validation, null, 2), 'utf8');
  fs.writeFileSync(frozenPath, JSON.stringify(input.frozenDiagnostics, null, 2), 'utf8');
  fs.writeFileSync(summaryPath, JSON.stringify(input.validation.validationSummary, null, 2), 'utf8');

  return { loadFailurePath, validationPath, frozenPath, summaryPath };
}
