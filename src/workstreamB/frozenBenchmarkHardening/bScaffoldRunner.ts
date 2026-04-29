import fs from 'fs';
import path from 'path';
import type { FrozenBenchmarkAttributionObject } from '../../benchmark/types';
import type { ProductWithTrustScore } from '../../types/product';
import { buildTemplateCsvMap } from './bDataTemplates';
import { entityFromRecord } from './bDataTypes';
import { WORKSTREAM_B_FILES } from './bDataFiles';
import { loadWorkstreamBPackFromCsv } from './bDataLoader';
import { validateWorkstreamBPack } from './bDataValidation';
import { assembleFrozenBenchmarkAttributionFromBData } from './bFrozenAttributionAssembler';
import { runFreezeGuardDiagnostics } from './freezeGuardDiagnostics';
import {
  minimalSharedIdentityStub,
  runScoringReadDiagnostics,
  type ScoringReadSample,
} from './scoringReadDiagnostics';
import { buildValidationSummary, writeWorkstreamBReports } from './reportWriters';

export function ensureDirectory(directoryPath: string): void {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

export interface WorkstreamBScaffoldRunOptions {
  mode: 'template' | 'populated';
  requireCrosswalk?: boolean;
}

export interface WorkstreamBScaffoldRunResult {
  ok: boolean;
  outputRoot: string;
  loadFailureReportPath: string;
  validationReportPath: string;
  frozenDiagnosticsPath: string;
  validationSummaryPath: string;
}

function firstEntity(
  rowsByFile: ReturnType<typeof loadWorkstreamBPackFromCsv>['rowsByFile']
): ReturnType<typeof entityFromRecord> | null {
  const raw = rowsByFile[WORKSTREAM_B_FILES.BENCHMARK_ENTITIES]?.[0];
  if (!raw) return null;
  return entityFromRecord(raw);
}

export function runWorkstreamBScaffold(
  packRoot: string,
  options: WorkstreamBScaffoldRunOptions
): WorkstreamBScaffoldRunResult {
  const loadResult = loadWorkstreamBPackFromCsv(packRoot);
  ensureDirectory(loadResult.outputRoot);

  const validation = validateWorkstreamBPack({
    mode: options.mode,
    rowsByFile: loadResult.rowsByFile,
    missingRequiredFromLoader: loadResult.missingRequiredFiles,
    requireCrosswalk: options.requireCrosswalk,
  });
  const validationSummary = buildValidationSummary(validation);

  const releaseRows = loadResult.rowsByFile[WORKSTREAM_B_FILES.BENCHMARK_RELEASES] ?? [];
  const sampleEntity = firstEntity(loadResult.rowsByFile);

  const freeze = runFreezeGuardDiagnostics({
    releaseRows,
    sampleEntity: sampleEntity ?? {
      entity_id: 'missing',
      benchmark_name: 'BBFAW',
      entity_kind: 'parent_company',
      display_name: 'Missing',
      benchmark_owner_entity_id: 'x',
      benchmark_owner_legal_name: 'X',
      notes: '',
    },
    correction_row_count: validation.correction_row_count,
  });

  const samples: ScoringReadSample[] = [];
  if (sampleEntity) {
    const eligibleFrozen = assembleFrozenBenchmarkAttributionFromBData({
      releaseRows,
      entity: sampleEntity,
      subjectCanonicalBrandId: `bdata:${sampleEntity.entity_id}`,
      lineageToken: 'scaffold-read-check',
    });

    if (eligibleFrozen) {
      const ineligibleFrozen: FrozenBenchmarkAttributionObject = {
        ...eligibleFrozen,
        state: {
          ...eligibleFrozen.state,
          review_state: 'provisional',
          resolution_status: 'needs_review',
        },
        eligibility: {
          ethics_scoring_eligible: false,
          blocker_flags: ['needs_review'],
        },
      };

      const baseProduct = {
        barcode: '9990000000000',
        product_name: 'Scaffold scoring-read sample',
        brands: sampleEntity.display_name,
        brand_owner: sampleEntity.benchmark_owner_legal_name,
        labels_tags: [],
        ingredients_text: '',
        ingredients_analysis_tags: [],
        additives_tags: [],
        nutriments: {},
        source: 'workstream_b_scaffold',
        trust_score: null,
        trust_score_breakdown: null,
        _shared_identity_context: minimalSharedIdentityStub('scaffold:product'),
        _frozen_benchmark_attribution: ineligibleFrozen,
      } as ProductWithTrustScore;

      samples.push({ label: 'ineligible_frozen_blocks_benchmark_movement', product: baseProduct });
    }
  }

  const scoring = runScoringReadDiagnostics(samples);

  const loadFailureReport = {
    report_generated_at: new Date().toISOString(),
    ok: loadResult.missingRequiredFiles.length === 0,
    missing_required_input_files: loadResult.missingRequiredFiles,
    missing_optional_input_files: loadResult.missingOptionalFiles,
  };

  const written = writeWorkstreamBReports(loadResult.outputRoot, {
    loadFailure: loadFailureReport,
    validation: { validation, validationSummary },
    frozenDiagnostics: {
      generated_at: new Date().toISOString(),
      freeze_guards: freeze,
      scoring_read: scoring,
    },
  });

  return {
    ok: validation.ok && loadFailureReport.ok,
    outputRoot: loadResult.outputRoot,
    loadFailureReportPath: path.resolve(written.loadFailurePath),
    validationReportPath: path.resolve(written.validationPath),
    frozenDiagnosticsPath: path.resolve(written.frozenPath),
    validationSummaryPath: path.resolve(written.summaryPath),
  };
}

export function writeTemplatePack(packRoot: string): void {
  const inputRoot = path.join(packRoot, 'input');
  ensureDirectory(inputRoot);
  const templates = buildTemplateCsvMap();
  for (const [name, text] of Object.entries(templates)) {
    fs.writeFileSync(path.join(inputRoot, name), text, 'utf8');
  }
}
