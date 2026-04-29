import fs from 'fs';
import path from 'path';
import { parseCsv, type CsvRecord } from './csv';
import {
  WORKSTREAM_A_FILES,
  type WorkstreamAFileName,
} from './schema';
import {
  WORKSTREAM_A_OPTIONAL_FILES,
  WORKSTREAM_A_REQUIRED_FILES,
} from './templates';

export interface WorkstreamAPackLoadResult {
  inputRoot: string;
  outputRoot: string;
  rowsByFile: Partial<Record<WorkstreamAFileName, CsvRecord[]>>;
  missingRequiredFiles: WorkstreamAFileName[];
  missingOptionalFiles: WorkstreamAFileName[];
}

export interface WorkstreamAPackLoadOptions {
  inputDirectory?: string;
  outputDirectory?: string;
}

export function resolvePackDirectories(
  packRoot: string,
  options: WorkstreamAPackLoadOptions = {}
): { inputRoot: string; outputRoot: string } {
  return {
    inputRoot: path.resolve(packRoot, options.inputDirectory ?? 'input'),
    outputRoot: path.resolve(packRoot, options.outputDirectory ?? 'output'),
  };
}

function readCsvIfPresent(filePath: string): CsvRecord[] | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  return parseCsv(content);
}

export function loadWorkstreamAPackFromCsv(
  packRoot: string,
  options: WorkstreamAPackLoadOptions = {}
): WorkstreamAPackLoadResult {
  const { inputRoot, outputRoot } = resolvePackDirectories(packRoot, options);
  const rowsByFile: Partial<Record<WorkstreamAFileName, CsvRecord[]>> = {};
  const missingRequiredFiles: WorkstreamAFileName[] = [];
  const missingOptionalFiles: WorkstreamAFileName[] = [];

  for (const fileName of WORKSTREAM_A_REQUIRED_FILES) {
    const rows = readCsvIfPresent(path.join(inputRoot, fileName));
    if (rows === null) {
      missingRequiredFiles.push(fileName);
    } else {
      rowsByFile[fileName] = rows;
    }
  }

  for (const fileName of WORKSTREAM_A_OPTIONAL_FILES) {
    const rows = readCsvIfPresent(path.join(inputRoot, fileName));
    if (rows === null) {
      missingOptionalFiles.push(fileName);
    } else {
      rowsByFile[fileName] = rows;
    }
  }

  return {
    inputRoot,
    outputRoot,
    rowsByFile,
    missingRequiredFiles,
    missingOptionalFiles,
  };
}

export function isOptionalFile(fileName: WorkstreamAFileName): boolean {
  return (WORKSTREAM_A_OPTIONAL_FILES as readonly string[]).includes(fileName);
}

export function isRequiredFile(fileName: WorkstreamAFileName): boolean {
  return (WORKSTREAM_A_REQUIRED_FILES as readonly string[]).includes(fileName);
}

export function getDefaultPackLayout(): {
  input: WorkstreamAFileName[];
  output: string[];
} {
  return {
    input: [...WORKSTREAM_A_REQUIRED_FILES, ...WORKSTREAM_A_OPTIONAL_FILES],
    output: [
      'validation_report.json',
      'coverage_scorecard.json',
      'identity_gap_report.json',
      'catalogue_coverage_report.csv',
    ],
  };
}

export const WORKSTREAM_A_DEFAULT_LAYOUT = {
  input: WORKSTREAM_A_FILES,
} as const;
