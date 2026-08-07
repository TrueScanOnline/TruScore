/**
 * Runtime loader for Dynamic Signals Asset v0.2 (Node/tests + optional app wiring).
 */

import fs from 'fs';
import path from 'path';
import { parseCsv, type CsvRecord } from '../../../identity/workstreamA/csv';
import {
  buildProductFamilyMapsFromCsvRecords,
  type ProductFamilyMaps,
} from '../../../identity/chaining/productFamilyMaps';
import {
  buildBrandHierarchyMapsFromCsvRecords,
  buildEntityHierarchyMapsFromCsvRecords,
} from '../../../identity/chaining/brandEntityHierarchyMaps';
import type {
  AssetPackParsed,
  AssetRecallEligibilityBinding,
} from './matchDynamicSignalsAsset';
import type {
  GtinVerificationStatus,
  StructuredFoodRecallNotice,
} from '../../../workstreamC/recall';

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

export function loadDynamicSignalsAssetPackFromDisk(roots?: {
  packInputRoot?: string;
  familyExtRoot?: string;
}): AssetPackParsed {
  const repoRoot = path.resolve(__dirname, '..', '..', '..', '..');
  const packRoot =
    roots?.packInputRoot ?? path.join(repoRoot, 'workstreamC', 'c-data', 'dynamic-signals-v0.2', 'input');
  const famRoot =
    roots?.familyExtRoot ??
    path.join(repoRoot, 'workstreamA', 'a-data', 'chaining-extensions', 'v0.1');

  const read = (p: string) => (fs.existsSync(p) ? parseCsv(fs.readFileSync(p, 'utf8')) : []);

  const familyMaps: ProductFamilyMaps = buildProductFamilyMapsFromCsvRecords(
    read(path.join(famRoot, 'product_families.csv')),
    read(path.join(famRoot, 'product_family_membership.csv'))
  );

  return {
    sources: read(path.join(packRoot, 'source_universe.csv')),
    signals: read(path.join(packRoot, 'signals.csv')),
    targets: read(path.join(packRoot, 'signal_targets.csv')),
    familyMaps,
    brandHierarchy: buildBrandHierarchyMapsFromCsvRecords(
      read(path.join(famRoot, 'brand_child_of_brand.csv'))
    ),
    entityHierarchy: buildEntityHierarchyMapsFromCsvRecords(
      read(path.join(famRoot, 'entity_child_of_entity.csv'))
    ),
    recallEligibility: parseAssetRecallEligibility(
      read(path.join(packRoot, 'food_recall_eligibility.csv'))
    ),
    recallNotices: parseAssetRecallNotices(
      read(path.join(packRoot, 'food_recall_notices.csv')),
      read(path.join(packRoot, 'food_recall_affected_variants.csv')),
      read(path.join(packRoot, 'food_recall_related_gtins.csv'))
    ),
  };
}
