/**
 * Governed News / category / Recall targeting — three distinct relevance models.
 * Asset-semantics validation preferred over application special-cases.
 */
import fs from 'fs';
import path from 'path';
import { parseCsv } from '../../../identity/workstreamA/csv';
import type { Product } from '../../../types/product';
import { buildDynamicSignalsAssetRuntimePublicationRecords } from '../../../dynamicSignals/asset/v0.2/buildDynamicSignalsAssetRuntimePublicationRecords';
import { __resetDynamicSignalsAssetEmbedCacheForTests } from '../../../dynamicSignals/asset/v0.2/loadDynamicSignalsAssetPack';
import { loadAssetPackFromRoots } from './_assetPackTestHelpers';

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const PACK = path.join(ROOT, 'workstreamC', 'c-data', 'dynamic-signals-v0.3', 'input');
const FAM = path.join(ROOT, 'workstreamA', 'a-data', 'chaining-extensions', 'v0.3');
const CLOCK = '2026-09-18T12:00:00.000Z';

function loadCsv(name: string) {
  return parseCsv(fs.readFileSync(path.join(PACK, name), 'utf8'));
}

function product(partial: Partial<Product> & { product_name: string; brands?: string }): Product {
  return {
    barcode: partial.barcode ?? '9300000000000',
    product_name: partial.product_name,
    brands: partial.brands ?? '',
    categories: partial.categories ?? '',
    categories_tags: partial.categories_tags ?? [],
    labels_tags: [],
    ingredients_text: partial.ingredients_text ?? '',
    ingredients_analysis_tags: [],
    additives_tags: [],
    nutriments: {},
    source: 'test',
    ...partial,
  } as Product;
}

function runScan(input: {
  barcode: string;
  productName: string;
  brands?: string;
  market: 'AU' | 'NZ';
  categories_tags?: string[];
  ingredients_text?: string;
}) {
  const pack = loadAssetPackFromRoots({ packRoot: PACK, famRoot: FAM });
  const logs: string[] = [];
  const recs = buildDynamicSignalsAssetRuntimePublicationRecords({
    barcode: input.barcode,
    productName: input.productName,
    product: product({
      barcode: input.barcode,
      product_name: input.productName,
      brands: input.brands,
      categories_tags: input.categories_tags,
      ingredients_text: input.ingredients_text,
    }),
    scanMarketPublic: input.market,
    pack,
    forceRun: true,
    evaluationClockIso: CLOCK,
    logLines: logs,
  });
  return { recs, logs };
}

