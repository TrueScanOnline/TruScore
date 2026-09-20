/**
 * Ordinary-scan corpus reassessment for Dynamic Signals identity correction.
 * Starts from product name/brand/market only — does not inject family/product IDs.
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
    productFamilies: read(path.join(FAM, 'product_families.csv')),
    productFamilyMembership: read(path.join(FAM, 'product_family_membership.csv')),
    productFamilyAliases: read(path.join(FAM, 'product_family_aliases.csv')),
    productIdentities: read(path.join(FAM, 'product_identities.csv')),
    productIdentityAliases: read(path.join(FAM, 'product_identity_aliases.csv')),
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

type Fixture = {
  barcode: string;
  productName: string;
  brands: string;
  market: 'AU' | 'NZ';
  categories_tags?: string[];
  ingredients_text?: string;
  note: string;
};

function brandNameById(
  brands: ReturnType<typeof read>,
  brandId: string
): string {
  const row = brands.find((b) => (b.brand_id || '').trim() === brandId);
  return (row?.canonical_brand_name || row?.brand_name || '').trim();
}

function parentNameById(
  parents: ReturnType<typeof read>,
  parentId: string
): string {
  const row = parents.find((p) => (p.parent_id || '').trim() === parentId);
  return (row?.canonical_parent_name || row?.parent_name || '').trim();
}

function fixtureForTarget(
  target: {
    target_type?: string;
    canonical_target_id?: string;
    market?: string;
    market_key?: string;
    propagation_mode?: string;
  },
  ctx: {
    families: ReturnType<typeof read>;
    familyAliases: ReturnType<typeof read>;
    identities: ReturnType<typeof read>;
    identityAliases: ReturnType<typeof read>;
    brands: ReturnType<typeof read>;
    parents: ReturnType<typeof read>;
  }
): Fixture | null {
  const canon = (target.canonical_target_id || '').trim();
  if (!canon) return null;
  const marketRaw = String(target.market || target.market_key || 'AU');
  const market: 'AU' | 'NZ' = marketRaw.includes('NZ') && !marketRaw.includes('AU') ? 'NZ' : marketRaw.includes('NZ') ? 'NZ' : 'AU';
  // Prefer NZ when market_key is NZ-only
  const marketFinal: 'AU' | 'NZ' =
    marketRaw === 'NZ' ? 'NZ' : marketRaw === 'AU' ? 'AU' : marketRaw.includes('NZ') && !marketRaw.startsWith('AU') ? 'NZ' : 'AU';

  const type = (target.target_type || '').trim();

  if (type === 'product' || canon.startsWith('PI_')) {
    const ident = ctx.identities.find((r) => r.product_identity_id === canon);
    if (!ident) return null;
    const aliases = ctx.identityAliases.filter((a) => a.product_identity_id === canon);
    // Prefer longest alias phrase so phrase_contains is discriminative
    const alias = [...aliases].sort(
      (a, b) => (b.alias_text || '').length - (a.alias_text || '').length
    )[0];
    const brand =
      brandNameById(ctx.brands, (ident.anchor_brand_id || '').trim()) ||
      (ident.display_name || '').split(' ')[0] ||
      '';
    const productName = alias?.alias_text || ident.display_name || '';
    // Ensure brand appears in product name for brand-leading retail titles when needed
    const finalName =
      brand && !productName.toLowerCase().includes(brand.toLowerCase().replace(/'s$/, ''))
        ? `${brand} ${productName}`
        : productName;
    return {
      barcode: `93${String(Math.abs(hash(canon)) % 1e10).padStart(10, '0')}`,
      productName: finalName,
      brands: brand,
      market: ((ident.market_key || marketFinal) as string).includes('NZ') && !(ident.market_key || '').includes('AU')
        ? 'NZ'
        : ((ident.market_key || '') === 'AU' ? 'AU' : marketFinal),
      note: `from PI ${canon} alias="${alias?.alias_text || ''}"`,
    };
  }

  if (type === 'product_family' || canon.startsWith('PF_')) {
    const fam = ctx.families.find((r) => r.product_family_id === canon);
    if (!fam) return null;
    const aliases = ctx.familyAliases.filter((a) => a.product_family_id === canon);
    const alias = [...aliases].sort(
      (a, b) => (b.alias_text || '').length - (a.alias_text || '').length
    )[0];
    const brand = brandNameById(ctx.brands, (fam.anchor_brand_id || '').trim());
    const phrase = alias?.alias_text || fam.display_name || '';
    const productName = brand ? `${brand} ${phrase}` : phrase;
    const mk = fam.market_key || marketFinal;
    return {
      barcode: `93${String(Math.abs(hash(canon)) % 1e10).padStart(10, '0')}`,
      productName,
      brands: brand,
      market: mk === 'NZ' ? 'NZ' : 'AU',
      note: `from PF ${canon} alias="${alias?.alias_text || ''}"`,
    };
  }

  if (type === 'brand') {
    const brand = brandNameById(ctx.brands, canon);
    if (!brand) return null;
    return {
      barcode: `93${String(Math.abs(hash(canon)) % 1e10).padStart(10, '0')}`,
      productName: `${brand} Product`,
      brands: brand,
      market: marketFinal,
      note: `from brand ${canon}`,
    };
  }

  if (type === 'parent' || type === 'entity') {
    const parent = parentNameById(ctx.parents, canon);
    // Entity Signals often fire via descendant brands (e.g. Cadbury under Mondelez P0009)
    if (canon === 'P0009' || canon === 'P0008' || /mondelez|nestl/i.test(parent)) {
      return {
        barcode: '9300617064879',
        productName: 'Cadbury Dairy Milk Milk Chocolate',
        brands: 'Cadbury',
        market: 'AU',
        categories_tags: ['en:chocolates'],
        ingredients_text: 'milk, sugar, cocoa',
        note: `from entity ${canon} via Cadbury/chocolate descendant context`,
      };
    }
    if (canon === 'P0002' || /coles/i.test(parent)) {
      return {
        barcode: `93${String(Math.abs(hash(canon)) % 1e10).padStart(10, '0')}`,
        productName: 'Coles Brand Product',
        brands: 'Coles',
        market: 'AU',
        note: `from entity ${canon} via Coles brand`,
      };
    }
    // Talley's — look for a reviewed brand under this parent
    const childBrand = ctx.brands.find((b) => (b.parent_id || '').trim() === canon);
    if (childBrand) {
      const bname = (childBrand.canonical_brand_name || '').trim();
      return {
        barcode: `93${String(Math.abs(hash(canon)) % 1e10).padStart(10, '0')}`,
        productName: `${bname} Product`,
        brands: bname,
        market: marketFinal,
        note: `from entity ${canon} via child brand ${childBrand.brand_id}`,
      };
    }
    return {
      barcode: `93${String(Math.abs(hash(canon)) % 1e10).padStart(10, '0')}`,
      productName: `${parent || canon} Product`,
      brands: parent || '',
      market: marketFinal,
      note: `from entity/parent ${canon}`,
    };
  }

  return null;
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

function pubState(sig: { signal_publication_state?: string; publication_state?: string }) {
  return String(sig.signal_publication_state || sig.publication_state || '').trim();
}

function main() {
  process.env.EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET = '1';
  process.env.EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH = '1';

  const pack = loadPack();
  const families = read(path.join(FAM, 'product_families.csv'));
  const familyAliases = read(path.join(FAM, 'product_family_aliases.csv'));
  const identities = read(path.join(FAM, 'product_identities.csv'));
  const identityAliases = read(path.join(FAM, 'product_identity_aliases.csv'));
  const brands = read(path.join(A, 'canonical_brands.csv'));
  const parents = read(path.join(A, 'canonical_parents.csv'));
  // Extension brands
  const brandExt = read(path.join(FAM, 'canonical_brands_extension.csv'));
  const parentExt = read(path.join(FAM, 'canonical_parents_extension.csv'));
  const allBrands = [...brands, ...brandExt];
  const allParents = [...parents, ...parentExt];

  const ctx = {
    families,
    familyAliases,
    identities,
    identityAliases,
    brands: allBrands,
    parents: allParents,
  };

  const results: Array<Record<string, string>> = [];

  for (const sig of pack.signals) {
    const sid = sig.signal_id;
    const state = pubState(sig as any);
    const tgts = pack.targets.filter((t) => t.signal_id === sid);
    const resolvedTgts = tgts.filter(
      (t) => t.resolution_status === 'resolved' && (t.canonical_target_id || '').trim()
    );

    // Prefer product/product_family targets for fixture selection; else first resolved
    const preferred =
      resolvedTgts.find((t) => t.target_type === 'product') ||
      resolvedTgts.find((t) => t.target_type === 'product_family') ||
      resolvedTgts.find((t) => t.target_type === 'brand') ||
      resolvedTgts[0];

    let fx: Fixture | null = preferred ? fixtureForTarget(preferred as any, ctx) : null;

    // Manual overrides only where auto fixture needs cocoa evidence or known retail title
    if (sid === 'SIG-IN-GL-001-20260918' || sid === 'SIG-IN-GL-002-20260918' || sid === 'SIG-IN-GL-001' || sid === 'SIG-IN-GL-002') {
      fx = {
        barcode: '9300617064879',
        productName: 'Cadbury Dairy Milk Milk Chocolate',
        brands: 'Cadbury',
        market: 'AU',
        categories_tags: ['en:chocolates'],
        ingredients_text: 'milk, sugar, cocoa',
        note: 'cocoa-guarded chocolate context',
      };
    }

    const logs: string[] = [];
    let fired = false;
    let identityLog = '';
    let matchState = '';

    if (fx) {
      const recs = buildDynamicSignalsAssetRuntimePublicationRecords({
        barcode: fx.barcode,
        productName: fx.productName,
        product: product({
          barcode: fx.barcode,
          product_name: fx.productName,
          brands: fx.brands,
          categories_tags: fx.categories_tags,
          ingredients_text: fx.ingredients_text,
        }),
        scanMarketPublic: fx.market,
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
      if (state && state !== 'publishable' && state !== 'candidate') {
        holdReason = `signal_publication_state=${state} (not publishable)`;
      } else if (resolvedTgts.length === 0) {
        holdReason =
          'No resolved target with canonical_target_id — missing governed identity binding on target row';
      } else if (!fx) {
        holdReason = `Could not derive ordinary-scan fixture from target type ${preferred?.target_type} / ${preferred?.canonical_target_id}`;
      } else if (!identityLog || identityLog.includes('brand=(none)')) {
        holdReason = `Brand/parent chain did not resolve from ordinary scan fields (brands="${fx.brands}" product="${fx.productName}"). Missing brand alias or canonical brand in A-data. ${fx.note}`;
      } else if (
        identityLog.includes('families=(none)') &&
        identityLog.includes('products=(none)') &&
        resolvedTgts.some((t) => t.target_type === 'product' || t.target_type === 'product_family')
      ) {
        holdReason = `Brand resolved but no product_family/product_identity alias matched scan name "${fx.productName}". Needed: ${resolvedTgts.map((t) => t.canonical_target_id).join(', ')}. ${fx.note}`;
      } else if (state === 'candidate' || state === 'held_for_review' || state === 'predecessor' || !state) {
        // Predecessors are expected held for public path; still report identity capability
        const idOk =
          (identityLog.includes('families=') && !identityLog.includes('families=(none)')) ||
          (identityLog.includes('products=') && !identityLog.includes('products=(none)'));
        if (idOk || (identityLog.includes('brand=') && !identityLog.includes('brand=(none)'))) {
          holdReason = `Identity path capable (${identityLog}) but signal_publication_state=${state || '(empty/candidate predecessor)'} — not public head. ${fx.note}`;
        } else {
          holdReason = `Did not publish. state=${state || '(empty)'}. ${identityLog}. Targets: ${resolvedTgts.map((t) => `${t.canonical_target_id}/${t.target_type}/${t.propagation_mode}`).join('; ')}. ${fx.note}`;
        }
      } else {
        holdReason = `Identity context present (${identityLog}) but Signal did not publish under publishable gate. Targets: ${resolvedTgts.map((t) => `${t.canonical_target_id}/${t.target_type}/${t.propagation_mode}`).join('; ')}. state=${state}. ${fx.note}`;
      }
    }

    results.push({
      signal_id: sid,
      publication_state: state,
      signal_class: String(sig.signal_class || ''),
      status,
      hold_reason: holdReason,
      fixture_product: fx?.productName || '',
      fixture_brands: fx?.brands || '',
      fixture_market: fx?.market || '',
      identity_log: identityLog,
      match_state: matchState,
      resolved_targets: resolvedTgts.map((t) => t.canonical_target_id).join('|'),
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
  const outPath = path.join(ROOT, 'reports', 'IDENTITY_CORRECTION_ORDINARY_SCAN_CORPUS_20260921.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(
    JSON.stringify(
      {
        total: out.total_signals,
        works: out.works_ordinary_scan,
        held: out.held,
        publishable_works: out.publishable_works_ordinary_scan,
        publishable_held: out.publishable_held,
        publishable_works_ids: out.publishable_works_ids,
        publishable_held_ids: out.publishable_held_ids,
        publishable_held_details: out.publishable_held_details,
      },
      null,
      2
    )
  );
  console.log('wrote', outPath);
}

main();
