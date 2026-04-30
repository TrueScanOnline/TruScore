/**
 * Workstream C skeleton v0.4 — filesystem loader for CSV packs + reviewed A-data (scripts / Node tests).
 * App runtime uses `src/workstreamC/runtime/workstreamCRuntimePublicationRecords.ts` + embedded bundle instead.
 */

import fs from 'fs';
import path from 'path';
import type { DynamicSignalPublicationRecord } from '../../dynamicSignals/publish/types';
import { parseCsv } from '../../identity/workstreamA/csv';
import {
  buildADataMapsFromCsvRecords,
  buildWorkstreamCPublicationRecordsFromParsedPack,
  resolveReviewedRetailChain,
  type ADataMaps,
  type InjectedUatChain,
  type ResolvedRetailChain,
} from './workstreamCPublicationCore';

export type { ADataMaps, InjectedUatChain, ResolvedRetailChain };
export { resolveReviewedRetailChain };

export function loadADataMaps(aDataInputRoot: string): ADataMaps {
  const brandsPath = path.join(aDataInputRoot, 'canonical_brands.csv');
  const parentsPath = path.join(aDataInputRoot, 'canonical_parents.csv');
  const gtinPath = path.join(aDataInputRoot, 'gtin_brand_links.csv');

  const brandRows = fs.existsSync(brandsPath) ? parseCsv(fs.readFileSync(brandsPath, 'utf8')) : [];
  const parentRows = fs.existsSync(parentsPath) ? parseCsv(fs.readFileSync(parentsPath, 'utf8')) : [];
  const gtinRows = fs.existsSync(gtinPath) ? parseCsv(fs.readFileSync(gtinPath, 'utf8')) : [];

  return buildADataMapsFromCsvRecords(brandRows, parentRows, gtinRows);
}

export interface BuildSkeletonPublicationRecordsInput {
  packInputRoot: string;
  aDataInputRoot: string;
  barcode: string;
  productName: string;
  scanMarketPublic: 'AU' | 'NZ' | 'UNKNOWN';
  logLines?: string[];
  injectedChain?: InjectedUatChain | null;
}

export function buildWorkstreamCSkeletonPublicationRecords(
  input: BuildSkeletonPublicationRecordsInput
): DynamicSignalPublicationRecord[] {
  const packRoot = input.packInputRoot;
  const links = parseCsv(fs.readFileSync(path.join(packRoot, 'signal_subject_links.csv'), 'utf8'));
  const signals = parseCsv(fs.readFileSync(path.join(packRoot, 'signal_records.csv'), 'utf8'));
  const uxPath = path.join(packRoot, 'ux_copy_skeleton.csv');
  const uxRows = fs.existsSync(uxPath) ? parseCsv(fs.readFileSync(uxPath, 'utf8')) : [];
  const aData = loadADataMaps(input.aDataInputRoot);

  return buildWorkstreamCPublicationRecordsFromParsedPack({
    links,
    signals,
    uxRows,
    aData,
    barcode: input.barcode,
    productName: input.productName,
    scanMarketPublic: input.scanMarketPublic,
    logLines: input.logLines,
    injectedChain: input.injectedChain ?? null,
  });
}
