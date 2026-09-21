/**
 * Pure Asset pack parsers + Metro-safe embed loader (no Node `fs`).
 *
 * Shared Identity embed: brands / parents / brand aliases / brand+entity hierarchy only.
 * Product scope criteria belong to Workstream C (signal_target_product_criteria).
 */

import type { CsvRecord } from '../../../identity/workstreamA/csv';
import {
  buildBrandHierarchyMapsFromCsvRecords,
  buildEntityHierarchyMapsFromCsvRecords,
} from '../../../identity/chaining/brandEntityHierarchyMaps';
import { buildADataMapsFromCsvRecords } from '../../../workstreamC/skeleton/workstreamCPublicationCore';
import {
  buildSignalProductScopeMapsFromCsvRecords,
} from '../../productScope/signalProductScopeEvaluator';
import type {
  AssetPackParsed,
  AssetRecallEligibilityBinding,
} from './matchDynamicSignalsAsset';
import type {
  GtinVerificationStatus,
  StructuredFoodRecallNotice,
} from '../../../workstreamC/recall';
import { DYNAMIC_SIGNALS_ASSET_RUNTIME_EMBED } from './dynamicSignalsAssetRuntimeEmbed.generated';

export function isDynamicSignalsAssetRuntimeEnabled(): boolean {
  return process.env.EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET === '1';
}

