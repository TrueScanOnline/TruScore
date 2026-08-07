/**
 * Expo/React Native runtime: Workstream C governed signals via embedded CSV bundle +
 * identity-first reviewed chain (canonical_brands + brand_aliases + Product fields), with GTIN fallback
 * only when no Product is supplied (scripts). No barcode fixture map; no injected chain in production.
 *
 * Stage 2: Safety recalls for SIG_REG_* use the food-recall matcher path (MILO) and suppress
 * legacy broad subject-link publish for suppressed signal IDs. In the News unchanged.
 */

import type { DynamicSignalPublicationRecord } from '../../dynamicSignals/publish/types';
import type { Product } from '../../types/product';
import {
  buildADataMapsFromCsvRecords,
  buildWorkstreamCPublicationRecordsFromParsedPack,
} from '../skeleton/workstreamCPublicationCore';
import {
  createFixedFoodRecallClock,
  evaluateMiloFoodRecallMatch,
  isFoodRecallCorrectedPathEnabled,
  mapFoodRecallMatchToPublicationRecord,
  suppressedLegacySafetySignalIds,
  type FoodRecallSubmittedMarkings,
} from '../recall';
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
import { resolveActiveSignalsProducer } from '../../dynamicSignals/asset/v0.2/signalsProducerGuard';

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

function filterSuppressedLegacySafety(
  records: DynamicSignalPublicationRecord[],
  logLines?: string[]
): DynamicSignalPublicationRecord[] {
  const suppressed = new Set(suppressedLegacySafetySignalIds());
  const out: DynamicSignalPublicationRecord[] = [];
  for (const r of records) {
    if (r.signal_class === 'safety_regulatory' && suppressed.has(r.signal_id)) {
      logLines?.push(`legacy_safety_suppressed: ${r.signal_id}`);
      continue;
    }
    out.push(r);
  }
  return out;
}

/**
 * Builds publishable-only Workstream C records for `buildProductScanResult({ dynamicSignalRecords })`.
 * With `product`, resolves chain from bundled canonical_brands + brand_aliases (+ optional Cadbury→B0241 bridge).
 * Without `product`, falls back to reviewed bundled `gtin_brand_links` only (non-app harness).
 *
 * @param foodRecallMarkings Optional manual batch / best-before for Stage 2 MILO matcher.
 * @param evaluationClockIso Injected clock for deterministic tests (default fixed UAT clock).
 */
export function buildWorkstreamCRuntimePublicationRecords(input: {
  barcode: string;
  productName: string;
  /** Pass for supermarket path — enables identity-first chain resolution (preferred). */
  product?: Product | null;
  scanMarketPublic: 'AU' | 'NZ' | 'UNKNOWN';
  logLines?: string[];
  foodRecallMarkings?: FoodRecallSubmittedMarkings | null;
  /** Injected evaluation time (ISO). Defaults to a fixed Stage 2 test clock. */
  evaluationClockIso?: string;
}): DynamicSignalPublicationRecord[] {
  // Structural mutual exclusion: when Asset is active, Skeleton must not produce.
  const producer = resolveActiveSignalsProducer(input.logLines);
  if (producer !== 'skeleton') {
    if (producer === 'asset') {
      input.logLines?.push('skeleton_suppressed: Asset producer active (mutual exclusion)');
    }
    return [];
  }
  if (!isWorkstreamCSignalsRuntimeEnabled()) return [];

  const log = input.logLines;

  const subjectLinkRecords = buildWorkstreamCPublicationRecordsFromParsedPack({
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
    logLines: log,
    injectedChain: null,
  });

  const withoutSuppressedLegacy = filterSuppressedLegacySafety(subjectLinkRecords, log);

  const clock = createFixedFoodRecallClock(
    input.evaluationClockIso ?? '2026-08-05T00:00:00.000Z'
  );
  const corrected = isFoodRecallCorrectedPathEnabled();
  log?.push(`food_recall_corrected_path=${corrected ? '1' : '0'}`);

  const miloMatch = evaluateMiloFoodRecallMatch({
    gtin: input.barcode,
    markings: input.foodRecallMarkings,
    clock,
    correctedPathEnabled: corrected,
  });
  log?.push(
    `food_recall_milo: state=${miloMatch.match_state} reason=${miloMatch.match_reason_code}`
  );

  const miloRecord = corrected ? mapFoodRecallMatchToPublicationRecord(miloMatch) : null;
  // Ensure no dual publish and never restore legacy AU_001 subject-link path
  if (miloRecord) {
    const withoutMiloLegacy = withoutSuppressedLegacy.filter((r) => r.signal_id !== 'SIG_REG_AU_001');
    return [...withoutMiloLegacy, miloRecord];
  }

  // Fail-closed: corrected path off → no MILO card; legacy already stripped
  return withoutSuppressedLegacy;
}
