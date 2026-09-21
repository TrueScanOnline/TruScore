/**
 * App/runtime entry for Dynamic Signals Asset v0.2.
 * Respects structural mutual exclusion vs Skeleton (Asset is production successor).
 *
 * Flow:
 *   scan → product data → Shared Identity brand/parent chain only
 *   → Dynamic Signals evaluates brand/entity targets + Workstream C product-scope criteria
 *   → Food Recall overlay for Safety batch/date qualification
 *
 * Must not import Node `fs` — Metro/EAS Bundle JavaScript cannot resolve it.
 */

import type { Product } from '../../../types/product';
import { resolveReviewedRetailChainUnified } from '../../../workstreamC/skeleton/resolveWorkstreamCRetailChain';
import type { CocoaChocolateProductScopeEvidence } from './cocoaChocolateProductScopeGuard';
import {
  buildDynamicSignalsAssetPublicationRecords,
  type AssetPackParsed,
  type AssetScanIdentity,
} from './matchDynamicSignalsAsset';
import {
  isDynamicSignalsAssetRuntimeEnabled,
  loadADataForChainFromEmbed,
  loadDynamicSignalsAssetPackFromEmbed,
} from './loadDynamicSignalsAssetPack';
import { buildAssetGovernedFoodRecallPublicationRecords } from './buildAssetGovernedFoodRecallPublicationRecords';
import { resolveActiveSignalsProducer } from './signalsProducerGuard';
import type { DynamicSignalPublicationRecord } from '../../publish/types';
import type { FoodRecallSubmittedMarkings } from '../../../workstreamC/recall';

export { isDynamicSignalsAssetRuntimeEnabled };

/**
 * Returns [] unless Asset is the active producer (or `pack` injected for tests).
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
    const { aData, brandRows, aliasRows, brandChildRows } = loadADataForChainFromEmbed();
    const chain = resolveReviewedRetailChainUnified({
      barcode: input.barcode,
      productName: input.productName,
      product: input.product ?? null,
      aData,
      canonicalBrandRows: brandRows,
      brandAliasRows: aliasRows,
      brandChildRows,
      logLines: logs,
      applyCadburyUatBridge: false,
    });
    brand_id = chain?.brand_id ?? null;
    parent_id = chain?.parent_id ?? null;
  }

  logs?.push(
    `identity_resolve: brand=${brand_id ?? '(none)'} parent=${parent_id ?? '(none)'} (Shared Identity ownership only; product scope is Workstream C)`
  );

  const productScopeEvidence: CocoaChocolateProductScopeEvidence | null = input.product
    ? {
        product_name: input.product.product_name ?? input.productName,
        generic_name: input.product.generic_name,
        categories: input.product.categories,
        categories_tags: input.product.categories_tags,
        ingredients_text: input.product.ingredients_text,
      }
    : input.productName
      ? { product_name: input.productName }
      : null;

  const evaluationClock = input.evaluationClockIso
    ? { nowIso: () => input.evaluationClockIso as string }
    : undefined;

  const scanIdentity: AssetScanIdentity = {
    barcode: input.barcode,
    brand_id,
    parent_id,
    productName: input.productName,
    scanMarketPublic: input.scanMarketPublic,
    quantity: input.product?.quantity ?? null,
    product_quantity: input.product?.product_quantity ?? null,
    product_quantity_unit: input.product?.product_quantity_unit ?? null,
    productScopeEvidence,
  };

  const assetRecords = buildDynamicSignalsAssetPublicationRecords({
    pack,
    identity: scanIdentity,
    logLines: logs,
    includeNonPublishable: input.includeNonPublishable ?? false,
    evaluationClock,
  });

  const recallRecords = buildAssetGovernedFoodRecallPublicationRecords({
    pack,
    barcode: input.barcode,
    scanMarketPublic: input.scanMarketPublic,
    foodRecallMarkings: input.foodRecallMarkings,
    evaluationClockIso: input.evaluationClockIso,
    logLines: logs,
    includeNonPublishable: input.includeNonPublishable ?? false,
    scanIdentity,
  });

  const seen = new Set(recallRecords.map((r) => r.signal_id));
  const merged = [...recallRecords];
  for (const r of assetRecords) {
    if (seen.has(r.signal_id)) continue;
    seen.add(r.signal_id);
    merged.push(r);
  }
  return merged;
}
