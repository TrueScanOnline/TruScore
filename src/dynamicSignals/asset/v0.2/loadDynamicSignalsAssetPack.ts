/**
 * Pure Asset pack parsers + Metro-safe embed loader (no Node `fs`).
 */

import type { CsvRecord } from '../../../identity/workstreamA/csv';
import {
  buildProductFamilyMapsFromCsvRecords,
  type ProductFamilyMaps,
} from '../../../identity/chaining/productFamilyMaps';
import {
  buildBrandHierarchyMapsFromCsvRecords,
  buildEntityHierarchyMapsFromCsvRecords,
} from '../../../identity/chaining/brandEntityHierarchyMaps';
import { buildADataMapsFromCsvRecords } from '../../../workstreamC/skeleton/workstreamCPublicationCore';
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
    const gtin = (r.gtin ?? '').trim();
    if (!noticeId || !gtin) continue;
    const list = variantsByNotice.get(noticeId) ?? [];
    list.push({
      recall_variant_id: (r.recall_variant_id ?? '').trim() || `RV_${noticeId}_${gtin}`,
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

  return noticeRows
    .map((r) => {
      const recall_notice_id = (r.recall_notice_id ?? '').trim();
      if (!recall_notice_id) return null;
      const bb_month = Number.parseInt((r.bb_month ?? '').trim(), 10);
      const bb_year = Number.parseInt((r.bb_year ?? '').trim(), 10);
      if (!Number.isInteger(bb_month) || !Number.isInteger(bb_year)) return null;
      return {
        recall_notice_id,
        signal_id: (r.signal_id ?? '').trim(),
        official_source_url: (r.official_source_url ?? '').trim(),
        hazard: (r.hazard ?? '').trim(),
        consumer_action: (r.consumer_action ?? '').trim(),
        bb_month,
        bb_year,
        recall_product_family_id: (r.recall_product_family_id ?? '').trim() || undefined,
        affected_variants: variantsByNotice.get(recall_notice_id) ?? [],
        related_family_gtins: relatedByNotice.get(recall_notice_id),
      } satisfies StructuredFoodRecallNotice;
    })
    .filter((n): n is StructuredFoodRecallNotice => n != null);
}

export type AssetPackCsvRows = {
  sources: CsvRecord[];
  signals: CsvRecord[];
  targets: CsvRecord[];
  productFamilies: CsvRecord[];
  productFamilyMembership: CsvRecord[];
  brandChildOfBrand: CsvRecord[];
  entityChildOfEntity: CsvRecord[];
  foodRecallEligibility: CsvRecord[];
  foodRecallNotices: CsvRecord[];
  foodRecallAffectedVariants: CsvRecord[];
  foodRecallRelatedGtins: CsvRecord[];
};

export function buildAssetPackFromCsvRows(rows: AssetPackCsvRows): AssetPackParsed {
  const familyMaps: ProductFamilyMaps = buildProductFamilyMapsFromCsvRecords(
    rows.productFamilies,
    rows.productFamilyMembership
  );

  return {
    sources: rows.sources,
    signals: rows.signals,
    targets: rows.targets,
    familyMaps,
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
/** Test/observability: how many times pack CSV rows were parsed into Maps. */
let assetPackParseCount = 0;
let aDataParseCount = 0;

function buildADataChainFromEmbedRows() {
  const e = DYNAMIC_SIGNALS_ASSET_RUNTIME_EMBED;
  return {
    aData: buildADataMapsFromCsvRecords(e.brandRows, e.parentRows, e.gtinRows),
    brandRows: e.brandRows,
    aliasRows: e.aliasRows,
  };
}

/** App/runtime pack — embedded governed CSVs (no filesystem). Cached after first parse. */
export function loadDynamicSignalsAssetPackFromEmbed(): AssetPackParsed {
  if (cachedAssetPack) return cachedAssetPack;
  const e = DYNAMIC_SIGNALS_ASSET_RUNTIME_EMBED;
  cachedAssetPack = buildAssetPackFromCsvRows({
    sources: e.sources,
    signals: e.signals,
    targets: e.targets,
    productFamilies: e.productFamilies,
    productFamilyMembership: e.productFamilyMembership,
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

/** Shared Identity rows for retail-chain resolution on device. Cached after first parse. */
export function loadADataForChainFromEmbed() {
  if (cachedADataChain) return cachedADataChain;
  cachedADataChain = buildADataChainFromEmbedRows();
  aDataParseCount += 1;
  return cachedADataChain;
}

export function getDynamicSignalsAssetEmbedCacheStats() {
  return { assetPackParseCount, aDataParseCount, packCached: cachedAssetPack != null };
}

/** Jest only — clears singleton cache between isolation proofs. */
export function __resetDynamicSignalsAssetEmbedCacheForTests() {
  cachedAssetPack = null;
  cachedADataChain = null;
  assetPackParseCount = 0;
  aDataParseCount = 0;
}
