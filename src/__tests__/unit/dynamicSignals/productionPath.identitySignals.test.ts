/**
 * Production-path Dynamic Signals — Chaining = brand/parent only; product scope = Workstream C.
 * Starts from ordinary scan/product payload fields — does NOT inject product_family_id
 * or product_identity_id answers into the resolver.
 */
import fs from 'fs';
import path from 'path';
import type { Product } from '../../../types/product';
import { buildAssetPackFromCsvRows } from '../../../dynamicSignals/asset/v0.2/loadDynamicSignalsAssetPack';
import { buildDynamicSignalsAssetRuntimePublicationRecords } from '../../../dynamicSignals/asset/v0.2/buildDynamicSignalsAssetRuntimePublicationRecords';
import { __resetDynamicSignalsAssetEmbedCacheForTests } from '../../../dynamicSignals/asset/v0.2/loadDynamicSignalsAssetPack';
import { loadAssetPackFromRoots, readCsvFile } from './_assetPackTestHelpers';

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const PACK = path.join(ROOT, 'workstreamC', 'c-data', 'dynamic-signals-v0.3', 'input');
const FAM = path.join(ROOT, 'workstreamA', 'a-data', 'chaining-extensions', 'v0.3');
const CLOCK = '2026-09-18T12:00:00.000Z';

function loadProductionPack() {
  return loadAssetPackFromRoots({ packRoot: PACK, famRoot: FAM });
}

function product(partial: Partial<Product> & { product_name: string; brands?: string }): Product {
  return {
    barcode: partial.barcode ?? '9300000000000',
    product_name: partial.product_name,
    brands: partial.brands ?? '',
    brand_owner: partial.brand_owner,
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
  const pack = loadProductionPack();
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
    // Intentionally do NOT inject product family / identity IDs — ordinary scan fields only.
  });
  return { recs, logs };
}

