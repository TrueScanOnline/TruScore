/**
 * Ordinary-scan corpus reassessment after Chaining/Signals boundary restore.
 * Chaining resolves brand/parent only; product scope is Workstream C criteria.
 */
import fs from 'fs';
import path from 'path';
import { parseCsv } from '../src/identity/workstreamA/csv';
import { buildAssetPackFromCsvRows } from '../src/dynamicSignals/asset/v0.2/loadDynamicSignalsAssetPack';
import { buildDynamicSignalsAssetRuntimePublicationRecords } from '../src/dynamicSignals/asset/v0.2/buildDynamicSignalsAssetRuntimePublicationRecords';
import type { Product } from '../src/types/product';

const ROOT = path.resolve(__dirname, '..');
const PACK = path.join(ROOT, 'workstreamC', 'c-data', 'dynamic-signals-v0.3', 'input');
const FAM = path.join(ROOT, 'workstreamA', 'a-data', 'chaining-extensions', 'v0.3');
const A = path.join(ROOT, 'workstreamA', 'a-data', 'wave1-v0.16', 'input');
const CLOCK = '2026-09-18T12:00:00.000Z';

function read(p: string) {
  return fs.existsSync(p) ? parseCsv(fs.readFileSync(p, 'utf8')) : [];
}

function loadPack() {
  return buildAssetPackFromCsvRows({
    sources: read(path.join(PACK, 'source_universe.csv')),
    signals: read(path.join(PACK, 'signals.csv')),
    targets: read(path.join(PACK, 'signal_targets.csv')),
    signalTargetProductCriteria: read(path.join(PACK, 'signal_target_product_criteria.csv')),
    brandChildOfBrand: read(path.join(FAM, 'brand_child_of_brand.csv')),
    entityChildOfEntity: read(path.join(FAM, 'entity_child_of_entity.csv')),
    foodRecallEligibility: read(path.join(PACK, 'food_recall_eligibility.csv')),
    foodRecallNotices: read(path.join(PACK, 'food_recall_notices.csv')),
    foodRecallAffectedVariants: read(path.join(PACK, 'food_recall_affected_variants.csv')),
    foodRecallRelatedGtins: read(path.join(PACK, 'food_recall_related_gtins.csv')),
  });
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

function brandNameById(brands: ReturnType<typeof read>, brandId: string): string {
  const row = brands.find((b) => (b.brand_id || '').trim() === brandId);
  return (row?.canonical_brand_name || '').trim();
}

function parentNameById(parents: ReturnType<typeof read>, parentId: string): string {
  const row = parents.find((p) => (p.parent_id || '').trim() === parentId);
  return (row?.canonical_parent_name || '').trim();
}

function pubState(sig: { signal_publication_state?: string; publication_state?: string }) {
  return String(sig.signal_publication_state || sig.publication_state || '').trim();
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

function main() {
  process.env.EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET = '1';
  process.env.EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH = '1';

  const pack = loadPack();
  const criteria = read(path.join(PACK, 'signal_target_product_criteria.csv'));
  const brands = [
    ...read(path.join(A, 'canonical_brands.csv')),
    ...read(path.join(FAM, 'canonical_brands_extension.csv')),
  ];
  const parents = [
    ...read(path.join(A, 'canonical_parents.csv')),
    ...read(path.join(FAM, 'canonical_parents_extension.csv')),
  ];

  const results: Array<Record<string, string>> = [];

  for (const sig of pack.signals) {
    const sid = sig.signal_id;
    const state = pubState(sig as any);
    const tgts = pack.targets.filter((t) => t.signal_id === sid);
    const resolvedTgts = tgts.filter(
      (t) => t.resolution_status === 'resolved' || t.resolution_status === 'resolved_with_warning'
    );

    const preferred =
      resolvedTgts.find((t) => t.target_type === 'product') ||
      resolvedTgts.find((t) => t.target_type === 'product_family') ||
      resolvedTgts.find((t) => t.target_type === 'brand') ||
      resolvedTgts[0];

    let productName = '';
    let brandsField = '';
    let market: 'AU' | 'NZ' = 'AU';
    let categories_tags: string[] | undefined;
    let ingredients_text: string | undefined;
    let note = '';

    if (preferred) {
      const type = (preferred.target_type || '').trim();
      const tid = (preferred.signal_target_id || '').trim();
      const marketRaw = String(preferred.market_key || 'AU');
      market = marketRaw === 'NZ' || (marketRaw.includes('NZ') && !marketRaw.includes('AU')) ? 'NZ' : 'AU';

      if (type === 'product' || type === 'product_family') {
        const crits = criteria.filter(
          (c) => c.signal_target_id === tid && (c.review_state || '') === 'reviewed'
        );
        const best = [...crits].sort(
          (a, b) => (b.match_value || '').length - (a.match_value || '').length
        )[0];
        if (best) {
          const brand = brandNameById(brands, (best.required_brand_id || '').trim());
          brandsField = brand;
          const phrase = best.match_value || '';
          productName =
            brand && !phrase.toLowerCase().includes(brand.toLowerCase().replace(/'s$/, ''))
              ? `${brand} ${phrase}`
              : phrase;
          if ((best.market_key || '') === 'NZ') market = 'NZ';
          if ((best.market_key || '') === 'AU') market = 'AU';
          note = `from criteria ${best.criterion_id}`;
        } else {
          productName = preferred.target_label || tid;
          note = 'no reviewed product-scope criteria — expect fail closed';
        }
      } else if (type === 'brand') {
        brandsField = brandNameById(brands, (preferred.canonical_target_id || '').trim());
        const guard = (preferred.product_scope_guard || '').trim();
        if (guard === 'cocoa_chocolate') {
          productName = `${brandsField || 'Brand'} Milk Chocolate`;
          categories_tags = ['en:chocolates'];
          ingredients_text = 'milk, sugar, cocoa';
          note = 'brand target with cocoa_chocolate guard evidence';
        } else {
          productName = `${brandsField || preferred.canonical_target_id} Product`;
          note = 'brand target';
        }
      } else if (type === 'entity' || type === 'parent') {
        const canon = (preferred.canonical_target_id || '').trim();
        const guard = (preferred.product_scope_guard || '').trim();
        if (canon === 'P0009' || canon === 'P0008' || guard === 'cocoa_chocolate') {
          brandsField = 'Cadbury';
          productName = 'Cadbury Dairy Milk Milk Chocolate';
          categories_tags = ['en:chocolates'];
          ingredients_text = 'milk, sugar, cocoa';
          note = `entity ${canon} via Cadbury descendant (cocoa evidence)`;
        } else if (canon === 'P0002') {
          brandsField = 'Coles';
          productName = 'Coles Brand Product';
          note = `entity ${canon}`;
        } else {
          const child = brands.find((b) => (b.parent_id || '').trim() === canon);
          brandsField = (child?.canonical_brand_name || parentNameById(parents, canon) || '').trim();
          productName = `${brandsField || canon} Product`;
          note = `entity ${canon}`;
        }
      }
    }

    const logs: string[] = [];
    let fired = false;
    let identityLog = '';
    let matchState = '';
    if (productName) {
      const barcode = `93${String(Math.abs(hash(sid)) % 1e10).padStart(10, '0')}`;
      const recs = buildDynamicSignalsAssetRuntimePublicationRecords({
        barcode,
        productName,
        product: product({
          barcode,
          product_name: productName,
          brands: brandsField,
          categories_tags,
          ingredients_text,
        }),
        scanMarketPublic: market,
        pack,
        forceRun: true,
        evaluationClockIso: CLOCK,
        logLines: logs,
      });
      const hit = recs.find((r) => r.signal_id === sid);
      fired = !!hit;
      matchState = hit?.food_recall?.match_state || '';
      identityLog = logs.find((l) => l.startsWith('identity_resolve:')) || '';
    }

    let status: 'works_ordinary_scan' | 'held' = fired ? 'works_ordinary_scan' : 'held';
    let holdReason = '';
    if (!fired) {
      if (!preferred) {
        holdReason = 'No resolved target';
      } else if (
        (preferred.target_type === 'product' || preferred.target_type === 'product_family') &&
        !criteria.some(
          (c) =>
            c.signal_target_id === preferred.signal_target_id && (c.review_state || '') === 'reviewed'
        )
      ) {
        holdReason = `No reviewed Workstream C product-scope criteria for target ${preferred.signal_target_id} (${preferred.target_label}). Ordinary scan cannot establish product scope — fail closed. ${note}`;
      } else if (!identityLog || identityLog.includes('brand=(none)')) {
        holdReason = `Brand/parent chain did not resolve from scan brands="${brandsField}" product="${productName}". ${note}`;
      } else if (state && state !== 'publishable') {
        holdReason = `Identity capable (${identityLog}) but signal_publication_state=${state}. ${note}`;
      } else {
        holdReason = `Identity present (${identityLog}) but Signal did not publish. state=${state || '(empty)'}. ${note}`;
      }
    }

    results.push({
      signal_id: sid,
      publication_state: state,
      signal_class: String(sig.signal_class || ''),
      status,
      hold_reason: holdReason,
      fixture_product: productName,
      fixture_brands: brandsField,
      fixture_market: market,
      identity_log: identityLog,
      match_state: matchState,
    });
  }

  const works = results.filter((r) => r.status === 'works_ordinary_scan');
  const held = results.filter((r) => r.status === 'held');
  const publishable = results.filter((r) => r.publication_state === 'publishable');
  const publishableWorks = publishable.filter((r) => r.status === 'works_ordinary_scan');
  const publishableHeld = publishable.filter((r) => r.status === 'held');

  const out = {
    generated_at: new Date().toISOString(),
    clock: CLOCK,
    architecture: 'chaining_brand_only_plus_workstream_c_product_scope',
    total_signals: results.length,
    works_ordinary_scan: works.length,
    held: held.length,
    publishable_total: publishable.length,
    publishable_works_ordinary_scan: publishableWorks.length,
    publishable_held: publishableHeld.length,
    works_ids: works.map((r) => r.signal_id),
    held_ids: held.map((r) => r.signal_id),
    publishable_works_ids: publishableWorks.map((r) => r.signal_id),
    publishable_held_ids: publishableHeld.map((r) => r.signal_id),
    publishable_held_details: publishableHeld.map((r) => ({
      signal_id: r.signal_id,
      hold_reason: r.hold_reason,
      fixture_product: r.fixture_product,
      identity_log: r.identity_log,
    })),
    results,
  };
  const outPath = path.join(
    ROOT,
    'reports',
    'CHAINING_BOUNDARY_ORDINARY_SCAN_CORPUS_20260921.json'
  );
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(
    JSON.stringify(
      {
        works: out.works_ordinary_scan,
        held: out.held,
        publishable_works: out.publishable_works_ordinary_scan,
        publishable_held: out.publishable_held,
        publishable_works_ids: out.publishable_works_ids,
        publishable_held_details: out.publishable_held_details,
      },
      null,
      2
    )
  );
  console.log('wrote', outPath);
}

main();
