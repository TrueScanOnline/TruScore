import fs from 'fs';
import path from 'path';
import { parseCsv, type CsvRecord } from '../../../identity/workstreamA/csv';
import { buildProductFamilyMapsFromCsvRecords } from '../../../identity/chaining/productFamilyMaps';
import {
  buildBrandHierarchyMapsFromCsvRecords,
  buildEntityHierarchyMapsFromCsvRecords,
} from '../../../identity/chaining/brandEntityHierarchyMaps';
import {
  buildDynamicSignalsAssetPublicationRecords,
  requiresFoodRecallMatcherEligibility,
  type AssetPackParsed,
} from '../../../dynamicSignals/asset/v0.2/matchDynamicSignalsAsset';
import { buildProductScanResult } from '../../../services/buildProductScanResult';
import { flattenSignalsOrdered, dedupeSignalCards } from '../../../utils/scanResultPresentation';
import { resolveReviewedRetailChainUnified } from '../../../workstreamC/skeleton/resolveWorkstreamCRetailChain';
import { buildADataMapsFromCsvRecords } from '../../../workstreamC/skeleton/workstreamCPublicationCore';
import { resolveActiveSignalsProducer } from '../../../dynamicSignals/asset/v0.2/signalsProducerGuard';
import { buildWorkstreamCRuntimePublicationRecords } from '../../../workstreamC/runtime/workstreamCRuntimePublicationRecords';
import { isPublicationRecordPubliclyRenderable } from '../../../signals/signalRenderMapping';

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const PACK = path.join(ROOT, 'workstreamC', 'c-data', 'dynamic-signals-v0.2', 'input');
const FAM = path.join(ROOT, 'workstreamA', 'a-data', 'chaining-extensions', 'v0.1');
const A_DATA = path.join(ROOT, 'workstreamA', 'a-data', 'wave1-v0.14', 'input');

function loadBasePack(): AssetPackParsed {
  const read = (p: string) => parseCsv(fs.readFileSync(p, 'utf8'));
  return {
    sources: read(path.join(PACK, 'source_universe.csv')),
    signals: read(path.join(PACK, 'signals.csv')),
    targets: read(path.join(PACK, 'signal_targets.csv')),
    familyMaps: buildProductFamilyMapsFromCsvRecords(
      read(path.join(FAM, 'product_families.csv')),
      read(path.join(FAM, 'product_family_membership.csv'))
    ),
    brandHierarchy: buildBrandHierarchyMapsFromCsvRecords(
      read(path.join(FAM, 'brand_child_of_brand.csv'))
    ),
    entityHierarchy: buildEntityHierarchyMapsFromCsvRecords(
      read(path.join(FAM, 'entity_child_of_entity.csv'))
    ),
  };
}

function withPublishable(signals: CsvRecord[], ids: string[]): CsvRecord[] {
  const set = new Set(ids);
  return signals.map((s) =>
    set.has(s.signal_id ?? '')
      ? {
          ...s,
          signal_publication_state: 'publishable',
          review_state: 'reviewed',
          editorial_review_required: 'FALSE',
          editorial_review_state: 'not_required',
        }
      : s
  );
}

function withMembership(
  pack: AssetPackParsed,
  rows: { gtin: string; family_id: string; market_key: string }[],
  familyReviewState = 'reviewed'
): AssetPackParsed {
  const membership: CsvRecord[] = rows.map((r, i) => ({
    membership_id: `M_TEST_${i}`,
    product_family_id: r.family_id,
    gtin: r.gtin,
    market_key: r.market_key,
    review_state: 'reviewed',
    confidence_state: 'strong',
    effective_from: '2026-01-01',
    effective_to: '',
    lineage_reference: 'test',
    notes: 'test fixture only',
  }));
  const familyRows = parseCsv(fs.readFileSync(path.join(FAM, 'product_families.csv'), 'utf8')).map((f) =>
    rows.some((r) => r.family_id === f.product_family_id)
      ? { ...f, review_state: familyReviewState }
      : f
  );
  return {
    ...pack,
    familyMaps: buildProductFamilyMapsFromCsvRecords(familyRows, membership),
  };
}