describe('News targeting semantics restoration', () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET = '1';
    process.env.EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH = '1';
    __resetDynamicSignalsAssetEmbedCacheForTests();
  });

  describe('prevention — governed asset semantics', () => {
    it('unguarded In-the-News targets cannot silently acquire product-name eligibility', () => {
      const signals = loadCsv('signals.csv');
      const targets = loadCsv('signal_targets.csv');
      const criteria = loadCsv('signal_target_product_criteria.csv');
      const newsIds = new Set(
        signals.filter((s) => s.signal_class === 'in_the_news').map((s) => s.signal_id)
      );
      const criteriaByTarget = new Map<string, number>();
      for (const c of criteria) {
        const id = c.signal_target_id ?? '';
        criteriaByTarget.set(id, (criteriaByTarget.get(id) ?? 0) + 1);
      }

      for (const t of targets) {
        if (!newsIds.has(t.signal_id ?? '')) continue;
        const guard = (t.product_scope_guard ?? '').trim();
        const tt = (t.target_type ?? '').trim();
        if (guard) continue;
        expect(['brand', 'entity']).toContain(tt);
        expect(tt === 'product' || tt === 'product_family').toBe(false);
        expect(criteriaByTarget.get(t.signal_target_id ?? '') ?? 0).toBe(0);
      }
    });

    it('explicit cocoa_chocolate product_scope_guard is retained on GL-001/GL-002 successors', () => {
      const targets = loadCsv('signal_targets.csv');
      const cocoa = targets.filter(
        (t) =>
          (t.signal_id === 'SIG-IN-GL-001-20260918' || t.signal_id === 'SIG-IN-GL-002-20260918') &&
          t.resolution_status === 'resolved'
      );
      expect(cocoa.length).toBeGreaterThanOrEqual(8);
      for (const t of cocoa) {
        expect(t.product_scope_guard).toBe('cocoa_chocolate');
        expect(t.target_type === 'product' || t.target_type === 'product_family').toBe(false);
      }
    });

    it('Safety/Recall product-line criteria remain separate from News brand/entity targets', () => {
      const signals = loadCsv('signals.csv');
      const targets = loadCsv('signal_targets.csv');
      const criteria = loadCsv('signal_target_product_criteria.csv');
      const safetyIds = new Set(
        signals.filter((s) => s.signal_class === 'safety_regulatory').map((s) => s.signal_id)
      );
      const safetyProductTargets = targets.filter(
        (t) =>
          safetyIds.has(t.signal_id ?? '') &&
          (t.target_type === 'product' || t.target_type === 'product_family')
      );
      expect(safetyProductTargets.length).toBeGreaterThan(0);
      const safetyTargetIds = new Set(safetyProductTargets.map((t) => t.signal_target_id));
      const safetyCriteria = criteria.filter((c) => safetyTargetIds.has(c.signal_target_id));
      expect(safetyCriteria.length).toBeGreaterThan(0);
      expect(safetyCriteria.every((c) => (c.match_field ?? '') === 'product_name')).toBe(true);

      // News unguarded must not share those product-name rows
      const newsIds = new Set(
        signals.filter((s) => s.signal_class === 'in_the_news').map((s) => s.signal_id)
      );
      const newsUnguarded = targets.filter(
        (t) => newsIds.has(t.signal_id ?? '') && !(t.product_scope_guard ?? '').trim()
      );
      for (const t of newsUnguarded) {
        expect(criteria.some((c) => c.signal_target_id === t.signal_target_id)).toBe(false);
      }
    });
  });

  describe('1 — brand/company-wide News', () => {
    it('Keri NZ GTINs without literal "fruit juice" both receive SIG-IN-NZ-001-20260918', () => {
      const nameA = 'Keri Pulpy Orange Fruit Drink';
      const nameB = 'Keri Orange with Apple Base';
      expect(nameA.toLowerCase().includes('fruit juice')).toBe(false);
      expect(nameB.toLowerCase().includes('fruit juice')).toBe(false);

      const a = runScan({
        barcode: '9300675096362',
        productName: nameA,
        brands: 'Keri',
        market: 'NZ',
      });
      const b = runScan({
        barcode: '9300675096348',
        productName: nameB,
        brands: 'Keri',
        market: 'NZ',
      });
      expect(a.recs.map((r) => r.signal_id)).toContain('SIG-IN-NZ-001-20260918');
      expect(b.recs.map((r) => r.signal_id)).toContain('SIG-IN-NZ-001-20260918');
      expect(a.logs.some((l) => l.includes('B0268'))).toBe(true);
      expect(b.logs.some((l) => l.includes('B0268'))).toBe(true);
    });

    it('representative Mondelez-owned non-cocoa product receives SIG-IN-GL-003', () => {
      const hit = runScan({
        barcode: '9300657012345',
        productName: 'Ritz Crackers Original',
        brands: 'Ritz',
        market: 'AU',
      });
      expect(hit.recs.map((r) => r.signal_id)).toContain('SIG-IN-GL-003');
    });
  });

  describe('2 — category-scoped News (cocoa_chocolate)', () => {
    it('Cadbury chocolate receives guarded cocoa successor; Ritz does not', () => {
      const cocoa = runScan({
        barcode: '9300617064879',
        productName: 'Cadbury Dairy Milk Milk Chocolate',
        brands: 'Cadbury',
        market: 'AU',
        categories_tags: ['en:chocolates'],
        ingredients_text: 'milk chocolate, cocoa',
      });
      expect(cocoa.recs.map((r) => r.signal_id)).toContain('SIG-IN-GL-001-20260918');

      const ritz = runScan({
        barcode: '9300657012345',
        productName: 'Ritz Crackers Original',
        brands: 'Ritz',
        market: 'AU',
      });
      expect(ritz.recs.some((r) => r.signal_id === 'SIG-IN-GL-001-20260918')).toBe(false);
      expect(ritz.recs.some((r) => r.signal_id === 'SIG-IN-GL-002-20260918')).toBe(false);
    });

    it('same non-cocoa Mondelez product still receives unguarded SIG-IN-GL-003', () => {
      const ritz = runScan({
        barcode: '9300657012345',
        productName: 'Ritz Crackers Original',
        brands: 'Ritz',
        market: 'AU',
      });
      expect(ritz.recs.map((r) => r.signal_id)).toContain('SIG-IN-GL-003');
    });
  });

  describe('3 — Safety/Recall product-line', () => {
    it("Vogel's matches governed recalled lines; unrelated Vogel's product does not", () => {
      const hit = runScan({
        barcode: '9415077022222',
        productName: "Vogel's Original Mixed Grain Toast",
        brands: "Vogel's",
        market: 'NZ',
      });
      expect(hit.recs.map((r) => r.signal_id)).toContain('SIG-SR-NZ-003-20260918');

      const miss = runScan({
        barcode: '9415077022223',
        productName: "Vogel's Gluten Free White",
        brands: "Vogel's",
        market: 'NZ',
      });
      expect(miss.recs.some((r) => r.signal_id === 'SIG-SR-NZ-003-20260918')).toBe(false);
    });

    it('Mon Sire AU/NZ market separation remains; no pack-size gate', () => {
      const au = runScan({
        barcode: '9300000888801',
        productName: 'Mon Sire Brie',
        brands: 'Mon Sire',
        market: 'AU',
      });
      const nz = runScan({
        barcode: '9300000888802',
        productName: 'Mon Sire Brie',
        brands: 'Mon Sire',
        market: 'NZ',
      });
      expect(au.recs.map((r) => r.signal_id)).toContain('SIG-SR-AU-008');
      expect(au.recs.some((r) => r.signal_id === 'SIG-SR-NZ-006')).toBe(false);
      expect(nz.recs.map((r) => r.signal_id)).toContain('SIG-SR-NZ-006');
      expect(nz.recs.some((r) => r.signal_id === 'SIG-SR-AU-008')).toBe(false);
      expect(au.recs.find((r) => r.signal_id === 'SIG-SR-AU-008')?.food_recall?.needs_batch_entry).toBeFalsy();
    });
  });
});
