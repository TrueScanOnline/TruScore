/**
 * App/runtime entry for Dynamic Signals Asset v0.2.
 * Respects structural mutual exclusion vs Skeleton (Asset is production successor).
 *
 * Dynamic Signals Asset is the sole production Signal-content authority.
 * Food Recall Matcher is eligibility-only and cannot originate public Signals alone.
 *
 * Must not import Node `fs` — Metro/EAS Bundle JavaScript cannot resolve it.
 */

import type { Product } from '../../../types/product';
import { resolveReviewedRetailChainUnified } from '../../../workstreamC/skeleton/resolveWorkstreamCRetailChain';
import {
  buildDynamicSignalsAssetPublicationRecords,
  type AssetPackParsed,
} from './matchDynamicSignalsAsset';
import {
  isDynamicSignalsAssetRuntimeEnabled,
  loadADataForChainFromEmbed,
  loadDynamicSignalsAssetPackFromEmbed,
} from './loadDynamicSignalsAssetPack';
import { reviewedFamilyIdsForGtin } from '../../../identity/chaining/productFamilyMaps';
import { buildAssetGovernedFoodRecallPublicationRecords } from './buildAssetGovernedFoodRecallPublicationRecords';
import { resolveActiveSignalsProducer } from './signalsProducerGuard';
import type { DynamicSignalPublicationRecord } from '../../publish/types';
import type { FoodRecallSubmittedMarkings } from '../../../workstreamC/recall';

export { isDynamicSignalsAssetRuntimeEnabled };

/**
 * Returns [] unless Asset is the active producer (or `pack` injected for tests).
 * Appends Asset-governed Food Recall Matcher Safety records only — never MILO-originated content.
 */
export function buildDynamicSignalsAssetRuntimePublicationRecords(input: {
  barcode: string;
  productName: string;
  product?: Product | null;
  scanMarketPublic: 'AU' | 'NZ' | 'UNKNOWN';
  logLines?: string[];
  pack?: AssetPackParsed;
  injectedBrandId?: string | null;
  injectedParentId?: string | null;
  productFamilyIds?: string[];
  foodRecallMarkings?: FoodRecallSubmittedMarkings | null;
  evaluationClockIso?: string;
  /** Tests: bypass producer guard */
  forceRun?: boolean;
  includeNonPublishable?: boolean;
}): DynamicSignalPublicationRecord[] {
  const testingOverride = input.pack !== undefined || input.forceRun === true;
  if (!testingOverride) {
    const producer = resolveActiveSignalsProducer(input.logLines);
    if (producer !== 'asset') return [];
  }

  const pack = input.pack ?? loadDynamicSignalsAssetPackFromEmbed();
  const logs = input.logLines;

  let brand_id: string | null = input.injectedBrandId ?? null;
  let parent_id: string | null = input.injectedParentId ?? null;

  if (input.injectedBrandId === undefined && input.injectedParentId === undefined) {
    const { aData, brandRows, aliasRows } = loadADataForChainFromEmbed();
    const chain = resolveReviewedRetailChainUnified({
      barcode: input.barcode,
      productName: input.productName,
      product: input.product ?? null,
      aData,
      canonicalBrandRows: brandRows,
      brandAliasRows: aliasRows,
      logLines: logs,
      applyCadburyUatBridge: false,
    });
    brand_id = chain?.brand_id ?? null;
    parent_id = chain?.parent_id ?? null;
  }

  const product_family_ids =
    input.productFamilyIds ??
    reviewedFamilyIdsForGtin(pack.familyMaps, input.barcode, input.scanMarketPublic);

  const assetRecords = buildDynamicSignalsAssetPublicationRecords({
    pack,
    identity: {
      barcode: input.barcode,
      brand_id,
      parent_id,
      product_family_ids,
      scanMarketPublic: input.scanMarketPublic,
    },
    logLines: logs,
    includeNonPublishable: input.includeNonPublishable ?? false,
  });

  const recallRecords = buildAssetGovernedFoodRecallPublicationRecords({
    pack,
    barcode: input.barcode,
    scanMarketPublic: input.scanMarketPublic,
    foodRecallMarkings: input.foodRecallMarkings,
    evaluationClockIso: input.evaluationClockIso,
    logLines: logs,
    includeNonPublishable: input.includeNonPublishable ?? false,
  });

  // Dedupe by signal_id — Asset-governed recall eligibility wins for Safety notices it owns
  const seen = new Set(recallRecords.map((r) => r.signal_id));
  const merged = [...recallRecords];
  for (const r of assetRecords) {
    if (seen.has(r.signal_id)) continue;
    seen.add(r.signal_id);
    merged.push(r);
  }
  return merged;
}
