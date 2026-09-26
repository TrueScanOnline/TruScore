/**
 * Governed News / category / Recall targeting — workbook 20260926 semantics.
 * Tests prove the governed target itself (not a blanket “unguarded News = brand-only” rule).
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

const EXPECTED_GTINS = [
  '4975186250043',
  '8801047559610',
  '9300605162921',
  '9300633636982',
  '9300645014495',
  '9300645020809',
  '9300645020823',
  '9300645022421',
  '9300725012182',
  '9310988016353',
  '9310988019279',
  '9310988019309',
  '9339687138920',
  '9339687265794',
  '9339687306558',
  '9339687306565',
  '9349673005624',
  '9414987012252',
  '9415077134649',
  '9415077182329',
  '9415077370979',
  '9415262047969',
  '9415262050044',
].sort();

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

function publishableSignalIds(): Set<string> {
  return new Set(
    loadCsv('signals.csv')
      .filter((s) => String(s.signal_publication_state).toLowerCase() === 'publishable')
      .map((s) => String(s.signal_id))
  );
}

describe('News / product targeting — workbook 20260926', () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET = '1';
    process.env.EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH = '1';
    __resetDynamicSignalsAssetEmbedCacheForTests();
  });

  describe('governed asset invariants', () => {
    it('publishable targets never use product_family / family_members', () => {
      const pub = publishableSignalIds();
      const targets = loadCsv('signal_targets.csv').filter((t) => pub.has(String(t.signal_id)));
      expect(targets.length).toBe(31);
      for (const t of targets) {
        expect(t.target_type).not.toBe('product_family');
        expect(t.propagation_mode).not.toBe('family_members');
      }
    });

    it('exact governed verified_gtins set is 23 unique values', () => {
      const pub = publishableSignalIds();
      const targets = loadCsv('signal_targets.csv').filter((t) => pub.has(String(t.signal_id)));
      const gtins = new Set<string>();
      for (const t of targets) {
        for (const g of String(t.verified_gtins || '')
          .split('|')
          .map((x) => x.replace(/\D/g, '').trim())
          .filter(Boolean)) {
          gtins.add(g);
        }
      }
      expect([...gtins].sort()).toEqual(EXPECTED_GTINS);
      expect(gtins.size).toBe(23);

      const gtinCriteria = loadCsv('signal_target_product_criteria.csv').filter(
        (c) => (c.match_field ?? '') === 'gtin' && (c.review_state ?? '') === 'reviewed'
      );
      const fromCriteria = new Set(gtinCriteria.map((c) => String(c.match_value_normalized || c.match_value).replace(/\D/g, '')));
      expect([...fromCriteria].sort()).toEqual(EXPECTED_GTINS);
    });

    it('unguarded News targets prove their governed type (brand/entity OR product with criteria)', () => {
      const signals = loadCsv('signals.csv');
      const targets = loadCsv('signal_targets.csv');
      const criteria = loadCsv('signal_target_product_criteria.csv');
      const newsIds = new Set(
        signals
          .filter(
            (s) =>
              s.signal_class === 'in_the_news' &&
              String(s.signal_publication_state).toLowerCase() === 'publishable'
          )
          .map((s) => s.signal_id)
      );
      const criteriaByTarget = new Map<string, typeof criteria>();
      for (const c of criteria) {
        const id = c.signal_target_id ?? '';
        const prev = criteriaByTarget.get(id) ?? [];
        prev.push(c);
        criteriaByTarget.set(id, prev);
      }

      for (const t of targets) {
        if (!newsIds.has(t.signal_id ?? '')) continue;
        if ((t.product_scope_guard ?? '').trim()) continue;
        const tt = (t.target_type ?? '').trim();
        expect(['brand', 'entity', 'product']).toContain(tt);
        expect(tt).not.toBe('product_family');
        const rows = criteriaByTarget.get(t.signal_target_id ?? '') ?? [];
        if (tt === 'brand' || tt === 'entity') {
          expect(rows.length).toBe(0);
        } else {
          expect(rows.length).toBeGreaterThan(0);
          expect(
            rows.every((c) => c.match_field === 'product_name' || c.match_field === 'gtin')
          ).toBe(true);
        }
      }

      const keri = targets.find((t) => t.signal_target_id === 'TGT-114');
      expect(keri?.target_type).toBe('brand');
      expect(keri?.propagation_mode).toBe('brand_descendants');
      expect(keri?.canonical_target_id).toBe('B0268');
      expect(keri?.market_key).toBe('AU+NZ');
      expect((keri?.product_scope_guard ?? '').trim()).toBe('');
      expect((criteriaByTarget.get('TGT-114') ?? []).length).toBe(0);
    });

    it('cocoa_chocolate remains the only product_scope_guard on publishable targets', () => {
      const pub = publishableSignalIds();
      const targets = loadCsv('signal_targets.csv').filter((t) => pub.has(String(t.signal_id)));
      const guards = [
        ...new Set(targets.map((t) => (t.product_scope_guard ?? '').trim()).filter(Boolean)),
      ];
      expect(guards).toEqual(['cocoa_chocolate']);
      const cocoa = targets.filter((t) => (t.product_scope_guard ?? '').trim() === 'cocoa_chocolate');
      expect(cocoa.length).toBe(7);
      for (const t of cocoa) {
        expect(t.target_type === 'product' || t.target_type === 'product_family').toBe(false);
      }
    });
  });

  describe('GTIN OR identity+phrase product relevance', () => {
    it('GTIN positive path works without good OFF name/brand text', () => {
      const hit = runScan({
        barcode: '9300645020823',
        productName: 'Unknown SKU',
        brands: '',
        market: 'AU',
      });
      expect(hit.recs.map((r) => r.signal_id)).toContain('SIG-IN-AU-001-20260918');
    });

    it('product-name fallback works when no verified GTIN is present', () => {
      const hit = runScan({
        barcode: '9300000999999',
        productName: 'Remano Tomato Paste 140g',
        brands: 'Remano',
        market: 'AU',
      });
      expect(hit.recs.map((r) => r.signal_id)).toContain('SIG-IN-AU-002-20260918');
    });

    it('nonmatching GTIN does not veto a valid name+identity match', () => {
      const hit = runScan({
        barcode: '9300000111111',
        productName: "Leggo's Tomato Passata",
        brands: "Leggo's",
        market: 'AU',
      });
      expect(hit.recs.map((r) => r.signal_id)).toContain('SIG-IN-AU-001-20260918');
    });

    it('wrong-market GTIN is blocked', () => {
      const nz = runScan({
        barcode: '9300645020823',
        productName: 'Unknown',
        brands: '',
        market: 'NZ',
      });
      // Leggo's target market is AU+NZ — GTIN is valid in NZ too for that News target.
      // Use an AU-only recall GTIN instead (Chickadees AU).
      const chickNz = runScan({
        barcode: '9310988019279',
        productName: 'Unknown',
        brands: '',
        market: 'NZ',
      });
      expect(chickNz.recs.some((r) => r.signal_id === 'SIG-SR-AU-001-20260918')).toBe(false);

      const chickAu = runScan({
        barcode: '9310988019279',
        productName: 'Unknown',
        brands: '',
        market: 'AU',
      });
      expect(chickAu.recs.map((r) => r.signal_id)).toContain('SIG-SR-AU-001-20260918');
      expect(nz).toBeTruthy();
    });
  });

  describe('founder dispositions', () => {
    it('Keri ordinary brand targeting AU+NZ with no product/GTIN gate', () => {
      const a = runScan({
        barcode: '9300675096362',
        productName: 'Keri Pulpy Orange Fruit Drink',
        brands: 'Keri',
        market: 'NZ',
      });
      const b = runScan({
        barcode: '9300675096348',
        productName: 'Keri Orange with Apple Base',
        brands: 'Keri',
        market: 'AU',
      });
      expect(a.recs.map((r) => r.signal_id)).toContain('SIG-IN-NZ-001-20260918');
      expect(b.recs.map((r) => r.signal_id)).toContain('SIG-IN-NZ-001-20260918');
    });

    it("Leggo's tomato-based positive; non-tomato sibling negative", () => {
      const tomato = runScan({
        barcode: '9300645020809',
        productName: "Leggo's Tomato Paste",
        brands: "Leggo's",
        market: 'AU',
      });
      expect(tomato.recs.map((r) => r.signal_id)).toContain('SIG-IN-AU-001-20260918');

      const passata = runScan({
        barcode: '9300000222222',
        productName: "Leggo's Passata Rustica",
        brands: "Leggo's",
        market: 'NZ',
      });
      expect(passata.recs.map((r) => r.signal_id)).toContain('SIG-IN-AU-001-20260918');

      const pesto = runScan({
        barcode: '9300000333333',
        productName: "Leggo's Basil Pesto",
        brands: "Leggo's",
        market: 'AU',
      });
      expect(pesto.recs.some((r) => r.signal_id === 'SIG-IN-AU-001-20260918')).toBe(false);
    });

    it('Woolworths egg positive and unrelated Woolworths-product negative', () => {
      const eggs = runScan({
        barcode: '9339687306558',
        productName: 'Woolworths Free Range Eggs 12 pack',
        brands: 'Woolworths',
        market: 'AU',
      });
      expect(eggs.recs.map((r) => r.signal_id)).toContain('SIG-IN-AU-005-20260918');

      const milk = runScan({
        barcode: '9300000444444',
        productName: 'Woolworths Full Cream Milk 2L',
        brands: 'Woolworths',
        market: 'AU',
      });
      expect(milk.recs.some((r) => r.signal_id === 'SIG-IN-AU-005-20260918')).toBe(false);
    });

    it('Cadbury cocoa guard fires; Ritz does not; GL-003 still fires for Ritz', () => {
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
      expect(ritz.recs.map((r) => r.signal_id)).toContain('SIG-IN-GL-003');
    });

    it("Vogel's named-line positives and unrelated Vogel's sibling negative", () => {
      const hit = runScan({
        barcode: '9414987012252',
        productName: "Vogel's Original Mixed Grain Toast",
        brands: "Vogel's",
        market: 'NZ',
      });
      expect(hit.recs.map((r) => r.signal_id)).toContain('SIG-SR-NZ-003-20260918');

      const byName = runScan({
        barcode: '9415077022222',
        productName: "Vogel's Fruit and Spice Extra Thick",
        brands: "Vogel's",
        market: 'NZ',
      });
      expect(byName.recs.map((r) => r.signal_id)).toContain('SIG-SR-NZ-003-20260918');

      const miss = runScan({
        barcode: '9415077022223',
        productName: "Vogel's Gluten Free White",
        brands: "Vogel's",
        market: 'NZ',
      });
      expect(miss.recs.some((r) => r.signal_id === 'SIG-SR-NZ-003-20260918')).toBe(false);
    });

    it('Mon Sire AU/NZ separation; no pack-size/batch gate', () => {
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
