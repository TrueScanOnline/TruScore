/**
 * Result Signals scheduling — identity-aware eval key (P1).
 *
 * `9300617064879` remains Chaining PASS / not an Asset correction candidate.
 * This suite proves Result scheduling: material reviewed identity in the eval key,
 * no Signal churn on harmless enrichment, fail-closed clears attach, A→B identity
 * republishes, and stale async evals cannot overwrite a newer identity.
 */

import type { Product } from '../../../types/product';
import {
  attachDynamicSignalRecordsToScanResult,
  buildProductScanResult,
} from '../../../services/buildProductScanResult';
import { __resetDynamicSignalsAssetEmbedCacheForTests } from '../../../dynamicSignals/asset/v0.2/loadDynamicSignalsAssetPack';
import {
  dynamicSignalsEvaluationKey,
  evaluateDynamicSignalsAssetSafe,
  resolveMaterialRetailIdentityStateForAsset,
  shouldCommitDynamicSignalsEvaluation,
  type DynamicSignalsEvaluationResult,
} from '../../../dynamicSignals/asset/v0.2/evaluateDynamicSignalsAssetProgressive';
import type { AlertsPreferences } from '../../../store/useAlertsStore';

const BARCODE = '9300617064879';
const MARKET = 'AU' as const;
const emptyPrefs = {} as AlertsPreferences;

function identityEvalKey(product: Product, barcode: string = BARCODE): string {
  return dynamicSignalsEvaluationKey({
    barcode,
    scanMarketPublic: MARKET,
    foodRecallMarkings: null,
    producerActive: true,
    identityState: resolveMaterialRetailIdentityStateForAsset({ barcode, product }),
  });
}

function insufficientIdentityProduct(): Product {
  return {
    barcode: BARCODE,
    source: 'openfoodfacts',
    product_name: 'Unbranded Cocoa Block 180g',
    brands: '',
    nutriments: { 'energy-kcal_100g': 530 },
    trust_score: 61,
    trust_score_breakdown: { body: 60, planet: 61, ethics: 62, open: 63 },
  } as Product;
}

function sufficientCadburyDairyMilkProduct(): Product {
  return {
    barcode: BARCODE,
    source: 'openfoodfacts',
    product_name: 'Dairy Milk Milk Chocolate',
    brands: 'Cadbury',
    categories_tags: ['en:chocolates', 'en:milk-chocolates'],
    nutriments: { 'energy-kcal_100g': 530 },
    trust_score: 61,
    trust_score_breakdown: { body: 60, planet: 61, ethics: 62, open: 63 },
  } as Product;
}

function harmlessEnrichmentProduct(): Product {
  return {
    ...sufficientCadburyDairyMilkProduct(),
    ingredients_text: 'Milk, sugar, cocoa butter, cocoa mass',
    labels_tags: ['en:rainforest-alliance'],
    image_url: 'https://example.invalid/front.jpg',
    quantity: '180g',
  } as Product;
}

function failClosedConflictProduct(): Product {
  return {
    barcode: BARCODE,
    source: 'openfoodfacts',
    product_name: 'KitKat Chunky',
    brands: 'Cadbury',
    categories_tags: ['en:chocolates'],
    trust_score: 61,
    trust_score_breakdown: { body: 60, planet: 61, ethics: 62, open: 63 },
  } as Product;
}

function kitKatReviewedProduct(): Product {
  return {
    barcode: BARCODE,
    source: 'openfoodfacts',
    product_name: 'KitKat Chunky Milk Chocolate',
    brands: 'Nestlé',
    categories_tags: ['en:chocolates'],
    trust_score: 61,
    trust_score_breakdown: { body: 60, planet: 61, ethics: 62, open: 63 },
  } as Product;
}

type SchedulerHold = {
  key: string;
  evaluations: number;
  last: DynamicSignalsEvaluationResult;
};

function emptyHold(): SchedulerHold {
  return { key: '', evaluations: 0, last: { records: [], outcome: 'empty' } };
}

function evaluateProduction(product: Product): DynamicSignalsEvaluationResult {
  return evaluateDynamicSignalsAssetSafe({
    barcode: BARCODE,
    productName: product.product_name ?? product.product_name_en ?? product.brands ?? '',
    product,
    scanMarketPublic: MARKET,
  });
}

/** Production Result skip rule: identity-aware eval key. */
function applyIdentityAwareScheduler(product: Product, hold: SchedulerHold): SchedulerHold {
  const key = identityEvalKey(product);
  if (hold.key === key) return hold;
  const last = evaluateProduction(product);
  return { key, evaluations: hold.evaluations + 1, last };
}

function signalIds(result: DynamicSignalsEvaluationResult): string[] {
  return result.records.map((r) => r.signal_id).sort();
}

