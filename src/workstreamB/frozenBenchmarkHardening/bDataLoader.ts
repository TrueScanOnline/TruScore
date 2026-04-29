import fs from 'fs';
import path from 'path';
import { parseCsv, type CsvRecord } from './bDataCsv';
import {
  WORKSTREAM_B_FILES,
  WORKSTREAM_B_OPTIONAL_FILES,
  WORKSTREAM_B_REQUIRED_FILES,
  type WorkstreamBInputFileName,
} from './bDataFiles';

export interface WorkstreamBPackLoadResult {
  inputRoot: string;
  outputRoot: string;
  rowsByFile: Partial<Record<WorkstreamBInputFileName, CsvRecord[]>>;
  missingRequiredFiles: WorkstreamBInputFileName[];
  missingOptionalFiles: WorkstreamBInputFileName[];
}

export interface WorkstreamBPackLoadOptions {
  inputDirectory?: string;
  outputDirectory?: string;
}

export function resolvePackDirectories(
  packRoot: string,
  options: WorkstreamBPackLoadOptions = {}
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

export function loadWorkstreamBPackFromCsv(
  packRoot: string,
  options: WorkstreamBPackLoadOptions = {}
): WorkstreamBPackLoadResult {
  const { inputRoot, outputRoot } = resolvePackDirectories(packRoot, options);
  const rowsByFile: Partial<Record<WorkstreamBInputFileName, CsvRecord[]>> = {};
  const missingRequiredFiles: WorkstreamBInputFileName[] = [];
  const missingOptionalFiles: WorkstreamBInputFileName[] = [];

  for (const fileName of WORKSTREAM_B_REQUIRED_FILES) {
    const rows = readCsvIfPresent(path.join(inputRoot, fileName));
    if (rows === null) {
      missingRequiredFiles.push(fileName);
    } else {
      rowsByFile[fileName] = rows;
    }
  }

  for (const fileName of WORKSTREAM_B_OPTIONAL_FILES) {
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

export function isOptionalBFile(fileName: WorkstreamBInputFileName): boolean {
  return (WORKSTREAM_B_OPTIONAL_FILES as readonly string[]).includes(fileName);
}
