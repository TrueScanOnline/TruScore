/**
 * Progressive Dynamic Signals evaluation — after primary product/TruScore is ready.
 * Failures are contained; never throws to the caller.
 */

import type { Product } from '../../../types/product';
import type { DynamicSignalPublicationRecord } from '../../publish/types';
import type { FoodRecallSubmittedMarkings } from '../../../workstreamC/recall';
import { resolveReviewedRetailChainUnified } from '../../../workstreamC/skeleton/resolveWorkstreamCRetailChain';
import { buildDynamicSignalsAssetRuntimePublicationRecords } from './buildDynamicSignalsAssetRuntimePublicationRecords';
import { loadADataForChainFromEmbed } from './loadDynamicSignalsAssetPack';
import { resolveActiveSignalsProducer } from './signalsProducerGuard';

export type SignalsReadyOutcome = 'attached' | 'empty' | 'failed';

export type DynamicSignalsEvaluationResult = {
  records: DynamicSignalPublicationRecord[];
  outcome: SignalsReadyOutcome;
  error_message?: string;
};

export type EvaluateDynamicSignalsAssetInput = {
  barcode: string;
  productName: string;
  product?: Product | null;
  scanMarketPublic: 'AU' | 'NZ' | 'UNKNOWN';
  foodRecallMarkings?: FoodRecallSubmittedMarkings | null;
  evaluationClockIso?: string;
  logLines?: string[];
  /** Tests: force Asset path */
  forceRun?: boolean;
};

/**
 * Synchronous, failure-contained evaluation. Safe to call from progressive path.
 */
export function evaluateDynamicSignalsAssetSafe(
  input: EvaluateDynamicSignalsAssetInput
): DynamicSignalsEvaluationResult {
  try {
    const logs = input.logLines ?? [];
    const producer = input.forceRun ? 'asset' : resolveActiveSignalsProducer(logs);
    if (producer !== 'asset') {
      return { records: [], outcome: 'empty' };
    }

    const records = buildDynamicSignalsAssetRuntimePublicationRecords({
      barcode: input.barcode,
      productName: input.productName,
      product: input.product,
      scanMarketPublic: input.scanMarketPublic,
      logLines: logs,
      foodRecallMarkings: input.foodRecallMarkings,
      evaluationClockIso: input.evaluationClockIso,
      forceRun: input.forceRun,
    });

    return {
      records,
      outcome: records.length > 0 ? 'attached' : 'empty',
    };
  } catch (err) {
    const error_message = err instanceof Error ? err.message : String(err);
    return { records: [], outcome: 'failed', error_message };
  }
}

/**
 * Yield so the primary product/TruScore render can commit before Signals work.
 * Prefer InteractionManager on device; fall back to macrotask.
 */
export function deferDynamicSignalsUntilAfterPrimaryRender(): Promise<void> {
  return new Promise((resolve) => {
    try {
      // Lazy require keeps this module Jest-friendly when RN stubs InteractionManager.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { InteractionManager } = require('react-native') as {
        InteractionManager?: { runAfterInteractions?: (cb: () => void) => { cancel?: () => void } };
      };
      if (InteractionManager?.runAfterInteractions) {
        InteractionManager.runAfterInteractions(() => resolve());
        return;
      }
    } catch {
      // fall through
    }
    setTimeout(resolve, 0);
  });
}

/**
 * Progressive path: wait for primary render slot, then evaluate safely.
 */
export async function evaluateDynamicSignalsAssetProgressive(
  input: EvaluateDynamicSignalsAssetInput
): Promise<DynamicSignalsEvaluationResult> {
  await deferDynamicSignalsUntilAfterPrimaryRender();
  return evaluateDynamicSignalsAssetSafe(input);
}

/** Compact reviewed-identity scheduling token — not raw product_name / brands. */
export type MaterialRetailIdentityState = 'unresolved' | 'fail_closed' | `reviewed:${string}:${string}`;

export function productNameForSignalsIdentity(product: Product): string {
  return product.product_name ?? product.product_name_en ?? product.brands ?? '';
}

/**
 * Production Chaining only (Asset embed, Cadbury UAT bridge off).
 * Used to decide whether full Signal matching must re-run after product_enhanced.
 */
export function resolveMaterialRetailIdentityStateForAsset(input: {
  barcode: string;
  product?: Product | null;
}): MaterialRetailIdentityState {
  if (!input.product) return 'unresolved';
  const { aData, brandRows, aliasRows } = loadADataForChainFromEmbed();
  const logs: string[] = [];
  const chain = resolveReviewedRetailChainUnified({
    barcode: input.barcode,
    productName: productNameForSignalsIdentity(input.product),
    product: input.product,
    aData,
    canonicalBrandRows: brandRows,
    brandAliasRows: aliasRows,
    logLines: logs,
    applyCadburyUatBridge: false,
  });
  if (chain?.brand_id && chain.parent_id) {
    return `reviewed:${chain.brand_id}:${chain.parent_id}`;
  }
  if (logs.some((line) => line.includes('fail_closed'))) return 'fail_closed';
  return 'unresolved';
}

/** Drop a progressive eval whose identity-aware key is no longer the Result current key. */
export function shouldCommitDynamicSignalsEvaluation(input: {
  evaluationKey: string;
  currentEvaluationKey: string | null | undefined;
  cancelled?: boolean;
}): boolean {
  if (input.cancelled) return false;
  return input.currentEvaluationKey === input.evaluationKey;
}

/** Stable key so ordinary loading/render transitions do not re-evaluate Signals. */
export function dynamicSignalsEvaluationKey(input: {
  barcode: string;
  scanMarketPublic: string;
  foodRecallMarkings: FoodRecallSubmittedMarkings | null | undefined;
  producerActive: boolean;
  /** Material Chaining state. Omit only in tests that are not identity-scheduling. */
  identityState?: MaterialRetailIdentityState;
}): string {
  const markings = input.foodRecallMarkings
    ? JSON.stringify({
        batch: input.foodRecallMarkings.batchCodeRaw ?? null,
        bb_month: input.foodRecallMarkings.bestBeforeMonth ?? null,
        bb_year: input.foodRecallMarkings.bestBeforeYear ?? null,
      })
    : '';
  const identityState = input.identityState ?? 'unresolved';
  return `${input.barcode}|${input.scanMarketPublic}|${input.producerActive ? '1' : '0'}|${markings}|${identityState}`;
}
