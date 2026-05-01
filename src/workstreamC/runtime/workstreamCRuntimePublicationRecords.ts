/**
 * Expo/React Native runtime: Workstream C governed signals via embedded CSV bundle +
 * identity-first reviewed chain (canonical_brands + brand_aliases + Product fields), with GTIN fallback
 * only when no Product is supplied (scripts). No barcode fixture map; no injected chain in production.
 */

import type { DynamicSignalPublicationRecord } from '../../dynamicSignals/publish/types';
import type { Product } from '../../types/product';
import {
  buildADataMapsFromCsvRecords,
  buildWorkstreamCPublicationRecordsFromParsedPack,
} from '../skeleton/workstreamCPublicationCore';
import {
  WORKSTREAM_C_RUNTIME_BRAND_ALIASES,
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
 * With `product`, resolves chain from bundled canonical_brands + brand_aliases (+ optional Cadbury→B0241 bridge).
 * Without `product`, falls back to reviewed bundled `gtin_brand_links` only (non-app harness).
 */
export function buildWorkstreamCRuntimePublicationRecords(input: {
  barcode: string;
  productName: string;
  /** Pass for supermarket path — enables identity-first chain resolution (preferred). */
  product?: Product | null;
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
    product: input.product ?? null,
    canonicalBrandRows: WORKSTREAM_C_RUNTIME_CANONICAL_BRANDS,
    brandAliasRows: WORKSTREAM_C_RUNTIME_BRAND_ALIASES,
    scanMarketPublic: input.scanMarketPublic,
    logLines: input.logLines,
    injectedChain: null,
  });
}
