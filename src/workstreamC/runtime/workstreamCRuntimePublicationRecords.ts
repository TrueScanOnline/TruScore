/**
 * Expo/React Native runtime: Workstream C governed signals via embedded CSV bundle +
 * reviewed GTIN→brand→parent chain only (no barcode fixture map, no injected chain).
 */

import type { DynamicSignalPublicationRecord } from '../../dynamicSignals/publish/types';
import {
  buildADataMapsFromCsvRecords,
  buildWorkstreamCPublicationRecordsFromParsedPack,
} from '../skeleton/workstreamCPublicationCore';
import {
  WORKSTREAM_C_RUNTIME_CANONICAL_BRANDS,
  WORKSTREAM_C_RUNTIME_CANONICAL_PARENTS,
  WORKSTREAM_C_RUNTIME_GTIN_BRAND_LINKS,
  WORKSTREAM_C_RUNTIME_SIGNAL_RECORDS,
  WORKSTREAM_C_RUNTIME_SIGNAL_SUBJECT_LINKS,
  WORKSTREAM_C_RUNTIME_UX_COPY_SKELETON,
} from './workstreamCRuntimePack.generated';

import type { ADataMaps } from '../skeleton/workstreamCPublicationCore';

let cachedADataMaps: ADataMaps | null = null;

function runtimeADataMaps(): ADataMaps {
  if (!cachedADataMaps) {
    cachedADataMaps = buildADataMapsFromCsvRecords(
      WORKSTREAM_C_RUNTIME_CANONICAL_BRANDS,
      WORKSTREAM_C_RUNTIME_CANONICAL_PARENTS,
      WORKSTREAM_C_RUNTIME_GTIN_BRAND_LINKS
    );
  }
  return cachedADataMaps;
}

/** Gate Workstream C governed dynamic records in the scan UI (same env as prior skeleton UAT flag). */
export function isWorkstreamCSignalsRuntimeEnabled(): boolean {
  return process.env.EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT === '1';
}

/** @deprecated Use isWorkstreamCSignalsRuntimeEnabled — name kept for gradual call-site migration. */
export function isWorkstreamCSkeletonUatEnabled(): boolean {
  return isWorkstreamCSignalsRuntimeEnabled();
}

/**
 * Builds publishable-only Workstream C records for `buildProductScanResult({ dynamicSignalRecords })`.
 * Requires a reviewed row in bundled `gtin_brand_links.csv` for the scanned GTIN.
 */
export function buildWorkstreamCRuntimePublicationRecords(input: {
  barcode: string;
  productName: string;
  scanMarketPublic: 'AU' | 'NZ' | 'UNKNOWN';
  logLines?: string[];
}): DynamicSignalPublicationRecord[] {
  if (!isWorkstreamCSignalsRuntimeEnabled()) return [];

  return buildWorkstreamCPublicationRecordsFromParsedPack({
    links: WORKSTREAM_C_RUNTIME_SIGNAL_SUBJECT_LINKS,
    signals: WORKSTREAM_C_RUNTIME_SIGNAL_RECORDS,
    uxRows: WORKSTREAM_C_RUNTIME_UX_COPY_SKELETON,
    aData: runtimeADataMaps(),
    barcode: input.barcode,
    productName: input.productName,
    scanMarketPublic: input.scanMarketPublic,
    logLines: input.logLines,
    injectedChain: null,
  });
}