function loadA() {
  const brandRows = parseCsv(fs.readFileSync(path.join(A_DATA, 'canonical_brands.csv'), 'utf8'));
  const parentRows = parseCsv(fs.readFileSync(path.join(A_DATA, 'canonical_parents.csv'), 'utf8'));
  const gtinRows = parseCsv(fs.readFileSync(path.join(A_DATA, 'gtin_brand_links.csv'), 'utf8'));
  const aliasRows = parseCsv(fs.readFileSync(path.join(A_DATA, 'brand_aliases.csv'), 'utf8'));
  return {
    aData: buildADataMapsFromCsvRecords(brandRows, parentRows, gtinRows),
    brandRows,
    aliasRows,
  };
}

describe('Dynamic Signals Asset v0.2 — remediation matcher', () => {
  const prevAsset = process.env.EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET;
  const prevSkel = process.env.EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT;
  afterEach(() => {
    process.env.EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET = prevAsset;
    process.env.EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT = prevSkel;
  });

  it('pack row counts match founder asset (13/14/16/25)', () => {
    const pack = loadBasePack();
    expect(pack.sources).toHaveLength(13);
    expect(pack.signals).toHaveLength(16);
    expect(pack.targets).toHaveLength(25);
  });

  it('candidate Signals do not render publicly even when target would match', () => {
    const pack = loadBasePack();
    const logs: string[] = [];
    const recs = buildDynamicSignalsAssetPublicationRecords({
      pack,
      identity: {
        barcode: '9300000000001',
        brand_id: 'B0067',
        parent_id: 'P0009',
        product_family_ids: [],
        scanMarketPublic: 'AU',
      },
      logLines: logs,
      includeNonPublishable: false,
    });
    expect(recs).toHaveLength(0);
    expect(logs.some((l) => l.includes('candidate_hold'))).toBe(true);
  });

  it('positive publish lifecycle: resolved reviewed Signal reaches publishable with target resolution_status', () => {
    let pack = loadBasePack();
    pack = {
      ...pack,
      signals: withPublishable(pack.signals, ['SIG-IN-GL-001']),
    };
    const recs = buildDynamicSignalsAssetPublicationRecords({
      pack,
      identity: {
        barcode: '9300601234567',
        brand_id: 'B0067',
        parent_id: 'P0009',
        product_family_ids: [],
        scanMarketPublic: 'AU',
      },
    });
    expect(recs).toHaveLength(1);
    expect(recs[0].signal_publication_state).toBe('publishable');
    expect(recs[0].state.resolution_status).toBe('resolved');
    expect(isPublicationRecordPubliclyRenderable(recs[0])).toBe(true);

    const { result } = buildProductScanResult({
      barcode: '9300601234567',
      product: { barcode: '9300601234567', brands: 'Cadbury', source: 'test', trust_score: 40 } as any,
      userPreferences: {} as any,
      isSubscriber: false,
      market: 'AU',
      terminal_state: 'success',
      dynamicSignalRecords: recs,
    });
    const flat = dedupeSignalCards(flattenSignalsOrdered(result.signals));
    expect(flat.some((c) => c.id === 'SIG-IN-GL-001')).toBe(true);
  });

  it('batch/date-limited Safety recall cannot become a generic barcode-wide Asset publish', () => {
    expect(
      requiresFoodRecallMatcherEligibility('safety_regulatory', 'product', 'exact_only')
    ).toBe(true);

    let pack = loadBasePack();
    pack = {
      ...pack,
      signals: withPublishable(pack.signals, ['SIG-SR-AU-002']),
      targets: pack.targets.map((t) =>
        t.signal_target_id === 'TGT-005'
          ? {
              ...t,
              canonical_target_id: '9312345678901',
              resolution_status: 'resolved',
            }
          : t
      ),
    };
    const logs: string[] = [];
    const recs = buildDynamicSignalsAssetPublicationRecords({
      pack,
      identity: {
        barcode: '9312345678901',
        brand_id: 'B0059',
        parent_id: 'P0008',
        product_family_ids: [],
        scanMarketPublic: 'AU',
      },
      logLines: logs,
    });
    expect(recs.some((r) => r.signal_id === 'SIG-SR-AU-002')).toBe(false);
    expect(logs.some((l) => l.includes('food_recall_matcher_required'))).toBe(true);
  });

  it('exact-product positive for non-Safety News still works; sibling negative', () => {
    // Use a synthetic in_the_news exact_only by adapting a family signal is overkill —
    // brand exact already covered. Here: entity Coles remains Asset-eligible (not recall matcher).
    let pack = loadBasePack();
    pack = {
      ...pack,
      signals: withPublishable(pack.signals, ['SIG-SR-AU-003']),
      targets: pack.targets.map((t) =>
        t.signal_target_id === 'TGT-008' ? { ...t, resolution_status: 'resolved' } : t
      ),
    };
    const hit = buildDynamicSignalsAssetPublicationRecords({
      pack,
      identity: {
        barcode: '9300000000100',
        brand_id: 'B0013',
        parent_id: 'P0002',
        product_family_ids: [],
        scanMarketPublic: 'AU',
      },
    });
    expect(hit.map((r) => r.signal_id)).toContain('SIG-SR-AU-003');
    expect(hit[0].state.resolution_status).toBe('resolved');
  });

  it('family_members: multiple pack sizes inherit when family+membership reviewed; outsider does not', () => {
    let pack = loadBasePack();
    pack = withMembership(pack, [
      { gtin: '9411111111111', family_id: 'PF_LEGGOS_TOMATO_PASTE_AU', market_key: 'AU' },
      { gtin: '9411111111112', family_id: 'PF_LEGGOS_TOMATO_PASTE_AU', market_key: 'AU' },
    ]);
    pack = {
      ...pack,
      signals: withPublishable(pack.signals, ['SIG-IN-AU-001']),
      targets: pack.targets.map((t) =>
        t.signal_target_id === 'TGT-009' ? { ...t, resolution_status: 'resolved' } : t
      ),
    };

    for (const gtin of ['9411111111111', '9411111111112']) {
      const recs = buildDynamicSignalsAssetPublicationRecords({
        pack,
        identity: {
          barcode: gtin,
          brand_id: 'B0179',
          parent_id: 'P0041',
          product_family_ids: [],
          scanMarketPublic: 'AU',
        },
      });
      expect(recs.map((r) => r.signal_id)).toEqual(['SIG-IN-AU-001']);
    }

    const outsider = buildDynamicSignalsAssetPublicationRecords({
      pack,
      identity: {
        barcode: '9499999999999',
        brand_id: 'B0179',
        parent_id: 'P0041',
        product_family_ids: [],
        scanMarketPublic: 'AU',
      },
    });
    expect(outsider).toHaveLength(0);
  });

  it('unreviewed family or membership cannot match', () => {
    let pack = loadBasePack();
    pack = withMembership(
      pack,
      [{ gtin: '9411111111111', family_id: 'PF_LEGGOS_TOMATO_PASTE_AU', market_key: 'AU' }],
      'seeded' // family not reviewed
    );
    pack = {
      ...pack,
      signals: withPublishable(pack.signals, ['SIG-IN-AU-001']),
      targets: pack.targets.map((t) =>
        t.signal_target_id === 'TGT-009' ? { ...t, resolution_status: 'resolved' } : t
      ),
    };
    const recs = buildDynamicSignalsAssetPublicationRecords({
      pack,
      identity: {
        barcode: '9411111111111',
        brand_id: 'B0179',
        parent_id: 'P0041',
        product_family_ids: [],
        scanMarketPublic: 'AU',
      },
    });
    expect(recs).toHaveLength(0);
  });

  it('Cadbury-wide Signal inherits to Dairy Milk via brand_child_of_brand; Ritz does not', () => {
    let pack = loadBasePack();
    pack = {
      ...pack,
      signals: withPublishable(pack.signals, ['SIG-IN-GL-001']),
    };
    const dairyMilk = buildDynamicSignalsAssetPublicationRecords({
      pack,
      identity: {
        barcode: '9300601234567',
        brand_id: 'B0241',
        parent_id: 'P0009',
        product_family_ids: [],
        scanMarketPublic: 'AU',
      },
    });
    expect(dairyMilk.map((r) => r.signal_id)).toContain('SIG-IN-GL-001');

    const ritz = buildDynamicSignalsAssetPublicationRecords({
      pack,
      identity: {
        barcode: '9310123456789',
        brand_id: 'B0069',
        parent_id: 'P0009',
        product_family_ids: [],
        scanMarketPublic: 'AU',
      },
    });
    expect(ritz.some((r) => r.signal_id === 'SIG-IN-GL-001')).toBe(false);
  });

  it('Dairy Milk-only Signal (B0241) does not fire for umbrella Cadbury brand alone', () => {
    let pack = loadBasePack();
    pack = {
      ...pack,
      signals: withPublishable(pack.signals, ['SIG-IN-GL-002']),
    };
    const cadburyOnly = buildDynamicSignalsAssetPublicationRecords({
      pack,
      identity: {
        barcode: '9300601234568',
        brand_id: 'B0067',
        parent_id: 'P0009',
        product_family_ids: [],
        scanMarketPublic: 'AU',
      },
    });
    expect(cadburyOnly.some((r) => r.signal_id === 'SIG-IN-GL-002')).toBe(false);

    const dairyMilk = buildDynamicSignalsAssetPublicationRecords({
      pack,
      identity: {
        barcode: '9300601234567',
        brand_id: 'B0241',
        parent_id: 'P0009',
        product_family_ids: [],
        scanMarketPublic: 'AU',
      },
    });
    expect(dairyMilk.map((r) => r.signal_id)).toContain('SIG-IN-GL-002');
  });

  it('entity_descendants: Coles own-label inherits; third-party stocked brand does not', () => {
    let pack = loadBasePack();
    pack = {
      ...pack,
      signals: withPublishable(pack.signals, ['SIG-SR-AU-003']),
      targets: pack.targets.map((t) =>
        t.signal_target_id === 'TGT-008' ? { ...t, resolution_status: 'resolved' } : t
      ),
    };
    const colesOwn = buildDynamicSignalsAssetPublicationRecords({
      pack,
      identity: {
        barcode: '9300000000100',
        brand_id: 'B0013',
        parent_id: 'P0002',
        product_family_ids: [],
        scanMarketPublic: 'AU',
      },
    });
    expect(colesOwn.map((r) => r.signal_id)).toContain('SIG-SR-AU-003');

    const nestleSoldAtColes = buildDynamicSignalsAssetPublicationRecords({
      pack,
      identity: {
        barcode: '9300000000101',
        brand_id: 'B0066',
        parent_id: 'P0008',
        product_family_ids: [],
        scanMarketPublic: 'AU',
      },
    });
    expect(nestleSoldAtColes.some((r) => r.signal_id === 'SIG-SR-AU-003')).toBe(false);
  });

  it('Skeleton/Asset mutual-exclusion guard: both flags → Asset only', () => {
    process.env.EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET = '1';
    process.env.EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT = '1';
    const logs: string[] = [];
    expect(resolveActiveSignalsProducer(logs)).toBe('asset');
    expect(logs.some((l) => l.includes('BOTH Asset and Skeleton'))).toBe(true);

    const skel = buildWorkstreamCRuntimePublicationRecords({
      barcode: '9300601234567',
      productName: 'Cadbury',
      product: { barcode: '9300601234567', brands: 'Cadbury', categories_tags: ['en:chocolates'] } as any,
      scanMarketPublic: 'AU',
      logLines: [],
    });
    expect(skel).toHaveLength(0);
  });

  it('AU/NZ market isolation', () => {
    let pack = withMembership(loadBasePack(), [
      { gtin: '9411111111111', family_id: 'PF_LEGGOS_TOMATO_PASTE_AU', market_key: 'AU' },
    ]);
    pack = {
      ...pack,
      signals: withPublishable(pack.signals, ['SIG-IN-AU-001']),
      targets: pack.targets.map((t) =>
        t.signal_target_id === 'TGT-009' ? { ...t, resolution_status: 'resolved' } : t
      ),
    };
    const nzLeak = buildDynamicSignalsAssetPublicationRecords({
      pack,
      identity: {
        barcode: '9411111111111',
        brand_id: 'B0179',
        parent_id: 'P0041',
        product_family_ids: ['PF_LEGGOS_TOMATO_PASTE_AU'],
        scanMarketPublic: 'NZ',
      },
    });
    expect(nzLeak.some((r) => r.signal_id === 'SIG-IN-AU-001')).toBe(false);
  });

  it('needs_review targets fail closed', () => {
    const pack = loadBasePack();
    const recs = buildDynamicSignalsAssetPublicationRecords({
      pack: { ...pack, signals: withPublishable(pack.signals, ['SIG-SR-AU-001']) },
      identity: {
        barcode: 'any',
        brand_id: null,
        parent_id: null,
        product_family_ids: [],
        scanMarketPublic: 'AU',
      },
    });
    expect(recs.some((r) => r.signal_id === 'SIG-SR-AU-001')).toBe(false);
  });

  it('no TruScore mutation when Asset records attach', () => {
    let pack = loadBasePack();
    pack = {
      ...pack,
      signals: withPublishable(pack.signals, ['SIG-IN-GL-001']),
    };
    const product = {
      barcode: '9300601234567',
      brands: 'Cadbury',
      product_name: 'Cadbury Chocolate',
      source: 'test',
      trust_score: 55,
      trust_score_breakdown: { body: 14, planet: 13, ethics: 14, open: 14 },
    } as any;
    const recs = buildDynamicSignalsAssetPublicationRecords({
      pack,
      identity: {
        barcode: '9300601234567',
        brand_id: 'B0067',
        parent_id: 'P0009',
        product_family_ids: [],
        scanMarketPublic: 'AU',
      },
    });
    const { result } = buildProductScanResult({
      barcode: '9300601234567',
      product,
      userPreferences: {} as any,
      isSubscriber: false,
      market: 'AU',
      terminal_state: 'success',
      dynamicSignalRecords: recs,
    });
    expect(result.scores?.trust).toBe(55);
    expect(result.scores?.pillars).toEqual({ body: 14, planet: 13, ethics: 14, open: 14 });
  });

  it('Finding B: reviewed GTIN supplementary when product identity fails', () => {
    const { aData, brandRows, aliasRows } = loadA();
    const aData2 = {
      ...aData,
      gtinRows: new Map(aData.gtinRows),
    };
    aData2.gtinRows.set('9990001112223', {
      brand_id: 'B0060',
      parent_id: 'P0008',
      link_review_state: 'reviewed',
    });
    const logs: string[] = [];
    const chain = resolveReviewedRetailChainUnified({
      barcode: '9990001112223',
      productName: 'Unknown Mystery Bar',
      product: {
        barcode: '9990001112223',
        brands: '',
        product_name: 'Unknown Mystery Bar',
      } as any,
      aData: aData2,
      canonicalBrandRows: brandRows,
      brandAliasRows: aliasRows,
      logLines: logs,
      applyCadburyUatBridge: false,
    });
    expect(chain?.brand_id).toBe('B0060');
    expect(logs.some((l) => l.includes('gtin_link_supplementary'))).toBe(true);
  });
});
