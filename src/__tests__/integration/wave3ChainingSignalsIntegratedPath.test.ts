/**
 * Integrated-path assurance: Wave 3 (d6cae8e) + Chaining/Benchmarks/Signals (12e1f22).
 * Ordinary scan → Core Truth product → Chaining → TruScore → Dynamic Signals → Result contract.
 */
import fs from 'fs';
import path from 'path';
import { calculateTruScore } from '../../lib/truscoreEngine/index';
import type { Product } from '../../types/product';
import {
  attachDynamicSignalRecordsToScanResult,
  buildProductScanResult,
} from '../../services/buildProductScanResult';
import { buildDynamicSignalsAssetRuntimePublicationRecords } from '../../dynamicSignals/asset/v0.2/buildDynamicSignalsAssetRuntimePublicationRecords';
import { buildAssetGovernedFoodRecallPublicationRecords } from '../../dynamicSignals/asset/v0.2/buildAssetGovernedFoodRecallPublicationRecords';
import { __resetDynamicSignalsAssetEmbedCacheForTests } from '../../dynamicSignals/asset/v0.2/loadDynamicSignalsAssetPack';
import { flattenSignalsOrdered } from '../../utils/scanResultPresentation';
import { loadAssetPackFromRoots } from '../unit/dynamicSignals/_assetPackTestHelpers';
import type { AlertsPreferences } from '../../store/useAlertsStore';

const ROOT = path.resolve(__dirname, '..', '..', '..');
const PACK = path.join(ROOT, 'workstreamC', 'c-data', 'dynamic-signals-v0.3', 'input');
const FAM = path.join(ROOT, 'workstreamA', 'a-data', 'chaining-extensions', 'v0.3');
const RESULT_SCREEN = path.join(ROOT, 'app', 'result', '[barcode].tsx');
const SUPERSESSION = path.join(
  ROOT,
  'docs',
  'uat',
  'FOUNDER_MVP_RECALL_DECISIONS_20260922_SUPERSESSION.md'
);
const CORPUS_JSON = path.join(
  ROOT,
  'reports',
  'MVP_RECALL_SIMPLIFICATION_ORDINARY_SCAN_CORPUS_20260922.json'
);
const CLOCK = '2026-09-18T12:00:00.000Z';
const emptyPrefs = {} as AlertsPreferences;

function scanProduct(partial: Partial<Product> & { product_name: string; brands: string }): Product {
  return {
    barcode: partial.barcode ?? '9300000000000',
    product_name: partial.product_name,
    brands: partial.brands,
    categories_tags: partial.categories_tags ?? [],
    ingredients_text: partial.ingredients_text ?? 'water, sugar',
    additives_tags: partial.additives_tags ?? [],
    nutriments: partial.nutriments ?? { energy_100g: 400 },
    source: 'test',
    ...partial,
  } as Product;
}

function runtimeSignals(input: {
  barcode: string;
  product: Product;
  market: 'AU' | 'NZ';
}) {
  const pack = loadAssetPackFromRoots({ packRoot: PACK, famRoot: FAM });
  const logs: string[] = [];
  const recs = buildDynamicSignalsAssetRuntimePublicationRecords({
    barcode: input.barcode,
    productName: input.product.product_name ?? '',
    product: input.product,
    scanMarketPublic: input.market,
    pack,
    forceRun: true,
    evaluationClockIso: CLOCK,
    logLines: logs,
  });
  return { recs, logs, pack };
}