function parseBatchList(raw: string): string[] {
  return (raw || '')
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseAssetRecallEligibility(rows: CsvRecord[]): AssetRecallEligibilityBinding[] {
  return rows
    .map((r) => ({
      signal_id: (r.signal_id ?? '').trim(),
      recall_notice_id: (r.recall_notice_id ?? '').trim(),
      eligibility_status: (r.eligibility_status ?? '').trim(),
    }))
    .filter((b) => b.signal_id && b.recall_notice_id);
}

export function parseAssetRecallNotices(
  noticeRows: CsvRecord[],
  variantRows: CsvRecord[],
  relatedRows: CsvRecord[] = []
): StructuredFoodRecallNotice[] {
  const variantsByNotice = new Map<string, StructuredFoodRecallNotice['affected_variants'][number][]>();
  for (const r of variantRows) {
    const noticeId = (r.recall_notice_id ?? '').trim();
    if (!noticeId) continue;
    const gtin = (r.gtin ?? '').trim();
    const list = variantsByNotice.get(noticeId) ?? [];
    list.push({
      recall_variant_id:
        (r.recall_variant_id ?? '').trim() || `RV_${noticeId}_${gtin || String(list.length)}`,
      gtin,
      listed_batch_codes: parseBatchList(r.listed_batch_codes ?? ''),
      gtin_verification_status: ((r.gtin_verification_status ??
        'controlled_test_awaiting_external_verification') as GtinVerificationStatus),
      official_product_name: (r.official_product_name ?? '').trim() || undefined,
      pack_size: (r.pack_size ?? '').trim() || undefined,
    });
    variantsByNotice.set(noticeId, list);
  }

  const relatedByNotice = new Map<string, StructuredFoodRecallNotice['related_family_gtins']>();
  for (const r of relatedRows) {
    const noticeId = (r.recall_notice_id ?? '').trim();
    const gtin = (r.gtin ?? '').trim();
    if (!noticeId || !gtin) continue;
    const list = [...(relatedByNotice.get(noticeId) ?? [])];
    list.push({
      gtin,
      gtin_verification_status: ((r.gtin_verification_status ??
        'controlled_test_awaiting_external_verification') as GtinVerificationStatus),
    });
    relatedByNotice.set(noticeId, list);
  }

  const notices: StructuredFoodRecallNotice[] = [];
  for (const r of noticeRows) {
    const recall_notice_id = (r.recall_notice_id ?? '').trim();
    if (!recall_notice_id) continue;
    const bbMonthRaw = (r.bb_month ?? '').trim();
    const bbYearRaw = (r.bb_year ?? '').trim();
    const bb_month = bbMonthRaw ? Number.parseInt(bbMonthRaw, 10) : NaN;
    const bb_year = bbYearRaw ? Number.parseInt(bbYearRaw, 10) : NaN;
    notices.push({
      recall_notice_id,
      signal_id: (r.signal_id ?? '').trim(),
      official_source_url: (r.official_source_url ?? '').trim(),
      hazard: (r.hazard ?? '').trim(),
      consumer_action: (r.consumer_action ?? '').trim(),
      bb_month: Number.isInteger(bb_month) ? bb_month : 0,
      bb_year: Number.isInteger(bb_year) ? bb_year : 0,
      recall_product_family_id: undefined,
      affected_variants: variantsByNotice.get(recall_notice_id) ?? [],
      related_family_gtins: relatedByNotice.get(recall_notice_id),
    });
  }
  return notices;
}

export type AssetPackCsvRows = {
  sources: CsvRecord[];
  signals: CsvRecord[];
  targets: CsvRecord[];
  signalTargetProductCriteria: CsvRecord[];
  brandChildOfBrand: CsvRecord[];
  entityChildOfEntity: CsvRecord[];
  foodRecallEligibility: CsvRecord[];
  foodRecallNotices: CsvRecord[];
  foodRecallAffectedVariants: CsvRecord[];
  foodRecallRelatedGtins: CsvRecord[];
};

export function buildAssetPackFromCsvRows(rows: AssetPackCsvRows): AssetPackParsed {
  return {
    sources: rows.sources,
    signals: rows.signals,
    targets: rows.targets,
    productScopeMaps: buildSignalProductScopeMapsFromCsvRecords(rows.signalTargetProductCriteria),
    brandHierarchy: buildBrandHierarchyMapsFromCsvRecords(rows.brandChildOfBrand),
    entityHierarchy: buildEntityHierarchyMapsFromCsvRecords(rows.entityChildOfEntity),
    recallEligibility: parseAssetRecallEligibility(rows.foodRecallEligibility),
    recallNotices: parseAssetRecallNotices(
      rows.foodRecallNotices,
      rows.foodRecallAffectedVariants,
      rows.foodRecallRelatedGtins
    ),
  };
}

type ADataChainEmbed = ReturnType<typeof buildADataChainFromEmbedRows>;

let cachedAssetPack: AssetPackParsed | null = null;
let cachedADataChain: ADataChainEmbed | null = null;
let assetPackParseCount = 0;
let aDataParseCount = 0;

function buildADataChainFromEmbedRows() {
  const e = DYNAMIC_SIGNALS_ASSET_RUNTIME_EMBED;
  // GTIN→brand scaffold retired from active Chaining — pass empty gtin rows.
  return {
    aData: buildADataMapsFromCsvRecords(e.brandRows, e.parentRows, []),
    brandRows: e.brandRows,
    aliasRows: e.aliasRows,
    brandChildRows: e.brandChildOfBrand,
  };
}

export function loadDynamicSignalsAssetPackFromEmbed(): AssetPackParsed {
  if (cachedAssetPack) return cachedAssetPack;
  const e = DYNAMIC_SIGNALS_ASSET_RUNTIME_EMBED;
  cachedAssetPack = buildAssetPackFromCsvRows({
    sources: e.sources,
    signals: e.signals,
    targets: e.targets,
    signalTargetProductCriteria: e.signalTargetProductCriteria ?? [],
    brandChildOfBrand: e.brandChildOfBrand,
    entityChildOfEntity: e.entityChildOfEntity,
    foodRecallEligibility: e.foodRecallEligibility,
    foodRecallNotices: e.foodRecallNotices,
    foodRecallAffectedVariants: e.foodRecallAffectedVariants,
    foodRecallRelatedGtins: e.foodRecallRelatedGtins,
  });
  assetPackParseCount += 1;
  return cachedAssetPack;
}

export function loadADataForChainFromEmbed() {
  if (cachedADataChain) return cachedADataChain;
  cachedADataChain = buildADataChainFromEmbedRows();
  aDataParseCount += 1;
  return cachedADataChain;
}

export function getDynamicSignalsAssetEmbedCacheStats() {
  return { assetPackParseCount, aDataParseCount, packCached: cachedAssetPack != null };
}

export function __resetDynamicSignalsAssetEmbedCacheForTests() {
  cachedAssetPack = null;
  cachedADataChain = null;
  assetPackParseCount = 0;
  aDataParseCount = 0;
}