describe('Production-path: Chaining=brand only + Workstream C product scope', () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET = '1';
    process.env.EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH = '1';
    __resetDynamicSignalsAssetEmbedCacheForTests();
  });

  it("Leggo's tomato-based News fires for tomato paste; non-tomato pasta sauce does not", () => {
    const paste = runScan({
      barcode: '9310000111111',
      productName: "Leggo's Tomato Paste 140g",
      brands: "Leggo's",
      market: 'AU',
    });
    expect(paste.logs.some((l) => l.includes('identity_resolve:') && l.includes('B0179'))).toBe(true);
    expect(paste.recs.map((r) => r.signal_id)).toContain('SIG-IN-AU-001-20260918');

    const sauce = runScan({
      barcode: '9310000111112',
      productName: "Leggo's Pasta Sauce Traditional",
      brands: "Leggo's",
      market: 'AU',
    });
    expect(sauce.recs.some((r) => r.signal_id === 'SIG-IN-AU-001-20260918')).toBe(false);
  });

  it("Hoyt's turmeric fires; paprika sibling does not", () => {
    const hit = runScan({
      barcode: '9300725012182',
      productName: "Hoyt's Ground Turmeric 50g",
      brands: "Hoyt's",
      market: 'AU',
    });
    expect(hit.recs.map((r) => r.signal_id)).toContain('SIG-IN-AU-004-20260918');

    const sibling = runScan({
      barcode: '9310000222223',
      productName: "Hoyt's Paprika 50g",
      brands: "Hoyt's",
      market: 'AU',
    });
    expect(sibling.recs.some((r) => r.signal_id === 'SIG-IN-AU-004-20260918')).toBe(false);
  });

  it('Mondelez entity Signal fires for Cadbury chocolate without cocoa guard; Mars comparator does not', () => {
    const hit = runScan({
      barcode: '9300617064879',
      productName: 'Cadbury Dairy Milk Milk Chocolate',
      brands: 'Cadbury',
      market: 'AU',
      categories_tags: ['en:chocolates'],
      ingredients_text: 'milk, sugar, cocoa',
    });
    expect(hit.recs.map((r) => r.signal_id)).toContain('SIG-IN-GL-003');

    const miss = runScan({
      barcode: '9999999999991',
      productName: 'Mars Bar',
      brands: 'Mars',
      market: 'AU',
    });
    expect(miss.recs.some((r) => r.signal_id === 'SIG-IN-GL-003')).toBe(false);
  });

  it('Chickadees ordinary scan fires the Safety successor with no batch markings; unrelated snack does not', () => {
    const hit = runScan({
      barcode: '9410000333333',
      productName: 'Chickadees 190g',
      brands: 'Chickadees',
      market: 'AU',
    });
    const card = hit.recs.find((r) => r.signal_id === 'SIG-SR-AU-001-20260918');
    expect(card).toBeTruthy();
    expect(card!.food_recall?.needs_batch_entry).toBeFalsy();
    expect(card!.skeleton_card_copy?.title_display).toBe('Recall: selected Chickadees packs');
    expect(card!.skeleton_card_copy?.why_display?.toLowerCase()).toContain('listed pack sizes');
    expect(hit.logs.some((l) => l.includes('mvp_recall: stage2_matcher_retired'))).toBe(true);

    // Pack size is qualification content — absence of a size must not suppress the recall.
    const noSize = runScan({
      barcode: '9410000333335',
      productName: 'Chickadees',
      brands: 'Chickadees',
      market: 'AU',
    });
    expect(noSize.recs.some((r) => r.signal_id === 'SIG-SR-AU-001-20260918')).toBe(true);

    const miss = runScan({
      barcode: '9410000333334',
      productName: 'Kettle Salted Chips 165g',
      brands: 'Kettle',
      market: 'AU',
    });
    expect(miss.recs.some((r) => r.signal_id === 'SIG-SR-AU-001-20260918')).toBe(false);
  });

  it('Woolworths Multi Grain Cereal 500g fires; Woolworths milk sibling does not', () => {
    const hit = runScan({
      barcode: '9410000444444',
      productName: 'Woolworths Multi Grain Cereal 500g',
      brands: 'Woolworths',
      market: 'NZ',
    });
    expect(hit.recs.map((r) => r.signal_id)).toContain('SIG-SR-NZ-005');

    const miss = runScan({
      barcode: '9410000444445',
      productName: 'Woolworths Milk 2L',
      brands: 'Woolworths',
      market: 'NZ',
    });
    expect(miss.recs.some((r) => r.signal_id === 'SIG-SR-NZ-005')).toBe(false);
  });

  it('Mon Sire Brie fires in its own market only; AU and NZ recalls never cross-publish', () => {
    const au = runScan({
      barcode: '9300000555555',
      productName: 'Brie Mon Sire 1kg',
      brands: 'Mon Sire',
      market: 'AU',
    });
    const auCard = au.recs.find((r) => r.signal_id === 'SIG-SR-AU-008');
    expect(auCard).toBeTruthy();
    // Retailer / pack size / best-before stay on the card as qualification content.
    expect(auCard!.skeleton_card_copy?.why_display).toContain('Foodland Brighton');
    expect(au.recs.some((r) => r.signal_id === 'SIG-SR-NZ-006')).toBe(false);

    const nz = runScan({
      barcode: '9410000555556',
      productName: 'Mon Sire Brie 200g',
      brands: 'Mon Sire',
      market: 'NZ',
    });
    expect(nz.recs.map((r) => r.signal_id)).toContain('SIG-SR-NZ-006');
    expect(nz.recs.some((r) => r.signal_id === 'SIG-SR-AU-008')).toBe(false);
  });

  it("Vogel's recalled product line fires with or without the MPI pack size; unrelated loaf does not", () => {
    for (const productName of [
      "Vogel's Original Mixed Grain Toast 750g",
      "Vogel's Original Mixed Grain Toast",
    ]) {
      const hit = runScan({
        barcode: '9410000666666',
        productName,
        brands: "Vogel's",
        market: 'NZ',
      });
      expect(hit.recs.map((r) => r.signal_id)).toContain('SIG-SR-NZ-003-20260918');
    }

    const miss = runScan({
      barcode: '9410000666667',
      productName: "Vogel's Soy and Linseed 700g",
      brands: "Vogel's",
      market: 'NZ',
    });
    expect(miss.recs.some((r) => r.signal_id === 'SIG-SR-NZ-003-20260918')).toBe(false);
  });

  it('Result screen renders no Stage 2 batch/date markings entry', () => {
    const screen = fs.readFileSync(path.join(ROOT, 'app/result/[barcode].tsx'), 'utf8');
    expect(screen).not.toMatch(/FoodRecallMarkingsEntry/);
    expect(screen).not.toMatch(/food_recall_needs_batch_entry/);
  });

  it('ungoverned brand/product fails closed (no speculative Signal)', () => {
    const miss = runScan({
      barcode: '0000000000000',
      productName: 'Completely Unknown Widget 500g',
      brands: 'NoSuchBrandXYZ',
      market: 'AU',
    });
    expect(miss.recs.length).toBe(0);
  });

  it('resolver/matcher source has no Leggo/Chickadees/signal_id=== hardcoding and no productFamilyMaps under chaining', () => {
    const files = [
      path.join(ROOT, 'src/dynamicSignals/asset/v0.2/buildDynamicSignalsAssetRuntimePublicationRecords.ts'),
      path.join(ROOT, 'src/dynamicSignals/asset/v0.2/matchDynamicSignalsAsset.ts'),
      path.join(ROOT, 'src/dynamicSignals/productScope/signalProductScopeEvaluator.ts'),
      path.join(ROOT, 'src/identity/chaining/brandEntityHierarchyMaps.ts'),
    ];
    for (const f of files) {
      const src = fs.readFileSync(f, 'utf8');
      expect(src).not.toMatch(/if\s*\(\s*brand\s*==/i);
      expect(src).not.toMatch(/signal_id\s*===\s*['"]SIG-/);
      expect(src).not.toMatch(/Leggo|Chickadees|Hoyt|Mondelez/);
      expect(src).not.toMatch(/productFamilyMaps|productIdentityMaps/);
    }
    expect(fs.existsSync(path.join(ROOT, 'src/identity/chaining/productFamilyMaps.ts'))).toBe(false);
    expect(fs.existsSync(path.join(ROOT, 'src/identity/chaining/productIdentityMaps.ts'))).toBe(false);
  });

  it('production pack loads signal_target_product_criteria (not chaining product_* files)', () => {
    const pack = loadProductionPack();
    expect(pack.productScopeMaps.criteriaByTargetId.size).toBeGreaterThan(0);
    const criteriaPath = path.join(PACK, 'signal_target_product_criteria.csv');
    expect(fs.existsSync(criteriaPath)).toBe(true);
    expect(fs.existsSync(path.join(FAM, 'product_families.csv'))).toBe(false);
    // buildAssetPackFromCsvRows shape: only signalTargetProductCriteria
    const rebuilt = buildAssetPackFromCsvRows({
      sources: readCsvFile(path.join(PACK, 'source_universe.csv')),
      signals: readCsvFile(path.join(PACK, 'signals.csv')),
      targets: readCsvFile(path.join(PACK, 'signal_targets.csv')),
      signalTargetProductCriteria: readCsvFile(criteriaPath),
      brandChildOfBrand: readCsvFile(path.join(FAM, 'brand_child_of_brand.csv')),
      entityChildOfEntity: readCsvFile(path.join(FAM, 'entity_child_of_entity.csv')),
      foodRecallEligibility: [],
      foodRecallNotices: [],
      foodRecallAffectedVariants: [],
      foodRecallRelatedGtins: [],
    });
    expect(rebuilt.productScopeMaps.criteriaByTargetId.size).toBe(
      pack.productScopeMaps.criteriaByTargetId.size
    );
  });
});