describe('Result Signals scheduling — material identity eval key', () => {
  const prevAsset = process.env.EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET;
  const prevSkeleton = process.env.EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET = '1';
    process.env.EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT = '0';
    __resetDynamicSignalsAssetEmbedCacheForTests();
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET = prevAsset;
    process.env.EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT = prevSkeleton;
    __resetDynamicSignalsAssetEmbedCacheForTests();
  });

  it('weak/unresolved first paint → Dairy Milk reviewed identity re-evaluates; v0.3 pack remains candidate/needs_review', () => {
    expect(resolveMaterialRetailIdentityStateForAsset({ barcode: BARCODE, product: insufficientIdentityProduct() })).toBe(
      'unresolved'
    );
    let hold = emptyHold();
    hold = applyIdentityAwareScheduler(insufficientIdentityProduct(), hold);
    expect(hold.last.outcome).toBe('empty');

    hold = applyIdentityAwareScheduler(sufficientCadburyDairyMilkProduct(), hold);
    expect(hold.evaluations).toBe(2);
    expect(resolveMaterialRetailIdentityStateForAsset({ barcode: BARCODE, product: sufficientCadburyDairyMilkProduct() })).toBe(
      'reviewed:B0241:P0009'
    );
    expect(hold.last.outcome).toBe('empty');
    expect(signalIds(hold.last)).toEqual([]);
  });

  it('same reviewed chain + harmless nutrition/image/label enrichment → no additional Signal evaluation', () => {
    let hold = emptyHold();
    hold = applyIdentityAwareScheduler(sufficientCadburyDairyMilkProduct(), hold);
    const ids = signalIds(hold.last);
    expect(hold.evaluations).toBe(1);

    expect(identityEvalKey(harmlessEnrichmentProduct())).toBe(identityEvalKey(sufficientCadburyDairyMilkProduct()));
    hold = applyIdentityAwareScheduler(harmlessEnrichmentProduct(), hold);
    expect(hold.evaluations).toBe(1);
    expect(hold.last.outcome).toBe('empty');
    expect(signalIds(hold.last)).toEqual(ids);
  });

  it('attached reviewed identity → genuine fail-closed conflict → Signals become empty; scores untouched', () => {
    const dairy = sufficientCadburyDairyMilkProduct();
    const primary = buildProductScanResult({
      barcode: BARCODE,
      product: dairy,
      userPreferences: emptyPrefs,
      isSubscriber: false,
      market: 'AU',
      dynamicSignalRecords: [],
      terminal_state: 'success',
    }).result;

    let hold = emptyHold();
    hold = applyIdentityAwareScheduler(dairy, hold);
    const attached = attachDynamicSignalRecordsToScanResult(primary, hold.last.records);
    expect(attached.scores).toBe(primary.scores);
    expect(hold.last.outcome).toBe('empty');

    hold = applyIdentityAwareScheduler(failClosedConflictProduct(), hold);
    expect(hold.evaluations).toBe(2);
    expect(resolveMaterialRetailIdentityStateForAsset({ barcode: BARCODE, product: failClosedConflictProduct() })).toBe(
      'fail_closed'
    );
    expect(hold.last.outcome).toBe('empty');
    expect(hold.last.records).toHaveLength(0);

    const cleared = attachDynamicSignalRecordsToScanResult(primary, hold.last.records);
    expect(cleared.scores).toBe(primary.scores);
    expect(cleared.scores).toEqual(attached.scores);
  });

  it('reviewed identity A → materially different reviewed identity B → Signals reflect B', () => {
    let hold = emptyHold();
    hold = applyIdentityAwareScheduler(sufficientCadburyDairyMilkProduct(), hold);
    expect(signalIds(hold.last)).toEqual([]);

    expect(resolveMaterialRetailIdentityStateForAsset({ barcode: BARCODE, product: kitKatReviewedProduct() })).toBe(
      'reviewed:B0060:P0008'
    );
    hold = applyIdentityAwareScheduler(kitKatReviewedProduct(), hold);
    expect(hold.evaluations).toBe(2);
    expect(hold.last.outcome).toBe('empty');
    expect(signalIds(hold.last)).toEqual([]);
  });

  it('older asynchronous evaluation cannot overwrite the result for a newer identity state', async () => {
    let currentKey = identityEvalKey(insufficientIdentityProduct());
    let published: DynamicSignalsEvaluationResult | null = null;

    const older = Promise.resolve().then(() => {
      const result = evaluateProduction(insufficientIdentityProduct());
      if (
        shouldCommitDynamicSignalsEvaluation({
          evaluationKey: identityEvalKey(insufficientIdentityProduct()),
          currentEvaluationKey: currentKey,
        })
      ) {
        published = result;
      }
      return result;
    });

    currentKey = identityEvalKey(sufficientCadburyDairyMilkProduct());
    const newer = evaluateProduction(sufficientCadburyDairyMilkProduct());
    if (
      shouldCommitDynamicSignalsEvaluation({
        evaluationKey: identityEvalKey(sufficientCadburyDairyMilkProduct()),
        currentEvaluationKey: currentKey,
      })
    ) {
      published = newer;
    }

    await older;
    expect(published).not.toBeNull();
    expect(published!.outcome).toBe('empty');
    expect(signalIds(published!)).toEqual([]);

    const staleCommit = shouldCommitDynamicSignalsEvaluation({
      evaluationKey: identityEvalKey(insufficientIdentityProduct()),
      currentEvaluationKey: currentKey,
    });
    expect(staleCommit).toBe(false);
    const cancelledCommit = shouldCommitDynamicSignalsEvaluation({
      evaluationKey: currentKey,
      currentEvaluationKey: currentKey,
      cancelled: true,
    });
    expect(cancelledCommit).toBe(false);
  });
});