describe('Integrated path — Wave 3 + Chaining/Signals UAT candidate', () => {
  const prevAsset = process.env.EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET;
  const prevRecall = process.env.EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET = '1';
    process.env.EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH = '1';
    __resetDynamicSignalsAssetEmbedCacheForTests();
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET = prevAsset;
    process.env.EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH = prevRecall;
    __resetDynamicSignalsAssetEmbedCacheForTests();
  });

  it('TruScore is unchanged when Dynamic Signal records attach (Signals do not alter scoring)', () => {
    const product = scanProduct({
      barcode: '9310072612345',
      product_name: 'Cadbury Dairy Milk Chocolate 180g',
      brands: 'Cadbury',
      categories_tags: ['en:chocolates'],
      ingredients_text: 'milk, sugar, cocoa butter, cocoa mass',
    });
    const tru = calculateTruScore(product);
    expect(tru.truscore).not.toBeNull();
    expect(tru.truscore!).toBeGreaterThan(0);

    const breakdown = {
      body: tru.breakdown.Body ?? 0,
      planet: tru.breakdown.Planet ?? 0,
      ethics: tru.breakdown.Ethics ?? 0,
      open: tru.breakdown.Open ?? 0,
    };
    const primary = buildProductScanResult({
      barcode: product.barcode,
      product: { ...product, trust_score: tru.truscore!, trust_score_breakdown: breakdown },
      userPreferences: emptyPrefs,
      isSubscriber: false,
      market: 'AU',
      dynamicSignalRecords: [],
      terminal_state: 'success',
    }).result;

    const { recs } = runtimeSignals({ barcode: product.barcode, product, market: 'AU' });
    const combined = attachDynamicSignalRecordsToScanResult(primary, recs);

    expect(combined.scores?.trust).toBe(primary.scores?.trust);
    expect(combined.scores?.breakdown).toEqual(primary.scores?.breakdown);
  });

  it('AU Mon Sire Brie recall displays without batch/date; NZ market does not cross-publish', () => {
    const au = runtimeSignals({
      barcode: '9300612345678',
      market: 'AU',
      product: scanProduct({
        barcode: '9300612345678',
        product_name: 'Mon Sire Brie',
        brands: 'Mon Sire',
      }),
    });
    expect(au.recs.map((r) => r.signal_id)).toContain('SIG-SR-AU-008');
    expect(au.recs.find((r) => r.signal_id === 'SIG-SR-AU-008')?.skeleton_card_copy?.why_display).toMatch(
      /Foodland|1kg|October/i
    );
    expect(au.recs.every((r) => r.food_recall?.needs_batch_entry)).toBe(false);

    const nz = runtimeSignals({
      barcode: '9300612345679',
      market: 'NZ',
      product: scanProduct({
        barcode: '9300612345679',
        product_name: 'Mon Sire Brie',
        brands: 'Mon Sire',
      }),
    });
    expect(nz.recs.map((r) => r.signal_id)).not.toContain('SIG-SR-AU-008');
    expect(nz.recs.map((r) => r.signal_id)).toContain('SIG-SR-NZ-006');
  });

  it('Stage 2 recall overlay emits nothing; MVP supersession note is present', () => {
    const { pack, logs } = runtimeSignals({
      barcode: '9300612345678',
      market: 'AU',
      product: scanProduct({
        barcode: '9300612345678',
        product_name: 'Mon Sire Brie',
        brands: 'Mon Sire',
      }),
    });
    const overlayLogs: string[] = [];
    const overlay = buildAssetGovernedFoodRecallPublicationRecords({
      pack,
      barcode: '9300612345678',
      scanMarketPublic: 'AU',
      logLines: overlayLogs,
    });
    expect(overlay).toEqual([]);
    expect(overlayLogs.some((l) => l.includes('mvp_recall: stage2_matcher_retired'))).toBe(true);
    expect(fs.existsSync(SUPERSESSION)).toBe(true);
    const resultSrc = fs.readFileSync(RESULT_SCREEN, 'utf8');
    expect(resultSrc).not.toMatch(/FoodRecallMarkingsEntry/);
  });

  it('Safety appears before News in flattened signal order', () => {
    const product = scanProduct({
      barcode: '9310000111111',
      product_name: "Leggo's Tomato Paste 140g",
      brands: "Leggo's",
    });
    const tru = calculateTruScore(product);
    const { recs } = runtimeSignals({ barcode: product.barcode, product, market: 'AU' });
    expect(recs.length).toBeGreaterThan(0);

    const breakdown = {
      body: tru.breakdown.Body ?? 0,
      planet: tru.breakdown.Planet ?? 0,
      ethics: tru.breakdown.Ethics ?? 0,
      open: tru.breakdown.Open ?? 0,
    };
    const { result } = buildProductScanResult({
      barcode: product.barcode,
      product: { ...product, trust_score: tru.truscore ?? 0, trust_score_breakdown: breakdown },
      userPreferences: emptyPrefs,
      isSubscriber: false,
      market: 'AU',
      dynamicSignalRecords: recs,
      terminal_state: 'success',
    });

    const flat = flattenSignalsOrdered(result.signals);
    const safetyIdx = flat.findIndex((c) => c.class === 'safety_regulatory');
    const newsIdx = flat.findIndex((c) => c.class === 'transparency' || c.class === 'premium_insight');
    if (safetyIdx >= 0 && newsIdx >= 0) {
      expect(safetyIdx).toBeLessThan(newsIdx);
    }
  });

  it('publishable corpus remains 26/26 working (integration baseline JSON)', () => {
    expect(fs.existsSync(CORPUS_JSON)).toBe(true);
    const corpus = JSON.parse(fs.readFileSync(CORPUS_JSON, 'utf8')) as {
      publishable_works_ordinary_scan: number;
      publishable_held: number;
      publishable_total: number;
    };
    expect(corpus.publishable_total).toBe(26);
    expect(corpus.publishable_works_ordinary_scan).toBe(26);
    expect(corpus.publishable_held).toBe(0);
  });
});
