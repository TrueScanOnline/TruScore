import fs from 'fs';
import path from 'path';
import { toCsv } from './csv';
import { loadWorkstreamAPackFromCsv } from './loader';
import { buildTemplateCsvMap, WORKSTREAM_A_COLUMNS } from './templates';
import { validateWorkstreamAPack } from './validation';
import {
  buildCandidateQueueSummary,
  buildCoverageScorecard,
  buildIdentityGapReport,
  buildValidationSummary,
} from './reports';
import { WORKSTREAM_A_FILES, type WorkstreamAFileName } from './schema';

export interface WorkstreamAScaffoldRunOptions {
  mode: 'template' | 'populated';
  launchUsefulnessNote?: string;
  topGapNotes?: string[];
}

export interface WorkstreamAScaffoldRunResult {
  ok: boolean;
  outputRoot: string;
  validationReportPath: string;
  loadFailureReportPath: string;
  coverageScorecardPath: string;
  identityGapReportPath: string;
  catalogueCoverageReportPath: string;
  candidateQueueSummary: Record<string, number>;
}

export function ensureDirectory(directoryPath: string): void {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

export function writeTemplatePack(packRoot: string): void {
  const inputRoot = path.join(packRoot, 'input');
  ensureDirectory(inputRoot);
  const templates = buildTemplateCsvMap();
  for (const [fileName, csvText] of Object.entries(templates) as [WorkstreamAFileName, string][]) {
    fs.writeFileSync(path.join(inputRoot, fileName), csvText, 'utf8');
  }
}

export function runWorkstreamAScaffold(
  packRoot: string,
  options: WorkstreamAScaffoldRunOptions
): WorkstreamAScaffoldRunResult {
  const loadResult = loadWorkstreamAPackFromCsv(packRoot);
  ensureDirectory(loadResult.outputRoot);

  const validation = validateWorkstreamAPack({
    mode: options.mode,
    rowsByFile: loadResult.rowsByFile,
  });
  const validationSummary = buildValidationSummary(validation.issues);
  const coverage = buildCoverageScorecard({
    rowsByFile: loadResult.rowsByFile,
    launchUsefulnessNote: options.launchUsefulnessNote,
  });
  const gapReport = buildIdentityGapReport({
    rowsByFile: loadResult.rowsByFile,
    topGapNotes: options.topGapNotes,
  });
  const candidateSummary = buildCandidateQueueSummary(loadResult.rowsByFile);

  const validationReportPath = path.join(loadResult.outputRoot, 'validation_report.json');
  const loadFailureReportPath = path.join(loadResult.outputRoot, 'load_failure_report.json');
  const coverageScorecardPath = path.join(loadResult.outputRoot, 'coverage_scorecard.json');
  const identityGapReportPath = path.join(loadResult.outputRoot, 'identity_gap_report.json');
  const catalogueCoverageReportPath = path.join(loadResult.outputRoot, 'catalogue_coverage_report.csv');

  const loadFailureReport = {
    report_generated_at: new Date().toISOString(),
    ok:
      loadResult.missingRequiredFiles.length === 0 &&
      validation.missing_required_files.length === 0,
    missing_required_input_files: loadResult.missingRequiredFiles,
    missing_optional_input_files: loadResult.missingOptionalFiles,
    missing_required_files_from_validation: validation.missing_required_files,
    load_errors: [
      ...loadResult.missingRequiredFiles.map((f) => ({
        severity: 'error' as const,
        file: f,
        message: 'Required input file not found under input/.',
      })),
    ],
  };
  fs.writeFileSync(loadFailureReportPath, JSON.stringify(loadFailureReport, null, 2), 'utf8');

  fs.writeFileSync(validationReportPath, JSON.stringify({ validation, validationSummary }, null, 2), 'utf8');
  fs.writeFileSync(coverageScorecardPath, JSON.stringify(coverage, null, 2), 'utf8');
  fs.writeFileSync(identityGapReportPath, JSON.stringify({ ...gapReport, candidate_queue_summary: candidateSummary }, null, 2), 'utf8');

  const catalogueRows = (loadResult.rowsByFile[WORKSTREAM_A_FILES.CATALOGUE_AUDIT_OBSERVATIONS] ?? []).map((row) => ({
    ...row,
  }));
  fs.writeFileSync(
    catalogueCoverageReportPath,
    toCsv(WORKSTREAM_A_COLUMNS[WORKSTREAM_A_FILES.CATALOGUE_AUDIT_OBSERVATIONS], catalogueRows),
    'utf8'
  );

  return {
    ok: validation.ok,
    outputRoot: loadResult.outputRoot,
    validationReportPath,
    loadFailureReportPath,
    coverageScorecardPath,
    identityGapReportPath,
    catalogueCoverageReportPath,
    candidateQueueSummary: candidateSummary,
  };
}
